import type { ParsedImportLeadRow } from './types'

function normalizeText(text: string) {
  return text.replace(/\s+/g, ' ').trim()
}

function findMoney(text: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match?.[1]) {
      const value = Number(match[1].replace(/[$,\s]/g, ''))
      if (Number.isFinite(value)) return value
    }
  }
  return null
}

function findNumber(text: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match?.[1]) {
      const value = Number(match[1].replace(/[,\s]/g, ''))
      if (Number.isFinite(value)) return value
    }
  }
  return null
}

function findText(text: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match?.[1]) {
      return normalizeText(match[1])
    }
  }
  return null
}

function buildLeadFromPdfText(text: string): ParsedImportLeadRow {
  const property_address_1 =
    findText(text, [
      /property address[:\s]+([^\n]+)/i,
      /subject property[:\s]+([^\n]+)/i,
      /address[:\s]+([^\n]+)/i,
    ]) ?? null

  const city =
    findText(text, [
      /city[:\s]+([^\n,]+)/i,
    ]) ?? null

  const state =
    findText(text, [
      /state[:\s]+([A-Z]{2})/i,
    ]) ?? null

  const zip =
    findText(text, [
      /zip[:\s]+(\d{5}(?:-\d{4})?)/i,
      /postal code[:\s]+(\d{5}(?:-\d{4})?)/i,
    ]) ?? null

  const owner_name =
    findText(text, [
      /owner name[:\s]+([^\n]+)/i,
      /borrower[:\s]+([^\n]+)/i,
      /seller[:\s]+([^\n]+)/i,
    ]) ?? null

  const asking_price = findMoney(text, [
    /asking price[:\s]+\$?([\d,]+)/i,
    /list price[:\s]+\$?([\d,]+)/i,
    /price[:\s]+\$?([\d,]+)/i,
  ])

  const arv = findMoney(text, [
    /arv[:\s]+\$?([\d,]+)/i,
    /after repair value[:\s]+\$?([\d,]+)/i,
  ])

  const mao = findMoney(text, [
    /mao[:\s]+\$?([\d,]+)/i,
    /max allowable offer[:\s]+\$?([\d,]+)/i,
  ])

  const projected_spread = findMoney(text, [
    /projected spread[:\s]+\$?([\d,]+)/i,
    /spread[:\s]+\$?([\d,]+)/i,
  ])

  const repair_estimate_total = findMoney(text, [
    /repair estimate(?: total)?[:\s]+\$?([\d,]+)/i,
    /estimated repairs?[:\s]+\$?([\d,]+)/i,
    /rehab(?: cost)?[:\s]+\$?([\d,]+)/i,
  ])

  const beds = findNumber(text, [
    /beds?[:\s]+(\d+)/i,
    /bedrooms?[:\s]+(\d+)/i,
  ])

  const baths = findNumber(text, [
    /baths?[:\s]+(\d+(?:\.\d+)?)/i,
    /bathrooms?[:\s]+(\d+(?:\.\d+)?)/i,
  ])

  const sqft = findNumber(text, [
    /sq\.?\s?ft\.?[:\s]+([\d,]+)/i,
    /square feet[:\s]+([\d,]+)/i,
    /living area[:\s]+([\d,]+)/i,
  ])

  const year_built = findNumber(text, [
    /year built[:\s]+(\d{4})/i,
  ])

  return {
    property_address_1,
    city,
    state,
    zip,
    owner_name,
    lead_source: 'pdf_import',
    notes_summary: text.slice(0, 500),
    asking_price,
    arv,
    mao,
    projected_spread,
    repair_estimate_total,
    beds,
    baths,
    sqft,
    year_built,
  }
}

export async function parsePdfFile(file: File): Promise<ParsedImportLeadRow[]> {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')

  const arrayBuffer = await file.arrayBuffer()
  const uint8 = new Uint8Array(arrayBuffer)

  const loadingTask = pdfjs.getDocument({ data: uint8 })
  const pdf = await loadingTask.promise

  let fullText = ''

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber)
    const content = await page.getTextContent()

    const pageText = content.items
      .map((item: any) => ('str' in item ? item.str : ''))
      .join(' ')

    fullText += `\n${pageText}`
  }

  const cleaned = normalizeText(fullText)
  return [buildLeadFromPdfText(cleaned)]
}