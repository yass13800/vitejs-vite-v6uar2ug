export const APPAREILS = [
  'Cheminée foyer ouvert', 'Cheminée foyer fermé', 'Insert', 'Poêle à bois',
  'Poêle à granulés', 'Poêle à charbon', 'Chaudière fioul', 'Conduit gaz',
  'Four à pizza', 'Conduit barbecue', 'Autre',
]
export const COMBUSTIBLES = [
  ['bois', 'Bois bûche'], ['granules', 'Granulés'], ['charbon', 'Charbon'],
  ['fioul', 'Fioul'], ['gaz', 'Gaz'],
]
export const NATURE_CONDUIT = [
  ['maconne', 'Maçonné / boisseau'], ['inox', 'Tubage inox'],
  ['metal', 'Métallique'], ['flexible', 'Tubage flexible'], ['autre', 'Autre'],
]
export const TRAVAUX = [
  ['rama', 'Ramonage mécanique au hérisson adapté'],
  ['vac', 'Vérification de la vacuité sur toute la longueur'],
  ['tirage', 'Contrôle du tirage et de l’évacuation des fumées'],
  ['obstr', 'Vérification absence d’obstruction (nid, dépôts…)'],
  ['debis', 'Débistrage du conduit'],
  ['depous', 'Dépoussiérage / aspiration des suies'],
  ['visuel', 'Contrôle visuel du conduit et des raccordements'],
  ['foyer', 'Nettoyage du foyer / de l’appareil'],
  ['essai', 'Essai fumée / vérification d’étanchéité'],
]
export const METHODE_ACCES = [
  ['haut', 'Par le haut (toiture)'], ['bas', 'Par le bas (foyer)'],
  ['trappe', 'Par trappe de visite'],
]
export const SUIES = [['faible', 'Faible'], ['moyenne', 'Moyenne'], ['importante', 'Importante']]
export const ETAT = [['bon', 'Bon'], ['moyen', 'Moyen'], ['mauvais', 'Mauvais']]
export const BISTRE = [['non', 'Non'], ['leger', 'Léger'], ['modere', 'Modéré'], ['important', 'Important']]
export const ANOMALIES = [
  ['aucune', 'Aucune'], ['fissure', 'Fissuration'], ['etancheite', 'Défaut d’étanchéité'],
  ['degrade', 'Conduit dégradé'], ['raccord', 'Défaut de raccordement'], ['autre', 'Autre'],
]
export const QUALITE = [['proprio', 'Propriétaire'], ['locataire', 'Locataire'], ['syndic', 'Syndic / Gestionnaire']]
export const CONCLUSION = [
  ['vacant', 'Conduit contrôlé VACANT — apte à un fonctionnement normal'],
  ['reserve', 'Anomalies constatées — apte SOUS RÉSERVE des travaux préconisés'],
  ['inapte', 'Conduit déclaré INAPTE à l’usage en l’état — mise en sécurité conseillée'],
]
export const FREQUENCE = [['1', '1 ramonage / an (cas général)'], ['2', '2 ramonages / an']]
export const REGLEMENT = [['especes', 'Espèces'], ['cheque', 'Chèque'], ['cb', 'Carte bancaire'], ['virement', 'Virement']]
export const labelOf = (arr, v) => (arr.find(([k]) => k === v) || [null, v || '—'])[1]
