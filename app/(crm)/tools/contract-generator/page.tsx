import { Suspense } from 'react'

import ToolWorkspace from '../tool-workspace'

function ContractGeneratorLoading() {
  return (
    <div
      style={{
        minHeight: 300,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        color: 'rgba(255,255,255,0.45)',
        fontSize: 13,
      }}
    >
      Loading contract generator...
    </div>
  )
}

export default function ContractGeneratorPage() {
  return (
    <Suspense fallback={<ContractGeneratorLoading />}>
      <ToolWorkspace slug="contract-generator" />
    </Suspense>
  )
}