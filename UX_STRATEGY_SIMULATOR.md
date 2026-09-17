# LUMEN — Spécification UX du MVP

Statut : spécification pour revue, sans frontend implémenté. Références normatives : [CADRAGE_SYSTEME.md](CADRAGE_SYSTEME.md), MD-01 à MD-09 et F01–F08 ; [revue du POC](REVUE_POC_FORECAST.md). Les exemples de recette sont fictifs, jamais des prévisions allemandes.

## Objectif et parcours

Freya prépare des options de lancement ; Jonas examine le positionnement et ses preuves ; Elena examine contribution, dépenses et récupération. Tous consultent le même scénario versionné. Aucun rôle n’impose une priorité implicite.

Parcours principal : ouvrir l’espace scénarios → consulter les preuves utiles → créer une option dans le **Strategy Simulator** → renseigner les hypothèses manquantes → calculer → dupliquer et modifier une stratégie → comparer → tester les hypothèses → examiner une recommandation conditionnelle → enregistrer le choix humain → exporter un dossier figé.

Navigation persistante : Scénarios, Strategy Simulator, Données et preuves, Comparaison, Décision. Les trois dernières vues conservent un lien vers le scénario et sa version. Le Simulator reste l’écran de travail central ; retour depuis une source à la même hypothèse sans perdre le brouillon.

## Écrans du MVP

| Écran | Contenu et actions | Traçabilité |
|---|---|---|
| Scénarios | Liste nom, version, date, mode, état, horizon, dernière évaluation ; créer, ouvrir, dupliquer, sélectionner pour comparaison | F03 |
| Données et preuves | Catalogue, couverture, qualité, ventes NL/DK/SE, enquêtes séparées, prix, canaux, saison, marketing descriptif ; filtres et fiche source/calcul | F01–F02 |
| Strategy Simulator | Paramètres, hypothèses, calculs, KPI, graphiques, sensibilité et accès aux preuves | F03–F07 |
| Comparaison | Deux ou trois options côte à côte, mêmes définitions ; différences de paramètres et résultats, compatibilité et robustesse | F06–F07 |
| Décision | Proposition explicable, alternative, risques, choix humain, justification et export figé | F08 |

Les analyses F02 non encore réalisées ne deviennent pas des graphiques fictifs : état « analyse non disponible » avec source accessible. Les noms/emails des répondants sont exclus.

## Strategy Simulator : organisation

En-tête : nom/version, marché Allemagne, état, date de lancement, horizon « Simulation conditionnelle — 12 mois », lectures 3/6/12 mois, actions Enregistrer le brouillon, Calculer, Dupliquer, Comparer. Bandeau permanent : « Aucun historique de ventes LUMEN en Allemagne ; résultats sous hypothèses. »

Zone paramètres à gauche, résultats au centre, panneau Sources et hypothèses ouvrable à droite. Sur petit écran, mêmes contenus en sections successives Paramètres / Résultats / Hypothèses, sans masquer les réserves nécessaires. Les onglets du résultat sont Vue commerciale, Économie, Sensibilité, Explication. Les actions et libellés métier évitent d’exposer les détails du modèle hors de la fiche explicative.

### Paramètres modifiables

| Groupe | Contrôles | Validation et conséquences |
|---|---|---|
| Stratégie | Nom, cible, positionnement et justification, portée géographique ; prix €/canette par canal, canaux ouverts, mix en unités | Prix ≥ 0 ; mix normalisé explicitement, somme affichée ; un canal fermé reçoit zéro, sans redistribution automatique |
| Calendrier | Mois de lancement, montée en charge par canal | Premier jour du mois, douze mois entiers ; profil relatif au lancement ; 3/6 mois changent la lecture, pas les autres hypothèses |
| Mode commercial | Choix « demande totale sous hypothèses » (A) ou « base organique + acquisition » (B) | Explication avant sélection ; changer de mode conserve l’ancien brouillon et demande les entrées du nouveau ; aucun cumul A+B |
| Mode A | Niveau DE mensuel à maturité, mix, profil saisonnier unique (indice ou analogue normalisé), poids éventuels, réponse prix | Échelle obligatoire ; montrer domaine de prix et transfert hypothétique ; sans réponse prix, proposer explicitement volume constant ou résultat dépendant non calculable |
| Mode B | Base organique, budget par canal marketing et mois, CAC DE, déduplication, incrémentalité, allocation vers vente, panier et réachat/cohortes | CAC > 0, proportions [0,1], budgets ≥ 0 ; canaux marketing distincts des ventes ; pas de deuxième conversion sur budget/CAC ; referral ouvert seulement selon hypothèse renseignée |
| Économie | Coûts unitaires, déductions et bases, coûts fixes, investissement et calendriers, convention fiscale/consigne | Champs manquants distincts de zéro ; déductions non doublées ; postes et conventions explicités |
| Décision | Contraintes de budget/accès, priorité contribution ou couverture, preuves du premium ; référence contrefactuelle si ROI demandé | Aucun score premium fabriqué ; aucun ROI incrémental sans flux et contrefactuel comparables |
| Sensibilité | Valeur centrale et variantes/plages justifiées pour échelle, acquisition, coûts, prix, mix et profils | Pas de plages numériques par défaut sans source ; changements conjoints conservés ; résultats jamais qualifiés de probabilités |

Chaque champ affiche unité, valeur ou manque, classe DATA/MODEL/ASSUMPTION/EXTERNAL, origine et domaine. DATA est consultable ; « Utiliser une autre valeur » crée une ASSUMPTION distincte sans modifier la source. MODEL ouvre une formule lisible. EXTERNAL manquant affiche la donnée à obtenir et permet une hypothèse explicitement acceptée. Plage, justification, responsable de validation et version se trouvent dans le panneau détaillé. L’acceptation d’une hypothèse ne constitue pas sa validation empirique.

### Calcul et résultats

Une modification marque immédiatement les anciens résultats « obsolètes » ; ils restent visibles avec leur ancienne version et ne soutiennent plus une recommandation. Le bouton Calculer évalue le brouillon courant ; les sorties issues de la même version apparaissent ensemble. Une réponse tardive d’un ancien calcul ne doit pas remplacer la version courante. Aucun appel de réentraînement à chaque variation de curseur.

| Restitution | Définition visible | Graphique / interaction |
|---|---|---|
| Demande et ventes conditionnelles | Canettes sur 3/6/12 mois, total et canaux ; disponibilité explicite | Courbe mensuelle, détail par canal, tableau accessible |
| CA consommateur et revenu net conventionnel | Prix × unités puis déductions MD-05 ; séparés du revenu historique | Décomposition par canal, clic vers formule et entrées |
| Contribution et résultat du périmètre | Avant marketing, puis après marketing/coûts fixes renseignés | Pont économique ; marges négatives visibles |
| Couverture marketing | Cumul contribution moins marketing ; distinct d’un effet incrémental | Courbe cumulée, ligne zéro, premier franchissement et rechute éventuelle |
| Récupération et seuil | Investissement/flux MD-06 ; seuil en canettes sans délai déduit | « non atteint sur l’horizon », « non calculable » ou « sans objet » selon cas |
| ROI incrémental | Δcontribution et Δbudget, référence et hypothèses | Disponible uniquement avec contrefactuel ; jamais appelé ROI causal mesuré |
| Robustesse | Effet d’un facteur puis variantes conjointes | Barres d’impact, comparaison prudent/central/favorable, valeur de bascule si trouvée |

Chaque KPI ouvre « Voir les sources et le calcul » : formule, valeurs, unités, paramètres, versions et limites. Un manque bloque seulement ses dépendances : marge unitaire peut rester disponible sans volume ; coût fixe manquant bloque résultat complet sans effacer contribution. Aucun tiret ambigu : afficher le statut et sa raison.

Courbes : axes et unités nommés, observations historiques distinctes des simulations DE ; aucune continuité graphique suggérant des ventes allemandes observées. Les variantes DE sont des courbes nommées avec paramètres consultables ; leur enveloppe éventuelle porte « plage des scénarios testés — sans probabilité ». Le détail du forecast historique montre modèle, origine, horizon en semaines, MAE/RMSE/WAPE/biais et réserves du POC. Ne pas afficher « ± WAPE » comme intervalle DE. Le modèle/fallback utilisé et sa raison figurent dans l’explication.

## Sauvegarde, versions et comparaison

Enregistrer un brouillon conserve même les manques. Une évaluation enregistrée fige paramètres, références de données, règles et résultats ; toute édition crée une nouvelle version et conserve la précédente. Dupliquer crée une autre option liée à son origine. La persistance doit survivre à la fermeture/réouverture de l’application ; choix du stockage et politique multiutilisateur restent ouverts avant implémentation.

Comparer permet de sélectionner deux ou trois versions évaluées à jour. Vérifier horizon, unités et conventions de revenu/retour ; les métriques incompatibles sont bloquées avec raison et action « harmoniser dans une copie ». Afficher les différences de méthode et d’hypothèses même lorsque les unités sont compatibles. Valeurs non calculables jamais classées comme zéro. Présenter tableau KPI, séries temporelles et compromis contribution/couverture ; pas de classement global sans priorités explicites.

Action « Comparer une autre date » duplique et change seulement le mois, en gardant durée, montée en charge, budget relatif et autres paramètres. Libellé « date seule » uniquement si ces conditions sont vérifiées. Aucun calendrier concurrent futur inventé.

## Recommandation explicable et décision

La vue Décision indique scénario proposé, prix, canaux, date, budget, motifs chiffrés reliés à leur calcul, preuves du positionnement, alternative et sacrifice accepté. Elle distingue constat DATA, calcul MODEL et dépendance ASSUMPTION/EXTERNAL. Afficher domaines de stabilité testés, hypothèses susceptibles d’inverser le choix et conditions opérationnelles de lancement non confirmées.

Sans données ou priorités déterminantes, afficher « Plusieurs options restent à arbitrer » avec collecte nécessaire. Une recommandation ne promet ni optimum global ni précision DE. « Retenir ce scénario » exige une action humaine et une justification ; l’utilisateur peut choisir une alternative sans réécrire la proposition. Une modification ultérieure ne réécrit pas la décision conservée.

Exporter produit un dossier daté lisible : décision/proposition, alternatives, paramètres et unités, versions et formules, résultats partiels, preuves et contradictions, hypothèses, incertitudes et arbitrages ouverts. Prévisualiser le dossier avant export. Format du dossier et stockage sont à choisir lors de la conception technique ; aucune donnée personnelle d’enquête.

## États, accessibilité et recette UX

États : brouillon, incomplet/invalide, prêt, calcul en cours, évalué, obsolète, échec. Une erreur identifie les champs concernés et conserve la saisie ; un échec propose réessayer sans substituer silencieusement un modèle. Navigation clavier, libellés associés aux contrôles, erreurs textuelles, tableaux alternatifs aux graphiques ; couleur toujours doublée par texte ou symbole.

| Parcours de recette future | Attendu |
|---|---|
| Créer A sans niveau DE | Volumes non calculables, raison/action ; marge unitaire disponible si entrées suffisantes |
| B avec budget 1 000 €, CAC 50 €, incrémentalité 0,5, déduplication 1, 6 unités/client et mix 60/40 | 60 unités, 36/24 ; valeurs identifiées comme recette hypothétique |
| Modifier prix après évaluation | Ancien résultat marqué obsolète ; nouveau calcul suit la réponse prix acceptée ou affiche sa limite |
| Enregistrer, fermer, rouvrir puis dupliquer | Paramètres/versions restaurés ; copie indépendante ; décision d’origine intacte |
| Comparer conventions incompatibles | Blocage des métriques concernées, autres valeurs visibles, harmonisation dans une copie |
| Varier l’échelle/coût jusqu’à inverser un choix construit | Valeur de bascule et paramètres affichés ; aucune probabilité inventée |
| Flux −100 puis +60/+60 | Franchissement période 2 ; absence de franchissement et manques distingués |
| Afficher variantes DE et détail Ridge | Incertitude de scénario distincte des erreurs historiques ; aucune bande à 95 % |
| Choisir l’alternative et exporter | Choix humain, justification et versions figés ; sources et limites consultables |

Ces critères sont à tester sur le moteur puis avec les bénéficiaires ; aucun test utilisateur n’a été réalisé. Priorités ouvertes : critères métier, hypothèses DE/plages, conventions économiques, compréhension des explications, format d’export, stockage et budget de latence mesurable.

## Prochaine étape technique

Construire le moteur sans frontend avec schéma de scénario versionné, validation des entrées, propagation des manques/provenances, calendriers MD-09, calculs A/B et économiques, comparaison et sensibilités. Vérifier les recettes indépendantes MD-08 ainsi que conservation des volumes, absence de doubles comptes et gestion d’obsolescence. Exposer ensuite un contrat d’évaluation stable pour les maquettes puis le frontend. La qualification du forecast doit rester distincte : nouvelles périodes, seuils préenregistrés, antériorité de l’indice et validation de transfert, puis pilote DE.
