import "dotenv/config";
import jwt from "jsonwebtoken";

import { prisma } from "./db";
import type { User } from "./generated/prisma/client";

interface AuthTokenPayload {
  userId: string;
}

export interface GraphQLContext {
  user: User | null;
}

const JWT_SECRET = process.env.JWT_SECRET ?? "";

if (JWT_SECRET.length === 0) {
  throw new Error("JWT_SECRET is not configured");
}

export async function createContext(
  request: Request,
): Promise<GraphQLContext> {
  const authorization = request.headers.get("authorization");

  if (!authorization) {
    return {
      user: null,
    };
  }

  const [scheme, token] = authorization.split(" ");

  if (scheme !== "Bearer" || !token) {
    return {
      user: null,
    };
  }

  try {
    const payload = jwt.verify(
      token,
      JWT_SECRET,
    ) as AuthTokenPayload;

    const user = await prisma.user.findUnique({
      where: {
        id: payload.userId,
      },
    });

    return {
      user,
    };
  } catch {
    return {
      user: null,
    };
  }
}