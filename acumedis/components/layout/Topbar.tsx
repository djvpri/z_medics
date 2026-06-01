import Link from 'next/link'

interface TopbarProps {
  title: string
  subtitle?: string
  back?: string
  actions?: React.ReactNode
}

export default function Topbar({ title, subtitle, back, actions }: TopbarProps) {
  const btnGhost: React.CSSProperties = {
    padding: '6px 10px',
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 500,
    background: 'transparent',
    border: '1px solid var(--border)',
    color: 'var(--ink2)',
    cursor: 'pointer',
    fontFamily: 'var(--font-dm-sans)',
    textDecoration: 'none',
    whiteSpace: 'nowrap' as const,
  }

  return (
    <header
      className="sticky top-0 z-40 flex items-center justify-between px-7 py-4"
      style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}
    >
      <div className="flex items-center gap-2.5">
        {back && (
          <Link href={back} style={btnGhost}>← Kembali</Link>
        )}
        <div>
          <h1 style={{ fontFamily: 'var(--font-dm-serif)', fontSize: 20, color: 'var(--ink)', lineHeight: 1.2 }}>
            {title}
          </h1>
          {subtitle && <p style={{ fontSize: 12, color: 'var(--ink3)', margin: 0 }}>{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  )
}
