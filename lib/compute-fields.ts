export function computeOwnershipYears(lead: any) {
  const rawDate =
    lead.last_sale_date ||
    lead.purchase_date ||
    lead.raw_import_data?.last_sale_date

  if (!rawDate) return null

  const saleDate = new Date(rawDate)
  const now = new Date()

  if (isNaN(saleDate.getTime())) return null

  return now.getFullYear() - saleDate.getFullYear()
}