function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

class NotificationManager {
  static get isSupported() {
    return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
  }

  static get permission() {
    if (!this.isSupported) return 'denied';
    return Notification.permission;
  }

  static async requestPermission() {
    if (!this.isSupported) return 'denied';
    
    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'denied';
    }
  }

  static async registerServiceWorker() {
    if (!this.isSupported) return null;
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered with scope:', registration.scope);
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  }

  static async subscribeToPush(vapidPublicKey) {
    try {
      const registration = await this.registerServiceWorker();
      if (!registration) return null;

      // Ensure service worker is ready
      await navigator.serviceWorker.ready;

      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey
        });
      }
      return subscription;
    } catch (error) {
      console.error('Failed to subscribe to push service:', error);
      return null;
    }
  }

  static async unsubscribeFromPush() {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        return subscription;
      }
      return null;
    } catch (error) {
      console.error('Failed to unsubscribe:', error);
      return null;
    }
  }

  static async getSubscription() {
    try {
      if (!this.isSupported) return null;
      const registration = await navigator.serviceWorker.ready;
      return await registration.pushManager.getSubscription();
    } catch (error) {
      return null;
    }
  }

  static async sendTestNotification(title, options = {}) {
    if (!this.isSupported || this.permission !== 'granted') return null;
    try {
      const registration = await navigator.serviceWorker.ready;
      registration.showNotification(title, options);
    } catch (error) {
      console.error('Error showing test notification via SW:', error);
    }
  }
}

export default NotificationManager;
