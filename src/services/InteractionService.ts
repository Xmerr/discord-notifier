import { Client, Interaction, ButtonInteraction } from 'discord.js';
import { ButtonClickHandler, ButtonInteractionContext } from '../types/ButtonOptions';
import { InteractionTimeoutError } from '../errors/DiscordErrors';

/**
 * Service for managing Discord interaction handling (buttons)
 */
export class InteractionService {
  private client: Client;
  private handlers: Map<string, ButtonClickHandler>;
  private debug: boolean;
  private isListening: boolean;

  constructor(client: Client, debug = false) {
    this.client = client;
    this.handlers = new Map();
    this.debug = debug;
    this.isListening = false;
  }

  /**
   * Register a button click handler
   * @param customId - Custom ID of the button
   * @param handler - Async function to handle button clicks
   */
  registerHandler(customId: string, handler: ButtonClickHandler): void {
    this.handlers.set(customId, handler);

    if (this.debug) {
      console.log(`Registered handler for button: ${customId}`);
    }
  }

  /**
   * Unregister a button click handler
   * @param customId - Custom ID to unregister
   */
  unregisterHandler(customId: string): void {
    this.handlers.delete(customId);

    if (this.debug) {
      console.log(`Unregistered handler for button: ${customId}`);
    }
  }

  /**
   * Handle an incoming interaction event
   * @param interaction - Discord.js Interaction
   * @returns Promise resolving when handler completes
   */
  async handleInteraction(interaction: Interaction): Promise<void> {
    // Only handle button interactions
    if (!interaction.isButton()) {
      return;
    }

    const buttonInteraction = interaction as ButtonInteraction;
    const customId = buttonInteraction.customId;

    if (this.debug) {
      console.log(`Received button interaction: ${customId}`);
    }

    // Look up handler
    const handler = this.handlers.get(customId);

    if (!handler) {
      if (this.debug) {
        console.warn(`No handler registered for button: ${customId}`);
      }
      return;
    }

    // Create interaction context
    const context: ButtonInteractionContext = {
      messageId: buttonInteraction.message.id,
      channelId: buttonInteraction.channelId,
      guildId: buttonInteraction.guildId ?? undefined,
      userId: buttonInteraction.user.id,
      customId,
    };

    // Track if handler acknowledges within 3 seconds
    const startTime = Date.now();
    let acknowledged = false;

    // Monitor if interaction is acknowledged
    const checkAcknowledgment = () => {
      if (buttonInteraction.replied || buttonInteraction.deferred) {
        acknowledged = true;
      }
    };

    try {
      // Execute handler
      await handler(buttonInteraction, context);

      // Check if handler acknowledged
      checkAcknowledgment();

      // Check if handler acknowledged within 3 seconds
      const elapsedTime = Date.now() - startTime;
      if (!acknowledged && elapsedTime > 3000) {
        throw new InteractionTimeoutError(customId);
      }
    } catch (error) {
      console.error(`Error handling button interaction ${customId}:`, error);

      // Try to send error response if not already acknowledged
      if (!buttonInteraction.replied && !buttonInteraction.deferred) {
        try {
          await buttonInteraction.reply({
            content: 'An error occurred while processing your request.',
            ephemeral: true,
          });
        } catch (replyError) {
          // Ignore reply errors (interaction may have expired)
        }
      }

      throw error;
    }
  }

  /**
   * Start listening for interaction events
   */
  listen(): void {
    if (this.isListening) {
      return;
    }

    this.client.on('interactionCreate', this.handleInteraction.bind(this));
    this.isListening = true;

    if (this.debug) {
      console.log('InteractionService now listening for interactions');
    }
  }

  /**
   * Stop listening for interaction events
   */
  stop(): void {
    if (!this.isListening) {
      return;
    }

    this.client.off('interactionCreate', this.handleInteraction.bind(this));
    this.isListening = false;

    if (this.debug) {
      console.log('InteractionService stopped listening');
    }
  }
}
