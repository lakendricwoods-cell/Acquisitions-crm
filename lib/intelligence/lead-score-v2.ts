export type GenericLeadRecord = Record<string, any>

export type ScoreField = {
  key: string
  value: string
}

export type ScoreDetail = {
  score: number
  label: string
  interpretation: string
  positives: string[]
  missing: string[]
  improvements: string[]
  concerns: string[]
  fields: ScoreField[]
}

export type LeadScoreResult = {
  overall: ScoreDetail
  motivation: ScoreDetail
  contactability: ScoreDetail
  marketability: ScoreDetail
}

function hasText(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0
}

function hasNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value)
}

function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(String(value).replace(/[$,%\s,]/g, ''))
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function yesNoUnknown(value: unknown) {
  if (value === true) return 'yes'
  if (value === false) return 'no'
  return 'unknown'
}

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(value)))
}

function scoreLabel(
  type: 'overall' | 'motivation' | 'contactability' | 'marketability',
  score: number
) {
  if (type === 'overall') {
    if (score <= 24) return 'Very Weak'
    if (score <= 44) return 'Weak'
    if (score <= 64) return 'Workable'
    if (score <= 79) return 'Strong'
    return 'High Priority'
  }

  if (type === 'motivation') {
    if (score <= 24) return 'Low'
    if (score <= 44) return 'Possible'
    if (score <= 64) return 'Moderate'
    if (score <= 79) return 'Strong'
    return 'Highly Motivated'
  }

  if (type === 'contactability') {
    if (score <= 24) return 'Unknown'
    if (score <= 44) return 'Limited'
    if (score <= 64) return 'Partial'
    if (score <= 79) return 'Reachable'
    return 'Highly Reachable'
  }

  if (score <= 24) return 'Unclear'
  if (score <= 44) return 'Thin'
  if (score <= 64) return 'Basic'
  if (score <= 79) return 'Good'
  return 'Strong'
}

function buildInterpretation(
  type: 'overall' | 'motivation' | 'contactability' | 'marketability',
  score: number
) {
  if (type === 'overall') {
    if (score <= 24) return 'This lead is not ready to work yet.'
    if (score <= 44) return 'This lead shows some signals, but execution readiness is weak.'
    if (score <= 64) return 'This lead is workable if you enrich or verify missing pieces.'
    if (score <= 79) return 'This lead looks operationally strong and worth active follow-up.'
    return 'This lead appears high priority with both motivation and execution readiness.'
  }

  if (type === 'motivation') {
    if (score <= 24) return 'Very little seller pressure is visible from the imported data.'
    if (score <= 44) return 'There may be some motivation, but not enough to treat as urgent.'
    if (score <= 64) return 'There are meaningful signs of seller pressure.'
    if (score <= 79) return 'The imported data shows strong motivation signals.'
    return 'This lead shows multiple high-confidence distress or pressure signals.'
  }

  if (type === 'contactability') {
    if (score <= 24) return 'Owner reachability is mostly unknown.'
    if (score <= 44) return 'Some contact structure exists, but outreach is still limited.'
    if (score <= 64) return 'This lead has partial outreach readiness.'
    if (score <= 79) return 'This lead appears reasonably reachable.'
    return 'The contact profile is strong enough for active outreach.'
  }

  if (score <= 24) return 'The property is hard to underwrite from the current imported data.'
  if (score <= 44) return 'Marketability is thin and needs more valuation context.'
  if (score <= 64) return 'There is enough property context to start evaluating the deal.'
  if (score <= 79) return 'The uploaded data gives solid underwriting context.'
  return 'The property profile is strong and highly usable for underwriting.'
}

export function computeLeadScores(lead: GenericLeadRecord): LeadScoreResult {
  const ownerName = lead.owner_name
  const ownerMailing = lead.owner_mailing_address
  const phone = lead.owner_phone_primary
  const email = lead.owner_email

  const houseValue =
    asNumber(lead.house_value) ??
    asNumber(lead.estimated_value) ??
    asNumber(lead.market_value)

  const equityAmount =
    asNumber(lead.equity_amount) ??
    asNumber(lead.estimated_equity) ??
    asNumber(lead.equity_estimate)

  const equityPercent =
    asNumber(lead.equity_percent) ??
    asNumber(lead.estimated_equity_percent)

  const mortgageBalance = asNumber(lead.mortgage_balance)
  const lastSaleAmount = asNumber(lead.last_sale_amount)
  const bedrooms = asNumber(lead.bedrooms)
  const bathrooms = asNumber(lead.bathrooms)
  const squareFeet =
    asNumber(lead.square_feet) ?? asNumber(lead.building_sqft)
  const yearBuilt = asNumber(lead.year_built)

  const leadType = lead.lead_type || 'standard'
  const defaultAmount = asNumber(lead.default_amount)
  const auctionDate = lead.auction_date
  const ownerOccupied = lead.owner_occupied
  const vacant = lead.vacant
  const ownershipLength =
    asNumber(lead.ownership_length) ??
    (asNumber(lead.ownership_length_months) !== null
      ? Math.round((asNumber(lead.ownership_length_months)! / 12) * 10) / 10
      : null)

  let motivation = 0
  const motivationPositives: string[] = []
  const motivationMissing: string[] = []
  const motivationImprovements: string[] = []
  const motivationConcerns: string[] = []

  if (leadType === 'foreclosure' || leadType === 'foreclosure_tax_lien') {
    motivation += 35
    motivationPositives.push('Foreclosure-related lead type present.')
  }

  if (leadType === 'tax_lien' || leadType === 'foreclosure_tax_lien') {
    motivation += 25
    motivationPositives.push('Tax lien or delinquency signal present.')
  }

  if (defaultAmount !== null) {
    motivation += 15
    motivationPositives.push('Default amount present.')
  }

  if (hasText(auctionDate)) {
    motivation += 18
    motivationPositives.push('Auction date present.')
  }

  if (equityPercent !== null) {
    if (equityPercent >= 50) {
      motivation += 12
      motivationPositives.push('High equity percentage present.')
    } else if (equityPercent >= 25) {
      motivation += 7
      motivationPositives.push('Moderate equity percentage present.')
    }
  } else {
    motivationMissing.push('Missing equity percent.')
    motivationImprovements.push('Append or calculate equity percent.')
  }

  if (ownerOccupied === false) {
    motivation += 8
    motivationPositives.push('Owner occupied = no.')
  }

  if (vacant === true) {
    motivation += 10
    motivationPositives.push('Vacant signal present.')
  }

  if (ownershipLength !== null && ownershipLength >= 10) {
    motivation += 8
    motivationPositives.push('Long ownership period present.')
  }

  if (
    leadType === 'standard' &&
    defaultAmount === null &&
    !hasText(auctionDate) &&
    vacant !== true
  ) {
    motivationConcerns.push('Distress pressure is not strongly visible.')
  }

  motivation = clamp(motivation)

  let contactability = 0
  const contactPositives: string[] = []
  const contactMissing: string[] = []
  const contactImprovements: string[] = []
  const contactConcerns: string[] = []

  if (hasText(ownerName)) {
    contactability += 30
    contactPositives.push('Owner name present.')
  } else {
    contactMissing.push('Missing owner name.')
    contactImprovements.push('Append owner identity.')
  }

  if (hasText(ownerMailing)) {
    contactability += 25
    contactPositives.push('Owner mailing address present.')
  } else {
    contactMissing.push('Missing owner mailing address.')
    contactImprovements.push('Append mailing address.')
  }

  if (hasText(phone)) {
    contactability += 30
    contactPositives.push('Phone present.')
  } else {
    contactMissing.push('Missing phone.')
    contactImprovements.push('Append phone number.')
  }

  if (hasText(email)) {
    contactability += 15
    contactPositives.push('Email present.')
  } else {
    contactMissing.push('Missing email.')
    contactImprovements.push('Append email address.')
  }

  if (!hasText(phone) && !hasText(email)) {
    contactConcerns.push('No direct contact channel is available.')
  }

  contactability = clamp(contactability)

  let marketability = 0
  const marketPositives: string[] = []
  const marketMissing: string[] = []
  const marketImprovements: string[] = []
  const marketConcerns: string[] = []

  if (houseValue !== null) {
    marketability += 30
    marketPositives.push('House value present.')
  } else {
    marketMissing.push('Missing house value.')
    marketImprovements.push('Append estimated value or market value.')
  }

  if (equityAmount !== null) {
    marketability += 18
    marketPositives.push('Equity amount present.')
  } else {
    marketMissing.push('Missing equity amount.')
    marketImprovements.push('Append or calculate equity amount.')
  }

  if (mortgageBalance !== null) {
    marketability += 10
    marketPositives.push('Mortgage balance present.')
  } else {
    marketMissing.push('Missing mortgage balance.')
    marketImprovements.push('Append mortgage balance.')
  }

  if (lastSaleAmount !== null) {
    marketability += 8
    marketPositives.push('Last money into the house present.')
  }

  if (bedrooms !== null) {
    marketability += 8
    marketPositives.push('Bedrooms present.')
  } else {
    marketMissing.push('Missing bedrooms.')
  }

  if (bathrooms !== null) {
    marketability += 8
    marketPositives.push('Bathrooms present.')
  } else {
    marketMissing.push('Missing bathrooms.')
  }

  if (squareFeet !== null) {
    marketability += 12
    marketPositives.push('Square footage present.')
  } else {
    marketMissing.push('Missing square footage.')
  }

  if (hasText(lead.property_type)) {
    marketability += 4
    marketPositives.push('Property type present.')
  } else {
    marketMissing.push('Missing property type.')
  }

  if (yearBuilt !== null) {
    marketability += 2
    marketPositives.push('Year built present.')
  }

  if (houseValue === null && equityAmount === null) {
    marketConcerns.push('Valuation context is too thin for reliable underwriting.')
  }

  marketability = clamp(marketability)

  let overall =
    contactability * 0.35 +
    marketability * 0.30 +
    motivation * 0.25 +
    clamp(
      [
        hasText(ownerName),
        hasText(ownerMailing),
        hasText(phone) || hasText(email),
        houseValue !== null,
        equityAmount !== null,
        hasText(lead.property_type),
        squareFeet !== null,
      ].filter(Boolean).length * 14.285
    ) *
      0.10

  if (!hasText(ownerName) && !hasText(phone) && !hasText(email)) {
    overall = Math.min(overall, 45)
  }

  if (houseValue === null && !hasNumber(lead.asking_price) && !hasText(lead.listing_price)) {
    overall = Math.min(overall, 60)
  }

  if (contactability <= 25 && marketability <= 25) {
    overall = Math.min(overall, 35)
  }

  overall = clamp(overall)

  const fields: ScoreField[] = [
    { key: 'lead_type', value: String(leadType) },
    { key: 'house_value', value: houseValue === null ? 'missing' : String(houseValue) },
    { key: 'equity_amount', value: equityAmount === null ? 'missing' : String(equityAmount) },
    { key: 'equity_percent', value: equityPercent === null ? 'missing' : String(equityPercent) },
    { key: 'mortgage_balance', value: mortgageBalance === null ? 'missing' : String(mortgageBalance) },
    { key: 'last_sale_amount', value: lastSaleAmount === null ? 'missing' : String(lastSaleAmount) },
    { key: 'auction_date', value: hasText(auctionDate) ? String(auctionDate) : 'missing' },
    { key: 'default_amount', value: defaultAmount === null ? 'missing' : String(defaultAmount) },
    { key: 'owner_name', value: hasText(ownerName) ? String(ownerName) : 'missing' },
    { key: 'owner_mailing_address', value: hasText(ownerMailing) ? String(ownerMailing) : 'missing' },
    { key: 'owner_phone_primary', value: hasText(phone) ? String(phone) : 'missing' },
    { key: 'owner_email', value: hasText(email) ? String(email) : 'missing' },
    { key: 'owner_occupied', value: yesNoUnknown(ownerOccupied) },
    { key: 'vacant', value: yesNoUnknown(vacant) },
    { key: 'ownership_length', value: ownershipLength === null ? 'missing' : String(ownershipLength) },
    { key: 'bedrooms', value: bedrooms === null ? 'missing' : String(bedrooms) },
    { key: 'bathrooms', value: bathrooms === null ? 'missing' : String(bathrooms) },
    { key: 'square_feet', value: squareFeet === null ? 'missing' : String(squareFeet) },
    { key: 'property_type', value: hasText(lead.property_type) ? String(lead.property_type) : 'missing' },
  ]

  return {
    overall: {
      score: overall,
      label: scoreLabel('overall', overall),
      interpretation: buildInterpretation('overall', overall),
      positives: [
        ...motivationPositives.slice(0, 2),
        ...contactPositives.slice(0, 2),
        ...marketPositives.slice(0, 2),
      ],
      missing: [...contactMissing.slice(0, 3), ...marketMissing.slice(0, 3)],
      improvements: [
        ...contactImprovements.slice(0, 2),
        ...marketImprovements.slice(0, 2),
      ],
      concerns: [
        ...motivationConcerns,
        ...contactConcerns,
        ...marketConcerns,
      ],
      fields,
    },
    motivation: {
      score: motivation,
      label: scoreLabel('motivation', motivation),
      interpretation: buildInterpretation('motivation', motivation),
      positives: motivationPositives,
      missing: motivationMissing,
      improvements: motivationImprovements,
      concerns: motivationConcerns,
      fields,
    },
    contactability: {
      score: contactability,
      label: scoreLabel('contactability', contactability),
      interpretation: buildInterpretation('contactability', contactability),
      positives: contactPositives,
      missing: contactMissing,
      improvements: contactImprovements,
      concerns: contactConcerns,
      fields,
    },
    marketability: {
      score: marketability,
      label: scoreLabel('marketability', marketability),
      interpretation: buildInterpretation('marketability', marketability),
      positives: marketPositives,
      missing: marketMissing,
      improvements: marketImprovements,
      concerns: marketConcerns,
      fields,
    },
  }
}

export function calculateLeadScoreV2(lead: GenericLeadRecord) {
  const scores = computeLeadScores(lead)

  return {
    overallStrength: scores.overall.score,
    motivation: scores.motivation.score,
    contactability: scores.contactability.score,
    marketability: scores.marketability.score,
    overall: scores.overall.score,
  }
}