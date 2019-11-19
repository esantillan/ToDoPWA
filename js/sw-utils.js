function acutalizarCacheDinamico(dynamicCache, req, res) {
    if (res.ok) {
        return caches.open(dynamicCache)
            .then(cache => {
                cache.put(req, res.clone());
                return res; //SEE en caso de tener problemas probar agregar .clone()
            });
    } else {
        return res;
    }
}