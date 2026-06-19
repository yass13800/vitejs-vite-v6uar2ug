import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabaseClient'

const eur = n => (Number(n) || 0).toLocaleString('fr-FR', { maximumFractionDigits: 2 }) + ' €'
const fmt = d => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'
const DAY = 86400000

export default function Dashboard({ onOpenClient }) {
  const [rows, setRows] = useState(null)
  const [err, setErr] = useState('')
  const [active, setActive] = useState('relances')   // 'mois' | 'impaye' | 'relances'

  useEffect(() => {
    supabase.from('interventions')
      .select('id, date_intervention, validite_jusqu_au, montant_ttc, mode_reglement, paye, numero_certificat, type_appareil, client_id, clients(nom, prenom, ville, adresse, telephone, email)')
      .order('date_intervention', { ascending: false })
      .then(({ data, error }) => { if (error) setErr(error.message); setRows(data || []) })
  }, [])

  async function togglePaye(r, e) {
    e?.stopPropagation()
    const next = !r.paye
    setRows(list => list.map(x => (x.id === r.id ? { ...x, paye: next } : x)))
    await supabase.from('interventions')
      .update({ paye: next, paye_le: next ? new Date().toISOString() : null }).eq('id', r.id)
  }

  const stats = useMemo(() => {
    if (!rows) return null
    const now = new Date(), y = now.getFullYear(), m = now.getMonth()
    const inMonth = r => { const d = new Date(r.date_intervention); return d.getFullYear() === y && d.getMonth() === m }
    const monthRows = rows.filter(inMonth)
    const unpaidRows = rows.filter(r => !r.paye)
    const caMois = monthRows.reduce((s, r) => s + (Number(r.montant_ttc) || 0), 0)
    const impaye = unpaidRows.reduce((s, r) => s + (Number(r.montant_ttc) || 0), 0)

    const latest = new Map()
    for (const r of rows) {
      const cur = latest.get(r.client_id)
      if (!cur || new Date(r.date_intervention) > new Date(cur.date_intervention)) latest.set(r.client_id, r)
    }
    const horizon = Date.now() + 60 * DAY
    const relances = [...latest.values()]
      .filter(r => r.validite_jusqu_au && new Date(r.validite_jusqu_au).getTime() <= horizon)
      .sort((a, b) => new Date(a.validite_jusqu_au) - new Date(b.validite_jusqu_au))
    return { caMois, fichesMois: monthRows.length, impaye, relances, monthRows, unpaidRows }
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

  const cardBase = { background: '#fff', border: '1px solid #e8e4dc', borderRadius: 14, padding: '14px 16px', textAlign: 'left', cursor: 'pointer', font: 'inherit', width: '100%' }
  const sel = { border: '1px solid #c6892f', boxShadow: '0 0 0 2px rgba(198,137,47,.15)' }
  const big = { fontSize: 26, fontWeight: 700, color: '#1c1b1a', lineHeight: 1.1 }
  const lab = { fontSize: 12, color: '#8a857c', marginTop: 4, textTransform: 'uppercase', letterSpacing: '.04em' }
  const paidOn = { fontSize: 11, padding: '2px 8px', borderRadius: 999, border: '1px solid #bfe3c9', background: '#e9f7ee', color: '#1f7a3d', cursor: 'pointer' }
  const paidOff = { fontSize: 11, padding: '2px 8px', borderRadius: 999, border: '1px solid #e7c9c9', background: '#fbeaea', color: '#9a2b2b', cursor: 'pointer' }

  const cardStyle = on => (on ? { ...cardBase, ...sel } : cardBase)

  const ficheRow = r => (
    <li key={r.id}>
      <div className="row" style={{ cursor: 'pointer' }} onClick={() => onOpenClient({ id: r.client_id, ...r.clients })}>
        <div className="row-main">
          <span className="row-name">{r.clients?.nom} {r.clients?.prenom}</span>
          <span className="row-sub">{fmt(r.date_intervention)} · {r.type_appareil || '—'}{r.montant_ttc ? ` · ${r.montant_ttc} €` : ''}</span>
        </div>
        <div className="row-side">
          <button style={r.paye ? paidOn : paidOff} onClick={e => togglePaye(r, e)}>{r.paye ? 'Payé ✓' : 'À encaisser'}</button>
          <span className="chev">›</span>
        </div>
      </div>
    </li>
  )

  let secTitle, secList
  if (active === 'mois') {
    secTitle = `Fiches du mois — total ${eur(stats.caMois)}`
    secList = stats.monthRows.length === 0
      ? <p className="empty">Aucune fiche ce mois-ci.</p>
      : <ul className="rows">{stats.monthRows.map(ficheRow)}</ul>
  } else if (active === 'impaye') {
    secTitle = `À encaisser — ${eur(stats.impaye)}`
    secList = stats.unpaidRows.length === 0
      ? <p className="empty">Tout est encaissé. 👍</p>
      : <ul className="rows">{stats.unpaidRows.map(ficheRow)}</ul>
  } else {
    secTitle = 'Ramonages à relancer'
    secList = stats.relances.length === 0
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
      )
  }

  return (
    <div className="list">
      <div className="list-head"><h1>Tableau de bord</h1></div>
      {err && <p className="error">Erreur : {err}</p>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
        <button style={cardStyle(active === 'mois')} onClick={() => setActive('mois')}>
          <div style={big}>{eur(stats.caMois)}</div><div style={lab}>CA ce mois</div></button>
        <button style={cardStyle(active === 'mois')} onClick={() => setActive('mois')}>
          <div style={big}>{stats.fichesMois}</div><div style={lab}>Fiches ce mois</div></button>
        <button style={cardStyle(active === 'impaye')} onClick={() => setActive('impaye')}>
          <div style={{ ...big, color: stats.impaye > 0 ? '#9a2b2b' : '#1c1b1a' }}>{eur(stats.impaye)}</div><div style={lab}>À encaisser</div></button>
        <button style={cardStyle(active === 'relances')} onClick={() => setActive('relances')}>
          <div style={{ ...big, color: stats.relances.length ? '#c6892f' : '#1c1b1a' }}>{stats.relances.length}</div><div style={lab}>À relancer</div></button>
      </div>

      <button className="btn btn--ghost btn--full" onClick={exportCSV}>↓ Exporter les interventions (CSV)</button>

      <div className="fiche-sec" style={{ marginTop: 18 }}><h2><i>≡</i>{secTitle}</h2></div>
      <div className="sub-rule" />
      {secList}
    </div>
  )
}
