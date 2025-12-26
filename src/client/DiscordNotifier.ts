import { Client, GatewayIntentBits } from 'discord.js';
import { ClientOptions } from '../types/ClientOptions';
import { MessageOptions, Message, ErrorPostOptions } from '../types/MessageOptions';
import { ButtonOptions, ButtonClickHandler } from '../types/ButtonOptions';
import { EmbedOptions } from '../types/EmbedOptions';
import { MessageService } from '../services/MessageService';
import { InteractionService } from '../services/InteractionService';
import { RateLimitService } from '../services/RateLimitService';
import { EmbedBuilder } from '../builders/EmbedBuilder';
import { ButtonBuilder } from '../builders/ButtonBuilder';
import { ActionRowBuilder } from '../builders/ActionRowBuilder';
import { ErrorEmbedBuilder } from '../builders/ErrorEmbedBuilder';

/**
 * Main Discord notifier client for posting messages, handling interactions, and managing rate limits
 */
export class DiscordNotifier {
  private client: Client;
  private options: ClientOptions;
  private messageService: MessageService;
  private interactionService: InteractionService;
  private rateLimitService: RateLimitService;
  private isConnected: boolean;

  constructor(options: ClientOptions) {
    this.options = options;
    this.isConnected = false;

    // Initialize Discord client with required intents
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
      ],
    });

    // Initialize services
    this.rateLimitService = new RateLimitService(options.debug);

    this.messageService = new MessageService(this.client, this.rateLimitService, {
      maxRetries: options.maxRetries,
      retryDelay: options.retryDelay,
      debug: options.debug,
    });

    this.interactionService = new InteractionService(this.client, options.debug);
  }

  /**
   * Connect to Discord
   * @returns Promise resolving when connection is established
   */
  async connect(): Promise<void> {
    if (this.isConnected) {
      return;
    }

    // Attach ready listener BEFORE logging in to avoid race condition
    const readyPromise = new Promise<void>((resolve) => {
      this.client.once('ready', () => {
        if (this.options.debug) {
          console.log(`Discord client ready. Logged in as ${this.client.user?.tag}`);
        }
        resolve();
      });
    });

    await this.client.login(this.options.token);
    await readyPromise;

    // Start listening for interactions
    this.interactionService.listen();

    this.isConnected = true;
  }

  /**
   * Disconnect from Discord
   * @returns Promise resolving when disconnection is complete
   */
  async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    // Stop listening for interactions
    this.interactionService.stop();

    // Destroy Discord client
    this.client.destroy();

    this.isConnected = false;

    if (this.options.debug) {
      console.log('Discord client disconnected');
    }
  }

  /**
   * Post a message with embeds and/or components
   * @param options - Message options
   * @param channelId - Optional channel ID (defaults to primary channel)
   * @returns Promise resolving to sent Message
   */
  async postMessage(options: MessageOptions, channelId?: string): Promise<Message> {
    const targetChannelId = channelId ?? this.options.channelId;
    return this.messageService.sendMessage(targetChannelId, options);
  }

  /**
   * Edit an existing message
   * @param messageId - ID of message to edit
   * @param options - Updated message options
   * @param channelId - Optional channel ID (defaults to primary channel)
   * @returns Promise resolving to updated Message
   */
  async editMessage(
    messageId: string,
    options: MessageOptions,
    channelId?: string
  ): Promise<Message> {
    const targetChannelId = channelId ?? this.options.channelId;
    return this.messageService.updateMessage(targetChannelId, messageId, options);
  }

  /**
   * Delete a message
   * @param messageId - ID of message to delete
   * @param channelId - Optional channel ID (defaults to primary channel)
   * @returns Promise resolving when delete completes
   */
  async deleteMessage(messageId: string, channelId?: string): Promise<void> {
    const targetChannelId = channelId ?? this.options.channelId;
    return this.messageService.removeMessage(targetChannelId, messageId);
  }

  /**
   * Post an error message to error channel (with fallback to primary channel)
   * @param error - Error object
   * @param context - Additional error context
   * @returns Promise resolving to sent Message (or undefined if both channels fail)
   */
  async postError(error: Error, context?: ErrorPostOptions): Promise<Message | undefined> {
    // Create error embed
    const errorEmbed = ErrorEmbedBuilder.fromError(error, context);

    const messageOptions: MessageOptions = {
      embeds: [
        {
          title: errorEmbed.build().data.title ?? undefined,
          description: errorEmbed.build().data.description ?? undefined,
          color: errorEmbed.build().data.color,
          fields: errorEmbed.build().data.fields?.map((f) => ({
            name: f.name,
            value: f.value,
            inline: f.inline,
          })),
          timestamp: errorEmbed.build().data.timestamp,
        },
      ],
    };

    // Try error channel first (if configured)
    if (this.options.errorChannelId) {
      try {
        return await this.postMessage(messageOptions, this.options.errorChannelId);
      } catch (errorChannelError) {
        if (this.options.debug) {
          console.warn('Failed to post to error channel, falling back to primary channel');
        }
      }
    }

    // Fall back to primary channel
    try {
      return await this.postMessage(messageOptions, this.options.channelId);
    } catch (primaryChannelError) {
      // Both channels failed, log to console but don't throw (avoid infinite error loop)
      console.error('Failed to post error to both error and primary channels:', error);
      return undefined;
    }
  }

  /**
   * Register a button click handler
   * @param customId - Custom ID of the button
   * @param handler - Async function to handle button clicks
   */
  onButtonClick(customId: string, handler: ButtonClickHandler): void {
    this.interactionService.registerHandler(customId, handler);
  }

  /**
   * Unregister a button click handler
   * @param customId - Custom ID to unregister
   */
  offButtonClick(customId: string): void {
    this.interactionService.unregisterHandler(customId);
  }

  /**
   * Create an embed builder
   * @param options - Optional embed options
   * @returns EmbedBuilder instance
   */
  createEmbed(options?: EmbedOptions): EmbedBuilder {
    return new EmbedBuilder(options);
  }

  /**
   * Create a button builder
   * @param options - Optional button options
   * @returns ButtonBuilder instance
   */
  createButton(options?: ButtonOptions): ButtonBuilder {
    return new ButtonBuilder(options);
  }

  /**
   * Create an action row builder
   * @param components - Optional array of button builders
   * @returns ActionRowBuilder instance
   */
  createActionRow(components?: ButtonBuilder[]): ActionRowBuilder {
    const row = new ActionRowBuilder();
    if (components && components.length > 0) {
      row.addComponents(...components);
    }
    return row;
  }

  /**
   * Get the underlying Discord.js client
   * @returns Discord.js Client instance
   */
  getClient(): Client {
    return this.client;
  }

  /**
   * Check if client is connected
   * @returns True if connected
   */
  isReady(): boolean {
    return this.isConnected && this.client.isReady();
  }
}
