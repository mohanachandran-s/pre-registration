# pre-registration: Crewline context

[Crewline](https://github.com/mosip/mosip-labs/tree/develop/crewline) is a gated, evidence-first AI engineering workflow. Its
agents read this folder before they change this repository. The repository's own [`AGENTS.md`](../AGENTS.md) and
`CONTRIBUTING.md` win wherever they are more specific.

| Folder | Role | Files |
|---|---|---|
| `development/` | developer | `local-context.md` (build, unit/component tests, coverage, CI, DB scripts, approved paths), `discovery.json` (machine facts) |
| `qa/` | SDET | `module-context.md` (API TestRig suite, chains, commands), `known-issues.md`, `dependencies.md`, `profile.yaml` (validator rules) |

Other roles (`product/`, `ui-ux/`, `devops/`, `security/`) are added when the module has something to say.

## Using it

Cloning this repository and opening it in Claude Code offers the Crewline plugin (`.claude/settings.json`). Accept it,
then ask for the work as usual, for example *"fix MOSIP-12345"* or *"add an API to ..."*. The session starts with
"Crewline is ACTIVE for this repository" and the agents follow the workflow: plan and approved paths, tests designed from
the acceptance criteria, unit + component + API TestRig runs, a base-vs-branch regression, and your approval before every
commit, push, PR or bug.

| Want | Do |
|---|---|
| Off for you in this clone | `.claude/settings.local.json`: `{"enabledPlugins": {"crewline@mosip-labs": false}}` (not committed) |
| Off for one session | start Claude Code with `CREWLINE=off` |
| Work files | `.crewline-work/` in your clone (task records, worktrees); add it to `.git/info/exclude`, never commit it |

## Freshness

Verified at `b1691c23f4` (`develop`, 2026-10-29) with `crewline discover` plus a review of findings from earlier pilot runs.
Every fact names its source file; rows marked *Inferred* are still to be confirmed by a run. Refresh with the Crewline
`module-onboarding` task when the build, suite or test layout changes.
