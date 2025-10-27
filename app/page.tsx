'use client';

import { useEffect, useState } from 'react';
import {
  initializePushNotifications,
  getSubscriptionId,
} from '@/lib/push-notifications';

export default function Home() {
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);
  const [notificationStatus, setNotificationStatus] = useState<string>('checking');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Verificar si ya hay una suscripción guardada
    const savedId = getSubscriptionId();
    if (savedId) {
      setSubscriptionId(savedId);
      setNotificationStatus('granted');
    } else {
      checkNotificationPermission();
    }
  }, []);

  const checkNotificationPermission = () => {
    if (!('Notification' in window)) {
      setNotificationStatus('not-supported');
      return;
    }

    if (Notification.permission === 'granted') {
      setNotificationStatus('granted');
    } else if (Notification.permission === 'denied') {
      setNotificationStatus('denied');
    } else {
      setNotificationStatus('default');
    }
  };

  const handleEnableNotifications = async () => {
    setIsLoading(true);
    try {
      const id = await initializePushNotifications();
      if (id) {
        setSubscriptionId(id);
        setNotificationStatus('granted');
        alert('¡Notificaciones activadas exitosamente! Tu ID: ' + id);
      } else {
        alert('No se pudieron activar las notificaciones');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al activar notificaciones');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStatus = () => {
    switch (notificationStatus) {
      case 'not-supported':
        return (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            Tu navegador no soporta notificaciones push
          </div>
        );
      case 'denied':
        return (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
            Has bloqueado las notificaciones. Habilítalas en la configuración de tu navegador.
          </div>
        );
      case 'granted':
        return (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            <p className="font-bold">✓ Notificaciones activadas</p>
            {subscriptionId && (
              <p className="text-sm mt-2">
                Tu ID: <code className="bg-green-200 px-2 py-1 rounded">{subscriptionId}</code>
              </p>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <main className="min-h-screen p-8 max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-4xl font-bold mb-4 text-gray-800">
          PWA Push Notifications
        </h1>
        <p className="text-gray-600 mb-8">
          Sistema de notificaciones push anónimas con Supabase
        </p>

        <div className="mb-8">
          {renderStatus()}
        </div>

        {notificationStatus === 'default' && (
          <button
            onClick={handleEnableNotifications}
            disabled={isLoading}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Activando...' : '🔔 Activar Notificaciones'}
          </button>
        )}

        <div className="mt-12 p-6 bg-gray-50 rounded-lg">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">
            ¿Cómo funciona?
          </h2>
          <ul className="space-y-3 text-gray-700">
            <li className="flex items-start">
              <span className="mr-2">1️⃣</span>
              <span>Activas las notificaciones con el botón de arriba</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">2️⃣</span>
              <span>Se genera un ID único anónimo para tu dispositivo</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">3️⃣</span>
              <span>Los administradores pueden enviarte notificaciones desde el panel /admin</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">4️⃣</span>
              <span>Recibirás notificaciones incluso con la app cerrada</span>
            </li>
          </ul>
        </div>

        <div className="mt-8 text-center">
          <a
            href="/admin"
            className="text-blue-500 hover:text-blue-700 underline"
          >
            Panel de Administración →
          </a>
        </div>
      </div>
    </main>
  );
}
