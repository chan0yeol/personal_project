const CACHE_NAME = 'opobse-v1'
const PRECACHE = ['/app', '/index.html', '/manifest.json']

// 설치: 앱 셸 미리 캐싱
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE).catch(() => {}))
      .then(() => self.skipWaiting())
  )
})

// 활성화: 이전 캐시 삭제
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url)

  // API / OAuth / 업로드: 캐싱 안 함 (항상 네트워크)
  if (url.pathname.startsWith('/api/') ||
      url.pathname.startsWith('/oauth2/') ||
      url.pathname.startsWith('/uploads/')) return

  // 페이지 네비게이션: 네트워크 우선, 실패 시 캐시 fallback
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone()
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone))
          return res
        })
        .catch(() => caches.match('/index.html'))
    )
    return
  }

  // 정적 에셋: 캐시 우선, 없으면 네트워크 후 캐시 저장
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached
      return fetch(e.request).then(res => {
        if (res.ok && e.request.method === 'GET') {
          const clone = res.clone()
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone))
        }
        return res
      })
    })
  )
})
