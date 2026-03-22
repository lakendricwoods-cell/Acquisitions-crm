import type { SupabaseClient } from '@supabase/supabase-js'
import type { WideLeadPayload } from '@/lib/imports/propwire-map'

type AnyClient = SupabaseClient<any, any, any>

export type ImportRunCounts = {
  parsed: number
  created: number
  updated: number
  skipped: number
  failed: number
}

export async function createImportRun(
  supabase: AnyClient,
  input: {
    userId: string | null
    sourceName: string
    fileName: string | null
    parsedCount: number
  }
) {
  const { data, error } = await supabase
    .from('import_runs')
    .insert({
      user_id: input.userId,
      source_name: input.sourceName,
      file_name: input.fileName,
      parsed_count: input.parsedCount,
      status: 'running',
    })
    .select('id')
    .single()

  if (error) throw error
  return data.id as string
}

export async function writeImportRowAudit(
  supabase: AnyClient,
  input: {
    importRunId: string
    rowNumber: number
    payload: WideLeadPayload
    action: 'created' | 'updated' | 'skipped' | 'failed'
    matchedLeadId?: string | null
    errorMessage?: string | null
  }
) {
  const { error } = await supabase.from('import_rows').insert({
    import_run_id: input.importRunId,
    row_number: input.rowNumber,
    source_record_id: input.payload.source_record_id,
    apn: input.payload.apn,
    property_address_1: input.payload.property_address_1,
    zip: input.payload.zip,
    action: input.action,
    matched_lead_id: input.matchedLeadId || null,
    error_message: input.errorMessage || null,
    raw_row: input.payload.raw_import_data,
    normalized_row: input.payload,
  })

  if (error) throw error
}

export async function completeImportRun(
  supabase: AnyClient,
  input: {
    importRunId: string
    counts: ImportRunCounts
    status: 'completed' | 'completed_with_errors' | 'failed'
    notes?: string | null
  }
) {
  const { error } = await supabase
    .from('import_runs')
    .update({
      created_count: input.counts.created,
      updated_count: input.counts.updated,
      skipped_count: input.counts.skipped,
      failed_count: input.counts.failed,
      status: input.status,
      completed_at: new Date().toISOString(),
      notes: input.notes || null,
    })
    .eq('id', input.importRunId)

  if (error) throw error
}