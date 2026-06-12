export function BranchTag({ tag }: { tag?: string }) {
  if (!tag) return null

  return (
    <span className="inline-flex max-w-24 items-center truncate rounded-md bg-amber-300 px-2 py-0.5 text-xs font-bold text-slate-950 ring-1 ring-amber-400">
      {tag}
    </span>
  )
}
