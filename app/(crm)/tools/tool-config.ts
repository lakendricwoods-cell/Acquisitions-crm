"use client";

import Link from "next/link";
import type { ToolConfig } from "../tool-config";

type Props = {
  tool: ToolConfig;
};

export default function ToolTerminal({ tool }: Props) {
  return (
    <main className="min-h-screen bg-black px-5 py-8 text-white">
      <div className="mx-auto max-w-5xl">

        {/* Header */}
        <div className="mb-6">
          <Link
            href="/tools"
            className="text-sm text-zinc-500 transition hover:text-white"
          >
            ← Back to Tools
          </Link>
        </div>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">

          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-500">
              {tool.category}
            </p>

            <h1 className="mt-2 text-3xl font-bold">
              {tool.name}
            </h1>

            <p className="mt-2 text-sm text-zinc-400">
              {tool.description}
            </p>
          </div>

          {/* Tool workspace */}
          <ToolWorkspace tool={tool} />

        </section>
      </div>
    </main>
  );
}

function ToolWorkspace({ tool }: Props) {

  if (tool.slug === "marketing-roi") {
    return (
      <div className="rounded-xl border border-zinc-800 p-6">
        <p className="text-sm text-zinc-400">
          Your existing Marketing ROI calculator should remain here.
        </p>
      </div>
    );
  }

  if (tool.slug === "wholesale-calculator") {
    return (
      <div className="grid gap-5 md:grid-cols-2">

        <Input label="After Repair Value (ARV)" />
        <Input label="Estimated Repairs" />
        <Input label="Assignment Fee" />
        <Input label="Investor Margin (%)" />

        <div className="md:col-span-2">
          <button className="h-12 w-full rounded-xl bg-gradient-to-r from-amber-300 to-yellow-500 font-semibold text-black">
            Calculate MAO
          </button>
        </div>

      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-black/40 p-8 text-center">
      <h2 className="text-xl font-semibold">
        {tool.name}
      </h2>

      <p className="mt-2 text-sm text-zinc-500">
        Tool workspace ready.
      </p>

      <p className="mt-6 text-xs text-zinc-600">
        Connect this workspace to the tool-specific calculator,
        generator, or analyzer.
      </p>
    </div>
  );
}

function Input({ label }: { label: string }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm text-zinc-400">
        {label}
      </span>

      <input
        type="number"
        className="h-12 w-full rounded-xl border border-zinc-800 bg-black px-4 text-white outline-none focus:border-amber-500"
      />
    </label>
  );
}