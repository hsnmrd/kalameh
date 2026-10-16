# 🚨 MANDATORY PRE-TASK GATE: Parallel Worktree Isolation

**CRITICAL INSTRUCTION FOR ALL CODING TASKS:**

Before reading code to make modifications, editing files, running build tools, or executing any task terminal commands:

1. **PROMPT THE USER FIRST:**
   The AI assistant MUST stop and ask the user for the target branch / worktree name:

   > _"Please specify the target branch / worktree name for this task so we can isolate our work in `.worktrees/<branch-name>`."_

2. **INITIALIZATION PROTOCOL:**
   Once the branch name is given:
   - Check existing worktrees: `git worktree list`.
   - Create or attach: `git worktree add -b <branch-name> .worktrees/<branch-name> <base-branch>` (or `git worktree add .worktrees/<branch-name> <branch-name>`).
   - Copy root `.env` to `.worktrees/<branch-name>/.env`.
   - Run `pnpm install` in `.worktrees/<branch-name>`.

3. **STRICT WORKING DIRECTORY ISOLATION:**
   - ALL subsequent file edits, terminal commands, database migrations, and tests for the task MUST target `d:/projects/kalameh/.worktrees/<branch-name>`.
   - NEVER make task edits directly in the root workspace `d:/projects/kalameh`.

4. **EXEMPTION:**
   - Pure informational / advisory questions without code modifications (e.g. "Explain how X works") do not require a worktree.
