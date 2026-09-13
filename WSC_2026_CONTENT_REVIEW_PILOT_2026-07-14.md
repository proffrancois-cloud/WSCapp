# Revue éditoriale du curriculum WSC 2026 — pilote et méthode de refonte

Date : 14 juillet 2026  
Périmètre de ce lot : les deux sections pilotes complètes, `Call of Duty-Free` et `There’s a Draft in Here`, avec leurs éditions longues dans l’app, en DOCX et en PDF

## Conclusion

Le meilleur modèle pour l’app n’est pas « le texte du curriculum, enrichi de quelques liens facultatifs ». Le curriculum réel est formé par la consigne officielle, toutes ses listes imbriquées et toutes les pages reliées. Une page liée peut porter un concept qui n’est presque pas expliqué dans la consigne elle-même — le caravansérail en est un bon exemple. Elle doit donc être traitée comme une partie constitutive du programme.

Les faits récents ont un autre rôle. Ils ne remplacent pas le curriculum et ne doivent pas devenir une liste d’actualité à mémoriser. Ils servent de stimuli pour vérifier si l’élève sait appliquer les concepts du curriculum à une situation nouvelle, distinguer une donnée d’une conclusion et demander les preuves manquantes.

Le pilote montre qu’une bonne section doit réunir trois couches de sources :

1. **Curriculum canonique** : consigne WSC, listes et chaque lien officiel.
2. **Validation** : source primaire, institutionnelle ou recherche évaluée par les pairs pour préciser ou corriger les claims.
3. **Contexte de round** : faits récents, datés, qui permettent de poser une question nouvelle sans sortir du curriculum.

## Format de lecture retenu

Les deux guides pilotes ont été entièrement recomposés comme de petits livres, et non comme des fiches ou des notes de synthèse. Chaque branche officielle devient un chapitre doté d'une ouverture, d'un développement causal, d'exemples comparés, de nuances factuelles et d'une conclusion qui prépare la branche suivante. Les tableaux ont été retirés des deux guides. Ils ne devront revenir dans une future section que lorsqu'une comparaison exacte serait réellement moins claire en prose.

`Call of Duty-Free` compte désormais environ 9 500 mots répartis entre six chapitres, puis une synthèse. Son PDF occupe 16 pages A4. `There’s a Draft in Here` compte environ 5 600 mots répartis entre quatre chapitres, puis un épilogue. Son PDF occupe 10 pages A4. Les notes de sources restent visuellement distinctes du récit, mais tous les faits importants sont expliqués dans les paragraphes eux-mêmes. Le lecteur n'a donc pas besoin de décoder une succession de cases ou de listes pour comprendre l'argument.

Le même HTML s'affiche directement dans l'app et produit les DOCX et PDF. Les liens ne sont pas remplacés par une bibliographie muette : les URL du guide, du DOCX et du PDF sont identiques et cliquables. Sur desktop, la colonne de lecture est limitée à environ 72 caractères. Sur mobile, les marges décoratives sont réduites pour conserver une vraie largeur de texte, sans scroll imbriqué ni débordement horizontal. La palette crème, cacao et or, la mascotte Guide, les titres et les pieds de page restent alignés sur l'identité visuelle WSCapp.

## 1. Ce que révélait l’état initial

L’audit de la banque de questions a montré que le principal problème n’était pas le renderer. L’interface sait déjà mélanger les choix, afficher une explication différente selon le distracteur et montrer une connexion ou un takeaway.

Le problème était éditorial : avant ce pilote, 394 des 396 questions de section répétaient simplement la bonne réponse dans leur explication, et 1 182 des 1 188 feedbacks de distracteurs utilisaient le même patron générique. Les niveaux 400–500 donnaient un meilleur modèle de raisonnement, mais leurs sources doivent elles aussi être progressivement renforcées.

Un second problème était structurel : la reconstruction de la banque depuis les fichiers de section aurait supprimé les 230 questions Full Voyage. La refonte du contenu devait donc commencer par sécuriser la génération.

## 2. Pilote `Call of Duty-Free`

La [page officielle WSC 2026](https://www.scholarscup.org/subjects/2026/guiding-2026/) contient six branches et dix liens directs pour cette section. Les six branches sont maintenant visibles comme six entrées distinctes :

1. abris de route, auberges, relais, caravansérails et hôtels ;
2. Grand Tour et privilège social ;
3. passage du tourisme d’élite au tourisme de masse ;
4. nostalgie d’un « âge d’or » et comportement touristique ;
5. tourisme « authentique », formes de niche et visibilité algorithmique ;
6. circulation des biens, entrepôts, zones franches, transbordement et hubs.

### Changements importants

- Le tourisme de masse n’est plus une transition implicite : il possède sa propre entrée et sa chaîne causale — transport, congés payés, revenu disponible, classe moyenne et organisation des voyages.
- Le caravansérail n’est plus une simple définition. Il est traité comme une architecture de route, un service pour personnes, animaux et marchandises, un nœud commercial et un lieu d’échange culturel.
- Les catégories proches sont séparées : post house, caravansérail et hôtel ; entrepôt, waystation, zone franche et transbordement ; duty-free retail et régime douanier commercial.
- Shimoda et Hakodate ne sont plus décrits comme immédiatement ouverts au commerce général en 1854 : le premier accès concernait le ravitaillement et l’assistance, avant l’élargissement ultérieur des droits commerciaux.
- Les dix liens WSC L211–L220 sont présents au point d’usage. L’URL d’archive mal formée par le curriculum est conservée dans la provenance, tandis que l’élève reçoit la version fonctionnelle.

### Actualité utilisée comme stimulus

- UN Tourism estime à 1,52 milliard le nombre d’arrivées touristiques internationales avec nuitée en 2025. Il s’agit d’arrivées, pas de 1,52 milliard de personnes uniques. [Source officielle, janvier 2026](https://pre-webunwto.s3.eu-west-1.amazonaws.com/s3fs-public/2026-01/260120-international-tourist-arrivals-up-4-in-2025-reflecting-strong-travel-demand-around-the-world-en.pdf)
- Venise indique que son dispositif 2025 s’est appliqué pendant 54 jours, a émis 723 497 titres d’accès payants et encaissé 5 421 425 euros. Ces sorties administratives ne prouvent pas à elles seules combien de personnes sont effectivement entrées ni si la foule ou la pression sur les habitants ont diminué. [Ville de Venise, 4 août 2025](https://live.comune.venezia.it/it/2025/08/contributo-di-accesso-i-numeri-del-2025)

### Questions

La section contient maintenant 24 questions entièrement réécrites : 6 au niveau 100, 6 au niveau 200 et 12 au niveau 300. Chaque distracteur représente une confusion identifiable, par exemple :

- volume touristique contre surtourisme ;
- permis émis contre entrées vérifiées ;
- recette administrative contre efficacité causale ;
- duty-free shop contre zone franche ;
- sentiment d’authenticité contre contrôle local et bénéfice durable ;
- image nostalgique contre comparaison historique représentative.

## 3. Pilote `There’s a Draft in Here` — quatre branches, dont la psychologie de la répétition

La page WSC contient quatre branches et dix-sept liens directs L049–L065. Le nouveau guide développe les études et versions visuelles, les démos musicales, les chansons coupées et la répétition comme quatre chapitres liés par une même question : qu'est-ce qu'une version provisoire permet de tester ? La quatrième consigne — « Investigate the psychology of rehearsal » — était auparavant enfouie comme une puce de la troisième entrée. Elle est maintenant une entrée autonome.

Le contenu distingue :

- répétition physique ;
- imagerie motrice ;
- répétition verbale ;
- jeu de rôle ;
- retrieval practice.

Il évite l’idée d’un « centre de la répétition » unique. Les réseaux recrutés dépendent de la tâche ; l’imagerie motrice et l’exécution se recouvrent partiellement, sans être des copies neurologiques. Les critères d’arrêt sont formulés comme des tests observables : précision, stabilité, rétention différée et transfert à une condition modifiée.

Deux études de 2025 sont présentées sans fausse comparaison de dosage :

- vingt minutes d’imagerie motrice ont amélioré la stabilité d’une tâche de force du coude chez des femmes jeunes et plus âgées dans un essai précis ; [PMID 40684972](https://pubmed.ncbi.nlm.nih.gov/40684972/)
- quatre semaines d’entraînement n’ont pas amélioré cinq tâches de marche chez des adultes âgés en bonne santé dans un autre essai. [PMID 39818123](https://pubmed.ncbi.nlm.nih.gov/39818123/)

La conclusion correcte est la spécificité des tâches, des populations et des mesures — pas « vingt minutes valent mieux que quatre semaines » et pas « l’imagerie mentale fonctionne toujours ou jamais ».

Cinq questions ont été ajoutées pour couvrir cette branche : une définition, deux mécanismes et deux transferts. Une revue de motor learning centrée sur la distinction entre performance immédiate, rétention et transfert soutient directement le critère « assez répété ». [PMID 22142953](https://pubmed.ncbi.nlm.nih.gov/22142953/)

## 4. Modèle recommandé pour toutes les prochaines questions

| Niveau | Mouvement intellectuel attendu |
| --- | --- |
| 100 | Identifier un fait, un terme ou un exemple officiel précis |
| 200 | Expliquer un mécanisme causal ou une distinction |
| 300 | Relier deux éléments de la même section et justifier le pont |
| 400 | Transférer une relation entre plusieurs sections du curriculum |
| 500 | Interpréter un stimulus extérieur ou récent grâce au curriculum |

Pour tous les niveaux :

- trois distracteurs de même type et de précision comparable à la bonne réponse ;
- une erreur plausible et distincte par distracteur ;
- une explication qui expose le mécanisme au lieu de répéter la réponse ;
- un feedback qui nomme exactement la confusion ;
- une connexion et un takeaway à partir du niveau 300 ;
- une provenance séparant curriculum, validation et stimulus actuel.

Le profil `wsc-evidence-v1` applique déjà ces règles aux 29 questions refaites ou ajoutées dans les deux pilotes. Il doit être étendu section par section, après réécriture, pour ne pas transformer la dette éditoriale existante en milliers d’erreurs de validation d’un seul coup.

## 5. Sécurisation technique réalisée

- La banque centrale reconstruit les niveaux 100–300 depuis les sections sans supprimer les niveaux 400–500.
- Les 230 questions Full Voyage et leurs 272 placements sont conservés dans leur ordre canonique.
- Le validateur compare désormais le contenu complet d’une question de section avec sa version centrale, pas seulement son identifiant.
- Les exigences du profil `wsc-evidence-v1` sont vérifiées automatiquement.
- Le comparateur legacy n’accepte que les écarts chiffrés exacts de ce pilote : +2 entrées, +5 questions d’entrée et +4 questions de guide. Un autre écart reste une erreur.
- Le smoke test lit les totaux du runtime généré au lieu de conserver des nombres obsolètes en dur.

État vérifié : 15 sections, 109 entrées, 405 questions de section, 635 questions uniques dans la banque, 677 placements et 230 questions Full Voyage. `test:theme` et `test:smoke` passent ; le validateur rapporte zéro erreur et zéro avertissement.

## 6. Ce qui reste à faire

Ce pilote ne signifie pas que les treize autres sections sont déjà satisfaisantes. Il fixe la méthode et le niveau attendu. La suite doit appliquer la même boucle à chaque section :

1. extraire à nouveau la branche officielle depuis l’app WSC actuelle, y compris listes et liens ;
2. comparer ce graphe au raw content, au guide et aux questions de l’app ;
3. rechercher les nouvelles publications des mêmes auteurs, comptes et institutions ;
4. construire une matrice `claim → source → nuance → comparaison → question possible` ;
5. réécrire le raw content avant le guide, puis les questions ;
6. régénérer HTML, DOCX, PDF, banque centrale et runtime ;
7. vérifier les liens, les distracteurs, les documents et les parcours de l’app.

La priorité ne doit pas être le volume de texte. Une bonne section est une carte de raisonnement : elle montre ce que la source établit, ce qu’elle n’établit pas, comment les branches se répondent et comment un fait nouveau pourrait être utilisé pendant un round.

## 7. Livrables du pilote

- `content/themes/2026/sections/call-of-duty-free/raw-content.json`
- `content/themes/2026/sections/call-of-duty-free/guide.html`
- `content/themes/2026/sections/call-of-duty-free/questions.json`
- `app/content/regular-guides/pdf/call-of-duty-free.pdf`
- `app/content/regular-guides/docx/call-of-duty-free.docx`
- `content/themes/2026/sections/theres-a-draft-in-here/raw-content.json`
- `content/themes/2026/sections/theres-a-draft-in-here/guide.html`
- `content/themes/2026/sections/theres-a-draft-in-here/questions.json`
- `app/content/regular-guides/pdf/theres-a-draft-in-here.pdf`
- `app/content/regular-guides/docx/theres-a-draft-in-here.docx`
- `tools/generators/build_book_guides.py`
- `app/src/modes/learn/regular-guide/regular-guide-mode.js`
- `app/styles-learn-mode-overrides.css`
