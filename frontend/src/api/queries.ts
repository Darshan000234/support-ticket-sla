export const LOGIN_MUTATION = `
  mutation Login(
    $email: String!
    $password: String!
  ) {
    login(
      email: $email
      password: $password
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
`;

export const DASHBOARD_QUERY = `
  query Dashboard {
    dashboard {
      openTickets
      inProgressTickets
      atRiskTickets
      breachedTickets
    }
  }
`;

export const USERS_QUERY = `
  query Users($role: UserRole) {
    users(role: $role) {
      id
      name
      email
      role
    }
  }
`;

export const TICKETS_QUERY = `
  query Tickets(
    $status: TicketStatus
    $priority: Priority
    $assigneeId: ID
    $slaState: SLAState
    $take: Int
    $cursor: String
  ) {
    tickets(
      status: $status
      priority: $priority
      assigneeId: $assigneeId
      slaState: $slaState
      take: $take
      cursor: $cursor
    ) {
      nodes {
        id
        title
        description
        priority
        status

        reporter {
          id
          name
          email
        }

        assignee {
          id
          name
          email
        }

        createdAt
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

        comments {
          id
          content
          createdAt

          author {
            id
            name
            role
          }
        }
      }

      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

export const TICKET_QUERY = `
  query Ticket($id: ID!) {
    ticket(id: $id) {
      id
      title
      description
      priority
      status

      reporter {
        id
        name
        email
      }

      assignee {
        id
        name
        email
      }

      createdAt
      firstResponseAt
      resolvedAt

      comments {
        id
        content
        createdAt

        author {
          id
          name
          email
          role
        }
      }

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
`;

export const CREATE_TICKET_MUTATION = `
  mutation CreateTicket(
    $title: String!
    $description: String!
    $priority: Priority!
  ) {
    createTicket(
      title: $title
      description: $description
      priority: $priority
    ) {
      id
      title
      description
      priority
      status
      createdAt
    }
  }
`;

export const ADD_COMMENT_MUTATION = `
  mutation AddComment(
    $ticketId: ID!
    $content: String!
  ) {
    addComment(
      ticketId: $ticketId
      content: $content
    ) {
      id
      content
      createdAt

      author {
        id
        name
        role
      }
    }
  }
`;

export const ASSIGN_TICKET_MUTATION = `
  mutation AssignTicket(
    $ticketId: ID!
    $assigneeId: ID!
  ) {
    assignTicket(
      ticketId: $ticketId
      assigneeId: $assigneeId
    ) {
      id

      assignee {
        id
        name
        email
      }
    }
  }
`;

export const CHANGE_STATUS_MUTATION = `
  mutation ChangeTicketStatus(
    $ticketId: ID!
    $status: TicketStatus!
  ) {
    changeTicketStatus(
      ticketId: $ticketId
      status: $status
    ) {
      id
      status
      resolvedAt
    }
  }
`;

export const RESOLVE_TICKET_MUTATION = `
  mutation ResolveTicket(
    $ticketId: ID!
  ) {
    resolveTicket(
      ticketId: $ticketId
    ) {
      id
      status
      resolvedAt
    }
  }
`;