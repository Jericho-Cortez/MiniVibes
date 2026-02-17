# 🎮 MiniVibes - Voxel Sandbox 3D

Un jeu sandbox voxel 3D en JavaScript utilisant Three.js, inspiré de Minecraft.

## 🚀 Lancer le jeu

Le jeu nécessite un serveur HTTP local (à cause des modules ES6). Plusieurs options :

### Option 1 : VS Code Live Server
1. Installez l'extension "Live Server" dans VS Code
2. Clic droit sur `index.html` → "Open with Live Server"

### Option 2 : Python
```bash
# Python 3
python -m http.server 8000

# Puis ouvrez http://localhost:8000
```

### Option 3 : Node.js
```bash
npx serve
```

## 🎮 Contrôles

| Touche | Action |
|--------|--------|
| **WASD** | Se déplacer |
| **Espace** | Sauter |
| **Souris** | Regarder autour |
| **Clic gauche** | Détruire un bloc |
| **Clic droit** | Placer un bloc |
| **1-9** | Sélectionner un bloc |
| **Molette** | Changer de bloc |
| **Échap** | Libérer la souris |

## ✨ Fonctionnalités

### Monde Voxel
- Génération procédurale avec bruit de Perlin
- Système de chunks (16x16x128)
- Chargement/déchargement dynamique selon la position du joueur
- Couches de terrain : bedrock, stone, dirt, grass
- Génération d'arbres

### Rendu optimisé
- BufferGeometry pour les performances
- Regroupement des blocs par chunk
- Élimination des faces cachées
- Atlas de textures généré procéduralement

### Joueur FPS
- Vue première personne avec Pointer Lock API
- Physique avec gravité
- Collision AABB avec les blocs
- Mouvement fluide WASD + saut

### Interactions
- Raycasting pour la sélection de blocs
- Destruction et placement de blocs
- Prévention du placement dans le joueur

### Inventaire
- Barre rapide avec 9 types de blocs
- Sélection par touches numériques ou molette

### Environnement
- Cycle jour/nuit (10 minutes par défaut)
- Éclairage dynamique (soleil + ambiant)
- Couleurs de ciel changeantes

## 📁 Structure du projet

```
MiniVibes/
├── index.html
├── css/
│   └── style.css
└── js/
    ├── main.js
    ├── utils/
    │   ├── Constants.js
    │   ├── PerlinNoise.js
    │   └── TextureAtlas.js
    ├── world/
    │   ├── World.js
    │   ├── Chunk.js
    │   └── TerrainGenerator.js
    ├── player/
    │   ├── Player.js
    │   ├── Controls.js
    │   └── Physics.js
    └── systems/
        ├── BlockInteraction.js
        ├── Inventory.js
        └── Environment.js
```

## 🛠️ Technologies

- **Three.js** v0.160.0 (via CDN)
- **WebGL** pour le rendu 3D
- **ES6 Modules** pour l'organisation du code
- **Pointer Lock API** pour les contrôles FPS
- **Canvas API** pour la génération de textures

## 📝 Licence

MIT
