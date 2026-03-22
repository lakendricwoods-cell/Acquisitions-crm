import {
  type LeadIntelligenceInput,
  computeLeadIntelligence,
} from './lead-engine'

export type LeadIntelligenceDbPayload = {
  mao: number | null
  projected_spread: number | null
  heat_score: number
  completeness_score: number
  risk_score: number
  risk_label: string
  deal_readiness: string
  next_action: string
}

export function mapLeadIntelligenceToDbPayload(
  input: LeadIntelligenceInput,
): LeadIntelligenceDbPayload {
  const intelligence = computeLeadIntelligence(input)

  return {
    mao: intelligence.mao,
    projected_spread: intelligence.projectedSpread,
    heat_score: intelligence.strengthScore,
    completeness_score: intelligence.completenessScore,
    risk_score: intelligence.riskScore,
    risk_label: intelligence.riskLabel,
    deal_readiness: intelligence.dealReadiness,
    next_action: intelligence.nextAction,
  }
}