import "dotenv/config";
import bcrypt from "bcrypt";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  PrismaClient,
  Priority,
  TicketStatus,
  UserRole,
} from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not configured");
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({ adapter });

async function main(): Promise<void> {
  await prisma.comment.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.holiday.deleteMany();
  await prisma.user.deleteMany();

  // Demo password for both seeded accounts.
  // Never use this password in a real production environment.
  const passwordHash = await bcrypt.hash("Password123!", 12);

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

  await prisma.holiday.create({
    data: {
      date: new Date("2026-08-15T00:00:00.000Z"),
      name: "Independence Day",
    },
  });

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
      },
      {
        title: "Unable to login",
        description:
          "Customer cannot log into their account.",
        priority: Priority.HIGH,
        status: TicketStatus.IN_PROGRESS,
        reporterId: reporter.id,
        assigneeId: agent.id,
      },
      {
        title: "Dashboard UI issue",
        description:
          "Dashboard layout is broken on smaller screens.",
        priority: Priority.MEDIUM,
        status: TicketStatus.OPEN,
        reporterId: reporter.id,
      },
      {
        title: "Typo on help page",
        description:
          "There is a spelling mistake on the help page.",
        priority: Priority.LOW,
        status: TicketStatus.RESOLVED,
        reporterId: reporter.id,
        assigneeId: agent.id,
        resolvedAt: new Date(),
      },
    ],
  });

  console.log("Database seeded successfully.");
  console.log("Reporter: reporter@example.com / Password123!");
  console.log("Agent: agent@example.com / Password123!");
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });