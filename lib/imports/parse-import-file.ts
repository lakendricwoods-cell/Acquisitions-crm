import { detectImportType } from './detect-import-type'
import { parseCsvFile } from './parse-csv'
import { parsePdfFile } from './parse-pdf'
import { parseImageFile } from './parse-image'
import type { ParsedImportResult } from './types'

export async function parseImportFile(file: File): Promise<ParsedImportResult> {
  const type = detectImportType(file.name)
  const warnings: string[] = []

  if (type === 'csv') {
    const leads = await parseCsvFile(file)

    if (leads.length === 0) {
      warnings.push('CSV parsed, but no usable lead rows were found.')
    }

    return { type, leads, warnings }
  }

  if (type === 'pdf') {
    const leads = await parsePdfFile(file)

    if (leads.length === 0) {
      warnings.push('PDF text was read, but no strong lead fields were extracted.')
    }

    return { type, leads, warnings }
  }

  if (type === 'image') {
    const leads = await parseImageFile(file)
    warnings.push('Image OCR is not implemented yet. Using fallback import flow.')
    return { type, leads, warnings }
  }

  warnings.push('Unsupported file type. Using fallback import flow.')
  return { type: 'unknown', leads: [], warnings }
}