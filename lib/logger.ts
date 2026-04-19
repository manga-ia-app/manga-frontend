import pino from "pino";

function createLogger() {
  const isServer = typeof window === "undefined";

  if (!isServer) {
    // Client-side: retorna wrapper sobre console com prefixo
    return {
      info: (msg: string, ...args: unknown[]) =>
        console.log(`[manga] ${msg}`, ...args),
      warn: (msg: string, ...args: unknown[]) =>
        console.warn(`[manga] ${msg}`, ...args),
      error: (msg: string, ...args: unknown[]) =>
        console.error(`[manga] ${msg}`, ...args),
      debug: (msg: string, ...args: unknown[]) =>
        console.debug(`[manga] ${msg}`, ...args),
      child: () => logger,
    };
  }

  // Server-side (Node.js): pino com multistream (console + arquivo)
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { resolve } = require("path");
  const logsDir = resolve(process.cwd(), "logs");

  return pino(
    {
      level: process.env.LOG_LEVEL || "info",
      formatters: {
        level(label: string) {
          return { level: label };
        },
      },
      timestamp: pino.stdTimeFunctions.isoTime,
    },
    pino.multistream([
      { stream: process.stdout },
      {
        stream: pino.destination({
          dest: resolve(logsDir, "manga-frontend.log"),
          sync: false,
          mkdir: true,
        }),
      },
    ])
  );
}

const logger = createLogger();

export default logger;
