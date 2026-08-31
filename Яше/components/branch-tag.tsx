export function BranchTag({ tag }: { tag?: string }) {
  if (!tag) return null

  return (
    <span className="inline-flex items-center whitespace-normal break-words rounded-md bg-emerald-100/70 px-2 py-0.5 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200">
      {tag}
    </span>
  )
}
