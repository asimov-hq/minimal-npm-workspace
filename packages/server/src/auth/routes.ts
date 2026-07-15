import { randomUUID } from "node:crypto";
import type { FastifyInstance } from "fastify";
import { USERNAME_PATTERN, type User } from "@asimov/minimal-shared";
import { hashPassword, verifyPassword } from "../lib/password.js";
import { Problem } from "../lib/problem.js";
import type { Store } from "../lib/store.js";

export interface UserRecord extends User {
  passwordHash: string;
}

interface SignupBody {
  username: string;
  password: string;
  email?: string;
}

interface LoginBody {
  username: string;
  password: string;
}

const userSchema = {
  type: "object",
  required: ["id", "username", "createdAt"],
  properties: {
    id: { type: "string" },
    username: { type: "string" },
    email: { type: "string" },
    createdAt: { type: "string", format: "date-time" },
  },
} as const;

const authResponseSchema = {
  type: "object",
  required: ["data"],
  properties: {
    data: {
      type: "object",
      required: ["user", "token"],
      properties: { user: userSchema, token: { type: "string" } },
    },
  },
} as const;

const credentialProperties = {
  username: { type: "string", pattern: USERNAME_PATTERN },
  password: { type: "string", minLength: 8 },
} as const;

function toPublicUser(record: UserRecord): User {
  const user: User = {
    id: record.id,
    username: record.username,
    createdAt: record.createdAt,
  };
  if (record.email !== undefined) user.email = record.email;
  return user;
}

function findByUsername(users: Store<UserRecord>, username: string): UserRecord | undefined {
  return users.values().find((u) => u.username === username);
}

export function registerAuthRoutes(app: FastifyInstance, users: Store<UserRecord>): void {
  app.post<{ Body: SignupBody }>("/v1/auth/signup", {
    schema: {
      tags: ["auth"],
      body: {
        type: "object",
        additionalProperties: false,
        required: ["username", "password"],
        properties: {
          ...credentialProperties,
          email: { type: "string", format: "email" },
        },
      },
      response: { 201: authResponseSchema },
    },
  }, async (request, reply) => {
    const { username, password, email } = request.body;
    if (findByUsername(users, username)) {
      throw new Problem(409, "Conflict", `username "${username}" is already taken`);
    }
    const record: UserRecord = {
      id: `usr_${randomUUID()}`,
      username,
      createdAt: new Date().toISOString(),
      passwordHash: await hashPassword(password),
    };
    if (email !== undefined) record.email = email;
    await users.set(record.id, record);
    const token = app.jwt.sign({ sub: record.id, username });
    void reply.status(201);
    return { data: { user: toPublicUser(record), token } };
  });

  app.post<{ Body: LoginBody }>("/v1/auth/login", {
    schema: {
      tags: ["auth"],
      body: {
        type: "object",
        additionalProperties: false,
        required: ["username", "password"],
        properties: credentialProperties,
      },
      response: { 200: authResponseSchema },
    },
  }, async (request) => {
    const { username, password } = request.body;
    const record = findByUsername(users, username);
    // same work and same response whether the user exists or not
    const ok = await verifyPassword(password, record?.passwordHash ?? DUMMY_HASH);
    if (!record || !ok) {
      throw new Problem(401, "Unauthorized", "invalid username or password");
    }
    const token = app.jwt.sign({ sub: record.id, username });
    return { data: { user: toPublicUser(record), token } };
  });

  app.get("/v1/me", {
    preHandler: [app.authenticate],
    schema: {
      tags: ["auth"],
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: "object",
          required: ["data"],
          properties: {
            data: {
              type: "object",
              required: ["user"],
              properties: { user: userSchema },
            },
          },
        },
      },
    },
  }, (request) => {
    const record = users.get(request.user.sub);
    if (!record) throw new Problem(401, "Unauthorized", "account no longer exists");
    return { data: { user: toPublicUser(record) } };
  });
}

// valid hash of an unguessable value; login verifies against it for unknown
// users so response timing does not reveal whether a username exists
const DUMMY_HASH =
  "scrypt:00000000000000000000000000000000:0000000000000000000000000000000000000000000000000000000000000000";
