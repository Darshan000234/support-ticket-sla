import type {
  Priority,
  SLAState,
  TicketStatus,
  User,
} from "../types/graphql";

interface TicketFiltersProps {
  status: string;
  priority: string;
  assigneeId: string;
  slaState: string;
  sortBy: string;

  agents: User[];

  onStatusChange: (
    value: string,
  ) => void;

  onPriorityChange: (
    value: string,
  ) => void;

  onAssigneeChange: (
    value: string,
  ) => void;

  onSlaStateChange: (
    value: string,
  ) => void;

  onSortChange: (
    value: string,
  ) => void;

  onCreateTicket: () => void;

  onClear: () => void;
}

export function TicketFilters({
  status,
  priority,
  assigneeId,
  slaState,
  sortBy,
  agents,
  onStatusChange,
  onPriorityChange,
  onAssigneeChange,
  onSlaStateChange,
  onSortChange,
  onCreateTicket,
  onClear,
}: TicketFiltersProps) {
  return (
    <section className="filters-card">
      <div className="filters-header">
        <div>
          <h2>Tickets</h2>
          <p className="muted">
            Filter and manage support tickets.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={onCreateTicket}
        >
          + Create ticket
        </button>
      </div>

      <div className="filters-grid">
        <select
          value={status}
          onChange={(event) =>
            onStatusChange(
              event.target.value,
            )
          }
        >
          <option value="">
            All statuses
          </option>

          {(
            [
              "OPEN",
              "IN_PROGRESS",
              "RESOLVED",
              "CLOSED",
            ] satisfies TicketStatus[]
          ).map((value) => (
            <option
              key={value}
              value={value}
            >
              {value.replace("_", " ")}
            </option>
          ))}
        </select>

        <select
          value={priority}
          onChange={(event) =>
            onPriorityChange(
              event.target.value,
            )
          }
        >
          <option value="">
            All priorities
          </option>

          {(
            [
              "LOW",
              "MEDIUM",
              "HIGH",
              "URGENT",
            ] satisfies Priority[]
          ).map((value) => (
            <option
              key={value}
              value={value}
            >
              {value}
            </option>
          ))}
        </select>

        <select
          value={assigneeId}
          onChange={(event) =>
            onAssigneeChange(
              event.target.value,
            )
          }
        >
          <option value="">
            All agents
          </option>

          {agents.map((agent) => (
            <option
              key={agent.id}
              value={agent.id}
            >
              {agent.name}
            </option>
          ))}
        </select>

        <select
          value={slaState}
          onChange={(event) =>
            onSlaStateChange(
              event.target.value,
            )
          }
        >
          <option value="">
            All SLA states
          </option>

          {(
            [
              "ON_TRACK",
              "AT_RISK",
              "BREACHED",
            ] satisfies SLAState[]
          ).map((value) => (
            <option
              key={value}
              value={value}
            >
              {value.replace("_", " ")}
            </option>
          ))}
        </select>

        <select
          value={sortBy}
          onChange={(event) =>
            onSortChange(
              event.target.value,
            )
          }
        >
          <option value="NEWEST">
            Newest first
          </option>

          <option value="OLDEST">
            Oldest first
          </option>

          <option value="PRIORITY">
            Highest priority
          </option>

          <option value="TITLE">
            Title A-Z
          </option>
        </select>

        <button
          className="secondary-button"
          onClick={onClear}
        >
          Clear filters
        </button>
      </div>
    </section>
  );
}