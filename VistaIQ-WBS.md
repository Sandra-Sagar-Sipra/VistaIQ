# VistaIQ alert dashboard: work breakdown structure

Version 1.0, derived from PRD version 0.3 (Postgres for configuration, Elasticsearch for alerts)
Prepared for a team of freshers using AI coding tools, with senior review at named points

\---

## 1\. How to read this

There are 18 epics and 128 tasks, totalling 549 story
points. 



Every task carries the tasks it depends on. The sequence number in the import file is
a safe order to work in: a task never depends on anything with a higher sequence
number. Working strictly in sequence guarantees that nothing is built twice and
nothing waits on something that does not exist yet.



One point is roughly half a day of work including tests and review. AI tooling
accelerates writing code; it does not accelerate reading a schema, debugging an
integration, or waiting for a review. Estimate accordingly.

### Why the order is what it is

Three rules produced this sequence.

Shared machinery before the features that use it. The repository base classes, the
outbox worker and the reference cache are built before anything writes to both
stores. If a feature is built first, it will contain its own version of that
machinery and will be rewritten.

Configuration before ingestion. Alerts cannot be resolved to a component until
components and mapping rules exist. Ingestion built first would need a placeholder
resolver, which is duplicate work.

Read APIs before the screens that consume them, and the frontend shell before any
screen. A screen built against a guessed contract is reworked when the real contract
arrives.

Correlation is last of the functional work, deliberately. It is the least specified
part of the product, it needs real alerts in the index to be tuned against, and it
needs a calibration step before anyone can say whether it works.

### Milestones

|Milestone|Name|Epics|Points|What it means|
|-|-|-|-|-|
|M0|Decisions closed|E00|21|The blocking questions are answered. Work below this line is at risk until they are.|
|M1|Foundations ready|E01, E02, E03, E04|123|Both schemas, both repository layers, sign-in and the cross-store mechanism exist. Nothing is user visible yet, and that is expected.|
|M2|Configuration usable|E05|43|An administrator can define sources, the application hierarchy and the mappings through the API. Ingestion has something to resolve against.|
|M3|Alerts flowing and visible|E06, E07, E08, E09, E10|132|First demonstrable system. Real alerts arrive, deduplicate, and are searchable and actionable in the interface. Suitable for a client demonstration.|
|M4|Correlation and incidents|E11, E12, E13|113|The intelligence layer. Alerts group into incidents, Jira issues are raised, and resolution flows back automatically.|
|M5|Complete and operable|E14, E15, E16, E17|117|Dashboards, the full administrative interface, remaining sources, and the operational work needed to run it.|

M3 is the first point at which there is something to show a client. Everything before it is necessary and none of it is demonstrable, which is worth saying out loud to stakeholders early.

\---

## 2\. Working rules for the team

### Definition of done

A task is done when the acceptance criteria are met, unit tests cover the new
behaviour, the continuous integration pipeline passes, a second person has reviewed
the code, and any decision made during the work is written into the pull request
description. A task is not done because the AI tool produced code that runs.

### What to give the AI coding tool

Paste the relevant PRD section, the task description and the acceptance criteria into
the prompt. Do not paste the whole PRD; it exceeds what the tool can use well and it
invites invention. Name the files the tool may change. Ask for tests in the same
request as the code, not afterwards.

Review the output against the acceptance criteria before running it. The most common
failure is code that looks correct, runs, and does something slightly different from
what was asked.

### Four things AI tools get wrong on this project

These recur, so check for them in every review.

A router must never touch both stores. Sequencing across Postgres and the search
engine belongs in a domain service. Tools will happily put both clients in a route
handler.

A configuration write commits the change, its audit row and its outbox row in one
transaction. Tools will write them as three separate calls.

Every bulk response must have its per-item errors inspected. A bulk call can return
HTTP 200 with failures inside it, and tools routinely ignore them.

Use a forced refresh on user-initiated alert updates and never on ingestion writes.
Tools either force it everywhere, which destroys ingestion throughput, or nowhere,
which makes the interface look broken.

### Escalate rather than decide

A fresher should stop and ask rather than choose, when the question is: what a
priority value from a source tool maps to; which payload field identifies a
component; what a correlation threshold should be; whether to add a field to the
alert document; or whether to change a database constraint. Each of these is cheap to
ask about and expensive to get wrong.

\---

## 3\. Suggested parallel streams

Sequence is a safe order, not a mandatory one. Once M1 is complete, three streams can
run alongside each other.

Stream A, backend configuration and ingestion: epics 5, 6, 7, then 11, 12, 13.
Stream B, backend read and aggregation: epic 8, then 14 endpoints.
Stream C, frontend: epic 9, then 10, then 12 screens, 14 screens, 15.

Stream C cannot start before epic 9, and epic 9 needs the alert list endpoint from
task 8.1 to build its cursor pagination hook against. So Stream B runs slightly ahead
of Stream C throughout.

With three or four people, expect M1 to be sequential and largely senior-led, M2 and
M3 to parallelise well, and M4 to narrow again because correlation and incidents are
a dependency chain rather than independent work.

\---

## 4\. Epics and tasks

### E00 Decisions and prerequisites

*Close the open questions that later epics cannot proceed without. These are not coding tasks. They belong on the board because work stops without them.*

**Milestone:** M0 · **Tasks:** 10 · **Points:** 21

**Exit criteria:** Every decision below recorded in writing and attached to the Jira epic.

#### 0.1 Decide Elasticsearch or OpenSearch

Elasticsearch is under the Elastic License 2.0. OpenSearch is Apache 2.0 and is compatible with everything in the PRD, but the Python client differs. The choice changes the dependency installed in task 1.1 and every search repository.

* **Acceptance:** Decision recorded with the legal position on client deployment and resale. Client library named.
* **Depends on:** none
* **Points:** 2 · **Who:** Senior or lead

#### 0.2 Collect real sample alert payloads

One JSON payload per source for Veracode, GitHub Dependabot and Dynatrace, covering at least one critical and one medium item each. Left open on the call.

* **Acceptance:** Payloads committed to the repository as fixture files. Field meanings confirmed with whoever owns the tool.
* **Depends on:** none
* **Points:** 3 · **Who:** Senior or lead

#### 0.3 Agree the denormalised alert field list

The alert document carries a copy of configuration values so reads never touch Postgres. PRD section 4.1 includes application and component names, path, ancestors, environment and source name. Criticality, owner and tags are not included. Adding a field later means rewriting every alert document.

* **Acceptance:** Final field list signed off by the architect and written into the PRD.
* **Depends on:** none
* **Points:** 2 · **Who:** Senior or lead

#### 0.4 Agree correlation signals, weights and starting thresholds

The call ended with 'correlation, we need to figure out the logic'. PRD section 6.6 proposes four signals. Weights, the time window and the score threshold are not defined.

* **Acceptance:** Signal list, boost values, window length and initial min\_score recorded. Depends on 0.2 for realistic examples.
* **Depends on:** 0.2
* **Points:** 5 · **Who:** Senior or lead

#### 0.5 Confirm automatic or manual incident creation

The BRD says incidents are created automatically from correlated groups. The call described a user selecting alerts and then raising Jira. These are different products.

* **Acceptance:** Default behaviour chosen. If both are wanted, which is the default is stated.
* **Depends on:** none
* **Points:** 1 · **Who:** Senior or lead

#### 0.6 Confirm Jira configuration

Project key, issue type, priority mapping from VistaIQ priority to Jira priority, the transition name used for closure, and what should happen when a closed alert recurs.

* **Acceptance:** Values recorded per environment. A test Jira project is available to the team.
* **Depends on:** none
* **Points:** 2 · **Who:** Senior or lead

#### 0.7 Establish alert volume and retention

Needed to set the Elasticsearch shard count and the ILM policy. Correcting the shard count later requires a full reindex.

* **Acceptance:** Expected alerts per day per source, peak burst size, and retention period in months. Shard count derived from these.
* **Depends on:** none
* **Points:** 2 · **Who:** Senior or lead

#### 0.8 Confirm deployment topology for release one

The call described three micro frontends and four backend containers. The PRD proposes a modular monolith with hard module boundaries for release one.

* **Acceptance:** Architect sign-off on the modular monolith, or a revised structure for task 1.1.
* **Depends on:** none
* **Points:** 1 · **Who:** Senior or lead

#### 0.9 Decide the health score formula or defer the field

The BRD puts health status and a health score on the application dashboard. No formula exists, and the application health endpoints it would read do not exist yet in the monitored applications.

* **Acceptance:** Either a formula derived from open alert counts and priorities, or a written decision to defer the field from release one.
* **Depends on:** none
* **Points:** 2 · **Who:** Senior or lead

#### 0.10 Confirm no multi-tenancy and no RBAC in release one

The BRD lists both as requirements. The call agreed authentication only. Neither store has a tenant column in the current design.

* **Acceptance:** Written client confirmation that every authenticated user may see all data, and that tenancy is out of scope.
* **Depends on:** none
* **Points:** 1 · **Who:** Senior or lead

\---

### E01 Project foundation

*Create the repository, the local environment and the shared conventions every later task builds on. Nothing else starts until this epic is done.*

**Milestone:** M1 · **Tasks:** 8 · **Points:** 22

**Exit criteria:** A new joiner can clone the repository, run one command, and reach a health endpoint with both stores running.

#### 1.1 Create repository and module skeleton

Set up the module layout in PRD section 6.1: api, domain, adapters, ingest, correlation, integrations, repo/sql, repo/search, projection, core. Add empty package files and a README explaining what belongs in each module.

* **Acceptance:** Directory structure matches the PRD. Dependency file lists FastAPI, SQLAlchemy, asyncpg, Alembic, the chosen search client, Pydantic v2, httpx, structlog. Application starts and serves an empty health endpoint.
* **Depends on:** 0.1, 0.8
* **Points:** 3 · **Who:** Fresher

#### 1.2 Docker Compose for local development

Services: Postgres, the chosen search engine, the API, and the worker. Named volumes so data survives a restart. No production concerns.

* **Acceptance:** One command brings all four services up. API health endpoint reports both stores reachable. Documented in the README.
* **Depends on:** 1.1
* **Points:** 3 · **Who:** Fresher

#### 1.3 Typed configuration module

A Pydantic settings class reading every value from the environment: database URL, search host, encryption key, Entra tenant and client identifiers, Jira credentials. No hardcoded values anywhere else in the codebase.

* **Acceptance:** Application refuses to start with a clear message when a required variable is missing. A .env.example file lists every variable.
* **Depends on:** 1.1
* **Points:** 2 · **Who:** Fresher

#### 1.4 Structured logging

JSON logging through structlog. Every request and every ingestion run carries a correlation identifier that appears on all log lines for that operation.

* **Acceptance:** A single request can be traced end to end by its correlation identifier.
* **Depends on:** 1.1
* **Points:** 2 · **Who:** Fresher

#### 1.5 Shared domain constants

One module defining priority, alert status, incident status, component type, match type, ingestion mode and auth method. Alert status matters most because it is used by both stores and has no Postgres enum to anchor it.

* **Acceptance:** Both stores and the frontend derive their values from this one definition. Priority carries its numeric rank for sorting.
* **Depends on:** 1.1
* **Points:** 2 · **Who:** Fresher

#### 1.6 API conventions and error handling

A standard error response shape, an exception handler mapping domain errors to HTTP codes, and the cursor pagination response envelope used by every list endpoint.

* **Acceptance:** Documented in the README with an example of each. Applied by a shared dependency rather than repeated per router.
* **Depends on:** 1.1, 1.3
* **Points:** 3 · **Who:** Fresher, senior review

#### 1.7 Test harness

Pytest with async fixtures, a throwaway Postgres schema per test session and a throwaway search index per test session, plus a fixture that seeds a minimal application hierarchy.

* **Acceptance:** Tests run from a clean checkout with no manual setup. Two example tests pass, one per store.
* **Depends on:** 1.2, 1.3
* **Points:** 5 · **Who:** Fresher, senior review

#### 1.8 Continuous integration pipeline

Lint, format check, type check and unit tests on every pull request.

* **Acceptance:** Pipeline fails on a deliberately broken commit and passes on main.
* **Depends on:** 1.7
* **Points:** 2 · **Who:** Fresher

\---

### E02 Data layer

*Build both schemas and the repository layer. Every later epic reads and writes through what is created here, so nothing after this epic should contain a raw query or a raw index call.*

**Milestone:** M1 · **Tasks:** 17 · **Points:** 61

**Exit criteria:** All tables and indices exist, models and repository base classes are in place, and the alias swap routine has been exercised once.

#### 2.1 Alembic setup and baseline migration

Initialise Alembic against the async engine. Baseline migration enables the ltree, pgcrypto and uuid-ossp extensions.

* **Acceptance:** Upgrade and downgrade both run cleanly against an empty database.
* **Depends on:** 1.2, 1.3
* **Points:** 2 · **Who:** Fresher

#### 2.2 Migration: enumerations and environment lookup

Create the Postgres enums listed in PRD section 3.1 and the environment lookup table. Seed environments with prod, pre-prod, UAT and dev.

* **Acceptance:** Enum values match the shared constants from task 1.5 exactly. Seed data present after upgrade.
* **Depends on:** 2.1, 1.5
* **Points:** 2 · **Who:** Fresher

#### 2.3 Migration: monitoring\_source

Table per PRD section 3.2, including the encrypted credentials and webhook secret columns as bytea, and the unique constraint on name.

* **Acceptance:** Upgrade and downgrade clean. Unique constraint rejects a duplicate name.
* **Depends on:** 2.2
* **Points:** 2 · **Who:** Fresher

#### 2.4 Migration: component with ltree path

Self-referencing table with parent\_id under on delete restrict, an ltree path column, depth, and a trigger maintaining path and depth on insert and update. GIST index on path, GIN on tags, unique on parent\_id plus name.

* **Acceptance:** Inserting a three-level hierarchy produces correct path and depth values without the application setting them. Deleting a parent with children is rejected by the database.
* **Depends on:** 2.2
* **Points:** 5 · **Who:** Fresher, senior review

#### 2.5 Migration: component\_source\_map

Mapping table per the PRD with the unique constraint across source, match key, match value and match type.

* **Acceptance:** Duplicate rule insert is rejected. Deleting a component cascades its mappings.
* **Depends on:** 2.3, 2.4
* **Points:** 2 · **Who:** Fresher

#### 2.6 Migration: correlation\_group and incident

Create correlation\_group first, then incident, then the foreign key from correlation\_group back to incident. The unique constraints on incident.correlation\_group\_id and incident.jira\_issue\_key carry functional requirements and must not be omitted.

* **Acceptance:** A second incident for the same correlation group is rejected by the database. A second incident with the same Jira key is rejected.
* **Depends on:** 2.4
* **Points:** 3 · **Who:** Fresher, senior review

#### 2.7 Migration: dedup\_policy

Table per the PRD, plus a seeded global default policy with a sixty minute window so ingestion has something to read from day one.

* **Acceptance:** Global default present after upgrade. A source-specific policy overrides it when queried.
* **Depends on:** 2.3
* **Points:** 2 · **Who:** Fresher

#### 2.8 Migration: app\_user, saved\_view, audit\_log

Three tables per the PRD. The role column on app\_user is nullable and reserved.

* **Acceptance:** Upgrade and downgrade clean. Unique constraint on entra\_object\_id and on user plus view name.
* **Depends on:** 2.2
* **Points:** 2 · **Who:** Fresher

#### 2.9 Migration: sync\_run and config\_outbox

Both tables per the PRD. Index config\_outbox on processed\_at and id for the worker poll query.

* **Acceptance:** Upgrade and downgrade clean. Query plan for the worker poll uses the index.
* **Depends on:** 2.3
* **Points:** 2 · **Who:** Fresher

#### 2.10 SQLAlchemy models

Async declarative models for every table created above, with relationships and type annotations. No business logic in the models.

* **Acceptance:** Models match the migrations exactly. A schema comparison test detects drift between models and migrations.
* **Depends on:** 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9
* **Points:** 5 · **Who:** Fresher, senior review

#### 2.11 SQL repository base class

Async session management, generic create, read, update, delete, offset pagination, and a helper that opens a transaction spanning a config write, its audit row and its outbox row.

* **Acceptance:** One concrete repository built on it and covered by tests. Transaction helper proven to roll all three writes back together.
* **Depends on:** 2.10
* **Points:** 5 · **Who:** Fresher, senior review

#### 2.12 Search client wrapper

A configured async client with connection pooling, retry on connection error, and a health check used by the API health endpoint.

* **Acceptance:** Health endpoint reports search engine status. Client is created once at startup, not per request.
* **Depends on:** 1.3
* **Points:** 3 · **Who:** Fresher

#### 2.13 Index templates, ILM policy and bootstrap runner

Versioned index templates and component templates, the ILM policy from PRD section 4.3, a startup routine that applies them idempotently, and the alias swap plus reindex routine used for future mapping changes.

* **Acceptance:** Running bootstrap twice is harmless. A deliberate mapping change is applied by creating a new versioned index, reindexing and repointing the alias, with the old index still readable during the swap. Exercised once and documented.
* **Depends on:** 2.12, 0.7
* **Points:** 8 · **Who:** Senior or lead

#### 2.14 Alert index mapping

The mapping in PRD section 4.1, with dynamic set to strict, original\_payload as flattened, application\_hierarchy with indexing disabled, and priority\_rank as a numeric mirror of priority.

* **Acceptance:** An unexpected field in a document is rejected rather than silently mapped. A vendor payload with fifty arbitrary keys adds no new mappings. Sorting by priority\_rank returns critical first.
* **Depends on:** 2.13, 0.3
* **Points:** 5 · **Who:** Fresher, senior review

#### 2.15 Occurrence and integration event mappings

The two mappings in PRD section 4.2, both under ILM.

* **Acceptance:** Both indices created by bootstrap. Rollover verified by forcing the condition.
* **Depends on:** 2.13
* **Points:** 2 · **Who:** Fresher

#### 2.16 Search repository base class

Index, get, update with if\_seq\_no and if\_primary\_term, scripted upsert with retry\_on\_conflict, search\_after cursor pagination with a tie-break sort, and a bulk helper that inspects per-item errors and raises on any failure.

* **Acceptance:** Bulk helper proven to raise when one item in a batch fails while the HTTP status is 200. Cursor pagination proven past ten thousand documents. Concurrent update returns a conflict rather than silently overwriting.
* **Depends on:** 2.14
* **Points:** 8 · **Who:** Fresher, senior review

#### 2.17 Audit log helper

A helper that records actor, action, entity, before and after state, written inside the same transaction as the change it describes.

* **Acceptance:** A rolled back config change leaves no audit row.
* **Depends on:** 2.11
* **Points:** 3 · **Who:** Fresher

\---

### E03 Authentication

*Entra sign-in for the API. Every protected endpoint built after this epic uses it, so it comes before any feature endpoint.*

**Milestone:** M1 · **Tasks:** 4 · **Points:** 11

**Exit criteria:** A real Entra token reaches a protected endpoint and resolves to a user row.

#### 3.1 Entra token validation

Validate the bearer token signature, issuer, audience and expiry against the Entra keys, cache the key set, and expose a dependency that yields the current user claims. No authorisation logic, per decision 0.10.

* **Acceptance:** A valid token passes. An expired, wrongly signed or wrong-audience token returns 401 with the standard error shape.
* **Depends on:** 2.11, 1.6
* **Points:** 5 · **Who:** Fresher, senior review

#### 3.2 User provisioning on first sign-in

On a valid token with no matching app\_user row, create one from the claims. On each sign-in update last\_login\_at.

* **Acceptance:** First sign-in creates exactly one row. Concurrent first sign-ins do not create duplicates.
* **Depends on:** 3.1, 2.8
* **Points:** 3 · **Who:** Fresher

#### 3.3 GET /me endpoint

Return the current user's identifier, email and display name.

* **Acceptance:** Returns the signed-in user. Returns 401 without a token.
* **Depends on:** 3.2
* **Points:** 1 · **Who:** Fresher

#### 3.4 Local development authentication bypass

A configuration flag that substitutes a fixed test user, off by default and impossible to enable outside local settings. Freshers cannot be blocked on Entra tenant access.

* **Acceptance:** Bypass works locally. Application refuses to start with the bypass enabled when the environment is not local.
* **Depends on:** 3.1
* **Points:** 2 · **Who:** Fresher, senior review

\---

### E04 Cross-store consistency mechanism

*Postgres and the search engine share no transaction and cannot be joined. This epic builds the three mechanisms that hold them together. It must be complete before any feature writes to both stores, otherwise those features will be rewritten.*

**Milestone:** M1 · **Tasks:** 7 · **Points:** 29

**Exit criteria:** An outbox event written in Postgres is observably applied to the alert index by the worker, with retries and a repair path.

#### 4.1 Outbox writer helper

A function that enqueues a config\_outbox row inside the caller's existing transaction. Callers never insert into the table directly.

* **Acceptance:** A rolled back config change leaves no outbox row. Committed change leaves exactly one.
* **Depends on:** 2.11
* **Points:** 2 · **Who:** Fresher

#### 4.2 Outbox worker process

A separate long-running process that polls unprocessed outbox rows in order, dispatches each to a projection, marks it processed, and on failure increments attempts and retries with exponential backoff. Rows exceeding a retry ceiling are left unprocessed and logged loudly.

* **Acceptance:** Worker survives a projection raising an exception. Ordering is preserved per aggregate. Restarting the worker does not reprocess completed rows.
* **Depends on:** 4.1, 1.4
* **Points:** 8 · **Who:** Fresher, senior review

#### 4.3 Projection registry and dispatcher

A registry mapping aggregate type and event type to a projection function. The registry starts empty; later epics register their own projections.

* **Acceptance:** An unregistered event type is logged and marked processed rather than blocking the queue. Registering a projection requires no change to the worker.
* **Depends on:** 4.2
* **Points:** 3 · **Who:** Fresher, senior review

#### 4.4 Asynchronous update\_by\_query helper

Submit an update\_by\_query with wait\_for\_completion false, store the returned task identifier on the outbox row, and poll the task until it completes. Never run this inline in a request.

* **Acceptance:** A rewrite of ten thousand documents completes without the worker blocking. Task failure is recorded on the outbox row.
* **Depends on:** 4.2, 2.16
* **Points:** 5 · **Who:** Fresher, senior review

#### 4.5 Reference cache

In-process cache with a short time to live over the component and mapping tables, invalidated by the corresponding outbox events. Ingestion reads these on every alert, so without this Postgres becomes the bottleneck.

* **Acceptance:** Cache hit avoids a database round trip. A component rename invalidates the entry within one worker cycle. Cache is per process and does not need to be shared.
* **Depends on:** 4.3, 2.11
* **Points:** 5 · **Who:** Fresher, senior review

#### 4.6 Drift reconciliation job skeleton

A scheduled job with a place for each check, writing its findings to sync\_run with run\_type projection. Individual checks are implemented in task 13.6.

* **Acceptance:** Job runs on a schedule, records a sync\_run row, and reports zero findings on a clean database.
* **Depends on:** 4.2, 2.9
* **Points:** 3 · **Who:** Fresher

#### 4.7 Worker observability

Log and record queue depth, oldest unprocessed row age, and failure count. Expose them on an operational endpoint.

* **Acceptance:** A deliberately stalled projection is visible without reading logs.
* **Depends on:** 4.2
* **Points:** 3 · **Who:** Fresher

\---

### E05 Configuration API

*Every configuration endpoint. Postgres only, no search engine involvement. Ingestion depends on sources, components and mappings existing, so this epic precedes it.*

**Milestone:** M2 · **Tasks:** 10 · **Points:** 43

**Exit criteria:** An administrator can register a source, build an application hierarchy and map components to source identifiers entirely through the API.

#### 5.1 Credential encryption helper

Encrypt and decrypt credential blobs using pgcrypto with the key from settings. Credentials are never returned by any endpoint and never logged.

* **Acceptance:** Round trip works. A test asserts no endpoint response and no log line contains a decrypted credential.
* **Depends on:** 2.11, 1.3
* **Points:** 3 · **Who:** Fresher, senior review

#### 5.2 Monitoring source CRUD

List, create, read, update and delete. Validation enforcing that poll interval is present for poll mode and webhook secret for webhook mode. Audit row on every write.

* **Acceptance:** All five operations covered by tests. Duplicate name returns a 409. Credentials are write-only.
* **Depends on:** 5.1, 2.17
* **Points:** 5 · **Who:** Fresher

#### 5.3 Source connection test endpoint

A per-vendor connectivity probe behind one interface, returning success or a readable failure, and updating connection\_status and last\_sync\_error. Stub implementations for vendors not yet built.

* **Acceptance:** Endpoint returns a clear result for a good and a bad credential. connection\_status is updated in both cases.
* **Depends on:** 5.2
* **Points:** 5 · **Who:** Fresher, senior review

#### 5.4 Component create, read, update and delete

Create with an optional parent. A null parent creates an application. Delete must be refused when children, mappings or open alerts exist, with a message saying which.

* **Acceptance:** Creating a four-level hierarchy works. Deleting a node with children returns 409 naming the blocker. Audit rows written.
* **Depends on:** 2.17, 2.4
* **Points:** 5 · **Who:** Fresher

#### 5.5 Component tree read endpoint

Return the full tree, or a subtree from a given root, in one query using the ltree path rather than recursive calls.

* **Acceptance:** A tree of five hundred nodes returns in one database round trip under two hundred milliseconds.
* **Depends on:** 5.4
* **Points:** 3 · **Who:** Fresher, senior review

#### 5.6 Component move endpoint

Move a node to a new parent. Recompute path, depth and ancestry for the node and every descendant in one statement. Reject a move that would create a cycle. Enqueue a moved outbox event.

* **Acceptance:** Moving a subtree of fifty nodes leaves every path correct. Moving a node under its own descendant is rejected. One outbox event is written.
* **Depends on:** 5.4, 4.1
* **Points:** 8 · **Who:** Fresher, senior review

#### 5.7 Component source mapping CRUD

List mappings for a component, create, and delete. Validate match type and warn when a new rule duplicates an existing one at the same precedence.

* **Acceptance:** Operations covered by tests. Duplicate rule returns 409.
* **Depends on:** 5.4
* **Points:** 3 · **Who:** Fresher

#### 5.8 Deduplication policy CRUD

List, create, update and delete. The global default cannot be deleted.

* **Acceptance:** Operations covered by tests. Deleting the global default is refused.
* **Depends on:** 2.7, 2.17
* **Points:** 3 · **Who:** Fresher

#### 5.9 Saved views CRUD

List, create and delete saved views for the current user. Filters stored as JSON without server-side interpretation.

* **Acceptance:** A user sees only their own views. Duplicate name for the same user returns 409.
* **Depends on:** 3.3, 2.8
* **Points:** 3 · **Who:** Fresher

#### 5.10 Component rename projection

Register the projection that rewrites application\_name, component\_name and component\_path on affected alert documents. Register the move projection that rewrites ancestors, component\_path, application\_id and application\_name for a subtree.

* **Acceptance:** Renaming a component updates its alerts within one worker cycle. Moving a subtree updates every descendant's alerts. Both use the asynchronous helper.
* **Depends on:** 5.6, 4.3, 4.4, 2.14
* **Points:** 5 · **Who:** Fresher, senior review

\---

### E06 Vendor adapter framework

*The contract every source integration implements, plus fixtures so downstream work is not blocked while real payloads are being collected.*

**Milestone:** M3 · **Tasks:** 4 · **Points:** 17

**Exit criteria:** One real adapter converts a real payload into a normalised alert, covered by tests.

#### 6.1 Adapter interface and registry

Define the three-method contract from PRD section 6.5: fetch, normalise and resolve\_keys. A registry resolves the adapter for a monitoring source by its vendor field.

* **Acceptance:** Interface documented with a worked example. An unknown vendor raises a clear error at source creation time, not at ingestion time.
* **Depends on:** 1.5, 5.2
* **Points:** 3 · **Who:** Fresher, senior review

#### 6.2 Synthetic payload fixtures

A fixture set of plausible payloads per vendor so tasks 7.x and 8.x can proceed while decision 0.2 is outstanding. Clearly marked synthetic and replaced by real payloads when available.

* **Acceptance:** At least three payloads per vendor covering critical, high and medium. Used by the ingestion tests.
* **Depends on:** 6.1
* **Points:** 3 · **Who:** Fresher

#### 6.3 Normalisation test pattern

A reusable test that feeds a payload through an adapter and asserts the normalised fields, the extracted vendor\_rule\_id, and that the residual payload contains no field that was extracted.

* **Acceptance:** Pattern documented. Applied to the synthetic fixtures.
* **Depends on:** 6.2
* **Points:** 3 · **Who:** Fresher, senior review

#### 6.4 Veracode adapter

Implement fetch, normalise and resolve\_keys against the real Veracode payload. Map Veracode severity onto the shared priority scale. Extract the CWE identifier as vendor\_rule\_id, since it is the strongest correlation signal. Declare repository as a resolve key.

* **Acceptance:** Real payloads normalise correctly. Residual payload retains all vendor-specific fields and none of the extracted ones. Severity mapping reviewed by the lead.
* **Depends on:** 6.3, 0.2
* **Points:** 8 · **Who:** Fresher, senior review

\---

### E07 Ingestion pipeline

*Alerts arriving, being resolved to a component, deduplicated and stored. This is the first epic that writes to both stores, which is why epics 4 and 5 come first.*

**Milestone:** M3 · **Tasks:** 10 · **Points:** 45

**Exit criteria:** A real Veracode payload posted to the webhook appears as a searchable alert attached to the right component, and a replay of the same payload creates nothing new.

#### 7.1 Pipeline orchestrator and stage contracts

Sequence the six stages from PRD section 6.5, with each stage a separate testable function. Every stage must be idempotent so a replay is safe.

* **Acceptance:** Stages can be tested in isolation. A payload processed twice produces identical state.
* **Depends on:** 6.1, 4.5
* **Points:** 5 · **Who:** Fresher, senior review

#### 7.2 Normalise stage

Call the adapter, build the normalised alert model, and keep the residual payload untouched for the original\_payload field. Do not parse the payload further, per the explicit instruction on the call.

* **Acceptance:** Normalised fields populated. Residual payload byte-identical to the vendor JSON minus extracted fields.
* **Depends on:** 7.1, 6.4
* **Points:** 3 · **Who:** Fresher

#### 7.3 Resolve stage

Look up component\_source\_map through the reference cache using the adapter's candidate keys, lowest precedence wins, honouring exact, prefix and regex match types. Populate component\_id, application\_id, ancestors, component\_path and application\_hierarchy from the component. Store unresolved alerts with a null component.

* **Acceptance:** An alert naming a mapped repository resolves to the right component. An unmapped identifier stores the alert with null component and does not fail the batch. Precedence tie is resolved deterministically.
* **Depends on:** 7.2, 4.5, 5.7
* **Points:** 8 · **Who:** Fresher, senior review

#### 7.4 Deduplication stage

Compute dedup\_key from the applicable policy's match fields, floor the source timestamp to the policy window to get the window bucket, and derive the document identifier as specified in PRD section 4.1.

* **Acceptance:** Two identical payloads inside the window produce one document. The same payloads in different windows produce two. Identifier is stable across process restarts.
* **Depends on:** 7.3, 5.8
* **Points:** 5 · **Who:** Fresher, senior review

#### 7.5 Index stage with occurrence tracking

Scripted upsert that creates the alert on first sight, or increments occurrence\_count and updates last\_seen\_at on a repeat, writing an occurrence document either way.

* **Acceptance:** Occurrence count reaches five after five identical payloads. Concurrent duplicates do not lose a count. No refresh forced on the write path.
* **Depends on:** 7.4, 2.16, 2.15
* **Points:** 5 · **Who:** Fresher, senior review

#### 7.6 Bulk ingestion path

Batch documents through the bulk API using the base class helper. Inspect every per-item error. A partial failure must be surfaced, never discarded.

* **Acceptance:** A batch with one bad document reports that document and still commits the rest, with the failure recorded on the sync run.
* **Depends on:** 7.5
* **Points:** 5 · **Who:** Fresher, senior review

#### 7.7 Webhook ingestion endpoint

Accept a raw vendor payload at the per-source webhook path, verify the signature against the stored secret, and hand it to the pipeline.

* **Acceptance:** Valid signature accepted. Missing or wrong signature returns 401 and is logged. Payload is not processed before verification.
* **Depends on:** 7.6, 5.1
* **Points:** 5 · **Who:** Fresher, senior review

#### 7.8 Internal batch ingest endpoint

The endpoint the orchestrator calls with a set of fetched payloads. Not exposed publicly.

* **Acceptance:** Accepts a batch, returns per-item outcomes, and records a sync run.
* **Depends on:** 7.6
* **Points:** 3 · **Who:** Fresher

#### 7.9 Manual sync trigger

POST on a source triggers an immediate fetch and ingest run, for use during development and demonstration.

* **Acceptance:** Returns the sync run identifier. Concurrent triggers for the same source are rejected rather than overlapping.
* **Depends on:** 7.8
* **Points:** 3 · **Who:** Fresher

#### 7.10 Sync run recording

Record start, finish, status and the created, updated and closed counts for every ingestion run.

* **Acceptance:** Every run leaves exactly one row, including failed runs, with the error captured.
* **Depends on:** 7.8, 2.9
* **Points:** 3 · **Who:** Fresher

\---

### E08 Alert read API

*Everything the alert screens need. Search engine only, because the alert document already carries the denormalised configuration values.*

**Milestone:** M3 · **Tasks:** 5 · **Points:** 19

**Exit criteria:** The full filter set, cursor pagination and status changes all work against real ingested data.

#### 8.1 Alert list endpoint

Filters for application, component, priority, source, environment, status, time range, tags and free text. Cursor pagination with a tie-break sort. The default when no filters are supplied is status open and priority critical or high.

* **Acceptance:** Every filter covered by a test. Default filter verified. Pagination proven past ten thousand documents. Response under one second at one hundred thousand open alerts.
* **Depends on:** 7.5, 2.16
* **Points:** 8 · **Who:** Fresher, senior review

#### 8.2 Alert detail endpoint

Return the full normalised alert including the original payload and the application hierarchy object.

* **Acceptance:** Returns by alert reference. Unknown reference returns 404 in the standard shape.
* **Depends on:** 8.1
* **Points:** 2 · **Who:** Fresher

#### 8.3 Alert update endpoint

Change status, notes and owner using optimistic concurrency, forcing a refresh so the list reflects the change on refetch.

* **Acceptance:** Concurrent update returns 409. Updated alert is immediately visible in a subsequent list call.
* **Depends on:** 8.2
* **Points:** 5 · **Who:** Fresher, senior review

#### 8.4 Alert occurrences endpoint

Paginated list of occurrence documents for an alert, newest first.

* **Acceptance:** Returns the expected count for a deduplicated alert.
* **Depends on:** 8.2
* **Points:** 2 · **Who:** Fresher

#### 8.5 Unmapped alerts support

A filter selecting alerts with no resolved component, and a count endpoint the hierarchy screen can display.

* **Acceptance:** Filter returns only unmapped alerts. Count matches the filtered total.
* **Depends on:** 8.1
* **Points:** 2 · **Who:** Fresher

\---

### E09 Frontend foundation

*The React shell and the shared building blocks. Screen tasks in later epics assume all of this exists, so none of them start until this epic is done.*

**Milestone:** M3 · **Tasks:** 6 · **Points:** 27

**Exit criteria:** A signed-in user reaches an empty authenticated layout, and the shared table, filter panel and JSON viewer are demonstrable in isolation.

#### 9.1 Project scaffold and layout shell

Vite, TypeScript, React Router, and the application layout with navigation reflecting the screen list in PRD section 7.2. Routes render placeholders.

* **Acceptance:** Builds and runs. Every route in the PRD exists and is reachable.
* **Depends on:** 1.1
* **Points:** 3 · **Who:** Fresher

#### 9.2 Entra sign-in

MSAL React sign-in, token attached to every API call, protected routes redirecting when unauthenticated, and token refresh handled.

* **Acceptance:** Sign-in and sign-out work against the real tenant. An expired token triggers a silent refresh rather than a failed request.
* **Depends on:** 9.1, 3.3
* **Points:** 5 · **Who:** Fresher, senior review

#### 9.3 API client and server state layer

TanStack Query configured, a typed API client generated from or aligned to the OpenAPI schema, a shared error surface, and a hook implementing cursor pagination.

* **Acceptance:** Types match the backend contract. Cursor hook proven against the alert list endpoint. Errors surface in one consistent component.
* **Depends on:** 9.2, 8.1
* **Points:** 5 · **Who:** Fresher, senior review

#### 9.4 Design tokens and shared primitives

One priority colour scale used everywhere, and a timestamp component showing local time with the UTC value on hover.

* **Acceptance:** Colour scale defined once. Timestamp component used by every screen thereafter.
* **Depends on:** 9.1
* **Points:** 3 · **Who:** Fresher

#### 9.5 Shared data table, filter panel and JSON viewer

A virtualised table, a reusable filter panel that reads and writes URL query parameters, and a collapsible searchable JSON tree viewer for vendor payloads.

* **Acceptance:** Table renders one hundred thousand rows without lag. Filter state survives a page reload and can be shared as a link. JSON viewer handles a deeply nested payload.
* **Depends on:** 9.3, 9.4
* **Points:** 8 · **Who:** Fresher, senior review

#### 9.6 Frontend test setup

Component test harness with the API mocked, plus one example test per shared primitive.

* **Acceptance:** Tests run in continuous integration.
* **Depends on:** 9.5, 1.8
* **Points:** 3 · **Who:** Fresher

\---

### E10 Alert screens

*The first screens a user sees doing real work. Everything they need already exists by this point.*

**Milestone:** M3 · **Tasks:** 5 · **Points:** 24

**Exit criteria:** A user can find an alert through filters, open it, read the vendor payload and change its status.

#### 10.1 Alert list screen

The columns listed in PRD section 7.2, sorted by priority then time. Default filter applied on load with visible toggles to include medium and low, and to include closed.

* **Acceptance:** Columns match the PRD. Default view shows only open critical and high. Toggles work and are reflected in the URL.
* **Depends on:** 9.5, 8.1
* **Points:** 8 · **Who:** Fresher, senior review

#### 10.2 Alert filter panel and deep linking

Wire the filter panel to every filter the endpoint supports, and make the resulting view shareable as a URL.

* **Acceptance:** Pasting a filtered URL into a new tab reproduces the view exactly.
* **Depends on:** 10.1
* **Points:** 5 · **Who:** Fresher

#### 10.3 Alert detail screen

Normalised fields, timeline of first seen, occurrences and status changes, recommended resolution, notes, and the vendor payload in the JSON viewer.

* **Acceptance:** All fields render. Occurrence timeline matches the occurrences endpoint. Payload is searchable.
* **Depends on:** 10.1, 8.2, 8.4
* **Points:** 5 · **Who:** Fresher

#### 10.4 Alert status change action

Acknowledge, suppress and close from both the list and the detail screen, with conflict handling surfaced to the user.

* **Acceptance:** Status change is visible without a manual reload. A conflict shows a readable message rather than failing silently.
* **Depends on:** 10.3, 8.3
* **Points:** 3 · **Who:** Fresher

#### 10.5 Unmapped alerts view

A dedicated entry point listing alerts with no resolved component, so an administrator can see which mapping is missing.

* **Acceptance:** View lists only unmapped alerts and links to the hierarchy screen.
* **Depends on:** 10.1, 8.5
* **Points:** 3 · **Who:** Fresher

\---

### E11 Correlation

*Grouping related alerts. Deliberately late, because it needs real alerts in the index to be tuned against and it is the least specified part of the product.*

**Milestone:** M4 · **Tasks:** 7 · **Points:** 37

**Exit criteria:** Alerts sharing a rule identifier or similar wording in the same application are grouped, and the reason is visible in the UI.

#### 11.1 Candidate selection query

Filter to open alerts in the same application subtree using a term query on ancestors, within the configured time window.

* **Acceptance:** Candidate set excludes closed alerts, other applications and alerts outside the window. Query returns in under two hundred milliseconds at one hundred thousand open alerts.
* **Depends on:** 8.1, 0.4
* **Points:** 5 · **Who:** Fresher, senior review

#### 11.2 Scoring query

The four signals in PRD section 6.6: a boosted term match on vendor\_rule\_id, a more\_like\_this query over summary and description with min\_term\_freq, min\_doc\_freq, max\_query\_terms and minimum\_should\_match exposed as configuration, a component term match, and a date decay on source\_timestamp.

* **Acceptance:** All four signals configurable without a code change. Two alerts sharing a CWE identifier score above two alerts sharing only common words.
* **Depends on:** 11.1
* **Points:** 8 · **Who:** Senior or lead

#### 11.3 Score calibration harness

A script that runs the scoring query over a labelled set of real alerts and reports how a given threshold performs, plus a normalisation of the score against a control query. Relevance scores are not comparable across queries, so a fixed threshold behaves differently on a noisy application than a quiet one.

* **Acceptance:** Harness produces a report for a candidate threshold. A recommended starting threshold and normalisation approach is documented and reviewed.
* **Depends on:** 11.2, 0.2
* **Points:** 8 · **Who:** Senior or lead

#### 11.4 Group assignment

Join the top-scoring group above the threshold, or create a new group. Persist the winning signals and their scores to correlation\_group.match\_reason so the grouping can be explained.

* **Acceptance:** A third related alert joins the existing group rather than creating a new one. match\_reason names which signals fired.
* **Depends on:** 11.3, 2.6
* **Points:** 5 · **Who:** Fresher, senior review

#### 11.5 Correlation stage in the pipeline

Wire group assignment in as stage five of the ingestion pipeline, writing the group identifier onto the alert document.

* **Acceptance:** A batch of related alerts produces one group. Replay does not duplicate groups.
* **Depends on:** 11.4, 7.6
* **Points:** 5 · **Who:** Fresher, senior review

#### 11.6 Correlation group API

List and detail endpoints. Detail returns the group with its alerts from the search engine and its match reason from Postgres.

* **Acceptance:** alert\_count on the detail response is recomputed from the index rather than trusted from the cached column.
* **Depends on:** 11.5
* **Points:** 3 · **Who:** Fresher

#### 11.7 Correlation display on the alert detail screen

Show the group, the related alerts and a readable explanation of why they were grouped.

* **Acceptance:** A grouped alert shows its siblings and the matching signals in plain language.
* **Depends on:** 11.6, 10.3
* **Points:** 3 · **Who:** Fresher

\---

### E12 Incidents and Jira

*Turning groups into incidents and raising one Jira issue each. Depends on correlation groups existing.*

**Milestone:** M4 · **Tasks:** 9 · **Points:** 45

**Exit criteria:** A correlated group becomes an incident with exactly one Jira issue, and a retried request does not create a second.

#### 12.1 Incident creation from a correlation group

Insert the incident, relying on the unique constraint on correlation\_group\_id to reject a concurrent duplicate rather than checking first and racing.

* **Acceptance:** Two simultaneous requests produce one incident and one clean rejection. Priority inherited from the highest-priority alert in the group.
* **Depends on:** 11.6, 2.6, 0.5
* **Points:** 5 · **Who:** Fresher, senior review

#### 12.2 Manual incident creation from selected alerts

Create an incident from an explicit list of alert references, for the manual path described on the call.

* **Acceptance:** Selected alerts are attached to the new incident. Alerts already on an incident are rejected with a readable message.
* **Depends on:** 12.1
* **Points:** 5 · **Who:** Fresher

#### 12.3 Incident API

List, detail and update. Detail combines the incident row from Postgres with its alerts from the search engine.

* **Acceptance:** List filters by application, priority and status. Update covers status and owner with an audit row.
* **Depends on:** 12.2, 2.17
* **Points:** 5 · **Who:** Fresher

#### 12.4 Jira client

Create an issue, update an issue and apply a named transition, using the configuration from decision 0.6. Retries on transient failure, and every call logged to the integration event index.

* **Acceptance:** Issue created in the test project. Transient failure is retried. A retried create does not produce two issues.
* **Depends on:** 12.3, 0.6, 2.15
* **Points:** 8 · **Who:** Fresher, senior review

#### 12.5 Jira issue body composition

Build the issue body from the incident summary, impacted application and components, priority, the contributing alerts with their source references, and a deep link back to the VistaIQ incident.

* **Acceptance:** A rendered issue contains every element and the link resolves. Reviewed by the product owner against the BRD list.
* **Depends on:** 12.4
* **Points:** 3 · **Who:** Fresher

#### 12.6 Incident to alert projection

Register the projection that writes incident\_id and jira\_issue\_key onto the incident's alert documents.

* **Acceptance:** Alerts show their incident and Jira key within one worker cycle of incident creation.
* **Depends on:** 12.4, 4.3, 5.10
* **Points:** 3 · **Who:** Fresher

#### 12.7 Jira issue update on new correlated alerts

When an alert joins a group that already has an incident, update the existing Jira issue rather than raising a new one.

* **Acceptance:** A new alert on an existing incident adds a comment or updates the description. No second issue is created under any path.
* **Depends on:** 12.6, 11.5
* **Points:** 5 · **Who:** Fresher, senior review

#### 12.8 Incident list and detail screens

List with filters. Detail showing summary, impacted application and services, contributing alerts, timeline, priority, status, owner, resolution progress and the linked Jira issue.

* **Acceptance:** Screens match PRD section 7.2. The Jira link opens the issue.
* **Depends on:** 12.3, 9.5
* **Points:** 8 · **Who:** Fresher

#### 12.9 Group alerts into an incident from the alert list

Bulk selection in the alert list with an action creating an incident from the selection.

* **Acceptance:** Selecting five alerts and confirming produces one incident containing all five.
* **Depends on:** 12.8, 10.2, 12.2
* **Points:** 3 · **Who:** Fresher

\---

### E13 Status reconciliation

*Closing the loop. The source tool detects its own resolution, VistaIQ observes it, closes the alert and transitions the Jira issue. Depends on incidents existing.*

**Milestone:** M4 · **Tasks:** 6 · **Points:** 31

**Exit criteria:** A Veracode issue resolved in the source tool results in a closed alert and a transitioned Jira issue without manual intervention.

#### 13.1 Source status reconciliation pass

For a given source, fetch the current state of the alerts VistaIQ holds open, and close those the source now reports as resolved. VistaIQ never pushes a resolution to the source, per the call.

* **Acceptance:** An alert resolved in Veracode is closed in VistaIQ on the next pass, with closed\_at set. A pass over one thousand open alerts completes within the poll interval.
* **Depends on:** 7.10, 6.4, 8.3
* **Points:** 8 · **Who:** Fresher, senior review

#### 13.2 Incident status derivation

Recompute incident status from the state of its alerts. An incident whose alerts are all closed becomes resolved.

* **Acceptance:** Closing the last open alert resolves the incident. Status is eventually consistent and the UI does not present it as guaranteed to agree with the alert list.
* **Depends on:** 13.1, 12.3
* **Points:** 5 · **Who:** Fresher, senior review

#### 13.3 Jira transition on incident closure

Apply the configured closure transition when an incident resolves, and record the outcome.

* **Acceptance:** Jira issue moves to the configured state. A failed transition is retried and surfaced rather than silently dropped.
* **Depends on:** 13.2, 12.4
* **Points:** 3 · **Who:** Fresher

#### 13.4 Recurrence handling

Decide and implement what happens when a closed alert recurs: reopen the existing alert and its Jira issue, or create a new one. Behaviour comes from decision 0.6.

* **Acceptance:** Implemented behaviour matches the recorded decision and is covered by a test.
* **Depends on:** 13.3, 0.6
* **Points:** 5 · **Who:** Fresher, senior review

#### 13.5 Reconciliation sync run recording

Record every reconciliation pass in sync\_run with its closed count.

* **Acceptance:** Every pass leaves one row, including failures.
* **Depends on:** 13.1, 2.9
* **Points:** 2 · **Who:** Fresher

#### 13.6 Drift reconciliation checks

Implement the checks in the skeleton from task 4.6: alerts referencing a deleted component, denormalised names differing from current configuration, stale correlation group counts, and incidents whose status disagrees with their alerts. Each check reports and repairs.

* **Acceptance:** Each check is proven by deliberately introducing the corresponding drift and confirming the job detects and repairs it.
* **Depends on:** 4.6, 13.2, 5.10
* **Points:** 8 · **Who:** Fresher, senior review

\---

### E14 Dashboards

*The aggregate views. Late because they need populated alerts and incidents to be meaningful or testable.*

**Milestone:** M5 · **Tasks:** 6 · **Points:** 35

**Exit criteria:** The executive dashboard tiles reconcile with the alert list under the same filters.

#### 14.1 Executive dashboard endpoint

One size-zero search with aggregations producing the eight tiles in PRD section 7.2, plus the per-application risk table. Never return alert documents for the client to count.

* **Acceptance:** One search call serves the whole page. Tile figures match the equivalent alert list filters. Response under two seconds. Distinct counts documented as approximate.
* **Depends on:** 8.1, 12.3
* **Points:** 8 · **Who:** Fresher, senior review

#### 14.2 Application dashboard endpoint

Aggregations scoped to an application subtree: active incidents, critical issues, per-service breakdown and recent events.

* **Acceptance:** Figures scoped correctly to the subtree. Selecting a service narrows to that subtree.
* **Depends on:** 14.1
* **Points:** 5 · **Who:** Fresher, senior review

#### 14.3 Trend endpoint

A date histogram of alerts over a time range at hour or day interval, filterable by application and source.

* **Acceptance:** Buckets align to the requested interval. Empty buckets are returned rather than omitted.
* **Depends on:** 14.1
* **Points:** 3 · **Who:** Fresher

#### 14.4 Executive dashboard screen

The eight tiles, the application risk table and the trend chart. This is the landing page after sign-in.

* **Acceptance:** Matches PRD section 7.2. Tiles link through to the equivalent filtered alert list.
* **Depends on:** 14.1, 14.3, 9.5
* **Points:** 8 · **Who:** Fresher

#### 14.5 Application dashboard screen and tree

Component tree in the left pane, application dashboard on the right, with supporting infrastructure as a panel inside the application view rather than top-level navigation.

* **Acceptance:** Selecting a node updates the dashboard. Navigation flows from application to infrastructure, never the reverse.
* **Depends on:** 14.2, 5.5, 9.5
* **Points:** 8 · **Who:** Fresher

#### 14.6 Health status field

Implement whatever decision 0.9 produced, or remove the field from both dashboards if it was deferred.

* **Acceptance:** Either a documented formula is implemented and tested, or the field is absent with the decision referenced.
* **Depends on:** 14.5, 0.9
* **Points:** 3 · **Who:** Fresher, senior review

\---

### E15 Configuration screens and search

*The administrative user interface for everything epic 5 exposed, plus global search. Late because the APIs and shared components must exist first.*

**Milestone:** M5 · **Tasks:** 6 · **Points:** 29

**Exit criteria:** An administrator can complete the entire setup without touching the API directly.

#### 15.1 Monitoring source screens

List with connection status and last successful sync. Create and edit form with a test connection action. Credentials are write-only in the interface.

* **Acceptance:** A source can be registered and tested end to end. Existing credentials are never displayed.
* **Depends on:** 5.3, 9.5
* **Points:** 5 · **Who:** Fresher

#### 15.2 Application hierarchy tree editor

Create, rename, delete and move by drag. Because a move triggers a background rewrite of alert documents, the affected nodes show a pending state until the projection completes.

* **Acceptance:** A four-level hierarchy can be built entirely in the interface. A move shows pending and clears when the projection finishes. A rejected move shows why.
* **Depends on:** 5.5, 5.6, 9.5
* **Points:** 8 · **Who:** Fresher, senior review

#### 15.3 Mapping side panel

Manage source mappings for the selected component, with the unmapped alert count linking to the filtered alert list.

* **Acceptance:** A mapping added here causes the next matching alert to resolve. Unmapped count decreases accordingly.
* **Depends on:** 15.2, 5.7, 10.5
* **Points:** 5 · **Who:** Fresher

#### 15.4 Deduplication policy screens

List and form for global and per-source policies.

* **Acceptance:** A policy change alters deduplication behaviour on the next ingestion run.
* **Depends on:** 5.8, 9.5
* **Points:** 3 · **Who:** Fresher

#### 15.5 Saved views

Save the current alert filter set as a named view, list views, apply and delete them.

* **Acceptance:** A saved view reproduces the filter set exactly, including the priority and status toggles.
* **Depends on:** 5.9, 10.2
* **Points:** 3 · **Who:** Fresher

#### 15.6 Global search

One endpoint resolving application, service, incident reference, alert reference, source and tags across both stores, and the interface for it.

* **Acceptance:** Each of the six entity types is findable. Results are grouped by type and link to the right screen.
* **Depends on:** 12.3, 8.1, 5.5, 9.5
* **Points:** 5 · **Who:** Fresher, senior review

\---

### E16 Remaining source adapters

*The other integrations, following the same contract as Veracode. Scope follows procurement, not the BRD example list.*

**Milestone:** M5 · **Tasks:** 3 · **Points:** 16

**Exit criteria:** Each confirmed source ingests, resolves and correlates alongside Veracode.

#### 16.1 GitHub and Dependabot adapter

Implement the three-method contract. Extract the advisory identifier as vendor\_rule\_id. Declare repository as a resolve key.

* **Acceptance:** Real payloads normalise and resolve. Correlation groups a Dependabot alert with a Veracode alert sharing the same rule identifier.
* **Depends on:** 7.6, 11.5, 0.2
* **Points:** 8 · **Who:** Fresher, senior review

#### 16.2 Dynatrace adapter

Implement the three-method contract for production monitoring payloads. Extract the problem type as vendor\_rule\_id. Declare pod, cluster and service identifiers as resolve keys, since this is the reverse-mapping case described on the call.

* **Acceptance:** An infrastructure alert naming a pod resolves to the correct application and component. Reviewed by the lead, as it is the least understood source.
* **Depends on:** 16.1
* **Points:** 8 · **Who:** Senior or lead

#### 16.3 Adapters for newly procured tools

Placeholder for the remaining sources. Roughly half the tools in the BRD are not yet procured, so this task cannot be estimated until decision 0.2 is extended to cover them.

* **Acceptance:** One sub-task raised per confirmed tool, each following the pattern of 16.1.
* **Depends on:** 16.2
* **Points:** not estimable yet · **Who:** Senior or lead

\---

### E17 Orchestration, hardening and handover

*Scheduling, burst protection and everything needed to run the system rather than demonstrate it.*

**Milestone:** M5 · **Tasks:** 5 · **Points:** 37

**Exit criteria:** The system survives a burst at the target volume and can be deployed by someone who did not build it.

#### 17.1 Orchestrator integration

Wire the chosen workflow engine to the poll schedules and the reconciliation passes, with retry and backoff per source. The API keeps no scheduler.

* **Acceptance:** Each enabled source polls on its configured interval. A failing source retries without blocking others.
* **Depends on:** 7.9, 13.5
* **Points:** 8 · **Who:** Senior or lead

#### 17.2 Durable queue in front of ingestion

Buffer incoming alerts so a burst cannot be dropped. The previous system failed under a burst of thousands of alerts, so this is a requirement rather than an optimisation.

* **Acceptance:** A burst of ten thousand alerts in one minute is fully ingested with none lost, though not necessarily immediately.
* **Depends on:** 17.1
* **Points:** 8 · **Who:** Senior or lead

#### 17.3 Deployment and migration ordering

Container images, environment configuration per stage, and a deployment sequence that runs Alembic and then the index bootstrap in the correct order. A partial deployment must not leave the projection worker writing fields absent from the mapping.

* **Acceptance:** A clean environment can be brought up from the documented sequence. Rollback procedure written and tested once.
* **Depends on:** 2.13, 4.2
* **Points:** 8 · **Who:** Senior or lead

#### 17.4 Load test at target volume

Exercise ingestion, the alert list and the dashboards at the volume from decision 0.7, and confirm the non-functional targets in the PRD.

* **Acceptance:** Documented results against each target, with any shortfall raised as its own task.
* **Depends on:** 17.2, 14.4
* **Points:** 8 · **Who:** Senior or lead

#### 17.5 Runbook and handover documentation

How to add a source, how to interpret a stalled outbox queue, how to rerun a reconciliation, how to apply a mapping change, and the known limitations from PRD section 8.

* **Acceptance:** A team member who did not build the system completes each procedure using only the runbook.
* **Depends on:** 17.3, 13.6
* **Points:** 5 · **Who:** Fresher, senior review

\---

## 5\. Importing into Jira

The companion file `VistaIQ-WBS-Jira-Import.csv` is ready for the Jira external
system import. It contains 18 epic rows followed by 128 story
rows, in sequence order.

Field mapping when the importer asks:

|CSV column|Map to|
|-|-|
|Issue Type|Issue Type|
|Issue Id|Issue Id|
|Parent Id|Parent Id|
|WBS|a text custom field, or Labels if you have none|
|Summary|Summary|
|Description|Description|
|Acceptance Criteria|a text custom field, or append to Description|
|Story Points|Story Points|
|Labels|Labels, all three columns|
|Sequence|a number custom field used as the backlog sort|
|Milestone|Sprint, or a select custom field|
|Link "is blocked by"|Link, all columns|

Two practical notes. Import the file once as a whole rather than epic by epic, so the
parent and link references resolve. And if the link columns give trouble, drop them
and sort the backlog by Sequence instead; the order alone preserves the dependency
discipline, which is the point of it.

Task 16.3 carries no estimate on purpose. Roughly half the tools named in the BRD are
not yet procured, so it stays as an unestimated placeholder until decision 0.2 is
extended to cover them.

\---

## 6\. Gaps in this WBS

These are risks to the plan rather than to the product. The product gaps are in PRD
section 8 and are represented here as epic E00.

**Epic E00 blocks more than it looks like it does.** Ten decisions gate fourteen
tasks across six epics. Two are on the critical path early: the search engine choice
blocks task 1.1, and the shard count blocks task 2.13. If E00 is not closed in the
first week, M1 slips and everything after it moves with it.

**The call set an expectation of ten to twelve days.** That figure was about standing
up a demonstration instance of the existing product, not about building this one.
This WBS totals 549 points. At three or four people with AI
tooling, M3, the first demonstrable system, is realistically two to three months, and
the full scope considerably more. The gap between these two numbers should be
surfaced to the client before commitments are made, not after.

**Sample payloads are the single largest schedule risk.** Task 0.2 blocks the
Veracode adapter, the correlation weights, the calibration harness and both remaining
adapters. Synthetic fixtures in task 6.2 keep work moving, but anything built against
them needs revalidating against real payloads. Getting 0.2 done early removes more
risk than any other single action.

**Correlation quality cannot be estimated.** Tasks 11.2 and 11.3 are pointed as
implementation work. Whether the result is good enough is unknown until it runs on
real alerts, and tuning iterations are not in these numbers. Treat the first
correlation release as a first draft and budget a follow-up.

**No estimate is included for review capacity.** 51 tasks
require senior review and 19 require senior execution. With
one senior available, that person is the constraint through M1 and M4. If the team is
mostly freshers, review time needs its own allocation or it will silently become the
bottleneck.

**Non-functional verification sits at the end.** Task 17.4 is the first point at which
the performance targets are actually tested. A shortfall found there can reach back
into the alert mapping and the shard count, which are decided in task 2.13. Consider
a smaller load check straight after M3 to find that class of problem earlier.

**Environment access is assumed, not scheduled.** The team needs a test Jira project,
an Entra tenant registration, and read access to the source tools. None of these is a
task here because none is development work, but each can block a fresher for days.
Confirm all three before M2.

