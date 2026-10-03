/**
 * Resolves a tri-state status string ("ACTIVE", "INACTIVE", "ALL", "true", "false")
 * into a boolean (`true`, `false`) or `undefined` for standardized filtering across
 * client and server.
 */
export function parseStatusFilter(status?: string | null): boolean | undefined {
  if (!status || status === "ALL") return undefined
  if (status === "ACTIVE" || status === "true") return true
  if (status === "INACTIVE" || status === "false") return false
  return undefined
}
