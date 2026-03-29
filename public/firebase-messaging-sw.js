importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyC_kY4zDYsOP-_7upwt-uEWT6FBkgs9TBM',
  authDomain: 'tenantswap1.firebaseapp.com',
  projectId: 'tenantswap1',
  storageBucket: 'tenantswap1.firebasestorage.app',
  messagingSenderId: '513059459056',
  appId: '1:513059459056:web:463be627bfbf8231689735',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification ?? {};
  if (!title) return;

  self.registration.showNotification(title, {
    body: body ?? '',
    icon: '/assets/TenantSwap Logo.png',
    badge: '/assets/TenantSwap Logo Monochrome.png',
    data: payload.data ?? {},
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('/dashboard') && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/dashboard');
      }
    }),
  );
});
