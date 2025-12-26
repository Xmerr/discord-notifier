import { RateLimitError } from '../errors/DiscordErrors';

/**
 * Options for retry handler
 */
export interface RetryOptions {
  /**
   * Maximum number of retry attempts (default: 3)
   */
  maxRetries?: number;

  /**
   * Base delay in milliseconds (default: 1000)
   */
  baseDelay?: number;

  /**
   * HTTP status codes that should trigger retries
   */
  retryableCodes?: number[];

  /**
   * Whether to log retry attempts (default: false)
   */
  debug?: boolean;
}

/**
 * Utility class for handling retries with exponential backoff
 */
export class RetryHandler {
  private readonly maxRetries: number;
  private readonly baseDelay: number;
  private readonly retryableCodes: Set<number>;
  private readonly debug: boolean;

  /**
   * Default retryable HTTP status codes
   * - 429: Rate limited (special handling)
   * - 500: Internal server error
   * - 502: Bad gateway
   * - 503: Service unavailable
   * - 504: Gateway timeout
   */
  private static readonly DEFAULT_RETRYABLE_CODES = [429, 500, 502, 503, 504];

  constructor(options: RetryOptions = {}) {
    this.maxRetries = options.maxRetries ?? 3;
    this.baseDelay = options.baseDelay ?? 1000;
    this.retryableCodes = new Set(
      options.retryableCodes ?? RetryHandler.DEFAULT_RETRYABLE_CODES
    );
    this.debug = options.debug ?? false;
  }

  /**
   * Execute operation with automatic retry on transient failures
   * @param operation - Async operation to execute
   * @returns Promise resolving to operation result
   * @throws Error if max retries exceeded or non-retryable error occurs
   */
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        // Check if error is retryable
        const isRetryable = this.isRetryableError(error);

        if (!isRetryable || attempt === this.maxRetries) {
          // Non-retryable error or max retries exceeded
          throw error;
        }

        // Calculate delay
        const delay = this.calculateDelay(attempt);

        if (this.debug) {
          console.log(
            `Retry attempt ${attempt + 1}/${this.maxRetries} after ${delay}ms due to: ${
              (error as Error).message
            }`
          );
        }

        // Wait before retrying
        await this.sleep(delay);
      }
    }

    // This should never be reached, but TypeScript needs it
    throw lastError ?? new Error('Max retries exceeded');
  }

  /**
   * Calculate exponential backoff delay
   * @param attempt - Current attempt number (0-indexed)
   * @returns Delay in milliseconds
   */
  calculateDelay(attempt: number): number {
    // Exponential backoff: baseDelay * 2^attempt
    // Attempt 0: 1000ms
    // Attempt 1: 2000ms
    // Attempt 2: 4000ms
    // Attempt 3: 8000ms
    return this.baseDelay * Math.pow(2, attempt);
  }

  /**
   * Check if error is retryable
   * @param error - Error to check
   * @returns True if error should trigger retry
   */
  private isRetryableError(error: unknown): boolean {
    // Check if it's a rate limit error
    if (error instanceof RateLimitError) {
      return true;
    }

    // Check network errors before HTTP errors (network errors also have 'code' property)
    if (this.isNetworkError(error)) {
      return true;
    }

    // Check if it's an HTTP error with retryable status code
    if (this.isHttpError(error)) {
      const statusCode = this.extractStatusCode(error);
      return statusCode !== null && this.retryableCodes.has(statusCode);
    }

    return false;
  }

  /**
   * Check if error is an HTTP error
   */
  private isHttpError(error: unknown): boolean {
    return (
      error !== null &&
      typeof error === 'object' &&
      ('status' in error || 'statusCode' in error || 'code' in error)
    );
  }

  /**
   * Extract HTTP status code from error
   */
  private extractStatusCode(error: unknown): number | null {
    if (error === null || typeof error !== 'object') {
      return null;
    }

    // Try different property names
    if ('status' in error && typeof error.status === 'number') {
      return error.status;
    }

    if ('statusCode' in error && typeof error.statusCode === 'number') {
      return error.statusCode;
    }

    if ('code' in error && typeof error.code === 'number') {
      return error.code;
    }

    return null;
  }

  /**
   * Check if error is a network error
   */
  private isNetworkError(error: unknown): boolean {
    if (error === null || typeof error !== 'object') {
      return false;
    }

    // Check for common network error codes
    if ('code' in error && typeof error.code === 'string') {
      const networkErrorCodes = [
        'ECONNRESET',
        'ECONNREFUSED',
        'ETIMEDOUT',
        'ENOTFOUND',
        'EAI_AGAIN',
      ];
      return networkErrorCodes.includes(error.code);
    }

    return false;
  }

  /**
   * Sleep for specified duration
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
