import { fileURLToPath } from "node:url";

export interface AppConfig {
  port: number;
  host: string;
  jwtSecret: string;
  dataDir: string;
  /** directory with the built web app; served when it exists */
  webDist?: string;
  logger: boolean;
}

export function envConfig(): AppConfig {
  return {
    port: Number(process.env.PORT ?? 3001),
    host: process.env.HOST ?? "127.0.0.1",
    jwtSecret: process.env.JWT_SECRET ?? "dev-secret-change-me",
    dataDir: process.env.DATA_DIR ?? "data",
    webDist: fileURLToPath(new URL("../../web/dist", import.meta.url)),
    logger: true,
  };
}
