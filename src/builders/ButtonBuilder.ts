import { ButtonBuilder as DiscordButtonBuilder } from '@discordjs/builders';
import { ButtonStyle as DiscordButtonStyle } from 'discord.js';
import { ButtonOptions, ButtonStyle } from '../types/ButtonOptions';
import { ValidationError } from '../errors/DiscordErrors';

/**
 * Builder for creating Discord buttons with validation
 */
export class ButtonBuilder {
  private button: DiscordButtonBuilder;
  private customId?: string;
  private url?: string;
  private style: ButtonStyle;

  constructor(options?: ButtonOptions) {
    this.button = new DiscordButtonBuilder();
    this.style = ButtonStyle.Secondary; // Default style

    if (options) {
      this.fromOptions(options);
    }
  }

  /**
   * Initialize button from options object
   * @param options - Button options
   * @returns this for chaining
   */
  private fromOptions(options: ButtonOptions): this {
    if (options.label) {
      this.setLabel(options.label);
    }

    if (options.style !== undefined) {
      this.setStyle(options.style);
    }

    if (options.customId) {
      this.setCustomId(options.customId);
    }

    if (options.url) {
      this.setURL(options.url);
    }

    if (options.disabled !== undefined) {
      this.setDisabled(options.disabled);
    }

    if (options.emoji) {
      this.setEmoji(options.emoji);
    }

    return this;
  }

  /**
   * Set custom ID (required for non-link buttons)
   * @param customId - Unique identifier for button
   * @returns this for chaining
   * @throws ValidationError if customId exceeds 100 characters
   */
  setCustomId(customId: string): this {
    if (customId.length > 100) {
      throw new ValidationError(
        `Button customId must be 100 characters or less, got ${customId.length}`,
        'customId'
      );
    }

    this.customId = customId;
    this.button.setCustomId(customId);
    return this;
  }

  /**
   * Set button label
   * @param label - Button text (max 80 characters)
   * @returns this for chaining
   * @throws ValidationError if label exceeds 80 characters
   */
  setLabel(label: string): this {
    if (label.length > 80) {
      throw new ValidationError(
        `Button label must be 80 characters or less, got ${label.length}`,
        'label'
      );
    }

    this.button.setLabel(label);
    return this;
  }

  /**
   * Set button style
   * @param style - ButtonStyle enum value
   * @returns this for chaining
   */
  setStyle(style: ButtonStyle): this {
    this.style = style;
    this.button.setStyle(style as unknown as DiscordButtonStyle);
    return this;
  }

  /**
   * Set URL for link button (required when style is Link)
   * @param url - Button URL
   * @returns this for chaining
   */
  setURL(url: string): this {
    this.url = url;
    this.button.setURL(url);
    return this;
  }

  /**
   * Set disabled state
   * @param disabled - Whether button is disabled (default: true)
   * @returns this for chaining
   */
  setDisabled(disabled = true): this {
    this.button.setDisabled(disabled);
    return this;
  }

  /**
   * Set button emoji
   * @param emoji - Unicode emoji or custom emoji ID
   * @returns this for chaining
   */
  setEmoji(emoji: string): this {
    // Parse emoji - if it's just a unicode emoji, use it directly
    // If it's a custom emoji ID, format it properly
    if (emoji.match(/^\d+$/)) {
      // Custom emoji ID
      this.button.setEmoji({ id: emoji });
    } else {
      // Unicode emoji
      this.button.setEmoji({ name: emoji });
    }
    return this;
  }

  /**
   * Build and return discord.js ButtonBuilder instance
   * @returns Discord.js ButtonBuilder
   * @throws ValidationError if required fields missing
   */
  build(): DiscordButtonBuilder {
    // Validate button configuration
    if (this.style === ButtonStyle.Link) {
      // Link buttons must have URL and must NOT have customId
      if (!this.url) {
        throw new ValidationError(
          'Link buttons must have a URL set',
          'url'
        );
      }
      if (this.customId) {
        throw new ValidationError(
          'Link buttons cannot have a customId (use URL instead)',
          'customId'
        );
      }
    } else {
      // Non-link buttons must have customId and must NOT have URL
      if (!this.customId) {
        throw new ValidationError(
          `${ButtonStyle[this.style]} buttons must have a customId`,
          'customId'
        );
      }
      if (this.url) {
        throw new ValidationError(
          `${ButtonStyle[this.style]} buttons cannot have a URL (only Link buttons can)`,
          'url'
        );
      }
    }

    return this.button;
  }
}
