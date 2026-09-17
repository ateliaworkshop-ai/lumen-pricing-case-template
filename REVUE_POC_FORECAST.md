# Revue critique du POC forecast — 11 septembre 2026

Base récupérée : `origin/main` à `295e0e6`. Le fichier demandé sous le nom POC_FORECAST.md est présent sous [POC_FORECASTING.md](POC_FORECASTING.md). Revue du rapport, du [script](analysis/forecasting/run_poc.py), des prédictions et des métriques exportées ; aucun nouvel entraînement ni essai allemand.

## Verdict

Retenir **Ridge interprétable comme référence historique provisoire**, pas comme modèle de ventes DE. Rejeter la forêt aléatoire testée pour le MVP. La distinction utile est le gain démontré et l’explicabilité : Ridge est aussi un apprentissage statistique, mais ne nécessite pas ici une architecture ML complexe. Le moteur allemand reste le calcul conditionnel MD-03/04–06. Le POC n’identifie ni l’échelle de lancement ni une réponse causale au prix ou au marketing.

## Comparaison vérifiable

WAPE en %, calculé sur toute la fenêtre hebdomadaire, pays–canal ; 13/26/52 semaines ≈ 3/6/12 mois, pas des mois calendaires.

| Apprentissage / horizon | Dernière valeur | Naïf annuel | Ridge | Forêt | Indice × tendance |
|---|---:|---:|---:|---:|---:|
| 26 sem. / 3 mois | 11,66 | indisponible | 11,22 | 13,64 | 6,16 |
| 26 sem. / 6 mois | 21,11 | indisponible | 11,47 | 10,92 | 6,04 |
| 26 sem. / 12 mois | 21,75 | indisponible | 7,80 | 15,37 | 7,45 |
| 52 sem. / 3 mois | 7,40 | 24,92 | 5,49 | 9,56 | 3,99 |
| 52 sem. / 6 mois | 24,67 | 25,30 | 5,77 | 18,33 | 4,18 |
| 65 sem. / 3 mois | 27,56 | 25,56 | 5,06 | 23,93 | 3,87 |

Sources : [métriques](analysis/forecasting/metrics.csv), [canaux](analysis/forecasting/metrics_by_channel.csv), [pays](analysis/forecasting/metrics_by_country.csv). À origine 52, Ridge réduit la MAE face à dernière valeur d’environ 26 % à 3 mois (113,53 → 84,33) et 77 % à 6 mois (478,89 → 111,97). Le gain est réel dans ces fenêtres, sans constituer une preuve de rentabilité métier. À 6 mois, WAPE Ridge par canal : DTC 6,13 ; Gym 6,74 ; Retail 5,20 %. Le gain RF de 0,55 point sur Ridge à origine 26/horizon 26 est isolé et ne justifie pas son maintien.

L’indice × tendance gagne toutes les MAE ; à 12 mois sa RMSE 218,29 est cependant moins bonne que Ridge 213,74. Il est simple, mais l’indice sans date ni construction indépendante vérifiée peut incorporer une connaissance du futur. Il reste une hypothèse de profil ; pas de promotion automatique au rang de meilleur forecast validé.

## Validation et métriques : forces et réserves

- Séparation chronologique commune aux neuf séries, origines fixes, standardisation dans le train, hyperparamètres fixes et covariables futures figées à leur dernière valeur connue. Le test de colonnes futures empoisonnées protège contre certains accès directs ; il ne vérifie ni la provenance de l’indice ni tout le processus de sélection.
- Seulement 78 dates et neuf séries très corrélées. Les fenêtres se recouvrent. Les 117/234/468 lignes de test ne sont pas des observations indépendantes. Un seul stress test annuel, appris sur 26 semaines, sans baseline annuelle disponible : aucun horizon annuel robuste démontré. Même à 3/6 mois, peu d’origines, pas de test final intact après choix du modèle, ni de validation pays tenu à l’écart.
- MAE mesure l’erreur par semaine–pays–canal en canettes ; RMSE rend visibles les grands écarts. WAPE privilégie les gros volumes, MAPE surpondère les petites séries et devient problématique avec les zéros d’un lancement. Si somme des volumes nulle, WAPE est non calculable. Conserver MAE/RMSE, biais signé et détail des séries ; ne pas convertir ces erreurs hebdomadaires en erreur mensuelle ou de payback.
- Biais Ridge à origine 52/horizon 26 : +3,80 %, contre −17,38 % RF et −25,30 % naïf annuel. Une moyenne correcte peut masquer une mauvaise décision de stock ou budget. Les erreurs sur cumuls mensuels et seuils économiques restent à mesurer.
- Pic conservé dans le test ; retrait du train dégrade Ridge 5,77 → 6,16 % WAPE à 6 mois sans changer le classement. Sensibilité utile, mais pas étude complète des ruptures de régime. Baselines/indice utilisent une semaine de train de plus que Ridge/RF : légère asymétrie à supprimer au prochain benchmark.
- Ridge extrapole une tendance exponentielle, avec saison et tendance communes aux séries. Le retour exp(log Q) sans correction n’est pas une estimation garantie de la moyenne arithmétique. Exposer les facteurs, surveiller biais et extrapolation ; ne pas corriger sans nouvelle évaluation. Les coefficients structurellement lisibles ne remplacent pas une recette d’explication avec les bénéficiaires.
- Ablations : sans saison WAPE 18,39 %, sans effets de canal 34,67 % à 6 mois/origine 52. Prix et promotion ne donnent pas de gain stable ; budget mensuel : deux dégradations et un gain, sur 18 mois agrégés. Exclure ces variables du forecast retenu. Une association prédictive ne fournit aucune élasticité causale.

## Allemagne et décisions

Aucune vente DE, aucun test de transfert. Un nouveau code pays ne suffit pas à appliquer Ridge. Extraire éventuellement un profil normalisé, avec convention documentée de retrait de tendance ; son adoption en DE est ASSUMPTION. Niveau accessible, mix, montée en charge, prix et acquisition restent à renseigner. Les prix historiques 1,31–1,39 € ne valident pas les candidats 1,79/2,19/2,59 €. Ne pas cumuler deux saisons, croissance historique automatique, ou mode A total et acquisitions B.

Décisions fixées : cible historique = unités hebdomadaires pays–canal ; horizon principal de **simulation** = 12 mois calendaires, lectures secondaires 3/6 mois ; référence historique privilégiée = 3 mois, extension 6 mois exploratoire, 12 mois stress test. Aucun horizon n’est déclaré fiable en DE. Pas d’intervalle à 95 % calibré ; les variantes d’hypothèses ne sont pas des probabilités.

Décisions ouvertes avant qualification opérationnelle : seuil de gain métier et biais acceptable, provenance de l’indice, origines supplémentaires et test intact, benchmark interprétable enrichi (par exemple tendance amortie), validation de profil sur pays exclu avec calibration séparée, compréhension utilisateur et paramètres DE. Définir ces critères avant les futurs tests ; préférer le modèle le plus simple qui les satisfait. Faute de modèle admissible, afficher une baseline historique explicite ou « non calculable » ; ne jamais la transférer silencieusement vers DE.

Après la spécification UX : réaliser le moteur de calcul versionné sans frontend, contrats d’entrée/sortie et cas de recette MD-08, y compris manques, calendriers, doubles comptes, cumuls et scénarios. La qualification statistique et le pilote DE conditionnent les revendications prédictives, pas la possibilité de simuler des hypothèses acceptées.
