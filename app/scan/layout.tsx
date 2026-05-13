export const metadata = { title: 'Scanner — Only Members' }

export default function ScanLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body style={{ margin: 0, padding: 0, background: '#0A0A0F', fontFamily: 'Inter, sans-serif' }}>
        {children}
      </body>
    </html>
  )
}
