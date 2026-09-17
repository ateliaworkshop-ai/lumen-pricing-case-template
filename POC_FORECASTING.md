# LUMEN — POC forecasting / ML

Exécution : 11 septembre 2026. Base : `main` à `be2c3f3`, après récupération des modifications demandées. Références lues : [cadrage décisionnel](CADRAGE_SYSTEME.md), notamment MD-03 à MD-08, et [analyse dataset](analysis/ANALYSE_DATASETS_LUMEN.md). Ce POC constitue l’étape d’entraînement désormais demandée ; il ne modifie pas le frontend ni le contrat économique.

## Décision proposée

**Retenir provisoirement une régression Ridge explicable avec tendance, saison annuelle et effets pays–canal pour les marchés historiques. Ne pas retenir la forêt aléatoire testée. Conserver 12 mois comme horizon principal de simulation, avec revues à 3 et 6 mois ; la précision à 12 mois reste exploratoire.**

La variante très simple « indice saisonnier fourni × tendance linéaire par série » obtient les meilleures MAE dans toutes les fenêtres, mais dépend d’un profil sans date de publication ni provenance indépendante. La conserver comme référence conditionnelle de scénario, pas comme preuve d’une prévision prospective sans fuite. Si son antériorité et sa construction indépendante des ventes sont confirmées, elle devient une candidate prioritaire grâce à sa précision et son explication particulièrement simple.

Ces conclusions portent sur NL/DK/SE. **Aucune précision allemande n’a été mesurée.** Le POC ne produit pas de volumes allemands ni de date de payback en l’absence des hypothèses de lancement.

## Données et cible

- Cible : `units_sold`, canettes par semaine, pays et canal. Le revenu historique n’est pas une cible : sa définition net/brut reste incertaine ; il ne doit pas devenir automatiquement le revenu net du simulateur.
- 706 lignes brutes ; retrait en mémoire de 4 copies exactes ; 702 lignes, 9 séries complètes de 78 semaines, du 06/01/2025 au 29/06/2026. Le script vérifie unicité, effectifs et positivité. Sources inchangées.
- La semaine atypique du 28/07/2025 reste dans les résultats principaux. Sensibilité : l’enlever uniquement de l’apprentissage lorsqu’elle y figure ; garder exactement les mêmes observations de test.
- Les CSV du cas comportent des séparateurs littéraux `\r\n`, décodés en mémoire. Aucun champ personnel n’est chargé.
- Le cas est construit/synthétique : une bonne performance interne ne démontre pas une capacité opérationnelle sur de nouvelles données réelles.

## Validation temporelle

Prévisions à origine fixe : apprentissage sur toutes les semaines strictement antérieures, puis prévision de toute la fenêtre sans réentraînement ni accès aux ventes intermédiaires. Aucun partage aléatoire de lignes ; tous les pays et canaux respectent la même frontière de dates.

| Première semaine prédite | Semaines d’apprentissage | Horizons testés | Statut |
|---|---:|---|---|
| 07/07/2025 | 26 | 13, 26, 52 semaines | Stress test avec seulement un semestre initial |
| 05/01/2026 | 52 | 13, 26 semaines | Comparaison principale après une année observée |
| 06/04/2026 | 65 | 13 semaines | Deuxième origine à court terme |

13/26/52 semaines représentent environ 3/6/12 mois (91/182/364 jours), pas des mois calendaires exacts. Chaque métrique couvre **tous les pas de la fenêtre**, pas seulement la dernière semaine. Une fenêtre de 13 semaines contient 117 lignes, mais seulement 13 dates et des séries fortement corrélées ; 117 n’est pas un effectif indépendant.

Les fenêtres se chevauchent : ne pas sommer leurs effectifs ni les traiter comme des expériences indépendantes. Les scores restent séparés par origine. Il n’existe qu’une origine possible à 52 semaines avec au moins 26 semaines d’apprentissage. Elle ne permet ni une validation annuelle robuste ni une comparaison avec une baseline annuelle disposant d’un cycle complet. Il faudrait au moins 104 semaines pour une seule telle comparaison ; viser au moins 156 semaines pour apprendre deux cycles puis tester un an, et davantage pour plusieurs origines.

Hyperparamètres fixés avant calcul des résultats, sans recherche sur les tests. La recommandation s’appuie sur ces fenêtres exploratoires : il n’y a pas de test final supplémentaire resté intact après sélection. Standardisation et ajustements recalculés dans chaque apprentissage. Aucun lissage centré, interpolation depuis le futur, prix réalisé futur ou budget réalisé futur.

Un contrôle automatique remplace cibles, revenus, prix et promotions du test par des valeurs absurdes : les prévisions de tous les modèles restent identiques. Cela vérifie l’absence d’accès à ces colonnes lors de la prévision ; cela ne certifie pas l’antériorité des sources du cas, notamment de l’indice saisonnier.

## Modèles comparés

| Identifiant | Calcul | Explication et limites |
|---|---|---|
| `last` | Dernier volume observé par pays–canal, constant sur l’horizon | Très simple ; ignore croissance et saison |
| `seasonal52` | Volume de la même série 52 semaines plus tôt | Nécessite 52 semaines passées ; disponible aux origines 52 et 65 seulement ; ignore croissance |
| `ridge` | `log(Q) = constante + effet pays–canal + b×t/52 + c×sin(2πt/52) + d×cos(2πt/52)` | Niveau propre à chaque série, tendance et saison communes ; retour par exponentielle, sans correction de retransformation ; tendance exponentielle extrapolée à surveiller |
| `rf` | Forêt aléatoire sur les mêmes variables que Ridge et la même cible logarithmique | 200 arbres, profondeur 6, minimum 5 lignes par feuille, graine 263317 ; capture des interactions, mais extrapole mal une croissance au-delà des niveaux appris |
| `index_trend` | `Q = max(0, (a_s+b_s×t) × S_m)` ; ajuster par série `Q/S_m` sur le temps | Deux coefficients par série ; `S_m = indice_m / 101,6667` ; saison imposée par un fichier, donc hypothèse d’information disponible à l’origine |

Ridge : pénalité L2 `alpha=1`, variables standardisées dans le train uniquement. Effets pays–canal via indicatrices. Tous les modèles Ridge et RF utilisent les mêmes lignes à partir de la semaine 2, afin de rendre les variantes avec décalage comparables. Baselines et `index_trend` exploitent aussi la première semaine. Il n’y a pas d’ajustement automatique des hyperparamètres, de réseau neuronal ni d’optimisation du score sur ce petit jeu. Le résultat RF ne disqualifie pas tout ML possible ; il montre que cette candidate ne justifie pas sa complexité ici.

## Résultats

MAE et RMSE en canettes par ligne semaine–pays–canal ; MAPE et WAPE en %. `MAE = moyenne(|erreur|)` ; `RMSE = racine(moyenne(erreur²))` ; `MAPE = 100×moyenne(|erreur|/Q)` ; `WAPE = 100×somme(|erreur|)/somme(Q)`. Toutes les cibles sont strictement positives, rendant MAPE calculable ici ; à reconsidérer pour un lancement comportant des zéros. WAPE donne davantage de poids aux grosses séries ; MAPE et les résultats par canal complètent cette lecture. RMSE pénalise davantage les grands écarts. Les biais signés sont conservés dans les exports.

### Comparaison principale — 52 semaines d’apprentissage

| Horizon | Modèle | MAE | RMSE | MAPE | WAPE |
|---|---|---:|---:|---:|---:|
| 3 mois | Dernière valeur | 113,53 | 151,03 | 7,47 | 7,40 |
| 3 mois | Naïf saisonnier | 382,47 | 432,52 | 24,89 | 24,92 |
| 3 mois | Ridge | 84,33 | 117,77 | 5,63 | 5,49 |
| 3 mois | Forêt aléatoire | 146,66 | 200,77 | 8,98 | 9,56 |
| 3 mois | Indice × tendance, conditionnel | 61,24 | 82,85 | 3,95 | 3,99 |
| 6 mois | Dernière valeur | 478,89 | 735,44 | 20,79 | 24,67 |
| 6 mois | Naïf saisonnier | 491,18 | 579,63 | 25,04 | 25,30 |
| 6 mois | Ridge | 111,97 | 150,94 | 6,16 | 5,77 |
| 6 mois | Forêt aléatoire | 355,76 | 500,66 | 15,76 | 18,33 |
| 6 mois | Indice × tendance, conditionnel | 81,21 | 117,92 | 4,02 | 4,18 |

Le naïf annuel sous-estime d’environ 25 % les volumes sur la fenêtre de 6 mois, compatible avec la croissance observée entre les deux semestres. Ridge surestime de 3,80 % ; RF sous-estime de 17,38 %. Un score agrégé seul masquerait ces directions d’erreur, importantes pour un budget ou un seuil de couverture.

À l’origine du 06/04/2026, sur 3 mois : WAPE de 5,06 % pour Ridge, 23,93 % pour RF, 25,56 % pour le naïf annuel et 3,87 % pour la variante indice.

### Stress test annuel — seulement 26 semaines d’apprentissage

| Modèle | MAE | RMSE | MAPE | WAPE |
|---|---:|---:|---:|---:|
| Dernière valeur | 400,02 | 498,67 | 23,64 | 21,75 |
| Ridge | 143,49 | 213,74 | 8,14 | 7,80 |
| Forêt aléatoire | 282,70 | 444,62 | 12,89 | 15,37 |
| Indice × tendance, conditionnel | 136,99 | 218,29 | 6,41 | 7,45 |

Baseline annuelle : **non calculable** à cette origine, pas remplacée par une valeur fabriquée. L’indice gagne sur MAE, mais Ridge sur RMSE. La saison de Ridge est extrapolée depuis une demi-année : le score ne garantit pas que cette identification soit stable.

Avec ce même apprentissage court, aux horizons 3/6 mois, les WAPE sont respectivement : dernière valeur 11,66/21,11 %, Ridge 11,22/11,47 %, RF 13,64/10,92 %, indice 6,16/6,04 %. RF bat légèrement Ridge à 6 mois dans cette seule configuration ; ce gain local de 0,55 point ne compense pas ses autres résultats et son explication moins directe. L’explicabilité compte donc dans le choix, sans inventer un score pondéré après coup.

### Canaux et anomalie

WAPE à 6 mois, origine 05/01/2026 :

| Canal | Ridge | RF | Indice conditionnel |
|---|---:|---:|---:|
| DTC Online | 6,13 % | 19,12 % | 3,91 % |
| Gym & Office | 6,74 % | 14,45 % | 4,01 % |
| Retail/Grocery | 5,20 % | 19,19 % | 4,41 % |

Sans le pic dans l’apprentissage, sur le même test à 6 mois : Ridge passe de 5,77 à 6,16 % WAPE, RF de 18,33 à 18,70 %, indice de 4,18 à 4,37 %. Le classement reste identique ; l’exclusion n’améliore pas artificiellement le test. À l’origine 26, le pic n’est pas encore dans le train et reste dans le test. Les métriques détaillées par pays sont également exportées ; il ne s’agit pas d’un test sur pays tenu à l’écart.

## Utilité des variables

Les ablations changent une famille à la fois, avec mêmes dates et même modèle. Elles mesurent l’utilité prédictive dans ce protocole, pas un effet causal ni une importance universelle.

| Variante Ridge, origine 52, horizon 26 | WAPE | Interprétation |
|---|---:|---|
| Complète : pays–canal, tendance, saison | 5,77 % | Référence |
| Sans sin/cos saisonniers | 18,39 % | Saison utile ; ne pas supprimer le calendrier |
| Pays seuls au lieu des effets pays–canal | 34,67 % | Niveaux par canal indispensables ; ne prouve pas qu’ouvrir un canal crée ces volumes |
| + prix réalisé de la semaine précédente | 5,82 % | Pas de gain dans cette fenêtre |
| + promotion de la semaine précédente | 5,75 % | Gain négligeable et non stable |

Le prix est calculé uniquement sur les ventes passées (`revenue_eur/units_sold`), puis décalé d’une semaine dans le train. Pour tout le test, sa dernière valeur connue est conservée ; les promotions suivent la même convention. Ce choix est une hypothèse de persistance, pas un plan de prix/promotion fourni. Ne jamais utiliser le ratio contemporain qui contient la cible ni le prix réellement réalisé dans le futur.

Le prix décalé améliore légèrement le stress test annuel (WAPE 7,80 → 7,71 %) mais dégrade l’origine 52 ; il est exclu de la recommandation. La variation historique autour de 1,31–1,39 € ne permet pas d’extrapoler les réactions à 1,79/2,19/2,59 €. Le booléen promotion, rare et sans profondeur de remise, ne permet pas non plus de simuler un uplift causal. La température allemande moyenne est exclue : pas d’exposition météo historique NL/DK/SE et forte redondance avec l’indice saisonnier.

### Marketing : expérience séparée à la bonne granularité

Une seule série de 18 mois : somme des ventes des neuf séries chaque semaine, puis moyenne hebdomadaire par mois de début de semaine. Les dépenses sont sommées sur les quatre canaux marketing. Le rapprochement suppose un périmètre commun NL/DK/SE, non vérifiable dans le fichier. Aucun budget n’est répliqué par pays/canal de vente.

Comparer une Ridge logarithmique avec tendance + sin/cos annuels à la même régression + dépenses totales du mois précédent. À l’origine de chaque prévision, le dernier budget mensuel terminé est prolongé sur tout l’horizon. Apprentissage de 11 ou 14 lignes après décalage, standardisation dans le train, alpha=1.

| Mois d’apprentissage | Horizon mensuel | WAPE sans budget | WAPE avec budget |
|---:|---:|---:|---:|
| 12 | 3 | 1,84 % | 2,38 % |
| 12 | 6 | 2,78 % | 3,04 % |
| 15 | 3 | 4,44 % | 3,93 % |

Gain non stable : ne pas retenir le budget comme moteur prédictif de ventes. Ces scores lissés et agrégés ne sont pas comparables aux scores pays–canal hebdomadaires. Il n’y a pas assez de mois pour un test annuel crédible de cette variante ; aucune ventilation nationale, réponse marginale, saturation ou causalité n’est identifiée. Ne pas employer conversions, CAC ou LTV contemporains comme raccourcis de prévision.

## Implications pour F04 et le Strategy Simulator

1. **Historique — DATA/MODEL.** Conserver les volumes sources, le pays, le canal, l’origine, l’horizon et la version du modèle. Une restitution explicable de Ridge distingue niveau de série, tendance et facteur saisonnier ; les coefficients sont des associations. L’explicabilité est appréciée ici par la structure du modèle, pas encore validée par un test utilisateur avec Freya.
2. **Transfert DE — ASSUMPTION/EXTERNAL.** Un profil normalisé historique peut informer MD-03, mais il faut renseigner séparément niveau accessible allemand, mix, ouverture des canaux, montée en charge et réponse prix. La croissance historique n’est pas copiée automatiquement. L’indice fourni et un profil historique saisonnier sont des alternatives, pas deux facteurs à multiplier. L’Allemagne ne peut pas être ajoutée comme simple nouvelle modalité d’un modèle ajusté sur NL/DK/SE.
3. **Marketing — MD-04 conditionnel.** Conserver CAC DE, incrémentalité, déduplication, allocation et cohortes comme hypothèses visibles. Ne pas additionner acquisitions incrémentales et demande totale déjà marketing inclus. La régression marketing ne remplace pas ces paramètres.
4. **Horizon — 12 mois calendaires de simulation.** Présenter points de contrôle à 3 et 6 mois et actualiser après observations nouvelles. Pour convertir des prévisions hebdomadaires en flux mensuels, déclarer une allocation des semaines chevauchant les mois ; sans ventes quotidiennes, une répartition uniforme par jour est une hypothèse. Ne pas confondre cette conversion avec les fenêtres de validation en semaines.
5. **Économie — MD-05/06.** Utiliser unités conditionnelles × contribution nette par canal, puis budgets, coûts fixes et investissement datés. Le break-even en unités dépend de la marge et des coûts, pas d’une précision ML. Le délai de récupération exige les flux cumulés : afficher « non atteint sur 12 mois », « non calculable » ou « sans objet » selon le contrat. Un horizon annuel ne garantit pas le payback et ne valide pas un ROI incrémental.
6. **Incertitude — MD-07.** Montrer erreur historique et hypothèses de transfert séparément. Aucune bande à 95 %, probabilité de perte ou précision DE n’est calibrée ici. Utiliser prudent/central/favorable avec paramètres explicites, sans convertir le WAPE historique en intervalle de confiance allemand.

Avant une sélection opérationnelle : confirmer la provenance temporelle de l’indice, obtenir davantage de cycles, définir les seuils métier avant les nouveaux tests, puis valider sur de nouvelles périodes. Une validation complémentaire avec pays historique tenu à l’écart n’a pas été exécutée dans ce POC ; elle devra distinguer transfert de profil et calibration du niveau, et ne remplacera pas un pilote allemand. Collecter prix planifiés/effectifs, distribution, ruptures, budgets par pays–campagne–période et commandes/cohortes pour dépasser les associations actuelles.

## Reproduction et livrables

Depuis la racine du dépôt, dans un environnement Python isolé :

```sh
python -m pip install -r analysis/forecasting/requirements.txt
python analysis/forecasting/run_poc.py
```

Le script lit uniquement les sources nécessaires, contrôle le panel et les frontières temporelles, entraîne les modèles et reconstruit les résultats. [Métadonnées](analysis/forecasting/run_metadata.json) : versions Python/bibliothèques, graine, empreintes SHA-256 des CSV et contrôles réussis. Les coefficients descriptifs de la variante indice ajustés sur les 78 semaines sont exportés séparément et ne servent jamais aux backtests.

- [Script](analysis/forecasting/run_poc.py), [prédictions individuelles](analysis/forecasting/predictions.csv) et [métriques par fenêtre](analysis/forecasting/metrics.csv).
- [Métriques par canal](analysis/forecasting/metrics_by_channel.csv), [par pays](analysis/forecasting/metrics_by_country.csv), [expérience marketing](analysis/forecasting/marketing_metrics.csv) et [paramètres indice](analysis/forecasting/index_trend_parameters.csv).

Les résultats proviennent de l’exécution du code et des données du dépôt, sans source web ni donnée externe nouvelle. Aucun frontend, CSV source, poids de scénario allemand ou contrat économique n’a été modifié. Les changements sont destinés à un commit local sur branche dédiée ; aucun push ni fusion demandé.
