import { RateLimitError } from '../errors/DiscordErrors';

/**
 * Token bucket for rate limiting
 */
interface TokenBucket {
  tokens: number;
  capacity: number;
  refillRate: number; // tokens per second
  lastRefill: number; // timestamp
}

/**
 * Service for managing Discord API rate limits using token bucket algorithm
 */
export class RateLimitService {
  private globalBucket: TokenBucket;
  private channelBuckets: Map<string, TokenBucket>;
  private debug: boolean;

  // Global rate limit: 50 requests per second
  private static readonly GLOBAL_CAPACITY = 50;
  private static readonly GLOBAL_REFILL_RATE = 50; // tokens/second

  // Per-channel rate limit: 5 requests per second
  private static readonly CHANNEL_CAPACITY = 5;
  private static readonly CHANNEL_REFILL_RATE = 5; // tokens/second

  constructor(debug = false) {
    this.debug = debug;
    this.channelBuckets = new Map();

    // Initialize global bucket
    this.globalBucket = {
      tokens: RateLimitService.GLOBAL_CAPACITY,
      capacity: RateLimitService.GLOBAL_CAPACITY,
      refillRate: RateLimitService.GLOBAL_REFILL_RATE,
      lastRefill: Date.now(),
    };
  }

  /**
   * Acquire permission to execute an operation
   * @param channelId - Channel ID for per-channel rate limiting
   * @returns Promise resolving when tokens are available
   */
  async acquireToken(channelId: string): Promise<void> {
    // Acquire global token first
    await this.acquireFromBucket(this.globalBucket, 'global');

    // Then acquire channel-specific token
    const channelBucket = this.getOrCreateChannelBucket(channelId);
    await this.acquireFromBucket(channelBucket, channelId);
  }

  /**
   * Acquire token from a specific bucket
   * @param bucket - Token bucket
   * @param bucketId - Identifier for logging
   */
  private async acquireFromBucket(bucket: TokenBucket, bucketId: string): Promise<void> {
    // Refill tokens based on time elapsed
    this.refillBucket(bucket);

    // If tokens available, consume one
    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      if (this.debug) {
        console.log(`Acquired token from ${bucketId} bucket. Remaining: ${bucket.tokens}`);
      }
      return;
    }

    // No tokens available, wait for refill
    const waitTime = this.calculateWaitTime(bucket);
    if (this.debug) {
      console.log(`${bucketId} bucket empty. Waiting ${waitTime}ms for refill`);
    }

    await this.sleep(waitTime);

    // Recursively try again after waiting
    return this.acquireFromBucket(bucket, bucketId);
  }

  /**
   * Refill tokens in bucket based on time elapsed
   * @param bucket - Token bucket to refill
   */
  private refillBucket(bucket: TokenBucket): void {
    const now = Date.now();
    const timeSinceLastRefill = now - bucket.lastRefill;

    // Calculate tokens to add based on refill rate
    const tokensToAdd = (timeSinceLastRefill / 1000) * bucket.refillRate;

    // Add tokens (capped at capacity)
    bucket.tokens = Math.min(bucket.capacity, bucket.tokens + tokensToAdd);
    bucket.lastRefill = now;
  }

  /**
   * Calculate wait time until next token is available
   * @param bucket - Token bucket
   * @returns Milliseconds to wait
   */
  private calculateWaitTime(bucket: TokenBucket): number {
    // Time to generate 1 token = 1000ms / refillRate
    return Math.ceil(1000 / bucket.refillRate);
  }

  /**
   * Get or create channel-specific bucket
   * @param channelId - Channel ID
   * @returns Token bucket for channel
   */
  private getOrCreateChannelBucket(channelId: string): TokenBucket {
    let bucket = this.channelBuckets.get(channelId);

    if (!bucket) {
      bucket = {
        tokens: RateLimitService.CHANNEL_CAPACITY,
        capacity: RateLimitService.CHANNEL_CAPACITY,
        refillRate: RateLimitService.CHANNEL_REFILL_RATE,
        lastRefill: Date.now(),
      };
      this.channelBuckets.set(channelId, bucket);
    }

    return bucket;
  }

  /**
   * Handle a rate limit error from Discord API
   * @param channelId - Channel that was rate limited
   * @param retryAfter - Milliseconds to wait from retry_after header
   */
  handleRateLimit(channelId: string, retryAfter: number): void {
    if (this.debug) {
      console.log(`Rate limited on channel ${channelId}. Retry after ${retryAfter}ms`);
    }

    // Deplete the channel bucket
    const bucket = this.getOrCreateChannelBucket(channelId);
    bucket.tokens = 0;
    bucket.lastRefill = Date.now() + retryAfter;
  }

  /**
   * Execute an operation with automatic rate limiting
   * @param channelId - Channel ID
   * @param operation - Async function to execute
   * @returns Promise resolving to operation result
   * @throws RateLimitError if rate limited by Discord
   */
  async executeWithRateLimit<T>(
    channelId: string,
    operation: () => Promise<T>
  ): Promise<T> {
    // Acquire tokens before executing
    await this.acquireToken(channelId);

    try {
      // Execute operation
      return await operation();
    } catch (error: any) {
      // Check if it's a 429 rate limit error
      if (this.isRateLimitError(error)) {
        const retryAfter = this.extractRetryAfter(error);
        this.handleRateLimit(channelId, retryAfter);
        throw new RateLimitError(retryAfter, channelId);
      }

      // Re-throw other errors
      throw error;
    }
  }

  /**
   * Check if error is a rate limit error
   */
  private isRateLimitError(error: any): boolean {
    return (
      error &&
      (error.status === 429 || error.statusCode === 429 || error.code === 429)
    );
  }

  /**
   * Extract retry_after from rate limit error
   */
  private extractRetryAfter(error: any): number {
    // Discord includes retry_after in milliseconds
    if (error.retryAfter) {
      return error.retryAfter;
    }

    // Some errors might have it in seconds
    if (error.retry_after) {
      return error.retry_after * 1000;
    }

    // Default to 1 second if not found
    return 1000;
  }

  /**
   * Reset all rate limit buckets (for testing)
   */
  reset(): void {
    // Reset global bucket
    this.globalBucket.tokens = this.globalBucket.capacity;
    this.globalBucket.lastRefill = Date.now();

    // Reset all channel buckets
    for (const bucket of this.channelBuckets.values()) {
      bucket.tokens = bucket.capacity;
      bucket.lastRefill = Date.now();
    }
  }

  /**
   * Sleep for specified duration
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
