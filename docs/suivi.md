---
title: Suivi du projet
---

# Suivi de projet

---

## Semaine 1–2 (4–18 mai)

### Objectifs de la période
- Définir la problématique avec le superviseur
- Choisir la stack technologique
- Produire la proposition de projet

### Travail réalisé

- Échange avec M. Lafontant — redirection vers la découverte interuniversitaire
- Rédaction du rapport de proposition (LaTeX, ~12 pages)
- Choix de Neo4j comme base de données centrale
- Exploration des catalogues de cours des 5 universités

**Décisions :** Scope limité aux programmes d'informatique pour la v1. Neo4j choisi pour modéliser naturellement les structures de prérequis. Stack retenue : Python/FastAPI + Neo4j + React/Vite.

---

## Semaine 3–4 (19 mai – 1 juin)

### Objectifs de la période
- Mettre en place les pipelines ETL pour toutes les universités
- Peupler Neo4j avec les données réelles

### Travail réalisé

- Pipeline ETL UdeM via API Planifium (programme 117510)
- Scraper McGill via coursecatalogue.mcgill.ca (BeautifulSoup)
- Scraper Concordia — gestion des accordéons HTML dynamiques
- Scraper UQAM — pages server-side rendered
- Scraper Polytechnique — deux programmes (Génie informatique + Génie logiciel)
- Format canonique unifié : sigle, universite, titre, credits, niveau, hors_perimetre, prerequisite_courses, requirement_text
- Chargement Neo4j : 525 nœuds Cours, 219 relations REQUIERT

**Décisions :** Les cours hors-périmètre (MAT, PHY, etc.) inclus avec `hors_perimetre: true` pour ne pas briser les chaînes de prérequis.

**Difficultés :** Site Polytechnique partiellement bloqué par Incapsula lors du scraping. Incompatibilité de version entre Neo4j local (2026.03.1) et Aura Free (5.x) — résolu en chargeant les données via ETL directement sur Aura.

---

## Semaine 5–6 (2–15 juin)

### Objectifs de la période
- Implémenter la modélisation AND/OR des prérequis (demande du superviseur)
- Développer le backend FastAPI

### Travail réalisé

- Modélisation AND/OR : nœuds PrerequisiteGroup avec relations INCLUDES — 175 groupes créés
- Layer 2 extraction : regex sur requirement_text pour capturer les prérequis en texte brut (+72 relations découvertes)
- Correction du bug de self-référence dans l'extraction Layer 2
- 7 endpoints FastAPI : GET /courses, GET /courses/{sigle}, GET /courses/{sigle}/prerequisites, GET /courses/{sigle}/prerequisite-chain, POST /courses/eligible, GET /universities, GET /search
- Vérification manuelle de la qualité des données : 37 cours validés, 90–100% de précision selon l'université

**Décisions :** Les corequis traités comme prérequis stricts (choix conservateur).

---

## Semaine 7–8 (16 juin – 10 juillet)

### Objectifs de la période
- Développer le frontend React
- Intégrer le visualiseur de chaîne de prérequis

### Travail réalisé

- Interface React/Vite : recherche par sigle/titre/description, filtre par université
- Module profil étudiant avec localStorage persistence
- Affichage des cours accessibles groupés par université
- Visualiseur interactif de chaîne de prérequis (ReactFlow + Dagre layout)
- Nœuds ET/OU colorés, cours complétés en vert, plein écran disponible
- Couleurs distinctes par université sur les cartes de cours
- Déploiement instance Neo4j Aura (ID: 3c114060) — accès partagé avec le superviseur

**Difficultés :** ResponseValidationError sur crédits null — résolu avec Optional[int] = None. Bug d'encodage UTF-8 sur titres Concordia — résolu en forçant resp.encoding = "utf-8".
