import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'
import {
  APPAREILS, COMBUSTIBLES, NATURE_CONDUIT, TRAVAUX, METHODE_ACCES, SUIES,
  ETAT, BISTRE, ANOMALIES, QUALITE, CONCLUSION, FREQUENCE, REGLEMENT,
} from '../lib/ficheOptions'

const C = { soot: '#1c1b1a', brass: '#9a6a1e', line: '#d6d2ca', muted: '#5b554d', soft: '#f4f3f0' }

const s = StyleSheet.create({
  page: { paddingTop: 24, paddingBottom: 70, paddingHorizontal: 30, fontSize: 8.4, fontFamily: 'Helvetica', color: C.soot, lineHeight: 1.4 },
  band: { backgroundColor: C.soot, color: '#f6f5f2', padding: 10, borderRadius: 4 },
  brand: { fontFamily: 'Helvetica-Bold', fontSize: 14, letterSpacing: 0.5 },
  tagline: { fontSize: 7.5, color: '#d8d2c8', marginTop: 1 },
  contact: { fontSize: 7, color: '#b8b2a8', marginTop: 4 },
  emetteur: { borderWidth: 1, borderColor: C.line, padding: 6, marginTop: 8, fontSize: 7.6, color: C.muted },
  title: { fontFamily: 'Helvetica-Bold', fontSize: 12, textAlign: 'center', marginTop: 12 },
  sub: { fontSize: 7.5, textAlign: 'center', color: C.brass, marginBottom: 8 },
  metaRow: { flexDirection: 'row', borderWidth: 1, borderColor: C.line, marginBottom: 4 },
  metaCell: { flex: 1, padding: 5, borderRightWidth: 1, borderColor: C.line },
  metaCellLast: { flex: 1, padding: 5 },
  metaLabel: { fontSize: 6.5, color: C.brass, fontFamily: 'Helvetica-Bold', letterSpacing: 0.4 },
  metaVal: { fontSize: 9.5, marginTop: 1 },
  secHead: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 11, marginBottom: 5 },
  secNum: { backgroundColor: C.soot, color: '#f6f5f2', fontFamily: 'Helvetica-Bold', fontSize: 7.5, width: 13, height: 13, textAlign: 'center', paddingTop: 2.5, borderRadius: 2 },
  secTitle: { fontFamily: 'Helvetica-Bold', fontSize: 8.6, letterSpacing: 0.5 },
  kv: { flexDirection: 'row', marginBottom: 1.5 },
  k: { width: 96, color: C.muted },
  v: { flex: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell2: { width: '50%', flexDirection: 'row', alignItems: 'center', marginBottom: 2, paddingRight: 4 },
  cell3: { width: '33.33%', flexDirection: 'row', alignItems: 'center', marginBottom: 2, paddingRight: 4 },
  box: { width: 8, height: 8, borderWidth: 1, borderColor: '#9a948a', marginRight: 4, marginTop: 0.5 },
  boxOn: { backgroundColor: C.soot, borderColor: C.soot },
  boxTxt: { flex: 1 },
  note: { borderWidth: 1, borderColor: C.line, backgroundColor: C.soft, padding: 6, minHeight: 22, marginTop: 3 },
  certBox: { borderWidth: 1, borderColor: C.brass, padding: 8, marginTop: 4 },
  sigRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  sigCol: { flex: 1, borderWidth: 1, borderColor: C.line, padding: 6 },
  sigImg: { width: '100%', height: 46, objectFit: 'contain', marginTop: 3 },
  sigLine: { borderTopWidth: 1, borderColor: C.line, marginTop: 3, height: 46 },
  footer: { position: 'absolute', left: 30, right: 30, bottom: 24, borderTopWidth: 1, borderTopColor: C.line, paddingTop: 6, fontSize: 6.5, color: C.muted },
})

const Box = ({ on }) => <View style={[s.box, on && s.boxOn]} />

// Grille de cases. items: tableau ; label(o) ; on(o)
function Grid({ items, label, on, cols = 2 }) {
  const cs = cols === 3 ? s.cell3 : s.cell2
  return (
    <View style={s.grid}>
      {items.map((o, i) => (
        <View style={cs} key={i}>
          <Box on={on(o)} /><Text style={s.boxTxt}>{label(o)}</Text>
        </View>
      ))}
    </View>
  )
}

function Sec({ n, title, children }) {
  return (
    <View wrap={false}>
      <View style={s.secHead}>
        <Text style={s.secNum}>{n}</Text><Text style={s.secTitle}>{title}</Text>
      </View>
      {children}
    </View>
  )
}

export default function FicheDoc({ d }) {
  const p = d.profil || {}
  const cl = d.client || {}
  const has = (arr, k) => (arr || []).includes(k)

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.band}>
          <Text style={s.brand}>PROTECH RAMONAGE</Text>
          <Text style={s.tagline}>Un ramonage pro — la qualité &amp; la sécurité en plus</Text>
          <Text style={s.contact}>
            {(p.telephone || '06 76 85 82 96')} · {(p.email_envoi || 'contact@protech-ramonage.fr')} · protech-ramonage.fr
          </Text>
        </View>

        <View style={s.emetteur}>
          <Text>Émetteur : {p.raison_sociale || '—'}   ·   SIRET {p.siret || '—'}</Text>
          <Text>Assurance RC Pro : {p.rc_pro || '—'}{p.adresse ? `   ·   ${p.adresse}` : ''}</Text>
        </View>

        <Text style={s.title}>FICHE D'INTERVENTION &amp; CERTIFICAT DE RAMONAGE</Text>
        <Text style={s.sub}>Conforme au décret n° 2023-641 du 20 juillet 2023</Text>

        <View style={s.metaRow}>
          <View style={s.metaCell}><Text style={s.metaLabel}>N° DE FICHE</Text><Text style={s.metaVal}>{d.numero}</Text></View>
          <View style={s.metaCell}><Text style={s.metaLabel}>DATE</Text><Text style={s.metaVal}>{d.dateStr}</Text></View>
          <View style={s.metaCell}><Text style={s.metaLabel}>ARRIVÉE</Text><Text style={s.metaVal}>{d.heure_arrivee || '—'}</Text></View>
          <View style={s.metaCellLast}><Text style={s.metaLabel}>FIN</Text><Text style={s.metaVal}>{d.heure_fin || '—'}</Text></View>
        </View>

        <Sec n="1" title="COMMANDITAIRE / CLIENT">
          <View style={s.kv}><Text style={s.k}>Nom &amp; prénom</Text><Text style={s.v}>{cl.nom} {cl.prenom}</Text></View>
          <View style={s.kv}><Text style={s.k}>Adresse</Text><Text style={s.v}>{cl.adresse || '—'}</Text></View>
          <View style={s.kv}><Text style={s.k}>CP / Ville</Text><Text style={s.v}>{[d.code_postal, cl.ville].filter(Boolean).join(' ') || '—'}</Text></View>
          <View style={s.kv}><Text style={s.k}>Tél. / Email</Text><Text style={s.v}>{[cl.telephone, cl.email].filter(Boolean).join('  ·  ') || '—'}</Text></View>
          <View style={s.kv}><Text style={s.k}>Qualité</Text><View style={s.v}><Grid cols={3} items={QUALITE} label={o => o[1]} on={o => d.qualite === o[0]} /></View></View>
          {d.adresse_intervention ? <View style={s.kv}><Text style={s.k}>Lieu (si différent)</Text><Text style={s.v}>{d.adresse_intervention}</Text></View> : null}
        </Sec>

        <Sec n="2" title="INSTALLATION RAMONÉE">
          <Text style={{ color: C.muted, marginBottom: 2 }}>Type d'appareil</Text>
          <Grid cols={3} items={APPAREILS} label={o => o} on={o => o === d.type_appareil} />
          <Text style={{ color: C.muted, marginTop: 3, marginBottom: 2 }}>Combustible</Text>
          <Grid cols={3} items={COMBUSTIBLES} label={o => o[1]} on={o => d.combustible === o[0]} />
          <Text style={{ color: C.muted, marginTop: 3, marginBottom: 2 }}>Nature du conduit</Text>
          <Grid cols={3} items={NATURE_CONDUIT} label={o => o[1]} on={o => d.nature_conduit === o[0]} />
          <View style={[s.kv, { marginTop: 3 }]}><Text style={s.k}>Marque / Ø</Text><Text style={s.v}>{[d.marque_modele, d.diametre].filter(Boolean).join('  ·  Ø ') || '—'}</Text></View>
          <View style={s.kv}><Text style={s.k}>Conduits · hauteur</Text><Text style={s.v}>{d.conduits.length || 1} conduit(s){d.hauteur ? `  ·  ~${d.hauteur} m` : ''}</Text></View>
          <View style={s.kv}><Text style={s.k}>Désignation</Text><Text style={s.v}>{d.conduits.map(c => c.designation).filter(Boolean).join(' ; ') || '—'}</Text></View>
        </Sec>

        <Sec n="3" title="TRAVAUX RÉALISÉS">
          <Grid cols={2} items={TRAVAUX} label={o => o[1]} on={o => has(d.travaux, o[0])} />
          <View style={[s.kv, { marginTop: 4 }]}><Text style={s.k}>Méthode</Text><View style={s.v}><Grid cols={3} items={METHODE_ACCES} label={o => o[1]} on={o => has(d.methode_acces, o[0])} /></View></View>
          <View style={s.kv}><Text style={s.k}>Suies retirées</Text><View style={s.v}><Grid cols={3} items={SUIES} label={o => o[1]} on={o => d.quantite_suies === o[0]} /></View></View>
        </Sec>

        <Sec n="4" title="OBSERVATIONS / ÉTAT DU CONDUIT">
          <View style={s.kv}><Text style={s.k}>État général</Text><View style={s.v}><Grid cols={3} items={ETAT} label={o => o[1]} on={o => d.etat_general === o[0]} /></View></View>
          <View style={s.kv}><Text style={s.k}>Bistre / goudron</Text><View style={s.v}><Grid cols={3} items={BISTRE} label={o => o[1]} on={o => d.bistre === o[0]} /></View></View>
          <Text style={{ color: C.muted, marginTop: 2 }}>Anomalies constatées</Text>
          <Grid cols={3} items={ANOMALIES} label={o => o[1]} on={o => has(d.anomalies, o[0])} />
          {d.observations ? <View style={s.note}><Text>{d.observations}</Text></View> : null}
        </Sec>

        <Sec n="5" title="CONCLUSION & CERTIFICAT DE RAMONAGE">
          <View style={s.certBox}>
            <Text style={{ marginBottom: 4 }}>
              Je soussigné, ramoneur identifié en en-tête, certifie avoir procédé au ramonage mécanique du ou des
              conduits de fumée désignés ci-dessus, conformément au décret n° 2023-641 du 20 juillet 2023.
            </Text>
            {CONCLUSION.map((o, i) => (
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 1.5 }} key={i}>
                <Box on={d.conclusion === o[0]} /><Text style={s.boxTxt}>{o[1]}</Text>
              </View>
            ))}
          </View>
        </Sec>

        <Sec n="6" title="RECOMMANDATIONS & PROCHAIN RAMONAGE">
          <View style={s.kv}><Text style={s.k}>Fréquence légale</Text><View style={s.v}><Grid cols={2} items={FREQUENCE} label={o => o[1]} on={o => d.frequence_legale === o[0]} /></View></View>
          <View style={s.kv}><Text style={s.k}>Prochain ramonage</Text><Text style={s.v}>avant le {d.prochainStr}</Text></View>
          {d.travaux_preconises ? <View style={s.note}><Text>{d.travaux_preconises}</Text></View> : null}
        </Sec>

        <Sec n="7" title="PRESTATION & RÈGLEMENT">
          <View style={s.kv}><Text style={s.k}>Prestation</Text><Text style={s.v}>{d.prestation || '—'}</Text></View>
          <View style={s.kv}><Text style={s.k}>Montant TTC</Text><Text style={[s.v, { fontFamily: 'Helvetica-Bold' }]}>{d.montant_ttc ? `${d.montant_ttc} €` : '—'}</Text></View>
          <View style={s.kv}><Text style={s.k}>Règlement</Text><View style={s.v}><Grid cols={3} items={REGLEMENT} label={o => o[1]} on={o => d.mode_reglement === o[0]} /></View></View>
        </Sec>

        <Sec n="8" title="SIGNATURES">
          <View style={s.sigRow}>
            <View style={s.sigCol}>
              <Text style={{ color: C.muted }}>LE RAMONEUR</Text>
              <Text style={{ fontFamily: 'Helvetica-Bold', marginTop: 1 }}>{p.raison_sociale || ''}</Text>
              {d.sigRamoneur ? <Image src={d.sigRamoneur} style={s.sigImg} /> : <View style={s.sigLine} />}
            </View>
            <View style={s.sigCol}>
              <Text style={{ color: C.muted }}>LE CLIENT — « Lu et approuvé »</Text>
              <Text style={{ fontFamily: 'Helvetica-Bold', marginTop: 1 }}>{cl.nom} {cl.prenom}</Text>
              {d.sigClient ? <Image src={d.sigClient} style={s.sigImg} /> : <View style={s.sigLine} />}
            </View>
          </View>
        </Sec>

        <Text style={s.footer} fixed>
          À CONSERVER — document à garder au minimum 2 ans et à présenter à votre assureur en cas de sinistre.
          Cadre légal : décret n° 2023-641 du 20 juillet 2023 (art. R. 1331-15 et suivants du Code de la santé publique),
          applicable depuis le 1er octobre 2023. Au minimum un ramonage tous les 12 mois ; deux ramonages par an pour les
          combustibles solides/liquides ou consommation &gt; 6 m³ de bois ou 2,5 t de granulés. Professionnel qualifié.
        </Text>
      </Page>
    </Document>
  )
}
