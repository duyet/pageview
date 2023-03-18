// TODO: better way to handle this shit
export const genScript = (endpoint: string) => `
;(function (window, document) {
  console.debug('pageview.js loaded')
  const COOKIE_TIMEOUT = 10 * 60 * 1000 // 10 minutes

  function pageview() {
    console.log('pageview: pageview function called')
    const endpoint = '${endpoint}'
    const url = endpoint + '?url=' + encodeURIComponent(window.location.href)

    const cookieName = \`pv-$\{hash(url)\}\`
    const pageviewId = getCookie(cookieName)
    console.log('pageview: cookieName', cookieName, pageviewId)

    if (!pageviewId) {
      console.debug('pageview: beacon trigger')
      const pageviewId = generatePageviewId() // generate a unique identifier
      setCookie(cookieName, pageviewId) // set the cookie with the identifier

      navigator.sendBeacon(url)
    } else {
      // Skip sending the beacon if the cookie is already set
    }
  }

  // Listen for page visibility changes
  document.addEventListener('visibilitychange', function change() {
    if (document.visibilityState === 'hidden') {
      pageview()
    }
  })

  // Listen for URL changes using the History API
  window.addEventListener('locationchange', pageview)
  window.addEventListener('popstate', pageview)

  // First load
  window.addEventListener('DOMContentLoaded', pageview)

  // helper function to generate a unique identifier
  function generatePageviewId() {
    return Math.random().toString(36).substr(2, 9)
  }

  // helper function to set a cookie with a given name and value
  function setCookie(name, value) {
    const expires = new Date()
    expires.setTime(expires.getTime() + COOKIE_TIMEOUT)
    document.cookie = \`$\{name\}=$\{value\};expires=$\{expires.toUTCString()\};path=/\`
    console.debug('pageview: cookie set', name, value)
  }

  // helper function to get a cookie value by name
  function getCookie(name) {
    const match = document.cookie.match(new RegExp(\`(^| )$\{name\}=([^;]+)\`))
    if (match) {
      return match[2]
    }
    return null
  }

  // helper function to generate a hash from a string
  function hash(str) {
    let hash = 0
    if (str.length == 0) {
      return hash
    }
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36).substr(0, 5) // return a 5-character string
  }
})(window, document)`
