import {
  useState,
} from "react";

import {
  graphqlRequest,
} from "../api/graphql";

import {
  ASSIGN_TICKET_MUTATION,
  CHANGE_STATUS_MUTATION,
  RESOLVE_TICKET_MUTATION,
} from "../api/queries";

import {
  CommentThread,
} from "./CommentThread";

import type {
  Ticket,
  TicketStatus,
  User,
} from "../types/graphql";

interface TicketDetailsProps {
  ticket: Ticket;
  currentUser: User;
  agents: User[];

  onClose: () => void;
  onRefresh: () => Promise<void>;
}

interface AssignResponse {
  assignTicket: Ticket;
}

interface StatusResponse {
  changeTicketStatus: Ticket;
}

interface ResolveResponse {
  resolveTicket: Ticket;
}

function formatMinutes(
  minutes: number,
): string {
  if (minutes <= 0) {
    return "0m";
  }

  const hours = Math.floor(
    minutes / 60,
  );

  const remaining = minutes % 60;

  if (hours === 0) {
    return `${remaining}m`;
  }

  if (remaining === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remaining}m`;
}

function availableNextStatuses(
  status: TicketStatus,
): TicketStatus[] {
  switch (status) {
    case "OPEN":
      return ["IN_PROGRESS"];

    case "IN_PROGRESS":
      return ["RESOLVED"];

    case "RESOLVED":
      return ["CLOSED"];

    case "CLOSED":
      return [];
  }
}

export function TicketDetails({
  ticket,
  currentUser,
  agents,
  onClose,
  onRefresh,
}: TicketDetailsProps) {
  const [selectedAgentId, setSelectedAgentId] =
    useState(
      ticket.assignee?.id ?? "",
    );

  const [status, setStatus] =
    useState<TicketStatus>(
      ticket.status,
    );

  const [error, setError] =
    useState<string | null>(null);

  const [working, setWorking] =
    useState(false);

  const isAgent =
    currentUser.role === "AGENT";

  async function handleAssign(): Promise<void> {
    if (!selectedAgentId) {
      setError(
        "Select an agent first.",
      );

      return;
    }

    setWorking(true);
    setError(null);

    try {
      await graphqlRequest<AssignResponse>(
        ASSIGN_TICKET_MUTATION,
        {
          ticketId: ticket.id,
          assigneeId: selectedAgentId,
        },
      );

      await onRefresh();
    } catch (error: unknown) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to assign ticket",
      );
    } finally {
      setWorking(false);
    }
  }

  async function handleStatusChange(): Promise<void> {
    if (status === ticket.status) {
      return;
    }

    setWorking(true);
    setError(null);

    try {
      await graphqlRequest<StatusResponse>(
        CHANGE_STATUS_MUTATION,
        {
          ticketId: ticket.id,
          status,
        },
      );

      await onRefresh();
    } catch (error: unknown) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to change status",
      );

      setStatus(ticket.status);
    } finally {
      setWorking(false);
    }
  }

  async function handleResolve(): Promise<void> {
    setWorking(true);
    setError(null);

    try {
      await graphqlRequest<ResolveResponse>(
        RESOLVE_TICKET_MUTATION,
        {
          ticketId: ticket.id,
        },
      );

      await onRefresh();
    } catch (error: unknown) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to resolve ticket",
      );
    } finally {
      setWorking(false);
    }
  }

  const nextStatuses =
    availableNextStatuses(
      ticket.status,
    );

  return (
    <div className="ticket-detail">
      <div className="detail-header">
        <div>
          <button
            className="back-button"
            onClick={onClose}
          >
            ← Back to tickets
          </button>

          <h2>{ticket.title}</h2>

          <div className="detail-id">
            #{ticket.id}
          </div>
        </div>
      </div>

      {error && (
        <div className="error-box">
          {error}
        </div>
      )}

      <div className="detail-grid">
        <section className="detail-card">
          <h3>Ticket</h3>

          <dl className="detail-list">
            <div>
              <dt>Priority</dt>
              <dd>
                <span
                  className={`badge priority-${ticket.priority.toLowerCase()}`}
                >
                  {ticket.priority}
                </span>
              </dd>
            </div>

            <div>
              <dt>Status</dt>
              <dd>
                {ticket.status.replace(
                  "_",
                  " ",
                )}
              </dd>
            </div>

            <div>
              <dt>Reporter</dt>
              <dd>
                {ticket.reporter.name}
              </dd>
            </div>

            <div>
              <dt>Assignee</dt>
              <dd>
                {ticket.assignee?.name ??
                  "Unassigned"}
              </dd>
            </div>

            <div>
              <dt>Created</dt>
              <dd>
                {new Date(
                  ticket.createdAt,
                ).toLocaleString()}
              </dd>
            </div>

            <div>
              <dt>First response</dt>
              <dd>
                {ticket.firstResponseAt
                  ? new Date(
                      ticket.firstResponseAt,
                    ).toLocaleString()
                  : "Not yet responded"}
              </dd>
            </div>

            <div>
              <dt>Resolved</dt>
              <dd>
                {ticket.resolvedAt
                  ? new Date(
                      ticket.resolvedAt,
                    ).toLocaleString()
                  : "Not resolved"}
              </dd>
            </div>
          </dl>
        </section>

        <section className="detail-card">
          <h3>SLA</h3>

          <div className="sla-detail-grid">
            <div className="sla-detail-box">
              <span>
                First response
              </span>

              <strong
                className={`sla-text-${ticket.sla.firstResponseState.toLowerCase()}`}
              >
                {ticket.sla.firstResponseState.replace(
                  "_",
                  " ",
                )}
              </strong>

              <small>
                {ticket.sla
                  .firstResponseState ===
                "BREACHED"
                  ? "Breached"
                  : `${formatMinutes(
                      ticket.sla
                        .firstResponseRemainingMinutes,
                    )} remaining`}
              </small>

              <small>
                Due{" "}
                {new Date(
                  ticket.sla
                    .firstResponseDueAt,
                ).toLocaleString()}
              </small>
            </div>

            <div className="sla-detail-box">
              <span>
                Resolution
              </span>

              <strong
                className={`sla-text-${ticket.sla.resolutionState.toLowerCase()}`}
              >
                {ticket.sla.resolutionState.replace(
                  "_",
                  " ",
                )}
              </strong>

              <small>
                {ticket.sla
                  .resolutionState ===
                "BREACHED"
                  ? "Breached"
                  : `${formatMinutes(
                      ticket.sla
                        .resolutionRemainingMinutes,
                    )} remaining`}
              </small>

              <small>
                Due{" "}
                {new Date(
                  ticket.sla
                    .resolutionDueAt,
                ).toLocaleString()}
              </small>
            </div>
          </div>
        </section>

        {isAgent && (
          <section className="detail-card">
            <h3>Agent actions</h3>

            <div className="action-stack">
              <div className="action-row">
                <select
                  value={selectedAgentId}
                  onChange={(event) =>
                    setSelectedAgentId(
                      event.target.value,
                    )
                  }
                >
                  <option value="">
                    Select agent
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

                <button
                  className="secondary-button"
                  onClick={handleAssign}
                  disabled={working}
                >
                  Assign
                </button>
              </div>

              {nextStatuses.length > 0 && (
                <div className="action-row">
                  <select
                    value={status}
                    onChange={(event) =>
                      setStatus(
                        event.target.value as TicketStatus,
                      )
                    }
                  >
                    <option
                      value={ticket.status}
                    >
                      Current:{" "}
                      {ticket.status.replace(
                        "_",
                        " ",
                      )}
                    </option>

                    {nextStatuses.map(
                      (nextStatus) => (
                        <option
                          key={nextStatus}
                          value={nextStatus}
                        >
                          Move to{" "}
                          {nextStatus.replace(
                            "_",
                            " ",
                          )}
                        </option>
                      ),
                    )}
                  </select>

                  <button
                    className="secondary-button"
                    onClick={
                      handleStatusChange
                    }
                    disabled={
                      working ||
                      status ===
                        ticket.status
                    }
                  >
                    Change status
                  </button>
                </div>
              )}

              {ticket.status ===
                "IN_PROGRESS" && (
                <button
                  className="danger-button"
                  onClick={handleResolve}
                  disabled={working}
                >
                  Resolve ticket
                </button>
              )}
            </div>
          </section>
        )}

        <section className="detail-card detail-description">
          <h3>Description</h3>

          <p>
            {ticket.description}
          </p>
        </section>

        <section className="detail-card detail-comments">
          <CommentThread
            ticketId={ticket.id}
            comments={ticket.comments}
            onCommentAdded={
              onRefresh
            }
          />
        </section>
      </div>
    </div>
  );
}