export abstract class BaseService {
  protected handleError(error: unknown, fallback: string): never {
    if (error instanceof Error) throw error;
    throw new Error(fallback);
  }
}
