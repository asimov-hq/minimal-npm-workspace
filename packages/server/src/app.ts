import Fastify, { type FastifyInstance } from "fastify";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import { Ajv } from "ajv";
// ajv-formats is CJS-only; under NodeNext the callable plugin sits on .default
import ajvFormats from "ajv-formats";
const addFormats = ajvFormats.default;
import type { AppConfig } from "./config.js";
import { errorHandler, notFoundHandler } from "./lib/problem.js";

export async function buildApp(config: AppConfig): Promise<FastifyInstance> {
  const app = Fastify({ logger: config.logger });

  const ajv = new Ajv({
    coerceTypes: "array",
    useDefaults: true,
    removeAdditional: true,
    allErrors: false,
  });
  addFormats(ajv);
  app.setValidatorCompiler(({ schema }) => ajv.compile(schema));

  app.setErrorHandler(errorHandler);
  app.setNotFoundHandler(notFoundHandler);

  await app.register(swagger, {
    openapi: {
      openapi: "3.1.0",
      info: { title: "Minimal Todo API", version: "0.0.0" },
      components: {
        securitySchemes: {
          bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
        },
      },
    },
  });
  await app.register(swaggerUi, { routePrefix: "/docs" });

  app.get("/healthz", {
    schema: {
      response: {
        200: {
          type: "object",
          required: ["data"],
          properties: {
            data: {
              type: "object",
              required: ["status"],
              properties: { status: { type: "string" } },
            },
          },
        },
      },
    },
  }, () => ({ data: { status: "ok" } }));

  app.get("/openapi.json", { schema: { hide: true } }, () => app.swagger());

  return app;
}
