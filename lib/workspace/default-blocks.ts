export type WorkspaceLeadSnapshot = {
  id: string
  owner_name: string | null
  owner_phone_primary: string | null
  owner_email: string | null
  lead_source: string | null
  asking_price: number | null
  arv: number | null
  mao: number | null
  projected_spread: number | null
  next_action: string | null
  notes_summary: string | null
  status: string | null
}

export function buildDefaultWorkspaceBlocks(
  workspaceId: string,
  lead: WorkspaceLeadSnapshot,
) {
  return [
    {
      workspace_id: workspaceId,
      lead_id: lead.id,
      block_type: "seller_info",
      title: "Seller + Contact",
      x: 0,
      y: 0,
      w: 6,
      h: 4,
      sort_order: 0,
      is_pinned: true,
      data: {
        owner_name: lead.owner_name,
        owner_phone_primary: lead.owner_phone_primary,
        owner_email: lead.owner_email,
        lead_source: lead.lead_source,
      },
    },
    {
      workspace_id: workspaceId,
      lead_id: lead.id,
      block_type: "deal_numbers",
      title: "Deal Numbers",
      x: 6,
      y: 0,
      w: 6,
      h: 4,
      sort_order: 1,
      is_pinned: true,
      data: {
        asking_price: lead.asking_price,
        arv: lead.arv,
        mao: lead.mao,
        projected_spread: lead.projected_spread,
      },
    },
    {
      workspace_id: workspaceId,
      lead_id: lead.id,
      block_type: "next_action",
      title: "Next Action",
      x: 0,
      y: 4,
      w: 6,
      h: 3,
      sort_order: 2,
      is_pinned: true,
      data: {
        next_action: lead.next_action,
        status: lead.status || "lead_inbox",
      },
    },
    {
      workspace_id: workspaceId,
      lead_id: lead.id,
      block_type: "notes",
      title: "Workspace Notes",
      x: 6,
      y: 4,
      w: 6,
      h: 5,
      sort_order: 3,
      is_pinned: true,
      data: {
        notes_summary: lead.notes_summary,
      },
    },
  ]
}