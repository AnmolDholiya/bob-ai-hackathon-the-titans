/**
 * Reusable placeholder card used by pages that are not yet implemented.
 */
export default function PlaceholderCard({ title, description }) {
  return (
    <div className="rounded-lg border border-dashed border-gray-300 bg-white p-10 text-center">
      <h2 className="text-xl font-semibold text-gray-700 mb-2">{title}</h2>
      <p className="text-gray-500 text-sm">{description}</p>
      <p className="mt-4 text-xs text-gray-400">Coming in a future phase.</p>
    </div>
  )
}
