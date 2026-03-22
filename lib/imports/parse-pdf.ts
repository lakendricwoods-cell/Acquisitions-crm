import type { ParsedImportLeadRow } from './types'

function toNumber(value?: string): number | null {
  if (!value) return null
  const cleaned = value.replace(/[$,\s]/g, '')
  const parsed = Number(cleaned)
  return Number.isFinite(parsed) ? parsed : null
}

function matchFirst(text: string, patterns: RegExp[]): string | undefined {
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match?.[1]) return match[1].trim()
    if (match?.[0]) return match[0].trim()
  }
  return undefined
}

function extractLeadFromText(text: string): ParsedImportLeadRow {
  const normalized = text.replace(/\s+/g, ' ').trim()

  const owner_email = matchFirst(normalized, [
    /\b([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})\b/i,
  ])

  const owner_phone_primary = matchFirst(normalized, [
    /(\+?1?\s*\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/,
  ])

  const property_address_1 = matchFirst(normalized, [
    /(?:property address|subject property|address)[:\s]+([0-9]{1,6}\s+[^,]+(?:,\s*[^,]+){0,3})/i,
    /\b([0-9]{1,6}\s+[A-Za-z0-9.\-'\s]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd|Court|Ct|Way|Terrace|Ter)\b[^,]*)/i,
  ])

  const owner_name = matchFirst(normalized, [
    /(?:owner|seller|borrower)[:\s]+([A-Z][A-Za-z.\-'\s]{2,})/i,
  ])

  const asking_price = matchFirst(normalized, [
    /(?:asking price|asking|list price|price)[:\s]+\$?\s*([0-9,]{4,})/i,
  ])

  const arv = matchFirst(normalized, [
    /(?:arv|after repair value)[:\s]+\$?\s*([0-9,]{4,})/i,
  ])

  const repair_estimate_total = matchFirst(normalized, [
    /(?:repairs|repair estimate|estimated repairs|rehab)[:\s]+\$?\s*([0-9,]{3,})/i,
  ])

  return {
    property_address_1: property_address_1 || null,
    owner_name: owner_name || null,
    owner_phone_primary: owner_phone_primary || null,
    owner_email: owner_email || null,
    asking_price: toNumber(asking_price),
    arv: toNumber(arv),
    repair_estimate_total: toNumber(repair_estimate_total),
    lead_source: 'pdf_import',
    notes_summary: normalized.slice(0, 500) || null,
  }
}

export async function parsePdfFile(file: File): Promise<ParsedImportLeadRow[]> {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')

  const arrayBuffer = await file.arrayBuffer()
  const uint8 = new Uint8Array(arrayBuffer)

  const loadingTask = pdfjs.getDocument({
    data: uint8,
    useWorkerFetch: false,
    isEvalSupported: false,
  })

  const pdf = await loadingTask.promise

  let fullText = ''

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber)
    const content = await page.getTextContent()

   const pageText = content.items
  .map((item) => {
    if (typeof item === 'object' && item !== null && 'str' in item) {
      return typeof item.str === 'string' ? item.str : ''
    }

    return ''
  })
  .join(' ')
    fullText += ` ${pageText}`
  }

  const extracted = extractLeadFromText(fullText)

  const hasSignal = Boolean(
    extracted.property_address_1 ||
      extracted.owner_name ||
      extracted.owner_phone_primary ||
      extracted.owner_email ||
      extracted.asking_price ||
      extracted.arv,
  )

  return hasSignal ? [extracted] : []
}