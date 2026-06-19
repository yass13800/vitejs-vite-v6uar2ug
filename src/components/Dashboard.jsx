import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabaseClient'

const eur = n => (Number(n) || 0).toLocaleString('fr-FR', { maximumFractionDigits: 2 }) + ' €'
const fmt = d => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'
const DAY = 86400000

export default function Dashboard({ onOpenClient }) {
  const [rows, setRows] = useState(null)
  const [err, setErr] = useState('')

  useEffect(() => {
    supabase.from('interventions')
      .select('id, date_intervention, validite_jusqu_au, montant_ttc, mode_reglement, paye, numero_certificat, type_appareil, client_id, clients(nom, prenom, ville, adresse, telephone, email)')
      .order('date_intervention', { ascending: false })
      .then(({ data, error }) => { if (error) setErr(error.message); setRows(data || []) })
  }, [])

  const stats = useMemo(() => {
    if (!rows) return null
    const now = new Date(), y = now.getFullYear(), m = now.getMonth()
    const inMonth = r => { const d = new Date(r.date_intervention); return d.getFullYear() === y && d.getMonth() === m }
    const caMois = rows.filter(inMonth).reduce((s, r) => s + (Number(r.montant_ttc) || 0), 0)
    const fichesMois = rows.filter(inMonth).length
    const impaye = rows.filter(r => !r.paye).reduce((s, r) => s + (Number(r.montant_ttc) || 0), 0)

    const latest = new Map()
    for (const r of rows) {
      const cur = latest.get(r.client_id)
      if (!cur || new Date(r.date_intervention) > new Date(cur.date_intervention)) latest.set(r.client_id, r)
    }
    const horizon = Date.now() + 60 * DAY
    const relances = [...latest.values()]
      .filter(r => r.validite_jusqu_au && new Date(r.validite_jusqu_au).getTime() <= horizon)
      .sort((a, b) => new Date(a.validite_jusqu_au) - new Date(b.validite_jusqu_au))
    return { caMois, fichesMois, impaye, relances }
  }, [rows])

  function exportCSV() {
    const head = ['Date', 'Client', 'Ville', 'Appareil', 'N certificat', 'Montant TTC', 'Reglement', 'Paye', 'Prochain ramonage']
    const lines = (rows || []).map(r => [
      fmt(r.date_intervention),
      `${r.clients?.nom || ''} ${r.clients?.prenom || ''}`.trim(),
      r.clients?.ville || '', r.type_appareil || '', r.numero_certificat || '',
      r.montant_ttc != null ? String(r.montant_ttc).replace('.', ',') : '',
      r.mode_reglement || '', r.paye ? 'Oui' : 'Non', fmt(r.validite_jusqu_au),
    ])
    const csv = [head, ...lines].map(row => row.map(c => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\r\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `interventions-${new Date().toISOString().slice(0, 10)}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  if (rows === null) return <div className="loading">Chargement…</div>

  const card = { background: '#fff', border: '1px solid #e8e4dc', borderRadius: 14, padding: '14px 16px' }
  const big = { fontSize: 26, fontWeight: 700, color: '#1c1b1a', lineHeight: 1.1 }
  const lab = { fontSize: 12, color: '#8a857c', marginTop: 4, textTransform: 'uppercase', letterSpacing: '.04em' }

  return (
    <div className="list">
      <div className="list-head"><h1>Tableau de bord</h1></div>
      {err && <p className="error">Erreur : {err}</p>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
        <div style={card}><div style={big}>{eur(stats.caMois)}</div><div style={lab}>CA ce mois</div></div>
        <div style={card}><div style={big}>{stats.fichesMois}</div><div style={lab}>Fiches ce mois</div></div>
        <div style={card}><div style={{ ...big, color: stats.impaye > 0 ? '#9a2b2b' : '#1c1b1a' }}>{eur(stats.impaye)}</div><div style={lab}>À encaisser</div></div>
        <div style={card}><div style={{ ...big, color: stats.relances.length ? '#c6892f' : '#1c1b1a' }}>{stats.relances.length}</div><div style={lab}>À relancer</div></div>
      </div>

      <button className="btn btn--ghost btn--full" onClick={exportCSV}>↓ Exporter les interventions (CSV)</button>

      <div className="fiche-sec" style={{ marginTop: 18 }}><h2><i>↻</i>Ramonages à relancer</h2></div>
      <div className="sub-rule" />
      {stats.relances.length === 0
        ? <p className="empty">Aucune relance à prévoir dans les 60 jours.</p>
        : (
          <ul className="rows">
            {stats.relances.map(r => {
              const overdue = new Date(r.validite_jusqu_au).getTime() < Date.now()
              return (
                <li key={r.client_id}>
                  <button className="row" onClick={() => onOpenClient({ id: r.client_id, ...r.clients })}>
                    <div className="row-main">
                      <span className="row-name">{r.clients?.nom} {r.clients?.prenom}</span>
                      <span className="row-sub">{overdue ? 'En retard depuis le ' : 'Échéance le '}{fmt(r.validite_jusqu_au)}</span>
                    </div>
                    <div className="row-side">
                      <span className="tag" style={overdue ? { background: '#fbeaea', color: '#9a2b2b' } : {}}>{overdue ? 'En retard' : 'Bientôt'}</span>
                      <span className="chev">›</span>
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
    </div>
  )
}
