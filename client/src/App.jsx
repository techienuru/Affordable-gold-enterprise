import { useEffect, useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export default function App() {
  const [api, setApi] = useState({ state: 'checking' })

  useEffect(() => {
    fetch(`${API_URL}/health`)
      .then((res) => res.json())
      .then((data) => setApi({ state: 'ok', ...data }))
      .catch((error) => setApi({ state: 'down', error: error.message }))
  }, [])

  return (
    <main className="page">
      <header className="hero">
        <p className="eyebrow">Keffi &middot; Lafia &middot; Abuja &middot; Nationwide</p>
        <h1>Affordable Gold Enterprise</h1>
        <p className="tagline">
          Pure honey and quality food items, delivered to your door.
        </p>
      </header>

      <section className="card">
        <h2>Project setup</h2>
        <p className="muted">
          The shop pages are not built yet. This screen only confirms that the two
          halves of the project can talk to each other.
        </p>

        <ul className="checks">
          <li className="ok">
            <span>React front-end</span>
            <span>running on port 5173</span>
          </li>
          <li className={api.state === 'ok' ? 'ok' : 'bad'}>
            <span>Express back-end</span>
            <span>
              {api.state === 'checking' && 'checking...'}
              {api.state === 'ok' && 'running on port 5000'}
              {api.state === 'down' && 'not reachable - start it with npm run dev'}
            </span>
          </li>
          {api.state === 'ok' && (
            <li className={api.setupComplete ? 'ok' : 'bad'}>
              <span>Settings file</span>
              <span>
                {api.setupComplete
                  ? 'everything is filled in'
                  : `${api.missingEnv.length} still blank in server/.env`}
              </span>
            </li>
          )}
        </ul>

        {api.state === 'ok' && !api.setupComplete && (
          <p className="hint">
            Still to fill: <code>{api.missingEnv.join(', ')}</code>
          </p>
        )}
      </section>
    </main>
  )
}
