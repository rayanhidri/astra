---
title: Analyse et conception
---

# Analyse et conception

## Architecture générale

Astra est une application full-stack organisée en trois couches :

```
Catalogues universitaires
        ↓
  Pipelines ETL (Python)
        ↓
  Base de données Neo4j
        ↓
  API REST (FastAPI)
        ↓
  Frontend (React/Vite)
```

## Modélisation Neo4j

### Types de nœuds

| Label | Propriétés principales |
|-------|------------------------|
| `Cours` | sigle, titre, universite, credits, niveau, hors_perimetre, description, requirement_text |
| `PrerequisiteGroup` | type (AND ou OR) |

### Types de relations

| Relation | Description |
|----------|-------------|
| `REQUIERT` | Un cours pointe vers un cours ou un groupe de prérequis |
| `INCLUDES` | Un PrerequisiteGroup pointe vers ses membres (cours ou sous-groupes) |

### Logique AND/OR

Les prérequis composites sont encodés via des nœuds intermédiaires `PrerequisiteGroup` :

- `(Cours)-[:REQUIERT]->(Cours)` — prérequis direct unique
- `(Cours)-[:REQUIERT]->(PrerequisiteGroup {type:"AND"})-[:INCLUDES]->(Cours)` — tous requis
- `(Cours)-[:REQUIERT]->(PrerequisiteGroup {type:"OR"})-[:INCLUDES]->(Cours)` — au moins un requis

Les groupes peuvent être imbriqués pour exprimer des structures comme `AND(OR(A, B), C)`.

## Extraction des données (ETL)

Chaque université nécessite une approche d'extraction distincte :

| Université | Source | Méthode |
|------------|--------|---------|
| UdeM | API Planifium | REST API (programme 117510) |
| McGill | coursecatalogue.mcgill.ca | BeautifulSoup + requests |
| Concordia | calendar.concordia.ca | BeautifulSoup (accordéons HTML) |
| UQAM | etudier.uqam.ca | requests (SSR) |
| Polytechnique | polymtl.ca | BeautifulSoup (2 programmes) |

### Layer 2 — Extraction par regex

En complément du scraping structurel, un second passage regex sur le champ `requirement_text` permet de capturer les prérequis exprimés en texte brut (ex. "previously completed COMP 490"). Un filtre de clauses d'exclusion évite les faux positifs ("students with credit for X may not take this course").

## Qualité des données

Vérification manuelle sur 37 cours (5–8 par université) :

| Université | Précision codes | Précision structure | Global |
|------------|----------------|---------------------|--------|
| UdeM | 100% | 100% | ~95% |
| UQAM | 100% | 100% | 100% |
| McGill | 100% | 100% | 100% |
| Concordia | 100% | 100% | ~95% |
| Polytechnique | 100% | 100% | ~90% |

**Limitation principale** : les corequis sont traités comme prérequis stricts (choix conservateur). Cela affecte ~30–40% des relations à Concordia et Polytechnique.
