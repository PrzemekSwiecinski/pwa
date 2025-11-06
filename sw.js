// Nazwa naszej pamięci podręcznej (cache)
const CACHE_NAME = 'pwa-simple-cache-v1';

// Pliki, które chcemy przechować w pamięci podręcznej (tzw. "App Shell")
// Zaktualizuj tę listę o wszystkie zasoby, które są krytyczne dla Twojej aplikacji
const PLIKI_DO_CACHE = [
  './', // Strona główna
  'index.html',
  'app.js',
  'manifest.json',
  'ikonka.png' // Dodajemy ikonę, o której wspominałeś
];

// Zdarzenie 'install': Uruchamiane podczas instalacji Service Workera
self.addEventListener('install', (event) => {
  console.log('Service Worker: Instalacja');
  
  // Czekamy, aż operacje wewnątrz się zakończą
  event.waitUntil(
    // Otwieramy (lub tworzymy) naszą pamięć podręczną
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Dodawanie plików "App Shell" do pamięci podręcznej');
        // Dodajemy wszystkie nasze pliki do cache
        // 'addAll' jest operacją atomową - jeśli jeden plik się nie pobierze, całość zawiedzie
        return cache.addAll(PLIKI_DO_CACHE);
      })
      .then(() => {
        // Natychmiast aktywujemy nowego Service Workera (pomijamy etap "waiting")
        return self.skipWaiting();
      })
  );
});

// Zdarzenie 'activate': Uruchamiane po pomyślnej instalacji
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Aktywacja');
  
  // Czekamy na zakończenie sprzątania
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        // Usuwamy stare wersje pamięci podręcznej, które nie pasują do aktualnej nazwy
        if (key !== CACHE_NAME) {
          console.log('Service Worker: Usuwanie starej pamięci podręcznej', key);
          return caches.delete(key);
        }
      }));
    })
    .then(() => {
        // Przejmujemy kontrolę nad wszystkimi otwartymi stronami klienta
        return self.clients.claim();
    })
  );
});

// Zdarzenie 'fetch': Uruchamiane przy każdym żądaniu sieciowym
self.addEventListener('fetch', (event) => {
  // Ignorujemy żądania, które nie są metodą GET (np. POST)
  if (event.request.method !== 'GET') {
    return;
  }

  // Stosujemy strategię "Cache first, then network"
  // Najpierw sprawdzamy, czy odpowiedź jest w cache
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Jeśli tak, zwracamy ją z cache
        if (response) {
          console.log('Service Worker: Znaleziono w cache', event.request.url);
          return response;
        }
        
        // Jeśli nie ma w cache, pobieramy z sieci
        console.log('Service Worker: Pobieranie z sieci', event.request.url);
        
        // Musimy sklonować żądanie, ponieważ żądanie (request) to strumień
        // i może być zużyte tylko raz. Jedno idzie do sieci, drugie do cache.
        const fetchRequest = event.request.clone();
        
        return fetch(fetchRequest).then((networkResponse) => {
          // Sprawdzamy, czy otrzymaliśmy poprawną odpowiedź z sieci
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse; // Zwracamy odpowiedź z sieci (np. błąd 404)
          }

          // Klonujemy odpowiedź sieciową (z tych samych powodów co request)
          const responseToCache = networkResponse.clone();

          // Otwieramy cache i zapisujemy nową odpowiedź z sieci
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });

          // Zwracamy odpowiedź z sieci do przeglądarki
          return networkResponse;
        });
      })
      .catch((error) => {
        // Obsługa błędów sieci (np. gdy jesteśmy offline i nie ma w cache)
        console.error('Service Worker: Błąd pobierania. Jesteś offline?', error);
        
        // Można tu zwrócić domyślną stronę "offline.html", jeśli ją mamy w cache
        // return caches.match('/offline.html'); 
      })
  );
});