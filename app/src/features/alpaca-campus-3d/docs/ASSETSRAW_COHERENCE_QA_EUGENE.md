# Assetsraw Coherence QA - Eugene

Scope: user-eye coherence check from the raw asset pool only. Audience lens: 12-16 year old users landing in a room and deciding what it is within 2-3 seconds.

Raw packs that matter most for readability:

- Strong school/campus signal: `StylooClassroomAssetPack GLTF & FBX` classroom, computer, chemistry lab, art room, principal office, walls.
- Strong library signal: `kenney_isometricLibrary` bookcases, long tables, carpets, display cases.
- Strong games signal: `kenney_mini-arcade` arcade machines, air hockey, pinball, claw machine, basketball game, ticket/prize props.
- Neutral filler: `kenney_furniture-kit`, `[FREE] Interiors`, `Floor`.
- High confusion risk if overused: dungeon, graveyard, post-apocalyptic, gas station, pharmacy, restaurant, forest, space, castle, marble-track pieces. These are useful only as tiny accents or clearly framed exhibits.

## Lobby

Immediate read target: "campus hub / entrance / where I choose where to go."

Checklist:

- [ ] The first visible objects should be reception/hub objects: desks, benches, sofas, plants, signs/doors, lockers, wall/window modules.
- [ ] Keep the center lane open. The lobby is the highest-traffic room, so the middle should feel like a crossroads, not a decorated waiting room.
- [ ] Doorways or portals to other rooms should be more visually important than decorative props.
- [ ] Use repeated wall/floor language from the school packs so it feels like the same campus as classroom/debate/library.
- [ ] If there are lounge props, keep them to edges or corners. They should say "waiting area," not "living room."
- [ ] Avoid cafeteria food, bathroom props, arcade machines, barrels, fuel cans, graveyard pieces, and fantasy doors unless they are clearly marked as route signs.

Randomness watch:

- A lobby with a vending machine, ping-pong table, science vials, and bookcases can read as "asset test room." Pick one supporting story: reception, waiting, or navigation.
- Too many identical doors without labels/visual themes can make 12-16 year olds wonder which door matters.

Confusing to users:

- Center furniture that blocks the instinctive path from spawn to room choices.
- Decorative objects that look clickable but do nothing.
- A grand statue or museum case in the center, because that makes the room read as museum instead of hub.

## Library

Immediate read target: "quiet book room / research space."

Checklist:

- [ ] Anchor the room with bookcases first: `bookcaseBooks`, `bookcaseWideBooks`, `wallBooks`, `bookStand`, or `Bookshelf_1`.
- [ ] Add reading/work surfaces: `longTable`, `longTableChairs`, library chairs, carpet pieces.
- [ ] Put bookcases around the perimeter or in clear rows, leaving a visible center aisle.
- [ ] Keep rare/special items in display cases near walls, not in the walkable center.
- [ ] Use warm, quiet props. Books, lamps, carpets, and chairs help; lab equipment and arcade pieces fight the room identity.
- [ ] If using "destroyed" or "fallen" bookcases, treat them as story moments, not normal furniture.

Randomness watch:

- `displayCaseSword` is visually strong. One can work as a "special collection"; several make the library feel like a fantasy armory.
- Candle stands can add mood, but too many make the room read as old castle/dungeon.

Confusing to users:

- Empty bookcases beside full bookcases without a reason. It may look unfinished.
- Bookcase rows that create dead ends or hide the center route.
- Large decorative cases placed where users expect the path to be.

## Debate Lab

Immediate read target: "place for speaking, arguing, judging, and teams."

Checklist:

- [ ] The focal object should imply speaking: podium-like desk, central table, board, judge table, or two facing team tables.
- [ ] Use chairs in clear opposing groups. Symmetry matters here because it tells users there are sides.
- [ ] Keep a center speaking zone open enough that an avatar can stand there and look intentional.
- [ ] Use classroom/computer/lobby assets as support: blackboard, screen, projector, desk, markers, laptop/monitor.
- [ ] Add only a few visual "topic" props. The debate lab should not become a science lab, library, or museum.
- [ ] If using trophies/banners/display objects, put them on side walls as prestige, not as the main interaction target.

Randomness watch:

- Chemistry atoms, microscope, solar system, vials, and centrifuge are tempting "smart room" props, but they make the room read as science lab.
- Arcade/cafeteria/lounge objects weaken the formal debate cue unless they are outside the speaking zone.

Confusing to users:

- Round-table layouts where no one can tell who is presenting.
- Too many chairs with no obvious front, judge area, or team side.
- Center clutter that competes with the activity start point.

## Classroom

Immediate read target: "normal classroom where learning happens."

Checklist:

- [ ] Use `blackboardbig`, `desk`, `chairtable`, `chair`, books, chalk, markers, pencil case, lockers, shelf, and walls/floor from the classroom pack.
- [ ] Make the board/front wall obvious from the first camera angle.
- [ ] Arrange desks/chairs so there is a readable front, side aisles, and a center walking path.
- [ ] Keep small supplies on desks or shelves, not scattered across the floor.
- [ ] Use computer props only if the room is meant to be tech-enhanced; otherwise one projector/TV is enough.
- [ ] Keep the school bus, cafeteria food, toilet props, and chemistry gear out unless the room has a very explicit lesson theme.

Randomness watch:

- `TV`, `radio`, `schoolbus`, and many loose pencils/books can quickly feel like prop dumping.
- Art-room easels and paintings can work in a creative classroom corner, but too many will override the classroom read.

Confusing to users:

- A classroom without a clear board/front.
- Desks facing different directions unless there is a deliberate group-work layout.
- Navigation path blocked by student tables, especially near spawn.

## Museum

Immediate read target: "exhibit room / things to look at, not a storage room."

Checklist:

- [ ] Use display cases, art-room paintings, statues, banners, shelves, wall panels, and controlled lighting-style props.
- [ ] Place exhibits along edges or in islands with clear gaps. A museum needs browsing lanes.
- [ ] Give each exhibit cluster a theme: art, history, science, WSC memories, or campus trophies.
- [ ] Use unusual assets only when framed as exhibits: sword case, marble/castle piece, science model, resource/gold item.
- [ ] Keep the center path clear enough that the room feels like a gallery loop.
- [ ] Avoid mixing too many pack aesthetics in one sightline. One weird artifact is interesting; six unrelated weird artifacts look random.

Randomness watch:

- Castle, dungeon, graveyard, post-apocalyptic, gas station, pharmacy, and forest assets can work only if they are clearly "exhibit objects."
- Large functional props like vending machines, arcade cabinets, cafeteria trays, and toilets break the museum read immediately.

Confusing to users:

- Exhibits with no visual grouping. Users may not know whether objects are decorative, collectible, or interactive.
- Display cases blocking routes.
- A museum that looks like a warehouse because cases and artifacts are simply lined up without spacing.

## Games Hall

Immediate read target: "arcade / play room / active social space."

Checklist:

- [ ] Lead with `arcade-machine`, `pinball`, `air-hockey`, `claw-machine`, `basketball-game`, `dance-machine`, `ticket-machine`, and `prizes`.
- [ ] Keep machines on walls or in rows with playable fronts facing open space.
- [ ] Preserve a wide center lane. The games hall should feel busy, but users still need to move and gather.
- [ ] Group high-energy machines together and put prize/ticket props near an edge or counter.
- [ ] Use bright, readable props from the arcade pack before adding generic furniture.
- [ ] Avoid `gambling-machine` for this audience unless it is reskinned or clearly not gambling-coded.

Randomness watch:

- Cafeteria ping-pong can fit, but cafeteria food/trays/vending machines can pull the room toward cafeteria.
- Lounge sofas are okay as side seating, but a sofa-heavy room reads as common room, not games hall.

Confusing to users:

- Machines facing walls or each other with no clear interaction side.
- Too many prize/ticket/cash props in the middle, making the room feel like a shop.
- Arcade machines mixed with bookcases, lab gear, or museum cases without a strong "school game club" explanation.

## Fast Pass Per Room

- Lobby: choose route first, decoration second.
- Library: books and reading lanes first, magic/weapon display only as a small special collection.
- Debate lab: clear speaking zone plus opposing teams. Avoid science-lab drift.
- Classroom: obvious board/front, tidy desks, supplies on surfaces.
- Museum: exhibits need spacing and themes. Weird assets must be framed.
- Games hall: machine fronts and movement lanes matter more than filling every tile.
