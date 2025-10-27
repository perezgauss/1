// Utilidades para manejo de notificaciones push en el cliente

export const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Workers no están soportados en este navegador');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });
    console.log('Service Worker registrado:', registration);
    return registration;
  } catch (error) {
    console.error('Error registrando Service Worker:', error);
    return null;
  }
};

export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!('Notification' in window)) {
    console.warn('Las notificaciones no están soportadas en este navegador');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission;
  }

  return Notification.permission;
};

export const subscribeToPush = async (
  registration: ServiceWorkerRegistration,
  vapidPublicKey: string
): Promise<PushSubscription | null> => {
  try {
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });

    console.log('Suscripción push creada:', subscription);
    return subscription;
  } catch (error) {
    console.error('Error creando suscripción push:', error);
    return null;
  }
};

export const sendSubscriptionToBackend = async (
  subscription: PushSubscription
): Promise<{ id: string } | null> => {
  try {
    const subscriptionJson = subscription.toJSON();

    const response = await fetch('/api/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        endpoint: subscriptionJson.endpoint,
        keys: subscriptionJson.keys,
        device_info: navigator.userAgent,
      }),
    });

    if (!response.ok) {
      throw new Error('Error al enviar suscripción al backend');
    }

    const data = await response.json();
    console.log('Suscripción guardada con ID:', data.id);
    return data;
  } catch (error) {
    console.error('Error enviando suscripción:', error);
    return null;
  }
};

export const getSubscriptionId = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('push_subscription_id');
};

export const saveSubscriptionId = (id: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('push_subscription_id', id);
};

export const initializePushNotifications = async (): Promise<string | null> => {
  // 1. Registrar Service Worker
  const registration = await registerServiceWorker();
  if (!registration) return null;

  // 2. Solicitar permiso
  const permission = await requestNotificationPermission();
  if (permission !== 'granted') {
    console.log('Permiso de notificaciones denegado');
    return null;
  }

  // 3. Verificar si ya existe una suscripción
  const existingSubscription = await registration.pushManager.getSubscription();

  let subscription: PushSubscription | null = existingSubscription;

  // 4. Si no existe, crear una nueva
  if (!subscription) {
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
    subscription = await subscribeToPush(registration, vapidPublicKey);
  }

  if (!subscription) return null;

  // 5. Enviar al backend
  const result = await sendSubscriptionToBackend(subscription);

  if (result?.id) {
    saveSubscriptionId(result.id);
    return result.id;
  }

  return null;
};
