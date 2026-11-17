# Pure Health

Application gratuite pour **réduire ou arrêter le tabac, l'alcool et la vape à son rythme**, et voir chaque semaine ce qu'on y gagne : euros économisés, temps de vie épargné, jours sans consommer.

- Pas de compte, pas de serveur : **toutes les données restent sur le téléphone**.
- Fonctionne hors connexion et s'installe sur l'écran d'accueil comme une vraie app.
- Les chiffres sont des estimations moyennes issues d'études scientifiques. Ils ne remplacent pas l'avis d'un professionnel de santé.

## Installer l'app sur son téléphone

Ouvrir le lien de l'app :

- **iPhone (Safari)** : bouton Partager → « Sur l'écran d'accueil ».
- **Android (Chrome)** : menu ⋮ → « Installer l'application » (ou « Ajouter à l'écran d'accueil »).

## Mettre l'app en ligne (GitHub Pages)

Une seule fois : **Settings → Pages → Build and deployment → Source : Deploy from a branch → Branch : `main` / dossier `/docs` → Save**.
L'adresse s'affiche quelques minutes plus tard (de la forme `https://<utilisateur>.github.io/purehealth/`).

## Modifier l'app

```bash
npm install
npm run icons   # régénère les icônes (seulement si le logo change)
npm run build   # reconstruit le dossier docs/
```

Puis commiter le dossier `docs/` : GitHub Pages publie automatiquement la nouvelle version, et les téléphones la reçoivent à l'ouverture suivante.

### Organisation

| Fichier | Rôle |
| --- | --- |
| `src/app.template.html` | Les écrans (gabarit avec `{{ valeurs }}`, `<sc-if>`, `<sc-for>`) |
| `src/logic.js` | Toute la logique : profil, paliers, calendrier, calculs des gains |
| `src/runtime.js` | Moteur d'affichage (Preact) et sauvegarde locale |
| `src/static/` | Page d'accueil, manifeste, service worker, icônes |
| `tools/build.mjs` | Construit `docs/` |
| `tools/icons.mjs` | Génère les icônes à partir du logo « Trio barré » |
| `docs/` | Version publiée (générée, ne pas modifier à la main) |
