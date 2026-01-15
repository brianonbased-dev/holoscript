/**
 * @holoscript/core Logger
 *
 * Simple pluggable logger for HoloScript
 */

export interface HoloScriptLogger {
  debug(message: string, meta?: Record<string, unknown>): void;
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
}

class NoOpLogger implements HoloScriptLogger {
  debug(): void {}
  info(): void {}
  warn(): void {}
  error(): void {}
}

class ConsoleLogger implements HoloScriptLogger {
  debug(message: string, meta?: Record<string, unknown>): void {
    console.debug(`[HoloScript:DEBUG] ${message}`, meta ?? '');
  }
  info(message: string, meta?: Record<string, unknown>): void {
    console.info(`[HoloScript:INFO] ${message}`, meta ?? '');
  }
  warn(message: string, meta?: Record<string, unknown>): void {
    console.warn(`[HoloScript:WARN] ${message}`, meta ?? '');
  }
  error(message: string, meta?: Record<string, unknown>): void {
    console.error(`[HoloScript:ERROR] ${message}`, meta ?? '');
  }
}

let currentLogger: HoloScriptLogger = new NoOpLogger();

export function setHoloScriptLogger(logger: HoloScriptLogger): void {
  currentLogger = logger;
}

export function enableConsoleLogging(): void {
  currentLogger = new ConsoleLogger();
}

export function resetLogger(): void {
  currentLogger = new NoOpLogger();
}

export const logger: HoloScriptLogger = {
  debug: (msg, meta) => currentLogger.debug(msg, meta),
  info: (msg, meta) => currentLogger.info(msg, meta),
  warn: (msg, meta) => currentLogger.warn(msg, meta),
  error: (msg, meta) => currentLogger.error(msg, meta),
};

export { NoOpLogger, ConsoleLogger };
