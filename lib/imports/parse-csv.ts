import Papa from "papaparse"
import type { ParsedImportLeadRow } from "@/lib/imports/types"

type CsvRow = Record<string, string | number | null | undefined>

function normalizeHeader(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
}

function toText(value: unknown) {
  if (value == null) return null
  const text = String(value).trim()
  return text.length ? text : null
}

function toNumber(value: unknown) {
  if (value == null) return null

  const cleaned = String(value)
    .replace(/\$/g, "")
    .replace(/,/g, "")
    .replace(/\s+/g, "")
    .trim()

  if (!cleaned) return null

  const parsed = Number(cleaned)
  return Number.isFinite(parsed) ? parsed : null
}

function getValue(row: CsvRow, aliases: string[]) {
  const normalizedEntries = Object.entries(row).map(([key, value]) => [
    normalizeHeader(key),
    value,
  ]) as Array<[string, unknown]>

  for (const alias of aliases.map(normalizeHeader)) {
    const found = normalizedEntries.find(([key]) => key === alias)
    if (found) return found[1]
  }

  return null
}

function joinNameParts(...parts: Array<string | null>) {
  const joined = parts.filter(Boolean).join(" ").trim()
  return joined.length ? joined : null
}

function mapRowToLead(row: CsvRow): ParsedImportLeadRow {
  const ownerFullName =
    toText(
      getValue(row, [
        "owner name",
        "owner full name",
        "owner 1 full name",
        "owner1 full name",
        "full name",
        "seller name",
      ]),
    ) ||
    joinNameParts(
      toText(getValue(row, ["owner 1 first name", "owner1 first name"])),
      toText(getValue(row, ["owner 1 last name", "owner1 last name"])),
    )

  return {
    property_address_1: toText(
      getValue(row, [
        "property address",
        "address",
        "street address",
        "site address",
        "property address 1",
        "address 1",
      ]),
    ),

    city: toText(
      getValue(row, [
        "city",
        "property city",
        "site city",
      ]),
    ),

    state: toText(
      getValue(row, [
        "state",
        "property state",
        "site state",
      ]),
    ),

    zip: toText(
      getValue(row, [
        "zip",
        "zipcode",
        "zip code",
        "postal code",
        "property zip",
      ]),
    ),

    owner_name: ownerFullName,

    owner_phone_primary: toText(
      getValue(row, [
        "phone",
        "phone 1",
        "phone number",
        "owner phone",
        "owner phone primary",
        "mobile",
        "cell",
        "mobile phone 1",
        "phone number 1",
      ]),
    ),

    owner_email: toText(
      getValue(row, [
        "email",
        "email 1",
        "owner email",
        "seller email",
        "email address 1",
      ]),
    ),

    lead_source: toText(
      getValue(row, [
        "source",
        "lead source",
        "marketing source",
        "list source",
      ]),
    ),

    notes_summary: toText(
      getValue(row, [
        "notes",
        "note",
        "comments",
        "remarks",
        "description",
      ]),
    ),

    asking_price: toNumber(
      getValue(row, [
        "asking price",
        "ask",
        "asking",
        "list price",
        "offer price",
      ]),
    ),

    // IMPORTANT: only true ARV fields go here
    arv: toNumber(
      getValue(row, [
        "arv",
        "after repair value",
        "after-repair value",
      ]),
    ),

    mao: toNumber(
      getValue(row, [
        "mao",
        "max allowable offer",
        "max offer",
      ]),
    ),

    projected_spread: toNumber(
      getValue(row, [
        "spread",
        "projected spread",
        "assignment spread",
        "profit spread",
      ]),
    ),

    equity_estimate: toNumber(
      getValue(row, [
        "equity",
        "equity estimate",
        "estimated equity",
        "owner equity",
      ]),
    ),

    occupancy_status: toText(
      getValue(row, [
        "occupancy",
        "occupancy status",
        "owner occupied",
        "vacant",
      ]),
    ),

    property_condition: toText(
      getValue(row, [
        "condition",
        "property condition",
      ]),
    ),

    motivation_level: toText(
      getValue(row, [
        "motivation",
        "motivation level",
      ]),
    ),

    timeline_to_sell: toText(
      getValue(row, [
        "timeline",
        "timeline to sell",
        "sell timeline",
      ]),
    ),

    beds: toNumber(
      getValue(row, [
        "beds",
        "bedrooms",
        "bed",
      ]),
    ),

    baths: toNumber(
      getValue(row, [
        "baths",
        "bathrooms",
        "bath",
      ]),
    ),

    sqft: toNumber(
      getValue(row, [
        "sqft",
        "square feet",
        "living area",
        "building size",
      ]),
    ),

    year_built: toNumber(
      getValue(row, [
        "year built",
        "built",
      ]),
    ),
  }
}

export async function parseCsvFile(file: File): Promise<ParsedImportLeadRow[]> {
  const text = await file.text()

  return new Promise((resolve, reject) => {
    Papa.parse<CsvRow>(text, {
      header: true,
      skipEmptyLines: true,
      complete: (results: Papa.ParseResult<CsvRow>) => {
        if (results.errors && results.errors.length > 0) {
          reject(new Error(results.errors[0].message))
          return
        }

        const rows = (results.data || [])
          .map((row) => mapRowToLead(row))
          .filter((row) => !!row.property_address_1)

        resolve(rows)
      },
      error: (error: Error) => {
        reject(error)
      },
    })
  })
}