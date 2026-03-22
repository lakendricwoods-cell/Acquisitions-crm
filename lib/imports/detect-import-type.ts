import type { ImportFileType } from './types'

export function detectImportType(fileName: string): ImportFileType {
  const lower = fileName.toLowerCase()

  if (lower.endsWith('.csv')) return 'csv'
  if (lower.endsWith('.pdf')) return 'pdf'

  if (
    lower.endsWith('.png') ||
    lower.endsWith('.jpg') ||
    lower.endsWith('.jpeg') ||
    lower.endsWith('.webp')
  ) {
    return 'image'
  }

  return 'unknown'
}