---
name: kalameh-worktree
description: Use this skill when creating, initializing, switching to, or tearing down git worktrees in the Kalameh monorepo for parallel chat and task isolation.
---

# Kalameh Git Worktree Runbook

## Overview

All parallel AI pair-programming and development tasks in the Kalameh monorepo must execute inside isolated Git worktrees located in `.worktrees/<branch-name>`. This guarantees zero conflicts, clean git status, and isolated dependencies across concurrent chats.

---

## 1. Pre-Task Gate (Mandatory on Every New Task)

Before creating, editing, or executing any command for a coding task, the AI **must prompt the user**:

> _"Please specify the target branch / worktree name for this task so we can isolate our work in `.worktrees/<branch-name>`."_

Do **NOT** proceed with codebase modifications until the user provides the branch/worktree name or confirms using an existing worktree.

---

## 2. Worktree Initialization Protocol

Once the branch name `<branch-name>` is provided:

### Step 1: Check Existing Worktrees

```bash
git worktree list
```

If `.worktrees/<branch-name>` already exists, skip creation and switch directly to it.

### Step 2: Create the Worktree

- If creating a **new branch** from current base:
  ```bash
  git worktree add -b <branch-name> .worktrees/<branch-name> HEAD
  ```
- If checking out an **existing branch**:
  ```bash
  git worktree add .worktrees/<branch-name> <branch-name>
  ```

### Step 3: Copy Root Environment File

Worktrees do not automatically inherit untracked/ignored `.env` files. Copy the root `.env`:

```powershell
# Windows PowerShell
Copy-Item -Path "d:\projects\kalameh\.env" -Destination "d:\projects\kalameh\.worktrees\<branch-name>\.env"
```

### Step 4: Link Dependencies (`pnpm install`)

Run `pnpm install` inside the worktree directory:

```bash
cd .worktrees/<branch-name>
pnpm install
```

_(Because pnpm uses a shared content-addressable store on disk, `pnpm install` creates hard links in seconds and uses virtually 0 extra disk space)._

---

## 3. Strict Execution Isolation

All subsequent actions for the task must strictly target the worktree:

- **File reads & edits:** `d:/projects/kalameh/.worktrees/<branch-name>/...`
- **Terminal commands:** Set `Cwd` to `d:/projects/kalameh/.worktrees/<branch-name>`
- **Database migrations / Prisma:** Run inside `.worktrees/<branch-name>`
- **Never** modify files in the root workspace `d:/projects/kalameh` while working on an isolated task.

---

## 4. Teardown / Cleanup Protocol

When a task/chat is completed, reviewed, and merged into the base branch, clean up the worktree:

```bash
# Remove the worktree folder and git reference
git worktree remove .worktrees/<branch-name> --force

# Delete the local branch if no longer needed
git branch -d <branch-name>
```
