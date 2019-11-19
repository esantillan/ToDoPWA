// imports
importScripts('js/sw-utils.js');

const CACHE_STATIC_NAME = 'static-v1';
const CACHE_DYNAMIC_NAME = 'dynamic-v1';
const CACHE_INMUTABLE_NAME = 'inmutable-v1';

const CACHE_DYNAMIC_LIMIT = 50;

function limpiarCache(cacheName, numeroItems) {
    caches.open(cacheName)
        .then(cache => {
            return cache.keys()
                .then(keys => {
                    if (keys.length > numeroItems) {
                        cache.delete(keys[0])
                            .then(limpiarCache(cacheName, numeroItems));
                    }
                });
        });
}

self.addEventListener('install', installEvent => {
    const cacheStaticProm = caches.open(CACHE_STATIC_NAME)
        .then(cache => {

            return cache.addAll([
                'index.html',
                'style/base.css',
                'js/base.js',
                'js/app.js',
                'img/favicon.ico',
                'style/bg.png',
                'js/sw-utils.js'
            ]);


        });


    const cacheInmutableProm = caches.open(CACHE_INMUTABLE_NAME)
        .then(cache => cache.add('https://cdn.jsdelivr.net/npm/pouchdb@7.1.1/dist/pouchdb.min.js'));

    installEvent.waitUntil(Promise.all([cacheStaticProm, cacheInmutableProm]));

    // activo el Service Worker
    self.skipWaiting();
});

// /**
//  * Elimino versiones viajas de caché
//  */
self.addEventListener('activate', activateEvent => {
    const respuesta = caches.keys().then(keys => {
        keys.forEach(key => {
            if (
                (key !== CACHE_STATIC_NAME && key.includes('static')) ||
                (key !== CACHE_INMUTABLE_NAME && key.includes('inmutable')) ||
                (key !== CACHE_DYNAMIC_NAME && key.includes('dynamic'))
            ) {
                return caches.delete(key);
            }
        });
    });

    console.log(activateEvent);
    //espero hasta que se termine la promesa
    activateEvent.waitUntil(respuesta);
});

/**
 * Implemento la estrategia de caché "Cache with Network Fallback"
 * que consite en verificar si el recurso de la petición existe en la caché,
 * servirlo desde allí mismo sin realizar la petición a la web, caso contrario
 */
self.addEventListener('fetch', fetchEvent => {
    const respuesta = caches.match(fetchEvent.request)
        .then(respuestaEvento => {

            if (respuestaEvento) { //si existe el archivo en el caché lo devuelvo directamente
                return respuestaEvento;
            } else {
                return fetch(fetchEvent.request).then(newRes => {
                    return actualizarCacheDinamico(CACHE_DYNAMIC_NAME, fetchEvent.request, newRes);
                });
            }



            /**
             * Si no existe consulto a la web 
             * @SEE en caso de querer implementar el caché dinámico:
             *  1. agregar un then()
             *  2. clonar la respuesta
             *  3 almancenarla en caché 
             *  4 devolver el clon
             */
            return fetch(fetchEvent.request);
        });

    fetchEvent.respondWith(respuesta);
});