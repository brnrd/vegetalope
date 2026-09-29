---
title: 'L’IA au-delà du code'
description: 'Faciliter l’adoption de l’IA en lui confiant davantage de tâches dont les développeurs se passeraient volontiers.'
pubDate: '2026-09-29'
---

Nous pourrions faciliter l’adoption de l’IA en lui confiant davantage de tâches dont les développeurs se passeraient volontiers.

Avec des outils comme Claude, nous accélérons une activité qui prenait souvent beaucoup de temps, mais que beaucoup de développeurs appréciaient particulièrement : écrire du code.

Tout le travail autour est toujours là. Mettre les tickets à jour, communiquer sur l’avancement, vérifier les changements, préparer les mises en production et s’assurer que tout fonctionne une fois entre les mains des utilisateurs.

Si écrire du code prend moins de temps et que tout le reste ne change pas, ces tâches occupent une plus grande part de la journée. Nous risquons de retirer de l’effort au travail, mais aussi une partie du plaisir qu’il procure.

Cela me semble important quand nous parlons d’adoption de l’IA. Certains développeurs sont enthousiastes, d’autres plus prudents. Cette différence tient peut-être en partie à la façon dont l’IA change leur expérience du métier.

Cela a aussi un effet sur la circulation du travail dans l’équipe :
Écrire du code → relire → tester → mettre en production → exploiter → surveiller.

Accélérer le début du processus peut simplement allonger la file d’attente plus loin. La coordination manuelle entre ces étapes peut être répétitive et peu gratifiante.

À voir les pratiques SRE de Google et les outils d’AWS et de Datadog, une grande partie de cette automatisation existe déjà. Les petites équipes ou les organisations plus traditionnelles peuvent partir d’une situation différente. Même avec de l’automatisation, il peut rester du travail manuel : rassembler le contexte, enquêter sur des résultats inattendus et tenir les personnes concernées informées.

C’est pourquoi j’aimerais explorer une approche qui part des deux extrémités. Continuer à aider les développeurs à utiliser l’IA pour écrire du code, tout en s’appuyant sur l’automatisation existante pour s’attaquer au reste du travail, en partant de la production et en remontant le processus.

Pour la surveillance, un développeur pourrait demander à un agent, dans le canal Slack de l’équipe, d’enquêter sur une alerte, de rassembler les informations pertinentes et, lorsqu’il peut le faire de manière fiable, d’appliquer un correctif.

Pour les mises en production, des agents pourraient utiliser les outils existants pour préparer et exécuter les déploiements, en vérifier les résultats et annuler les changements si nécessaire. Nous pourrions ensuite chercher des possibilités semblables pour les tests et la revue de code. Au passage, les agents pourraient maintenir les tickets et les points d’avancement à jour.

Moins d’interruptions, des enquêtes plus rapides et moins de temps passé à coordonner les mises en production seraient des signes que cette approche fonctionne. Le retour sur investissement pourrait se voir à l’échelle de l’équipe plutôt que dans la production d’un seul développeur.

Je réserverais une partie du temps gagné à l’apprentissage. Si chaque heure économisée devient un nouvel engagement, il reste peu de place pour expérimenter.

Avez-vous essayé d’aborder l’adoption de l’IA par les deux extrémités ? Le fait de supprimer des tâches fastidieuses a-t-il donné davantage envie aux développeurs d’explorer ce que l’IA peut apporter ?

Article issu de mon [post LinkedIn](https://www.linkedin.com/feed/update/urn:li:share:7510446462036582402/).
