import type { DashboardData } from "../types/graphql";

interface DashboardStatsProps {
  data: DashboardData | null;
  loading: boolean;
}

export function DashboardStats({
  data,
  loading,
}: DashboardStatsProps) {
  const cards = [
    {
      label: "Open",
      value: data?.openTickets ?? 0,
      className: "stat-open",
    },
    {
      label: "In Progress",
      value:
        data?.inProgressTickets ?? 0,
      className: "stat-progress",
    },
    {
      label: "At Risk",
      value: data?.atRiskTickets ?? 0,
      className: "stat-risk",
    },
    {
      label: "Breached",
      value:
        data?.breachedTickets ?? 0,
      className: "stat-breached",
    },
  ];

  return (
    <section className="stats-grid">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`stat-card ${card.className}`}
        >
          <span>{card.label}</span>

          <strong>
            {loading
              ? "..."
              : card.value}
          </strong>
        </div>
      ))}
    </section>
  );
}