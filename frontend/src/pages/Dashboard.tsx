import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  graphqlRequest,
} from "../api/graphql";

import {
  DASHBOARD_QUERY,
  TICKETS_QUERY,
  TICKET_QUERY,
  USERS_QUERY,
} from "../api/queries";

import {
  DashboardStats,
} from "../components/DashboardStats";

import {
  TicketFilters,
} from "../components/TicketFilters";

import {
  TicketTable,
} from "../components/TicketTable";

import {
  TicketDetails,
} from "../components/TicketDetails";

import {
  CreateTicketForm,
} from "../components/CreateTicketForm";

import type {
  DashboardData,
  Ticket,
  TicketConnection,
  User,
} from "../types/graphql";

interface DashboardProps {
  currentUser: User;
  onLogout: () => void;
}

interface DashboardResponse {
  dashboard: DashboardData;
}

interface TicketsResponse {
  tickets: TicketConnection;
}

interface TicketResponse {
  ticket: Ticket | null;
}

interface UsersResponse {
  users: User[];
}

type SortOption =
  | "NEWEST"
  | "OLDEST"
  | "PRIORITY"
  | "TITLE";

const priorityWeight: Record<
  string,
  number
> = {
  URGENT: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

export function Dashboard({
  currentUser,
  onLogout,
}: DashboardProps) {
  const [dashboard, setDashboard] =
    useState<DashboardData | null>(
      null,
    );

  const [tickets, setTickets] =
    useState<Ticket[]>([]);

  const [agents, setAgents] =
    useState<User[]>([]);

  const [selectedTicketId, setSelectedTicketId] =
    useState<string | null>(null);

  const [selectedTicket, setSelectedTicket] =
    useState<Ticket | null>(null);

  const [status, setStatus] =
    useState("");

  const [priority, setPriority] =
    useState("");

  const [assigneeId, setAssigneeId] =
    useState("");

  const [slaState, setSlaState] =
    useState("");

  const [sortBy, setSortBy] =
    useState<SortOption>(
      "NEWEST",
    );

  const [cursor, setCursor] =
    useState<string | null>(null);

  const [hasNextPage, setHasNextPage] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [detailLoading, setDetailLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [showCreateForm, setShowCreateForm] =
    useState(false);

  const loadDashboard =
    useCallback(async (): Promise<void> => {
      const result =
        await graphqlRequest<DashboardResponse>(
          DASHBOARD_QUERY,
        );

      setDashboard(
        result.dashboard,
      );
    }, []);

  const loadAgents =
    useCallback(async (): Promise<void> => {
      const result =
        await graphqlRequest<UsersResponse>(
          USERS_QUERY,
          {
            role: "AGENT",
          },
        );

      setAgents(result.users);
    }, []);

  const loadTickets =
    useCallback(
      async (
        nextCursor: string | null = null,
        append = false,
      ): Promise<void> => {
        setLoading(true);
        setError(null);

        try {
          const result =
            await graphqlRequest<TicketsResponse>(
              TICKETS_QUERY,
              {
                status:
                  status || undefined,
                priority:
                  priority || undefined,
                assigneeId:
                  assigneeId || undefined,
                slaState:
                  slaState || undefined,
                take: 10,
                cursor:
                  nextCursor || undefined,
              },
            );

          setTickets((current) =>
            append
              ? [
                  ...current,
                  ...result.tickets
                    .nodes,
                ]
              : result.tickets.nodes,
          );

          setCursor(
            result.tickets.pageInfo
              .endCursor,
          );

          setHasNextPage(
            result.tickets.pageInfo
              .hasNextPage,
          );
        } catch (error: unknown) {
          setError(
            error instanceof Error
              ? error.message
              : "Failed to load tickets",
          );
        } finally {
          setLoading(false);
        }
      },
      [
        status,
        priority,
        assigneeId,
        slaState,
      ],
    );

  const loadSelectedTicket =
    useCallback(
      async (): Promise<void> => {
        if (!selectedTicketId) {
          setSelectedTicket(null);

          return;
        }

        setDetailLoading(true);
        setError(null);

        try {
          const result =
            await graphqlRequest<TicketResponse>(
              TICKET_QUERY,
              {
                id: selectedTicketId,
              },
            );

          setSelectedTicket(
            result.ticket,
          );
        } catch (error: unknown) {
          setError(
            error instanceof Error
              ? error.message
              : "Failed to load ticket",
          );
        } finally {
          setDetailLoading(false);
        }
      },
      [selectedTicketId],
    );

  const refreshAll =
    useCallback(async (): Promise<void> => {
      await Promise.all([
        loadDashboard(),
        loadTickets(),
      ]);

      if (selectedTicketId) {
        await loadSelectedTicket();
      }
    }, [
      loadDashboard,
      loadTickets,
      loadSelectedTicket,
      selectedTicketId,
    ]);

  useEffect(() => {
    void Promise.all([
      loadDashboard(),
      loadAgents(),
      loadTickets(),
    ]).catch((error: unknown) => {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to load dashboard",
      );
    });
  }, [
    loadDashboard,
    loadAgents,
    loadTickets,
  ]);

  useEffect(() => {
    if (selectedTicketId) {
      void loadSelectedTicket();
    }
  }, [
    selectedTicketId,
    loadSelectedTicket,
  ]);

  function changeFilter(
    setter: (
      value: string,
    ) => void,
    value: string,
  ): void {
    setter(value);
    setCursor(null);
  }

  function clearFilters(): void {
    setStatus("");
    setPriority("");
    setAssigneeId("");
    setSlaState("");
    setCursor(null);
  }

  function handleLoadMore(): void {
    if (!cursor || !hasNextPage) {
      return;
    }

    void loadTickets(cursor, true);
  }

  const sortedTickets =
    useMemo(() => {
      const result = [
        ...tickets,
      ];

      result.sort((a, b) => {
        switch (sortBy) {
          case "OLDEST":
            return (
              new Date(
                a.createdAt,
              ).getTime() -
              new Date(
                b.createdAt,
              ).getTime()
            );

          case "PRIORITY":
            return (
              (priorityWeight[
                b.priority
              ] ?? 0) -
              (priorityWeight[
                a.priority
              ] ?? 0)
            );

          case "TITLE":
            return a.title.localeCompare(
              b.title,
            );

          case "NEWEST":
          default:
            return (
              new Date(
                b.createdAt,
              ).getTime() -
              new Date(
                a.createdAt,
              ).getTime()
            );
        }
      });

      return result;
    }, [tickets, sortBy]);

  if (selectedTicketId) {
    return (
      <main className="app-shell">
        <header className="app-header">
          <div>
            <div className="brand-name">
              Support Ticket Tracker
            </div>
          </div>

          <div className="header-user">
            <div>
              <strong>
                {currentUser.name}
              </strong>

              <span>
                {currentUser.role}
              </span>
            </div>

            <button
              className="secondary-button"
              onClick={onLogout}
            >
              Logout
            </button>
          </div>
        </header>

        {detailLoading ? (
          <div className="page-loading">
            Loading ticket...
          </div>
        ) : selectedTicket ? (
          <TicketDetails
            ticket={selectedTicket}
            currentUser={currentUser}
            agents={agents}
            onClose={() => {
              setSelectedTicketId(
                null,
              );

              setSelectedTicket(null);
            }}
            onRefresh={async () => {
              await Promise.all([
                loadSelectedTicket(),
                loadDashboard(),
                loadTickets(),
              ]);
            }}
          />
        ) : (
          <div className="error-box">
            Ticket not found.
          </div>
        )}
      </main>
    );
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <div className="brand-name">
            Support Ticket Tracker
          </div>

          <div className="brand-subtitle">
            Ticket management + SLA
          </div>
        </div>

        <div className="header-user">
          <div>
            <strong>
              {currentUser.name}
            </strong>

            <span>
              {currentUser.role}
            </span>
          </div>

          <button
            className="secondary-button"
            onClick={onLogout}
          >
            Logout
          </button>
        </div>
      </header>

      <div className="page-content">
        <DashboardStats
          data={dashboard}
          loading={loading}
        />

        <TicketFilters
          status={status}
          priority={priority}
          assigneeId={assigneeId}
          slaState={slaState}
          sortBy={sortBy}
          agents={agents}
          onStatusChange={(value) =>
            changeFilter(
              setStatus,
              value,
            )
          }
          onPriorityChange={(value) =>
            changeFilter(
              setPriority,
              value,
            )
          }
          onAssigneeChange={(value) =>
            changeFilter(
              setAssigneeId,
              value,
            )
          }
          onSlaStateChange={(value) =>
            changeFilter(
              setSlaState,
              value,
            )
          }
          onSortChange={(value) =>
            setSortBy(
              value as SortOption,
            )
          }
          onCreateTicket={() =>
            setShowCreateForm(true)
          }
          onClear={clearFilters}
        />

        {error && (
          <div className="error-box">
            {error}
          </div>
        )}

        <TicketTable
          tickets={sortedTickets}
          hasNextPage={hasNextPage}
          loading={loading}
          onSelect={(ticket) =>
            setSelectedTicketId(
              ticket.id,
            )
          }
          onLoadMore={handleLoadMore}
        />
      </div>

      {showCreateForm && (
        <CreateTicketForm
          onCancel={() =>
            setShowCreateForm(false)
          }
          onCreated={async () => {
            setShowCreateForm(false);
            setCursor(null);

            await Promise.all([
              loadDashboard(),
              loadTickets(),
            ]);
          }}
        />
      )}
    </main>
  );
}