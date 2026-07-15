import test from "node:test";
import assert from "node:assert/strict";
import { rm } from "node:fs/promises";
import type { FastifyInstance } from "fastify";
import type { User } from "@asimov/minimal-shared";
import { buildApp } from "./app.js";
import { createTestApp, testConfig } from "./test-helpers.js";

interface AuthBody {
  data: { user: User; token: string };
}

function signup(app: FastifyInstance, payload: Record<string, unknown>) {
  return app.inject({ method: "POST", url: "/v1/auth/signup", payload });
}

function login(app: FastifyInstance, payload: Record<string, unknown>) {
  return app.inject({ method: "POST", url: "/v1/auth/login", payload });
}

test("signup creates an account and returns user + token", async () => {
  const { app, close } = await createTestApp();
  try {
    const res = await signup(app, { username: "alice", password: "hunter2hunter2" });
    assert.equal(res.statusCode, 201);
    const { data } = res.json<AuthBody>();
    assert.equal(data.user.username, "alice");
    assert.match(data.user.id, /^usr_/);
    assert.equal(data.user.email, undefined);
    assert.ok(data.token.length > 0);
    assert.ok(!res.body.includes("assword"), "no password material in response");
  } finally {
    await close();
  }
});

test("signup accepts an optional email", async () => {
  const { app, close } = await createTestApp();
  try {
    const res = await signup(app, {
      username: "bob",
      password: "hunter2hunter2",
      email: "bob@example.com",
    });
    assert.equal(res.statusCode, 201);
    assert.equal(res.json<AuthBody>().data.user.email, "bob@example.com");
  } finally {
    await close();
  }
});

test("signup rejects a taken username with 409 problem+json", async () => {
  const { app, close } = await createTestApp();
  try {
    await signup(app, { username: "alice", password: "hunter2hunter2" });
    const res = await signup(app, { username: "alice", password: "otherpassword" });
    assert.equal(res.statusCode, 409);
    assert.match(res.headers["content-type"] ?? "", /^application\/problem\+json/);
    assert.equal(res.json<{ title: string }>().title, "Conflict");
  } finally {
    await close();
  }
});

test("signup validates username, password, and email", async () => {
  const { app, close } = await createTestApp();
  try {
    const cases: Record<string, unknown>[] = [
      { username: "Not Valid!", password: "hunter2hunter2" },
      { username: "carol", password: "short" },
      { username: "carol", password: "hunter2hunter2", email: "not-an-email" },
      { username: "carol" },
    ];
    for (const payload of cases) {
      const res = await signup(app, payload);
      assert.equal(res.statusCode, 400, JSON.stringify(payload));
      assert.match(res.headers["content-type"] ?? "", /^application\/problem\+json/);
    }
  } finally {
    await close();
  }
});

test("login returns a token for valid credentials", async () => {
  const { app, close } = await createTestApp();
  try {
    await signup(app, { username: "alice", password: "hunter2hunter2" });
    const res = await login(app, { username: "alice", password: "hunter2hunter2" });
    assert.equal(res.statusCode, 200);
    const { data } = res.json<AuthBody>();
    assert.equal(data.user.username, "alice");
    assert.ok(data.token.length > 0);
  } finally {
    await close();
  }
});

test("login responds identically for unknown user and wrong password", async () => {
  const { app, close } = await createTestApp();
  try {
    await signup(app, { username: "alice", password: "hunter2hunter2" });
    const unknown = await login(app, { username: "nobody", password: "hunter2hunter2" });
    const wrongPw = await login(app, { username: "alice", password: "wrongpassword" });
    assert.equal(unknown.statusCode, 401);
    assert.equal(wrongPw.statusCode, 401);
    assert.deepEqual(unknown.json(), wrongPw.json());
  } finally {
    await close();
  }
});

test("GET /v1/me requires a bearer token", async () => {
  const { app, close } = await createTestApp();
  try {
    const res = await app.inject({ method: "GET", url: "/v1/me" });
    assert.equal(res.statusCode, 401);
    assert.match(res.headers["content-type"] ?? "", /^application\/problem\+json/);
  } finally {
    await close();
  }
});

test("GET /v1/me returns the authenticated user", async () => {
  const { app, close } = await createTestApp();
  try {
    const created = await signup(app, {
      username: "alice",
      password: "hunter2hunter2",
      email: "alice@example.com",
    });
    const { token } = created.json<AuthBody>().data;
    const res = await app.inject({
      method: "GET",
      url: "/v1/me",
      headers: { authorization: `Bearer ${token}` },
    });
    assert.equal(res.statusCode, 200);
    const { user } = res.json<{ data: { user: User } }>().data;
    assert.equal(user.username, "alice");
    assert.equal(user.email, "alice@example.com");
    assert.ok(!res.body.includes("assword"), "no password material in response");
  } finally {
    await close();
  }
});

test("accounts survive an app restart", async () => {
  const { app, dataDir } = await createTestApp();
  try {
    await signup(app, { username: "alice", password: "hunter2hunter2" });
    await app.close();
    const app2 = await buildApp(testConfig(dataDir));
    const res = await login(app2, { username: "alice", password: "hunter2hunter2" });
    assert.equal(res.statusCode, 200);
    await app2.close();
  } finally {
    await rm(dataDir, { recursive: true, force: true });
  }
});
