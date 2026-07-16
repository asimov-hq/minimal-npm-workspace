import { randomUUID } from "node:crypto";
import type { FastifyInstance } from "fastify";
import { normalizeTags, type Todo } from "@asimov/shared";
import { Problem } from "../lib/problem.js";
import type { Store } from "../lib/store.js";

const todoSchema = {
  type: "object",
  required: ["id", "ownerId", "title", "done", "tags", "createdAt"],
  properties: {
    id: { type: "string" },
    ownerId: { type: "string" },
    title: { type: "string" },
    done: { type: "boolean" },
    tags: { type: "array", items: { type: "string" } },
    createdAt: { type: "string", format: "date-time" },
  },
} as const;

const todoResponseSchema = {
  type: "object",
  required: ["data"],
  properties: {
    data: {
      type: "object",
      required: ["todo"],
      properties: { todo: todoSchema },
    },
  },
} as const;

const titleSchema = { type: "string", minLength: 1, maxLength: 200 } as const;
const tagsSchema = {
  type: "array",
  items: { type: "string", minLength: 1, maxLength: 30 },
} as const;

const paramsSchema = {
  type: "object",
  required: ["id"],
  properties: { id: { type: "string" } },
} as const;

interface TodoParams {
  id: string;
}

export function registerTodoRoutes(app: FastifyInstance, todos: Store<Todo>): void {
  const security = [{ bearerAuth: [] }];

  function ownTodo(id: string, ownerId: string): Todo {
    const todo = todos.get(id);
    if (!todo || todo.ownerId !== ownerId) {
      throw new Problem(404, "Not Found", `no todo "${id}"`);
    }
    return todo;
  }

  app.get("/v1/todos", {
    preHandler: [app.authenticate],
    schema: {
      tags: ["todos"],
      security,
      response: {
        200: {
          type: "object",
          required: ["data"],
          properties: {
            data: {
              type: "object",
              required: ["todos"],
              properties: { todos: { type: "array", items: todoSchema } },
            },
          },
        },
      },
    },
  }, (request) => {
    const mine = todos
      .values()
      .filter((t) => t.ownerId === request.user.sub)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    return { data: { todos: mine } };
  });

  app.post<{ Body: { title: string; tags?: string[] } }>("/v1/todos", {
    preHandler: [app.authenticate],
    schema: {
      tags: ["todos"],
      security,
      body: {
        type: "object",
        additionalProperties: false,
        required: ["title"],
        properties: { title: titleSchema, tags: tagsSchema },
      },
      response: { 201: todoResponseSchema },
    },
  }, async (request, reply) => {
    const todo: Todo = {
      id: `todo_${randomUUID()}`,
      ownerId: request.user.sub,
      title: request.body.title,
      done: false,
      tags: normalizeTags(request.body.tags ?? []),
      createdAt: new Date().toISOString(),
    };
    await todos.set(todo.id, todo);
    void reply.status(201);
    return { data: { todo } };
  });

  app.patch<{ Body: { title?: string; done?: boolean; tags?: string[] }; Params: TodoParams }>(
    "/v1/todos/:id",
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ["todos"],
        security,
        params: paramsSchema,
        body: {
          type: "object",
          additionalProperties: false,
          minProperties: 1,
          properties: { title: titleSchema, done: { type: "boolean" }, tags: tagsSchema },
        },
        response: { 200: todoResponseSchema },
      },
    },
    async (request) => {
      const todo = ownTodo(request.params.id, request.user.sub);
      const { title, done, tags } = request.body;
      const updated: Todo = {
        ...todo,
        title: title ?? todo.title,
        done: done ?? todo.done,
        tags: tags !== undefined ? normalizeTags(tags) : todo.tags,
      };
      await todos.set(updated.id, updated);
      return { data: { todo: updated } };
    },
  );

  app.delete<{ Params: TodoParams }>("/v1/todos/:id", {
    preHandler: [app.authenticate],
    schema: {
      tags: ["todos"],
      security,
      params: paramsSchema,
      response: { 204: { type: "null" } },
    },
  }, async (request, reply) => {
    const todo = ownTodo(request.params.id, request.user.sub);
    await todos.delete(todo.id);
    void reply.status(204);
  });
}
