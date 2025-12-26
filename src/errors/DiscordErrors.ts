/**
 * Base error class for all Discord notifier errors
 */
export class DiscordNotifierError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DiscordNotifierError';
    Object.setPrototypeOf(this, DiscordNotifierError.prototype);
  }
}

/**
 * Rate limit error (429 response)
 */
export class RateLimitError extends DiscordNotifierError {
  /**
   * Milliseconds to wait before retrying
   */
  public readonly retryAfter: number;

  /**
   * Channel ID that was rate limited
   */
  public readonly channelId?: string;

  constructor(retryAfter: number, channelId?: string) {
    super(`Rate limited. Retry after ${retryAfter}ms`);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
    this.channelId = channelId;
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}

/**
 * Permission error (403 response)
 */
export class PermissionError extends DiscordNotifierError {
  /**
   * Required permission that is missing
   */
  public readonly requiredPermission?: string;

  /**
   * Channel ID where permission was denied
   */
  public readonly channelId?: string;

  constructor(message: string, requiredPermission?: string, channelId?: string) {
    super(message);
    this.name = 'PermissionError';
    this.requiredPermission = requiredPermission;
    this.channelId = channelId;
    Object.setPrototypeOf(this, PermissionError.prototype);
  }
}

/**
 * Channel not found error (404 response)
 */
export class ChannelNotFoundError extends DiscordNotifierError {
  /**
   * Channel ID that was not found
   */
  public readonly channelId: string;

  constructor(channelId: string) {
    super(`Channel not found: ${channelId}`);
    this.name = 'ChannelNotFoundError';
    this.channelId = channelId;
    Object.setPrototypeOf(this, ChannelNotFoundError.prototype);
  }
}

/**
 * Interaction timeout error (interaction token expired)
 */
export class InteractionTimeoutError extends DiscordNotifierError {
  /**
   * Custom ID of the button interaction that timed out
   */
  public readonly customId: string;

  constructor(customId: string) {
    super(`Interaction timed out for button: ${customId}. Must acknowledge within 3 seconds.`);
    this.name = 'InteractionTimeoutError';
    this.customId = customId;
    Object.setPrototypeOf(this, InteractionTimeoutError.prototype);
  }
}

/**
 * Validation error for invalid input
 */
export class ValidationError extends DiscordNotifierError {
  /**
   * Field that failed validation
   */
  public readonly field?: string;

  constructor(message: string, field?: string) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}
