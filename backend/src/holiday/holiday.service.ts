import { prisma } from "../db";

export async function listHolidays() {
  return prisma.holiday.findMany({
    orderBy: {
      date: "asc",
    },
  });
}