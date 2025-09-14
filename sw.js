// TodoFlow Service Worker
// Provides offline functionality and caching for the PWA

const CACHE_NAME = 'todoflow-v1.0.0';
const STATIC_CACHE_NAME = 'todoflow-static-v1.0.0';
const DYNAMIC_CACHE_NAME = 'todoflow-dynamic-v1.0.0';

// Files to cache for offline functionality
const STATIC_FILES = [
    '/',
    '/index.html',
    '/styles.css',
    '/script.js',
    '/manifest.json',
    // Add any other static assets here
];

// Install event - cache static files
self.addEventListener('install', (event) => {
    console.log('Service Worker: Installing...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE_NAME)
            .then((cache) => {
                console.log('Service Worker: Caching static files');
                return cache.addAll(STATIC_FILES);
            })
            .then(() => {
                console.log('Service Worker: Static files cached successfully');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('Service Worker: Failed to cache static files', error);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activating...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== STATIC_CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME) {
                            console.log('Service Worker: Deleting old cache', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('Service Worker: Activated successfully');
                return self.clients.claim();
            })
    );
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }
    
    // Skip chrome-extension and other non-http requests
    if (!url.protocol.startsWith('http')) {
        return;
    }
    
    event.respondWith(
        caches.match(request)
            .then((cachedResponse) => {
                // Return cached version if available
                if (cachedResponse) {
                    console.log('Service Worker: Serving from cache', request.url);
                    return cachedResponse;
                }
                
                // Otherwise, fetch from network
                return fetch(request)
                    .then((networkResponse) => {
                        // Don't cache non-successful responses
                        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                            return networkResponse;
                        }
                        
                        // Clone the response for caching
                        const responseToCache = networkResponse.clone();
                        
                        // Cache dynamic content
                        caches.open(DYNAMIC_CACHE_NAME)
                            .then((cache) => {
                                cache.put(request, responseToCache);
                            });
                        
                        return networkResponse;
                    })
                    .catch((error) => {
                        console.log('Service Worker: Network request failed', request.url, error);
                        
                        // Return offline page for navigation requests
                        if (request.mode === 'navigate') {
                            return caches.match('/index.html');
                        }
                        
                        // Return a generic offline response for other requests
                        return new Response('Offline content not available', {
                            status: 503,
                            statusText: 'Service Unavailable',
                            headers: new Headers({
                                'Content-Type': 'text/plain'
                            })
                        });
                    });
            })
    );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
    console.log('Service Worker: Background sync triggered', event.tag);
    
    if (event.tag === 'todo-sync') {
        event.waitUntil(
            syncTodos()
        );
    }
});

// Push notifications (for future enhancement)
self.addEventListener('push', (event) => {
    console.log('Service Worker: Push notification received');
    
    const options = {
        body: event.data ? event.data.text() : 'You have a new notification',
        icon: '/icon-192.png',
        badge: '/icon-96.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'explore',
                title: 'Open TodoFlow',
                icon: '/icon-96.png'
            },
            {
                action: 'close',
                title: 'Close',
                icon: '/icon-96.png'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification('TodoFlow', options)
    );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
    console.log('Service Worker: Notification clicked', event.action);
    
    event.notification.close();
    
    if (event.action === 'explore') {
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

// Message handler for communication with main thread
self.addEventListener('message', (event) => {
    console.log('Service Worker: Message received', event.data);
    
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'GET_VERSION') {
        event.ports[0].postMessage({ version: CACHE_NAME });
    }
});

// Helper function to sync todos (placeholder for future implementation)
async function syncTodos() {
    try {
        // This would sync todos with a server when online
        console.log('Service Worker: Syncing todos...');
        
        // For now, just log that sync would happen
        // In a real implementation, this would:
        // 1. Get pending todos from IndexedDB
        // 2. Send them to the server
        // 3. Update local storage with server response
        
        return Promise.resolve();
    } catch (error) {
        console.error('Service Worker: Failed to sync todos', error);
        return Promise.reject(error);
    }
}

// Periodic background sync (experimental)
self.addEventListener('periodicsync', (event) => {
    console.log('Service Worker: Periodic sync triggered', event.tag);
    
    if (event.tag === 'todo-backup') {
        event.waitUntil(
            backupTodos()
        );
    }
});

// Helper function to backup todos
async function backupTodos() {
    try {
        console.log('Service Worker: Backing up todos...');
        
        // This would create a backup of todos
        // In a real implementation, this could:
        // 1. Export todos to a file
        // 2. Upload to cloud storage
        // 3. Send backup email
        
        return Promise.resolve();
    } catch (error) {
        console.error('Service Worker: Failed to backup todos', error);
        return Promise.reject(error);
    }
}

// Handle app updates
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'UPDATE_AVAILABLE') {
        console.log('Service Worker: Update available');
        
        // Notify the main thread about the update
        self.clients.matchAll().then(clients => {
            clients.forEach(client => {
                client.postMessage({
                    type: 'UPDATE_AVAILABLE',
                    version: event.data.version
                });
            });
        });
    }
});

// Cache management utilities
const CacheManager = {
    // Clear all caches
    async clearAllCaches() {
        const cacheNames = await caches.keys();
        return Promise.all(
            cacheNames.map(cacheName => caches.delete(cacheName))
        );
    },
    
    // Get cache size
    async getCacheSize() {
        const cacheNames = await caches.keys();
        let totalSize = 0;
        
        for (const cacheName of cacheNames) {
            const cache = await caches.open(cacheName);
            const keys = await cache.keys();
            
            for (const request of keys) {
                const response = await cache.match(request);
                if (response) {
                    const blob = await response.blob();
                    totalSize += blob.size;
                }
            }
        }
        
        return totalSize;
    },
    
    // Clean old entries from dynamic cache
    async cleanDynamicCache(maxEntries = 50) {
        const cache = await caches.open(DYNAMIC_CACHE_NAME);
        const keys = await cache.keys();
        
        if (keys.length > maxEntries) {
            const keysToDelete = keys.slice(0, keys.length - maxEntries);
            return Promise.all(
                keysToDelete.map(key => cache.delete(key))
            );
        }
        
        return Promise.resolve();
    }
};

// Export for use in main thread
self.CacheManager = CacheManager;

console.log('Service Worker: Loaded successfully');