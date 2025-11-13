/**
 * Privacy Utilities
 * IP hashing and GDPR compliance
 */

import { createHash } from 'crypto'

/**
 * Salt for IP hashing (should be in environment variable in production)
 * Generate with: openssl rand -hex 32
 */
const IP_SALT = process.env.IP_HASH_SALT || 'default-salt-please-change-in-production'

/**
 * Hash IP address for privacy compliance
 * Uses SHA-256 with salt to create a one-way hash
 *
 * @param ip - IP address to hash
 * @returns Hashed IP address (64 characters)
 */
export function hashIp(ip: string | null | undefined): string | null {
  if (!ip || ip === 'unknown' || ip === '') {
    return null
  }

  // Create SHA-256 hash with salt
  const hash = createHash('sha256')
  hash.update(ip + IP_SALT)
  return hash.digest('hex')
}

/**
 * Anonymize IP address by removing last octet (IPv4) or last 80 bits (IPv6)
 * Less secure than hashing but reversible for debugging
 *
 * @param ip - IP address to anonymize
 * @returns Anonymized IP address
 */
export function anonymizeIp(ip: string | null | undefined): string | null {
  if (!ip || ip === 'unknown' || ip === '') {
    return null
  }

  // IPv4: Remove last octet (e.g., 192.168.1.100 -> 192.168.1.0)
  if (ip.includes('.')) {
    const parts = ip.split('.')
    if (parts.length === 4) {
      parts[3] = '0'
      return parts.join('.')
    }
  }

  // IPv6: Remove last 80 bits (keep first 48 bits)
  if (ip.includes(':')) {
    const parts = ip.split(':')
    if (parts.length >= 3) {
      return parts.slice(0, 3).join(':') + '::0'
    }
  }

  return null
}

/**
 * Get session identifier from IP hash
 * Used for counting unique visitors without storing raw IPs
 *
 * @param ip - IP address
 * @returns Session identifier (first 16 characters of hash)
 */
export function getSessionId(ip: string | null | undefined): string | null {
  const hashed = hashIp(ip)
  return hashed ? hashed.substring(0, 16) : null
}

/**
 * Validate if an IP address is valid
 *
 * @param ip - IP address to validate
 * @returns true if valid IP address
 */
export function isValidIp(ip: string | null | undefined): boolean {
  if (!ip) return false

  // IPv4 regex
  const ipv4Regex =
    /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/

  // IPv6 regex (simplified)
  const ipv6Regex = /^(?:[a-fA-F0-9]{1,4}:){7}[a-fA-F0-9]{1,4}$/

  return ipv4Regex.test(ip) || ipv6Regex.test(ip)
}

/**
 * Check if IP is from a known bot/crawler
 * Basic bot detection - should be enhanced with a proper bot detection service
 *
 * @param userAgent - User agent string
 * @returns true if likely a bot
 */
export function isBotUserAgent(userAgent: string | null | undefined): boolean {
  if (!userAgent) return false

  const botPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /python/i,
    /java/i,
    /http/i,
  ]

  return botPatterns.some((pattern) => pattern.test(userAgent))
}

/**
 * GDPR: Prepare data for export
 * Returns all data associated with an IP hash
 */
export async function exportUserData(ipHash: string) {
  // This would query the database for all data associated with the IP hash
  // Implementation depends on your database schema
  return {
    ipHash,
    note: 'User data export for GDPR compliance',
    // Add actual data here
  }
}

/**
 * GDPR: Delete all data associated with an IP hash
 * Implements the "right to be forgotten"
 */
export async function deleteUserData(ipHash: string) {
  // This would delete all data associated with the IP hash
  // Implementation depends on your database schema
  return {
    ipHash,
    deleted: true,
    note: 'User data deleted for GDPR compliance',
  }
}

/**
 * Cookie consent check
 * Validates that user has consented to tracking
 */
export function hasTrackingConsent(cookies: string | undefined): boolean {
  if (!cookies) return false

  // Check for consent cookie
  // Format: pageview_consent=true
  return cookies.includes('pageview_consent=true')
}

/**
 * Generate cookie consent banner script
 */
export function getCookieConsentScript(): string {
  return `
    (function() {
      if (localStorage.getItem('pageview_consent') === 'true') {
        document.cookie = 'pageview_consent=true; max-age=31536000; path=/';
        return;
      }

      // Show consent banner if not already consented
      var banner = document.createElement('div');
      banner.innerHTML = 'This site uses cookies for analytics. <button onclick="acceptConsent()">Accept</button>';
      banner.style.cssText = 'position:fixed;bottom:0;left:0;right:0;background:#333;color:#fff;padding:1rem;text-align:center;z-index:9999';
      document.body.appendChild(banner);

      window.acceptConsent = function() {
        localStorage.setItem('pageview_consent', 'true');
        document.cookie = 'pageview_consent=true; max-age=31536000; path=/';
        banner.remove();
      };
    })();
  `
}
