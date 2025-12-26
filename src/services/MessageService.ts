import { Client, TextChannel, Message as DiscordMessage } from 'discord.js';
import { MessageOptions, Message } from '../types/MessageOptions';
import { RateLimitService } from './RateLimitService';
import { RetryHandler } from '../utils/RetryHandler';
import {
  PermissionError,
  ChannelNotFoundError,
} from '../errors/DiscordErrors';

/**
 * Service for managing Discord message operations with rate limiting
 */
export class MessageService {
  private client: Client;
  private rateLimitService: RateLimitService;
  private retryHandler: RetryHandler;
  private debug: boolean;

  constructor(
    client: Client,
    rateLimitService: RateLimitService,
    options: { maxRetries?: number; retryDelay?: number; debug?: boolean } = {}
  ) {
    this.client = client;
    this.rateLimitService = rateLimitService;
    this.debug = options.debug ?? false;

    this.retryHandler = new RetryHandler({
      maxRetries: options.maxRetries ?? 3,
      baseDelay: options.retryDelay ?? 1000,
      debug: this.debug,
    });
  }

  /**
   * Send a message to a Discord channel with rate limiting
   * @param channelId - Target channel ID
   * @param options - Message options (content, embeds, components)
   * @returns Promise resolving to sent Message
   * @throws RateLimitError if rate limit exceeded after retries
   * @throws PermissionError if bot lacks permissions
   * @throws ChannelNotFoundError if channel doesn't exist
   */
  async sendMessage(channelId: string, options: MessageOptions): Promise<Message> {
    return this.retryHandler.execute(async () => {
      return this.rateLimitService.executeWithRateLimit(channelId, async () => {
        try {
          const channel = await this.getChannel(channelId);

          // Build message payload
          const payload: any = {};

          if (options.content) {
            payload.content = options.content;
          }

          if (options.embeds && options.embeds.length > 0) {
            // Import EmbedBuilder here to avoid circular dependency
            const { EmbedBuilder } = await import('../builders/EmbedBuilder');
            payload.embeds = options.embeds.map((embedOpts) =>
              new EmbedBuilder(embedOpts).build()
            );
          }

          if (options.components && options.components.length > 0) {
            payload.components = options.components.map((row) => row.build());
          }

          const sentMessage = await channel.send(payload);

          return this.messageToInterface(sentMessage);
        } catch (error: any) {
          throw this.wrapError(error, channelId);
        }
      });
    });
  }

  /**
   * Update an existing message
   * @param channelId - Channel ID where message exists
   * @param messageId - ID of message to update
   * @param options - Updated message options
   * @returns Promise resolving to updated Message
   */
  async updateMessage(
    channelId: string,
    messageId: string,
    options: MessageOptions
  ): Promise<Message> {
    return this.retryHandler.execute(async () => {
      return this.rateLimitService.executeWithRateLimit(channelId, async () => {
        try {
          const channel = await this.getChannel(channelId);
          const message = await channel.messages.fetch(messageId);

          // Build update payload
          const payload: any = {};

          if (options.content !== undefined) {
            payload.content = options.content;
          }

          if (options.embeds !== undefined) {
            if (options.embeds.length > 0) {
              const { EmbedBuilder } = await import('../builders/EmbedBuilder');
              payload.embeds = options.embeds.map((embedOpts) =>
                new EmbedBuilder(embedOpts).build()
              );
            } else {
              payload.embeds = [];
            }
          }

          if (options.components !== undefined) {
            if (options.components.length > 0) {
              payload.components = options.components.map((row) => row.build());
            } else {
              payload.components = [];
            }
          }

          const updatedMessage = await message.edit(payload);

          return this.messageToInterface(updatedMessage);
        } catch (error: any) {
          throw this.wrapError(error, channelId);
        }
      });
    });
  }

  /**
   * Delete a message
   * @param channelId - Channel ID where message exists
   * @param messageId - ID of message to delete
   * @returns Promise resolving when delete completes
   */
  async removeMessage(channelId: string, messageId: string): Promise<void> {
    return this.retryHandler.execute(async () => {
      return this.rateLimitService.executeWithRateLimit(channelId, async () => {
        try {
          const channel = await this.getChannel(channelId);
          const message = await channel.messages.fetch(messageId);
          await message.delete();
        } catch (error: any) {
          throw this.wrapError(error, channelId);
        }
      });
    });
  }

  /**
   * Get channel by ID
   * @param channelId - Channel ID
   * @returns TextChannel
   * @throws ChannelNotFoundError if channel doesn't exist
   */
  private async getChannel(channelId: string): Promise<TextChannel> {
    const channel = await this.client.channels.fetch(channelId);

    if (!channel) {
      throw new ChannelNotFoundError(channelId);
    }

    if (!channel.isTextBased()) {
      throw new PermissionError(
        `Channel ${channelId} is not a text channel`,
        undefined,
        channelId
      );
    }

    return channel as TextChannel;
  }

  /**
   * Convert Discord.js Message to our Message interface
   */
  private messageToInterface(message: DiscordMessage): Message {
    return {
      id: message.id,
      channelId: message.channelId,
      guildId: message.guildId ?? undefined,
      createdAt: message.createdAt,
      content: message.content || undefined,
    };
  }

  /**
   * Wrap Discord API errors into our custom error classes
   */
  private wrapError(error: any, channelId: string): Error {
    // Check for permission errors (403)
    if (error.status === 403 || error.statusCode === 403 || error.code === 403) {
      return new PermissionError(
        error.message || 'Permission denied',
        undefined,
        channelId
      );
    }

    // Check for not found errors (404)
    if (error.status === 404 || error.statusCode === 404 || error.code === 404) {
      return new ChannelNotFoundError(channelId);
    }

    // Return original error for other cases
    return error;
  }
}
