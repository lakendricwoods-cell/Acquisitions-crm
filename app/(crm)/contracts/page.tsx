"use client"

import { useMemo } from "react"
import PageShell from "@/components/ui/page-shell"
import SectionCard from "@/components/ui/section-card"
import ActionButton from "@/components/ui/action-button"
import StatPill from "@/components/ui/stat-pill"

type ContractTemplate = {
  id: string
  title: string
  description: string
  updated: string
}

const CONTRACTS: ContractTemplate[] = [
  {
    id: "purchase-agreement",
    title: "Purchase Agreement",
    description: "Standard wholesale purchase agreement for putting a seller under contract.",
    updated: "2026-03-01",
  },
  {
    id: "assignment-contract",
    title: "Assignment Contract",
    description: "Assignment agreement for transferring contract rights to an end buyer.",
    updated: "2026-03-01",
  },
  {
    id: "wholesale-agreement",
    title: "Wholesale Agreement",
    description: "Master wholesale transaction document for the full assignment workflow.",
    updated: "2026-03-01",
  },
  {
    id: "option-contract",
    title: "Option Contract",
    description: "Option structure for securing a deal without immediate purchase execution.",
    updated: "2026-03-01",
  },
  {
    id: "joint-venture",
    title: "Joint Venture Agreement",
    description: "JV structure for collaborating with another wholesaler or capital partner.",
    updated: "2026-03-01",
  },
  {
    id: "proof-of-funds",
    title: "Proof of Funds Letter",
    description: "Template proof-of-funds support letter for seller confidence and negotiation.",
    updated: "2026-03-01",
  },
]

export default function ContractsPage() {
  const templateCount = CONTRACTS.length
  const recentCount = useMemo(
    () => CONTRACTS.filter((item) => item.updated >= "2026-03-01").length,
    [],
  )

  return (
    <PageShell
      title="Contract Templates"
      subtitle="Ready-to-use wholesale documents with a premium contract library layout."
      actions={
        <>
          <StatPill label="Templates" value={templateCount} />
          <StatPill label="Recently Updated" value={recentCount} />
        </>
      }
    >
      <SectionCard
        title="Contract Library"
        subtitle="Download, customize, and keep your deal documents organized in one place."
        actions={<ActionButton tone="gold">Generate Custom Contract with AI</ActionButton>}
      >
        <div style={contractGridStyle}>
          {CONTRACTS.map((contract) => (
            <div key={contract.id} style={contractCardStyle}>
              <div style={contractIconStyle} />
              <div style={contractTitleStyle}>{contract.title}</div>
              <div style={contractDescriptionStyle}>{contract.description}</div>
              <div style={contractUpdatedStyle}>
                Updated: {new Date(contract.updated).toLocaleDateString()}
              </div>

              <div style={contractActionRowStyle}>
                <ActionButton tone="gold">Download</ActionButton>
                <ActionButton compact>Preview</ActionButton>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title="Download All Contracts"
        subtitle="Grab the full bundle in one click for faster deal setup."
        actions={<ActionButton tone="gold">Download Bundle</ActionButton>}
      >
        <div className="crm-muted">
          Use this as your fast-start legal pack for seller contracts, assignments, and buyer-side closing docs.
        </div>
      </SectionCard>
    </PageShell>
  )
}

const contractGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: 14,
} satisfies React.CSSProperties

const contractCardStyle = {
  display: "grid",
  gap: 12,
  padding: 16,
  borderRadius: 22,
  border: "1px solid rgba(255,255,255,0.06)",
  background: "rgba(255,255,255,0.02)",
  minHeight: 220,
} satisfies React.CSSProperties

const contractIconStyle = {
  width: 44,
  height: 44,
  borderRadius: 14,
  background: "linear-gradient(180deg, #ebc477 0%, #d6a64b 100%)",
  boxShadow: "0 10px 24px rgba(214,166,75,0.16)",
} satisfies React.CSSProperties

const contractTitleStyle = {
  fontSize: 18,
  fontWeight: 760,
  letterSpacing: "-0.03em",
  color: "var(--white-hi)",
} satisfies React.CSSProperties

const contractDescriptionStyle = {
  fontSize: 13,
  lineHeight: 1.55,
  color: "var(--white-soft)",
} satisfies React.CSSProperties

const contractUpdatedStyle = {
  fontSize: 11,
  color: "var(--white-faint)",
} satisfies React.CSSProperties

const contractActionRowStyle = {
  display: "flex",
  gap: 8,
  marginTop: "auto",
  flexWrap: "wrap",
} satisfies React.CSSProperties