import { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function ClientForm({ client, onSaved, onCancel }) {
  const [f, setF] = useState({
    nom: client?.nom || '', prenom: client?.prenom || '',
    adresse: client?.adresse || '', ville: client?.ville || '',
    telephone: client?.telephone || '', email: client?.email || '',
  })
  const set = (k, v) => setF(p => ({ ...p, [k]: v }))
  const [status, setStatus] = useState('idle')
  const [msg, setMsg] = useState('')

  async function save() {
    if (!f.nom.trim()) { setStatus('error'); setMsg('Le nom est obligatoire.'); return }
    setStatus('working'); setMsg('')
    try {
      const payload = {
        nom: f.nom.trim(), prenom: f.prenom.trim() || null,
        adresse: f.adresse.trim() || null, ville: f.ville.trim() || null,
        telephone: f.telephone.trim() || null, email: f.email.trim() || null,
      }
      let saved
      if (client?.id) {
        const { data, error } = await supabase.from('clients').update(payload).eq('id', client.id).select().single()
        if (error) throw error; saved = data
      } else {
        const { data, error } = await supabase.from('clients').insert(payload).select().single()
        if (error) throw error; saved = data
      }
      onSaved(saved)
    } catch (err) {
      setStatus('error'); setMsg('Erreur : ' + (err?.message || err))
    }
  }

  const working = status === 'working'
  return (
    <div className="form">
      <div className="form-client">
        <h1>{client ? 'Modifier le client' : 'Nouveau client'}</h1>
        <p>{client ? 'Mettez à jour les informations du client' : 'Ajoutez un client à votre liste'}</p>
      </div>

      <label className="field"><span>Nom *</span>
        <input value={f.nom} onChange={e => set('nom', e.target.value)} /></label>
      <label className="field"><span>Prénom</span>
        <input value={f.prenom} onChange={e => set('prenom', e.target.value)} /></label>
      <label className="field"><span>Adresse</span>
        <input value={f.adresse} onChange={e => set('adresse', e.target.value)} placeholder="N° et rue" /></label>
      <label className="field"><span>Ville</span>
        <input value={f.ville} onChange={e => set('ville', e.target.value)} placeholder="Martigues, Istres…" /></label>
      <label className="field"><span>Téléphone</span>
        <input value={f.telephone} onChange={e => set('telephone', e.target.value)} /></label>
      <label className="field"><span>Email</span>
        <input type="email" value={f.email} onChange={e => set('email', e.target.value)} placeholder="pour l'envoi du certificat" /></label>

      {msg && <p className={status === 'error' ? 'error' : 'info'}>{msg}</p>}
      <div className="actions-bar">
        <button className="btn btn--ghost" onClick={onCancel} disabled={working}>Annuler</button>
        <button className="btn btn--primary" onClick={save} disabled={working}>{working ? 'Enregistrement…' : 'Enregistrer'}</button>
      </div>
    </div>
  )
}
