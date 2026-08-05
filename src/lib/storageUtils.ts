/**
 * Utility for safe localStorage access with error handling and quota management.
 */

export const safeLocalStorage = {
  setItem: (key: string, value: string): boolean => {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (e) {
      if (e instanceof DOMException && (
        e.code === 22 || // Everything except Firefox
        e.code === 1014 || // Firefox
        e.name === 'QuotaExceededError' ||
        e.name === 'NS_ERROR_DOM_QUOTA_REACHED'
      )) {
        console.warn('LocalStorage quota exceeded. Attempting to clear non-essential data...');
        
        // Strategy 1: Clear non-essential items first
        const nonEssentialKeys = [
          'pro_rider_notifications',
          'pro_rider_wallet_transactions',
          'prorider_vehicle_fares'
        ];
        
        nonEssentialKeys.forEach(k => localStorage.removeItem(k));
        
        // Strategy 2: If still failing, try setting it again after clearing
        try {
          localStorage.setItem(key, value);
          return true;
        } catch (retryError) {
          console.error('LocalStorage critical failure: Quota still exceeded after cleanup.', retryError);
          return false;
        }
      }
      console.error('LocalStorage unknown error:', e);
      return false;
    }
  },

  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.error('LocalStorage read error:', e);
      return null;
    }
  },

  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error('LocalStorage remove error:', e);
    }
  },

  /**
   * Storing profile data without heavy base64 strings to save space.
   */
  saveCompactProfile: (user: any): boolean => {
    if (!user) return false;
    
    // Create a copy and remove heavy document strings
    const compactUser = { ...user };
    const heavyFields = [
      'idCardFrontUrl',
      'idCardBackUrl',
      'licenseFrontUrl',
      'licenseBackUrl',
      'vehicleFrontUrl',
      'vehicleBackUrl',
      'vehicleBookFrontUrl',
      'vehicleBookBackUrl'
    ];
    
    heavyFields.forEach(field => {
      if (compactUser[field] && typeof compactUser[field] === 'string' && compactUser[field].length > 1000) {
        compactUser[field] = '[REMOVED_FOR_STORAGE]';
      }
    });

    return safeLocalStorage.setItem('pro_rider_user', JSON.stringify(compactUser));
  }
};
