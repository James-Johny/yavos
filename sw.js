const CACHE_NAME = "v1-app-cache";
const ASSETS_TO_CACHE = [
  "./", // Raiz (geralmente index.html)
  "index.html",
  "estilos.css",
  "script.js",
  "manifest.json",
  "icon-192.png",
  "icon-512.png"
];

// 1. Instalação: Salva os arquivos essenciais inicialmente
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log("Caching assets...");
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting()) // Força o SW a ativar imediatamente
  );
});

// 2. Ativação: Limpa caches antigos se você mudar o CACHE_NAME no futuro
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim()) // Assume o controle das abas abertas na hora
  );
});

// 3. Estratégia Network-First: Tenta rede, se falhar usa cache
self.addEventListener("fetch", event => {
  event.respondWith(
    fetch(event.request)
      .then(networkResponse => {
        // Se a resposta da rede for válida, clonamos e atualizamos o cache
        return caches.open(CACHE_NAME).then(cache => {
          // Apenas fazemos cache de requisições bem-sucedidas (tipo GET)
          if (event.request.method === "GET") {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        });
      })
      .catch(() => {
        // Se a rede falhar (Offline), tenta encontrar no cache
        return caches.match(event.request).then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Caso não tenha na rede nem no cache (ex: página não visitada offline)
          // Você poderia retornar uma página de "offline.html" aqui
        });
      })
  );
});