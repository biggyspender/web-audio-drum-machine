// 404-redirect.ts
// This function captures the current URL (path, search, hash), encodes it, and redirects to the web-root with the encoded URL in the hash fragment.

export function handle404Redirect() {
  // Get the full path, search, and hash (excluding the domain and web-root)
  const { pathname, search, hash } = window.location;
  // Remove the web-root prefix if present
  // Remove trailing slashes from base
  const base = import.meta.env.BASE_URL.replace(/\/+$/, "");
  let path = pathname;
  if (path.startsWith(base)) {
    path = path.slice(base.length);
    if (!path.startsWith("/")) path = "/" + path;
  }
  // Reconstruct the full original URL (relative to web-root)
  const originalUrl = path + search + hash;
  // Encode the original URL for safe inclusion in the hash
  const encoded = encodeURIComponent(originalUrl);
  // Redirect to the web-root with the encoded URL in the hash fragment
  window.location.replace(`${base}/#404-redirect=${encoded}`);
}

// Immediately invoke on load
handle404Redirect();
