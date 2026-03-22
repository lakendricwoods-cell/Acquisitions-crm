export type MotivationLevel = 'high' | 'medium' | 'low' | 'unknown'
export type TimelineToSell = 'asap' | '30_days' | '60_days' | '90_plus' | 'unknown'
export type PropertyCondition =
  | 'heavy_rehab'
  | 'moderate_rehab'
  | 'light_rehab'
  | 'retail_ready'
  | 'unknown'
export type LienStatus = 'clear' | 'unknown' | 'issue'

export type DealReadiness =
  | 'Intake'
  | 'Researching'
  | 'Offer Ready'
  | 'Dispo Ready'
  | 'Contract Active'

export type RiskLabel = 'Low' | 'Medium' | 'High' | 'Critical'

export type NextBestAction =
  | 'Find seller contact'
  | 'Run comps'
  | 'Estimate repairs'
  | 'Call seller'
  | 'Prepare offer'
  | 'Match buyers'
  | 'Review risk'
  | 'Continue qualification'

export type LeadIntelligenceInput = {
  status?: string | null

  owner_name?: string | null
  owner_phone_primary?: string | null
  owner_email?: string | null

  property_address_1?: string | null
  city?: string | null
  state?: string | null
  zip?: string | null

  asking_price?: number | null
  arv?: number | null
  repair_estimate_total?: number | null
  mao?: number | null
  projected_spread?: number | null
  assignment_fee_target?: number | null

  motivation_level?: MotivationLevel | null
  timeline_to_sell?: TimelineToSell | null
  property_condition?: PropertyCondition | null
  occupancy_status?: string | null
  equity_estimate?: number | null

  contact_attempts?: number | null
  last_contact_outcome?: string | null
  lead_source?: string | null
  notes_summary?: string | null
  last_contact_at?: string | null
  next_follow_up_at?: string | null
  lien_status?: LienStatus | null
}

export type LeadIntelligenceOutput = {
  mao: number | null
  projectedSpread: number | null
  strengthScore: number
  completenessScore: number
  riskScore: number
  riskLabel: RiskLabel
  dealReadiness: DealReadiness
  nextAction: NextBestAction
}

const DEFAULT_ASSIGNMENT_FEE = 15000

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(value)))
}

function hasValue(value: unknown) {
  return value !== null && value !== undefined && value !== ''
}

export function computeSpread(
  arv?: number | null,
  askingPrice?: number | null,
  repairs?: number | null,
): number | null {
  if (!hasValue(arv) || !hasValue(askingPrice) || !hasValue(repairs)) {
    return null
  }

  const spread = Number(arv) - Number(askingPrice) - Number(repairs)
  return Number.isFinite(spread) ? Math.round(spread) : null
}

export function computeMao(
  arv?: number | null,
  repairs?: number | null,
  assignmentFee?: number | null,
): number | null {
  if (!hasValue(arv) || !hasValue(repairs)) {
    return null
  }

  const mao =
    Number(arv) * 0.7 - Number(repairs) - Number(assignmentFee ?? DEFAULT_ASSIGNMENT_FEE)

  return Number.isFinite(mao) ? Math.round(mao) : null
}

export function computeLeadStrength(input: LeadIntelligenceInput): number {
  let score = 0

  const spread =
    input.projected_spread ??
    computeSpread(input.arv, input.asking_price, input.repair_estimate_total)

  // A. Deal margin potential — 30
  if (spread != null) {
    if (spread > 100000) score += 30
    else if (spread >= 70000) score += 24
    else if (spread >= 50000) score += 18
    else if (spread >= 30000) score += 10
    else if (spread >= 10000) score += 4
  }

  // B. Seller motivation — 20
  switch (input.motivation_level ?? 'unknown') {
    case 'high':
      score += 20
      break
    case 'medium':
      score += 12
      break
    case 'low':
      score += 5
      break
    default:
      break
  }

  // C. Timeline urgency — 15
  switch (input.timeline_to_sell ?? 'unknown') {
    case 'asap':
      score += 15
      break
    case '30_days':
      score += 12
      break
    case '60_days':
      score += 8
      break
    case '90_plus':
      score += 3
      break
    default:
      break
  }

  // D. Property condition / distress — 10
  switch (input.property_condition ?? 'unknown') {
    case 'heavy_rehab':
      score += 10
      break
    case 'moderate_rehab':
      score += 8
      break
    case 'light_rehab':
      score += 5
      break
    case 'retail_ready':
      score += 2
      break
    default:
      break
  }

  // E. Equity — 10
  if (input.equity_estimate != null) {
    if (input.equity_estimate > 100000) score += 10
    else if (input.equity_estimate >= 60000) score += 8
    else if (input.equity_estimate >= 30000) score += 5
    else if (input.equity_estimate >= 10000) score += 2
  }

  // F. Seller engagement — 15
  const outcome = (input.last_contact_outcome ?? '').toLowerCase()
  const attempts = input.contact_attempts ?? 0
  const status = (input.status ?? '').toLowerCase()

  if (
    outcome.includes('replied') ||
    outcome.includes('engaged') ||
    outcome.includes('interested')
  ) {
    score += 15
  } else if (status === 'contacted') {
    score += 8
  } else if (attempts > 0 || status === 'follow_up' || status === 'contact_attempted') {
    score += 4
  } else if (status === 'new_lead') {
    score += 2
  }

  return clamp(score)
}

export function computeCompleteness(input: LeadIntelligenceInput): number {
  let score = 0

  // A. Seller info — 20
  const hasName = hasValue(input.owner_name)
  const hasPhone = hasValue(input.owner_phone_primary)
  const hasEmail = hasValue(input.owner_email)

  if (hasName && hasPhone && hasEmail) score += 20
  else if (hasName && hasPhone) score += 15
  else if (hasName) score += 6

  // B. Property info — 20
  const propertyMajorFields = [
    hasValue(input.property_address_1),
    hasValue(input.city),
    hasValue(input.state),
    hasValue(input.zip),
    hasValue((input as Record<string, unknown>).beds),
    hasValue((input as Record<string, unknown>).baths),
    hasValue((input as Record<string, unknown>).square_feet),
  ]

  const hasAddressOnly = hasValue(input.property_address_1)
  const hasAddressAndLocation =
    hasValue(input.property_address_1) && hasValue(input.city) && hasValue(input.state)

  if (propertyMajorFields.every(Boolean)) score += 20
  else if (hasAddressAndLocation) score += 12
  else if (hasAddressOnly) score += 6

  // C. Deal numbers — 30
  const hasAsking = hasValue(input.asking_price)
  const hasArv = hasValue(input.arv)
  const hasRepairs = hasValue(input.repair_estimate_total)
  const hasMao = hasValue(input.mao)
  const hasSpread = hasValue(input.projected_spread)

  if (hasAsking && hasArv && hasRepairs && hasMao && hasSpread) score += 30
  else if (hasAsking && hasArv && hasRepairs) score += 22
  else if (hasAsking && hasArv) score += 15
  else if (hasAsking) score += 6

  // D. Qualification data — 15
  const qualificationCount = [
    hasValue(input.motivation_level) && input.motivation_level !== 'unknown',
    hasValue(input.timeline_to_sell) && input.timeline_to_sell !== 'unknown',
    hasValue(input.occupancy_status),
    hasValue(input.property_condition) && input.property_condition !== 'unknown',
  ].filter(Boolean).length

  if (qualificationCount === 4) score += 15
  else if (qualificationCount === 3) score += 11
  else if (qualificationCount === 2) score += 7
  else if (qualificationCount === 1) score += 3

  // E. Operational context — 15
  const operationalCount = [
    hasValue(input.lead_source),
    hasValue(input.notes_summary),
    hasValue(input.last_contact_at),
    hasValue(input.next_follow_up_at),
  ].filter(Boolean).length

  if (operationalCount === 4) score += 15
  else if (operationalCount === 3) score += 11
  else if (operationalCount === 2) score += 7
  else if (operationalCount === 1) score += 3

  return clamp(score)
}

export function computeRisk(input: LeadIntelligenceInput): {
  riskScore: number
  riskLabel: RiskLabel
} {
  let risk = 0

  const spread =
    input.projected_spread ??
    computeSpread(input.arv, input.asking_price, input.repair_estimate_total)

  const mao =
    input.mao ??
    computeMao(input.arv, input.repair_estimate_total, input.assignment_fee_target)

  // Thin margin risk
  if (spread != null) {
    if (spread < 20000) risk += 25
    else if (spread < 40000) risk += 15
  }

  // Missing numbers risk
  if (!hasValue(input.arv)) risk += 15
  if (!hasValue(input.repair_estimate_total)) risk += 15
  if (!hasValue(input.asking_price)) risk += 10

  // Engagement risk
  const attempts = input.contact_attempts ?? 0
  const outcome = (input.last_contact_outcome ?? '').toLowerCase()

  if (attempts >= 3 && (outcome.includes('no answer') || outcome.includes('unreachable'))) {
    risk += 20
  } else if (!hasValue(input.last_contact_outcome) && attempts > 0) {
    risk += 10
  }

  // Seller expectation risk
  if (mao != null && input.asking_price != null) {
    const overMao = Number(input.asking_price) - mao
    if (overMao > 30000) risk += 20
    else if (overMao > 10000) risk += 10
  }

  // Title / lien risk
  switch (input.lien_status ?? 'unknown') {
    case 'issue':
      risk += 20
      break
    case 'unknown':
      risk += 8
      break
    default:
      break
  }

  const riskScore = clamp(risk)
  let riskLabel: RiskLabel = 'Low'

  if (riskScore >= 70) riskLabel = 'Critical'
  else if (riskScore >= 45) riskLabel = 'High'
  else if (riskScore >= 20) riskLabel = 'Medium'

  return { riskScore, riskLabel }
}

export function computeReadiness(input: LeadIntelligenceInput): DealReadiness {
  const completeness = computeCompleteness(input)
  const hasArv = hasValue(input.arv)
  const hasRepairs = hasValue(input.repair_estimate_total)
  const hasAsking = hasValue(input.asking_price)
  const status = (input.status ?? '').toLowerCase()
  const { riskLabel } = computeRisk(input)

  if (
    status === 'under_contract' ||
    status === 'buyer_found' ||
    status === 'closing' ||
    status === 'closed'
  ) {
    return 'Contract Active'
  }

  if (status === 'under_contract') {
    return 'Dispo Ready'
  }

  if (completeness < 35) {
    return 'Intake'
  }

  if (!hasArv || !hasRepairs) {
    return 'Researching'
  }

  if (hasAsking && hasArv && hasRepairs && riskLabel !== 'Critical') {
    return 'Offer Ready'
  }

  return 'Researching'
}

export function computeNextBestAction(input: LeadIntelligenceInput): NextBestAction {
  const hasPhone = hasValue(input.owner_phone_primary)
  const hasEmail = hasValue(input.owner_email)
  const hasArv = hasValue(input.arv)
  const hasRepairs = hasValue(input.repair_estimate_total)
  const hasAsking = hasValue(input.asking_price)
  const status = (input.status ?? '').toLowerCase()
  const { riskLabel } = computeRisk(input)
  const strengthScore = computeLeadStrength(input)

  if (!hasPhone && !hasEmail) {
    return 'Find seller contact'
  }

  if (!hasArv) {
    return 'Run comps'
  }

  if (!hasRepairs) {
    return 'Estimate repairs'
  }

  if (riskLabel === 'Critical') {
    return 'Review risk'
  }

  if (
    strengthScore >= 70 &&
    (status === 'new_lead' || status === 'contact_attempted' || status === '')
  ) {
    return 'Call seller'
  }

  if (
    (status === 'contacted' || status === 'follow_up' || status === 'negotiation') &&
    hasAsking &&
    hasArv &&
    hasRepairs
  ) {
    return 'Prepare offer'
  }

  if (status === 'under_contract' || status === 'buyer_found') {
    return 'Match buyers'
  }

  return 'Continue qualification'
}

export function computeLeadIntelligence(
  input: LeadIntelligenceInput,
): LeadIntelligenceOutput {
  const mao =
    input.mao ??
    computeMao(input.arv, input.repair_estimate_total, input.assignment_fee_target)

  const projectedSpread =
    input.projected_spread ??
    computeSpread(input.arv, input.asking_price, input.repair_estimate_total)

  const strengthScore = computeLeadStrength({
    ...input,
    mao,
    projected_spread: projectedSpread,
  })

  const completenessScore = computeCompleteness(input)
  const { riskScore, riskLabel } = computeRisk({
    ...input,
    mao,
    projected_spread: projectedSpread,
  })

  const dealReadiness = computeReadiness({
    ...input,
    mao,
    projected_spread: projectedSpread,
  })

  const nextAction = computeNextBestAction({
    ...input,
    mao,
    projected_spread: projectedSpread,
  })

  return {
    mao,
    projectedSpread,
    strengthScore,
    completenessScore,
    riskScore,
    riskLabel,
    dealReadiness,
    nextAction,
  }
}