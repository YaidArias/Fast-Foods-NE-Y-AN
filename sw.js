// ============================================
// COMIDAS RÁPIDAS NE&AN - SERVICE WORKER v3
// Notificaciones push nativas (100% gratis)
// ============================================

const CACHE_NAME = 'nean-app-v3';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/css/style.css',
    '/js/app.js',
    '/manifest.json'
];

// ── Instalación ───────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(STATIC_ASSETS))
            .catch((err) => console.log('Cache failed:', err))
    );
    self.skipWaiting();
});

// ── Activación (limpia cachés viejos) ─────────────────────────────────────
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) =>
            Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            )
        )
    );
    self.clients.claim();
});

// ── Fetch (cache first) ───────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            if (response) return response;
            return fetch(event.request).catch(() => {
                if (event.request.destination === 'document') return caches.match('/index.html');
            });
        })
    );
});

// ── Recibir mensaje desde app.js para mostrar notificación ───────────────
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'NUEVO_PEDIDO') {
        const { orderId, customerName, items, total } = event.data.payload;

        const itemsResumen = items
            ? items.map(i => `${i.quantity}x ${i.name}`).join(', ')
            : 'Ver detalles';

        self.registration.showNotification(`🍔 Nuevo Pedido - ${orderId}`, {
            body: `${customerName} pidió: ${itemsResumen}\nTotal: $${Number(total).toLocaleString('es-CO')}`,
            icon: '/images/icon-192.png',
            badge: '/images/icon-96.png',
            tag: 'nuevo-pedido-' + orderId,
            renotify: true,
            requireInteraction: true,
            vibrate: [200, 100, 200, 100, 200],
            actions: [
                { action: 'ver', title: '👀 Ver pedido' },
                { action: 'cerrar', title: '✖ Cerrar' }
            ]
        });
    }
});

// ── Click en la notificación ──────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'cerrar') return;

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            for (const client of clientList) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    return client.focus();
                }
            }
            return clients.openWindow('/');
        })
    );
});
