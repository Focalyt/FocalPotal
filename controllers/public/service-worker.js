self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('my-cache').then((cache) => {
      return cache.addAll([
        '/mipielogo.png', // Replace with the path to your website's icon
      ]);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((cacheName) => {
          return cacheName !== 'my-cache';
        }).map((cacheName) => {
          return caches.delete(cacheName);
        })
      );
    })
  );
});

self.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  // Customize the prompt and show it to the user
  // For example, you can create a button and attach an event listener to it
  const addToHomeButton = document.getElementById('add-to-home-button');
  addToHomeButton.style.display = 'block';

  addToHomeButton.addEventListener('click', () => {
    event.prompt();
    addToHomeButton.style.display = 'none';
  });
});
