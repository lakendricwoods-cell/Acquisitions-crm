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
    description: 'Build and manage real estate assignment agreements.',
    longDescription:
      'Create an assignment deal workspace with assignor, assignee, purchase contract, assignment fee, earnest money, and closing information.',
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
      'Assignment Price',
      'Total Consideration',
      'Deal Summary',
      'Contract Data',
    ],
  },
  {
    slug: 'buyer-blast',
    name: 'Buyer Blast',
    shortName: 'Buyer Blast',
    description: 'Match deals to buyers and create buyer outreach.',
    longDescription:
      'Organize your buyer criteria, calculate buyer fit, and generate a deal-focused outreach message.',
    category: 'marketing',
    icon: '◈',
    accent: 'green',
    href: '/tools/buyer-blast',
    inputs: [
      'Buyer Name',
      'Buyer Email',
      'Buyer Phone',
      'Property Type',
      'Price Range',
      'Strategy',
      'Target Area',
    ],
    outputs: [
      'Buyer Match Score',
      'Outreach Message',
      'Deal Summary',
      'Buyer Status',
    ],
  },
  {
    slug: 'closing-cost',
    name: 'Closing Cost Calculator',
    shortName: 'Closing Costs',
    description: 'Estimate acquisition, disposition, and transaction costs.',
    longDescription:
      'Calculate projected closing expenses including title, recording, taxes, prorations, commissions, and other transaction costs.',
    category: 'deal',
    icon: '$',
    accent: 'blue',
    href: '/tools/closing-cost',
    inputs: [
      'Purchase Price',
      'Title',
      'Recording',
      'Transfer Tax',
      'Property Tax',
      'Insurance',
      'Inspection',
      'Other Costs',
    ],
    outputs: [
      'Buyer Costs',
      'Seller Costs',
      'Total Costs',
      'Cash Required',
    ],
  },
  {
    slug: 'comps-analyzer',
    name: 'Comps Analyzer',
    shortName: 'Comps',
    description: 'Analyze comparable sales and calculate an estimated ARV.',
    longDescription:
      'Compare nearby sales, price per square foot, sale recency, size, and property characteristics to produce a weighted ARV estimate.',
    category: 'analysis',
    icon: '⌁',
    accent: 'gold',
    href: '/tools/comps-analyzer',
    inputs: [
      'Subject Value',
      'Subject Sq Ft',
      'Comp Sale Prices',
      'Comp Sq Ft',
      'Comp Distance',
      'Comp Sale Date',
    ],
    outputs: [
      'Average Sale Price',
      'Average Price/SF',
      'Weighted ARV',
      'Confidence',
    ],
  },
  {
    slug: 'contract-generator',
    name: 'Contract Generator',
    shortName: 'Contracts',
    description: 'Generate structured purchase contract data.',
    longDescription:
      'Prepare purchase agreement information including parties, price, financing, closing, contingencies, and assignment provisions.',
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
      'Contract Summary',
      'Deal Terms',
      'Closing Terms',
      'Contract Data',
    ],
  },
  {
    slug: 'marketing-roi',
    name: 'Marketing ROI',
    shortName: 'Marketing ROI',
    description: 'Measure marketing performance from lead to closing.',
    longDescription:
      'Track spend, leads, appointments, offers, contracts, closings, revenue, acquisition cost, and return on marketing spend.',
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
      'Conversion Rate',
      'Cost Per Deal',
      'ROI',
      'ROAS',
    ],
  },
  {
    slug: 'repair-estimator',
    name: 'Repair Estimator',
    shortName: 'Repairs',
    description: 'Estimate renovation and property repair costs.',
    longDescription:
      'Build a repair budget by category with quantities, unit costs, labor, materials, contingency, and total project cost.',
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
    ],
    outputs: [
      'Base Repairs',
      'Contingency',
      'Total Repairs',
      'Repair Level',
    ],
  },
  {
    slug: 'script-generator',
    name: 'Script Generator',
    shortName: 'Scripts',
    description: 'Create seller and buyer conversation scripts.',
    longDescription:
      'Generate structured call flows based on lead type, motivation, property condition, objections, and desired outcome.',
    category: 'operations',
    icon: '✎',
    accent: 'blue',
    href: '/tools/script-generator',
    inputs: [
      'Lead Type',
      'Motivation',
      'Property Condition',
      'Desired Outcome',
      'Objection',
      'Follow Up',
    ],
    outputs: [
      'Opening',
      'Discovery Questions',
      'Objection Response',
      'Offer Transition',
      'Follow Up',
    ],
  },
]


export function getToolConfig(slug: string): ToolConfig | undefined {
  return TOOL_CONFIGS.find((tool) => tool.slug === slug)
}