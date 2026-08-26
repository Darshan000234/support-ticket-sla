import type { Priority } from "../generated/prisma/client";

export interface SlaPolicy {
  firstResponseMinutes: number;
  resolutionMinutes: number;
}

const SLA_POLICIES: Record<Priority, SlaPolicy> = {
  URGENT: {
    firstResponseMinutes: 60,
    resolutionMinutes: 240,
  },
  HIGH: {
    firstResponseMinutes: 240,
    resolutionMinutes: 1440,
  },
  MEDIUM: {
    firstResponseMinutes: 480,
    resolutionMinutes: 2880,
  },
  LOW: {
    firstResponseMinutes: 1440,
    resolutionMinutes: 4320,
  },
};

export function getSlaPolicy(
  priority: Priority,
): SlaPolicy {
  const policy = SLA_POLICIES[priority];

  if (!policy) {
    throw new Error(`No SLA policy configured for priority: ${priority}`);
  }

  return policy;
}