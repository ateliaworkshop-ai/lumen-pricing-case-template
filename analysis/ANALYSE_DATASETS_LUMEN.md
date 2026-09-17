# LUMEN — Marketing, ventes et marchés analogues

Analyse du 11 septembre 2026. Sources : les 12 CSV de `data/`, leur README et le brief du cas. Calculs reproductibles dans `analyse_datasets.py` (Python, pandas, numpy). Aucun CSV source ni code applicatif modifié. Les noms et emails sont exclus des résultats.

**Décision : les données permettent de décrire les ventes et l’acquisition attribuée, et de construire des scénarios allemands conditionnels. Elles ne permettent pas d’identifier l’effet causal des dépenses marketing sur les ventes. NL, DK et SE constituent des références plausibles pour des profils de ventes, mais leur validité comme analogues de l’Allemagne n’est pas démontrée.**

## 1. Données disponibles et effectifs réels

| Fichier | Observations et granularité | Ce qu’il apporte et ce qui manque |
|---|---|---|
| historical_sales_weekly | 706 lignes brutes ; 702 après retrait de 4 doublons exacts ; 78 semaines × 3 pays × 3 canaux | Unités, revenu EUR, promotion oui/non. Du 06/01/2025 au 29/06/2026. Aucune vente DE ; aucun budget, client, point de vente, stock ou prix catalogue explicite. |
| marketing_funnel_monthly | 72 lignes = 18 mois × 4 canaux, janvier 2025–juin 2026 | Reach, engagements, clients acquis attribués, dépenses, CAC et LTV estimée. Aucun pays, canal de vente, groupe témoin, commande, coût marginal ou budget planifié. |
| seasonality_and_weather | 12 mois de l’année | Indice de demande et température moyenne allemande ; aucune année ni météo observée NL/DK/SE. |
| customer_survey | 420 répondants synthétiques allemands | Segments, âge, ville, fréquence d’achat de boissons, dépenses, sensibilité au prix, canal préféré, notoriété de concurrents et intention LUMEN. Pas de comportement d’achat LUMEN observé. |
| price_sensitivity_survey | 300 répondants | Quatre seuils déclarés de prix et segment. Pas de quantités achetées à différents prix. |
| price_test_results | 9 lignes = 3 prix × 3 canaux | Acceptation estimée et contribution. Seulement 3 taux d’acceptation distincts : le même taux est répété par canal. Aucun protocole randomisé ni effectif par cellule. |
| competitor_prices_by_channel | 27 lignes | Concurrents, positionnement, canal, format, prix et indice marketing. Seulement 4 valeurs indépendantes d’indice marketing, constantes par marque ; aucune vente concurrente. |
| competitor_price_history | 48 lignes = 12 mois × 4 marques | Septembre 2025–août 2026 : prix catalogue, promotions, remise, prix rayon. Seulement 10 mois communs avec les historiques LUMEN, sans exposition locale documentée. |
| market_context | 36 lignes | 24 valeurs sous-catégorie–année et 12 indicateurs régionaux allemands. Données de cadrage et hypothèses illustratives, pas 36 mesures indépendantes de demande LUMEN. Aucun contexte comparable NL/DK/SE. |
| channel_economics | 6 lignes = 2 prix × 3 canaux | Déductions et contribution unitaire illustratives. Pas de volumes ni acquisition par pays. |
| cost_breakdown | 7 lignes | 5 composants, un total COGS de 0,62 €/canette et un KPI de marge. Ne pas additionner les 7 lignes. La seule cellule vide repérée est le pourcentage du KPI. |
| customer_quotes | 12 verbatims | Nuance qualitative sur les segments, sans représentativité statistique. |

Les canaux de vente sont **DTC Online, Retail/Grocery, Gym & Office**. Les canaux marketing sont **Paid Social, Influencer / Content, Retail Sampling, Referral / Subscription**. Ils ne forment pas une clé de jointure commune : Retail Sampling n’est pas automatiquement attribuable à toutes les ventes Retail/Grocery.

Le README indique une cohérence construite à partir d’un modèle commun et des répondants synthétiques. Les ressemblances statistiques internes ne sont donc pas une validation indépendante du monde réel.

## 2. Qualité et règles de calcul

Les quatre lignes surnuméraires concernent NL–DTC les 14/07/2025 et 27/04/2026, DK–Retail le 22/12/2025 et DK–DTC le 22/09/2025. Seules les copies exactes sont exclues, en mémoire. Le panel restant est complet : 78 observations dans chacune des neuf séries pays–canal.

La semaine du **28/07/2025** présente un pic commun aux marchés et canaux. Par exemple DK–Gym atteint 1 371 unités, soit 1,43 fois sa médiane locale sur neuf semaines. Cela peut refléter un événement commun ou la construction du cas : aucune cause n’est renseignée. Elle reste dans le calcul principal ; son exclusion de toutes les séries sert de sensibilité.

Pour la jointure marketing–ventes, chaque semaine est affectée au mois de sa date de début. Les sommes mensuelles portent donc sur quatre ou cinq semaines et ne sont pas des ventes calendaires exactes : janvier commence le 6, la semaine du 29 juin 2026 déborde sur juillet. Une moyenne hebdomadaire par mois contrôle partiellement cette différence de durée. Une allocation journalière exigerait les transactions ou une hypothèse de répartition uniforme.

Toutes les corrélations présentées sont des Pearson descriptifs. Les changements correspondent à des différences de niveau consécutives. Les observations temporelles ne sont pas indépendantes ; aucun seuil de significativité naïf n’est utilisé pour conclure à une causalité ou une équivalence.

Autres incohérences utiles au simulateur :

- L’indice nommé « 100 avg » a une moyenne arithmétique de **101,67**, pas 100. Pour un facteur mensuel de moyenne simple 1, le diviser par 101,67 ; pour préserver un total annuel, utiliser une normalisation adaptée aux jours/semaines du calendrier retenu.
- Les IDs 1–300 des deux enquêtes se recouvrent, mais **216 segments ne correspondent pas**. Sans clé commune validée, ne pas joindre ces enquêtes au niveau individuel.
- Le revenu historique total est **1,620 M€ sur 78 semaines**, alors que le brief évoque environ 3,2 M€ de revenu glissant. Le périmètre du titre n’est pas réconcilié avec cet export. Ne pas rescaler automatiquement les volumes pour atteindre ce chiffre.
- `revenue_eur / units_sold` vaut environ 1,35 €, cohérent avec le prix illustratif consommateur, mais très supérieur au revenu net par canal de `channel_economics`. Sa définition comptable n’est pas suffisamment documentée pour l’assimiler au revenu net LUMEN.

## 3. Peut-on mesurer l’effet marketing ?

### Mesurable : dépenses et acquisition attribuée

| Canal marketing | Mois | Dépenses totales € | Clients acquis attribués | CAC pondéré € | r dépenses–acquisitions |
|---|---:|---:|---:|---:|---:|
| Paid Social | 18 | 43 588,69 | 952 | 45,79 | 0,987 |
| Influencer / Content | 18 | 84 732,86 | 2 258 | 37,53 | 0,987 |
| Retail Sampling | 18 | 726 327,24 | 12 080 | 60,13 | 0,972 |
| Referral / Subscription | 18 | 322 241,25 | 11 452 | 28,14 | 0,984 |
| Total | 18 dates distinctes | 1 176 890,04 | 26 742 | 44,01 | 0,964 sur les totaux mensuels |

Le CAC pondéré est `somme(dépenses) / somme(acquisitions)`. Dans chaque ligne, le CAC fourni égale exactement ce quotient à la précision numérique. Ce n’est pas une seconde observation indépendante. Les acquisitions sont les comptes rapportés par canal : l’absence d’identifiants ne permet pas de vérifier leur déduplication intercanaux.

Ces chiffres décrivent l’efficacité moyenne **attribuée**. Ils ne disent pas combien de clients supplémentaires seraient acquis avec un euro supplémentaire. Le Referral peut notamment dépendre d’une clientèle installée, absente au lancement allemand. Les LTV sont des estimations sans cohortes de rétention, horizon ni définition de contribution permettant de vérifier le payback.

### Mesurable sous hypothèse de périmètre commun : association agrégée avec les ventes

Le fichier marketing n’identifie aucun pays. Les rapprochements suivants supposent que ses dépenses concernent bien l’ensemble NL/DK/SE et le même produit que les ventes. Cette hypothèse n’est pas vérifiable dans les colonnes.

| Calcul | Effectif temporel | r |
|---|---:|---:|
| Dépenses totales – unités mensuelles | 18 mois | 0,282 |
| Dépenses totales – revenu mensuel | 18 mois | 0,279 |
| Dépenses totales – moyenne hebdomadaire des unités du mois | 18 mois | 0,418 |
| Variation mensuelle des dépenses – variation des unités mensuelles | 17 différences | −0,215 |
| Variation des dépenses – variation de la moyenne hebdomadaire | 17 différences | 0,038 |
| Dépenses du mois précédent – moyenne hebdomadaire courante | 17 paires | 0,520 |
| Dépenses deux mois avant – moyenne hebdomadaire courante | 16 paires | 0,414 |

Le signe et l’amplitude dépendent de l’agrégation et de la transformation. Le décalage d’un mois n’établit pas un délai causal : tendance, saison et décisions anticipant la demande peuvent expliquer cette association. Ces comparaisons sont exploratoires, pas une sélection validée du « meilleur » modèle.

### Non identifiable avec ces fichiers

Pas de mesure causale du ROI/ROAS incrémental, d’élasticité ventes–budget, d’effet propre à un pays, de courbe de saturation, de persistance publicitaire ou de cannibalisation entre canaux. Pas non plus de conversion fiable clients acquis → canettes vendues : panier, nombre de commandes, réachat et délai manquent.

Une régression agrégée est calculable mais fragile : seulement 18 dates, quatre budgets, saisonnalité, tendance et effets retardés éventuels. Les 72 lignes marketing ne deviennent pas 72 observations indépendantes d’une même série de ventes. Répliquer le budget sur 702 lignes de ventes créerait une pseudo-réplication.

Il manque surtout un contrefactuel crédible. Le budget peut suivre les ventes attendues ; promotions, distribution, disponibilité, notoriété et achats organiques peuvent agir simultanément. Les acquisitions attribuées ne sont pas nécessairement incrémentales. Une faible corrélation n’établit pas davantage une absence d’effet.

## 4. NL, DK et SE sont-ils analogues ?

### Similarité réelle dans les séries du cas

| Indicateur | NL | DK | SE |
|---|---:|---:|---:|
| Unités sur 78 semaines | 510 636 | 305 975 | 383 232 |
| Revenu enregistré € | 689 214,60 | 412 553,39 | 518 157,82 |
| Part DTC en unités | 29,8 % | 35,0 % | 32,1 % |
| Part Retail/Grocery | 55,3 % | 45,0 % | 47,7 % |
| Part Gym & Office | 14,9 % | 20,0 % | 20,2 % |
| Croissance janvier–juin 2026 / janvier–juin 2025 | 33,3 % | 34,5 % | 34,2 % |

Les fenêtres semestrielles comparent chacune 26 dates de début de semaine. Les niveaux de vente diffèrent fortement, sans population exposée ni couverture commerciale permettant de calculer une pénétration comparable.

| Paire | r ventes hebdomadaires (78 dates) | r différences hebdomadaires (77) | r résidus après tendance et mois (78) |
|---|---:|---:|---:|
| NL–DK | 0,991 | 0,845 | 0,505 |
| NL–SE | 0,988 | 0,788 | 0,431 |
| DK–SE | 0,989 | 0,838 | 0,464 |

Les résidus proviennent séparément pour chaque pays d’une régression du logarithme des unités hebdomadaires totales sur une constante, une tendance linéaire et onze indicatrices du mois de l’année. Il s’agit d’un diagnostic descriptif de dynamique commune, pas d’un ajustement causal exhaustif.

À canal identique, les corrélations entre pays restent entre **0,955 et 0,980**. Hors semaine du pic, les corrélations totales restent entre **0,988 et 0,990** : la similarité ne repose pas sur ce seul événement.

Les ventes hebdomadaires et l’indice saisonnier du mois sont corrélés entre **0,851 et 0,856**. L’indice va de 78 en janvier à 138 en juillet. Cependant, 78 semaines couvrent une seule année entière et un semestre : il est difficile de séparer saisonnalité, tendance et événements particuliers. Température allemande et indice ont eux-mêmes r = **0,945** sur douze points : on ne peut isoler un effet météo indépendant, ni utiliser la météo DE comme exposition observée des trois pays.

### Prix : domaine de variation trop étroit

Le prix réalisé implicite varie seulement entre environ **1,310 et 1,390 €/unité**, avec des moyennes pays–canal de 1,347 à 1,353 €. La corrélation prix–unités est **−0,020** sur le panel et entre **−0,154 et +0,087** par pays–canal. Elle ne permet pas d’estimer une élasticité causale stable, encore moins une élasticité allemande.

Il existe 47 lignes en promotion sur 702, mais seulement 2 à 9 par série pays–canal. Le prix moyen est presque identique avec et sans promotion (1,349 contre 1,350 €). Le booléen ne renseigne ni profondeur, ni durée, ni dépense de promotion. Le différentiel brut de ventes des semaines promotionnelles ne peut pas être interprété comme un uplift.

Les prix allemands envisagés, **1,79 / 2,19 / 2,59 €**, sont tous hors du domaine historique. Les taux estimés de **61,7 / 51,7 / 26,7 %** sont des acceptations déclarées, pas une fonction de demande observée ou des résultats d’A/B tests. Aucun effet prix différencié par canal n’est identifié par les neuf lignes.

### Transfert à l’Allemagne : plausible mais non validé

Aucune vente allemande ne permet une corrélation DE–NL/DK/SE, un test de précision allemand ou une conclusion d’équivalence. Les enquêtes ne fournissent pas de comparaison démographique homogène avec les pays historiques. Il manque notamment distribution, population effectivement touchée, concurrence locale comparable, notoriété LUMEN, ancienneté et intensité marketing par pays.

Les préférences déclarées allemandes sont Retail **46,4 %**, DTC **28,3 %**, Gym **25,2 %**. Elles donnent un repère de scénario, mais une préférence de répondant n’est pas une part des unités vendues. Retail est descriptivement plus proche de DK/SE que de NL ; DTC plus proche de NL ; Gym plus élevé que dans les trois marchés. Aucun « meilleur analogue » global ne se dégage sur cette seule base.

**Usage défendable :** mutualiser prudemment les formes temporelles, conserver plusieurs hypothèses de mix et un facteur d’échelle allemand explicite. **Usage non défendable :** multiplier directement les ventes néerlandaises par la population allemande, transférer une causalité marketing non identifiée, ou présenter la croissance commune de 33–35 % comme prévision allemande validée.

## 5. Hypothèses nécessaires au simulateur allemand

| Élément | Ancrage disponible | Hypothèse à rendre explicite |
|---|---|---|
| Acquisition payante | CAC moyens historiques par canal | CAC allemand, caractère incrémental, déduplication, plage de budget valide, capacité du referral au lancement |
| Volumes | Historiques analogues et intentions DE | Base de demande organique, portée du lancement, points de vente actifs, trafic, conversion réelle, panier, réachat, montée en charge |
| Prix | Seuils d’enquête et trois acceptations estimées | Passage intention → achat ; courbe entre/hors points ; effet sur réachat et acquisition |
| Saisonnalité | Indice mensuel et profils analogues | Transfert à DE, normalisation, séparation de la montée en charge ; pas de double facteur météo corrélé |
| Mix de vente | Parts analogues et préférences DE | Disponibilité réelle des canaux, allocation des acquisitions aux ventes, absence de double comptage |
| Rentabilité | COGS et déductions par canal | Prix consommateur/net comparable, frais inclus, coûts fixes, définition de LTV et calendrier des flux |

Une chaîne de scénario possible est `acquisitions attribuées = budget / CAC_DE`, puis application explicite d’un taux d’incrémentalité, d’une allocation aux canaux et d’un profil d’unités par cohorte. Ce sont des hypothèses, pas des coefficients causalement estimés. Ajouter séparément une demande organique ; ne pas ajouter ces acquisitions à une base historique qui les inclut déjà sans la décomposer.

La contribution du scénario se calcule à partir des unités et de la contribution unitaire par canal, moins dépenses marketing et coûts supplémentaires pertinents. La qualification de ROI incrémental exige une comparaison avec un scénario contrefactuel défini. Un ratio LTV/CAC n’est pas un délai de récupération ; celui-ci nécessite des flux datés et une LTV exprimée sur une base économique cohérente.

Utiliser des scénarios prudent/central/favorable avec paramètres visibles, sans présenter leurs bornes comme des intervalles de confiance. Tester si le classement des stratégies change sous différents CAC, conversions, paniers, réachats et parts de canal. Le prix et le budget ne doivent pas produire une prévision chiffrée « certaine » quand les paramètres de volume manquent.

Pour améliorer l’identification : collecter dépenses par pays–canal–semaine, campagne/exposition, prix effectif, profondeur promotionnelle, distribution active, stocks, commandes, unités et cohortes de réachat. Prévoir un pilote allemand avec groupes géographiques ou audiences traitées/témoins randomisés, mesure des ventes incrémentales et traitement des contaminations. Valider ensuite les modèles dans le temps et sur un pays tenu à l’écart ; ce test entre pays historiques reste seulement une étape avant validation allemande.
