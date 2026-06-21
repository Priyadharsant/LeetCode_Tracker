// Service Worker for Web Push Notifications

self.addEventListener('push', function(event) {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { body: event.data.text() };
    }
  }

  const title = data.title || 'Notification';
  const options = {
    body: data.body || 'You have a new message.',
    icon: data.icon || '/vite.svg',
    badge: data.badge || '/vite.svg',
    data: {
      url: self.registration.scope // Opens the root URL when clicked
    }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  // This looks to see if the current is already open and
  // focuses if it is
  event.waitUntil(
    clients.matchAll({
      type: "window"
    }).then(function(clientList) {
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if (client.url === event.notification.data.url && 'focus' in client)
          return client.focus();
      }
      if (clients.openWindow)
        return clients.openWindow(event.notification.data.url);
    })
  );
});
