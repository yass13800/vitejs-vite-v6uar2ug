import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { CONCLUSION, labelOf } from '../lib/ficheOptions'

const fmt = d => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
const conclClass = c => (c === 'vacant' ? 'ok' : c === 'reserve' ? 'warn' : c === 'inapte' ? 'err' : 'ok')
const conclShort = c => (c === 'vacant' ? 'Vacant' : c === 'reserve' ? 'Sous réserve' : c === 'inapte' ? 'Inapte' : labelOf(CONCLUSION, c))

function blobToBase64(blob) {
  return new Promise((res, rej) => {
    const r = new FileReader()
    r.onloadend = () => res(String(r.result).split(',')[1]); r.onerror = rej
    r.readAsDataURL(blob)
  })
}

export default function ClientDetail({ client, profil, onNew, onEdit, onDeleted }) {
  const [items, setItems] = useState(null)
  const [sending, setSending] = useState(null)
  const [msg, setMsg] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [removing, setRemoving] = useState(false)

  async function load() {
    const { data } = await supabase.from('interventions')
      .select('id, date_intervention, type_appareil, numero_certificat, montant_ttc, conclusion, pdf_url, email_envoye_le, paye')
      .eq('client_id', client.id).order('date_intervention', { ascending: false })
    setItems(data || [])
  }
  useEffect(() => { load() }, [client.id])

  async function removeClient() {
    setRemoving(true)
    try {
      const { error } = await supabase.from('clients').delete().eq('id', client.id)
      if (error) throw error
      onDeleted()
    } catch (err) {
      setRemoving(false); setConfirmDelete(false)
      setMsg('Suppression impossible : ' + (err?.message || err))
    }
  }

  async function togglePaye(it) {
    const next = !it.paye
    setItems(list => list.map(x => (x.id === it.id ? { ...x, paye: next } : x)))
    await supabase.from('interventions')
      .update({ paye: next, paye_le: next ? new Date().toISOString() : null }).eq('id', it.id)
  }

  async function resend(it) {
    if (!client.email) return
    setSending(it.id); setMsg('')
    try {
      const res = await fetch(it.pdf_url)
      if (!res.ok) throw new Error('PDF introuvable')
      const pdfBase64 = await blobToBase64(await res.blob())
      const html =
        `<p>Bonjour ${client.prenom || ''} ${client.nom},</p>` +
        `<p>Veuillez trouver à nouveau ci-joint votre fiche d'intervention et certificat de ramonage ` +
        `(N° ${it.numero_certificat}) du ${fmt(it.date_intervention)}.</p>` +
        `<p>Cordialement,<br>${profil?.raison_sociale || 'Protech Ramonage'}</p>`
      const { error } = await supabase.functions.invoke('send-certificat', {
        body: {
          to: client.email, toName: `${client.prenom || ''} ${client.nom}`.trim(),
          subject: 'Votre certificat de ramonage', html,
          pdfBase64, filename: `fiche-${it.numero_certificat}.pdf`,
          senderEmail: profil?.email_envoi, senderName: profil?.raison_sociale,
        },
      })
      if (error) throw error
      await supabase.from('interventions').update({ email_envoye_le: new Date().toISOString() }).eq('id', it.id)
      setMsg(`Renvoyé à ${client.email}.`); load()
    } catch (err) {
      setMsg('Échec du renvoi : ' + (err?.message || err))
    } finally { setSending(null) }
  }

  const danger = { flex: 1, background: '#fbeaea', color: '#9a2b2b', border: '1px solid #e7c9c9' }
  const dangerOn = { flex: 1, background: '#9a2b2b', color: '#fff', border: '1px solid #9a2b2b' }
  const linkBtn = { flex: 1, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }
  const paidOn = { fontSize: 11, padding: '2px 8px', borderRadius: 999, border: '1px solid #bfe3c9', background: '#e9f7ee', color: '#1f7a3d', cursor: 'pointer' }
  const paidOff = { fontSize: 11, padding: '2px 8px', borderRadius: 999, border: '1px solid #e7c9c9', background: '#fbeaea', color: '#9a2b2b', cursor: 'pointer' }
  const mapsUrl = 'https://www.google.com/maps/dir/?api=1&destination=' +
    encodeURIComponent([client.adresse, client.ville].filter(Boolean).join(', '))

  return (
    <div className="form">
      <div className="form-client">
        <h1>{client.nom} {client.prenom}</h1>
        <p>{client.adresse}{client.ville ? `, ${client.ville}` : ''}{client.telephone ? ` · ${client.telephone}` : ''}{client.email ? ` · ${client.email}` : ''}</p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <button className="btn btn--ghost" style={{ flex: 1 }} onClick={onEdit}>Modifier</button>
        {client.adresse &&
          <a className="btn btn--ghost" style={linkBtn} href={mapsUrl} target="_blank" rel="noreferrer">Itinéraire</a>}
        {!confirmDelete
          ? <button className="btn" style={danger} onClick={() => setConfirmDelete(true)}>Supprimer</button>
          : <button className="btn" style={dangerOn} onClick={removeClient} disabled={removing}>{removing ? '…' : 'Confirmer'}</button>}
      </div>
      {confirmDelete &&
        <p className="warn">La suppression effacera aussi toutes les fiches de ce client.{' '}
          <button className="add" onClick={() => setConfirmDelete(false)}>Annuler</button></p>}

      <button className="btn btn--primary btn--full" onClick={onNew}>+ Nouvelle intervention</button>

      <div className="fiche-sec"><h2><i>≡</i>Historique des fiches</h2></div>
      <div className="sub-rule" />

      {items === null
        ? <div className="loading">Chargement…</div>
        : items.length === 0
          ? <p className="empty">Aucune fiche encore émise pour ce client.</p>
          : (
            <ul className="hist">
              {items.map(it => (
                <li className="hist-row" key={it.id}>
                  <div className="hist-main">
                    <div className="hist-top">
                      <span className="hist-date">{fmt(it.date_intervention)}</span>
                      <span className={'badge badge--' + conclClass(it.conclusion)}>{conclShort(it.conclusion)}</span>
                    </div>
                    <span className="hist-sub">{it.type_appareil || '—'} · N° {it.numero_certificat}{it.montant_ttc ? ` · ${it.montant_ttc} €` : ''}</span>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginTop: 2 }}>
                      <span className="hist-status">{it.email_envoye_le ? `Envoyé le ${fmt(it.email_envoye_le)}` : 'Non envoyé'}</span>
                      <button onClick={() => togglePaye(it)} style={it.paye ? paidOn : paidOff}>{it.paye ? 'Payé ✓' : 'À encaisser'}</button>
                    </div>
                  </div>
                  <div className="hist-actions">
                    {it.pdf_url && <a className="mini" href={it.pdf_url} target="_blank" rel="noreferrer">PDF</a>}
                    <button className="mini" onClick={() => resend(it)} disabled={!client.email || sending === it.id}>
                      {sending === it.id ? '…' : 'Renvoyer'}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
      {msg && <p className="info">{msg}</p>}
    </div>
  )
}
