import "dotenv/config";
import bcrypt from "bcrypt";
import { PrismaPg } from "@prisma/adapter-pg";

import {
  PrismaClient,
  Priority,
  TicketStatus,
  UserRole,
} from "../src/generated/prisma/client";

import {
  calculateTicketDeadlines,
} from "../src/sla/sla.service";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not configured");
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({ adapter });

async function main(): Promise<void> {
  /*
   * Clear existing data so the seed can be run repeatedly.
   */
  await prisma.comment.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.holiday.deleteMany();
  await prisma.user.deleteMany();

  /*
   * Demo password for both seeded users.
   * Never use this password in production.
   */
  const passwordHash = await bcrypt.hash(
    "Password123!",
    12,
  );

  /*
   * Create demo users.
   */
  const reporter = await prisma.user.create({
    data: {
      name: "Demo Reporter",
      email: "reporter@example.com",
      passwordHash,
      role: UserRole.REPORTER,
    },
  });

  const agent = await prisma.user.create({
    data: {
      name: "Demo Agent",
      email: "agent@example.com",
      passwordHash,
      role: UserRole.AGENT,
    },
  });

  /*
   * Create sample holiday.
   * The SLA engine will automatically exclude this date.
   */
  await prisma.holiday.create({
    data: {
      date: new Date("2026-08-15T00:00:00.000Z"),
      name: "Independence Day",
    },
  });

  /*
   * Create ticket timestamps first.
   */
  const urgentCreatedAt = new Date();
  const highCreatedAt = new Date();
  const mediumCreatedAt = new Date();
  const lowCreatedAt = new Date();

  /*
   * Calculate SLA deadlines using the same SLA service
   * used by normal ticket creation.
   */
  const urgentDeadlines =
    await calculateTicketDeadlines(
      urgentCreatedAt,
      Priority.URGENT,
    );

  const highDeadlines =
    await calculateTicketDeadlines(
      highCreatedAt,
      Priority.HIGH,
    );

  const mediumDeadlines =
    await calculateTicketDeadlines(
      mediumCreatedAt,
      Priority.MEDIUM,
    );

  const lowDeadlines =
    await calculateTicketDeadlines(
      lowCreatedAt,
      Priority.LOW,
    );

  /*
   * Create sample tickets.
   */
  await prisma.ticket.createMany({
    data: [
      {
        title: "Payment failed",
        description:
          "Customer payment is failing during checkout.",
        priority: Priority.URGENT,
        status: TicketStatus.OPEN,

        reporterId: reporter.id,
        assigneeId: agent.id,

        createdAt: urgentCreatedAt,
        firstResponseDueAt:
          urgentDeadlines.firstResponseDueAt,
        resolutionDueAt:
          urgentDeadlines.resolutionDueAt,
      },

      {
        title: "Unable to login",
        description:
          "Customer cannot log into their account.",
        priority: Priority.HIGH,
        status: TicketStatus.IN_PROGRESS,

        reporterId: reporter.id,
        assigneeId: agent.id,

        createdAt: highCreatedAt,
        firstResponseDueAt:
          highDeadlines.firstResponseDueAt,
        resolutionDueAt:
          highDeadlines.resolutionDueAt,
      },

      {
        title: "Dashboard UI issue",
        description:
          "Dashboard layout is broken on smaller screens.",
        priority: Priority.MEDIUM,
        status: TicketStatus.OPEN,

        reporterId: reporter.id,

        createdAt: mediumCreatedAt,
        firstResponseDueAt:
          mediumDeadlines.firstResponseDueAt,
        resolutionDueAt:
          mediumDeadlines.resolutionDueAt,
      },

      {
        title: "Typo on help page",
        description:
          "There is a spelling mistake on the help page.",
        priority: Priority.LOW,
        status: TicketStatus.RESOLVED,

        reporterId: reporter.id,
        assigneeId: agent.id,

        createdAt: lowCreatedAt,
        firstResponseDueAt:
          lowDeadlines.firstResponseDueAt,
        resolutionDueAt:
          lowDeadlines.resolutionDueAt,

        resolvedAt: new Date(),
      },
    ],
  });

  console.log("Database seeded successfully.");
  console.log("");
  console.log(
    "Reporter: reporter@example.com / Password123!",
  );
  console.log(
    "Agent: reporter@example.com / Password123!",
  );
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });