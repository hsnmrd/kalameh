const TECHNICAL_ERROR_PATTERNS = [
  /transaction/i,
  /prisma/i,
  /api error/i,
  /database/i,
  /postgres/i,
  /timeout/i,
  /timed out/i,
  /connection/i,
  /econnrefused/i,
  /pool/i,
  /socket/i,
  /internal server error/i,
  /typeerror/i,
  /syntaxerror/i,
  /rangeerror/i,
  /referenceerror/i,
  /cannot read properties/i,
  /unknown error/i,
  /failed to fetch/i,
  /network error/i,
  /at\s+\S+/i,
  /P\d{4}/,
  /SYSTEM_TEMPORARY_ERROR/i,
  /GENERATION_ENGINE_FAILED/i,
  /ENGINE_FAILED/i,
]

export function formatSchedulingFailureMessage(
  rawMessage: string | null | undefined,
  fallbackMessage: string
): string {
  if (!rawMessage || !rawMessage.trim()) {
    return fallbackMessage
  }

  const trimmed = rawMessage.trim()

  for (const pattern of TECHNICAL_ERROR_PATTERNS) {
    if (pattern.test(trimmed)) {
      return fallbackMessage
    }
  }

  return trimmed
}
