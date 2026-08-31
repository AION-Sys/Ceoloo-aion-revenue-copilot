const PUBLIC_PATH_PREFIXES = ["/login", "/auth", "/no-organization"] as const;

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function isProtectedPath(pathname: string): boolean {
  return !isPublicPath(pathname);
}
