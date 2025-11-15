# GitHub Setup Instructions

Follow these steps to push your project to GitHub:

## Prerequisites

1. **Install Git** (if not already installed):
   - Download from: https://git-scm.com/download/win
   - Or use: `winget install Git.Git` in PowerShell (if winget is available)

2. **Create a GitHub account** (if you don't have one):
   - Go to: https://github.com
   - Sign up for a free account

## Steps to Push to GitHub

### 1. Initialize Git Repository

Open PowerShell or Command Prompt in your project directory and run:

```bash
git init
```

### 2. Add All Files

```bash
git add .
```

### 3. Create Initial Commit

```bash
git commit -m "Initial commit: NCAA Men's Basketball Data Explorer"
```

### 4. Create Repository on GitHub

1. Go to https://github.com/new
2. Repository name: `ncaa-basketball-data-explorer` (or any name you prefer)
3. Description: "React + TypeScript app for exploring NCAA Men's Basketball data"
4. Choose **Public** or **Private**
5. **DO NOT** initialize with README, .gitignore, or license (we already have these)
6. Click **Create repository**

### 5. Connect Local Repository to GitHub

After creating the repository, GitHub will show you commands. Use these:

```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

Replace `YOUR_USERNAME` and `YOUR_REPO_NAME` with your actual GitHub username and repository name.

### 6. Authentication

If prompted for authentication:
- **Personal Access Token**: GitHub no longer accepts passwords. You'll need to create a Personal Access Token:
  1. Go to: https://github.com/settings/tokens
  2. Click "Generate new token (classic)"
  3. Give it a name like "Local Development"
  4. Select scopes: `repo` (full control of private repositories)
  5. Click "Generate token"
  6. Copy the token and use it as your password when pushing

## Alternative: Using GitHub CLI

If you have GitHub CLI installed:

```bash
gh repo create ncaa-basketball-data-explorer --public --source=. --remote=origin --push
```

## Notes

- The Excel file (`NCAA Mens basketball Data (2).xlsx`) is excluded from git (see `.gitignore`)
- Users will need to add their own Excel file to `public/data/` directory
- The README.md file includes setup instructions for other users

