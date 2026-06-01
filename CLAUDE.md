# Claude Code

@AGENTS.md

## Repo Conventions

- Keep shared repository guidance in `AGENTS.md`. Use this file only as the Claude-specific adapter layer.
- Treat `.agents/skills/` as the canonical shared workflow directory for this repository.
- Do not duplicate workflows into `.claude/skills/` unless a workflow clearly needs Claude-native auto-discovery.
- Treat `docs/superpowers/plans/` as human-facing execution plans and tracking documents, not as duplicate skill definitions.
