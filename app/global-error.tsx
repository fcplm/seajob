'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', margin: 0, fontFamily: 'sans-serif' }}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <h2 style={{ color: '#0c2461', marginBottom: '1rem' }}>Something went wrong</h2>
          {error?.message && (
            <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1rem', maxWidth: 400 }}>{error.message}</p>
          )}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <button
              onClick={() => { window.location.href = '/' }}
              style={{ padding: '0.5rem 1.5rem', background: 'white', color: '#0c2461', border: '1px solid #0c2461', borderRadius: '0.5rem', cursor: 'pointer' }}
            >
              Home
            </button>
            <button
              onClick={reset}
              style={{ padding: '0.5rem 1.5rem', background: '#0c2461', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
