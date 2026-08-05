# Security Specification and Test-Driven Development Plan

This document defines the zero-trust data invariants, security policies, and "Dirty Dozen" attack vectors used to harden the Firestore Security Rules for our ride-hailing application.

## 1. Data Invariants

- **User Access Rules**:
  - Any signed-in user can read another user's public profile (to view driver detail or passenger details during a ride).
  - Users can ONLY create or update their own user profile (`request.auth.uid == userId`).
  - A standard user CANNOT set their role to `'admin'`.
  - A user CANNOT self-approve their driver profile status. Only administrators can change `status` to `'approved'` or `'rejected'`.
  - All string sizes, particularly IDs, URLs, names, and phone numbers, must be tightly bounded to prevent Denial of Wallet resource attacks.

- **Status Rules**:
  - Any signed-in user can read statuses.
  - Users can ONLY create/delete statuses representing themselves (`request.auth.uid == resource.data.userId`).
  - Text contents are strictly validated and limited to 500 characters.

- **Ride Rules**:
  - A user can only create a ride with `passengerId` matching their verified `request.auth.uid` and initial status must be `'pending'`.
  - Once a ride is created, the `passengerId`, `fare`, `vehicleType`, `pickupLocation`, and `dropoffLocation` are completely immutable.
  - Approved drivers can view pending rides to accept them.
  - A driver can only accept a ride if its current status is `'pending'` and they set `driverId` to their own authenticated UID and status to `'accepted'`.
  - Only the assigned passenger or assigned driver can read details of an active ride.

- **Group Settings Rules**:
  - Any signed-in user can read groupSettings.
  - Only approved drivers can post broadcasts (updating `broadcastStatus`, `broadcastDriverName`, etc. using strict keys validation).
  - Only administrators can update the general `notice` and other global settings.

---

## 2. The "Dirty Dozen" Malicious Payloads

### Payload 1: Identity Spoofing on User Profile Creation
- **Objective**: Create a profile under a different UID.
- **Payload**: `setDoc(doc(db, 'users', 'victim_uid'), { id: 'victim_uid', name: 'Imposter', role: 'passenger', ... })` (as user `'attacker_uid'`)

### Payload 2: Privilege Escalation (Self-Admin Role Assignment)
- **Objective**: Standard passenger tries to write or update their profile to have `role: 'admin'`.
- **Payload**: `setDoc(doc(db, 'users', 'attacker_uid'), { role: 'admin', ... })` (as standard passenger)

### Payload 3: Privilege Escalation (Driver Self-Approval)
- **Objective**: Driver tries to mark their driver profile status as `'approved'` to bypass manual admin verification.
- **Payload**: `updateDoc(doc(db, 'users', 'driver_uid'), { status: 'approved' })` (as driver)

### Payload 4: ID Poisoning Attack on User Profiles
- **Objective**: Ingesting giant garbage keys into Document IDs to waste database indexing memory.
- **Payload**: Creating a document at `/users/REALLY_LONG_GARBAGE_STRING_REPEATED_TO_1MB`

### Payload 5: PII Data Leak (Unauthenticated Profile Read)
- **Objective**: Read a user's private data without signing in.
- **Query**: `getDoc(doc(db, 'users', 'any_uid'))` (as anonymous user)

### Payload 6: Identity Spoofing on Status Creation
- **Objective**: Post a status update purporting to be from Zainab Bibi or Ali Khan when authenticated as a completely different user.
- **Payload**: `addDoc(collection(db, 'statuses'), { userId: 'd-1', userName: 'Ali Khan', content: 'Spoof update', timestamp: 12345678 })` (as attacker)

### Payload 7: Resource Exhaustion (Oversized Status Payload)
- **Objective**: Attempting to post a massive status block (5MB) to blow up storage costs.
- **Payload**: `addDoc(collection(db, 'statuses'), { userId: 'my_uid', content: 'A'.repeat(100000), ... })`

### Payload 8: Ride Hijacking via passengerId Spoofing
- **Objective**: Creating a ride and charging it to another passenger's ID.
- **Payload**: `addDoc(collection(db, 'rides'), { passengerId: 'victim_uid', status: 'pending', fare: 500, ... })` (as attacker)

### Payload 9: Ride State Shortcutting
- **Objective**: Creating a ride that immediately starts in `'ongoing'` or `'completed'` state to bypass matching flows.
- **Payload**: `addDoc(collection(db, 'rides'), { passengerId: 'my_uid', status: 'completed', fare: 1000, ... })`

### Payload 10: Sibling Write Hijacking (Stealing Another Driver's Accepted Ride)
- **Objective**: Driver B attempts to overwrite Driver A's accepted ride details.
- **Payload**: `updateDoc(doc(db, 'rides', 'ride_123'), { driverId: 'driver_b_uid' })` (where ride's existing `driverId` is `'driver_a_uid'`)

### Payload 11: Passenger-Side Immutability Breach
- **Objective**: Passenger tries to change the fare of a ride after the driver has accepted it.
- **Payload**: `updateDoc(doc(db, 'rides', 'ride_123'), { fare: 50 })` (after creation)

### Payload 12: Unauthorized Group Broadcast Overwrite
- **Objective**: Standard passenger tries to broadcast traffic block messages or modify aggregate system stats.
- **Payload**: `updateDoc(doc(db, 'groupSettings', 'main'), { broadcastStatus: 'Hacked!' })` (as standard passenger)

---

## 3. The Test Runner: firestore.rules.test.ts

Below is a complete test specification template for verification of the rules:

```typescript
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, setDoc, getDoc, updateDoc, addDoc, collection } from 'firebase/firestore';

describe('Firestore Security Rules', () => {
  let testEnv: any;

  before(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'youthful-affinity-840ks',
      firestore: {
        rules: require('fs').readFileSync('firestore.rules', 'utf8'),
      },
    });
  });

  after(async () => {
    await testEnv.cleanup();
  });

  it('Payload 1: Should block Identity Spoofing on User Profile Creation', async () => {
    const context = testEnv.authenticatedContext('attacker_uid');
    const db = context.firestore();
    const docRef = doc(db, 'users', 'victim_uid');
    await assertFails(setDoc(docRef, { id: 'victim_uid', name: 'Imposter', role: 'passenger' }));
  });

  it('Payload 2: Should block Self-Admin Privilege Escalation', async () => {
    const context = testEnv.authenticatedContext('passenger_uid');
    const db = context.firestore();
    const docRef = doc(db, 'users', 'passenger_uid');
    await assertFails(setDoc(docRef, { id: 'passenger_uid', role: 'admin', name: 'Passenger' }));
  });

  it('Payload 3: Should block Driver Self-Approval', async () => {
    const context = testEnv.authenticatedContext('driver_uid');
    const db = context.firestore();
    const docRef = doc(db, 'users', 'driver_uid');
    await assertFails(updateDoc(docRef, { status: 'approved' }));
  });

  it('Payload 5: Should block Unauthenticated User Profile Read', async () => {
    const context = testEnv.unauthenticatedContext();
    const db = context.firestore();
    const docRef = doc(db, 'users', 'any_uid');
    await assertFails(getDoc(docRef));
  });

  it('Payload 6: Should block Identity Spoofing on Status Creation', async () => {
    const context = testEnv.authenticatedContext('attacker_uid');
    const db = context.firestore();
    const colRef = collection(db, 'statuses');
    await assertFails(addDoc(colRef, { userId: 'd-1', userName: 'Ali Khan', content: 'Spoof' }));
  });
});
```
