// Modern pageview tracking script inspired by Plausible/Fathom best practices
export const genScript = (endpoint: string) => `
;(function (window, document) {
  'use strict'

  const ENDPOINT = '${endpoint}'
  const COOKIE_TIMEOUT = 10 * 60 * 1000 // 10 minutes
  const DEBOUNCE_DELAY = 300 // ms - prevent rapid-fire duplicate events

  let lastTrackedUrl = null
  let debounceTimer = null

  // Core tracking function with deduplication and error handling
  function track() {
    const currentUrl = window.location.href

    // Skip if same URL (debouncing)
    if (currentUrl === lastTrackedUrl) {
      console.debug('pageview: skipping duplicate URL', currentUrl)
      return
    }

    // Check cookie-based deduplication
    const cookieName = 'pv-' + hash(currentUrl)
    const pageviewId = getCookie(cookieName)

    if (pageviewId) {
      console.debug('pageview: skipping (cookie exists)', cookieName)
      return
    }

    // Track this pageview
    console.debug('pageview: tracking', currentUrl)
    lastTrackedUrl = currentUrl

    // Set cookie to prevent duplicate tracking
    const newPageviewId = generatePageviewId()
    setCookie(cookieName, newPageviewId)

    // Send beacon with fallback
    sendBeaconWithFallback(ENDPOINT + '?url=' + encodeURIComponent(currentUrl))
  }

  // Debounced tracking to prevent rapid-fire events
  function debouncedTrack() {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }
    debounceTimer = setTimeout(track, DEBOUNCE_DELAY)
  }

  // Send beacon with XMLHttpRequest fallback for older browsers
  function sendBeaconWithFallback(url) {
    try {
      if (navigator.sendBeacon && navigator.sendBeacon(url)) {
        console.debug('pageview: beacon sent successfully')
        return
      }
    } catch (e) {
      console.warn('pageview: beacon failed, using fallback', e)
    }

    // Fallback to XMLHttpRequest
    try {
      const xhr = new XMLHttpRequest()
      xhr.open('GET', url, true)
      xhr.send()
      console.debug('pageview: fallback XHR sent')
    } catch (e) {
      console.error('pageview: all tracking methods failed', e)
    }
  }

  // Intercept History API for SPA support (React Router, Next.js, etc.)
  function interceptHistory() {
    const originalPushState = history.pushState
    const originalReplaceState = history.replaceState

    history.pushState = function() {
      originalPushState.apply(this, arguments)
      debouncedTrack()
    }

    history.replaceState = function() {
      originalReplaceState.apply(this, arguments)
      debouncedTrack()
    }
  }

  // Setup event listeners for all navigation types
  function setupListeners() {
    // SPA navigation (back/forward buttons)
    window.addEventListener('popstate', debouncedTrack)

    // Hash-based routing (legacy SPAs)
    window.addEventListener('hashchange', debouncedTrack)

    // Intercept pushState/replaceState for modern SPAs
    interceptHistory()

    // Optional: Track when user returns to tab (commented out by default)
    // document.addEventListener('visibilitychange', function() {
    //   if (document.visibilityState === 'visible') {
    //     debouncedTrack()
    //   }
    // })
  }

  // Initial page load tracking
  function init() {
    console.debug('pageview.js loaded and initialized')

    // Setup all navigation listeners
    setupListeners()

    // Track initial pageview
    if (document.readyState === 'loading') {
      // DOM still loading, wait for DOMContentLoaded
      document.addEventListener('DOMContentLoaded', track)
    } else {
      // DOM already loaded, track immediately
      track()
    }
  }

  // Helper: Generate unique pageview ID
  function generatePageviewId() {
    return Math.random().toString(36).substring(2, 11)
  }

  // Helper: Set cookie with expiration
  function setCookie(name, value) {
    const expires = new Date(Date.now() + COOKIE_TIMEOUT).toUTCString()
    document.cookie = name + '=' + value + ';expires=' + expires + ';path=/;SameSite=Lax'
    console.debug('pageview: cookie set', name)
  }

  // Helper: Get cookie value by name
  function getCookie(name) {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
    return match ? match[2] : null
  }

  // Helper: Generate hash from string (simple but effective)
  function hash(str) {
    let h = 0
    if (str.length === 0) return h
    for (let i = 0; i < str.length; i++) {
      h = ((h << 5) - h) + str.charCodeAt(i)
      h = h & h // Convert to 32-bit integer
    }
    return Math.abs(h).toString(36).substring(0, 8)
  }

  // Start tracking
  init()
})(window, document)
`
