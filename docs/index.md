---
title: Vue d'ensemble du projet
---

<style>
    @media screen and (min-width: 76em) {
        .md-sidebar--primary {
            display: none !important;
        }
    }
</style>

# Vue d'ensemble du projet

!!! info "Informations générales"
    **Session**: Été 2026  
    **Auteur(s)**: Rayan Hidri (20248814)  
    **Thème(s)**: Graphes de connaissances, découverte de cours, mobilité académique interuniversitaire  
    **Superviseur(s)**: Louis-Edouard Lafontant (DIRO, Université de Montréal)  
    **Collaborateur(s):** DIRO — Université de Montréal  

## Description du projet

### Contexte

Les universités montréalaises (UdeM, McGill, Concordia, UQAM, Polytechnique) offrent chacune leurs propres programmes d'informatique avec des structures de cours, des prérequis et des nomenclatures distinctes. Dans le cadre d'accords de mobilité interuniversitaire, les étudiants peuvent suivre des cours dans d'autres établissements, mais aucun outil n'existe pour les aider à naviguer efficacement dans cette offre combinée.

### Problématique

Un étudiant en informatique à l'UdeM n'a aucun moyen simple et unifié de déterminer quels cours offerts dans les autres universités montréalaises correspondent à son niveau, sont compatibles avec ses acquis académiques, et pour lesquels il serait potentiellement éligible. Les catalogues de cours sont dispersés, les formats hétérogènes, et les structures de prérequis rarement comparables d'un établissement à l'autre.

### Proposition et objectifs

Astra est une plateforme web interuniversitaire de découverte de cours qui permet à un étudiant de :

- Visualiser les cours disponibles dans les 5 universités montréalaises ciblées
- Saisir ses cours complétés et découvrir les cours accessibles dans les autres universités
- Explorer la chaîne de prérequis d'un cours sous forme de graphe interactif avec logique AND/OR
- Rechercher des cours par sigle, titre ou description à travers toutes les institutions

Les objectifs mesurables sont : agréger les données de 5 universités, modéliser plus de 500 cours avec leurs prérequis dans un graphe Neo4j, et exposer une API permettant le calcul d'éligibilité en temps réel.

### Méthodologie

Le projet est structuré en quatre phases itératives :

1. **Extraction des données (ETL)** : pipelines de scraping et normalisation pour chaque université
2. **Modélisation du graphe** : base Neo4j avec nœuds `Cours` et `PrerequisiteGroup`, relations `REQUIERT` et `INCLUDES` encodant la logique AND/OR
3. **Backend API** : FastAPI exposant des endpoints de recherche, filtrage et calcul d'éligibilité via Cypher
4. **Frontend React** : interface de découverte avec visualiseur de chaîne de prérequis (ReactFlow)

### Validation et Évaluation

La qualité des données a été validée par vérification manuelle sur un échantillon de 37 cours (5 à 8 par université) comparés aux catalogues officiels. Les taux de précision observés sont de 95–100% pour UdeM, McGill, Concordia et UQAM, et ~90% pour Polytechnique. La principale limitation connue est le traitement conservateur des corequis (traités comme prérequis stricts).

## Équipe

| Membre | Rôle |
|--------|------|
| Rayan Hidri | Développeur principal — ETL, backend, frontend, modélisation Neo4j |
| Louis-Edouard Lafontant | Superviseur — DIRO, Université de Montréal |

## Échéancier

!!! info
    Le suivi complet est disponible dans la page [Suivi de projet](suivi.md).

| Activités | Début | Fin | Livrable | Statut |
|-----------|-------|-----|----------|--------|
| Ouverture de projet | 4 mai | 15 mai | Proposition de projet | ✅ Terminé |
| Pipelines ETL (5 universités) | 15 mai | 30 mai | Données Neo4j peuplées | ✅ Terminé |
| Backend FastAPI | 1 juin | 15 juin | 7 endpoints opérationnels | ✅ Terminé |
| Frontend React + visualiseur | 15 juin | 10 juillet | Interface déployée | ✅ Terminé |
| Validation données & correction | 10 juillet | 20 juillet | Rapport qualité | ✅ Terminé |
| Présentation + Rapport final | 7 août | 14 août | Présentation + Rapport | ⏳ À venir |
