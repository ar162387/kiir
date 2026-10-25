/** Keep existing saved packaged-logo settings working without changing custom uploads. */
export function brandLogoUrl(url: string): string {
  return url === '/logo/kiirlogo.png' ? '/logo/kiir-emblem.png' : url;
}
