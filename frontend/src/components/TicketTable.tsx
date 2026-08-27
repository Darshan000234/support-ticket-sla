import type {
  SLAState,
  Ticket,
} from "../types/graphql";

interface TicketTableProps {
  tickets: Ticket[];
  hasNextPage: boolean;
  loading: boolean;

  onSelect: (
    ticket: Ticket,
  ) => void;

  onLoadMore: () => void;
}

function formatSlaState(
  state: SLAState,
): string {
  return state.replace("_", " ");
}

function formatRemainingMinutes(
  minutes: number,
): string {
  if (minutes <= 0) {
    return "0m";
  }

  const hours = Math.floor(
    minutes / 60,
  );

  const remainingMinutes =
    minutes % 60;

  if (hours === 0) {
    return `${remainingMinutes}m`;
  }

  if (remainingMinutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainingMinutes}m`;
}

function getPrimarySla(
  ticket: Ticket,
): {
  state: SLAState;
  remainingMinutes: number;
} {
  if (
    ticket.sla.resolutionState ===
    "BREACHED"
  ) {
    return {
      state:
        ticket.sla.resolutionState,
      remainingMinutes:
        ticket.sla
          .resolutionRemainingMinutes,
    };
  }

  if (
    ticket.sla.firstResponseState ===
    "BREACHED"
  ) {
    return {
      state:
        ticket.sla.firstResponseState,
      remainingMinutes:
        ticket.sla
          .firstResponseRemainingMinutes,
    };
  }

  if (
    ticket.sla.resolutionState ===
    "AT_RISK"
  ) {
    return {
      state:
        ticket.sla.resolutionState,
      remainingMinutes:
        ticket.sla
          .resolutionRemainingMinutes,
    };
  }

  if (
    ticket.sla.firstResponseState ===
    "AT_RISK"
  ) {
    return {
      state:
        ticket.sla.firstResponseState,
      remainingMinutes:
        ticket.sla
          .firstResponseRemainingMinutes,
    };
  }

  return {
    state: "ON_TRACK",
    remainingMinutes:
      ticket.sla
        .resolutionRemainingMinutes,
  };
}

export function TicketTable({
  tickets,
  hasNextPage,
  loading,
  onSelect,
  onLoadMore,
}: TicketTableProps) {
  if (
    tickets.length === 0 &&
    !loading
  ) {
    return (
      <div className="empty-state">
        <h3>No tickets found</h3>
        <p>
          Try changing the filters or
          create a new ticket.
        </p>
      </div>
    );
  }

  return (
    <section className="table-card">
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Ticket</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Assignee</th>
              <th>SLA</th>
              <th>Updated</th>
            </tr>
          </thead>

          <tbody>
            {tickets.map((ticket) => {
              const sla =
                getPrimarySla(ticket);

              return (
                <tr
                  key={ticket.id}
                  className="ticket-row"
                  onClick={() =>
                    onSelect(ticket)
                  }
                >
                  <td>
                    <div className="ticket-title">
                      {ticket.title}
                    </div>

                    <div className="ticket-id">
                      #{ticket.id.slice(
                        0,
                        8,
                      )}
                    </div>
                  </td>

                  <td>
                    <span
                      className={`badge priority-${ticket.priority.toLowerCase()}`}
                    >
                      {ticket.priority}
                    </span>
                  </td>

                  <td>
                    <span className="badge status-badge">
                      {ticket.status.replace(
                        "_",
                        " ",
                      )}
                    </span>
                  </td>

                  <td>
                    {ticket.assignee?.name ??
                      "Unassigned"}
                  </td>

                  <td>
                    <div>
                      <span
                        className={`badge sla-${sla.state.toLowerCase()}`}
                      >
                        {formatSlaState(
                          sla.state,
                        )}
                      </span>

                      <div className="sla-time">
                        {sla.state ===
                        "BREACHED"
                          ? "Breached"
                          : formatRemainingMinutes(
                              sla.remainingMinutes,
                            )}
                      </div>
                    </div>
                  </td>

                  <td>
                    {new Date(
                      ticket.createdAt,
                    ).toLocaleString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {loading && (
        <div className="loading-row">
          Loading tickets...
        </div>
      )}

      {hasNextPage && !loading && (
        <div className="load-more">
          <button
            className="secondary-button"
            onClick={onLoadMore}
          >
            Load more
          </button>
        </div>
      )}
    </section>
  );
}