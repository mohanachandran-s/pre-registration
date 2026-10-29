# pre-registration: API test context (SDET)

Evidence: `mosip/pre-registration/api-test` @ b1691c23f4 (`develop`), 2026-10-29: `crewline discover` and `crewline testcase`,
plus findings from pilot runs on the released environment (2026-10-27/28). Validator rules: [`profile.yaml`](profile.yaml).

## Facts

| Item | Value | Evidence |
|---|---|---|
| Test artifact | `apitest-prereg` 1.4.0-SNAPSHOT, runner `io.mosip.testrig.apirig.prereg.testrunner.MosipTestRunner` | `api-test/pom.xml` |
| Commons | `apitest-commons` 1.6.0 | `api-test/pom.xml:71-72` |
| `-Dmodules=` | `prereg` | runner |
| Suite | `testNgXmlFiles/preregSuite.xml`: 50 `<test>` | file |
| Cases | 382 in 53 YAML under `src/main/resources/preReg/`; case names `Prereg_*`; IDs `TC_prereg_<Subject>_<n>` (module token in either case) | `crewline discover` |
| Unwired / broken YAML | `BookMultipleAppointment`, `UpdatePridStatus` (0 bytes) not in the suite; `AuditLog` does not parse | KI-PR-002 |
| Roles | `batch` = applicant via OTP login (337 cases), `admin` = Keycloak admin (19) | YAML `role:` |
| Auth transport | token in cookie `Authorization`, not a Bearer header | `PreRegUtil.java:331` |
| Baseline | `crewline testcase --scope all`: 5 blocking, all known (KI-PR-001: 1, KI-PR-005: 4), 71 warnings | 2026-10-29 |

Existing debt in the baseline is recorded, not fixed: a task validates only what it changes (`--scope changed`).

## Script classes (suite)

`GetWithParam` 17 · `SimplePost` 7 · `DeleteWithParam` 6 · `PutWithPathParam` 5 · `PreRegDbValidator` 4 ·
`PreRegPiiRequest` 3 · `CreatePreReg`, `UpdatePrereg`, `PostWithFormPathParamAndFile`, `BookAppoinment`,
`BookAppoinmentByPrid`, `GetWithParamForAutoGenId` 1 each. `SimplePost`, `PutWithPathParam`, ... hardcode their HTTP verb;
`restMethod` in the YAML is documentation.

ID capture beyond the suite's `idKeyName` (all in `profile.yaml`):
- `CreatePreReg` / `UpdatePrereg` also store `EMAIL` and `PHONE`, but only for case names containing `_pos`
  (`CreatePreReg.java:156-158`, `UpdatePrereg.java:141-143`).
- `PreRegPiiRequest` takes the key per case from `input._idKeyName` (`PreRegPiiRequest.java:95,130-132`).

## Dependency chain (heavily chained)

create (`CreatePreReg`: `preRegistrationId`, plus EMAIL/PHONE on `_pos`) -> upload document (`docId`) -> book appointment
(`appointment_date`, `time_slot_from`) -> status updates -> cancel/delete. Cases that mutate shared state go at the end of the
suite. A targeted run must include the `$ID:` producers of every case in it (a missing producer looks like a product bug).

## Commands

```bash
# build (rebuild apitest-commons first only if it changed)
cd api-test && mvn clean install -Dgpg.skip=true -Dmaven.gitcommitid.skip=true
# run (environment values are per environment; never commit them)
java -Dmodules=prereg -Denv.user=<env> -Denv.endpoint=<https://api-internal.env> -Denv.testLevel=smokeAndRegression -Xmx2G \
     -jar target/apitest-prereg-<version>-jar-with-dependencies.jar
```

- Targeted run: `testCasesToExecute=<uniqueIdentifier,...>` in the module properties (local only, never committed).
- Run report must name the code under test (KI-PR-010). Before `mvn package` in a worktree:
  `mkdir -p target/classes && printf 'git.branch=%s\ngit.commit.id.abbrev=%s\n' "$(git branch --show-current)" "$(git rev-parse --short=8 HEAD)" > target/classes/git.properties`
- Reports contain the environment's actuator configuration: never attach a raw report or log to a public issue; Crewline's
  bug flow attaches a secret-scanned summary.

## Validators

```bash
crewline testcase      --module-root api-test --scope changed --base upstream/develop   # profile: .crewline/qa/profile.yaml
crewline expected-diff --module-root api-test --base upstream/develop                   # weakened expectations need approval
crewline regression    --base <base run report> --branch <branch run report>
```
