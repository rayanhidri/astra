"""
Generate web/src/categoryMap.js — static sigle→category map for EtudiantLibreView.

Run from the project root:
    python3 etl/generate_category_map.py

Reads all programs/*.json + Neo4j (for tags/titles on catchall courses).
Assignment priority:
  1. Specific segment (category[] with < 4 entries) → first category
  2. Tags in TAG_TO_CAT that intersect the catchall category list
  3. Title keyword fallback (single unambiguous match only)
  4. First category of the catchall segment
"""

import json, os, re
from pathlib import Path
from collections import defaultdict
from dotenv import load_dotenv

load_dotenv(Path(__file__).parents[1] / ".env")

PROGRAMS_DIR = Path(__file__).parents[1] / "programs"
OUT_PATH = Path(__file__).parents[1] / "web" / "src" / "categoryMap.js"
CATCHALL_THRESHOLD = 4

CANONICAL_CATS = [
    "programming", "algorithms_theory", "systems", "math",
    "ai", "software_engineering", "data", "networks", "web",
]

TAG_TO_CAT = {
    "IA": "ai",
    "algorithmes": "algorithms_theory",
    "bases de données": "data",
    "compilation": "programming",
    "distribué": "systems",
    "génie logiciel": "software_engineering",
    "interfaces": "web",
    "mathématiques": "math",
    "réseaux": "networks",
    "systèmes": "systems",
    "sécurité": "networks",
    "web": "web",
}

TITLE_KEYWORDS = {
    "web": [
        r"(?i)\bweb\s+(development|services?|applications?|programming)\b",
        r"(?i)interfaces?\s+(utilisateurs?|personnes?)",
        r"(?i)\buser\s+interface\b",
    ],
    "algorithms_theory": [
        r"(?i)\balgorithm(s|e|es)?\b",
        r"(?i)\bthéorique\b",
        r"(?i)sémantique\s+des\s+langages",
    ],
    "data": [
        r"(?i)\bdata\s+(science|analytics|analysis)\b",
        r"(?i)\bdatabase\b",
    ],
    "networks": [
        r"(?i)\bnetwork(s|ing)?\b",
        r"(?i)\bréseaux?\b",
        r"(?i)\binternet\s+des\s+objets\b",
    ],
    "ai": [
        r"(?i)\bartificial\s+intelligence\b",
        r"(?i)\bintelligence\s+artificielle\b",
        r"(?i)\brobotic(s)?\b",
        r"(?i)\brobotique\b",
        r"(?i)\bintelligent\s+systems?\b",
        r"(?i)\bsystèmes?\s+intelligents?\b",
    ],
    "software_engineering": [
        r"(?i)\bsoftware\s+engineering\b",
        r"(?i)\bgénie\s+logiciel\b",
        r"(?i)\bdevops\b",
        r"(?i)\blogiciel\b",
    ],
    "systems": [
        r"(?i)\bembedded\s+systems?\b",
        r"(?i)\bsystèmes?\s+embarqués?\b",
        r"(?i)\bcomputer\s+systems?\b",
        r"(?i)\binfographie\b",
        r"(?i)\bexploitation\s+des\s+ordinateurs\b",
        r"(?i)\bconcurrent\b",
    ],
    "math": [
        r"(?i)\bnumerical\s+methods?\b",
        r"(?i)\bméthodes?\s+numériques?\b",
        r"(?i)\bstochastiques?\b",
        r"(?i)\bnombres?\s+entiers?\b",
    ],
    "programming": [
        r"(?i)\bcompiler\s+design\b",
        r"(?i)\bcompilateur\b",
    ],
}


def _keyword_category(title):
    if not title:
        return None
    matched = {}
    for cat, patterns in TITLE_KEYWORDS.items():
        for pat in patterns:
            if re.search(pat, title):
                matched[cat] = True
                break
    return list(matched.keys())[0] if len(matched) == 1 else None


def _iter_leaf_segments(segments_raw):
    for val in segments_raw.values():
        if not isinstance(val, dict):
            continue
        if "type" in val:
            yield val
        else:
            for subval in val.values():
                if isinstance(subval, dict) and "type" in subval:
                    yield subval


def _build_libre_sigles():
    included = set()
    for f in sorted(PROGRAMS_DIR.glob("*.json")):
        data = json.loads(f.read_text(encoding="utf-8"))
        for seg in _iter_leaf_segments(data.get("segments", {})):
            if seg.get("category"):
                included.update(seg.get("cours", []))
    return sorted(included)


def _assign_category(sigle, segments_for_sigle, tags, title):
    specific, catchall = [], []
    for seg in segments_for_sigle:
        cats = seg.get("category", [])
        if not cats:
            continue
        (specific if len(cats) < CATCHALL_THRESHOLD else catchall).append(seg)

    if specific:
        all_cats = []
        for seg in specific:
            all_cats.extend(c for c in seg["category"] if c in CANONICAL_CATS)
        unique = list(dict.fromkeys(all_cats))
        if not unique:
            return None
        if len(unique) == 1:
            return unique[0]
        tag_cats = [TAG_TO_CAT[t] for t in (tags or []) if t in TAG_TO_CAT]
        for tc in tag_cats:
            if tc in unique:
                return tc
        return unique[0]

    if catchall:
        tag_cats = [TAG_TO_CAT[t] for t in (tags or []) if t in TAG_TO_CAT]
        catchall_allowed = [c for c in catchall[0].get("category", []) if c in CANONICAL_CATS]
        for tc in tag_cats:
            if tc in catchall_allowed:
                return tc
        kw = _keyword_category(title)
        if kw and kw in catchall_allowed:
            return kw
        return catchall_allowed[0] if catchall_allowed else None

    return None


def main():
    libre_sigles = _build_libre_sigles()
    print(f"{len(libre_sigles)} CS-relevant sigles")

    course_to_segs = defaultdict(list)
    for f in PROGRAMS_DIR.glob("*.json"):
        data = json.loads(f.read_text(encoding="utf-8"))
        for seg in _iter_leaf_segments(data.get("segments", {})):
            for sigle in seg.get("cours", []):
                if sigle in set(libre_sigles):
                    course_to_segs[sigle].append(seg)

    # Query Neo4j for tags + titles (only needed for catchall resolution)
    sigle_info = {}
    try:
        from neo4j import GraphDatabase
        driver = GraphDatabase.driver(
            os.getenv("NEO4J_URI"),
            auth=(os.getenv("NEO4J_USER"), os.getenv("NEO4J_PASSWORD")),
        )
        with driver.session() as session:
            rows = session.run(
                "MATCH (c:Cours) WHERE c.sigle IN $sigles "
                "RETURN c.sigle AS s, c.tags AS t, c.titre AS ti",
                sigles=libre_sigles,
            )
            for row in rows:
                sigle_info[row["s"]] = {"tags": row["t"] or [], "titre": row["ti"] or ""}
        driver.close()
        print(f"Neo4j: {len(sigle_info)} courses found")
    except Exception as e:
        print(f"Neo4j unavailable ({e}) — tags/title fallback disabled")

    result = {}
    unresolved = []
    for sigle in libre_sigles:
        info = sigle_info.get(sigle, {})
        cat = _assign_category(
            sigle,
            course_to_segs[sigle],
            info.get("tags", []),
            info.get("titre", ""),
        )
        if cat:
            result[sigle] = cat
        else:
            unresolved.append(sigle)

    if unresolved:
        print(f"WARNING: {len(unresolved)} unresolved: {unresolved}")

    # Tally
    from collections import Counter
    counts = Counter(result.values())
    for cat in CANONICAL_CATS:
        if counts[cat]:
            print(f"  {cat}: {counts[cat]}")

    lines = [f'  "{s}": "{result[s]}"' for s in libre_sigles if s in result]
    js = (
        "// Auto-generated — do not edit manually.\n"
        "// Regenerate: python3 etl/generate_category_map.py\n\n"
        "export const SIGLE_CATEGORY = {\n"
        + ",\n".join(lines)
        + "\n};\n"
    )
    OUT_PATH.write_text(js, encoding="utf-8")
    print(f"\nWrote {OUT_PATH} ({len(result)} entries)")


if __name__ == "__main__":
    main()
