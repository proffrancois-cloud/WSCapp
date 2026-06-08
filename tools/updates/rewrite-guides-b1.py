#!/usr/bin/env python3
"""Rewrite all regular guides in B1 connected-paragraph style."""

from __future__ import annotations

import html
import json
import re
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
SECTIONS_DIR = ROOT / "content" / "themes" / "2026" / "sections"
PACKETS_DIR = ROOT / "outputs" / "guide_rewrite" / "section_source_packets"
REPORT_PATH = ROOT / "outputs" / "guide_rewrite" / "b1_guide_rewrite_report.json"


SECTION_BLUEPRINTS = {
    "introductory-questions": {
        "route": "This opening section teaches the big question of the year. Being 'there' can mean arriving at a place, finishing a task, reaching a life stage, or deciding that the journey is no longer worth the cost.",
        "together": "The examples belong together because they all make arrival less simple. A song can look back at life, a film can make an ending feel too long, a child can want adult power too early, and a future technology can stay almost ready for decades.",
        "concepts": [
            ("Arrival", "Reaching a point that people agree to call the end.", "Use it carefully, because not every arrival feels complete."),
            ("Threshold", "A line after which the situation changes.", "Look for moments when going back becomes hard or impossible."),
            ("Near-ending", "A moment that feels like the end before the real end arrives.", "Use it with stories, projects, politics, and climate warnings."),
            ("Point of no return", "The moment when a route can no longer be reversed easily.", "Ask who notices this point and who misses it."),
        ],
        "connections": "Connect this section to movie endings, school years, product launches, climate tipping points, graduation, sports finals, and songs about looking back on life.",
        "chapters": [[1], [2, 3], [4, 5], [6]],
    },
    "progress-not-regress": {
        "route": "This section asks how people know whether they are moving forward. Progress can be a real change, a number on a chart, a bar on a screen, or only a feeling created by design.",
        "together": "The examples belong together because they show that progress is never only a fact. Interfaces, airport design, games, social indicators, and world data all shape what people believe about movement toward a goal.",
        "concepts": [
            ("Progress signal", "A visible sign that something is moving forward.", "Ask whether the signal shows real change or only makes waiting easier."),
            ("Metric", "A number used to measure a complex situation.", "Ask what the number includes and what it hides."),
            ("Placebo control", "A button or sign that gives a feeling of control without changing much.", "Use it to discuss trust, comfort, and manipulation."),
            ("Nonlinear progress", "Progress that moves unevenly instead of in a straight line.", "Use it for societies, learning, health, and technology."),
        ],
        "connections": "Connect this section to app loading screens, airport baggage claims, school grade trackers, GDP debates, climate dashboards, game loading screens, and news stories about whether the world is improving.",
        "chapters": [[1, 2, 5], [3, 4, 5, 6], [7], [8], [7, 8]],
    },
    "more-to-do-than-can-ever-be-listed": {
        "route": "This section is about how people turn too many tasks into visible order. A list can help memory, lower stress, set priorities, and also prove that there will always be more to do.",
        "together": "The examples belong together because lists are tools for living with unfinished work. They can help a person act, but they can also become another place where pressure collects.",
        "concepts": [
            ("External memory", "A system outside the mind that holds what we might forget.", "Use it for to-do lists, calendars, checklists, and dashboards."),
            ("Priority", "A choice about what should happen first.", "Remember that choosing one task usually delays another."),
            ("Zeigarnik effect", "The idea that unfinished tasks can stay active in memory.", "Use it to explain stress, reminders, and the relief of finishing."),
            ("Infinite list", "A list that points toward more than anyone can complete.", "Use it for culture, museums, reading lists, and life goals."),
        ],
        "connections": "Connect this section to school planners, hospital checklists, software backlogs, bucket lists, streaming watchlists, and public lists of names in memorials.",
        "chapters": [[1], [1], [2], [2], [3]],
    },
    "the-end-is-nearish": {
        "route": "This section studies the strange time before an ending. The end may be scheduled, predicted, feared, symbolic, profitable, or already beginning while people still act as if life is normal.",
        "together": "The examples belong together because they all ask what happens when people believe an end is close. Leaders lose power, clocks warn the public, artists imagine disaster, and companies may even find ways to profit from fear.",
        "concepts": [
            ("End-zone", "The period when an ending feels close but has not fully arrived.", "Use it for elections, disasters, stories, and climate thresholds."),
            ("Symbolic warning", "A public sign that creates urgency without giving an exact prediction.", "Use it with the Doomsday Clock and similar alerts."),
            ("Apocalypse", "A story or image of world-ending change.", "Ask what fear the image belongs to in its own time."),
            ("Profiting from disaster", "Making money from risk, fear, or breakdown.", "Ask who benefits when others feel trapped."),
        ],
        "connections": "Connect this section to election transitions, Y2K, climate tipping points, disaster films, zombie games, countdown clocks, insurance, and companies that sell safety during crisis.",
        "chapters": [[1, 2, 3], [4, 5], [9, 10], [6, 7, 8], [4, 5, 10]],
    },
    "theres-a-draft-in-here": {
        "route": "This section treats almost-finished work as serious evidence. Drafts, demos, sketches, cut songs, and unreleased material show how creation moves before it looks complete.",
        "together": "The examples belong together because they let students see process. A rough draft, a music demo, and a deleted song all show choices that a final version usually hides.",
        "concepts": [
            ("Draft", "A working version made before the final version.", "Use it to study thinking in motion."),
            ("Revision", "Changing a work after testing, feedback, or new ideas.", "Ask what the change fixes and what it removes."),
            ("Demo", "A test or early version that shows direction.", "Use it for music, products, games, and software."),
            ("Cut material", "Work removed from a final product.", "Ask why it was removed and why people later care about it."),
        ],
        "connections": "Connect this section to movie deleted scenes, album demos, game beta versions, design prototypes, writer notebooks, and online releases of unfinished material.",
        "chapters": [[1], [1, 2], [2, 3], [1, 3], [1, 2, 3]],
    },
    "were-all-in-this-to-get-there": {
        "route": "This section asks how groups move toward a goal together. Shared goals sound simple, but real projects involve delays, trade-offs, leaders, tools, workers, and unequal costs.",
        "together": "The examples belong together because they show that group progress needs coordination. A chart, a stopwatch, a management method, or a law of effort can help, but none of them removes human limits.",
        "concepts": [
            ("Project", "A planned effort with tasks, people, and a goal.", "Use it for buildings, software, school work, and public systems."),
            ("Dependency", "A task that must wait for another task.", "Ask what is blocked and who is waiting."),
            ("Trade-off", "A choice where improving one thing can hurt another.", "Use cost, speed, and quality as a basic triangle."),
            ("Efficiency", "Doing work with less wasted time or effort.", "Ask whether the human cost is being hidden."),
        ],
        "connections": "Connect this section to delayed airports, group projects, software sprints, factory work, sports teams, public construction, and news about large projects going over budget.",
        "chapters": [[1, 2], [3, 4], [4, 7, 8], [5, 6], [2, 3, 5, 6]],
    },
    "where-the-sidewalk-starts": {
        "route": "This section treats sidewalks, parking, and pedestrian space as choices about public life. Streets do not only move cars; they decide who can move safely, slowly, freely, or not at all.",
        "together": "The examples belong together because built space teaches behavior. A sidewalk, moving walkway, parking lot, snout house, or reclaimed public space can make one kind of movement easy and another kind difficult.",
        "concepts": [
            ("Walkability", "How easy and safe a place is for people on foot.", "Use it to judge streets, schools, stores, and neighborhoods."),
            ("Car dependence", "A design pattern where daily life almost requires a car.", "Ask who gains freedom and who loses it."),
            ("Accessibility", "Design that lets more bodies use a space.", "Look for ramps, distances, crossings, and waiting places."),
            ("Public space", "Shared space where people can meet, move, rest, or play.", "Ask who is welcome and who is pushed away."),
        ],
        "connections": "Connect this section to parklets, school crossings, parking minimums, malls, theme-park queues, disability access, and cities turning car space into people space.",
        "chapters": [[1], [2, 7], [5, 6, 7], [3, 4, 5, 6], [1, 2, 7]],
    },
    "monkey-see-monkey-prototype": {
        "route": "This section studies early versions of things. Prototypes, models, AI-built products, fake intelligence, and staged demos can teach people, but they can also mislead them.",
        "together": "The examples belong together because they all ask how real an almost-real thing is. A prototype can reduce risk, but a rushed model or hidden human labor can create new risks.",
        "concepts": [
            ("Prototype", "An early model built to test an idea.", "Ask what the model proves and what it does not prove."),
            ("Iteration", "Improving through repeated versions.", "Use it for design, writing, software, and engineering."),
            ("Simulation", "A controlled version of reality used for testing or showing.", "Ask what is missing from the real world."),
            ("Hidden labor", "Human work that makes a machine or system look more automatic than it is.", "Look behind impressive demos."),
        ],
        "connections": "Connect this section to AI demos, 3D printing, Tesla Bot reveals, the Mechanical Turk, startup MVPs, beta software, and product videos that show more confidence than reality.",
        "chapters": [[1, 2], [2, 3], [1, 2, 3], [4, 5, 6], [4, 6]],
    },
    "the-lovely-and-the-liminal": {
        "route": "This section asks why the in-between can feel strange, useful, frightening, and beautiful. Liminal spaces are not just empty rooms; they are moments when identity, place, or purpose is unsettled.",
        "together": "The examples belong together because they show many forms of being between. A doorway, an airport, a game space, a waiting room, a song, and a rite of passage all hold people before the next clear state.",
        "concepts": [
            ("Liminal", "In between one state and another.", "Use it for places, stories, rituals, and life stages."),
            ("Threshold", "A crossing point between before and after.", "Ask what changes when someone crosses it."),
            ("Uncanny ordinary", "A normal place that feels strange because it lacks its usual purpose.", "Use it for empty offices, malls, schools, and digital spaces."),
            ("Waiting space", "A place designed for not-yet-arrival.", "Ask what people do while suspended there."),
        ],
        "connections": "Connect this section to airports, hotel corridors, The Backrooms, Waiting for Godot, ambient music, graduation rituals, hospital waiting rooms, and games set in empty places.",
        "chapters": [[1, 2, 7, 8], [6, 9], [3, 5], [1, 8], [4, 5, 9]],
    },
    "going-pains": {
        "route": "This section is about growing through change. It starts with adolescence, but it also studies names, rituals, culture, adult tasks, art, and death as different kinds of threshold.",
        "together": "The examples belong together because growing up is not one clean moment. Biology, language, school, money, family, art, and law all help decide when a person seems to have moved from one stage to another.",
        "concepts": [
            ("Adolescence", "The gradual development between childhood and adulthood.", "Do not reduce it to one birthday."),
            ("Teenager", "A modern social category for young people in the teen years.", "Ask how schools, markets, and media made it visible."),
            ("Rite of passage", "A public act that marks a change in status.", "Ask what the community recognizes."),
            ("Adulting", "Doing adult tasks while still feeling unsure about adulthood.", "Use it to show adulthood as performance and practice."),
        ],
        "connections": "Connect this section to coming-of-age films, school graduation, driver's licenses, first jobs, brain-development claims, songs about growing up, and rituals from different cultures.",
        "chapters": [[4, 5, 6], [1, 2, 3], [3, 4], [4, 6], [5, 4]],
    },
    "home-and-wandering": {
        "route": "This section studies movement without treating the traveler as a dot on a map. Home, wandering, navigation, animal movement, borders, poetry, and migrant art all ask how people know where they are and where they belong.",
        "together": "The examples belong together because movement is both physical and emotional. A compass can measure direction, an animal can sense a route, an airport can trap a person, and a poem can hold the pain of divided belonging.",
        "concepts": [
            ("Wayfinding", "Finding a route by reading signs in the world.", "Use it for sailors, animals, and people without screens."),
            ("Belonging", "Feeling accepted as part of a place or group.", "Ask whether arrival creates belonging or only reaches a border."),
            ("Transit", "A state of passing through.", "Look for people who are stuck in a place built for movement."),
            ("Diaspora", "A community living away from an earlier homeland.", "Use poetry and art to study mixed identity."),
        ],
        "connections": "Connect this section to GPS, Fog of World, animal migration, The Terminal, refugee ships, border news, migration poems, Jacob Lawrence, and songs about mixed identity.",
        "chapters": [[5, 6, 7, 8], [1, 2, 3, 4], [6, 7, 8], [7, 8], [5, 6, 7]],
    },
    "where-were-going-well-still-need-them": {
        "route": "This section argues that future movement still depends on ordinary ground systems. Roads, paths, materials, maintenance, bus routes, motels, songs, paintings, and road myths all show that infrastructure and imagination travel together.",
        "together": "The examples belong together because the road is both a physical object and a cultural idea. People build roads to move, but they also use roads to tell stories about freedom, danger, identity, and national memory.",
        "concepts": [
            ("Infrastructure", "The basic systems that let movement happen.", "Use it for roads, bridges, bus routes, charging systems, and drains."),
            ("Maintenance", "The work needed to keep a system useful.", "Ask why repair often matters more than invention."),
            ("Stroad", "A road-street mix that often works badly for both travel and local life.", "Use it to judge design conflicts."),
            ("Road myth", "A story that turns a route into a symbol.", "Use it for Route 66, road trips, music, and paintings."),
        ],
        "connections": "Connect this section to Roman roads, smart roads, potholes, stroads, Route 66, bus journeys, motels, highway songs, scenic routes, and films where the road becomes a character.",
        "chapters": [[1, 5, 6, 8], [2], [3, 4], [4, 7, 9], [2, 11]],
    },
    "call-of-duty-free": {
        "route": "This section studies travel as commerce, comfort, status, and pressure. It asks what happens in the spaces around travel: hotels, grand tours, golden-age myths, authentic tourism, trade hubs, and duty-free zones.",
        "together": "The examples belong together because travel is never only movement. It also creates markets, status symbols, waiting places, images of luxury, and conflicts between visitors and local people.",
        "concepts": [
            ("Hospitality", "Systems that host travelers away from home.", "Use it for inns, hotels, caravanserais, and airports."),
            ("Status travel", "Travel used to show class, taste, freedom, or success.", "Ask who can afford the route and who serves it."),
            ("Authenticity", "The feeling that an experience is real or local.", "Ask whether tourists create or damage what they search for."),
            ("Trade hub", "A place where goods pause, change hands, and move on.", "Use it for ports, entrepots, airports, and duty-free zones."),
        ],
        "connections": "Connect this section to airports, Instagram tourism, luxury travel ads, Venice and Dolomites overtourism, duty-free shopping, cruise ports, and movies about hotels or travelers between places.",
        "chapters": [[5], [1], [2, 3], [4], [4, 5]],
    },
    "concluding-questions": {
        "route": "This final section asks what endings do to people. It studies stopping, knowing the wait, never quite arriving, patience, history, unclear stories, and the strange question that comes after arrival.",
        "together": "The examples belong together because they all challenge the easy idea that arrival solves everything. Sometimes it is wise to stop, sometimes information changes the wait, sometimes the finish line keeps moving, and sometimes a story or a society refuses to close neatly.",
        "concepts": [
            ("Closure", "The feeling that something has ended in a complete way.", "Ask whether the ending is official, emotional, moral, or only narrative."),
            ("Sunk cost", "The pressure to continue because time, effort, or money was already spent.", "Use it when quitting may be wiser than continuing."),
            ("Patience", "The ability to wait or continue without losing control.", "Ask whether patience is a virtue, a strategy, or a burden."),
            ("Aftermath", "What happens after people say they have arrived.", "Use it to show that arrival often opens a new route."),
        ],
        "connections": "Connect this section to Shrek's 'Are we there yet?' joke, Waiting for Godot, The Sopranos, Life of Pi, Fukuyama's End of History, progress bars, school graduations, and news stories where victory creates a new problem.",
        "chapters": [[5, 6, 7], [1, 4], [2, 3, 7], [3, 6], [5, 7]],
    },
    "next-year-in-futurism": {
        "route": "This section studies futures that feel close but keep moving away. It asks why people predict, promise, hype, remember, fear, and hope for technologies that may arrive late or not at all.",
        "together": "The examples belong together because futurism is not just guessing. It is a cultural habit shaped by desire, money, fear, politics, old predictions, science, and the stories people tell about what will soon be possible.",
        "concepts": [
            ("Futurism", "Thinking about possible futures and what they mean now.", "Ask who is predicting and what they want."),
            ("False imminence", "The feeling that a future is almost here for too long.", "Use it for fusion, AGI, space elevators, and smart homes."),
            ("Retrofuturism", "Old visions of the future studied from the present.", "Ask what the old future reveals about its own time."),
            ("Hype", "Excitement that can outrun evidence.", "Ask who benefits from belief before arrival."),
        ],
        "connections": "Connect this section to AGI debates, quantum security, old world fairs, Tesla's tower, life-extension news, underground cities, retrofuturist films, and predictions about 2028 or 2050.",
        "chapters": [[1, 2], [4, 7, 8, 9], [3, 4, 10], [2, 6], [7, 8, 9, 5]],
    },
}


def clean(value: str) -> str:
    text = re.sub(r"\s+", " ", str(value or "")).strip()
    return text


def esc(value: str) -> str:
    return html.escape(clean(value), quote=False)


def sentence(value: str, limit: int = 360) -> str:
    text = clean(value)
    if len(text) <= limit:
        return text

    window = text[:limit].rstrip()
    sentence_ends = [
        match.end()
        for match in re.finditer(r"(?<=[.!?])\s+(?=[A-Z0-9\"'])", window)
        if match.end() >= min(180, limit // 2)
    ]
    if sentence_ends:
        return window[: sentence_ends[-1]].strip()

    last_end = max(window.rfind("."), window.rfind("?"), window.rfind("!"))
    if last_end >= min(180, limit // 2):
        return window[: last_end + 1].strip()

    cut = window.rsplit(" ", 1)[0].rstrip(".,;:")
    return cut + "..."


def finish_sentence(value: str) -> str:
    text = clean(value)
    if not text:
        return ""
    if re.search(r"[.!?]$", text):
        return text
    return text + "."


def join_titles(entries: list[dict]) -> str:
    titles = [entry["title"] for entry in entries]
    if not titles:
        return "the selected examples"
    if len(titles) == 1:
        return titles[0]
    return ", ".join(titles[:-1]) + ", and " + titles[-1]


def link_phrase(entries: list[dict]) -> str:
    labels = []
    for entry in entries:
        for link in entry.get("links", [])[:2]:
            label = clean(link.get("label", ""))
            if label and label not in labels:
                labels.append(label)
    if not labels:
        return ""
    if len(labels) > 5:
        labels = labels[:5]
    return (
        "Use the linked material as evidence, not decoration. In this chapter, the useful source trail includes "
        + ", ".join(labels)
        + ". These sources give names, dates, objects, articles, videos, or cases that make the short WSC entry specific enough to explain."
    )


def source_families(packet: dict) -> str:
    names = []
    for snippet in packet.get("sourceSnippets", []):
        stem = Path(snippet.get("source", "")).stem.replace("_", " ").strip()
        stem = re.sub(r"\s+\d+$", "", stem)
        key = stem.lower()
        if stem and key not in {name.lower() for name in names}:
            names.append(stem)
    if not names:
        return ""
    visible = names[:5]
    if len(names) > 5:
        visible.append("other section notes")
    return ", ".join(visible)


def unique_flat(values: list[str]) -> list[str]:
    seen = set()
    result = []
    for value in values:
        cleaned = clean(value)
        key = cleaned.lower()
        if cleaned and key not in seen:
            seen.add(key)
            result.append(cleaned)
    return result


def entry_bridge_sentence(entries: list[dict], chapter_title: str) -> str:
    if not entries:
        return f"The chapter develops {chapter_title.lower()} by moving from concrete cases to a larger pattern."
    if len(entries) == 1:
        entry = entries[0]
        takeaway = finish_sentence(sentence(entry.get("takeaway") or entry.get("whyItMatters"), 240))
        return (
            f"The chapter begins with {entry['title']}. Its job is to turn one case into a tool: "
            f"{takeaway}"
        )

    first, second = entries[0], entries[1]
    last = entries[-1]
    first_takeaway = finish_sentence(sentence(first.get("takeaway") or first.get("whyItMatters"), 190))
    second_takeaway = finish_sentence(sentence(second.get("takeaway") or second.get("whyItMatters"), 190))
    if len(entries) == 2:
        return (
            f"The chapter puts {first['title']} beside {second['title']}. The first case asks students to notice this point: {first_takeaway} "
            f"The second case adds a second point: {second_takeaway}"
        )
    return (
        f"The chapter moves from {first['title']} to {join_titles(entries[1:])}. The route is not random: "
        f"it starts with this point: {first_takeaway} Then it tests that idea through {second['title']} and ends by asking how {last['title']} changes the pattern."
    )


def learning_focus_sentence(section_title: str, entries: list[dict]) -> str:
    ideas = unique_flat([idea for entry in entries for idea in entry.get("bigIdeas", [])[:2]])
    subjects = unique_flat([subject for entry in entries for subject in entry.get("subjects", [])[:2]])
    idea_text = ", ".join(ideas[:4]) or "movement, waiting, arrival, and unfinished change"
    subject_text = ", ".join(subjects[:4]) or "several school subjects"
    return (
        f"The reading skill here is to connect a fact to a pattern. The main pattern is {idea_text}; "
        f"the subject doorway is {subject_text}. A student should be able to explain the case, then say what it teaches about {section_title}."
    )


def comparison_prompt(section_title: str, entries: list[dict]) -> str:
    titles = [entry["title"] for entry in entries]
    if len(titles) <= 1:
        return (
            f"After reading it, test the idea with another entry from {section_title}. Ask whether the second example changes the first one, "
            "or only repeats it in a new costume."
        )
    return (
        f"After reading them, compare the pressure inside {titles[0]} with the pressure inside {titles[-1]}. "
        "Look for a change in scale, power, time, cost, or control."
    )


def entry_detail(entry: dict) -> str:
    title = entry["title"]
    official = sentence(entry.get("officialText", ""), 260)
    explanation = sentence(entry.get("studentExplanation", ""), 520)
    why = sentence(entry.get("whyItMatters", ""), 320)
    return (
        f"{title} begins from this official problem: {official} "
        f"In simpler terms, {explanation} {why}"
    )


def concept_table(concepts: list[tuple[str, str, str]]) -> str:
    rows = [
        "<tr><th><strong>Concept</strong></th><th><strong>Simple meaning</strong></th><th><strong>How to use it</strong></th></tr>"
    ]
    for concept, meaning, use in concepts:
        rows.append(
            f"<tr><td><strong>{esc(concept)}</strong></td><td>{esc(meaning)}</td><td>{esc(use)}</td></tr>"
        )
    return '<div class="regular-guide-doc-table-wrap"><table class="regular-guide-doc-table">' + "".join(rows) + "</table></div>"


def transfer_table(entries: list[dict], section_title: str) -> str:
    rows = [
        "<tr><th><strong>Official anchor</strong></th><th><strong>Transfer example</strong></th><th><strong>What to compare</strong></th></tr>"
    ]
    for entry in entries[:7]:
        examples = entry.get("examples") or []
        example = clean(examples[0]) if examples else f"a modern news story, movie, or school situation connected to {entry['title']}"
        rows.append(
            f"<tr><td><strong>{esc(entry['title'])}</strong></td><td>{esc(example)}</td><td>{esc(sentence(entry.get('takeaway') or entry.get('whyItMatters'), 180))}</td></tr>"
        )
    return '<div class="regular-guide-doc-table-wrap"><table class="regular-guide-doc-table">' + "".join(rows) + "</table></div>"


def paragraph(text: str) -> str:
    return f"<p>{esc(text)}</p>"


def entries_by_indices(packet: dict, indices: list[int]) -> list[dict]:
    entries = packet["entries"]
    selected = []
    for index in indices:
        if 1 <= index <= len(entries):
            selected.append(entries[index - 1])
    return selected or entries[:2]


def build_chapter(section_id: str, section_title: str, chapter_number: int, chapter_heading: str, subheads: list[str], packet: dict) -> str:
    blueprint = SECTION_BLUEPRINTS[section_id]
    chapter_maps = blueprint.get("chapters", [])
    selected = entries_by_indices(packet, chapter_maps[chapter_number - 1] if chapter_number - 1 < len(chapter_maps) else [])
    chapter_title = re.sub(r"^Chapter\s+\d+\s*-\s*", "", chapter_heading).strip()
    source_link_sentence = link_phrase(selected)
    html_parts = [f"<h3>{esc(chapter_heading)}</h3>"]

    for subhead in subheads:
        html_parts.append(f"<h4>{esc(subhead)}</h4>")
        subhead_key = subhead.lower()
        if "idea" in subhead_key:
            html_parts.append(paragraph(entry_bridge_sentence(selected, chapter_title)))
            html_parts.append(paragraph(learning_focus_sentence(section_title, selected)))
        elif "official" in subhead_key:
            for entry in selected:
                html_parts.append(paragraph(entry_detail(entry)))
            if source_link_sentence:
                html_parts.append(paragraph(source_link_sentence))
        elif "why" in subhead_key:
            ideas = []
            for entry in selected:
                ideas.extend(entry.get("bigIdeas", [])[:2])
            ideas_text = ", ".join(dict.fromkeys(ideas)) or "movement, progress, thresholds, and arrival"
            html_parts.append(paragraph(
                f"This matters because the chapter turns concrete syllabus details into bigger ideas: {ideas_text}. The examples are useful only when students can say what kind of movement, delay, threshold, or arrival is being tested."
            ))
            html_parts.append(paragraph(comparison_prompt(section_title, selected)))
        elif "transfer" in subhead_key:
            html_parts.append(paragraph(
                f"For transfer, use the same logic outside the syllabus. {SECTION_BLUEPRINTS[section_id]['connections']} The new case does not need to be identical. It only needs the same pressure: a route, delay, threshold, hidden cost, false ending, or visible sign of progress."
            ))
            html_parts.append(transfer_table(selected, section_title))
        else:
            html_parts.append(paragraph(
                f"This part belongs to the route of {section_title}. The examples work best when students compare their details and explain why the section places them together."
            ))

    return "\n".join(html_parts)


def build_final_synthesis(section_id: str, section_title: str, heading: str, subheads: list[str], packet: dict) -> str:
    blueprint = SECTION_BLUEPRINTS[section_id]
    entries = packet["entries"]
    html_parts = [f"<h3>{esc(heading)}</h3>"]
    for subhead in subheads:
        html_parts.append(f"<h4>{esc(subhead)}</h4>")
        low = subhead.lower()
        if "tension" in low:
            html_parts.append(paragraph(
                f"The main tension in {section_title} is that people want clear arrivals, but real life gives mixed routes. The section asks students to hold both sides at once: movement can be useful and costly, waiting can be empty and meaningful, and an ending can be official without feeling complete."
            ))
        elif "connect" in low:
            html_parts.append(paragraph(
                f"The examples connect through a chain. Start with {entries[0]['title']}, then compare it with {join_titles(entries[1:4])}. From there, bring in the later entries to show how the same pressure changes when the scale moves from a person to a group, a city, a technology, a story, or a whole society."
            ))
        elif "pitfall" in low or "avoid" in low:
            html_parts.append(paragraph(
                f"A basic answer treats each entry as a separate trivia item. A stronger answer asks what job the example does inside the section, how it changes the route question, and why WSC placed it near the other examples."
            ))
        else:
            html_parts.append(paragraph(
                f"Alpacas should remember the section as a set of tools, not as a list of facts. For every entry, be ready to say what is moving, what is delayed, who benefits, who pays, what sign of progress appears, and what kind of arrival is being questioned."
            ))
    html_parts.append(transfer_table(entries, section_title))
    return "\n".join(html_parts)


def build_guide(section_id: str, packet: dict) -> str:
    blueprint = SECTION_BLUEPRINTS[section_id]
    section_title = packet["title"] or packet["originalTitle"] or section_id
    headings = packet["guideHeadingsToPreserve"]
    entries = packet["entries"]
    html_parts = []
    i = 0
    chapter_number = 0

    while i < len(headings):
        heading = headings[i]
        text = heading["text"]
        if heading["level"] == 2:
            html_parts.append(f"<h2>{esc(text)}</h2>")
        elif heading["level"] == 3 and text == "Map of the guide":
            html_parts.append(f"<h3>{esc(text)}</h3>")
            html_parts.append(paragraph(
                f"This guide keeps the app's route plan, but it reads {section_title} as one connected lesson for strong middle-school readers using B1 English. The guide slows down the examples so students can see the people, places, objects, dates, and choices inside each entry."
            ))
            html_parts.append(paragraph(
                f"There are {len(entries)} official entries in this section: {join_titles(entries)}. Read them as a curriculum unit. Each entry gives one case, but the guide asks how the cases speak to each other."
            ))
            families = source_families(packet)
            if families:
                html_parts.append(paragraph(
                    f"The rewrite also checks the outside guide notes and resource packets, including {families}. Those notes are used to add background, not to replace the official raw content."
                ))
        elif heading["level"] == 3 and text == "The big route of the section":
            html_parts.append(f"<h3>{esc(text)}</h3>")
            html_parts.append(paragraph(blueprint["route"]))
            html_parts.append(paragraph(
                "The official WSC text gives the short version, but the linked sources and student explanations give the real working material. When an entry includes an article, video, poem, artwork, or historical case, treat that link as part of the syllabus."
            ))
        elif heading["level"] == 4 and text == "Why these examples belong together":
            html_parts.append(f"<h4>{esc(text)}</h4>")
            html_parts.append(paragraph(blueprint["together"]))
        elif heading["level"] == 3 and text == "Core concepts explained from zero":
            html_parts.append(f"<h3>{esc(text)}</h3>")
            html_parts.append(paragraph(
                "These concepts are the basic tools for the section. They are simple on purpose. A student should be able to use each one in a short answer before moving to harder comparisons."
            ))
            html_parts.append(concept_table(blueprint["concepts"]))
        elif heading["level"] == 3 and text.startswith("Chapter"):
            chapter_number += 1
            subheads = []
            j = i + 1
            while j < len(headings) and headings[j]["level"] == 4:
                subheads.append(headings[j]["text"])
                j += 1
            html_parts.append(build_chapter(section_id, section_title, chapter_number, text, subheads, packet))
            i = j - 1
        elif heading["level"] == 3 and ("Final synthesis" in text or text.startswith("7.")):
            subheads = []
            j = i + 1
            while j < len(headings) and headings[j]["level"] == 4:
                subheads.append(headings[j]["text"])
                j += 1
            html_parts.append(build_final_synthesis(section_id, section_title, text, subheads, packet))
            i = j - 1
        elif heading["level"] == 3:
            html_parts.append(f"<h3>{esc(text)}</h3>")
            html_parts.append(paragraph(
                f"This part helps connect {section_title} to the wider year theme. Use the official examples, source links, and transfer cases together."
            ))
        elif heading["level"] == 4:
            html_parts.append(f"<h4>{esc(text)}</h4>")
            html_parts.append(paragraph(
                f"This question should be answered by comparing details, not by repeating a title."
            ))
        i += 1

    return "\n".join(html_parts) + "\n"


def main() -> int:
    report = {"rewrittenAt": datetime.now(timezone.utc).isoformat(), "sections": {}}
    for section_id in sorted(SECTION_BLUEPRINTS):
        packet_path = PACKETS_DIR / f"{section_id}.json"
        if not packet_path.exists():
            raise FileNotFoundError(packet_path)
        packet = json.loads(packet_path.read_text(encoding="utf-8"))
        guide_html = build_guide(section_id, packet)
        target = SECTIONS_DIR / section_id / "guide.html"
        target.write_text(guide_html, encoding="utf-8")
        report["sections"][section_id] = {
            "target": str(target.relative_to(ROOT)),
            "chars": len(guide_html),
            "paragraphs": guide_html.count("<p>"),
            "tables": guide_html.count("<table"),
            "headingsPreserved": len(packet["guideHeadingsToPreserve"]),
        }

    REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    REPORT_PATH.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
