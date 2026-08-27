# Support Ticket & SLA Tracker

A full-stack Support Ticket & SLA Tracker built as a focused MVP for the Burdenoff Product Engineering Intern take-home assignment.

The application allows reporters to create support tickets and agents to assign, comment on, update, and resolve them while tracking SLA deadlines using business hours.

## Features

* User authentication with JWT
* Reporter and Agent roles
* Create and manage support tickets
* Ticket assignment
* Ticket comments
* First-response tracking
* Ticket status lifecycle
* Business-hour SLA calculation
* SLA states:

  * ON_TRACK
  * AT_RISK
  * BREACHED
* SLA remaining business time
* Weekend and holiday handling
* Timezone-aware SLA calculations
* Cursor-based ticket pagination
* Filtering by status, priority, assignee, and SLA state
* Dashboard statistics
* Responsive React frontend
* Automated SLA/business-rule tests
* PostgreSQL integration test
* Prisma migrations and seed data

## Tech Stack

### Backend

* Bun
* TypeScript
* GraphQL Yoga
* GraphQL schema-first `.graphql` files
* PostgreSQL
* Prisma
* JWT authentication
* Argon2/bcrypt password hashing
* Luxon for timezone-aware time calculations

### Frontend

* React
* TypeScript
* Vite

### Infrastructure

* Docker Compose
* PostgreSQL

## Architecture

```text
React Frontend
      |
      | GraphQL
      v
GraphQL Yoga
      |
      v
Resolvers
      |
      +----------------+
      |                |
      v                v
 Auth Service      Ticket Service
                       |
                       v
                   SLA Service
                       |
          +------------+-------------+
          |                          |
          v                          v
   SLA Calculator            Business Calendar
                                     |
                                     v
                                  Holidays
                       |
                       v
                    Prisma
                       |
                       v
                  PostgreSQL
                       |
                     Docker
```

GraphQL resolvers are kept thin. Authentication, ticket business rules, and SLA calculations are implemented in dedicated services/modules.

## Database Schema

The application uses four core models.

### User

Stores application users.

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

### Ticket

Stores support tickets.

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

### Comment

Stores comments belonging to tickets.

```text
Comment
- id
- content
- ticketId
- authorId
- createdAt
```

### Holiday

Stores configured holidays used by the SLA engine.

```text
Holiday
- id
- date
- name
- createdAt
```

## Authentication and Authorization

Authentication uses JWT tokens.

Passwords are never stored in plaintext. They are securely hashed before being stored.

Supported roles:

```text
REPORTER
AGENT
```

Current permissions:

```text
REPORTER
- create tickets
- comment on their own tickets

AGENT
- create tickets
- comment
- assign tickets
- change ticket status
- resolve tickets
```

Authorization is enforced on the backend rather than relying on frontend UI restrictions.

## Ticket Lifecycle

The ticket state machine is intentionally simple for this MVP:

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

Invalid transitions are rejected server-side.

For example:

```text
OPEN -> RESOLVED
```

is rejected because the ticket must first move to `IN_PROGRESS`.

A transition from:

```text
CLOSED -> IN_PROGRESS
```

is also rejected.

The API returns a machine-readable error code such as:

```text
INVALID_STATUS_TRANSITION
```

## SLA Calculation

SLA time is measured using business hours rather than wall-clock time.

### Business Hours

```text
Monday - Friday
09:00 - 18:00

Saturday - Sunday
Closed
```

The configured business timezone is:

```text
Asia/Kolkata
```

The timezone is configurable through:

```text
BUSINESS_TIMEZONE
```

### SLA Policies

| Priority | First Response    | Resolution        |
| -------- | ----------------- | ----------------- |
| URGENT   | 1 business hour   | 4 business hours  |
| HIGH     | 4 business hours  | 24 business hours |
| MEDIUM   | 8 business hours  | 48 business hours |
| LOW      | 24 business hours | 72 business hours |

### Example

For a HIGH priority ticket created on Friday at 17:00:

```text
Friday
17:00 -> 18:00 = 1 business hour

Saturday
0 hours

Sunday
0 hours

Monday
09:00 -> 12:00 = 3 business hours
```

Therefore:

```text
First response deadline = Monday 12:00
```

### Holidays

Configured holidays do not consume SLA time.

For example, if Monday is a holiday:

```text
Friday -> partial business time
Saturday -> 0
Sunday -> 0
Monday -> 0
Tuesday -> business hours resume
```

The holiday calendar is retrieved from PostgreSQL and used by the SLA service.

### Timezone Handling

Database timestamps are stored in UTC.

Business-hour calculations are performed in the configured business timezone.

The API returns timestamps in an unambiguous ISO 8601 format.

The frontend displays timestamps using the user's local timezone.

### SLA States

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

### SLA Freezing

Once a first response occurs:

```text
firstResponseAt
```

is recorded and the first-response SLA clock stops.

Once the ticket is resolved:

```text
resolvedAt
```

is recorded and the resolution SLA clock stops.

A completed SLA cannot later become breached simply because time continues to pass.

## First Response

A comment from someone other than the ticket reporter counts as the first response.

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

Subsequent comments do not modify this timestamp.

## GraphQL API

### Queries

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

### Mutations

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

## Cursor Pagination

Ticket listing uses cursor-based pagination.

Example:

```graphql
query {
  tickets(take: 10) {
    nodes {
      id
      title
    }

    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
```

The returned `endCursor` can be supplied to retrieve the next page.

## Filtering

Tickets can be filtered by:

```text
status
priority
assigneeId
slaState
```

## Dashboard

The dashboard exposes:

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

The frontend displays these backend-provided values directly.

## Frontend

The frontend provides:

* Login
* Dashboard
* Ticket list
* Ticket filters
* Ticket sorting
* Ticket creation
* Ticket details
* Comments
* Ticket assignment
* Status changes
* Ticket resolution
* SLA state
* Remaining SLA time
* Dashboard statistics

The frontend does not independently calculate SLA state. SLA state and remaining SLA time come from the backend.

## Environment Variables

### Backend

Create `backend/.env`:

```env
DATABASE_URL="postgresql://support_user:support_password@localhost:5432/support_ticket_db?schema=public"
JWT_SECRET="replace-with-a-secure-secret"
BUSINESS_TIMEZONE="Asia/Kolkata"
```

### Frontend

Create `frontend/.env`:

```env
VITE_GRAPHQL_URL=http://localhost:4000/graphql
```

Do not commit actual secrets.

## Setup

### 1. Start PostgreSQL

From the repository root:

```bash
docker compose up -d
```

### 2. Install backend dependencies

```bash
cd backend
bun install
```

### 3. Run Prisma migrations

```bash
bunx prisma migrate dev
```

### 4. Generate Prisma Client

```bash
bunx prisma generate
```

### 5. Seed the database

```bash
bunx prisma db seed
```

### 6. Start the backend

```bash
bun run dev
```

The GraphQL API runs at:

```text
http://localhost:4000/graphql
```

### 7. Install frontend dependencies

Open another terminal:

```bash
cd frontend
bun install
```

### 8. Start the frontend

```bash
bun run dev
```

The frontend runs at the URL shown by Vite, normally:

```text
http://localhost:5173
```

## Demo Credentials

Use the seeded demo credentials documented in the project seed configuration.

Example:

```text
Reporter
reporter@example.com
Password123!

Agent
agent@example.com
Password123!
```

## Testing

Run the complete backend test suite:

```bash
cd backend
bun test
```

Run TypeScript checking:

```bash
bun run typecheck
```

Run the integration test against Docker PostgreSQL:

```bash
bun test tests/integration
```

The integration test uses a real PostgreSQL database rather than mocking Prisma or PostgreSQL.

## Important Test Cases

The SLA test suite covers:

* Normal weekday calculation
* Ticket created before business hours
* Ticket created after business hours
* Weekend
* Friday evening
* Public holiday
* Weekend + holiday
* Multiple business days
* First-response SLA
* Resolution SLA
* ON_TRACK
* AT_RISK
* BREACHED
* Completed SLA freezing

Business logic tests also cover:

* Ticket creation
* Validation
* Status transitions
* Assignment
* First-response recording
* Comment creation
* Authorization

## Error Handling

Expected business errors are represented using machine-readable GraphQL error codes.

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

The frontend displays these errors instead of exposing raw server errors to the user.

## Project Structure

```text
support-ticket-sla/
├── backend/
│   ├── src/
│   │   ├── auth/
│   │   ├── errors/
│   │   ├── graphql/
│   │   ├── tickets/
│   │   ├── sla/
│   │   ├── users/
│   │   ├── holidays/
│   │   ├── context.ts
│   │   ├── db.ts
│   │   └── server.ts
│   ├── prisma/
│   │   ├── migrations/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   └── tests/
│       ├── unit/
│       └── integration/
│
├── frontend/
│   └── src/
│       ├── api/
│       ├── components/
│       ├── pages/
│       ├── types/
│       ├── App.tsx
│       ├── main.tsx
│       └── index.css
│
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

## Tradeoffs

This project intentionally keeps the architecture simple because it is an MVP take-home assignment.

Examples:

* SLA state is calculated server-side rather than stored as mutable database state.
* SLA filtering is performed in application code after retrieving the relevant ticket set.
* The frontend uses a lightweight GraphQL fetch wrapper instead of a larger GraphQL client.
* The project uses one configured business calendar rather than multiple team-specific calendars.
* Real-time updates and notifications are not implemented.

These choices keep the implementation focused on the required business behavior.

## Known Limitations

* No SLA pause while waiting for a customer
* No escalation or notification system
* No audit log
* No per-team business calendars
* No live WebSocket updates
* No advanced reporting or agent performance metrics

## How I'd Extend This

With additional time, I would add:

1. SLA pause/resume for `WAITING_ON_CUSTOMER`
2. Escalation and notification rules
3. Audit logging for status and assignment changes
4. Per-team business calendars
5. Agent performance metrics

## License

This project was created as part of the Burdenoff Product Engineering Intern take-home assignment.
