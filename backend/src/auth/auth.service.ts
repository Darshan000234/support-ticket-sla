import "dotenv/config";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import { prisma } from "../db";
import {
  UserRole,
  type User,
} from "../generated/prisma/client";

interface AuthTokenPayload {
  userId: string;
}

export interface AuthResult {
  token: string;
  user: User;
}

const JWT_SECRET = process.env.JWT_SECRET ?? "";

if (JWT_SECRET.length === 0) {
  throw new Error("JWT_SECRET is not configured");
}

export async function registerUser(
  name: string,
  email: string,
  password: string,
  role: UserRole,
): Promise<AuthResult> {
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new Error("USER_ALREADY_EXISTS");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role,
    },
  });

  const token = jwt.sign(
    { userId: user.id } satisfies AuthTokenPayload,
    JWT_SECRET,
    {
      expiresIn: "1d",
    },
  );

  return {
    token,
    user,
  };
}

export async function loginUser(
  email: string,
  password: string,
): Promise<AuthResult> {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new Error("INVALID_CREDENTIALS");
  }

  const validPassword = await bcrypt.compare(
    password,
    user.passwordHash,
  );

  if (!validPassword) {
    throw new Error("INVALID_CREDENTIALS");
  }

  const token = jwt.sign(
    { userId: user.id } satisfies AuthTokenPayload,
    JWT_SECRET,
    {
      expiresIn: "1d",
    },
  );

  return {
    token,
    user,
  };
}