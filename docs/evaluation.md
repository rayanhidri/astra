---
title: Évaluation
---

# Évaluation

## Objectifs atteints

| Objectif | Statut |
|----------|--------|
| Agréger les données de 5 universités montréalaises | ✅ Atteint |
| Modéliser les prérequis avec logique AND/OR dans Neo4j | ✅ Atteint |
| Exposer une API d'éligibilité basée sur le graphe | ✅ Atteint |
| Interface de découverte de cours avec visualiseur de prérequis | ✅ Atteint |
| Valider la qualité des données (>90% de précision) | ✅ Atteint |

## Qualité des données

La vérification manuelle sur 37 cours confirme une précision de 90 à 100% selon l'université. La principale limitation identifiée est le traitement des corequis comme prérequis stricts — un choix conservateur qui sur-restreint légèrement l'éligibilité sans jamais afficher un cours comme accessible à tort.

## Limitations connues

- **Corequis** : traités comme prérequis stricts. Un type de relation `REQUIERT_CONCOMITANT` permettrait une modélisation plus précise.
- **Conditions non-cours** : les conditions comme "60 crédits complétés" ou "permission du département" ne sont pas vérifiables automatiquement. Identifiées dans `other_conditions` mais non affichées dans l'interface.
- **Couverture Polytechnique** : certains cours hors-périmètre ont des crédits manquants (non exposés sur les pages individuelles du site).
- **Fraîcheur des données** : les catalogues sont mis à jour annuellement ; aucun mécanisme de re-scraping automatique n'est en place pour la v1.

## Perspectives

- Modélisation des équivalences inter-universités (nœud `Equivalence`)
- Ajout de HEC Montréal (cours Technologies de l'information)
- Déploiement public (Vercel + Railway)
- Indicateur de complétion de programme ("12/45 crédits complétés pour le programme X")
- Type de relation `REQUIERT_CONCOMITANT` pour les corequis
