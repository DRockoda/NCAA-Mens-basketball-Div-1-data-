# Fix Git Remote URL (SSH to HTTPS)

You're getting a "Permission denied (publickey)" error because your remote is set to use SSH, but you don't have SSH keys configured.

## Quick Fix: Switch to HTTPS

Run these commands in your terminal (PowerShell, Command Prompt, or Git Bash):

### 1. Check current remote URL
```bash
git remote -v
```

### 2. Change remote URL from SSH to HTTPS

**If your remote is currently:**
```
git@github.com:YOUR_USERNAME/YOUR_REPO_NAME.git
```

**Change it to HTTPS:**
```bash
git remote set-url origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
```

Replace `YOUR_USERNAME` and `YOUR_REPO_NAME` with your actual GitHub username and repository name.

### 3. Verify the change
```bash
git remote -v
```

You should now see `https://github.com/...` instead of `git@github.com:...`

### 4. Try pushing again
```bash
git push -u origin main
```

### 5. Authentication

When prompted:
- **Username**: Your GitHub username
- **Password**: Use a **Personal Access Token** (not your GitHub password)

#### To create a Personal Access Token:
1. Go to: https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Name it: "Local Development"
4. Select scope: `repo` (full control of private repositories)
5. Click "Generate token"
6. **Copy the token immediately** (you won't see it again!)
7. Use this token as your password when pushing

## Alternative: Remove and Re-add Remote

If the above doesn't work:

```bash
# Remove current remote
git remote remove origin

# Add new HTTPS remote
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Verify
git remote -v

# Push
git push -u origin main
```

## Example

If your repository is at `https://github.com/johndoe/ncaa-basketball-explorer`, run:

```bash
git remote set-url origin https://github.com/johndoe/ncaa-basketball-explorer.git
```





