/**
 * Configuration options for DiscordNotifier client
 */
export interface ClientOptions {
  /**
   * Discord bot token
   */
  token: string;

  /**
   * Primary channel ID for posting messages
   */
  channelId: string;

  /**
   * Optional error channel ID (fallback to primary if not set or fails)
   */
  errorChannelId?: string;

  /**
   * Maximum retries for failed operations (default: 3)
   */
  maxRetries?: number;

  /**
   * Base retry delay in milliseconds (default: 1000)
   */
  retryDelay?: number;

  /**
   * Whether to log debug information (default: false)
   */
  debug?: boolean;
}
