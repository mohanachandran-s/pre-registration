# apitest-prereg — Coverage Matrix

A living, in-repo test-coverage matrix for `pre-registration/api-test`. One markdown file per
subject (one YAML test-folder = one `<test>` entry in `testNgXmlFiles/preregSuite.xml`), recording
coverage **intent** — what scenarios must exist for that subject — reconciled against the real
Suite.xml/YAML by tooling in `apitest-commons` (`io.mosip.testrig.apirig.coverage`) so it can't
silently drift out of date.

Full design record: `docs/coverage-matrix/design-record.md` in `mosip-functional-tests`. This file is
the day-to-day quick reference; that one is the decision log.

## Start here — how test cases are managed

**This directory is the single source of truth for this module's test cases** — automated, manual
and planned alike. There is no spreadsheet alongside it: a test case that isn't a row here doesn't
exist. (If this module had a legacy test-case sheet, every one of its IDs is listed in
`legacy-ids.txt` and can be found here by searching for `Legacy: <id>`.)

**Reading it.** One file per API test subject (`<folder>/<Subject>.md`), plus `planned/` files for
real endpoints that have no automated test yet. Each file lists its scenarios as rows with a status:
`✅ automated` (a real YAML test backs it), `🟡 not_automated` (known scenario, not automated yet) or
`⛔ not_automatable` (with the reason). `Summary.md` is the dashboard: coverage is
`automated ÷ (automated + not_automated)`, overall, per subject and per category.

**Adding tests for a new feature — the workflow**

1. **Write the scenarios first**, from the story, as rows — before or alongside any automation.
   Put each one in the file of the endpoint it calls (`🟡 not_automated`), add the story key to that
   file's `stories:` list, and give every row a real Given/When/Then and a concrete expected result.
   A brand-new endpoint gets its file from `scaffold` (as a `planned/` file until YAML exists).
2. **Automate** — add the YAML case (unique `uniqueIdentifier`, correct `restMethod`), templates and
   Suite.xml entry as usual.
3. **Link** — flip the row to `✅ automated` and put `<ymlPath>::<uniqueIdentifier>` in its `Test`
   column.
4. **Run `sync`, then `check`**, and commit the matrix files in the same change as the YAML.
   `AGENTS.md` has the full per-change checklist.

**What `check` enforces** (and CI fails the PR on): every YAML test case has a row; every real
controller endpoint has either a test or a planned file; `uniqueIdentifier`s are unique; every row is
filled in and every category is present; files are in sync with the YAML; every legacy test-case ID
is still present. Deliberate exceptions live in `check-baseline.txt`, each with a written reason.

**What no tool can catch — people own this:**

- **A scenario nobody wrote.** A new rule on an *existing* endpoint, with no new YAML and no new
  endpoint, changes nothing `check` can see. Step 1 above — scenarios from the story — is the only
  guard, together with PR review.
- **A row that is wrong** — linked to the wrong test, or expecting something the API doesn't do.
  `AGENTS.md`'s second review pass (cycle 2) exists for this.
- **Test cases kept anywhere else** (a new sheet, a Jira comment). Put them here as rows.

## Scope

- **In scope:** functional API coverage — positive/negative paths, authn/authz, validation,
  not-found, boundary, idempotency, data isolation, plus module-specific extras (multilang,
  crypto integrity, dependency-chained state, injection) wherever the real code shows that
  surface.
- **Out of scope:** performance/load, SAST/DAST, dependency scanning, accessibility — those
  belong to a separate non-functional track.
- Coverage % is **`automated ÷ (automated + not_automated)`** from this matrix — never derived
  from line/branch coverage.
- **Expected and correct:** the % reads low until YAML test cases are actually tagged into rows
  and green. The matrix records intent first; wiring/linking real tests is ongoing work.

## Legend

| Column | Meaning |
|---|---|
| `ID` | For an `✅ automated` row: the real YAML `uniqueIdentifier` verbatim (e.g. `TC_Prereg_CreatePrereg_01`) — not the mechanical `API-<SUBJECT>-NNN` scheme; disambiguate with a suffix (`-multilang`, etc.) if two rows share one case. For a placeholder row: `TC_<Module>_<Subject>_NNN`, numbered starting one past the highest real `uniqueIdentifier` number already used in that subject's YAML. Stable once assigned, never renumbered or reused. `scaffold` still seeds brand-new stub rows with `API-<SUBJECT>-NNN` — replace it with the real/placeholder scheme above when you author the row. |
| `Scenario (given/when)` | Full Given/When/Then prose a non-automation reader can follow — the actual precondition/payload and the call being made. For a **multi-unit** subject (check `Units` — more than one entry), the text must still naturally mention that unit's exact method+path somewhere, since that's how the tooling tells rows belonging to different units apart; single-unit subjects have no such constraint. |
| `Expected result (then)` | The concrete pass condition — status code, response shape, specific field values — written as a "Then ..." sentence. Not "should work". |
| `Type` | One of the categories in this subject's front-matter `categories` list. |
| `Tier` | Test level, e.g. `integration`. |
| `Status` | Exactly one of `✅ automated` / `🟡 not_automated` / `⛔ not_automatable` (reason required in Notes for the last). |
| `Test` | `<ymlPath>::<uniqueIdentifier>` of the real YAML case this row is backed by. Blank until authored. **Author it as plain text** — `sync` automatically turns a resolvable reference into a clickable link to that case's exact line in the YAML (e.g. `[preReg/x/x.yml::TC_1](../../preReg/x/x.yml#L4)`), and re-derives the line fresh on every `sync`, so it self-heals if the YAML changes later. Works in GitHub's blob view and most local editors; the `#L<n>` fragment is inert (but harmless) anywhere else. Never hand-write the link — just write `<ymlPath>::<uniqueIdentifier>` and let `sync` do it. |
| `Notes` | Free text — required when Status is `⛔ not_automatable`. |

Category checklist — **core 8**, seeded on every subject:
```
positive · authn · authz · validation · not_found · boundary · idempotency · data_isolation
```
**Extras**, appended only where the subject's real code/YAML shows the surface (never invented):

| Extra | Added when |
|---|---|
| `multilang` | YAML uses `templateFields` / `$1STLANG$` etc. |
| `crypto_integrity` | Test script does cert/CSR/JWT validation. |
| `dependency_state` | Subject depends on a prereq id (`$ID:...$` token, or a suite-level `pathParams` sourced from a prior subject — prereg is heavily chained: create → upload doc → book appointment → status updates → cancel/delete). |
| `injection` | A free-text field reaches a query/search API. |

## How authentication works in this module

Every endpoint in this matrix authenticates the same way — documented **once, here**, instead of
being restated in all 41 subject files:

- The caller must present a valid login token — but **not** as an `Authorization: Bearer <token>`
  header. MOSIP's kernel-backed services (prereg included) instead read it from an HTTP **cookie**
  named `Authorization`, containing the token as its value. A request with no such cookie, or an
  expired/invalid one, is treated as unauthenticated and rejected the same as a missing role.
  (Confirmed from `RestClient.postRequestWithCookie`'s `.cookie(cookieName, cookieValue)` call in
  `apitest-commons`; `cookieName` = `GlobalConstants.AUTHORIZATION` = `"Authorization"`.)
- Our test suite acquires this token per test case via `KernelAuthentication.getTokenByRole(role)`
  — a real Keycloak OAuth2 login using per-role credentials configured in `prereg.properties`,
  keyed off the YAML case's `role:` field (e.g. `role: batch`, `role: admin`). The resulting JWT is
  attached to the HTTP call as `.cookie("Authorization", token)` (REST Assured). `role: noauth`
  skips this and sends the request with no cookie at all — that's how an unauthenticated-caller
  test case is expressed in YAML.
- Server-side extraction/validation of the cookie is handled by the shared `kernel-auth-adapter`
  library (a dependency of the service), whose source isn't vendored in this repo — not
  independently verifiable beyond confirming our test client authenticates this way and the
  service accepts it.
- **What's specific per endpoint is only which roles are allowed** — the exact `@PreAuthorize`
  role list and the config property backing it. That's the only auth detail each subject's own
  "Who can call it" section needs to state; everything above is shared and belongs here, not
  copy-pasted into every file.

## "About this endpoint"

Every matrix file has a hand-authored prose block, rendered after the grid (between
`<!-- ENDPOINT:details -->` markers), that `sync` preserves verbatim once it stops being the
placeholder. It exists so someone who isn't reading Java can open the file and understand the
endpoint on its own — the grid tells you what's tested, this tells you what the thing *is*.
Structure: **What this endpoint does** (plain purpose) → **Request & response** (the actual JSON
shape, in plain terms — not automation mechanics) → **Who can call it** (plain-English
authorization: which roles, what happens if not — link back to "How authentication works in this
module" above for the shared credential-transport mechanism instead of restating it) →
**everything technical in one place** — a single collapsed
`<details><summary>Technical details (automation + verification notes)</summary>` section holding
only what's genuinely subject-specific (the exact annotation/config-key citation, and any unusual
automation mechanic for *this* endpoint). No inline "(for engineers: ...)" asides scattered through
the plain sections, and **no re-explaining module-wide shared facts per subject** — link to the
shared section above instead. See `AGENTS.md` for the full guidance and `createPrereg.md` for a
worked example.

## Commands

The tooling is a small CLI (`io.mosip.testrig.apirig.coverage.CoverageCli`) in `apitest-commons`
(source: `mosip-functional-tests/apitest-commons/src/main/java/io/mosip/testrig/apirig/coverage/`).
It's a dev-time and CI tool — not wired into any Suite.xml. Run it from `apitest-commons`:

```powershell
cd mosip-functional-tests/apitest-commons
mvn -q compile -Dgpg.skip=true -Dmaven.gitcommitid.skip=true
mvn -q org.codehaus.mojo:exec-maven-plugin:3.1.0:java `
  "-Dexec.mainClass=io.mosip.testrig.apirig.coverage.CoverageCli" `
  "-Dexec.args=<command> --module-root ../../pre-registration/api-test --module-code PREREG"
```

| Command | What it does |
|---|---|
| `init` | One-time bootstrap for a module: writes `README.md`, `AGENTS.md`, `check-baseline.txt`, `legacy-ids.txt` and `.gitattributes` into this directory and the CI caller workflow into the repo's `.github/workflows/` (each only if missing), then runs `scaffold`. |
| `scaffold` | Creates a matrix file for every wired subject that doesn't have one, **and** a `planned/<VERB>_<path>.md` file for every real controller endpoint that no wired YAML targets (unless baselined) — so an untested endpoint gets a home for its intended scenarios instead of staying invisible. Never overwrites. |
| `sync` | Parse → merge → render every matrix file. Adds stub rows only for `(unit, category)` pairs with no row yet; never rewrites an existing row's text; re-links `Test` cells to the YAML line. Bumps `last_updated` only on files whose content actually changed. Idempotent — run it twice, get the same bytes. |
| `rollup` | Aggregates all matrix files (including `planned/`) into `Summary.md`. "As of" is the max `last_updated` across files, never wall-clock. |
| `check` | Read-only. Reports every gap below and exits non-zero if any gap isn't accepted in `check-baseline.txt`. `--keys` also prints each gap's exact baseline line. |

Options:

| Option | Meaning |
|---|---|
| `--module-root <dir>` / `--module-code <CODE>` | Required. The module's `api-test` dir, and its subject-code prefix. |
| `--out <dir>` | Matrix directory. Default `<module-root>/src/main/resources/coverage/` (this directory). |
| `--app-source <dir>` | Real service source (repeatable). **Default: auto-discovered** — every `src/main/java` beside `api-test` in the same repo. |
| `--path-prefix <prefix>` | Gateway prefix the YAML `endPoint:` carries and controllers don't. **Default: inferred per service** from the data (the prefix that lines most YAML endpoints up with that service's mappings); `check` prints what it inferred and marks services it had to guess for. On Git Bash pass `//v1/x` (MSYS rewrites a bare `/...`); the tool also undoes that rewrite if it already happened. |
| `--no-app-source` / `--require-app-source` | Turn endpoint checks off / make "no service source found" a gap (CI uses the latter). |
| `--baseline <file>` | Default `<out>/check-baseline.txt`. |
| `--legacy-ids <file>` | Default `<out>/legacy-ids.txt` (see "Legacy test-case IDs" below). |
| `--date <yyyy-MM-dd>` | Date stamped on files `sync`/`scaffold` changes (default today). |
| `--no-planned` | `scaffold`/`init`: don't create `planned/` files. |
| `--fail-on-warnings` | `check`: fail on warnings (see below) too, not only on gaps. |

Default `--out` is this directory, which gets bundled into the module jar like any other main
resource; `ExtractResource` never extracts it.

## Gap types `check` reports

API-test side:

1. `no-matrix-file` — a wired subject has no matrix file (run `scaffold`).
2. `unwired-yml` — a test YAML on disk that no Suite.xml `<test>` runs. These get no matrix file: wire it or delete it.
3. `empty-yml` — a test YAML with no cases, typically one accidentally emptied (see the repo `CLAUDE.md` § File Editing Rules for recovery).
4. `malformed-file` — a Suite.xml, YAML or matrix file that doesn't parse, or a `<test>` pointing at a missing YAML. Reported, never a crash.
5. `duplicate-unique-identifier` — two cases (anywhere in the module, compared case-insensitively) share a `uniqueIdentifier`. The ID is the only link from a matrix row to a test, so it must be unique module-wide.
6. `case-without-unique-identifier` — a wired case with no `uniqueIdentifier` can never be traced to a row.
7. `verb-mismatch` — a YAML's `restMethod:` disagrees with the verb its wired script class always sends (`PutWithPathParam` → PUT, ...). The class decides the real verb; fix `restMethod` so the matrix `Units` are true.

Matrix side:

8. `unit-no-row` — a unit has zero rows at all.
9. `category-missing` — a unit is missing a row for one of its required categories.
10. `unknown-category` — a row's `Type` isn't one of the file's categories (usually a typo — the row then silently drops out of every per-category count).
11. `unfilled-placeholder` — a stub row (`(TODO)` scenario or `TODO` expected result) is still unfilled, a row has no recognizable Status, or a `⛔ not_automatable` row gives no reason.
12. `unresolvable-test-ref` — an `✅ automated` row names no `<ymlPath>::<uniqueIdentifier>`, or names one no YAML case has.
13. `orphan-test-case` — a real, wired YAML case that no matrix row references. **This is the gate that stops a new test being added without its row.**
14. `summary-drift` — the front-matter `summary` block doesn't match the actual row counts.
15. `not-synced` — the file isn't what `sync` would write (units, categories, summary or Test links are stale) — run `sync`.
16. `malformed-row` — a grid row without exactly 8 cells, almost always an unescaped `|` in a cell (write `\|`, even inside backticks).
17. `duplicate-row-id` — the same `ID` twice in one file.
18. `stale-matrix-file` — a matrix file whose subject no Suite.xml runs any more.
19. `legacy-id-missing` — a test-case number listed in `legacy-ids.txt` appears in no matrix file.

Service side (on by default whenever service source is found):

20. `unmapped-endpoint` — a real controller endpoint no wired YAML targets **and** no `planned/` file covers: an endpoint with zero coverage, invisible to every other gap type. Resolve it by `scaffold` (plan it) or a baseline entry (intentionally untested — internal/deprecated).
21. `unreachable-endpoint` — a wired YAML `endPoint:` (or planned unit) that matches no real controller mapping — usually a wrong path. Matching is verb + path shape (path variables as wildcards, most specific mapping wins), so it complements, but doesn't replace, reading the controller in cycle 2. Paths routed by a servlet filter rather than a controller show up here too; baseline those with the reason.
22. `planned-endpoint-now-tested` — a `planned/` endpoint now has wired YAML: move its rows into that subject's file and delete the planned file.
23. `unscannable-mapping` — a controller mapping whose path is a constant, not a string literal, so the scan can't see it.
24. `app-source-missing` — only with `--require-app-source`: no service source was found.

Baseline hygiene (never baselinable themselves):

25. `baseline-entry-without-reason` — every accepted gap must say why.
26. `stale-baseline-entry` — an entry that no longer matches any gap; delete it.

Warnings (reported, but don't fail `check` unless `--fail-on-warnings`):

27. `possible-duplicate-row` — two rows in one file probably describe the same scenario, the usual
    result of adding a story's scenarios without reading the rows already there. Only pairs with the
    same `Type` on the same unit, where at least one row isn't backed by a YAML case, are considered;
    a pair is flagged when both expect the same error code on the same request field (ignoring the
    endpoint's own path/query parameters), when it's a second `authn`/`authz` row for one endpoint, or
    when the Scenario wording is ≥70% the same. It's a heuristic: if the rows really differ, make the
    Scenario text say how (or baseline the pair with the reason); if they don't, merge them — keep
    the older row and move any `Legacy:` note and story key onto it.

## Accepted gaps — `check-baseline.txt`

One line per intentionally accepted gap: `<gap-type> <key>  # reason` (`check --keys` prints the
exact line). This is for things that are *meant* to stay that way — an internal-only endpoint, a
deprecated one, a filter-routed path — never for "will fix later". Baseline entries are reviewed
like code.

## Legacy test-case IDs — `legacy-ids.txt`

When test cases are migrated in from a retired source (an Excel master test-case sheet, a test
management tool), list every old test-case number here, one per line. `check` then proves none
was lost: each ID must appear somewhere in a matrix file — by convention as `Legacy: <id>` in the
Notes of the row that covers it (several IDs: `Legacy: A, B`). An ID that genuinely belongs outside
this matrix (a UI journey, another module's API) keeps its line with a reason:
`<id>  # out of scope: <why and where it lives>`. Delete the file once nobody needs the old
numbers any more.

## Planned subjects — endpoints with no YAML yet

`scaffold` puts every untested real endpoint under `planned/` as a normal matrix file (front-matter
`planned: true`, all 8 core categories as `🟡 not_automated` stubs). It is where manual test cases,
exploratory scenarios and anything migrated from a legacy sheet go when the endpoint has no
automation yet. They count toward `Summary.md` like any subject, so an untested endpoint reads as
0%, not as absent. When YAML is later added for that endpoint, `check` raises
`planned-endpoint-now-tested`: move the rows into the real subject file and delete the planned one.

## CI

`.github/workflows/coverage-matrix-check.yml` in this repo calls the reusable workflow in
`mosip-functional-tests`, which builds the CLI from source and runs
`check --require-app-source` on every PR touching `api-test/**` or service Java. Any open gap
fails the PR.

## Governance

- **Nothing above `<!-- GENERATED:grid -->` is hand-edited — not even just the Coverage summary
  table.** The `Field | Value` table, `Units`, `Coverage summary`, `Categories`, and the raw YAML
  inside `<details>` are all regenerated by `sync` on every run:
  - `Subject` / `Subject code` / `Domain` / `Unit type` / `Units` / `Categories` come from the real
    Suite.xml + YAML (via `Inventory`), never from anything written in the file — hand-editing them
    does nothing lasting.
  - The `Coverage summary` numbers are recomputed every `sync` by counting the `Status` cells in
    the grid below — whatever you type there is discarded and replaced with the real count.
  - `Last updated` is fully tool-managed.
  - `Owner` is the one partial exception — `sync` does preserve it, but reads it from the `owner:`
    line in the raw YAML inside `<details>`, **not** from the visible table row. Edit it there if
    you want to set one; editing the visible "Owner" cell alone doesn't stick — the next `sync`
    regenerates that row from the (unchanged) raw value and silently discards your edit.
  - `stories:` is the second exception — an optional list of Jira story keys (e.g.
    `- MOSIP-17633`) in the raw YAML inside `<details>`, preserved by `sync` and rendered as a
    `Stories` row. It carries the requirement traceability a legacy sheet's `Story` column had;
    add it when a subject's scenarios come from a story.
  - The two things you ever hand-edit are (a) inside the generated grid table — the `ID`,
    `Scenario` / `Expected result` / `Status` / `Test` / `Notes` cells of a row (never `Type`,
    never the markers) — and (b) the prose inside the `<!-- ENDPOINT:details -->` block, which
    `sync` also preserves verbatim once authored. Nothing else in the file sticks across a `sync`.
- **Never renumber or reuse an `ID`.** Deleting a scenario leaves a gap in the sequence; that's fine.
- Reserved filenames `README.md`, `AGENTS.md`, `Summary.md`, `CLAUDE.md` are skipped by the tooling —
  don't name a subject folder to collide with these.
- Matrix files are LF-only (`.gitattributes` here pins it); a CRLF checkout would make every file
  look `not-synced`.
- See `AGENTS.md` in this directory for the row-authoring playbook and the mandatory two-cycle
  audit before a batch is considered done.
