"use client";

import React, { useState } from "react";
import { 
  Wrench, 
  Search, 
  Calculator, 
  FileText, 
  Sparkles, 
  DollarSign, 
  Home, 
  Hammer, 
  ArrowRight, 
  X, 
  LayoutDashboard, 
  GitPullRequest, 
  CheckSquare, 
  Users, 
  Briefcase, 
  Upload, 
  BarChart2, 
  Settings, 
  LogOut,
  Building,
  KeyRound,
  Scale
} from "lucide-react";

export type ToolCategory = 
  | "All" 
  | "Valuation & Offers" 
  | "Costs & Expenses" 
  | "Profitability & Income" 
  | "Legal & Contracts" 
  | "AI-Powered Tools";

export interface ToolDef {
  id: string;
  title: string;
  description: string;
  category: ToolCategory;
  icon: React.ElementType;
  tag: string;
}

// COMPLETE CATALOG OF ACQUISITION TOOLS
export const FULL_TOOL_CATALOG: ToolDef[] = [
  // Valuation & Offers
  { id: "arv-estimator", title: "ARV Estimator", description: "Estimate After Repair Value using comparable sales weighted average.", category: "Valuation & Offers", icon: Home, tag: "Valuation" },
  { id: "mao-calculator", title: "MAO Calculator", description: "Maximum Allowable Offer using standard 70% rule or custom formulas.", category: "Valuation & Offers", icon: Calculator, tag: "Wholesaling" },
  { id: "offer-calculator", title: "Offer Price Calculator", description: "Calculate target offer working backward from investor net ROI goals.", category: "Valuation & Offers", icon: DollarSign, tag: "Offers" },
  
  // Costs & Expenses
  { id: "repair-estimator", title: "Repair Cost Estimator", description: "Quick or detailed rehab cost approximations by sqft or trade category.", category: "Costs & Expenses", icon: Hammer, tag: "Rehab" },
  { id: "closing-costs", title: "Closing Costs Estimator", description: "Estimate title, escrow, transfer fees, and settlement costs.", category: "Costs & Expenses", icon: DollarSign, tag: "Fees" },
  { id: "holding-costs", title: "Holding Costs Estimator", description: "Calculate monthly taxes, insurance, utilities, and hard money interest.", category: "Costs & Expenses", icon: Building, tag: "Carrying" },

  // Profitability & Income
  { id: "brrrr-calculator", title: "BRRRR Strategy Calculator", description: "Analyze cash-out refinance equity, cash-in, and long-term rental yield.", category: "Profitability & Income", icon: KeyRound, tag: "Rental" },
  { id: "creative-finance", title: "Sub-To & Seller Finance Engine", description: "Structure interest-only, balloon, and subject-to existing debt terms.", category: "Profitability & Income", icon: Scale, tag: "Creative" },

  // Legal & Contracts
  { id: "assignment-contract", title: "Assignment Contract Generator", description: "Generate standardized real estate wholesale assignment legal agreements.", category: "Legal & Contracts", icon: FileText, tag: "Legal" },

  // AI-Powered Tools
  { id: "ai-copywriter", title: "AI Property Pitch Generator", description: "Generate high-converting buyer pitch blasts for off-market deals.", category: "AI-Powered Tools", icon: Sparkles, tag: "AI Copy" }
];

export default function ToolsHubPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<ToolCategory>("All");
  const [selectedToolId, setSelectedToolId] = useState<string | null>(null);

  const categories: ToolCategory[] = [
    "All",
    "Valuation & Offers",
    "Costs & Expenses",
    "Profitability & Income",
    "Legal & Contracts",
    "AI-Powered Tools"
  ];

  const filteredTools = FULL_TOOL_CATALOG.filter((tool) => {
    const matchesCategory = selectedCategory === "All" || tool.category === selectedCategory;
    const matchesSearch = tool.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          tool.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const activeToolObj = FULL_TOOL_CATALOG.find(t => t.id === selectedToolId);

  return (
    <div className="min-h-screen bg-black text-neutral-100 flex flex-col font-sans selection:bg-amber-500/30">
      
      {/* HEADER BAR */}
      <header className="h-16 border-b border-neutral-800/80 bg-neutral-950/90 backdrop-blur-md px-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setSidebarOpen(true)}
            className="p-2 hover:bg-neutral-800 rounded-lg transition text-neutral-400 hover:text-white"
          >
            <div className="space-y-1 w-5">
              <span className="block h-0.5 bg-current w-full"></span>
              <span className="block h-0.5 bg-current w-full"></span>
              <span className="block h-0.5 bg-current w-full"></span>
            </div>
          </button>
          <div>
            <span className="text-[10px] text-amber-500 uppercase tracking-widest font-bold block">Foundation Acquisitions LLC</span>
            <h1 className="text-sm font-bold tracking-wide">Foundation OS</h1>
          </div>
        </div>
        <button className="bg-amber-500 hover:bg-amber-400 text-black px-3.5 py-1.5 rounded-lg text-xs font-bold transition">
          + Lead
        </button>
      </header>

      {/* SIDEBAR NAVIGATION OVERLAY */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-72 bg-neutral-950 border-r border-neutral-800 p-4 flex flex-col justify-between z-10">
            <div>
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-neutral-800">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center font-bold text-amber-500">
                    F
                  </div>
                  <div>
                    <p className="text-sm font-bold">Foundation OS</p>
                    <p className="text-xs text-neutral-500">Acquisitions CRM</p>
                  </div>
                </div>
                <button onClick={() => setSidebarOpen(false)} className="text-neutral-400 hover:text-white p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="space-y-1">
                {[
                  { name: "Dashboard", icon: LayoutDashboard },
                  { name: "Pipeline", icon: GitPullRequest },
                  { name: "Tasks", icon: CheckSquare },
                  { name: "Leads", icon: Users },
                  { name: "Deals", icon: Briefcase },
                  { name: "Buyers", icon: Users },
                  { name: "Tools & Utilities", icon: Wrench, active: true },
                  { name: "Imports", icon: Upload },
                  { name: "Reports", icon: BarChart2 },
                  { name: "Settings", icon: Settings },
                ].map((item) => (
                  <button
                    key={item.name}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${
                      item.active 
                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/30 font-semibold" 
                        : "text-neutral-400 hover:bg-neutral-900 hover:text-white"
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.name}
                  </button>
                ))}
              </nav>
            </div>

            <button className="w-full flex items-center justify-center gap-2 border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 py-2.5 rounded-lg text-xs font-semibold transition">
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </aside>
        </div>
      )}

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-6 space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Premium Tools & Utilities</h1>
          <p className="text-xs md:text-sm text-neutral-400 mt-1">
            Complete suite of automated real estate calculators, AI copywriters, and legal contract engines.
          </p>
        </div>

        {/* SEARCH & CATEGORY FILTER TABS */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-neutral-500" />
            <input
              type="text"
              placeholder="Search tools or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-neutral-900/90 border border-neutral-800 rounded-xl pl-10 pr-4 py-2.5 text-xs md:text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500/50 transition"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition border ${
                  selectedCategory === cat
                    ? "bg-amber-500/20 border-amber-500/50 text-amber-400 font-semibold"
                    : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* SECTIONAL CARDS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTools.map((tool) => {
            const IconComponent = tool.icon;
            return (
              <div
                key={tool.id}
                onClick={() => setSelectedToolId(tool.id)}
                className="group relative bg-neutral-900/40 border border-neutral-800/80 hover:border-amber-500/50 hover:bg-neutral-900/80 rounded-2xl p-5 transition-all duration-200 cursor-pointer flex flex-col justify-between shadow-lg"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-neutral-800/80 group-hover:bg-amber-500/20 group-hover:text-amber-400 text-neutral-300 flex items-center justify-center transition">
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800">
                      {tool.tag}
                    </span>
                  </div>
                  <h3 className="font-bold text-base text-white group-hover:text-amber-400 transition mb-1.5">
                    {tool.title}
                  </h3>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    {tool.description}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-neutral-800/50 flex items-center justify-between text-xs">
                  <span className="font-mono text-[10px] text-neutral-500">{tool.id}</span>
                  <div className="flex items-center gap-1 text-amber-500 font-semibold text-xs">
                    Launch <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* SELECTION MODAL PLACEHOLDER */}
      {selectedToolId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl w-full max-w-lg p-6 relative">
            <button 
              onClick={() => setSelectedToolId(null)} 
              className="absolute top-4 right-4 text-neutral-400 hover:text-white p-1 rounded-lg bg-neutral-900 border border-neutral-800"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="space-y-3">
              <span className="text-xs text-amber-500 font-semibold uppercase tracking-wider">Tool Selected</span>
              <h2 className="text-xl font-bold">{activeToolObj?.title}</h2>
              <p className="text-xs text-neutral-400">{activeToolObj?.description}</p>
              <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl text-center text-xs text-neutral-300">
                Ready to integrate individual component code for <span className="text-amber-400 font-mono">{selectedToolId}</span>.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
