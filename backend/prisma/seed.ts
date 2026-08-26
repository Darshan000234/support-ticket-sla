import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  PrismaClient,
  Priority,
  TicketStatus,
  UserRole,
} from "../src/generated/prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main(): Promise<void> {
  await prisma.comment.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.holiday.deleteMany();
  await prisma.user.deleteMany();

  const reporter = await prisma.user.create({
    data: {
      name: "Demo Reporter",
      email: "reporter@example.com",
      passwordHash: "seed-password-placeholder",
      role: UserRole.REPORTER,
    },
  });

  const agent = await prisma.user.create({
    data: {
      name: "Demo Agent",
      email: "agent@example.com",
      passwordHash: "seed-password-placeholder",
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
        description: "Customer payment is failing during checkout.",
        priority: Priority.URGENT,
        status: TicketStatus.OPEN,
        reporterId: reporter.id,
        assigneeId: agent.id,
      },
      {
        title: "Unable to login",
        description: "Customer cannot log into their account.",
        priority: Priority.HIGH,
        status: TicketStatus.IN_PROGRESS,
        reporterId: reporter.id,
        assigneeId: agent.id,
      },
      {
        title: "Dashboard UI issue",
        description: "Dashboard layout is broken on smaller screens.",
        priority: Priority.MEDIUM,
        status: TicketStatus.OPEN,
        reporterId: reporter.id,
      },
      {
        title: "Typo on help page",
        description: "There is a spelling mistake on the help page.",
        priority: Priority.LOW,
        status: TicketStatus.RESOLVED,
        reporterId: reporter.id,
        assigneeId: agent.id,
        resolvedAt: new Date(),
      },
    ],
  });

  console.log("Database seeded successfully.");
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });