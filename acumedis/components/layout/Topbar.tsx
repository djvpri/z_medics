import Link from 'next/link'

interface TopbarProps {
  title: string
  subtitle?: string
  back?: string
  actions?: React.ReactNode
}

export default function Topbar({ title, subtitle, back, actions }: TopbarProps) {
  const btnGhost: React.CSSProperties = {
    padding: '6px 10px', borderRadius: 8, fontSize: 12, fontWeight: 500,
    background: 'transparent', border: '1px solid var(--border)',
    color: 'var(--ink2)', cursor: 'pointer', fontFamily: 'var(--font-dm-sans)',
    textDecoration: 'none', whiteSpace: 'nowrap' as const,
  }

  return (
    <header
      className="sticky top-[52px] md:top-0 z-20 flex items-center justify-between gap-3 px-4 md:px-7 py-3 md:py-4"
      style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}
    >
      {/* Title + back */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {back && (
          <Link href={back} style={btnGhost} className="flex-shrink-0">← </Link>
        )}
        <div className="min-w-0">
          <h1 className="truncate" style={{ fontFamily: 'var(--font-dm-serif)', fontSize: 18, color: 'var(--ink)', lineHeight: 1.2 }}>
            {title}
          </h1>
          {subtitle && <p className="truncate" style={{ fontSize: 11, color: 'var(--ink3)', margin: 0 }}>{subtitle}</p>}
        </div>
      </div>

      {/* Actions — sembunyikan sebagian di mobile jika terlalu penuh */}
      {actions && (
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {actions}
        </div>
      )}
    </header>
  )
}
