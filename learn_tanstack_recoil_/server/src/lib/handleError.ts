class AppError extends Error {
  public override cause?: Error;

  constructor(message: string, cause?: Error) {
    super(message);
    this.name = "AppError";
    this.cause = cause;
  }
}

export function handleWithError<T extends (...args: any[]) => any>(
  fn: T,
  context?: string,
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  return async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      const message = context
        ? `[${context}] ${error instanceof Error ? error.message : String(error)}`
        : String(error);
      throw new AppError(message, error instanceof Error ? error : undefined);
    }
  };
}

export function handleWithErrorSync<T extends (...args: any[]) => any>(
  fn: T,
  context?: string,
): (...args: Parameters<T>) => ReturnType<T> {
  return (...args: Parameters<T>) => {
    try {
      return fn(...args);
    } catch (error) {
      const message = context
        ? `[${context}] ${error instanceof Error ? error.message : String(error)}`
        : String(error);
      throw new AppError(message, error instanceof Error ? error : undefined);
    }
  };
}
