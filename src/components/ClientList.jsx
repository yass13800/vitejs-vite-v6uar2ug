import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabaseClient'

export default function ClientList({ onSelect }) {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [ville, setVille] = useState('Toutes')

  useEffect(() => {
    supabase.from('clients').select('*').order('nom').then(({ data }) => {
      setClients(data || []); setLoading(false)
    })
  }, [])

  const villes = useMemo(
    () => ['Toutes', ...[...new Set(clients.map(c => c.ville).filter(Boolean))].sort()],
    [clients]
  )

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase()
    return clients.filter(c => {
      if (ville !== 'Toutes' && c.ville !== ville) return false
      if (!t) return true
      return [c.nom, c.prenom, c.adresse, c.ville, c.telephone]
        .filter(Boolean).join(' ').toLowerCase().includes(t)
    })
  }, [clients, q, ville])

  if (loading) return <div className="loading">Chargement des clients…</div>

  return (
    <div className="list">
      <div className="list-head">
        <h1>Clients</h1>
        <span className="count">{filtered.length}</span>
      </div>

      <input className="search" placeholder="Rechercher un nom, une adresse…"
             value={q} onChange={e => setQ(e.target.value)} />

      <div className="pills">
        {villes.map(v => (
          <button key={v} className={'pill' + (v === ville ? ' pill--on' : '')}
                  onClick={() => setVille(v)}>{v}</button>
        ))}
      </div>

      {filtered.length === 0
        ? <p className="empty">Aucun client ne correspond. Modifiez la recherche.</p>
        : (
          <ul className="rows">
            {filtered.map(c => (
              <li key={c.id}>
                <button className="row" onClick={() => onSelect(c)}>
                  <div className="row-main">
                    <span className="row-name">{c.nom} {c.prenom}</span>
                    <span className="row-sub">{c.adresse}</span>
                  </div>
                  <div className="row-side">
                    {c.ville && <span className="tag">{c.ville}</span>}
                    <span className="chev">›</span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
    </div>
  )
}
