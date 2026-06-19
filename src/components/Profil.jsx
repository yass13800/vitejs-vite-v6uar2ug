import { useState } from 'react'
import { supabase } from '../supabaseClient'
import Signature from './Signature'

function dataUrlToBlob(dataUrl) {
  const [head, b64] = dataUrl.split(',')
  const mime = head.match(/:(.*?);/)[1]
  const bin = atob(b64); const arr = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i)
  return new Blob([arr], { type: mime })
}

export default function Profil({ profil, onSaved, onDone }) {
  const [f, setF] = useState({
    raison_sociale: profil?.raison_sociale || '', siret: profil?.siret || '',
    rc_pro: profil?.rc_pro || '', adresse: profil?.adresse || '',
    telephone: profil?.telephone || '', email_envoi: profil?.email_envoi || '',
  })
  const set = (k, v) => setF(p => ({ ...p, [k]: v }))
  const [newSig, setNewSig] = useState(null)
  const [status, setStatus] = useState('idle')
  const [msg, setMsg] = useState('')

  async function save() {
    setStatus('working'); setMsg('Enregistrement…')
    try {
      let signature_url = profil?.signature_url || null
      if (newSig) {
        const path = `profil/signature-${Date.now()}.png`
        const { error } = await supabase.storage.from('certificats')
          .upload(path, dataUrlToBlob(newSig), { contentType: 'image/png', upsert: true })
        if (error) throw error
        signature_url = supabase.storage.from('certificats').getPublicUrl(path).data.publicUrl
      }
      const payload = { ...f, signature_url }
      let saved
      if (profil?.id) {
        const { data, error } = await supabase.from('profil_pro').update(payload).eq('id', profil.id).select().single()
        if (error) throw error; saved = data
      } else {
        const { data, error } = await supabase.from('profil_pro').insert(payload).select().single()
        if (error) throw error; saved = data
      }
      onSaved(saved); setNewSig(null); setStatus('done'); setMsg('Profil enregistré.')
    } catch (err) {
      setStatus('error'); setMsg('Erreur : ' + (err?.message || err))
    }
  }

  const working = status === 'working'
  return (
    <div className="form">
      <div className="form-client">
        <h1>Réglages</h1>
        <p>Informations de l'entreprise et signature du ramoneur</p>
      </div>

      <label className="field"><span>Raison sociale</span>
        <input value={f.raison_sociale} onChange={e => set('raison_sociale', e.target.value)} /></label>
      <label className="field"><span>SIRET</span>
        <input value={f.siret} onChange={e => set('siret', e.target.value)} /></label>
      <label className="field"><span>Assurance RC Pro</span>
        <input value={f.rc_pro} onChange={e => set('rc_pro', e.target.value)} placeholder="Assureur — n° de police" /></label>
      <label className="field"><span>Adresse</span>
        <input value={f.adresse} onChange={e => set('adresse', e.target.value)} /></label>
      <label className="field"><span>Téléphone</span>
        <input value={f.telephone} onChange={e => set('telephone', e.target.value)} /></label>
      <label className="field"><span>Email expéditeur <em>(à valider dans Brevo)</em></span>
        <input type="email" value={f.email_envoi} onChange={e => set('email_envoi', e.target.value)} /></label>

      <div className="field">
        <span>Signature du ramoneur</span>
        {profil?.signature_url && !newSig && (
          <div className="sig-saved">
            <img src={profil.signature_url} alt="Signature enregistrée" />
            <span className="sig-ok">Signature enregistrée ✓</span>
          </div>
        )}
        <Signature
          label={profil?.signature_url ? 'Re-signer (remplace la signature actuelle)' : 'Tracez votre signature'}
          onChange={setNewSig} />
      </div>

      {msg && <p className={status === 'error' ? 'error' : 'info'}>{msg}</p>}
      <div className="actions-bar">
        <button className="btn btn--ghost" onClick={onDone} disabled={working}>Retour</button>
        <button className="btn btn--primary" onClick={save} disabled={working}>{working ? 'Enregistrement…' : 'Enregistrer'}</button>
      </div>
    </div>
  )
}
