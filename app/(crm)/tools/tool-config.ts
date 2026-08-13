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
      'Calculate assignment pricing and organize assignment deal terms.',
    longDescription:
      'Build an assignment deal workspace with the original contract price, assignment fee, earnest money, assignor, assignee, and closing information.',
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
      'Match deals to buyers and create buyer outreach.',
    longDescription:
      'Enter a buyer buy box, compare it with the current property, calculate a basic match score, and generate a deal-focused buyer outreach message.',
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
      'Property',
    ],
    outputs: [
      'Buyer Match Score',
      'Deal Value',
      'Buyer Maximum',
      'Outreach Message',
    ],
  },

  {
    slug: 'closing-cost',
    name: 'Closing Cost Calculator',
    shortName: 'Closing Costs',
    description:
      'Estimate buyer-side acquisition and transaction costs.',
    longDescription:
      'Estimate projected acquisition closing expenses including title, recording, transfer taxes, property tax prorations, insurance, inspection, and other transaction costs.',
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
      'Other Costs',
    ],
    outputs: [
      'Purchase Price',
      'Closing Costs',
      'Cash Required',
      'Cost Percentage',
    ],
  },

  {
    slug: 'comps-analyzer',
    name: 'Comps Analyzer',
    shortName: 'Comps',
    description:
      'Analyze comparable sales and calculate an estimated ARV.',
    longDescription:
      'Compare comparable sale prices and price per square foot against the subject property to produce an estimated ARV and confidence level.',
    category: 'analysis',
    icon: '⌁',
    accent: 'gold',
    href: '/tools/comps-analyzer',
    inputs: [
      'Subject Sq Ft',
      'Comp Sale Prices',
      'Comp Sq Ft',
      'Comp Distance',
      'Comp Sale Age',
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
      'Generate structured purchase contract deal terms.',
    longDescription:
      'Prepare structured purchase agreement information including buyer, seller, property, price, earnest money, financing, closing date, and contingencies.',
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
    ],
  },

  {
    slug: 'marketing-roi',
    name: 'Marketing ROI',
    shortName: 'Marketing ROI',
    description:
      'Measure marketing performance from lead to closing.',
    longDescription:
      'Track marketing spend, leads, contacts, appointments, offers, contracts, closings, and revenue to calculate acquisition costs, conversion rate, ROI, and ROAS.',
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
      'Lead to Close Rate',
      'ROI',
      'ROAS',
    ],
  },

  {
    slug: 'repair-estimator',
    name: 'Repair Estimator',
    shortName: 'Repairs',
    description:
      'Estimate renovation and property repair costs.',
    longDescription:
      'Build a repair budget by category with estimated costs, contingency, total repairs, and an overall repair level.',
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
      'Contingency',
      'Total Repairs',
      'Repair Level',
    ],
  },

  {
    slug: 'script-generator',
    name: 'Script Generator',
    shortName: 'Scripts',
    description:
      'Create seller conversation scripts for acquisition calls.',
    longDescription:
      'Generate a structured seller conversation framework based on lead type, motivation, property condition, call objective, and likely objections.',
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