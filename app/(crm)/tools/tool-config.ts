export type ToolSlug =
  | 'assignment-contract'
  | 'buyer-blast'
  | 'closing-cost'
  | 'comps-analyzer'
  | 'contract-generator'
  | 'marketing-roi'
  | 'repair-estimator'
  | 'script-generator'

export type ToolCategory =
  | 'deal'
  | 'analysis'
  | 'marketing'
  | 'documents'
  | 'operations'

export type ToolConfig = {
  slug: ToolSlug
  name: string
  shortName: string
  description: string
  longDescription: string
  category: ToolCategory
  icon: string
  accent: 'gold' | 'green' | 'blue'
  href: string
  inputs: string[]
  outputs: string[]
}

export const TOOL_CONFIGS: ToolConfig[] = [
  {
    slug: 'assignment-contract',
    name: 'Assignment Contract',
    shortName: 'Assignment',
    description:
      'Calculate assignment deal terms and prepare an assignment summary.',
    longDescription:
      'Build an assignment deal workspace with assignor, assignee, original purchase price, assignment fee, earnest money, and closing information.',
    category: 'documents',
    icon: '▣',
    accent: 'gold',
    href: '/tools/assignment-contract',
    inputs: [
      'Property',
      'Assignor',
      'Assignee',
      'Original Purchase Price',
      'Assignment Fee',
      'Earnest Money',
      'Closing Date',
    ],
    outputs: [
      'Original Contract Price',
      'Assignment Fee',
      'Assignment Price',
      'Earnest Money',
      'Total Consideration',
      'Deal Summary',
    ],
  },

  {
    slug: 'buyer-blast',
    name: 'Buyer Blast',
    shortName: 'Buyer Blast',
    description:
      'Match a deal to buyer criteria and generate buyer outreach.',
    longDescription:
      'Enter a buyer’s acquisition criteria, estimate the buyer’s fit for the current deal, and generate a ready-to-send off-market opportunity message.',
    category: 'marketing',
    icon: '◈',
    accent: 'green',
    href: '/tools/buyer-blast',
    inputs: [
      'Buyer Name',
      'Buyer Email',
      'Buyer Phone',
      'Strategy',
      'Minimum Price',
      'Maximum Price',
      'Target Area',
    ],
    outputs: [
      'Buyer Match Score',
      'Deal Value',
      'Buyer Maximum',
      'Buyer Outreach Message',
    ],
  },

  {
    slug: 'closing-cost',
    name: 'Closing Cost Calculator',
    shortName: 'Closing Costs',
    description:
      'Estimate buyer-side acquisition and transaction closing costs.',
    longDescription:
      'Estimate projected buyer-side closing expenses including title or settlement, recording, transfer taxes, property tax prorations, insurance, inspection, and other transaction costs.',
    category: 'deal',
    icon: '$',
    accent: 'blue',
    href: '/tools/closing-cost',
    inputs: [
      'Purchase Price',
      'Title / Settlement',
      'Recording',
      'Transfer Tax',
      'Property Tax / Proration',
      'Insurance',
      'Inspection',
      'Other',
    ],
    outputs: [
      'Purchase Price',
      'Total Closing Costs',
      'Cash Required',
      'Closing Cost Percentage',
    ],
  },

  {
    slug: 'comps-analyzer',
    name: 'Comps Analyzer',
    shortName: 'Comps',
    description:
      'Analyze comparable sales and estimate after-repair value.',
    longDescription:
      'Enter comparable sales, square footage, distance, and sale age to estimate ARV using average comparable price per square foot and the subject property size.',
    category: 'analysis',
    icon: '⌁',
    accent: 'gold',
    href: '/tools/comps-analyzer',
    inputs: [
      'Subject Sq Ft',
      'Comp Sale Prices',
      'Comp Sq Ft',
      'Comp Distance',
      'Comp Age',
    ],
    outputs: [
      'Valid Comps',
      'Average Sale Price',
      'Average Price/SF',
      'Estimated ARV',
      'Confidence',
    ],
  },

  {
    slug: 'contract-generator',
    name: 'Contract Generator',
    shortName: 'Contracts',
    description:
      'Generate a structured purchase agreement term summary.',
    longDescription:
      'Prepare purchase agreement information including buyer, seller, property, purchase price, earnest money, closing date, financing, and contingencies.',
    category: 'documents',
    icon: '▤',
    accent: 'gold',
    href: '/tools/contract-generator',
    inputs: [
      'Buyer',
      'Seller',
      'Property',
      'Purchase Price',
      'Earnest Money',
      'Closing Date',
      'Financing',
      'Contingencies',
    ],
    outputs: [
      'Buyer',
      'Seller',
      'Property',
      'Purchase Price',
      'Earnest Money',
      'Closing Date',
      'Financing',
      'Contingencies',
      'Contract Term Summary',
    ],
  },

  {
    slug: 'marketing-roi',
    name: 'Marketing ROI',
    shortName: 'Marketing ROI',
    description:
      'Measure marketing performance from lead generation through closing.',
    longDescription:
      'Track marketing spend, leads, contacts, appointments, offers, contracts, closings, and revenue to measure acquisition costs, ROI, and return on ad spend.',
    category: 'marketing',
    icon: '%',
    accent: 'green',
    href: '/tools/marketing-roi',
    inputs: [
      'Marketing Spend',
      'Leads',
      'Contacts',
      'Appointments',
      'Offers',
      'Contracts',
      'Closings',
      'Revenue',
    ],
    outputs: [
      'Cost Per Lead',
      'Cost Per Contract',
      'Lead → Close Rate',
      'ROI',
      'ROAS',
    ],
  },

  {
    slug: 'repair-estimator',
    name: 'Repair Estimator',
    shortName: 'Repairs',
    description:
      'Estimate renovation and property repair costs by category.',
    longDescription:
      'Build a renovation budget using estimated costs for major repair categories and apply a contingency percentage to calculate the projected total repair budget.',
    category: 'analysis',
    icon: '⌂',
    accent: 'gold',
    href: '/tools/repair-estimator',
    inputs: [
      'Roof',
      'HVAC',
      'Plumbing',
      'Electrical',
      'Kitchen',
      'Bathrooms',
      'Flooring',
      'Paint',
      'Landscaping',
      'Other',
      'Contingency',
    ],
    outputs: [
      'Base Repairs',
      'Contingency Amount',
      'Total Repairs',
      'Repair Level',
    ],
  },

  {
    slug: 'script-generator',
    name: 'Script Generator',
    shortName: 'Scripts',
    description:
      'Create customized seller conversation scripts.',
    longDescription:
      'Generate a structured seller conversation based on lead type, seller motivation, property condition, call objective, and likely objection.',
    category: 'operations',
    icon: '✎',
    accent: 'blue',
    href: '/tools/script-generator',
    inputs: [
      'Lead Type',
      'Motivation',
      'Property Condition',
      'Call Objective',
      'Likely Objection',
    ],
    outputs: [
      'Opening',
      'Discovery Questions',
      'Objective',
      'Objection Response',
      'Offer Transition',
      'Follow Up',
    ],
  },
]

export function getToolConfig(
  slug: string
): ToolConfig | undefined {
  return TOOL_CONFIGS.find((tool) => tool.slug === slug)
}