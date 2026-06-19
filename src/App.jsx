import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import ClientList from './components/ClientList'
import ClientDetail from './components/ClientDetail'
import ClientForm from './components/ClientForm'
import InterventionForm from './components/InterventionForm'
import Profil from './components/Profil'

function Mark() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 2v9" stroke="#c6892f" strokeWidth="2" strokeLinecap="round"/>
      <path d="M12 11c-3.5 0-6 1.6-6 4.2C6 18 8.7 20 12 20s6-2 6-4.8C18 12.6 15.5 11 12 11Z" stroke="#f6f5f2" strokeWidth="1.6"/>
      <path d="M7.5 13.2 5 12m11.5 1.2L19 12M7 16H4.5m12.5 0h2.5M8 18.6 6 20m8-1.4 2 1.4" stroke="#c6892f" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  )
}
function Gear() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1.08-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1.08 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/>
    </svg>
  )
}

function Login() {
  const [email, setEmail] = useState('')
  const [pwd, setPwd] = useState('')
  const [err, setErr] = useState(null)
  const [busy, setBusy] = useState(false)
  async function signIn() {
    setBusy(true); setErr(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password: pwd })
    if (error) setErr('Identifiants incorrects.')
    setBusy(false)
  }
  return (
    <div className="login">
      <div className="login-card">
        <div className="brand brand--login"><Mark /><span>Protech Ramonage</span></div>
        <p className="login-sub">Espace certificats</p>
        <label className="field"><span>Email</span>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="username" /></label>
        <label className="field"><span>Mot de passe</span>
          <input type="password" value={pwd} onChange={e => setPwd(e.target.value)} autoComplete="current-password"
                 onKeyDown={e => e.key === 'Enter' && signIn()} /></label>
        {err && <p className="error">{err}</p>}
        <button className="btn btn--primary" onClick={signIn} disabled={busy || !email || !pwd}>
          {busy ? 'Connexion…' : 'Se connecter'}
        </button>
      </div>
    </div>
  )
}

export default function App() {
  const [session, setSession] = useState(undefined)
  const [profil, setProfil] = useState(null)
  const [client, setClient] = useState(null)
  const [clientView, setClientView] = useState('detail')   // 'detail' | 'form' | 'edit'
  const [view, setView] = useState('list')                 // 'list' | 'profil' | 'newclient'

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) return
    supabase.from('profil_pro').select('*').limit(1).maybeSingle().then(({ data }) => setProfil(data))
  }, [session])

  if (session === undefined) return <div className="loading">Chargement…</div>
  if (!session) return <Login />

  const openClient = c => { setClient(c); setClientView('detail'); setView('list') }
  const backToList = () => { setClient(null); setView('list') }

  let header, body
  if (view === 'newclient') {
    header = <button className="back" onClick={() => setView('list')}>‹ Clients</button>
    body = <ClientForm onSaved={c => openClient(c)} onCancel={() => setView('list')} />
  } else if (client && clientView === 'edit') {
    header = <button className="back" onClick={() => setClientView('detail')}>‹ Retour</button>
    body = <ClientForm client={client} onSaved={c => { setClient(c); setClientView('detail') }} onCancel={() => setClientView('detail')} />
  } else if (client && clientView === 'form') {
    header = <button className="back" onClick={() => setClientView('detail')}>‹ Retour</button>
    body = <InterventionForm client={client} profil={profil} onDone={() => setClientView('detail')} />
  } else if (client) {
    header = <button className="back" onClick={backToList}>‹ Clients</button>
    body = <ClientDetail client={client} profil={profil}
             onNew={() => setClientView('form')} onEdit={() => setClientView('edit')} onDeleted={backToList} />
  } else if (view === 'profil') {
    header = <button className="back" onClick={() => setView('list')}>‹ Retour</button>
    body = <Profil profil={profil} onSaved={setProfil} onDone={() => setView('list')} />
  } else {
    header = <div className="brand"><Mark /><span>Protech Ramonage</span></div>
    body = <ClientList onSelect={openClient} onNew={() => setView('newclient')} />
  }

  return (
    <div className="app">
      <header className="topbar">
        {header}
        <div className="top-actions">
          {!client && view === 'list' &&
            <button className="gear" onClick={() => setView('profil')} aria-label="Réglages"><Gear /></button>}
          <button className="signout" onClick={() => supabase.auth.signOut()}>Quitter</button>
        </div>
      </header>
      <main className="content">{body}</main>
    </div>
  )
}
