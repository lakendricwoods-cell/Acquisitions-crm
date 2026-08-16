export type LeadAnalysisInput = {
  ownerName?: string | null
  phone?: string | null
  email?: string | null

  address?: string | null
  city?: string | null
  state?: string | null
  zip?: string | null

  askingPrice?: number | null
  listingPrice?: number | null
  marketValue?: number | null
  arv?: number | null

  beds?: number | null
  baths?: number | null
  sqft?: number | null
  yearBuilt?: number | null

  ownershipYears?: number | null
  occupancy?: string | null

  foreclosure?: boolean | null
  taxLien?: boolean | null
  auctionDate?: string | null
  defaultAmount?: number | null

  repairs?: number | null
  assignmentFee?: number | null
  mao?: number | null

  verifiedComps?: number | null
}

export type AnalysisLevel =
  | 'excellent'
  | 'strong'
  | 'moderate'
  | 'weak'
  | 'insufficient'

export type LeadAnalysis = {
  strength: number | null
  motivation: number | null
  contactability: number | null
  marketability: number | null

  strengthLevel: AnalysisLevel
  motivationLevel: AnalysisLevel
  contactabilityLevel: AnalysisLevel
  marketabilityLevel: AnalysisLevel

  reasons: string[]
  missingData: string[]
  confidence: 'high' | 'medium' | 'low' | 'insufficient'
}

function hasText(value: string | null | undefined) {
  return typeof value === 'string' && value.trim().length > 0
}

function hasNumber(value: number | null | undefined) {
  return typeof value === 'number' && Number.isFinite(value)
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)))
}

function levelForScore(
  score: number | null,
): AnalysisLevel {
  if (score === null) return 'insufficient'
  if (score >= 85) return 'excellent'
  if (score >= 70) return 'strong'
  if (score >= 50) return 'moderate'
  return 'weak'
}

function contactability(input: LeadAnalysisInput) {
  let points = 0
  let available = 0

  if (hasText(input.phone)) {
    points += 60
    available += 1
  }

  if (hasText(input.email)) {
    points += 30
    available += 1
  }

  if (hasText(input.ownerName)) {
    points += 10
    available += 1
  }

  if (available === 0) return null

  return clamp(points)
}

function marketability(input: LeadAnalysisInput) {
  let points = 0
  let available = 0

  if (hasNumber(input.arv)) {
    points += 35
    available += 1
  }

  if (hasNumber(input.marketValue)) {
    points += 20
    available += 1
  }

  if (hasNumber(input.sqft)) {
    points += 10
    available += 1
  }

  if (hasNumber(input.beds)) {
    points += 5
    available += 1
  }

  if (hasNumber(input.baths)) {
    points += 5
    available += 1
  }

  if (hasNumber(input.yearBuilt)) {
    points += 5
    available += 1
  }

  if (hasNumber(input.verifiedComps) && (input.verifiedComps ?? 0) > 0) {
    points += 20
    available += 1
  }

  if (available === 0) return null

  return clamp(points)
}

function motivation(input: LeadAnalysisInput) {
  let score = 0
  let signals = 0

  if (input.foreclosure === true) {
    score += 30
    signals += 1
  }

  if (input.taxLien === true) {
    score += 20
    signals += 1
  }

  if (hasNumber(input.defaultAmount) && (input.defaultAmount ?? 0) > 0) {
    score += 20
    signals += 1
  }

  if (hasText(input.auctionDate)) {
    score += 25
    signals += 1
  }

  if (
    typeof input.ownershipYears === 'number' &&
    input.ownershipYears >= 10
  ) {
    score += 10
    signals += 1
  }

  if (
    hasText(input.occupancy) &&
    input.occupancy?.toLowerCase().includes('vacant')
  ) {
    score += 15
    signals += 1
  }

  if (hasNumber(input.askingPrice)) {
    signals += 1
  }

  if (signals === 0) return null

  return clamp(score)
}

function strength(
  input: LeadAnalysisInput,
  contact: number | null,
  market: number | null,
  motivationScore: number | null,
) {
  const components: number[] = []

  if (contact !== null) components.push(contact)
  if (market !== null) components.push(market)
  if (motivationScore !== null) components.push(motivationScore)

  if (hasNumber(input.askingPrice) && hasNumber(input.arv)) {
    const asking = input.askingPrice as number
    const arv = input.arv as number

    if (arv > 0) {
      const discount = ((arv - asking) / arv) * 100
      components.push(clamp(discount * 2))
    }
  }

  if (components.length === 0) return null

  return clamp(
    components.reduce((sum, value) => sum + value, 0) /
      components.length,
  )
}

function missingData(input: LeadAnalysisInput) {
  const missing: string[] = []

  if (!hasText(input.address)) missing.push('Property address')
  if (!hasText(input.ownerName)) missing.push('Owner name')
  if (!hasText(input.phone)) missing.push('Phone number')
  if (!hasNumber(input.sqft)) missing.push('Square footage')
  if (!hasNumber(input.arv)) missing.push('Verified ARV')
  if (!hasNumber(input.askingPrice)) missing.push('Seller / asking price')

  if (
    !hasNumber(input.verifiedComps) ||
    (input.verifiedComps ?? 0) === 0
  ) {
    missing.push('Verified comparable sales')
  }

  return missing
}

export function analyzeLead(
  input: LeadAnalysisInput,
): LeadAnalysis {
  const contact = contactability(input)
  const market = marketability(input)
  const motivationScore = motivation(input)
  const strengthScore = strength(
    input,
    contact,
    market,
    motivationScore,
  )

  const missing = missingData(input)

  let confidence: LeadAnalysis['confidence'] = 'high'

  if (missing.length >= 5) {
    confidence = 'insufficient'
  } else if (missing.length >= 3) {
    confidence = 'low'
  } else if (missing.length >= 1) {
    confidence = 'medium'
  }

  const reasons: string[] = []

  if (contact !== null && contact >= 70) {
    reasons.push('Usable seller contact information is available.')
  }

  if (motivationScore !== null && motivationScore >= 50) {
    reasons.push('The property contains identifiable motivation signals.')
  }

  if (market !== null && market >= 70) {
    reasons.push('The property has meaningful market information.')
  }

  if (
    hasNumber(input.askingPrice) &&
    hasNumber(input.arv) &&
    (input.arv as number) > (input.askingPrice as number)
  ) {
    reasons.push('The available pricing indicates potential equity.')
  }

  if (reasons.length === 0) {
    reasons.push(
      'There is not enough verified information to establish a strong lead thesis yet.',
    )
  }

  return {
    strength: strengthScore,
    motivation: motivationScore,
    contactability: contact,
    marketability: market,

    strengthLevel: levelForScore(strengthScore),
    motivationLevel: levelForScore(motivationScore),
    contactabilityLevel: levelForScore(contact),
    marketabilityLevel: levelForScore(market),

    reasons,
    missingData: missing,

    confidence,
  }
}