# LUMEN — Contrat technique du moteur 1.0.0

Base de travail : `main` à `9f5c19a`, qui contient déjà `b557af9`. Références : [cadrage MD-01–09](CADRAGE_SYSTEME.md), [revue POC](REVUE_POC_FORECAST.md), [UX](UX_STRATEGY_SIMULATOR.md). Le moteur est local, sans frontend, serveur, base de données, appel externe ni déploiement. Cette implémentation autorisée remplace le statut « à implémenter » du moteur ; les recettes UI restent futures.

## Architecture et exécution

| Module | Responsabilité | Entrée → sortie |
|---|---|---|
| `contracts.py` | Types, version, décodage strict, provenance, états, empreintes | JSON → `Scenario` ; types des résultats |
| `historical.py` | Adaptateur Ridge du POC, export des coefficients, inférence, baselines explicites, calendrier et profil saisonnier | Observations historiques → `ModelArtifact` → `HistoricalForecast` ; profil DE accepté séparément |
| `commercial.py` | Scénario Allemagne A **ou** B, réponse prix, cohortes, capacité | Hypothèses acceptées → demande puis ventes conditionnelles |
| `economics.py` | Identités MD-05/06, cumuls, marge, seuil, statut de récupération | Ventes/coûts → KPI, jamais effet causal mesuré |
| `engine.py` | Orchestration déterministe, contrefactuel, variantes, recommandation | Scénario → `Evaluation`, puis comparaison explicable |

Python 3.11+ ; environnement testé Python 3.14 avec NumPy 2.5.3 et scikit-learn 1.9.1, comme le POC. Seul l’entraînement Ridge requiert ces bibliothèques. L’inférence d’un artefact déjà exporté, les scénarios et l’économie utilisent la bibliothèque standard.

```sh
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements-engine.txt
.venv/bin/python -m unittest discover -s tests -v
.venv/bin/python -m lumen_engine examples/scenario.json --output work/evaluation.json
.venv/bin/python -m examples.run --output work/engine-example.json
```

La dernière commande exécute historique → profil saisonnier transféré explicitement → scénario allemand → économie → trois variantes → recommandation entre mix DTC et Retail. Elle exporte aussi l’artefact et les prévisions historiques. Les valeurs DE (niveau, coûts, disponibilité, budgets, priorité) sont **des fixtures synthétiques**, pas des conclusions du POC. La commande précédente permet l’évaluation de tout JSON conforme sans entraîner Ridge.

## Contrats stables

Types sources : [contracts.py](lumen_engine/contracts.py). Schémas structurels : [Scenario](schemas/Scenario.schema.json), [Evaluation](schemas/Evaluation.schema.json), [artefact](schemas/ModelArtifact.schema.json), [forecast](schemas/HistoricalForecast.schema.json), [politique](schemas/DecisionPolicy.schema.json), [recommandation](schemas/Recommendation.schema.json), [ROI](schemas/ROIResult.schema.json), [incertitude](schemas/UncertaintyResult.schema.json). Régénérer par `python -m lumen_engine.json_schema`. Les schémas contrôlent la structure ; `evaluate` contrôle aussi les unités, domaines, calendriers, clés et sommes. Un schéma structurel valide n’est pas une validation métier.

Toutes les propriétés sont requises, champs inconnus rejetés ; `null` représente un manque numérique. Les listes temporelles ont exactement 12 valeurs. Les variantes commerciales sont disjointes : un objet contenant A et B est rejeté. Les noms de canaux de vente sont des clés explicites, distinctes des noms de campagnes marketing. La version de schéma inconnue est rejetée sans migration automatique.

`Scenario` conserve `schema_version`, `scenario_id`, `revision`, `country=DE`, `launch`, `horizon=12`, `commercial`, `marketing`, `economics`, déclaration de disponibilité et capacités éventuelles. Lancement au premier jour du mois. Chaque scénario contient ses propres valeurs ; aucune échelle, taux de conversion, CAC ou coût DE n’est choisi par le moteur.

`Parameter = {value, unit, kind, source, accepted}`. `kind` appartient à DATA/MODEL/ASSUMPTION/EXTERNAL. Les paramètres commerciaux et économiques DE exigent ASSUMPTION ou EXTERNAL : une statistique DATA historique ne peut pas devenir une vérité DE par simple copie. Source non vide et unité exacte requises : `can`, `can/month`, `EUR`, `EUR/can`, `ratio`, `EUR/customer`, `can/customer`, `customer`. Numériques finis, non négatifs ; CAC/référence prix strictement positifs ; proportions ≤ 1. `accepted=false` ou `value=null` rend les sorties dépendantes non calculables. `Declaration` porte texte, provenance, source et acceptation pour les conventions non numériques. Une acceptation EXTERNAL signifie que l’utilisateur confirme l’usage de cette source, pas qu’un service externe l’a vérifiée.

La provenance DATA des observations est portée par leurs champs, le chargeur dédié et l’empreinte du panel d’apprentissage. L’artefact et les calculs sont MODEL. Le profil transféré est constitué de paramètres ASSUMPTION qui citent l’empreinte d’artefact et la convention de transfert. Un EXTERNAL manquant peut être remplacé dans une nouvelle révision par ASSUMPTION ; conserver la référence manquante dans `source`.

`Evaluation` retourne : versions schéma/moteur, identifiant/révision, empreinte, copie JSON détachée des entrées, mois, demande/ventes par canal, marge unitaire, CA/revenu net/contribution par canal, séries agrégées, cumuls 3/6/12, couverture marketing, récupération du lancement, seuil et limites. Chaque métrique contient `value`, `unit`, `status`, `reasons`. États : `ok`, `not_calculable`, `not_applicable`, `not_reached`, `covered_at_start`, `no_finite_threshold`. Aucune valeur manquante ne vaut zéro. Les motifs citent les chemins d’entrée manquants ou non acceptés ; la copie des entrées fournit la chaîne de provenance.

Un contrat mal formé lève `ContractError` ; une hypothèse manquante ne lève pas d’erreur structurelle, elle produit des résultats partiels. La CLI renvoie un diagnostic JSON sur stderr et un code 2 pour une entrée invalide. Les erreurs techniques d’entraînement ne déclenchent jamais un remplacement automatique. Pas de date courante, hasard ou modification d’entrée dans l’évaluation. Pas d’arrondi intermédiaire ; arrondir uniquement la restitution. Les comparaisons numériques de tests utilisent une tolérance documentée.

## Prévision historique et remplacement de Ridge

`RidgeForecaster.fit(observations, origin)` filtre strictement avant l’origine ; déduplique les mêmes cibles, refuse conflits et panel incomplet. Pays autorisés : Netherlands, Denmark, Sweden. Dates hebdomadaires lundi, cibles positives, au moins 26 semaines consécutives jusqu’à l’origine. Le minimum de 26 semaines reproduit le stress test POC, **pas un seuil de fiabilité métier**. La première semaine est exclue de l’ajustement comme dans les comparaisons apprises du POC.

Modèle `ridge-log-calendar-panel/1.0.0` : log-volume, temps/52, sin/cos annuels, indicatrices pays–canal, standardisation train, Ridge alpha=1. L’artefact JSON exporte ordre des variables, moyennes/échelles, coefficients, constante, dates, séries, cible, versions de bibliothèques et empreinte du panel. `predict` n’utilise que cet artefact ; pas besoin de pickle ou scikit-learn en inférence. L’explication est décomposable en contributions standardisées à log Q ; exp donne des facteurs multiplicatifs, associations sans causalité. Aucun prix/budget futur, revenu, météo ou donnée d’enquête n’est utilisé.

`predict(artifact, horizon)` accepte 1–53 semaines. Les repères POC sont 13/26/52 semaines ; la semaine 53 sert uniquement à couvrir douze mois calendaires chevauchants. L’exemple apprend avant le 29/06/2026 et prédit 53 semaines pour couvrir juillet 2026–juin 2027. Ce choix technique est explicitement exploratoire, sans nouvelle preuve de qualité annuelle. La retransformation par exp n’est pas corrigée ; surveiller biais et tendance exponentielle.

Fallback explicite : `baseline_forecast(rows, origin, horizon, method, reason)` choisit `last` ou `seasonal52`, exige une raison et retourne sa propre version et ses limites. La baseline annuelle exige chaque référence historique t−52 ; aucune extension récursive inventée. Les baselines n’exposent pas un facteur saisonnier isolé : la fonction de transfert Ridge refuse leur substitution implicite.

Le protocole `Forecaster` définit `fit` et `predict`. Pour un autre modèle : ajouter un adaptateur avec identifiant/version distinct, définir son artefact explicite et valider le contrat de forecast, sans modifier le scénario économique. Si le modèle ne sépare pas la saison de la tendance/niveau, ne pas renseigner `seasonal_factor` artificiellement ; créer et valider un adaptateur de transfert différent, ou utiliser un profil explicitement renseigné. La version de modèle inconnue est refusée. Toute sélection exige nouveaux tests temporels par horizon/canal, comparaison baselines/interprétables, seuils métier préenregistrés et période intacte. Aucun nouveau candidat n’est sélectionné automatiquement.

`calendarize` répartit uniformément les volumes hebdomadaires sur sept jours, exige tous les jours de la fenêtre, refuse chevauchements et trous, retourne totaux mensuels et unités hors fenêtre. `german_season_profile` agrège **seulement le facteur saisonnier**, en moyenne journalière par mois puis moyenne mensuelle annuelle 1 ; les niveaux et la tendance sont exclus. Elle exige une déclaration acceptée, cite l’artefact et renvoie l’ordre janvier–décembre. Le transfert d’un seul profil est implémenté ; un agrégat pondéré d’analogues peut être fourni comme profil documenté, sans sélecteur automatique. Aucun WAPE historique ne devient une bande d’incertitude allemande.

## Scénario Allemagne et économie

Mode A : `level × mix × ramp × season × price_factor`. Mix total 1, saison annuelle moyenne 1, montée en charge bornée. Le budget modifie les dépenses mais pas automatiquement la demande. Réponse prix explicite : volume constant accepté ou ratio d’acceptations à des prix fournis, interpolation seulement si autorisée, aucune extrapolation. L’acceptation déclarée n’est pas assimilée à un achat mesuré ; les valeurs de courbe doivent être justifiées dans la déclaration. Une réponse hors domaine bloque les volumes, pas la marge unitaire.

Mode B : base organique + somme des cohortes `budget/CAC × déduplication × incrémentalité × allocation × unités par âge de cohorte`. Les budgets ne sont stockés qu’une fois dans `Scenario.marketing` ; les campagnes y font référence par nom. Le zéro budget ne nécessite pas de CAC artificiel. Toute campagne non nulle exige un plafond de budget accepté pour la linéarité ; referral exige aussi une population éligible, sans activation automatique. Les achats futurs restent dans leur période, ceux hors horizon sont exclus. Les profils de cohorte sont communs aux acquisitions d’une même campagne dans ce MVP. La déclaration de dépendances explique où prix/saison/montée en charge sont inclus, sans multiplicateur supplémentaire. Un changement de ces hypothèses exige une nouvelle saisie des entrées concernées.

Demande et ventes sont séparées : disponibilité totale acceptée ou `min(demande, capacité)` par canal/mois, sans report de pertes ni redistribution. Une capacité manquante bloque les ventes dépendantes.

CA consommateur = prix × ventes. Revenu net conventionnel = `[prix × (1−retailer−distributor−payment) − fulfillment] × ventes`. Contribution = revenu net − COGS × ventes. Déductions sur la même base, pas successives. Aucun COGS global ni taxe/consigne codé en dur. Convention économique à accepter ; résultat complet requiert coûts fixes. Une marge négative reste numérique.

Le marketing pré-lancement est à t=0, l’investissement est distinct des coûts fixes. Couverture marketing : cumul contribution−marketing ; récupération lancement : −investissement−marketing pré-lancement + cumul contribution−marketing−fixes. Retourne premier franchissement après négativité, rechute éventuelle, non atteint, couvert dès le départ ou sans objet. Ce sont des flux économiques, **pas un payback de trésorerie** sans calendrier cash validé. Le seuil statique utilise coûts à couvrir/marge du mix seulement avec déclaration de budget indépendant, prix/marges constants et mix explicite compatible avec les ventes calculées ; sinon utiliser les cumuls. Marge ≤ 0 et coûts positifs : aucun seuil fini.

`incremental_roi(current, reference)` exige calendrier et convention comparables, expose Δcontribution et Δmarketing, ratio `(ΔC−ΔB)/ΔB` seulement si ΔB>0, ainsi que récupération incrémentale. Sans contrefactuel : non calculable ; ΔB=0 : sans objet ; ΔB<0 : deltas sans ratio. Si d’autres entrées que les budgets changent, le libellé devient « retour du changement de stratégie ». Coûts fixes additionnels exclus explicitement ; aucune causalité mesurée revendiquée.

## Incertitude et recommandation

`uncertainty` prend exactement trois scénarios complets `pessimistic/base/optimistic`, les évalue indépendamment et conserve toutes les entrées. Aucun coefficient pessimiste/optimiste n’est choisi automatiquement. Les plages min/max de KPI sont les valeurs des scénarios testés, sans probabilité ; un résultat manquant dans une variante rend sa plage non calculable. Les labels ne garantissent pas l’ordre des KPI.

`recommend` compare des évaluations compatibles, avec politique explicite : priorité contribution ou résultat sur 12 mois, plafond marketing accepté, déclaration des priorités. Les résultats incomplets pour ce critère ou hors budget sont exclus avec raison ; les ex æquo restent des propositions multiples. La sortie fournit identifiants/empreintes des propositions et alternatives, KPI bruts, exclusions et règle numérique. Sans priorité, budget accepté ou alternative : arbitrage ouvert. La sélection est une **préférence conditionnelle sur un critère**, pas un optimum global. Les preuves premium et les sacrifices restent à examiner humainement ; aucun score premium inventé. Le filtre d’accès est porté par disponibilité/capacité du scénario, pas un accord de distribution vérifié.

Les résultats portent l’empreinte SHA-256 du scénario JSON canonique, y compris version, provenance et révision. La comparaison refuse une empreinte devenue incohérente ou des versions/calendriers/conventions différents. La future UI doit comparer l’empreinte du résultat à celle du brouillon courant et rejeter les réponses tardives. Les résultats sont des objets locaux de confiance ; aucune signature/authentification ni couche de persistance n’est fournie.

## Vérification et limites encore ouvertes

Les **39 tests passent** dans l’environnement indiqué. Ils couvrent les recettes MD-08 (60 unités réparties 36/24 ; 100 canettes DTC → 177,649 € net et 115,649 € contribution ; ROI 60 % ; récupération période 2 ; seuil 200 unités), manques, domaines, cohorts, capacité, doubles comptes, prix, coûts, empreintes, variantes et comparaison. Le fixture constant vérifie indépendamment 120 000 unités, 262 800 € de CA, 113 425,68 € de contribution et 106 325,68 € de solde de lancement. Ces valeurs sont synthétiques.

La non-régression Ridge compare 1 287 prédictions aux exports POC à `1e-7` canette ; les origines/fenêtres se recouvrent et ne constituent pas 1 287 validations indépendantes. Tests de futur empoisonné, sérialisation, calendrier et transfert sans niveau/tendance. Aucun nouveau benchmark de précision DE, test utilisateur ou frontend.

Restent ouverts : seuils métier et biais acceptable, source temporelle de l’indice, cycles supplémentaires/test intact, validation pays exclu/pilote DE, niveau/mix/acquisition et plages plausibles, conventions fiscales et cash, preuves premium et priorités. Extensions fonctionnelles séparées : recherche de valeurs de bascule, classement multicritère/Pareto, profils multi-analogues intégrés, prix/promotion planifiés, cohortes variant selon date d’acquisition, persistance/scénarios multiutilisateur et export éditorial UX. Elles ne sont pas revendiquées par ce noyau.

Prochaine étape : faire approuver des jeux d’hypothèses et les explications, puis brancher un service d’évaluation/persistance et le prototype UX sur ce contrat. Les tests protègent la chaîne de calcul ; ils ne valident pas les hypothèses commerciales. Aucune publication ni fusion n’est effectuée dans cette tâche.
