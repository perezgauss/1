'use client';

import { useEffect, useState } from 'react';

interface Subscription {
  id: string;
  device_info: string;
  created_at: string;
  active: boolean;
}

export default function AdminPanel() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadSubscriptions = async () => {
    try {
      const response = await fetch('/api/subscribe');
      const data = await response.json();
      setSubscriptions(data.subscriptions || []);
    } catch (error) {
      console.error('Error cargando suscripciones:', error);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadSubscriptions();
    }
  }, [isAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Autenticación simple - en producción usa algo más robusto
    const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123';
    if (password === adminPassword || password === 'admin123') {
      setIsAuthenticated(true);
      setMessage({ type: 'success', text: 'Autenticado correctamente' });
    } else {
      setMessage({ type: 'error', text: 'Contraseña incorrecta' });
    }
  };

  const handleToggleSubscription = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === subscriptions.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(subscriptions.map((s) => s.id));
    }
  };

  const handleSendNotification = async (toAll: boolean) => {
    if (!title || !body) {
      setMessage({ type: 'error', text: 'Título y cuerpo son requeridos' });
      return;
    }

    if (!toAll && selectedIds.length === 0) {
      setMessage({ type: 'error', text: 'Selecciona al menos una suscripción' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${password}`,
        },
        body: JSON.stringify({
          ids: toAll ? [] : selectedIds,
          title,
          body,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: 'success',
          text: `Notificación enviada: ${data.sent} exitosas, ${data.failed} fallidas`,
        });
        setTitle('');
        setBody('');
        setSelectedIds([]);
      } else {
        setMessage({ type: 'error', text: data.error || 'Error al enviar' });
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage({ type: 'error', text: 'Error al enviar notificación' });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen p-8 flex items-center justify-center bg-gray-100">
        <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
          <h1 className="text-3xl font-bold mb-6 text-gray-800">
            Panel de Administración
          </h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ingresa la contraseña"
              />
            </div>
            {message && (
              <div
                className={`p-3 rounded-lg ${
                  message.type === 'success'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {message.text}
              </div>
            )}
            <button
              type="submit"
              className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              Iniciar Sesión
            </button>
          </form>
          <div className="mt-6 text-center">
            <a href="/" className="text-blue-500 hover:text-blue-700 underline">
              ← Volver al inicio
            </a>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8 bg-gray-100">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">
              Panel de Administración
            </h1>
            <a href="/" className="text-blue-500 hover:text-blue-700 underline">
              ← Volver
            </a>
          </div>

          {message && (
            <div
              className={`p-4 rounded-lg mb-6 ${
                message.type === 'success'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {message.text}
            </div>
          )}

          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">
              Enviar Notificación
            </h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Título
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ej: Nuevo drop disponible"
                />
              </div>
              <div>
                <label htmlFor="body" className="block text-sm font-medium text-gray-700 mb-2">
                  Mensaje
                </label>
                <textarea
                  id="body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ej: Entrá ahora y obtené un 20% de descuento"
                />
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => handleSendNotification(true)}
                  disabled={isLoading}
                  className="flex-1 bg-green-500 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  📢 Enviar a Todos ({subscriptions.length})
                </button>
                <button
                  onClick={() => handleSendNotification(false)}
                  disabled={isLoading || selectedIds.length === 0}
                  className="flex-1 bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  📮 Enviar a Seleccionados ({selectedIds.length})
                </button>
              </div>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">
                Suscripciones Activas ({subscriptions.length})
              </h2>
              <button
                onClick={handleSelectAll}
                className="text-blue-500 hover:text-blue-700 font-medium"
              >
                {selectedIds.length === subscriptions.length ? 'Deseleccionar todo' : 'Seleccionar todo'}
              </button>
            </div>

            {subscriptions.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No hay suscripciones activas
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Seleccionar
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Dispositivo
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha de Registro
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {subscriptions.map((sub) => (
                      <tr key={sub.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(sub.id)}
                            onChange={() => handleToggleSubscription(sub.id)}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-4 py-4">
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {sub.id.substring(0, 8)}...
                          </code>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-700">
                          {sub.device_info ? (
                            <span className="truncate max-w-xs block">
                              {sub.device_info.substring(0, 50)}...
                            </span>
                          ) : (
                            'Desconocido'
                          )}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-700">
                          {new Date(sub.created_at).toLocaleString('es-AR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
