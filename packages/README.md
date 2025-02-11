# Monorepo Package Structure and Publishing Guide

## 📂 What is this `packages` Folder?

This repository follows a **monorepo structure**, where multiple packages are managed within a single repository using **PNPM workspaces** and **Turborepo**.

Inside the `packages` folder, you will find different sub-packages, each serving a specific purpose:

- **core/** - The main package containing core functionalities.
- **tailwind/** - A package handling TailwindCSS-related configurations.
- **Other future packages** - You can add additional packages as needed.

## 🚀 How to Publish a Package

### 1️⃣ Before Committing, Update the Changeset
To track changes in your package versions, run:

```sh
npx changeset add
```

You'll be prompted to **select the package** you want to update and provide a **description** of the changes.

### 2️⃣ Update Package Versions
After adding the changeset, run:

```sh
pnpm run version
```

This updates the version numbers and generates the required changelog.

### 3️⃣ Commit and Push to GitHub
Once the changes are applied, commit them to your repository and push:

```sh
git add .
git commit -m "chore: version bump and changeset update"
git push origin main
```
