# Site PricetoFly

Site vitrine multi-pages de PricetoFly (IAckaton Managinov 2026, Arts et Métiers Angers).
Astro (site statique) + View Transitions natives, CSS maison, aucun backend.

## Lancer en local

Prérequis : Node.js 20 ou plus récent.

```bash
npm install
```

```bash
npm run dev
```

Le site s'ouvre sur http://localhost:4321.

## Déployer

Le site est 100 % statique : `npm run build` génère le dossier `dist/`.

**Netlify (le plus simple)**
- Avec Git : pousser le dépôt sur GitHub, puis sur app.netlify.com choisir « Add new site › Import an existing project ». Les réglages sont déjà dans `netlify.toml` (commande `npm run build`, dossier `dist`).
- Sans Git : lancer `npm run build`, puis glisser-déposer le dossier `dist/` sur https://app.netlify.com/drop.

**Vercel** : importer le dépôt sur vercel.com, Astro est détecté automatiquement.

## Changer le QR code de l'appli

1. Remplacer `public/qr-appli.svg` par le vrai QR code (même nom de fichier), ou déposer un PNG dans `public/`.
2. Dans `src/pages/appli.astro`, en haut du fichier :
   - `QR_IMAGE` : chemin de l'image (par exemple `/qr-appli.png`) ;
   - `QR_PRET` : passer à `true` (retire l'étiquette « À venir ») ;
   - `QR_LIEN` : adresse de l'appli (le QR code devient cliquable).

## Où modifier quoi

| Élément | Fichier |
|---|---|
| Couleurs, typographie, styles | `src/styles/global.css` |
| Navigation, pied de page, avion de transition | `src/layouts/Base.astro` |
| Textes de chaque page | `src/pages/*.astro` |
| Tableau des départs, aperçu de l'appli, calculateur, graphique | `src/scripts/site.js` |
| Logo et favicon | `public/logo-pricetofly-recadre.svg`, `public/favicon.svg` |

Tous les chiffres viennent de `pricetofly-v1.html` et ne doivent pas être modifiés.
Les montants par destination sont des exemples illustratifs.

## Outils IA utilisés pour le site

- **Claude (Anthropic)** : rédaction du brief, contenus et première version en une page (`pricetofly-v1.html`).
- **Claude Code (Anthropic)** : création du projet Astro, intégration de la charte graphique, animations (orbite, tableau des départs, transitions entre pages), vérification du rendu.
