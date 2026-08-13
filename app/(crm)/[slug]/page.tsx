import { notFound } from 'next/navigation'

import ToolWorkspace from '../tool-workspace'
import { TOOL_CONFIGS, type ToolSlug } from '../tool-config'

type PageProps = {
  params: Promise<{
    slug: string
  }>
}

export default async function ToolPage({ params }: PageProps) {
  const { slug } = await params

  const tool = TOOL_CONFIGS.find(
    (item) => item.slug === slug
  )

  if (!tool) {
    notFound()
  }

  return <ToolWorkspace slug={tool.slug} />
}