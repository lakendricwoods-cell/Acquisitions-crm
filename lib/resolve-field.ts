type Lead = {
  [key: string]: any
  raw_import_data?: Record<string, any>
}

export function resolveField(
  lead: Lead,
  aliases: string[],
  fallback: any = null
) {
  // 1. direct structured fields
  for (const key of aliases) {
    if (lead[key] !== undefined && lead[key] !== null && lead[key] !== '') {
      return lead[key]
    }
  }

  // 2. raw_import_data fallback
  if (lead.raw_import_data) {
    for (const key of aliases) {
      const rawValue =
        lead.raw_import_data[key] ||
        lead.raw_import_data[key.toLowerCase()] ||
        lead.raw_import_data[key.toUpperCase()]

      if (rawValue !== undefined && rawValue !== null && rawValue !== '') {
        return rawValue
      }
    }
  }

  return fallback
}