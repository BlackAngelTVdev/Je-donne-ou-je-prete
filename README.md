# 🚀 Je donne, Je prête

![Stars](https://img.shields.io/github/stars/BlackAngelTVdev/Je-donne-ou-je-prete?style=for-the-badge&color=yellow)
![Commits](https://img.shields.io/github/commit-activity/m/BlackAngelTVdev/Je-donne-ou-je-prete?style=for-the-badge&color=blue)
![Issues](https://img.shields.io/github/issues/BlackAngelTVdev/Je-donne-ou-je-prete?style=for-the-badge&color=orange)
![Forks](https://img.shields.io/github/forks/BlackAngelTVdev/Je-donne-ou-je-prete?style=for-the-badge&color=808080)
![Last Commit](https://img.shields.io/github/last-commit/BlackAngelTVdev/Je-donne-ou-je-prete?style=for-the-badge&color=blue)

**Plateforme collaborative pour donner, prêter et répondre à des recherches d’objets.**

---

## 🧐 Aperçu

![LoginJeDonneJePrête](https://i.postimg.cc/ZqBdYqzL/Capture-d-ecran-2026-02-24-104740.png)

## ✨ Fonctionnalités

- ✅ **Mode Don / Prêt** : publication d’objets à donner ou prêter avec filtres type + catégorie.
- ✅ **Mode Recherche** : publication de besoins (objets recherchés) avec ses propres cartes et détails.
- ✅ **Switch rapide Don ↔ Cherche** : bouton en header pour basculer entre les deux flux.
- ✅ **Gestion des images** : upload (5 Mo maximum), compression automatique dans le navigateur puis WebP côté serveur, preview et affichage sur les objets `donation` et `cherche`. La limite et les erreurs de taille/format sont affichées directement sous la zone d’upload.
- ✅ **Réservations / offres** : workflow de contact avec modal + envoi d’email.
- ✅ **Rôles utilisateur en DB** : `extainre` et `isadmin` disponibles dans `users`.
- ✅ **Règle visibilité externe** : en mode don, un utilisateur `extainre=true` voit uniquement les objets publiés depuis plus de 3 mois.
- ✅ **Multilingue FR / EN** : traductions des vues principales (header, home, details, new, etc.).
- ✅ **Footer enrichi** : badge GitHub + version projet en fonction du nom de la release (`vBx.x.x` ou `vOx.x.x`).
- ✅ **Tests automatisés** : exécution automatique de la suite de tests pour valider la stabilité de l'application à chaque push.
- ✅ **Releases automatisées** : build, package (zip) et déploiement automatique d'une nouvelle release GitHub dès qu'un changement de version est détecté dans le `package.json`.

## 🛠 Tech Stack

| Technologie                                                                                                       | Usage                         |
| :---------------------------------------------------------------------------------------------------------------- | :---------------------------- |
| ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white) | Backend & logique applicative |
| ![AdonisJS](https://img.shields.io/badge/AdonisJS-220052?style=for-the-badge&logo=adonisjs&logoColor=white)       | Framework Node.js             |
| ![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)                | Base de données               |
| ![SQLite](https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white)             | Base locale de développement  |
| ![Edge](https://img.shields.io/badge/Edge-5A45FF?style=for-the-badge&logo=edge&logoColor=white)                   | Templates serveur             |
| ![Sharp](https://img.shields.io/badge/Sharp-99CC00?style=for-the-badge)                                           | Compression d’images          |

## 🚀 Installation & Lancement

1. **Cloner le projet**

```bash
git clone https://github.com/BlackAngelTVdev/Je-donne-ou-je-prete.git
cd Je-donne-ou-je-prete
```

2. **Installer et configurer**

```bash
npm install
cp .env.example .env
node ace generate:key
```

Par défaut, `DB_TYPE=mysql`. Pour utiliser SQLite en local, mets `DB_TYPE=sqlite` dans `.env`.

3. **Créer la base et seed**

```bash
node ace migration:fresh --seed
```

4. **Lancer en dev**

```bash
npm run dev
```

## 📖 Comptes par défaut

| Compte    | Username | Mot de passe | Flags                             |
| :-------- | :------- | :----------- | :-------------------------------- |
| **Admin** | `Admin`  | `Admin`      | `isadmin=true`, `extainre=false`  |
| **Test**  | `Test`   | `1234`       | `isadmin=false`, `extainre=false` |
| **Guest** | `Guest`  | `Guest`      | `isadmin=false`, `extainre=true`  |

Tu peux modifier ces comptes dans `database/seeders/1-UserSeeder.ts`.

Pour ajouter une personne en temps que référent (une seule personne possible), il faut modifier dans la base directement avec la commande suivante sur sqlite: 
```sql
INSERT INTO sustainability_roles (user_id, role_key, created_at, updated_at)
VALUES (1, 'referent_durabilite', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (role_key)
DO UPDATE SET
    user_id = EXCLUDED.user_id,
    updated_at = CURRENT_TIMESTAMP;
```


## 🧱 Structure DB (important)

Les colonnes récentes ont été **fusionnées dans les migrations de création** pour garder un historique lisible :

- `users` contient directement `extainre` et `isadmin`
- `cherche_objects` contient directement `image_path`

Si tu repars d’un environnement local existant, fais un reset propre :

```bash
node ace migration:fresh --seed
```

## 🤝 Contribution

1. Fork du projet.
2. Créer une branche à partir de la dernière branche `Release` disponible.
3. Faire ses modifications, puis commit (`git commit -m "feat: ..."`).
4. Push sur sa branche (`git push origin feature/ma-feature`).
5. Ouvrir une Pull Request vers la branche `Release` la plus récente.

Les Pull Requests vers `main` sont refusées automatiquement. Merci de toujours partir de la dernière branche `Release` avant de proposer une contribution.

## 🧑‍💻 Contributors

Merci à toutes les personnes qui contribuent au projet.

[![Contributors](https://contrib.rocks/image?repo=BlackAngelTVdev/Je-donne-ou-je-prete)](https://github.com/BlackAngelTVdev/Je-donne-ou-je-prete/graphs/contributors)

## 👤 Auteurs

- **BlackAngelTVdev**
  ![Follow](https://img.shields.io/github/followers/BlackAngelTVdev?label=Follow%20Me&style=social)
- **alberrboyyy**
  ![Follow](https://img.shields.io/github/followers/alberrboyyy?label=Follow%20Me&style=social)
- **Gianmarco-Ruberti**
  ![Follow](https://img.shields.io/github/followers/Gianmarco-Ruberti?label=Follow%20Me&style=social)

## 📄 Licence

Ce projet est sous licence GitHub :

![GitHub License](https://img.shields.io/github/license/BlackAngelTVdev/Je-donne-ou-je-prete?style=flat-square&color=blue)
