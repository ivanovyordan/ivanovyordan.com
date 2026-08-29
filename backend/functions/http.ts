/**
 * Request helpers shared by the website endpoint and the MCP handler.
 */

/**
 * The only client address a caller cannot forge.
 *
 * Cloudflare sets CF-Connecting-IP at the edge and it always reaches the
 * Worker. X-Forwarded-For and X-Real-IP are attacker-controlled, so anything
 * enforcing a limit must use this and not fall back - otherwise evading the
 * cap is one header away.
 */
export function getTrustedClientIP(request: Request): string | undefined {
  return request.headers.get("CF-Connecting-IP") || undefined;
}

/**
 * Best-effort client IP for logging, where a spoofed value is harmless.
 */
export function getClientIP(request: Request): string | undefined {
  // Try CF-Connecting-IP first (Cloudflare)
  const cfIP = request.headers.get("CF-Connecting-IP");
  if (cfIP) return cfIP;

  // Try X-Forwarded-For
  const xForwardedFor = request.headers.get("X-Forwarded-For");
  if (xForwardedFor) {
    // X-Forwarded-For can contain multiple IPs, take the first one
    return xForwardedFor.split(",")[0].trim();
  }

  // Fallback to X-Real-IP
  const xRealIP = request.headers.get("X-Real-IP");
  if (xRealIP) return xRealIP;

  return undefined;
}

/**
 * Get country code from Cloudflare request headers
 */
export function getCountryCode(request: Request): string | undefined {
  // Cloudflare provides country code in CF-IPCountry header
  return request.headers.get("CF-IPCountry") || undefined;
}
