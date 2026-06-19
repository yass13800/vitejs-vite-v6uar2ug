import { useState } from 'react'
import { pdf } from '@react-pdf/renderer'
import { supabase } from '../supabaseClient'
import FicheDoc from './CertificatPDF'
import Signature from './Signature'
import {
  APPAREILS, COMBUSTIBLES, NATURE_CONDUIT, TRAVAUX, METHODE_ACCES, SUIES,
  ETAT, BISTRE, ANOMALIES, QUALITE, CONCLUSION, FREQUENCE, REGLEMENT,
} from '../lib/ficheOptions'

const CONSEILS_BOIS =
  "Utilisez un combustible sec (bois stocké à l'abri, humidité < 20 %). Ne brûlez ni déchets ni bois traité. " +
  "Faites ramoner le conduit au moins une fois par an (deux fois pour les combustibles solides, dont une en " +
  "période de chauffe). Surveillez le bon tirage et l'absence de refoulement de fumée."

const fmt = d => d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
const pair = o => (Array.isArray(o) ? o : [o, o])

function Radio({ options, value, onChange }) {
  return (
    <div className="opts">
      {options.map(o => { const [k, l] = pair(o); return (
        <label key={k} className={'opt radio' + (value === k ? ' on' : '')}>
          <input type="radio" checked={value === k} onChange={() => onChange(k)} />
          <span className="mark" /><span>{l}</span>
        </label>) })}
    </div>
  )
}
function Checks({ options, value, onChange }) {
  const has = k => value.includes(k)
  const toggle = k => onChange(has(k) ? value.filter(x => x !== k) : [...value, k])
  return (
    <div className="opts">
      {options.map(o => { const [k, l] = pair(o); return (
        <label key={k} className={'opt' + (has(k) ? ' on' : '')}>
          <input type="checkbox" checked={has(k)} onChange={() => toggle(k)} />
          <span className="mark" /><span>{l}</span>
        </label>) })}
    </div>
  )
}
function Section({ n, title, children }) {
  return (
    <section>
      <div className="fiche-sec"><h2><i>{n}</i>{title}</h2></div>
      <div className="sub-rule" />
      {children}
    </section>
  )
}

function blobToBase64(blob) {
  return new Promise((res, rej) => {
    const r = new FileReader()
    r.onloadend = () => res(String(r.result).split(',')[1])
    r.onerror = rej
    r.readAsDataURL(blob)
  })
}

export default function InterventionForm({ client, profil, onDone }) {
  const today = new Date().toISOString().slice(0, 10)
  const [f, setF] = useState({
    date: today, heure_arrivee: '', heure_fin: '',
    qualite: 'proprio', code_postal: '', adresse_intervention: '',
    type_appareil: 'Cheminée foyer fermé', combustible: 'bois', nature_conduit: 'maconne',
    marque_modele: '', diametre: '', hauteur: '',
    conduits: [{ designation: 'Conduit de fumée' }],
    travaux: ['rama', 'vac', 'tirage', 'obstr'], methode_acces: ['haut'], quantite_suies: 'moyenne',
    etat_general: 'bon', bistre: 'non', anomalies: ['aucune'], observations: '',
    conclusion: 'vacant', frequence_legale: '1', prochain: '', travaux_preconises: CONSEILS_BOIS,
    prestation: 'Ramonage', montant_ttc: '', mode_reglement: '',
    sigRamoneur: profil?.signature_url || null, sigClient: null,
  })
  const set = (k, v) => setF(p => ({ ...p, [k]: v }))
  const [signManuel, setSignManuel] = useState(false)
  const [status, setStatus] = useState('idle')
  const [msg, setMsg] = useState('')

  const estBois = ['bois', 'granules', 'charbon'].includes(f.combustible)
  const prochainDate = (() => {
    if (f.prochain) return new Date(f.prochain)
    const d = new Date(f.date); d.setMonth(d.getMonth() + (f.combustible === 'bois' || f.combustible === 'charbon' ? 6 : 12))
    return d
  })()

  function buildData() {
    const numero = `${new Date(f.date).getFullYear()}-${String(Date.now()).slice(-5)}`
    return {
      ...f, numero, profil, client,
      dateStr: fmt(new Date(f.date)), prochainStr: fmt(prochainDate),
      conduits: f.conduits.filter(c => c.designation.trim()),
      observations: f.observations.trim(),
      travaux_preconises: f.travaux_preconises.trim(),
    }
  }
  const makeBlob = async d => await pdf(<FicheDoc d={d} />).toBlob()

  async function handleDownload() {
    const d = buildData(); const blob = await makeBlob(d)
    const url = URL.createObjectURL(blob); const a = document.createElement('a')
    a.href = url; a.download = `fiche-${d.numero}.pdf`; a.click(); URL.revokeObjectURL(url)
  }

  async function handleSend() {
    setStatus('working'); setMsg('Génération de la fiche…')
    try {
      const d = buildData(); const blob = await makeBlob(d)
      const path = `${client.id}/${d.numero}.pdf`
      await supabase.storage.from('certificats').upload(path, blob, { contentType: 'application/pdf', upsert: true })
      const { data: pub } = supabase.storage.from('certificats').getPublicUrl(path)

      const { data: interv, error: e1 } = await supabase.from('interventions').insert({
        client_id: client.id, date_intervention: f.date, heure_arrivee: f.heure_arrivee || null,
        heure_fin: f.heure_fin || null, qualite: f.qualite, code_postal: f.code_postal || null,
        adresse_intervention: f.adresse_intervention || null, type_appareil: f.type_appareil,
        combustible: f.combustible, nature_conduit: f.nature_conduit, marque_modele: f.marque_modele || null,
        diametre: f.diametre || null, hauteur: f.hauteur || null, conduits: d.conduits,
        travaux: f.travaux, methode_acces: f.methode_acces, quantite_suies: f.quantite_suies,
        etat_general: f.etat_general, bistre: f.bistre, anomalies: f.anomalies,
        observations: d.observations, conclusion: f.conclusion, frequence_legale: f.frequence_legale,
        travaux_preconises: d.travaux_preconises, prestation: f.prestation || null,
        montant_ttc: f.montant_ttc ? parseFloat(f.montant_ttc) : null, mode_reglement: f.mode_reglement || null,
        numero_certificat: d.numero, pdf_url: pub.publicUrl,
        validite_jusqu_au: prochainDate.toISOString().slice(0, 10),
      }).select().single()
      if (e1) throw e1

      setMsg('Envoi de l\'email au client…')
      const pdfBase64 = await blobToBase64(blob)
      const html =
        `<p>Bonjour ${client.prenom || ''} ${client.nom},</p>` +
        `<p>Veuillez trouver ci-joint votre fiche d'intervention et certificat de ramonage du ${d.dateStr}. ` +
        `Prochain ramonage recommandé avant le ${d.prochainStr}. À conserver pour votre assurance habitation.</p>` +
        `<p>Cordialement,<br>${profil?.raison_sociale || 'Protech Ramonage'}</p>`
      const { error: e2 } = await supabase.functions.invoke('send-certificat', {
        body: {
          to: client.email, toName: `${client.prenom || ''} ${client.nom}`.trim(),
          subject: 'Votre certificat de ramonage', html,
          pdfBase64, filename: `fiche-${d.numero}.pdf`,
          senderEmail: profil?.email_envoi, senderName: profil?.raison_sociale,
        },
      })
      if (e2) throw e2
      await supabase.from('interventions').update({ email_envoye_le: new Date().toISOString() }).eq('id', interv.id)
      setStatus('done'); setMsg(`Fiche envoyée à ${client.email}.`)
    } catch (err) {
      setStatus('error')
      setMsg('Échec de l\'envoi : ' + (err?.message || err) + ' — le PDF reste téléchargeable.')
    }
  }

  if (status === 'done') {
    return (
      <div className="done">
        <div className="done-mark">✓</div>
        <h2>Fiche envoyée</h2>
        <p>{msg}</p>
        <div className="done-actions">
          <button className="btn btn--ghost" onClick={handleDownload}>Télécharger une copie</button>
          <button className="btn btn--primary" onClick={onDone}>Retour au client</button>
        </div>
      </div>
    )
  }
  const noEmail = !client.email
  const working = status === 'working'
  const lbl = (t, e) => <span>{t}{e ? <em> {e}</em> : null}</span>

  return (
    <div className="form">
      <div className="form-client">
        <h1>{client.nom} {client.prenom}</h1>
        <p>{client.adresse}{client.ville ? `, ${client.ville}` : ''}{client.email ? ` · ${client.email}` : ''}</p>
      </div>

      <div className="two">
        <label className="field">{lbl('Date')}<input type="date" value={f.date} onChange={e => set('date', e.target.value)} /></label>
        <div className="two">
          <label className="field">{lbl('Arrivée')}<input type="time" value={f.heure_arrivee} onChange={e => set('heure_arrivee', e.target.value)} /></label>
          <label className="field">{lbl('Fin')}<input type="time" value={f.heure_fin} onChange={e => set('heure_fin', e.target.value)} /></label>
        </div>
      </div>

      <Section n="1" title="Client">
        <div className="field">{lbl('Qualité')}<Radio options={QUALITE} value={f.qualite} onChange={v => set('qualite', v)} /></div>
        <div className="two">
          <label className="field">{lbl('Code postal')}<input value={f.code_postal} onChange={e => set('code_postal', e.target.value)} placeholder="13500" /></label>
          <label className="field">{lbl('Adresse d\'intervention', '(si différente)')}<input value={f.adresse_intervention} onChange={e => set('adresse_intervention', e.target.value)} /></label>
        </div>
      </Section>

      <Section n="2" title="Installation ramonée">
        <div className="field">{lbl('Type d\'appareil')}<Radio options={APPAREILS} value={f.type_appareil} onChange={v => set('type_appareil', v)} /></div>
        <div className="field">{lbl('Combustible')}<Radio options={COMBUSTIBLES} value={f.combustible} onChange={v => set('combustible', v)} /></div>
        <div className="field">{lbl('Nature du conduit')}<Radio options={NATURE_CONDUIT} value={f.nature_conduit} onChange={v => set('nature_conduit', v)} /></div>
        <div className="two">
          <label className="field">{lbl('Marque / modèle')}<input value={f.marque_modele} onChange={e => set('marque_modele', e.target.value)} /></label>
          <div className="two">
            <label className="field">{lbl('Ø / section')}<input value={f.diametre} onChange={e => set('diametre', e.target.value)} placeholder="180 mm" /></label>
            <label className="field">{lbl('Hauteur (m)')}<input value={f.hauteur} onChange={e => set('hauteur', e.target.value)} placeholder="6" /></label>
          </div>
        </div>
        <div className="field">{lbl('Conduit(s) ramoné(s)')}
          {f.conduits.map((c, i) => (
            <div className="conduit-row" key={i}>
              <input value={c.designation} onChange={e => set('conduits', f.conduits.map((x, j) => j === i ? { designation: e.target.value } : x))} />
              {f.conduits.length > 1 && <button className="icon-btn" onClick={() => set('conduits', f.conduits.filter((_, j) => j !== i))}>×</button>}
            </div>
          ))}
          <button className="add" onClick={() => set('conduits', [...f.conduits, { designation: '' }])}>+ Ajouter un conduit</button>
        </div>
      </Section>

      <Section n="3" title="Travaux réalisés">
        <div className="field">{lbl('Opérations')}<Checks options={TRAVAUX} value={f.travaux} onChange={v => set('travaux', v)} /></div>
        <div className="field">{lbl('Méthode d\'accès')}<Checks options={METHODE_ACCES} value={f.methode_acces} onChange={v => set('methode_acces', v)} /></div>
        <div className="field">{lbl('Quantité de suies')}<Radio options={SUIES} value={f.quantite_suies} onChange={v => set('quantite_suies', v)} /></div>
      </Section>

      <Section n="4" title="Observations / état">
        <div className="field">{lbl('État général')}<Radio options={ETAT} value={f.etat_general} onChange={v => set('etat_general', v)} /></div>
        <div className="field">{lbl('Bistre / goudron')}<Radio options={BISTRE} value={f.bistre} onChange={v => set('bistre', v)} /></div>
        <div className="field">{lbl('Anomalies')}<Checks options={ANOMALIES} value={f.anomalies} onChange={v => set('anomalies', v)} /></div>
        <label className="field">{lbl('Observations détaillées')}<textarea rows={2} value={f.observations} onChange={e => set('observations', e.target.value)} placeholder="Points à surveiller… (facultatif)" /></label>
      </Section>

      <Section n="5" title="Conclusion">
        <div className="field">{lbl('Aptitude du conduit')}<Radio options={CONCLUSION} value={f.conclusion} onChange={v => set('conclusion', v)} /></div>
      </Section>

      <Section n="6" title="Recommandations">
        <div className="field">{lbl('Fréquence légale')}<Radio options={FREQUENCE} value={f.frequence_legale} onChange={v => set('frequence_legale', v)} /></div>
        <label className="field">{lbl('Prochain ramonage avant le')}<input type="date" value={f.prochain || prochainDate.toISOString().slice(0, 10)} onChange={e => set('prochain', e.target.value)} /></label>
        <label className="field">{lbl('Travaux préconisés / conseils', estBois ? '(obligatoire — appareil à bois)' : '')}<textarea rows={3} value={f.travaux_preconises} onChange={e => set('travaux_preconises', e.target.value)} /></label>
      </Section>

      <Section n="7" title="Prestation & règlement">
        <label className="field">{lbl('Prestation')}<input value={f.prestation} onChange={e => set('prestation', e.target.value)} /></label>
        <div className="two">
          <label className="field">{lbl('Montant TTC')}<div className="amount"><input type="number" inputMode="decimal" value={f.montant_ttc} onChange={e => set('montant_ttc', e.target.value)} placeholder="75" /><span className="eur">€</span></div></label>
          <div className="field">{lbl('Règlement')}<Radio options={REGLEMENT} value={f.mode_reglement} onChange={v => set('mode_reglement', v)} /></div>
        </div>
      </Section>

      <Section n="8" title="Signatures">
        {profil?.signature_url && !signManuel ? (
          <div className="field">
            <span>Le ramoneur</span>
            <div className="sig-saved">
              <img src={profil.signature_url} alt="Signature enregistrée" />
              <span className="sig-ok">Signature enregistrée ✓</span>
            </div>
            <button className="add" onClick={() => { setSignManuel(true); set('sigRamoneur', null) }}>Signer à la main à la place</button>
          </div>
        ) : (
          <Signature label="Le ramoneur" onChange={v => set('sigRamoneur', v)} />
        )}
        <Signature label="Le client" hint="« Lu et approuvé »" onChange={v => set('sigClient', v)} />
      </Section>

      <p className="validite-note">Prochain ramonage : avant le {fmt(prochainDate)}.</p>
      {msg && <p className={status === 'error' ? 'error' : 'info'}>{msg}</p>}
      {noEmail && <p className="warn">Ce client n'a pas d'email : vous pouvez générer le PDF, mais pas l'envoyer.</p>}

      <div className="actions-bar">
        <button className="btn btn--ghost" onClick={handleDownload} disabled={working}>Télécharger</button>
        <button className="btn btn--primary" onClick={handleSend} disabled={working || noEmail}>
          {working ? msg : 'Générer et envoyer'}
        </button>
      </div>
    </div>
  )
}
