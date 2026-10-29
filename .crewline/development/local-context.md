# pre-registration: development context

Evidence: `mosip/pre-registration` @ b1691c23f4 (`develop`), discovered 2026-10-29 by `crewline discover`, reviewed against
pilot runs (2026-10-28/29). Every row is **Verified** from the file named unless marked *Inferred*. Build and domain
guidance in [`AGENTS.md`](../../AGENTS.md) wins where it is more specific.

| Item | Value | Evidence |
|---|---|---|
| Upstream / PR target | `mosip/pre-registration`, `develop` (contributors work from a fork) | `git remote -v` |
| Maven parent | `pre-registration/pom.xml` (run Maven from `pre-registration/`) | file; `AGENTS.md` § Build Commands |
| Java | 21 | `pre-registration/pom.xml:19` |
| Unit-test libraries | junit, junit-vintage-engine, mockito-core, spring-boot-starter-test | poms |
| Coverage | JaCoCo; surefire `argLine` keeps `${argLine}`, so the agent attaches | `pre-registration/pom.xml:269-281` |
| CI | `push-trigger.yml` (mosip/kattu maven + docker builds), `codeql_custom.yml`, `db-test.yml`, `chart-lint-publish.yml`, `use-pr-linker.yml` | `.github/workflows/` |
| DB scripts | `db_scripts/`, `db_release_scripts/`, `db_upgrade_scripts/`: 9 forward scripts, all with a rollback/revoke twin | `crewline migration` conventions |
| Deploy | helm charts `prereg-application`, `-batchjob`, `-captcha`, `-datasync`; 5 Dockerfiles | `helm/`, files |
| Booking service | not in this repository (lives in `mosip-ref-impl`); the application service calls it remotely | `AGENTS.md` § Domain Context |
| API tests | `api-test/` (API TestRig): see [`../qa/module-context.md`](../qa/module-context.md) | dir |

## Services and tests

| Service | Sources | Component-test styles |
|---|---|---|
| `pre-registration-application-service` | 193 main / 35 test | MockMvc 12, @WebMvcTest 12, @SpringBootTest 15 |
| `pre-registration-core` | 152 main / 11 test | MockMvc 1, @SpringBootTest 5 |
| `pre-registration-batchjob` | 59 main / 4 test | none |
| `pre-registration-datasync-service` | 38 main / 6 test | MockMvc 1, @SpringBootTest 3 |
| `pre-registration-captcha-service` | 13 main / 3 test | @SpringBootTest 3 |

## Commands

- Build one service with its dependencies: `mvn -B -f pre-registration/pom.xml -Dmaven.gitcommitid.skip=true -pl <service> -am verify`
- Unit tests: same with `test` -> `<service>/target/surefire-reports/TEST-*.xml`
- Coverage (Verified 2026-10-29): `mvn -B -f pre-registration/pom.xml -Dmaven.gitcommitid.skip=true -pl <service> -am test jacoco:report`
  -> `<service>/target/site/jacoco/jacoco.xml`; then `crewline diff-coverage --jacoco <service>/target/site/jacoco`
- `-Dmaven.gitcommitid.skip=true` is needed in git worktrees: `git-commit-id-plugin` cannot read a worktree's `.git` file.
- Component tests: follow `pre-registration-application-service/src/test/java/io/mosip/preregistration/application/test/controller/ApplicationControllerTest.java` (MockMvc)
- Evidence: wrap every command in `crewline run --repo <worktree> --out <task>/evidence/<name>.json -- <command>`

## Default approved paths (each task's plan narrows them)

- service change: `pre-registration/<service>/src/main/java/**`, `pre-registration/<service>/src/test/java/**`
- configuration: `pre-registration/<service>/src/main/resources/**` (sensitive: needs `scope_change`)
- API tests: `api-test/src/main/resources/preReg/<Subject>/**`, `api-test/testNgXmlFiles/preregSuite.xml`
- DB (database-migration tasks only): `db_upgrade_scripts/**`, `db_release_scripts/**`, `db_scripts/**`
- Always `scope_change`: `.github/**`, `helm/**`, `deploy/**`, `**/application*.properties`, Dockerfiles

## Open (owner to confirm)

- Which environment runs a branch build for system tests.
- Coverage threshold for changed lines, if the team's standard differs from 80%.
