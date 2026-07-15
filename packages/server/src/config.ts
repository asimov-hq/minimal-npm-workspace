export interface AppConfig {
  port: number;
  host: string;
  jwtSecret: string;
  dataDir: string;
  logger: boolean;
}

export function envConfig(): AppConfig {
  return {
    port: Number(process.env.PORT ?? 3001),
    host: process.env.HOST ?? "127.0.0.1",
    jwtSecret: process.env.JWT_SECRET ?? "dev-secret-change-me",
    dataDir: process.env.DATA_DIR ?? "data",
    logger: true,
  };
}
