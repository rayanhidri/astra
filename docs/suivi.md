---
title: Suivi du projet
---

<style>
    @media screen and (min-width: 76em) {
        .md-sidebar--primary {
            display: none !important;
        }
    }
</style>

# Suivi de projet

---

## Semaine 1–2 (4–18 mai)

### Objectifs de la période
- Définir la problématique avec le superviseur
- Choisir la stack technologique
- Produire la proposition de projet

### Travail réalisé

!!! abstract "Avancement"
    - [x] Échange avec M. Lafontant — redirection vers la découverte interuniversitaire
    - [x] Rédaction du rapport de proposition (LaTeX, ~12 pages)
    - [x] Choix de Neo4j comme base de données centrale
    - [x] Exploration des catalogues de cours des 5 universités

!!! info "Décisions"
    - Scope limité aux programmes d'informatique pour la v1
    - Neo4j choisi pour modéliser naturellement les structures de prérequis
    - Stack retenue : Python/FastAPI + Neo4j + React/Vite

---

## Semaine 3–4 (19 mai – 1 juin)

### Objectifs de la période
- Mettre en place les pipelines ETL pour toutes les universités
- Peupler Neo4j avec les données réelles

### Travail réalisé

!!! abstract "Avancement"
    - [x] Pipeline ETL UdeM via API Planifium (157 cours IFT, programme 117510)
    - [x] Scraper McGill via le site coursecatalogue.mcgill.ca (BeautifulSoup)
    - [x] Scraper Concordia — gestion des accordéons HTML dynamiques
    - [x] Scraper UQAM — pages server-side rendered
    - [x] Scraper Polytechnique — deux programmes (Génie informatique + Génie logiciel)
    - [x] Format canonique unifié : sigle, universite, titre, credits, niveau, hors_perimetre, prerequisite_courses, requirement_text
    - [x] Chargement Neo4j : 525 nœuds Cours, 219 relations REQUIERT

!!! info "Décisions"
    - Les cours hors-périmètre (MAT, PHY, etc.) inclus avec `hors_perimetre: true` pour ne pas briser les chaînes de prérequis

!!! warning "Difficultés"
    - Site Polytechnique partiellement bloqué par Incapsula lors du scraping
    - Incompatibilité de version entre Neo4j local (2026.03.1) et Aura Free (5.x) — résolu en chargeant les données via ETL directement sur Aura

---

## Semaine 5–6 (2–15 juin)

### Objectifs de la période
- Implémenter la modélisation AND/OR des prérequis (demande du superviseur)
- Développer le backend FastAPI

### Travail réalisé

!!! abstract "Avancement"
    - [x] Modélisation AND/OR : nœuds `PrerequisiteGroup` avec relations `INCLUDES` — 175 groupes créés
    - [x] Layer 2 extraction : regex sur `requirement_text` pour capturer les prérequis en texte brut (+72 relations découvertes)
    - [x] Correction du bug de self-référence dans l'extraction Layer 2
    - [x] 7 endpoints FastAPI : GET /courses, GET /courses/{sigle}, GET /courses/{sigle}/prerequisites, GET /courses/{sigle}/prerequisite-chain, POST /courses/eligible, GET /universities, GET /search
    - [x] Vérification manuelle de la qualité des données : 37 cours validés, 90–100% de précision selon l'université

!!! info "Décisions"
    - Les corequis traités comme prérequis stricts (choix conservateur)
    - `other_conditions` (ex. "60 crédits complétés") identifiés mais non bloquants pour l'éligibilité

---

## Semaine 7–8 (16 juin – 10 juillet)

### Objectifs de la période
- Développer le frontend React
- Intégrer le visualiseur de chaîne de prérequis

### Travail réalisé

!!! abstract "Avancement"
    - [x] Interface React/Vite : recherche par sigle/titre/description, filtre par université
    - [x] Module profil étudiant avec localStorage persistence
    - [x] Affichage des cours accessibles groupés par université
    - [x] Visualiseur interactif de chaîne de prérequis (ReactFlow + Dagre layout)
    - [x] Nœuds ET/OU colorés, cours complétés en vert, plein écran disponible
    - [x] Couleurs distinctes par université sur les cartes de cours
    - [x] Déploiement instance Neo4j Aura (ID: 3c114060) — accès partagé avec le superviseur

!!! warning "Difficultés"
    - `ResponseValidationError` sur crédits null (cours Poly hors-périmètre) — résolu avec `Optional[int] = None`
    - Bug d'encodage UTF-8 sur titres Concordia ("Objectâ€") — résolu en forçant `resp.encoding = "utf-8"`
