interface Props {
  label: string
  value: string | number
  sub?: string
}

export function MetricCard({ label, value, sub }: Props) {
  return (
    <div
      style={{
        background: '#0F0F1A',
        border: '0.5px solid rgba(201,168,76,0.12)',
        borderRadius: '8px',
        padding: '24px 28px',
        flex: 1,
        minWidth: 0,
      }}
    >
      <p
        style={{
          fontFamily: 'var(--font-inter)',
          fontWeight: 300,
          fontSize: '10px',
          letterSpacing: '0.14em',
          color: 'rgba(201,168,76,0.6)',
          textTransform: 'uppercase',
          marginBottom: '12px',
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontFamily: 'var(--font-cormorant)',
          fontWeight: 300,
          fontSize: '40px',
          color: '#F5F0E8',
          lineHeight: 1,
          marginBottom: sub ? '6px' : 0,
        }}
      >
        {value}
      </p>
      {sub && (
        <p
          style={{
            fontFamily: 'var(--font-inter)',
            fontWeight: 300,
            fontSize: '11px',
            color: 'rgba(245,240,232,0.4)',
          }}
        >
          {sub}
        </p>
      )}
    </div>
  )
}
