import type { SupabaseClient } from '@supabase/supabase-js'
import { calculateLeadScoreV2 } from '@/lib/intelligence/lead-score-v2'
import type { WideLeadPayload } from '@/lib/imports/propwire-map'

type AnyClient = SupabaseClient<any, any, any>

export async function upsertWideLead(
  supabase: AnyClient,
  mapped: WideLeadPayload,
  userId: string
) {
  const existing = await findExistingLead(supabase, mapped)

  const score = calculateLeadScoreV2({
    ...mapped,
    owner_phone_primary: null,
    owner_email: null,
  } as any)

  const payload = {
    ...mapped,
    heat_score: score.overallStrength ?? score.overall ?? null,
    completeness_score: score.marketability ?? null,
    updated_at: new Date().toISOString(),
  }

  if (existing) {
    const mergedIntelligence = {
      ...(existing.lead_intelligence || {}),
      ...(mapped.lead_intelligence || {}),
    }

    const { error } = await supabase
      .from('leads')
      .update({
        ...payload,
        lead_intelligence: mergedIntelligence,
        raw_import_data: mapped.raw_import_data,
        source_columns: mapped.source_columns,
        assigned_user_id: existing.assigned_user_id || userId,
      })
      .eq('id', existing.id)

    if (error) throw error

    return { action: 'updated' as const, leadId: existing.id }
  }

  const { data, error } = await supabase
    .from('leads')
    .insert({
      ...payload,
      created_by_user_id: userId,
      assigned_user_id: userId,
      contact_attempts: 0,
      next_action: mapped.owner_name
        ? 'Review imported property signals and begin qualification'
        : 'Enrich owner and contact data',
      created_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (error) throw error

  return { action: 'created' as const, leadId: data.id as string }
}

async function findExistingLead(
  supabase: AnyClient,
  mapped: WideLeadPayload
) {
  if (mapped.source_record_id) {
    const { data } = await supabase
      .from('leads')
      .select('id, assigned_user_id, lead_intelligence')
      .eq('source_name', mapped.source_name)
      .eq('source_record_id', mapped.source_record_id)
      .maybeSingle()

    if (data) return data
  }

  if (mapped.apn) {
    const { data } = await supabase
      .from('leads')
      .select('id, assigned_user_id, lead_intelligence')
      .eq('apn', mapped.apn)
      .maybeSingle()

    if (data) return data
  }

  if (mapped.property_address_1 && mapped.zip) {
    const { data } = await supabase
      .from('leads')
      .select('id, assigned_user_id, lead_intelligence')
      .eq('property_address_1', mapped.property_address_1)
      .eq('zip', mapped.zip)
      .maybeSingle()

    if (data) return data
  }

  return null
}