export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-primary-green">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/assets/TenantSwap Logo Monochrome.svg"
        alt="TenantSwap"
        className="w-20 h-20 animate-pulse"
      />
      <div className="w-10 h-10 rounded-full border-[3px] border-white/25 border-t-white animate-spin" />
    </div>
  )
}
