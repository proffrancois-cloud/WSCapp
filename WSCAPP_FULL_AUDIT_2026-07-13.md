# Audit complet de WSCapp

Date de l'audit : 13 juillet 2026  
Branche auditée : `codex/2d-debate-lab-multiplayer`  
Révision de départ : `c8b9244`  
Statut du document : audit terminé, correctifs appliqués et revalidés ; le constat initial est conservé, le bilan final commence en section 9

## 1. Périmètre et méthode

L'audit couvre l'application web statique `app/`, sa version responsive destinée aux smartphones, l'enveloppe Electron, les services Supabase et Cloudflare liés au mode en ligne, les scripts de build/déploiement, les tests et le contenu généré visible par les élèves.

Deux lectures ont été menées :

1. **Utilisateur sans connaissance du produit** : parcours visuel et clavier, mode local, sélection des Guiding Sections, cinq modes Learn, cinq modes Play, réglages, ressources, fenêtres d'authentification, création de compte sans soumission, et plusieurs tailles d'écran desktop/mobile.
2. **Développeur web et smartphone** : inspection du DOM, console, gestion du focus, sémantique, responsive, poids des assets, architecture des scripts, déploiements, sécurité des API et du multijoueur, confidentialité, persistance, dette CSS et couverture des tests.

Outils et environnements utilisés : contrôle réel de Chrome via Computer Use, navigateur intégré isolé, inspection statique du dépôt, tests Node/Playwright du projet, largeurs de viewport desktop et smartphone. Aucun compte n'a été créé et aucun message n'a été envoyé au campus en ligne de production : rejoindre réellement ce campus aurait diffusé une présence et une identité à des tiers. Les chemins en ligne sont donc inspectés dans l'UI et doivent être vérifiés fonctionnellement par les tests locaux/mockés.

## 2. Résumé exécutif

WSCapp possède beaucoup de contenu et plusieurs expériences ludiques qui fonctionnent réellement. Le mode local est utilisable, les cinq familles Learn s'ouvrent, les jeux testés démarrent et acceptent des réponses, et la direction artistique a une identité mémorable. Au début de l'audit, l'application n'était toutefois pas au niveau de propreté attendu pour une web app publique destinée à des élèves : des contrôles invisibles restaient navigables, des modales ne respectaient pas entièrement le clavier, le premier écran mobile cachait les choix essentiels, une police manuscrite était imposée presque partout, des informations internes de production étaient montrées aux élèves et plusieurs frontières de sécurité du mode en ligne faisaient confiance au client.

Dans la baseline initiale, le principal problème structurel était l'accumulation. Le premier inventaire large comptait environ 810 Ko et 22 958 lignes dans le fichier principal, environ 1,5 Mo de feuilles de style avec 4 365 occurrences de `!important`, et un artefact Pages d'environ 368 Mo. Les métriques ont ensuite été standardisées par le nouveau validateur ; les valeurs finales comparables figurent en section 12. Le diagnostic reste valable : les surcharges CSS successives rendent les régressions visuelles très probables et compliquent fortement la maintenance.

Score UI/UX/a11y statique **avant correction** : **8/20**.

| Axe | Score | Motif principal |
| --- | ---: | --- |
| Accessibilité | 1/4 | Focus perdu, contrôles masqués mais tabulables, modales incomplètes, contrastes faibles |
| Responsive | 2/4 | Beaucoup de tests de tailles existent, mais l'entrée et la sélection de mode échouent en portrait étroit |
| Thème et cohérence | 2/4 | Identité forte, mais typographie globale et univers visuels local/online incohérents |
| Performance | 2/4 | Application statique simple, mais payload initial et images excessifs |
| Anti-patterns / maintenabilité | 1/4 | Très grand fichier monolithique, CSS append-only, milliers de `!important`, logique cliente trop autoritaire |

Après les réparations certaines décrites plus bas, l'estimation provisoire passe à **14/20**. Ce score n'est ni une certification WCAG, ni un feu vert de production : le mode local est nettement plus propre et robuste, mais l'autorité du multijoueur, la confidentialité en production, le poids du chargement et la dette structurelle restent des chantiers importants.

## 3. Ce qui fonctionne bien

- Le mode **Solo / Local** est utilisable sans compte et sans réseau une fois chargé.
- La sélection d'une Guiding Section déverrouille correctement Learn, Play et Train.
- Raw Content, Mind Map, Guide, Alpaca Channel et Alpacards s'ouvrent et affichent leur contenu.
- Alpacapardy, Alpaca Run, Alpaca Jump, Alpaquiz et Survivalpaca démarrent et acceptent des interactions de base.
- Le changement de carte/vidéo et le retournement des Alpacards fonctionnent visuellement.
- Les formulaires d'authentification ont des libellés et des attributs `autocomplete` globalement sérieux.
- Une orientation gate et des variables de safe area montrent qu'un effort smartphone existe déjà.
- Les tests du dépôt couvrent plusieurs tailles, WebKit, Firefox, le clavier mobile, Electron et le runtime de campus.
- Les cartes de jeu ont du caractère, les illustrations et le ton “alpaca” rendent l'application immédiatement reconnaissable.
- La console était vide d'erreurs et d'avertissements sur le parcours local initial testé.

## 4. Audit en tant qu'utilisateur “random”

### 4.1 Entrée dans l'application

**U-01 — Le premier écran ressemble à une obligation de créer un compte.**  
Le formulaire de connexion occupe la quasi-totalité du premier viewport. Sur 1280×720, les cartes Local et Online sont partiellement sous la ligne de flottaison. Sur 390×844 et 844×390, le formulaire domine encore davantage. Un nouvel utilisateur peut conclure à tort que le compte est obligatoire alors que le mode local est l'option la plus sûre et la plus immédiate.

**U-02 — La hiérarchie du hub est peu explicite.**  
Après le choix Solo, une grande zone de papier peint vide attire plus l'œil que les actions. La rangée de Guiding Sections est principalement iconique, sans libellés persistants visibles, et les trois grands boutons Learn/Play/Train apparaissent désactivés sans expliquer clairement l'étape attendue.

**U-03 — Le hub se dégrade fortement en portrait étroit.**  
À 390 px, le header, les icônes de sections et les cercles de mode se serrent ou se chevauchent. Après sélection d'une section, l'ouverture de Learn n'a pas produit de menu visible dans le parcours isolé, alors que le DOM contenait les modes avec opacité nulle et interactions désactivées.

### 4.2 Navigation et fenêtres

**U-04 — Le bouton principal “Close” de Resources ne ferme pas la fenêtre.**  
Le bouton en bas est rendu avec `data-close-resources`, mais le gestionnaire ne ferme que si le clic est hors de la fenêtre ou sur `.popup-close-button`. Le X supérieur fonctionne. Bug certain et reproductible.

**U-05 — Des liens invisibles du header restent dans l'ordre de tabulation.**  
Menu fermé, Tab déplace le focus successivement sur Discord, Settings, Login, Resources et Contact, alors que ces contrôles ont `opacity: 0` et `pointer-events: none`. Cela désoriente au clavier et expose des éléments “cachés” aux technologies d'assistance.

**U-06 — Le libellé du bouton de menu peut rester “Close header menu” après une fermeture programmée.**  
`closeHeroMenu()` remet `aria-expanded` à false mais ne remet pas son `aria-label`.

**U-07 — Le slider de volume perd le focus pendant l'utilisation.**  
Chaque événement `input` rerend entièrement la modale. Après une première touche fléchée, le focus revient sur le document ; une seconde touche ne modifie plus le volume. C'est un bug fonctionnel clavier, pas seulement un détail UX.

**U-08 — Les modales ne partagent pas une gestion de focus cohérente.**  
L'orientation gate possède la logique la plus aboutie, mais la fenêtre d'entrée n'envoie pas le focus vers une action initiale et plusieurs dialogues de jeu/campus n'ont ni piège de focus, ni restauration robuste, ni nom accessible suffisant. `Escape` n'a pas fermé les questions Alpaquiz/Survivalpaca testées.

### 4.3 Learn et contenu pédagogique

**U-09 — Des instructions internes de génération sont affichées aux élèves.**  
Dans Raw Content > Call of Duty-Free > Caravanserais, le texte visible contient “Image requirement + source guidance” et “The agent must use /imagesearch…”. Le même type de texte apparaît dans plusieurs Alpacards sous Recognition Focus. Dix fichiers de contenu/générés contiennent ces marqueurs. C'est une fuite de mécanique éditoriale et un défaut de qualité de contenu certain.

**U-10 — Après une réponse de quiz, le focus est perdu.**  
Raw Content, Alpaca Run, Alpaquiz et Survivalpaca remplacent une partie du DOM puis laissent l'élément actif sur `body`/`html`. Le feedback n'est pas systématiquement une live region. Un utilisateur clavier ou lecteur d'écran ne sait pas où se trouve le résultat ni quelle action vient ensuite.

**U-11 — Les Alpacards ne communiquent pas leur état.**  
Le bouton conserve le libellé “Flip” des deux côtés, sans `aria-pressed` ni indication “show front/show details”. Les deux faces restent exposées à l'arbre d'accessibilité. Sur la carte Caravanserais, du texte long est aussi visuellement comprimé ou coupé.

**U-12 — Mind Map utilise mal l'espace disponible.**  
Le graphe central reste très petit dans un grand panneau. L'ouverture d'une entrée ne produit pas un dialogue sémantique correctement nommé et le focus n'est pas déplacé vers le contenu ouvert.

**U-13 — Guide est dense et difficile à lire.**  
La police manuscrite imposée, la longueur des paragraphes et les petites tailles rendent le contenu fatigant. Des noms de notes/sources internes restent visibles et ressemblent davantage à une fiche de production qu'à une leçon éditée.

### 4.4 Jeux

**U-14 — Les jeux fonctionnent, mais la sortie de partie manque de cohérence.**  
Dans Alpaquiz et Survivalpaca, le bouton général Back to hub reste visuellement présent derrière la question mais ne permet pas de quitter cette étape. Il faut repasser par le bouton spécifique de rejouabilité/configuration. L'utilisateur voit donc une action qui paraît disponible mais ne l'est pas.

**U-15 — Alpaca Jump peut terminer très vite sans onboarding suffisant.**  
Lors du test, la partie s'est terminée en quelques secondes avant la première interaction de contrôle utile. L'écran de résultat affichait les statistiques et “Take This Route Again”, sans action de retour directe visible.

**U-16 — Petite erreur de copie dans Survivalpaca.**  
Le texte “timer ... paused after your answer” devrait employer “pauses”. D'autres libellés sont hétérogènes : “Join on discord”, “En route”, “Alpacapp”.

### 4.5 Mode en ligne

**U-17 — Le dialogue invité est imbriqué dans le dialogue de mode.**  
Choisir Online ouvre une confirmation “Continue as guest?” dans une autre modale. La hiérarchie et la gestion de focus deviennent ambiguës.

**U-18 — L'inscription demande beaucoup de données à un élève.**  
Pays, école, événements, round et reward sont demandés en plus de l'identité du compte. L'application n'affiche pas clairement, au même endroit, une politique de confidentialité, une explication de la diffusion du profil, l'export/suppression des données ou des contrôles block/mute.

**U-19 — Le flux “forgot password” accepte un Alpaca name ou un email.**  
Cette commodité s'appuie sur un resolver serveur qui révèle l'email correspondant à un pseudonyme et crée un risque d'énumération de comptes.

## 5. Audit développeur web

### 5.1 Sécurité critique

**D-01 — Résolution publique pseudonyme → email.**  
`app/supabase/alpaccounts.sql` définit une fonction `SECURITY DEFINER` `resolve_alpaca_login` accessible aux rôles `anon` et `authenticated`. Elle retourne l'adresse email du profil. Le client l'appelle dans `app-main.js` et `supabase-profile-service.js`. Un attaquant peut tester des pseudonymes et récupérer les emails associés. La fonction contredit les intentions documentées de confidentialité.

**D-02 — Proxy HTML same-origin sans sandbox.**  
`api/embed-library-resource.js` récupère une URL tierce et renvoie son HTML inchangé. L'application place ce résultat dans une iframe de même origine sans sandbox strict. Un script de la page distante peut ainsi s'exécuter sous l'origine WSCapp. Les redirections doivent également être revalidées, sinon la validation de l'URL initiale ne suffit pas.

**D-03 — API feedback sans protection anti-abus suffisante.**  
`/api/send-feedback-email` est appelable sans authentification forte, rate limit, captcha ou barrière d'origine robuste. Cela permet spam et consommation de quota.

**D-04 — Multijoueur client-authoritative.**  
Les sessions Supabase permettent au client d'émettre des événements de départ, révélation, réponse et score. Scholar's Challenge transmet la question avec `answerIndex` et les réponses complètes aux pairs. Le worker Cloudflare accepte également une identité issue de la query/body sans vérification JWT forte et accepte des payloads d'état arbitraires. Un participant modifié peut tricher, usurper une identité ou forcer l'état. Les révisions concurrentes peuvent s'écraser.

### 5.2 Déploiement et frontières d'exécution

**D-05 — Les deux endpoints `/api` ne suivent pas le déploiement canonique.**  
Le build Cloudflare Pages/GitHub Pages publie `app/dist-pages`, mais les fonctions Vercel racine ne sont pas copiées. Le serveur local statique et Electron renvoient également 404. Feedback email et embedded library peuvent donc fonctionner sur une cible et casser sur la cible canonique.

**D-06 — Les protections d'en-têtes ne sont pas garanties par la suite principale.**  
`test:headers` existe mais n'est pas inclus dans `npm run verify`. Les protections CSP/frame attendues ne sont pas toutes présentes. Cela amplifie le risque du proxy HTML.

### 5.3 Données et confidentialité

**D-07 — La progression locale n'est pas isolée par utilisateur.**  
Les statistiques/mastery persistent après sign-out. Un nouveau compte peut reprendre et potentiellement synchroniser les données d'un compte précédent. Des chargements asynchrones ne revérifient pas toujours l'utilisateur actif avant d'appliquer leur résultat.

**D-08 — La synchronisation écrase l'état complet et ignore certains retours d'erreur.**  
Le téléchargement distant peut remplacer l'état local en bloc ; des upserts fire-and-forget peuvent arriver dans le désordre. Il manque une stratégie explicite de version/conflit et une surface utilisateur pour les erreurs.

**D-09 — Profil élève trop diffusé.**  
École et pays sont requis puis utilisés dans le profil/presence campus. Pour des utilisateurs potentiellement mineurs, la minimisation, le consentement et les contrôles de suppression/visibilité sont insuffisants.

### 5.4 Architecture et maintenance

**D-10 — Monolithe principal.**  
`app/src/app/app-main.js` fait environ 22 958 lignes / 810 Ko. Les responsabilités auth, progression, fenêtres, jeux, rendu et réseau sont très entremêlées. Le petit `app/app.js` n'est qu'un garde de chargement.

**D-11 — Budget JavaScript trompeur.**  
`test:app-js-budget` mesure le minuscule `app/app.js`, pas `app-main.js` ni les banques générées. Il ne protège donc pas le vrai coût de démarrage.

**D-12 — Dette CSS extrême.**  
Environ 1,5 Mo de CSS, 4 365 `!important`, z-index jusqu'à 30 000 et plusieurs séries d'overrides datées “May 23 pathstage…”. Les règles tardives changent des systèmes entiers et rendent la cascade illisible.

**D-13 — Police imposée universellement.**  
Une règle tardive applique `Shadows Into Light Two !important` à `body` et presque tous ses descendants, annulant Inter, Cardo et les polices mono prévues par les composants. Elle réduit la lisibilité et casse la hiérarchie typographique.

**D-14 — Payload et assets excessifs.**  
Le runtime Raw Content pèse environ 4,4 Mo à lui seul. Plusieurs images font 12–15 Mo à 5–6K px. Le chargement direct des banques et scripts approche plusieurs mégaoctets avant interaction. L'artefact public fait environ 368 Mo.

**D-15 — Chemins absolus de machine dans du runtime généré.**  
Sept occurrences `/Users/francoismo/...` sont présentes sous `app/generated`. Cela fuit des détails de build, rend l'artefact non reproductible et peut produire des références mortes.

**D-16 — Service chargé mais apparemment inutilisé.**  
`src/modes/play/live-session-service.js` est inclus mais aucun consommateur actif n'a été trouvé. Il faut soit le brancher et le tester, soit le retirer du chargement.

**D-17 — Renderers/états wizard probablement obsolètes.**  
Plusieurs fonctions et cartes semblent appartenir à des versions précédentes du parcours. Leur suppression doit être précédée d'une preuve d'absence de références, car le code classique global masque facilement des dépendances implicites.

### 5.5 Couverture de tests

**D-18 — `verify` omet des tests importants.**  
Sont notamment hors de la commande principale : budget JS, débat campus, audio débat, stockage en échec, headers, frontière HTML, garde des sinks HTML, a11y Playwright et build Vercel.

**D-19 — Le smoke a11y Playwright n'est pas intégré comme les autres validations.**  
Il manque une configuration/baseURL homogène et la commande n'est pas appelée par `verify`.

**D-20 — Les snapshots de tailles ne garantissent pas l'utilisabilité.**  
La suite couvre de nombreux appareils, mais n'a pas détecté le menu Learn invisible/recouvert à 390 px, le focus perdu après rendu ni les contrôles invisibles tabulables. Il faut des assertions d'interaction et d'accessibilité, pas seulement de géométrie/présence.

## 6. Audit développeur smartphone

WSCapp est une application web responsive/PWA historique et une application desktop Electron ; il n'existe pas de code natif iOS ou Android dans ce dépôt. La lecture “smartphone app developer” porte donc sur le Web mobile installé ou ouvert dans Safari/Chrome.

**M-01 — Portrait mobile bloqué ou dégradé.**  
Sur les appareils touch-first, l'orientation gate force le paysage jusqu'à de très grandes dimensions sans possibilité de continuer en portrait. Cela contrevient au principe WCAG 1.3.4 sauf nécessité essentielle. Sans émulation touch, le portrait reste techniquement affiché mais le hub et les menus ne sont pas correctement utilisables.

**M-02 — Premier viewport mobile mal priorisé.**  
Le formulaire d'authentification pousse Local/Online sous la ligne de flottaison. L'action la plus utile pour un nouvel élève hors connexion n'est pas visible immédiatement.

**M-03 — Cibles tactiles trop petites.**  
Certains contrôles iconiques et fermetures sont autour de 30–40 px, sous la cible recommandée de 44×44 px.

**M-04 — Labels essentiels cachés dans des tooltips.**  
Les Guiding Sections utilisent des libellés visuellement réduits à 1×1 et des tooltips hover/focus. Sur écran tactile, le nom d'une section n'est pas disponible avant action de façon fiable.

**M-05 — Safe areas présentes mais expérience modale fragile avec clavier.**  
Le projet a des variables de safe area et un smoke clavier mobile, mais l'empilement des modales et la perte de focus rendent encore la saisie et les retours difficiles sur petit écran.

**M-06 — Motion et scroll.**  
Les animations radiales longues, le smooth scrolling et certaines animations infinies ne sont pas entièrement neutralisés par `prefers-reduced-motion`. Sur appareil peu puissant, ces transitions ajoutent du coût et retardent l'accès aux choix.

**M-07 — Coût réseau et mémoire élevé.**  
Des banques de plusieurs mégaoctets et des images de 12–15 Mo sont particulièrement pénalisantes en 4G, sur appareil à faible RAM et lors d'une reprise de webview.

## 7. Accessibilité et qualité visuelle transversales

**A-01 — Contrastes insuffisants.**  
`--gold: #c89c44` sur fonds très pâles produit environ 2,44:1 pour de petits textes. Plusieurs couleurs de sujets utilisées comme texte sont autour de 2,1–3,8:1. Les textes normaux doivent atteindre 4,5:1.

**A-02 — Textes trop petits.**  
Quarante-neuf règles descendent sous `0.7rem`. Combinées à la police manuscrite, elles deviennent difficiles à lire, notamment sur mobile.

**A-03 — Sémantique incohérente.**  
On trouve des titres dans des boutons, un faux tablist, des `aria-label` sur des `div`, des notices auth sans `alert`/`status`, des `<main>` imbriqués et des actions campus représentées comme `role="img"` ou des boutons imbriqués.

**A-04 — Fenêtres sans comportement modal complet.**  
Le projet rend environ 18 éléments `aria-modal="true"`, mais une seule famille dispose de la combinaison complète focus initial + trap + inert du fond + Escape + restauration.

**A-05 — Identité visuelle fragmentée.**  
Le mode local “scrapbook/papier” et le campus online néon semblent parfois appartenir à deux produits. Cela peut être un choix créatif, mais les composants, espacements et typographies de transition devraient former un système commun.

**A-06 — Grand vide sur ultra-wide et panneau d'activité campus vide.**  
Certaines compositions produisent un grand vide décoratif alors que les actions principales sont tassées. Le fond illustré concurrence le contenu plutôt que de le soutenir.

## 8. Liste ordonnée des réparations

L'ordre ci-dessous va volontairement du plus simple et certain au plus architectural ou incertain, comme demandé.

### Niveau 1 — Corrections évidentes, faible risque

1. Réparer le bouton Close de Resources.
2. Empêcher le rerender du slider de volume pendant `input` et conserver le focus.
3. Retirer les contrôles invisibles du header de la tabulation et synchroniser leur état accessible.
4. Retirer les grilles de modes fermées de la tabulation.
5. Restaurer le bon `aria-label` du bouton de menu après fermeture programmée.
6. Corriger les typos/copies manifestes.
7. Nettoyer les consignes internes `/imagesearch` et chemins absolus dans le contenu généré, via la source puis la génération.
8. Donner un état accessible au flip Alpacards et masquer la face inactive aux technologies d'assistance.
9. Ajouter une annonce/focalisation du feedback après réponse aux quiz concernés.
10. Retirer la surcharge universelle de police manuscrite et restaurer la hiérarchie prévue.

### Niveau 2 — Corrections certaines, nécessitant tests visuels/régression

11. Recomposer l'entrée mobile pour que Local et Online soient visibles immédiatement.
12. Corriger la grille Learn/Play/Train en portrait étroit et garantir que les cartes ouvertes sont visibles/cliquables.
13. Ajouter une option de poursuite en portrait et ne pas bloquer tout le produit par l'orientation gate.
14. Normaliser les tailles tactiles à 44×44 px au minimum.
15. Donner des labels persistants aux Guiding Sections sur tactile.
16. Généraliser le gestionnaire de dialogue : focus initial, trap, Escape, inert du fond, restauration.
17. Compléter `prefers-reduced-motion`.
18. Corriger les contrastes de petits textes et supprimer les tailles inférieures à un seuil lisible.
19. Ajouter les tests actuellement omis à une validation complète, en distinguant les tests obligatoires des builds coûteux.
20. Faire mesurer au budget JavaScript les vrais points d'entrée et le runtime initial.

### Niveau 3 — Corrections critiques mais impliquant migration/déploiement

21. Supprimer le resolver public pseudonyme → email ; rendre la connexion/récupération compatible sans divulgation.
22. Désactiver ou remplacer le proxy HTML same-origin ; si conservé, utiliser une allowlist, revalider chaque redirect, purifier le contenu et sandboxer sur une origine isolée.
23. Ajouter rate limit, anti-abus et validation d'origine au feedback.
24. Porter les endpoints nécessaires vers la cible Cloudflare canonique ou désactiver proprement les fonctions indisponibles selon le runtime.
25. Isoler la progression par `user_id`, annuler les réponses async obsolètes et implémenter version/conflit.
26. Rendre école/pays facultatifs ou privés par défaut ; documenter consentement, export et suppression.
27. Déplacer l'autorité des jeux en ligne côté serveur et vérifier les JWT/permissions sur chaque événement.

### Niveau 4 — Nettoyage structurel sûr après stabilisation

28. Extraire de `app-main.js` les petits services déjà identifiables : focus/dialogues, progression, auth, ressources, feedback de quiz.
29. Supprimer le service live inutilisé si les recherches et tests confirment zéro consommateur.
30. Auditer les renderers wizard obsolètes puis retirer uniquement ceux prouvés morts.
31. Découper les banques de contenu et charger par section/mode à la demande.
32. Convertir/compresser les images surdimensionnées et imposer des budgets d'assets.
33. Consolider les couches CSS par composant, supprimer les overrides datés et réduire progressivement `!important`.

### Niveau 5 — Décisions produit, “je ne suis pas sûr qu'il faille changer sans validation”

34. Conserver ou rapprocher les deux univers visuels local “scrapbook” et campus néon.
35. Décider si l'authentification doit rester le premier contenu ou devenir une action secondaire après Local/Online.
36. Décider si le mode Online invité doit être disponible sans compte, compte tenu de la modération et des mineurs.
37. Décider quelles informations de profil sont réellement utiles aux autres utilisateurs du campus.
38. Décider si les menus radiaux font partie de l'identité à préserver ou s'ils doivent devenir des listes/cartes plus directes sur tous les écrans.
39. Décider si les notes de sources doivent apparaître dans les leçons ; si oui, les éditer comme bibliographie pédagogique plutôt que notes de production.
40. Décider du statut de Train, actuellement visible mais largement indisponible/localement désactivé : roadmap expliquée, bêta, ou retrait temporaire.

## 9. Baseline de tests avant réparations

La baseline utile n'était pas seulement le résultat des scripts existants : plusieurs défauts certains passaient entre leurs mailles. Avant correction, les tests géométriques ne détectaient notamment pas le bouton Resources inerte, la tabulation dans le header invisible, la perte de focus du volume, les faces Alpacards simultanément exposées, le menu portrait impraticable ou les instructions `/imagesearch` montrées aux élèves.

La baseline a donc été constituée de quatre couches :

1. parcours réel avec Computer Use dans Chrome, comme un nouvel utilisateur sans connaissance du produit ;
2. second parcours dans un navigateur isolé, avec clavier, inspection du focus, petits viewports et vérification de la console ;
3. inspection développeur des frontières auth/Supabase, API, realtime, progression, Electron, builds et contenu généré ;
4. exécution de la suite existante, puis ajout des assertions manquantes avant toute conclusion.

Les défauts U-01 à A-06 ci-dessus sont le constat figé de cette baseline. Ils ne sont pas réécrits a posteriori pour donner l'impression que l'application était déjà correcte.

## 10. Journal des réparations et re-vérifications

### 10.1 Entrée, responsive et navigation

- Les choix Local et Online ont été remontés avant l'authentification. Un nouvel utilisateur comprend maintenant immédiatement que le compte est optionnel pour le mode local.
- L'orientation gate propose une poursuite en portrait. Le rendu portrait a reçu un fallback explicite pour les cartes Learn/Play/Train et les appareils tactiles.
- Le header fermé et les grilles de modes fermées utilisent désormais `inert` et un état accessible synchronisé. Les contrôles invisibles ne sont plus atteints par Tab.
- Le libellé du bouton de menu suit réellement son état ouvert/fermé.
- Le bouton inférieur Close de Resources ferme la fenêtre et restitue le focus à l'élément déclencheur.
- Les cibles tactiles certaines qui restaient trop petites, dont la fermeture Mind Map et les puces de section sélectionnées, ont été portées à 44 × 44 px.
- `prefers-reduced-motion` neutralise davantage d'animations et de smooth scroll.

Re-vérifications : parcours manuel Chrome, régression d'interactions automatisée, matrices 390×844, 667×375, 844×390, Android/tablette, desktop compact et ultralarge. La première passe étendue a correctement signalé la fermeture Mind Map à 40×40 sur trois profils ; après correction à 44×44, le test WebKit ciblé puis la passe globale ont réussi.

### 10.2 Focus, clavier et accessibilité

- Le slider de volume est mis à jour en place : il n'est plus détruit/recréé à chaque événement `input`. Le même nœud conserve le focus et plusieurs touches fléchées successives fonctionnent.
- Un gestionnaire commun couvre maintenant les principales fenêtres de l'application : focus initial, piège de focus, fermeture par Escape quand elle est permise, fond inerte et restauration du focus.
- Les feedbacks de quiz replacent le focus sur une zone annoncée après remplacement du DOM.
- Les Alpacards exposent leur état recto/verso, un libellé d'action dynamique et masquent la face inactive à l'arbre d'accessibilité.
- La police manuscrite universelle tardive a été supprimée afin de restaurer les familles prévues par les composants.
- Le contraste du doré utilisé pour de petits textes a été renforcé et les boutons de fermeture ont été harmonisés.

Re-vérifications : test manuel du volume à la valeur 51 avec conservation du nœud actif ; test Playwright du trap de focus et d'Escape ; contrôle sans overflow à 390 px ; parcours Alpacards manuel ; tests d'agrandissement du texte à 125 %. Les deux tests Playwright passent.

### 10.3 Authentification, profils et progression

- La connexion et la récupération de mot de passe demandent désormais un email. Les appels client au resolver pseudonyme → email ont été retirés.
- Le SQL Supabase supprime les fonctions de résolution publiques, réduit les grants et applique des contraintes de profil plus strictes. La synchronisation de l'identité OAuth passe par un trigger de base de données plutôt que par une écriture cliente privilégiée.
- Des longueurs maximales ont été ajoutées aux entrées sensibles et la politique de mot de passe est bornée de 8 à 128 caractères.
- Les champs publics du campus ont été réduits ; les champs privés ne sont plus recopiés aveuglément dans la présence.
- La progression est passée à un format v2 séparant explicitement invité et utilisateur. L'ancien stockage est migré dans le scope invité uniquement.
- Les changements de session revérifient l'utilisateur actif avant d'appliquer un chargement distant, et les sauvegardes sont sérialisées pour limiter les courses.

Re-vérifications : tests auth/confidentialité, tests de scope invité/utilisateur et de réponses asynchrones obsolètes, smoke global. Le correctif SQL reste à déployer et tester dans un projet Supabase de staging avant de considérer D-01 clos en production.

### 10.4 API, déploiements et Electron

- Le proxy de ressources est maintenant limité à une allowlist, revalide les redirections, refuse les types/tailles inattendus et applique une limite de réponse. L'iframe est sandboxée avec origine opaque ; les échanges `postMessage` vérifient `event.source`, l'origine opaque attendue et le type/payload autorisé.
- L'endpoint de feedback vérifie l'origine, borne les entrées et le body, échappe les contenus, ajoute un honeypot et un rate limit local. Les signalements visant une personne nécessitent une session authentifiée.
- Les adaptateurs Cloudflare Pages Functions appliquent la limite de 32 Ko pendant la lecture du flux, avant buffering, puis transmettent aux handlers Node partagés.
- Les Pages Functions et leurs bindings attendus sont documentés. Vercel pointe maintenant vers le bon build/output et reçoit les headers de sécurité attendus.
- Les déploiements purement statiques et Electron désactivent proprement les fonctions serveur indisponibles au lieu de laisser des actions qui finissent en 404.
- Un CSP est présent à la fois dans les headers et en méta pour protéger les runtimes où les headers ne sont pas garantis.
- Electron utilise le sandbox, bloque les navigations/popups non autorisées et empaquette les fichiers runtime nécessaires, y compris `realtime-config.js`. Les flux OAuth/récupération dépendant d'un navigateur externe sont masqués dans ce runtime.
- Le chargement Supabase est épinglé et possède un fallback de démarrage hors ligne. Le boot guard distingue les ressources réellement critiques des images/médias/ressources externes facultatives.

Re-vérifications : 9 tests de sécurité API, tests des adaptateurs Cloudflare, tests de headers/CSP, test de configuration Electron et démarrage Electron sans message console, audits des artefacts Pages et Vercel.

### 10.5 Realtime et campus

- Le worker vérifie l'origine, limite les payloads, nettoie les chaînes et les champs publics, borne les coordonnées, génère des identifiants de message uniques et applique des limites par événement.
- Une limite globale par socket couvre aussi les types de messages inconnus, ce qui évite de contourner les quotas en inventant un type.
- La limite de message a été portée de 32 à 64 Kio après qu'une revue finale a démontré qu'un état Scholar's Challenge valide de 50 joueurs dépassait 32 Kio. Une fixture 50 joueurs × 30 questions protège désormais ce contrat sans supprimer la borne anti-abus.
- La simulation de charge envoie maintenant un header `Origin` configurable, ce qui rend le test compatible avec la frontière réellement déployée.

Re-vérifications : 9 tests worker sur 9 passent, dont le nouveau cas de capacité, et la simulation a été validée syntaxiquement et contre un petit serveur local. Cela durcit le transport mais ne transforme pas encore le jeu en système server-authoritative : D-04 reste ouvert.

### 10.6 Contenu, génération et fuites de production

- Le générateur retire `imageGuidance`, `imageInstruction`, `imageSearchQuery` et `videoGuidance` du runtime élève.
- La génération échoue désormais si un marqueur `/imagesearch` ou un chemin local de machine apparaît dans le runtime actif.
- Les typos manifestes identifiées dans les questions et copies ont été corrigées à la source, puis les banques actives ont été régénérées.
- Le scan final des sources chargées par l'application, de `app/generated/current-runtime` et des deux artefacts publiables ne trouve plus de consigne interne ni de chemin `/Users/...` ou `/private/tmp/...`. Les banques legacy d'authoring non publiées restent volontairement hors de cette affirmation et sont listées en section 13.

Deux sections de guides/questions ont été modifiées en parallèle par un autre travail éditorial pendant l'audit. Elles ont été préservées et incluses dans les validations finales, mais leur nouveau contenu éditorial et les binaires DOCX/PDF ne sont pas attribués aux correctifs techniques de cet audit. Le script pilote Python correspondant dépend encore d'un environnement local non versionné : sa reproductibilité reste à traiter.

### 10.7 Nettoyage et garde-fous

- Le service `live-session-service.js`, chargé mais sans consommateur actif, et ses références ont été retirés.
- Le serveur de test statique et la configuration Playwright utilisent un chemin Node portable plutôt qu'une hypothèse propre à une machine.
- Le budget JavaScript mesure maintenant le vrai contrôleur, les banques, les 54 scripts initiaux, les styles et l'ensemble des assets.
- `npm run verify` a été élargi aux tests précédemment omis : auth, API, Cloudflare, progression, stockage en échec, headers, frontière HTML, sinks, budget, realtime, Electron, débat/audio, interaction UI, accessibilité, build Pages et tests multi-navigateurs sur source puis artefact.
- `npm run verify:vercel` construit et audite séparément la cible Vercel.

## 11. État final des constats

### 11.1 Vue utilisateur

| État | Constats |
| --- | --- |
| Corrigés | U-01 entrée, U-03 portrait, U-04 Resources, U-05 tabulation cachée, U-06 label menu, U-07 volume, U-09 consignes internes, U-10 focus quiz, U-11 Alpacards, U-16 copie, U-17 dialogue invité, U-19 resolver email |
| Partiellement corrigés | U-02 hiérarchie du hub, U-08 couverture de toutes les modales, U-12 échelle/lecture Mind Map, U-13 densité Guide, U-14 sorties de jeux, U-15 onboarding Jump, U-18 minimisation et information de confidentialité |

### 11.2 Vue développeur web

| État | Constats |
| --- | --- |
| Corrigés dans le dépôt | D-06 headers dans la validation, D-07 scopes de progression, D-11 vrai budget, D-13 police globale, D-15 runtime publié nettoyé, D-16 service mort, D-18/D-19/D-20 couverture de tests |
| Corrigés avec étape de déploiement restante | D-01 suppression du resolver dans code/SQL ; D-05 fonctions disponibles sur Cloudflare Pages et Vercel |
| Contenus mais pas éliminés | D-02 proxy fortement borné/sandboxé, D-03 feedback durci, D-08 courses réduites sans vraie révision/merge, D-09 diffusion réduite sans politique complète |
| Ouverts | D-04 autorité multijoueur, D-10 monolithe, D-12 dette CSS, D-14 poids, D-17 renderers possiblement obsolètes |

### 11.3 Vue smartphone et transversal

| État | Constats |
| --- | --- |
| Corrigés | M-01 portrait, M-02 priorité de l'entrée, M-04 labels tactiles, M-06 reduced motion |
| Largement corrigés | M-03 cibles tactiles certaines, M-05 clavier/modal principal |
| Ouvert | M-07 réseau/mémoire ; il n'existe toujours pas d'application native iOS/Android dans ce dépôt |
| Partiels / décisions | A-01 contraste, A-02 petits textes, A-03 sémantique, A-04 couverture modale ; A-05 identité visuelle et A-06 composition ultralarge nécessitent une décision de design |

## 12. Validation finale

| Vérification | Résultat final |
| --- | --- |
| `npm run verify` | Succès, code 0, après exécution complète sur sources puis artefact Pages |
| `npm run verify:vercel` | Succès, code 0 |
| Sécurité API | 9/9 |
| Worker realtime | 9/9, y compris capacité Challenge 50 joueurs × 30 questions |
| `npm run verify:core` après le dernier correctif realtime | Succès, code 0 |
| Playwright a11y | 2/2 : trap/Escape et absence d'overflow à 390 px |
| UI interactions | Succès : portrait, entrée, header inerte, Resources, volume, cartes, console |
| WebKit/Safari | Toutes les matrices source et artefact, zéro échec |
| Firefox | Matrices desktop source et artefact, zéro échec |
| Responsive, clavier, texte 125 %, captures | Source et artefact, zéro échec |
| Electron | Démarrage sandboxé, aucun message console |
| Audit Pages | 913 fichiers, aucun manquant/interdit/erreur |
| Audit Vercel | 912 fichiers, aucun manquant/interdit/erreur |
| Marqueurs d'édition dans les artefacts | Zéro occurrence |
| `git diff --check` | Succès |

Mesures finales des budgets :

- `app-main.js` : 23 203 lignes selon le validateur de budget, 819 966 octets ;
- scripts initiaux : 8 933 162 octets répartis sur 54 scripts ;
- banque Raw Content : 4 314 641 octets ;
- données débat : 2 485 271 octets ;
- styles racine : 714 978 octets ;
- assets publics : 369 731 838 octets ;
- plus gros asset : 15 303 362 octets (`the-gare-saint-lazare.jpg`).

Ces budgets passent parce qu'ils décrivent honnêtement l'état actuel ; ce ne sont pas des objectifs de performance satisfaisants. Les cibles architecturales ajoutées demandent moins de 3 Mo au premier chargement, des dérivés WebP/AVIF et la poursuite du découpage de `app-main.js`.

Limites de la preuve finale :

- aucun compte, email ou message de production n'a été créé/envoyé ;
- le projet Supabase déployé, ses migrations/RLS et les bindings Cloudflare réels n'ont pas été modifiés depuis cet environnement ;
- les viewports et moteurs sont réels côté navigateur, mais les tests n'ont pas été faits sur un parc de téléphones physiques ;
- aucun audit complet avec VoiceOver/TalkBack, lecteur d'écran humain ou test d'utilisabilité avec élèves n'a été mené ;
- le campus public n'a pas été rejoint, pour ne pas diffuser une présence de test à des tiers.

## 13. Ce qu'il reste à réparer, par priorité

### P0 — Avant de considérer le multijoueur compétitif comme fiable

1. Émettre un ticket de session côté serveur, vérifier JWT/room/role pour chaque socket et retirer l'identité librement fournie par le client.
2. Rendre le serveur autoritaire pour le départ, les questions, les réponses, le score et les révisions ; ne plus diffuser `answerIndex` aux pairs.
3. Ajouter anti-replay, limites de rooms, expiration, reconnexion déterministe, journal de modération, block/mute/kick et tests adversariaux.
4. Déployer les migrations Supabase dans un staging propre, vérifier les grants/RLS avec des sessions anon et authentifiées, puis contrôler que l'ancien resolver n'existe plus.

### P1 — Avant une ouverture publique plus large

5. Remplacer le rate limit mémoire du feedback par un stockage distribué/durable, ajouter timeout et éventuellement CAPTCHA/Turnstile selon l'abus observé.
6. Isoler idéalement le proxy HTML sur une origine dédiée ; ajouter timeout réseau, quotas et, si le besoin le permet, sanitization stricte plutôt qu'exécution de scripts tiers.
7. Concevoir une vraie stratégie de progression avec numéro de révision, merge explicite, erreur visible, retry et action “effacer les données de cet appareil”.
8. Rendre école/pays facultatifs ou privés par défaut, publier une politique adaptée aux mineurs et fournir export/suppression/visibilité.
9. Tester les fonctions, emails, OAuth/recovery, headers et CSP sur les URLs de staging réellement déployées.

### P2 — Performance, maintenance et qualité produit

10. Charger les banques par section/mode pour descendre sous 3 Mo au premier écran.
11. Générer des images responsives WebP/AVIF et exclure les originaux 5K/15 Mo des artefacts publics.
12. Extraire progressivement de `app-main.js` les services déjà testables : dialogues, auth, progression, quiz, ressources et coordination de modes.
13. Consolider les feuilles CSS par composant et supprimer méthodiquement les quelque 4 500 `!important` des sources, sans réécriture globale risquée.
14. Agrandir réellement Mind Map, alléger Guide, normaliser les sorties de jeux et donner à Alpaca Jump un onboarding/compte à rebours.
15. Décider et afficher honnêtement le statut de Train : roadmap, bêta ou retrait temporaire.
16. Nettoyer les anciennes banques d'authoring non publiées et rendre le générateur éditorial pilote reproductible sans polices/environnement temporaires locaux.
17. Tester sur iPhone/Android physiques, réseau lent, appareil faible mémoire, VoiceOver et TalkBack.

## 14. Verdict et proposition de suite

Le mode local est aujourd'hui nettement plus cohérent, navigable et vérifiable qu'au début de l'audit. Les bugs certains rencontrés par un nouvel utilisateur ont été corrigés et la suite finale prouve que ces changements tiennent sur les principaux moteurs, petits écrans, clavier mobile, Electron et deux formats de build.

Je ne recommanderais toutefois pas encore de présenter le campus multijoueur comme un environnement compétitif sécurisé : les protections de transport ont progressé, mais l'autorité du jeu et l'identité de session restent trop clientes. Je ne recommanderais pas non plus de qualifier l'expérience de “smartphone app native” : c'est une web app responsive/PWA, sans projet iOS ou Android.

La prochaine itération la plus rentable est donc : sécuriser l'autorité realtime et le déploiement Supabase, puis réduire le chargement initial et les images, puis seulement entreprendre le grand nettoyage de `app-main.js`/CSS. Les décisions purement esthétiques — rapprochement scrapbook/néon, menus radiaux, place de l'auth et bibliographies — doivent être validées comme choix produit plutôt que changées silencieusement par un audit technique.
