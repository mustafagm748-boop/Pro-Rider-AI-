// Web Push & Local Notification Dispatcher for Remax Pro Rider AI

export class NotificationService {
  private hasPermission = false;

  constructor() {
    if ('Notification' in window) {
      this.hasPermission = Notification.permission === 'granted';
    }
  }

  public async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('Web Push Notifications not supported in this browser.');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      this.hasPermission = permission === 'granted';
      return this.hasPermission;
    } catch (e) {
      console.error('Error requesting notification permission:', e);
      return false;
    }
  }

  public sendPushNotification(title: string, options?: NotificationOptions): Notification | null {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      // Auto request permission if possible
      this.requestPermission();
      return null;
    }

    try {
      const notif = new Notification(title, {
        icon: '/logo.png',
        badge: '/logo.png',
        tag: 'pro-rider-ride-status',
        ...options
      });

      notif.onclick = () => {
        window.focus();
        notif.close();
      };

      return notif;
    } catch (e) {
      console.error('Failed to trigger push notification:', e);
      return null;
    }
  }
}

export const pushNotificationService = new NotificationService();
