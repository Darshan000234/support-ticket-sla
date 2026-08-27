# Support Ticket & SLA Tracker

A full-stack Support Ticket & SLA Tracker built as a focused MVP for the Burdenoff Product Engineering Intern take-home assignment.

The application models a simple support workflow where reporters create tickets and agents manage, assign, respond to, and resolve them.

The key business rule is SLA tracking based on **business hours rather than wall-clock time**. Nights, weekends, and configured holidays do not consume SLA time.

---

## Features

* JWT-based authentication
* Reporter and Agent roles
* Secure password hashing
* Create support tickets
* Ticket assignment to agents
* Ticket comments
* First-response tracking
* Ticket status lifecycle
* Business-hour SLA calculation
* First-response and resolution SLAs
* SLA states:

  * `ON_TRACK`
  * `AT_RISK`
  * `BREACHED`
* Remaining SLA time in business minutes
* Weekend handling
* Configured holiday handling
* Configurable business timezone
* Cursor-based ticket pagination
* Ticket filtering by:

  * status
  * priority
  * assignee
  * SLA state
* Ticket sorting in the frontend
* Dashboard statistics
* Responsive React frontend
* Server-side validation
* Server-side authorization
* Machine-readable GraphQL errors
* Automated SLA and business-rule tests
* PostgreSQL integration test using Docker
* Prisma migrations
* Prisma seed data

## These features correspond to the core requirements in the assignment.

# Tech Stack

## Frontend

* React
* TypeScript
* Vite
* Browser Fetch API for GraphQL requests

The frontend is a React + TypeScript application. React is used to build the login page, dashboard, ticket list, ticket detail view, ticket creation form, comment thread, filters, assignment controls, status controls, and SLA display.

The frontend does **not** implement SLA business calculations. It consumes SLA state and remaining time returned by the backend.

## Backend

* Bun
* TypeScript
* GraphQL Yoga
* Schema-first GraphQL
* PostgreSQL
* Prisma
* JWT authentication
* Argon2/bcrypt password hashing
* Luxon for timezone-aware SLA calculations

The GraphQL API is schema-first: GraphQL types are defined in `.graphql` files and resolver implementations are kept separately in TypeScript, as required by the assignment.

## Infrastructure

* Docker Compose
* PostgreSQL

---

# Architecture

```text
                         React + TypeScript
                                │
                                │ GraphQL
                                ▼
                         GraphQL Yoga API
                                │
                                ▼
                           Resolvers
                                │
              ┌─────────────────┼─────────────────┐
              │                 │                 │
              ▼                 ▼                 ▼
        Auth Service      Ticket Service      SLA Service
              │                 │                 │
              │                 │         ┌───────┴────────┐
              │                 │         │                │
              │                 │         ▼                ▼
              │                 │   SLA Calculator   Business Calendar
              │                 │                           │
              │                 │                           ▼
              │                 │                       Holidays
              │                 │
              └─────────────────┼──────────────────────────┘
                                ▼
                              Prisma
                                │
                                ▼
                           PostgreSQL
                                │
                              Docker
```

The implementation keeps GraphQL resolvers thin.

Business logic is separated into services/modules:

```text
Auth
Tickets
SLA
Business Calendar
Validation / Errors
```

This keeps the SLA calculation independently testable and prevents business logic from being embedded directly inside GraphQL resolvers. The assignment explicitly asks for this separation, particularly for SLA/business-hours logic.

---

# Project Structure

```text
support-ticket-sla/
│
├── backend/
│   ├── src/
│   │   ├── auth/
│   │   │   ├── authorization.ts
│   │   │   ├── auth.service.ts
│   │   │   └── auth.types.ts
│   │   │
│   │   ├── errors/
│   │   │   └── app-error.ts
│   │   │
│   │   ├── graphql/
│   │   │   ├── schema/
│   │   │   │   ├── auth.graphql
│   │   │   │   ├── common.graphql
│   │   │   │   └── ticket.graphql
│   │   │   │
│   │   │   └── resolvers/
│   │   │
│   │   ├── tickets/
│   │   │   ├── cursor.ts
│   │   │   ├── ticket.rules.ts
│   │   │   └── ticket.service.ts
│   │   │
│   │   ├── sla/
│   │   │   ├── sla-policy.ts
│   │   │   ├── business-calendar.ts
│   │   │   ├── business-hours.ts
│   │   │   ├── sla-calculator.ts
│   │   │   └── sla.service.ts
│   │   │
│   │   ├── users/
│   │   ├── holidays/
│   │   ├── context.ts
│   │   ├── db.ts
│   │   └── server.ts
│   │
│   ├── prisma/
│   │   ├── migrations/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   │
│   └── tests/
│       ├── unit/
│       └── integration/
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── graphql.ts
│   │   │   └── queries.ts
│   │   │
│   │   ├── components/
│   │   │   ├── DashboardStats.tsx
│   │   │   ├── TicketFilters.tsx
│   │   │   ├── TicketTable.tsx
│   │   │   ├── TicketDetails.tsx
│   │   │   ├── CommentThread.tsx
│   │   │   └── CreateTicketForm.tsx
│   │   │
│   │   ├── pages/
│   │   │   ├── Login.tsx
│   │   │   └── Dashboard.tsx
│   │   │
│   │   ├── types/
│   │   │   └── graphql.ts
│   │   │
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   │
│   └── package.json
│
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

---

# Database Schema

The application uses four core models required by the assignment:

* `User`
* `Ticket`
* `Comment`
* `Holiday`

## User

```text
User
- id
- name
- email
- passwordHash
- role
- createdAt
- updatedAt
```

Roles:

```text
REPORTER
AGENT
```

## Ticket

```text
Ticket
- id
- title
- description
- priority
- status
- reporterId
- assigneeId
- createdAt
- firstResponseAt
- resolvedAt
- firstResponseDueAt
- resolutionDueAt
- updatedAt
```

Relationships:

```text
Ticket
 ├── reporter
 ├── assignee
 └── comments
```

## Comment

```text
Comment
- id
- content
- ticketId
- authorId
- createdAt
```

Every comment belongs to a ticket and records its author.

## Holiday

```text
Holiday
- id
- date
- name
- createdAt
```

Configured holidays are used by the SLA engine and therefore directly affect deadline calculations.

---

# Authentication and Authorization

Authentication uses JWT tokens.

Passwords are never stored as plaintext. They are hashed before being persisted.

Supported roles:

```text
REPORTER
AGENT
```

## Reporter permissions

```text
- create tickets
- comment on their own tickets
```

## Agent permissions

```text
- create tickets
- comment
- assign tickets
- change ticket status
- resolve tickets
```

Authorization is enforced server-side rather than relying on frontend controls.

The assignment explicitly requires server-side authentication and authorization.

---

# Ticket Lifecycle

The ticket lifecycle is intentionally simple:

```text
OPEN
  |
  v
IN_PROGRESS
  |
  v
RESOLVED
  |
  v
CLOSED
```

Valid transitions include:

```text
OPEN -> IN_PROGRESS
IN_PROGRESS -> RESOLVED
RESOLVED -> CLOSED
```

Invalid transitions are rejected server-side.

For example:

```text
OPEN -> RESOLVED
```

is rejected because the ticket must first move to `IN_PROGRESS`.

Likewise:

```text
CLOSED -> IN_PROGRESS
```

is rejected.

The API returns a machine-readable error such as:

```text
INVALID_STATUS_TRANSITION
```

The transition rules are enforced by backend business logic rather than by the frontend.

---

# First Response Tracking

A comment from someone other than the reporter counts as the first response.

Example:

```text
Reporter -> Comment
Reporter -> Comment
Agent    -> Comment
```

The first agent/non-reporter comment sets:

```text
firstResponseAt
```

Subsequent comments do not modify the value.

Therefore:

```text
firstResponseAt
```

is the timestamp of the first response event.

This is required by the assignment.

---

# SLA Engine

SLA is calculated on the server.

The frontend never performs business-hour calculations.

## Business Hours

```text
Monday - Friday
09:00 - 18:00

Saturday - Sunday
Closed
```

There are:

```text
9 business hours
per working day
```

Time outside business hours does not count.

Weekends do not count.

Configured holidays do not count.

## Business Timezone

Default configuration:

```text
Asia/Kolkata
```

Configured through:

```env
BUSINESS_TIMEZONE=Asia/Kolkata
```

The business timezone is configurable through an environment variable.

---

# SLA Policies

| Priority | First Response    | Resolution        |
| -------- | ----------------- | ----------------- |
| URGENT   | 1 business hour   | 4 business hours  |
| HIGH     | 4 business hours  | 24 business hours |
| MEDIUM   | 8 business hours  | 48 business hours |
| LOW      | 24 business hours | 72 business hours |

These are the default SLA values required by the assignment.

---

# Example SLA Calculation

Consider:

```text
Priority: HIGH

Created:
Friday 17:00

First response SLA:
4 business hours
```

Calculation:

```text
Friday
17:00 -> 18:00
= 1 business hour

Saturday
= 0

Sunday
= 0

Monday
09:00 -> 12:00
= 3 business hours
```

Therefore:

```text
First response deadline = Monday 12:00
```

This is the same business-hours example specified in the assignment.

---

# SLA Edge Cases

The SLA engine handles:

```text
- before business hours
- after business hours
- weekends
- Friday evening
- configured holidays
- weekend + holiday
- multi-day SLA calculations
- timezone conversion
```

Examples:

```text
Monday 07:00
```

starts counting at:

```text
Monday 09:00
```

A ticket created at:

```text
Monday 20:00
```

starts counting from:

```text
Tuesday 09:00
```

These behaviors are explicitly required.

---

# SLA States

Each SLA clock has one of:

```text
ON_TRACK
AT_RISK
BREACHED
```

The implementation uses:

```text
<= 75% consumed -> ON_TRACK
> 75% consumed  -> AT_RISK
deadline passed -> BREACHED
```

This boundary is intentionally documented so the behavior at exactly 75% is deterministic.

---

# SLA Freezing

The system has two independent SLA clocks:

```text
First Response SLA
Resolution SLA
```

When the first non-reporter response happens:

```text
firstResponseAt != null
```

the first-response clock stops.

When the ticket is resolved:

```text
resolvedAt != null
```

the resolution clock stops.

A completed SLA cannot later become breached simply because additional wall-clock time passes.

---

# Timezone Handling

Database timestamps are stored in UTC.

Business-hour calculations are performed in the configured business timezone.

API timestamps use an unambiguous ISO 8601 format.

The frontend converts timestamps for local display.

This follows the assignment's timezone requirements.

---

# GraphQL API

## Queries

```graphql
tickets(
  status: TicketStatus
  priority: Priority
  assigneeId: ID
  slaState: SLAState
  take: Int
  cursor: String
): TicketConnection!

ticket(id: ID!): Ticket

dashboard: TicketDashboard!

users(role: UserRole): [User!]!

holidays: [Holiday!]!
```

These cover ticket listing, filtering, pagination, individual ticket lookup, dashboard statistics, users/agents, and holidays.

## Mutations

```graphql
register(
  name: String!
  email: String!
  password: String!
  role: UserRole!
): AuthPayload!

login(
  email: String!
  password: String!
): AuthPayload!

createTicket(
  title: String!
  description: String!
  priority: Priority!
): Ticket!

assignTicket(
  ticketId: ID!
  assigneeId: ID!
): Ticket!

changeTicketStatus(
  ticketId: ID!
  status: TicketStatus!
): Ticket!

addComment(
  ticketId: ID!
  content: String!
): Comment!

resolveTicket(
  ticketId: ID!
): Ticket!
```

These correspond to the required authentication and ticket mutations.

---

# Cursor Pagination

Ticket listing uses cursor-based pagination.

Example:

```graphql
query {
  tickets(take: 10) {
    nodes {
      id
      title
      priority
      status
    }

    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
```

The returned `endCursor` can be used to retrieve the next page.

The assignment requires cursor-based pagination rather than offset pagination.

---

# Filtering

Tickets can be filtered by:

```text
status
priority
assigneeId
slaState
```

The first three can be applied directly when querying PostgreSQL.

`SLAState` is derived by the SLA service because SLA state depends on current time, SLA deadlines, business hours, holidays, and completion state.

For this MVP, SLA filtering is therefore performed in application code after retrieving the relevant candidate tickets.

This is a deliberate simplicity/performance tradeoff appropriate for the take-home scope.

---

# Dashboard

The backend exposes:

```graphql
query {
  dashboard {
    openTickets
    inProgressTickets
    atRiskTickets
    breachedTickets
  }
}
```

The React frontend displays these backend-provided values directly.

The assignment requires a dashboard/summary API and corresponding frontend statistics.

---

# Frontend

The frontend is implemented with **React + TypeScript + Vite**.

## Main UI areas

```text
Login
   ↓
Dashboard
   ├── Dashboard statistics
   ├── Ticket filters
   ├── Ticket list
   └── Create ticket

Ticket details
   ├── Ticket information
   ├── SLA information
   ├── Comments
   ├── Assignment
   ├── Status change
   └── Resolve
```

The frontend displays:

```text
- priority
- status
- assignee
- SLA state
- remaining SLA time
- first response information
- resolution information
```

The assignment explicitly requires these frontend capabilities.

## Backend-Driven SLA

The frontend consumes:

```text
firstResponseState
resolutionState
firstResponseRemainingMinutes
resolutionRemainingMinutes
```

It does not calculate SLA state itself.

For example, if the backend returns:

```json
{
  "resolutionState": "AT_RISK",
  "resolutionRemainingMinutes": 32
}
```

the frontend simply displays:

```text
AT RISK
32m remaining
```

The backend is the source of truth for SLA state.

---

# Error Handling

Expected business failures return machine-readable GraphQL error codes.

Examples:

```text
VALIDATION_ERROR
TICKET_NOT_FOUND
USER_NOT_FOUND
UNAUTHORIZED
FORBIDDEN
INVALID_STATUS_TRANSITION
INVALID_PRIORITY
INVALID_COMMENT
```

The frontend displays these failures as user-facing errors instead of relying on unhandled server errors.

This follows the assignment's error-handling requirements.

---

# Environment Variables

## Backend

Create:

```text
backend/.env
```

```env
DATABASE_URL="postgresql://support_user:support_password@localhost:5432/support_ticket_db?schema=public"
JWT_SECRET="replace-with-a-secure-secret"
BUSINESS_TIMEZONE="Asia/Kolkata"
```

## Frontend

Create:

```text
frontend/.env
```

```env
VITE_GRAPHQL_URL=http://localhost:4000/graphql
```

Do not commit real secrets.

The repository contains `.env.example` files instead. The assignment explicitly requires sensitive configuration to be kept out of version control.

---

# Setup

## 1. Start PostgreSQL

From the repository root:

```bash
docker compose up -d
```

Verify:

```bash
docker compose ps
```

## 2. Install backend dependencies

```bash
cd backend
bun install
```

## 3. Run Prisma migrations

```bash
bunx prisma migrate dev
```

## 4. Generate Prisma Client

```bash
bunx prisma generate
```

## 5. Seed the database

```bash
bunx prisma db seed
```

## 6. Start the backend

```bash
bun run dev
```

GraphQL endpoint:

```text
http://localhost:4000/graphql
```

## 7. Install frontend dependencies

Open another terminal:

```bash
cd frontend
bun install
```

## 8. Start the frontend

```bash
bun run dev
```

Frontend:

```text
http://localhost:5173
```

The setup is intentionally simple and designed around Docker + Prisma + Bun, consistent with the assignment's requested setup flow.

---

# Demo Credentials

Use the seeded demo credentials configured by the project seed.

Typical demo accounts:

```text
Reporter
email: reporter@example.com
password: Password123!

Agent
email: agent@example.com
password: Password123!
```

These credentials are for local demonstration only.

---

# Testing

## Run all backend tests

```bash
cd backend
bun test
```

## Run TypeScript type checking

```bash
bun run typecheck
```

## Run integration tests

Start PostgreSQL first:

```bash
docker compose up -d
```

Then:

```bash
cd backend
bun test tests/integration
```

The integration test uses the real PostgreSQL database running through Docker. PostgreSQL is not mocked for this test.

## Frontend production build

```bash
cd frontend
bun run build
```

---

# Automated Test Coverage

The test suite covers the SLA/business-hour requirements specified by the assignment.

## SLA calculations

* normal weekday
* before business hours
* after business hours
* weekend
* Friday evening
* public holiday
* weekend + holiday combination
* multi-day SLA
* first-response SLA
* resolution SLA
* `ON_TRACK`
* `AT_RISK`
* `BREACHED`
* completed SLA freezing

These cases correspond to the assignment's required unit-test areas.

## Business rules

* ticket creation
* ticket validation
* status transitions
* assignment
* first-response recording
* comment creation
* authorization

The assignment also explicitly requires these business-rule tests.

## Integration test

The PostgreSQL integration test covers:

```text
Create ticket
      ↓
Reporter comment
      ↓
Agent comment
      ↓
firstResponseAt
      ↓
Persisted SLA information
```

This follows the integration scenario suggested in the assignment.

---

# Seed Data

The seed includes:

```text
Users
├── reporter@example.com
└── agent@example.com

Tickets
├── URGENT
├── HIGH
├── MEDIUM
└── LOW

Holidays
└── sample configured holiday
```

This provides enough data to demonstrate the ticket lifecycle, filters, assignment, and SLA behavior.

---

# Design Decisions

## Keep SLA state derived

SLA state is not stored as mutable state such as:

```text
slaState = AT_RISK
```

because the state depends on current time and business-hour calculations.

Instead, the backend calculates the current SLA state from:

```text
createdAt
dueAt
completion timestamp
current time
business calendar
```

This avoids stale SLA state.

## Keep business logic outside resolvers

GraphQL resolvers coordinate requests.

Services implement:

```text
authentication
ticket operations
SLA calculations
authorization
```

This keeps the core logic testable without coupling it to the GraphQL layer.

## Keep the frontend thin

React receives:

```text
SLA state
remaining minutes
ticket state
```

and renders them.

Business-hour calculations stay on the server.

## Keep the project intentionally small

This is an MVP take-home assignment.

The project does not introduce unnecessary infrastructure such as Redis, message queues, microservices, WebSockets, or an elaborate state-management system.

---

# Tradeoffs

This implementation intentionally makes some MVP-oriented tradeoffs.

### SLA filtering

`SLAState` is calculated in application code because it is derived state rather than a stored database field.

A larger system could optimize this using materialized state, indexed deadline queries, or a more sophisticated query strategy.

### Frontend sorting

Sorting is handled in the frontend because the required GraphQL API does not define a sort argument.

For a larger dataset, server-side sorting would be preferable.

### Single business calendar

The current implementation uses one configured business timezone and business calendar.

A production system could support team-specific calendars and regional holidays.

### JWT storage

For this take-home MVP, the frontend stores the access token in browser storage.

A production application could use a more hardened authentication/session design such as secure HTTP-only cookies and stronger session lifecycle controls.

---

# Known Limitations

The following are intentionally not implemented:

* SLA pause while waiting for customer
* escalation notifications
* email notifications
* audit logs
* per-team business calendars
* multiple business timezones
* live WebSocket updates
* advanced analytics
* agent performance metrics

## These are outside the MVP scope and overlap with the extension/bonus ideas suggested in the assignment.

# How I'd Extend This

With more time, I would add:

1. SLA pause/resume for `WAITING_ON_CUSTOMER`
2. SLA escalation and notification rules
3. Audit logs for status and assignment changes
4. Per-team business calendars
5. Agent performance metrics

---

# GraphQL Example

## Login

```graphql
mutation {
  login(
    email: "reporter@example.com"
    password: "Password123!"
  ) {
    token
    user {
      id
      name
      email
      role
    }
  }
}
```

## Create Ticket

```graphql
mutation {
  createTicket(
    title: "Payment failed"
    description: "Customer cannot complete checkout."
    priority: HIGH
  ) {
    id
    title
    priority
    status
    firstResponseAt
    resolvedAt
    sla {
      firstResponseDueAt
      resolutionDueAt
      firstResponseState
      resolutionState
      firstResponseRemainingMinutes
      resolutionRemainingMinutes
    }
  }
}
```

## List Tickets

```graphql
query {
  tickets(
    status: OPEN
    priority: HIGH
    take: 10
  ) {
    nodes {
      id
      title
      priority
      status
      reporter {
        name
      }
      assignee {
        name
      }
      sla {
        firstResponseState
        resolutionState
        firstResponseRemainingMinutes
        resolutionRemainingMinutes
      }
    }

    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
```

## Dashboard

```graphql
query {
  dashboard {
    openTickets
    inProgressTickets
    atRiskTickets
    breachedTickets
  }
}
```

## Add Comment

```graphql
mutation {
  addComment(
    ticketId: "TICKET_ID"
    content: "We are investigating the issue."
  ) {
    id
    content
    createdAt
    author {
      name
      role
    }
  }
}
```

---

# Submission

The assignment asks for:

* Git repository URL
* Pull Request URL
* README
* 5–10 minute walkthrough

The walkthrough should explain:

* overall architecture
* GraphQL schema
* database schema
* SLA calculation
* business-hours handling
* timezone handling
* status transitions
* testing strategy
* important tradeoffs

---

# Final Verification

Before submitting, verify the following:

```text
Infrastructure
[ ] Docker PostgreSQL starts
[ ] Prisma migration works
[ ] Prisma seed works

Backend
[ ] GraphQL Yoga starts
[ ] Login works
[ ] JWT authentication works
[ ] Registration works
[ ] Authorization works
[ ] Validation errors work

Ticket lifecycle
[ ] Create ticket
[ ] Assign ticket
[ ] Add comment
[ ] First response recorded
[ ] Status change
[ ] Resolve ticket
[ ] Close ticket
[ ] Invalid transitions rejected

SLA
[ ] First-response deadline correct
[ ] Resolution deadline correct
[ ] Before-hours calculation correct
[ ] After-hours calculation correct
[ ] Weekend excluded
[ ] Friday evening correct
[ ] Holiday excluded
[ ] Weekend + holiday correct
[ ] Multi-day calculation correct
[ ] ON_TRACK correct
[ ] 75% boundary correct
[ ] AT_RISK correct
[ ] BREACHED correct
[ ] Completed SLA stays completed

Queries
[ ] ticket
[ ] tickets
[ ] status filter
[ ] priority filter
[ ] assignee filter
[ ] SLA filter
[ ] cursor pagination
[ ] dashboard
[ ] users
[ ] holidays

Frontend
[ ] Login
[ ] Dashboard
[ ] Ticket list
[ ] Filters
[ ] Sorting
[ ] Create ticket
[ ] Ticket details
[ ] Comments
[ ] Assignment
[ ] Status change
[ ] Resolve
[ ] SLA display
[ ] Error display
[ ] Responsive layout

Testing
[ ] bun test passes
[ ] integration test passes against Docker PostgreSQL
[ ] backend typecheck passes
[ ] frontend build passes

Git
[ ] meaningful commits
[ ] .env excluded
[ ] .env.example committed
[ ] migration files committed
[ ] README committed
[ ] Pull Request created

Submission
[ ] GitHub repository URL
[ ] Pull Request URL
[ ] Walkthrough video
```
