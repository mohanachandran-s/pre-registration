# pre-registration: API test dependencies

| Depends on | How | Evidence |
|---|---|---|
| apitest-commons 1.6.0 | Maven dependency: HTTP, auth, assertions, ID capture, reports (upgrade risk: KI-PR-009) | `api-test/pom.xml:71-72` |
| Keycloak (per-role tokens) | `admin` role token; `batch` logs in through send/validate OTP | YAML `role:`; `PreRegUtil.java:331` |
| ID Schema (live) | `$SCHEMAVERSION$`; schema-driven validation server side | `createPrereg.yml` |
| Masterdata (registration centres, languages) | `$registration_center_id$`, `$1STLANG$` tokens | YAML (*Inferred* source of values) |
| Booking service (separately deployed, `mosip-ref-impl`) | `/preregistration/v1/appointment/...` | `AGENTS.md` § Domain Context |
| kernel-auth-adapter (server side) | reads and validates the `Authorization` cookie | *Inferred* from the cookie transport |
