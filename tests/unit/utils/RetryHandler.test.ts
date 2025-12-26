import { RetryHandler } from '../../../src/utils/RetryHandler';
import { RateLimitError } from '../../../src/errors/DiscordErrors';

class NetworkError extends Error {
  code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = 'NetworkError';
    this.code = code;
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

describe('RetryHandler', () => {
  describe('constructor', () => {
    it('should use default options', () => {
      const handler = new RetryHandler();
      expect(handler.calculateDelay(0)).toBe(1000);
    });

    it('should accept custom base delay', () => {
      const handler = new RetryHandler({ baseDelay: 2000 });
      expect(handler.calculateDelay(0)).toBe(2000);
    });

    it('should accept custom max retries', () => {
      const handler = new RetryHandler({ maxRetries: 5 });
      // Max retries is private, but we can test behavior
      expect(handler).toBeDefined();
    });
  });

  describe('calculateDelay', () => {
    it('should calculate exponential backoff', () => {
      const handler = new RetryHandler({ baseDelay: 1000 });

      expect(handler.calculateDelay(0)).toBe(1000); // 1000 * 2^0
      expect(handler.calculateDelay(1)).toBe(2000); // 1000 * 2^1
      expect(handler.calculateDelay(2)).toBe(4000); // 1000 * 2^2
      expect(handler.calculateDelay(3)).toBe(8000); // 1000 * 2^3
    });
  });

  describe('execute', () => {
    it('should execute operation successfully on first try', async () => {
      const handler = new RetryHandler();
      const operation = jest.fn().mockResolvedValue('success');

      const result = await handler.execute(operation);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry on retryable error', async () => {
      const handler = new RetryHandler({ baseDelay: 10, maxRetries: 2 });
      const operation = jest
        .fn()
        .mockRejectedValueOnce(new RateLimitError(100))
        .mockResolvedValue('success');

      const result = await handler.execute(operation);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should retry on 500 error', async () => {
      const handler = new RetryHandler({ baseDelay: 10, maxRetries: 2 });
      const error = { status: 500, message: 'Internal Server Error' };
      const operation = jest.fn().mockRejectedValueOnce(error).mockResolvedValue('success');

      const result = await handler.execute(operation);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should throw error after max retries', async () => {
      const handler = new RetryHandler({ baseDelay: 10, maxRetries: 2 });
      const error = new RateLimitError(100);
      const operation = jest.fn().mockRejectedValue(error);

      await expect(handler.execute(operation)).rejects.toThrow(RateLimitError);
      expect(operation).toHaveBeenCalledTimes(3); // initial + 2 retries
    });

    it('should not retry on 4xx errors (except 429)', async () => {
      const handler = new RetryHandler({ baseDelay: 10 });
      const error = { status: 403, message: 'Forbidden' };
      const operation = jest.fn().mockRejectedValue(error);

      await expect(handler.execute(operation)).rejects.toEqual(error);
      expect(operation).toHaveBeenCalledTimes(1); // no retries
    });

    it('should retry on network errors', async () => {
      const handler = new RetryHandler({ baseDelay: 10, maxRetries: 2 });
      let attempts = 0;
      const operation = jest.fn(async () => {
        attempts++;
        if (attempts === 1) {
          throw new NetworkError('Connection reset', 'ECONNRESET');
        }
        return 'success';
      });

      const result = await handler.execute(operation);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should handle custom retryable codes', async () => {
      const handler = new RetryHandler({ baseDelay: 10, maxRetries: 2, retryableCodes: [503] });
      const error = { status: 503, message: 'Service Unavailable' };
      const operation = jest.fn().mockRejectedValueOnce(error).mockResolvedValue('success');

      const result = await handler.execute(operation);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should log retry attempts when debug is enabled', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const handler = new RetryHandler({ baseDelay: 10, maxRetries: 2, debug: true });
      const operation = jest
        .fn()
        .mockRejectedValueOnce(new RateLimitError(100))
        .mockResolvedValue('success');

      await handler.execute(operation);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Retry attempt 1/2')
      );
      consoleSpy.mockRestore();
    });

    it('should handle error with statusCode property', async () => {
      const handler = new RetryHandler({ baseDelay: 10, maxRetries: 2 });
      const error = { statusCode: 503, message: 'Service Unavailable' };
      const operation = jest.fn().mockRejectedValueOnce(error).mockResolvedValue('success');

      const result = await handler.execute(operation);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should handle error with code as number', async () => {
      const handler = new RetryHandler({ baseDelay: 10, maxRetries: 2 });
      const error = { code: 502, message: 'Bad Gateway' };
      const operation = jest.fn().mockRejectedValueOnce(error).mockResolvedValue('success');

      const result = await handler.execute(operation);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should not retry on completely unknown error types', async () => {
      const handler = new RetryHandler({ baseDelay: 10, maxRetries: 2 });
      const error = 'String error';
      const operation = jest.fn().mockRejectedValue(error);

      await expect(handler.execute(operation)).rejects.toBe(error);
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should not retry on null error', async () => {
      const handler = new RetryHandler({ baseDelay: 10, maxRetries: 2 });
      const operation = jest.fn().mockRejectedValue(null);

      await expect(handler.execute(operation)).rejects.toBeNull();
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should handle other network error codes', async () => {
      const handler = new RetryHandler({ baseDelay: 10, maxRetries: 2 });
      const errors = ['ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND', 'EAI_AGAIN'];

      for (const code of errors) {
        let attempts = 0;
        const operation = jest.fn(async () => {
          attempts++;
          if (attempts === 1) {
            throw new NetworkError(`Network error: ${code}`, code);
          }
          return 'success';
        });

        const result = await handler.execute(operation);
        expect(result).toBe('success');
        expect(operation).toHaveBeenCalledTimes(2);
      }
    });
  });
});
