---
title: Réalisation
---

# Réalisation

## Technologies utilisées

| Composant | Technologie |
|-----------|-------------|
| Base de données | Neo4j (local + Aura Free) |
| Backend | FastAPI (Python) |
| Frontend | React + Vite |
| Visualisation graphe | ReactFlow + Dagre |
| ETL | Python, BeautifulSoup, requests |
| Déploiement DB | Neo4j Aura (ID: 3c114060) |

## Statistiques du graphe

- **525** nœuds `Cours` (5 universités)
- **175** nœuds `PrerequisiteGroup` (logique AND/OR)
- **219** relations `REQUIERT`
- **386** relations `INCLUDES`
- **700** nœuds total, **605** relations total

## API REST

| Endpoint | Description |
|----------|-------------|
| `GET /courses` | Liste paginée avec filtres (universite, niveau, hors_perimetre) |
| `GET /courses/{sigle}` | Détail d'un cours |
| `GET /courses/{sigle}/prerequisites` | Arbre de prérequis (AND/OR récursif) |
| `GET /courses/{sigle}/prerequisite-chain` | Chaîne complète multi-niveaux |
| `POST /courses/eligible` | Cours accessibles selon les cours complétés |
| `GET /universities` | Liste des universités avec statistiques |
| `GET /search` | Recherche full-text (sigle, titre, description) |

## Fonctionnalités frontend

- **Recherche** : par sigle, titre ou description, filtrée par université
- **Profil étudiant** : ajout de cours complétés, persistance localStorage
- **Cours accessibles** : appel `POST /courses/eligible`, résultats groupés par université
- **Visualiseur de prérequis** : graphe interactif ReactFlow avec nœuds ET/OU colorés, cours complétés en vert, zoom/pan, plein écran
- **Couleurs par université** : chaque institution a sa couleur distinctive sur les cartes

## Dépôt

Le code source est disponible sur [github.com/ceduni/astra](https://github.com/ceduni/astra).
