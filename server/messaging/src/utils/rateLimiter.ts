export class RateLimiter {
  private readonly buckets = new Map<string, { count: number; resetAt: number }>();

  constructor(
    private readonly maxEvents: number,
    private readonly windowMs: number
  ) {}

  allow(key: string): boolean {
    const now = Date.now();
    const bucket = this.buckets.get(key);
    if (!bucket || now >= bucket.resetAt) {
      this.buckets.set(key, { count: 1, resetAt: now + this.windowMs });
      return true;
    }
    if (bucket.count >= this.maxEvents) return false;
    bucket.count += 1;
    return true;
  }

  clear(key: string): void {
    this.buckets.delete(key);
  }
}
