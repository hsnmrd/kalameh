/**
 * Iranian mobile phone number format: 11 digits starting with 09 (e.g. 09123456789)
 */
export const PhoneRegex = /^09\d{9}$/

/**
 * Iranian national identification code format: 10 digits
 */
export const NationalCodeRegex = /^\d{10}$/

/**
 * Iranian 10-digit postal code format
 */
export const PostalCodeRegex = /^\d{10}$/

/**
 * Subdomain format: 3-63 characters, lowercase alphanumeric with optional internal hyphens
 */
export const SubdomainRegex = /^[a-z0-9]([a-z0-9-]{1,61}[a-z0-9])?$/
