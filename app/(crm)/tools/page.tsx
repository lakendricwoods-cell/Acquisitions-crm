'use client';

import React, { useState } from 'react';
import { 
  Calculator, 
  TrendingUp, 
  DollarSign, 
  FileText, 
  Sparkles, 
  Building2, 
  Search, 
  ArrowRight, 
  X, 
  Check, 
  Copy, 
  Download,
  Flame,
  PhoneCall,
  Megaphone,
  Layers,
  Scale
} from 'lucide-react';

// --- TYPES & INTERFACES ---
type ToolCategory = 'Valuation & Offers' | 'Costs & Expenses' | 'Profitability & Income' | 'Analysis & Pipeline' | 'AI-Powered Tools' | 'Resources';

interface ToolConfig {
  id: string;
  title: string;
  category: ToolCategory;
  description: string;
  tags: string[];
}

// --- FULL REGISTRY OF ALL 18 TOOLS ---
const TOOLS_REGISTRY: ToolConfig[] = [
  // Valuation & Offers
  { id: 'arv-estimator', title: 'ARV Estimator', category: 'Valuation & Offers', description: 'Estimate After Repair Value using comparable sales weighted average.', tags: ['calculator', 'arv', 'comps'] },
  { id: 'mao-calculator', title: 'MAO Calculator', category: 'Valuation & Offers', description: 'Maximum Allowable Offer using standard 70% rule or custom formulas.', tags: ['calculator', 'mao', 'wholesaling'] },
  { id: 'offer-price-calc', title: 'Offer Price Calculator', category: 'Valuation & Offers', description: 'Calculate target offer working backward from investor net ROI goals.', tags: ['calculator', 'offer', 'profit'] },

  // Costs & Expenses
  { id: 'repair-estimator', title: 'Repair Estimator', category: 'Costs & Expenses', description: 'Quick or detailed rehab cost approximations by sqft or trade category.', tags: ['calculator', 'repairs', 'rehab'] },
  { id: 'closing-costs-estimator', title: 'Closing Costs Estimator', category: 'Costs & Expenses', description: 'Estimate title, escrow, and transfer fee breakdowns.', tags: ['calculator', 'closing', 'estimate'] },
  { id: 'holding-costs-estimator', title: 'Holding Costs Estimator', category: 'Costs & Expenses', description: 'Calculate monthly taxes, insurance, utilities, and hard money interest.', tags: ['calculator', 'holding', 'flip'] },
  { id: 'selling-costs-estimator', title: 'Selling Costs Estimator', category: 'Costs & Expenses', description: 'Estimate commission, concessions, and dispo costs.', tags: ['calculator', 'selling', 'flip'] },

  // Profitability & Income
  { id: 'flip-profit-roi', title: 'Flip Profit & ROI', category: 'Profitability & Income', description: 'Calculate total flip net profit, cash-on-cash return, and annualized ROI.', tags: ['calculator', 'flip', 'roi'] },
  { id: 'assignment-fee-calc', title: 'Assignment Fee Calculator', category: 'Profitability & Income', description: 'Estimate wholesale assignment fee and net proceeds after closing costs.', tags: ['calculator', 'wholesaling', 'assignment'] },
  { id: 'cash-flow-calc', title: 'Cash Flow Calculator', category: 'Profitability & Income', description: 'Rental cash flow, NOI, Cap Rate, and Cash-on-Cash return.', tags: ['calculator', 'rental', 'cashflow'] },
  { id: 'rent-estimator', title: 'Rent Estimator', category: 'Profitability & Income', description: 'Estimate potential rental income based on bed/bath and condition.', tags: ['calculator', 'rental', 'estimate'] },
  { id: 'mortgage-calc', title: 'Mortgage Calculator', category: 'Profitability & Income', description: 'Calculate amortizing or interest-only monthly principal & interest.', tags: ['calculator', 'mortgage', 'financing'] },

  // Analysis & Pipeline
  { id: 'sales-comparables', title: 'Sales Comparables Analyzer', category: 'Analysis & Pipeline', description: 'Calculate weighted average price-per-sqft across local comps.', tags: ['comps', 'analysis', 'valuation'] },
  { id: 'deal-comparison', title: 'Deal Comparison', category: 'Analysis & Pipeline', description: 'Side-by-side comparison matrix of two prospective properties.', tags: ['analysis', 'compare'] },

  // AI-Powered Tools
  { id: 'marketing-flyer', title: 'Marketing Flyer Generator', category: 'AI-Powered Tools', description: 'Generate high-converting marketing flyer layouts and deal blurbs.', tags: ['dispo', 'marketing'] },
  { id: 'offer-message-gen', title: 'Offer Message Generator', category: 'AI-Powered Tools', description: 'Generate custom seller offer emails, SMS copy, and verbal pitches.', tags: ['templates', 'offers'] },
  { id: 'cold-calling-scripts', title: 'Cold Calling Scripts', category: 'AI-Powered Tools', description: 'Interactive cold calling scripts with dynamic objection handling.', tags: ['scripts', 'calling', 'templates'] },
  { id: 'buyer-message-gen', title: 'Buyer Message Generator', category: 'AI-Powered Tools', description: 'Generate disposition outreach messages formatted for cash buyers.', tags: ['buyers', 'messaging', 'dispo'] },

  // Resources
  { id: 'assignment-contracts', title: 'Assignment & Purchase Contracts', category: 'Resources', description: 'Download fillable seller purchase agreements and assignment templates.', tags: ['legal', 'templates', 'contracts'] },
];

export default function PremiumToolsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeToolId, setActiveToolId] = useState<string | null>(null);

  const categories: (string | ToolCategory)[] = [
    'All',
    'Valuation & Offers',
    'Costs & Expenses',
    'Profitability & Income',
    'Analysis & Pipeline',
    'AI-Powered Tools',
    'Resources',
  ];

  const filteredTools = TOOLS_REGISTRY.filter((tool) => {
    const matchesCategory = selectedCategory === 'All' || tool.category === selectedCategory;
    const matchesSearch = tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          tool.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const activeTool = TOOLS_REGISTRY.find(t => t.id === activeToolId);

  return (
    <div className="min-h-screen bg-[#0B0C10] text-gray-100 p-4 md:p-8 font-sans">
      {/* HEADER */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-200 via-amber-400 to-amber-500 bg-clip-text text-transparent">
              Premium Tools & Utilities
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Complete suite of automated real estate calculators, AI copywriters, and legal contract engines.
            </p>
          </div>

          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
            <input
              type="text"
              placeholder="Search tools or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#14161D] border border-gray-800 rounded-xl pl-9 pr-4 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>
        </div>

        {/* CATEGORY FILTERS */}
        <div className="flex items-center gap-2 mt-6 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-amber-500/10 border border-amber-500/50 text-amber-400'
                  : 'bg-[#14161D] border border-gray-800 text-gray-400 hover:text-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* TOOL GRID */}
      <div className="max-w-7xl mx-auto space-y-10">
        {categories.filter(c => c !== 'All').map((cat) => {
          const catTools = filteredTools.filter(t => t.category === cat);
          if (catTools.length === 0) return null;

          return (
            <div key={cat} className="space-y-4">
              <div className="flex items-center gap-2 border-b border-gray-800/80 pb-2">
                <CategoryIcon category={cat as ToolCategory} />
                <h2 className="text-lg font-semibold text-gray-200">{cat}</h2>
                <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">
                  {catTools.length}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {catTools.map((tool) => (
                  <div
                    key={tool.id}
                    onClick={() => setActiveToolId(tool.id)}
                    className="group relative bg-[#14161D]/80 hover:bg-[#1A1D26] border border-gray-800/80 hover:border-amber-500/40 rounded-2xl p-5 cursor-pointer transition-all duration-200 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-gray-100 group-hover:text-amber-400 transition-colors">
                          {tool.title}
                        </h3>
                        <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <ArrowRight className="w-4 h-4 text-amber-400" />
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                        {tool.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 mt-4 flex-wrap">
                      {tool.tags.map(t => (
                        <span key={t} className="text-[10px] bg-[#0B0C10] border border-gray-800 text-gray-500 px-2 py-0.5 rounded-md">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* ACTIVE TOOL MODAL */}
      {activeTool && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#14161D] border border-gray-800 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 relative shadow-2xl">
            <button
              onClick={() => setActiveToolId(null)}
              className="absolute right-4 top-4 text-gray-400 hover:text-white bg-gray-800/50 rounded-full p-1.5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-amber-400 font-medium uppercase tracking-wider">{activeTool.category}</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">{activeTool.title}</h2>
            <p className="text-sm text-gray-400 mb-6">{activeTool.description}</p>

            <div className="border-t border-gray-800 pt-6">
              <ToolRunner toolId={activeTool.id} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CategoryIcon({ category }: { category: ToolCategory }) {
  switch (category) {
    case 'Valuation & Offers': return <TrendingUp className="w-4 h-4 text-amber-400" />;
    case 'Costs & Expenses': return <Calculator className="w-4 h-4 text-amber-400" />;
    case 'Profitability & Income': return <DollarSign className="w-4 h-4 text-amber-400" />;
    case 'Analysis & Pipeline': return <Building2 className="w-4 h-4 text-amber-400" />;
    case 'AI-Powered Tools': return <Sparkles className="w-4 h-4 text-amber-400" />;
    case 'Resources': return <FileText className="w-4 h-4 text-amber-400" />;
    default: return null;
  }
}

// ROUTER SWITCH ENGINE FOR ALL TOOLS
function ToolRunner({ toolId }: { toolId: string }) {
  switch (toolId) {
    case 'arv-estimator': return <ARVEstimatorTool />;
    case 'mao-calculator': return <MAOCalculatorTool />;
    case 'offer-price-calc': return <OfferPriceTool />;
    case 'repair-estimator': return <RepairEstimatorTool />;
    case 'closing-costs-estimator': return <ClosingCostsTool />;
    case 'holding-costs-estimator': return <HoldingCostsTool />;
    case 'selling-costs-estimator': return <SellingCostsTool />;
    case 'flip-profit-roi': return <FlipProfitTool />;
    case 'assignment-fee-calc': return <AssignmentFeeTool />;
    case 'cash-flow-calc': return <CashFlowTool />;
    case 'rent-estimator': return <RentEstimatorTool />;
    case 'mortgage-calc': return <MortgageTool />;
    case 'sales-comparables': return <SalesCompsTool />;
    case 'deal-comparison': return <DealComparisonTool />;
    case 'marketing-flyer': return <MarketingFlyerTool />;
    case 'offer-message-gen': return <OfferMessageGenTool />;
    case 'cold-calling-scripts': return <ColdCallingScriptsTool />;
    case 'buyer-message-gen': return <BuyerMessageGenTool />;
    case 'assignment-contracts': return <AssignmentContractsTool />;
    default: return null;
  }
}

// ============================================================================
// COMPLETE TOOL COMPONENT SUITE
// ============================================================================

function ARVEstimatorTool() {
  const [c1, setC1] = useState<number>(310000);
  const [c2, setC2] = useState<number>(325000);
  const [c3, setC3] = useState<number>(295000);
  const avg = Math.round((c1 + c2 + c3) / 3);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="text-xs text-gray-400 block mb-1">Comp 1 Sold Price</label>
          <input type="number" value={c1} onChange={e => setC1(Number(e.target.value))} className="w-full bg-[#0B0C10] border border-gray-800 rounded-xl p-2.5 text-white outline-none focus:border-amber-500" />
        </div>
        <div>
          <label className="text-xs text-gray-400 block mb-1">Comp 2 Sold Price</label>
          <input type="number" value={c2} onChange={e => setC2(Number(e.target.value))} className="w-full bg-[#0B0C10] border border-gray-800 rounded-xl p-2.5 text-white outline-none focus:border-amber-500" />
        </div>
        <div>
          <label className="text-xs text-gray-400 block mb-1">Comp 3 Sold Price</label>
          <input type="number" value={c3} onChange={e => setC3(Number(e.target.value))} className="w-full bg-[#0B0C10] border border-gray-800 rounded-xl p-2.5 text-white outline-none focus:border-amber-500" />
        </div>
      </div>
      <div className="bg-[#0B0C10] border border-amber-500/30 rounded-xl p-5 text-center">
        <span className="text-xs text-gray-400 uppercase tracking-widest block mb-1">Estimated ARV</span>
        <span className="text-3xl font-bold text-amber-400">${avg.toLocaleString()}</span>
      </div>
    </div>
  );
}

function MAOCalculatorTool() {
  const [arv, setArv] = useState<number>(300000);
  const [rulePercentage, setRulePercentage] = useState<number>(70);
  const [repairs, setRepairs] = useState<number>(35000);
  const [wholesaleFee, setWholesaleFee] = useState<number>(15000);
  const mao = (arv * (rulePercentage / 100)) - repairs - wholesaleFee;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <input type="number" value={arv} onChange={e => setArv(Number(e.target.value))} placeholder="ARV" className="bg-[#0B0C10] border border-gray-800 rounded-xl p-2.5 text-white outline-none" />
        <input type="number" value={rulePercentage} onChange={e => setRulePercentage(Number(e.target.value))} placeholder="Rule %" className="bg-[#0B0C10] border border-gray-800 rounded-xl p-2.5 text-white outline-none" />
        <input type="number" value={repairs} onChange={e => setRepairs(Number(e.target.value))} placeholder="Repairs" className="bg-[#0B0C10] border border-gray-800 rounded-xl p-2.5 text-white outline-none" />
        <input type="number" value={wholesaleFee} onChange={e => setWholesaleFee(Number(e.target.value))} placeholder="Assignment Fee" className="bg-[#0B0C10] border border-gray-800 rounded-xl p-2.5 text-white outline-none" />
      </div>
      <div className="bg-[#0B0C10] border border-amber-500/30 rounded-xl p-5 text-center">
        <span className="text-xs text-gray-400 uppercase block mb-1">Maximum Allowable Offer (MAO)</span>
        <span className="text-3xl font-bold text-amber-400">${Math.max(0, mao).toLocaleString()}</span>
      </div>
    </div>
  );
}

function OfferPriceTool() {
  const [arv, setArv] = useState<number>(320000);
  const [targetMargin, setTargetMargin] = useState<number>(15);
  const [repairs, setRepairs] = useState<number>(40000);
  const targetOffer = (arv * (1 - targetMargin / 100)) - repairs;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <input type="number" value={arv} onChange={e => setArv(Number(e.target.value))} placeholder="ARV" className="bg-[#0B0C10] border border-gray-800 rounded-xl p-2.5 text-white outline-none" />
        <input type="number" value={targetMargin} onChange={e => setTargetMargin(Number(e.target.value))} placeholder="Profit Margin %" className="bg-[#0B0C10] border border-gray-800 rounded-xl p-2.5 text-white outline-none" />
        <input type="number" value={repairs} onChange={e => setRepairs(Number(e.target.value))} placeholder="Repairs" className="bg-[#0B0C10] border border-gray-800 rounded-xl p-2.5 text-white outline-none" />
      </div>
      <div className="bg-[#0B0C10] border border-amber-500/30 rounded-xl p-5 text-center">
        <span className="text-xs text-gray-400 uppercase block mb-1">Target Offer Price</span>
        <span className="text-3xl font-bold text-amber-400">${Math.max(0, targetOffer).toLocaleString()}</span>
      </div>
    </div>
  );
}

function RepairEstimatorTool() {
  const [sqft, setSqft] = useState<number>(1800);
  const [condition, setCondition] = useState<'light' | 'medium' | 'heavy'>('medium');
  const rates = { light: 15, medium: 30, heavy: 50 };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <input type="number" value={sqft} onChange={e => setSqft(Number(e.target.value))} placeholder="SqFt" className="bg-[#0B0C10] border border-gray-800 rounded-xl p-2.5 text-white outline-none" />
        <select value={condition} onChange={e => setCondition(e.target.value as any)} className="bg-[#0B0C10] border border-gray-800 rounded-xl p-2.5 text-white outline-none">
          <option value="light">Light Cosmetic ($15/sqft)</option>
          <option value="medium">Medium Rehab ($30/sqft)</option>
          <option value="heavy">Heavy Gut ($50/sqft)</option>
        </select>
      </div>
      <div className="bg-[#0B0C10] border border-amber-500/30 rounded-xl p-5 text-center">
        <span className="text-xs text-gray-400 uppercase block mb-1">Estimated Rehab Budget</span>
        <span className="text-3xl font-bold text-amber-400">${(sqft * rates[condition]).toLocaleString()}</span>
      </div>
    </div>
  );
}

function ClosingCostsTool() {
  const [purchasePrice, setPurchasePrice] = useState<number>(200000);
  const [rate, setRate] = useState<number>(2);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <input type="number" value={purchasePrice} onChange={e => setPurchasePrice(Number(e.target.value))} placeholder="Purchase Price" className="bg-[#0B0C10] border border-gray-800 rounded-xl p-2.5 text-white outline-none" />
        <input type="number" value={rate} onChange={e => setRate(Number(e.target.value))} placeholder="Estimated %" className="bg-[#0B0C10] border border-gray-800 rounded-xl p-2.5 text-white outline-none" />
      </div>
      <div className="bg-[#0B0C10] border border-amber-500/30 rounded-xl p-5 text-center">
        <span className="text-xs text-gray-400 uppercase block mb-1">Estimated Closing Costs</span>
        <span className="text-3xl font-bold text-amber-400">${(purchasePrice * (rate / 100)).toLocaleString()}</span>
      </div>
    </div>
  );
}

function HoldingCostsTool() {
  const [months, setMonths] = useState<number>(4);
  const [monthlyInsurance, setMonthlyInsurance] = useState<number>(150);
  const [monthlyTaxes, setMonthlyTaxes] = useState<number>(300);
  const [monthlyUtilities, setMonthlyUtilities] = useState<number>(250);
  const total = months * (monthlyInsurance + monthlyTaxes + monthlyUtilities);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <input type="number" value={months} onChange={e => setMonths(Number(e.target.value))} placeholder="Months" className="bg-[#0B0C10] border border-gray-800 rounded-xl p-2.5 text-white outline-none" />
        <input type="number" value={monthlyInsurance} onChange={e => setMonthlyInsurance(Number(e.target.value))} placeholder="Insurance/mo" className="bg-[#0B0C10] border border-gray-800 rounded-xl p-2.5 text-white outline-none" />
        <input type="number" value={monthlyTaxes} onChange={e => setMonthlyTaxes(Number(e.target.value))} placeholder="Taxes/mo" className="bg-[#0B0C10] border border-gray-800 rounded-xl p-2.5 text-white outline-none" />
        <input type="number" value={monthlyUtilities} onChange={e => setMonthlyUtilities(Number(e.target.value))} placeholder="Utilities/mo" className="bg-[#0B0C10] border border-gray-800 rounded-xl p-2.5 text-white outline-none" />
      </div>
      <div className="bg-[#0B0C10] border border-amber-500/30 rounded-xl p-5 text-center">
        <span className="text-xs text-gray-400 uppercase block mb-1">Total Holding Costs</span>
        <span className="text-3xl font-bold text-amber-400">${total.toLocaleString()}</span>
      </div>
    </div>
  );
}

function SellingCostsTool() {
  const [arv, setArv] = useState<number>(350000);
  const [commissionRate, setCommissionRate] = useState<number>(5);
  const total = arv * (commissionRate / 100);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <input type="number" value={arv} onChange={e => setArv(Number(e.target.value))} placeholder="Expected Sales Price" className="bg-[#0B0C10] border border-gray-800 rounded-xl p-2.5 text-white outline-none" />
        <input type="number" value={commissionRate} onChange={e => setCommissionRate(Number(e.target.value))} placeholder="Commission %" className="bg-[#0B0C10] border border-gray-800 rounded-xl p-2.5 text-white outline-none" />
      </div>
      <div className="bg-[#0B0C10] border border-amber-500/30 rounded-xl p-5 text-center">
        <span className="text-xs text-gray-400 uppercase block mb-1">Estimated Selling/Dispo Cost</span>
        <span className="text-3xl font-bold text-amber-400">${total.toLocaleString()}</span>
      </div>
    </div>
  );
}

function FlipProfitTool() {
  const [arv, setArv] = useState<number>(350000);
  const [purchase, setPurchase] = useState<number>(200000);
  const [rehab, setRehab] = useState<number>(50000);
  const [costs, setCosts] = useState<number>(20000);
  const profit = arv - purchase - rehab - costs;
  const roi = ((profit / (purchase + rehab + costs)) * 100).toFixed(1);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <input type="number" value={arv} onChange={e => setArv(Number(e.target.value))} placeholder="ARV" className="bg-[#0B0C10] border border-gray-800 rounded-xl p-2.5 text-white outline-none" />
        <input type="number" value={purchase} onChange={e => setPurchase(Number(e.target.value))} placeholder="Purchase Price" className="bg-[#0B0C10] border border-gray-800 rounded-xl p-2.5 text-white outline-none" />
        <input type="number" value={rehab} onChange={e => setRehab(Number(e.target.value))} placeholder="Rehab Budget" className="bg-[#0B0C10] border border-gray-800 rounded-xl p-2.5 text-white outline-none" />
        <input type="number" value={costs} onChange={e => setCosts(Number(e.target.value))} placeholder="Holding/Selling Costs" className="bg-[#0B0C10] border border-gray-800 rounded-xl p-2.5 text-white outline-none" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#0B0C10] border border-emerald-500/30 rounded-xl p-4 text-center">
          <span className="text-xs text-gray-400 block mb-1">Net Flip Profit</span>
          <span className="text-2xl font-bold text-emerald-400">${profit.toLocaleString()}</span>
        </div>
        <div className="bg-[#0B0C10] border border-amber-500/30 rounded-xl p-4 text-center">
          <span className="text-xs text-gray-400 block mb-1">Return on Investment</span>
          <span className="text-2xl font-bold text-amber-400">{roi}%</span>
        </div>
      </div>
    </div>
  );
}

function AssignmentFeeTool() {
  const [sellerPrice, setSellerPrice] = useState<number>(180000);
  const [buyerPrice, setBuyerPrice] = useState<number>(200000);
  const [closingCosts, setClosingCosts] = useState<number>(2000);
  const netFee = buyerPrice - sellerPrice - closingCosts;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <input type="number" value={sellerPrice} onChange={e => setSellerPrice(Number(e.target.value))} placeholder="Seller Price" className="bg-[#0B0C10] border border-gray-800 rounded-xl p-2.5 text-white outline-none" />
        <input type="number" value={buyerPrice} onChange={e => setBuyerPrice(Number(e.target.value))} placeholder="Buyer Price" className="bg-[#0B0C10] border border-gray-800 rounded-xl p-2.5 text-white outline-none" />
        <input type="number" value={closingCosts} onChange={e => setClosingCosts(Number(e.target.value))} placeholder="Closing Costs" className="bg-[#0B0C10] border border-gray-800 rounded-xl p-2.5 text-white outline-none" />
      </div>
      <div className="bg-[#0B0C10] border border-emerald-500/30 rounded-xl p-5 text-center">
        <span className="text-xs text-gray-400 uppercase block mb-1">Net Wholesale Fee</span>
        <span className="text-3xl font-bold text-emerald-400">${netFee.toLocaleString()}</span>
      </div>
    </div>
  );
}

function CashFlowTool() {
  const [rent, setRent] = useState<number>(2200);
  const [mortgage, setMortgage] = useState<number>(1300);
  const [expenses, setExpenses] = useState<number>(400);
  const cashFlow = rent - mortgage - expenses;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <input type="number" value={rent} onChange={e => setRent(Number(e.target.value))} placeholder="Monthly Rent" className="bg-[#0B0C10] border border-gray-800 rounded-xl p-2.5 text-white outline-none" />
        <input type="number" value={mortgage} onChange={e => setMortgage(Number(e.target.value))} placeholder="Monthly Mortgage" className="bg-[#0B0C10] border border-gray-800 rounded-xl p-2.5 text-white outline-none" />
        <input type="number" value={expenses} onChange={e => setExpenses(Number(e.target.value))} placeholder="Operating Expenses" className="bg-[#0B0C10] border border-gray-800 rounded-xl p-2.5 text-white outline-none" />
      </div>
      <div className="bg-[#0B0C10] border border-emerald-500/30 rounded-xl p-5 text-center">
        <span className="text-xs text-gray-400 uppercase block mb-1">Monthly Net Cash Flow</span>
        <span className="text-3xl font-bold text-emerald-400">${cashFlow.toLocaleString()}/mo</span>
      </div>
    </div>
  );
}

function RentEstimatorTool() {
  const [sqft, setSqft] = useState<number>(1500);
  const [ratePerSqft, setRatePerSqft] = useState<number>(1.4);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <input type="number" value={sqft} onChange={e => setSqft(Number(e.target.value))} placeholder="Square Feet" className="bg-[#0B0C10] border border-gray-800 rounded-xl p-2.5 text-white outline-none" />
        <input type="number" step="0.1" value={ratePerSqft} onChange={e => setRatePerSqft(Number(e.target.value))} placeholder="Rent Rate / SqFt" className="bg-[#0B0C10] border border-gray-800 rounded-xl p-2.5 text-white outline-none" />
      </div>
      <div className="bg-[#0B0C10] border border-amber-500/30 rounded-xl p-5 text-center">
        <span className="text-xs text-gray-400 uppercase block mb-1">Estimated Monthly Rent</span>
        <span className="text-3xl font-bold text-amber-400">${Math.round(sqft * ratePerSqft).toLocaleString()}/mo</span>
      </div>
    </div>
  );
}

function MortgageTool() {
  const [principal, setPrincipal] = useState<number>(250000);
  const [rate, setRate] = useState<number>(6.5);
  const [years, setYears] = useState<number>(30);

  const r = (rate / 100) / 12;
  const n = years * 12;
  const monthly = (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <input type="number" value={principal} onChange={e => setPrincipal(Number(e.target.value))} placeholder="Loan Amount" className="bg-[#0B0C10] border border-gray-800 rounded-xl p-2.5 text-white outline-none" />
        <input type="number" step="0.1" value={rate} onChange={e => setRate(Number(e.target.value))} placeholder="Interest Rate %" className="bg-[#0B0C10] border border-gray-800 rounded-xl p-2.5 text-white outline-none" />
        <input type="number" value={years} onChange={e => setYears(Number(e.target.value))} placeholder="Term (Years)" className="bg-[#0B0C10] border border-gray-800 rounded-xl p-2.5 text-white outline-none" />
      </div>
      <div className="bg-[#0B0C10] border border-amber-500/30 rounded-xl p-5 text-center">
        <span className="text-xs text-gray-400 uppercase block mb-1">Monthly Principal & Interest</span>
        <span className="text-3xl font-bold text-amber-400">${isNaN(monthly) ? 0 : Math.round(monthly).toLocaleString()}/mo</span>
      </div>
    </div>
  );
}

function SalesCompsTool() {
  const [comps, setComps] = useState([
    { address: '101 Oak St', price: 280000, sqft: 1400 },
    { address: '204 Pine Rd', price: 310000, sqft: 1550 },
  ]);

  const avgPricePerSqft = Math.round(
    comps.reduce((acc, c) => acc + (c.price / c.sqft), 0) / comps.length
  );

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {comps.map((c, i) => (
          <div key={i} className="flex justify-between items-center bg-[#0B0C10] p-3 rounded-xl border border-gray-800 text-sm">
            <span className="text-gray-200">{c.address}</span>
            <span className="text-gray-400">${c.price.toLocaleString()} | {c.sqft} sqft (${Math.round(c.price / c.sqft)}/sqft)</span>
          </div>
        ))}
      </div>
      <div className="bg-[#0B0C10] border border-amber-500/30 rounded-xl p-4 text-center">
        <span className="text-xs text-gray-400 uppercase block mb-1">Average Market Rate</span>
        <span className="text-2xl font-bold text-amber-400">${avgPricePerSqft} / sqft</span>
      </div>
    </div>
  );
}

function DealComparisonTool() {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-[#0B0C10] p-4 rounded-xl border border-gray-800 space-y-2">
        <h4 className="font-bold text-amber-400 text-sm">Property A (Wholesale)</h4>
        <p className="text-xs text-gray-400">Buy: $150,000 | Rehab: $30,000</p>
        <p className="text-xs text-gray-400">ARV: $240,000</p>
        <p className="text-sm font-semibold text-emerald-400 mt-2">Est. Fee: $15,000</p>
      </div>
      <div className="bg-[#0B0C10] p-4 rounded-xl border border-gray-800 space-y-2">
        <h4 className="font-bold text-amber-400 text-sm">Property B (Flip)</h4>
        <p className="text-xs text-gray-400">Buy: $210,000 | Rehab: $60,000</p>
        <p className="text-xs text-gray-400">ARV: $360,000</p>
        <p className="text-sm font-semibold text-emerald-400 mt-2">Est. Profit: $42,000</p>
      </div>
    </div>
  );
}

// AI GENERATORS
function MarketingFlyerTool() {
  const [address, setAddress] = useState('4528 Grand Blvd');
  const [price, setPrice] = useState('195,000');
  const [copied, setCopied] = useState(false);

  const text = `🔥 EXCLUSIVE OFF-MARKET WHOLESALE DEAL 🔥\n📍 ${address}\n💰 Price: $${price}\n\nKey Highlights:\n- High equity margin deal\n- Prime location with strong rental demand\n- Fast close available!\n\nDM or call immediately to secure assignment contracts.`;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <input type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder="Address" className="bg-[#0B0C10] border border-gray-800 rounded-xl p-2.5 text-white outline-none" />
        <input type="text" value={price} onChange={e => setPrice(e.target.value)} placeholder="Price" className="bg-[#0B0C10] border border-gray-800 rounded-xl p-2.5 text-white outline-none" />
      </div>
      <div className="relative bg-[#0B0C10] border border-gray-800 rounded-xl p-4 text-xs text-gray-300 font-mono whitespace-pre-wrap">
        {text}
        <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="absolute top-3 right-3 bg-gray-800 p-2 rounded-lg text-amber-400">
          {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

function OfferMessageGenTool() {
  const [seller, setSeller] = useState('John');
  const [offer, setOffer] = useState('175,000');
  const [copied, setCopied] = useState(false);

  const text = `Hi ${seller}, after reviewing the property condition and local market comps, we are ready to submit an all-cash offer of $${offer}. We cover 100% of standard closing costs and buy completely as-is. Let me know if we can move forward!`;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <input type="text" value={seller} onChange={e => setSeller(e.target.value)} placeholder="Seller Name" className="bg-[#0B0C10] border border-gray-800 rounded-xl p-2.5 text-white outline-none" />
        <input type="text" value={offer} onChange={e => setOffer(e.target.value)} placeholder="Offer Price" className="bg-[#0B0C10] border border-gray-800 rounded-xl p-2.5 text-white outline-none" />
      </div>
      <div className="relative bg-[#0B0C10] border border-gray-800 rounded-xl p-4 text-xs text-gray-300 whitespace-pre-wrap">
        {text}
        <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="absolute top-3 right-3 bg-gray-800 p-2 rounded-lg text-amber-400">
          {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

function ColdCallingScriptsTool() {
  return (
    <div className="space-y-3">
      <div className="bg-[#0B0C10] p-4 rounded-xl border border-gray-800">
        <h4 className="text-amber-400 font-bold text-sm mb-1">Opener Script</h4>
        <p className="text-xs text-gray-300">"Hi [Name], I know this is out of the blue, but I was calling about your property on [Street]. I was curious if you've ever considered taking an all-cash offer on it as-is?"</p>
      </div>
      <div className="bg-[#0B0C10] p-4 rounded-xl border border-gray-800">
        <h4 className="text-amber-400 font-bold text-sm mb-1">Handling "How much will you offer?"</h4>
        <p className="text-xs text-gray-300">"We buy completely as-is and cover closing costs, so I just need to ask a few quick questions about the condition of the roof and HVAC to give you an exact cash number."</p>
      </div>
    </div>
  );
}

function BuyerMessageGenTool() {
  const [address, setAddress] = useState('742 Evergreen Terr');
  const [price, setPrice] = useState('160,000');
  const [arv, setArv] = useState('240,000');

  const text = `🔥 NEW DISPO DEAL 🔥\n📍 Address: ${address}\n💰 Price: $${price}\n📈 ARV: $${arv}\n🔨 Estimated Rehab: $30k\n\nFirst come, first served. Contact me for access codes and walkthrough scheduling!`;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <input type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder="Address" className="bg-[#0B0C10] border border-gray-800 rounded-xl p-2.5 text-white outline-none" />
        <input type="text" value={price} onChange={e => setPrice(e.target.value)} placeholder="Buy Price" className="bg-[#0B0C10] border border-gray-800 rounded-xl p-2.5 text-white outline-none" />
        <input type="text" value={arv} onChange={e => setArv(e.target.value)} placeholder="ARV" className="bg-[#0B0C10] border border-gray-800 rounded-xl p-2.5 text-white outline-none" />
      </div>
      <div className="bg-[#0B0C10] border border-gray-800 rounded-xl p-4 text-xs text-gray-300 font-mono whitespace-pre-wrap">
        {text}
      </div>
    </div>
  );
}

function AssignmentContractsTool() {
  const contracts = [
    { title: 'Standard Wholesale Purchase Agreement', file: 'Purchase_Agreement.pdf' },
    { title: 'Assignment of Contract Template', file: 'Assignment_Contract.pdf' },
    { title: 'Joint Venture (JV) Agreement', file: 'JV_Agreement.pdf' },
  ];

  return (
    <div className="space-y-3">
      {contracts.map((doc, idx) => (
        <div key={idx} className="flex items-center justify-between bg-[#0B0C10] border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-amber-400" />
            <span className="text-sm font-medium text-gray-200">{doc.title}</span>
          </div>
          <button className="flex items-center gap-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors">
            <Download className="w-3.5 h-3.5" />
            Download
          </button>
        </div>
      ))}
    </div>
  );
}
