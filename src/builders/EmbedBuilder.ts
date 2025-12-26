import { EmbedBuilder as DiscordEmbedBuilder } from '@discordjs/builders';
import { EmbedOptions } from '../types/EmbedOptions';
import { TextTruncator } from '../utils/TextTruncator';
import { ColorConverter } from '../utils/ColorConverter';

/**
 * Builder for creating Discord embeds with automatic text truncation
 */
export class EmbedBuilder {
  private embed: DiscordEmbedBuilder;

  constructor(options?: EmbedOptions) {
    this.embed = new DiscordEmbedBuilder();

    if (options) {
      this.fromOptions(options);
    }
  }

  /**
   * Initialize embed from options object
   * @param options - Embed options
   * @returns this for chaining
   */
  private fromOptions(options: EmbedOptions): this {
    // Handle adult content suppression first
    if (options.suppressAdultImages) {
      // Remove images
      options.thumbnail = undefined;
      options.image = undefined;

      // Add warning to description
      if (options.description) {
        options.description = '⚠️ Content Warning: ' + options.description;
      }

      // Set warning color if not already set
      if (!options.color) {
        options.color = '#FF8C00'; // Orange
      }
    }

    if (options.title) {
      this.setTitle(options.title);
    }

    if (options.description) {
      this.setDescription(options.description);
    }

    if (options.color !== undefined) {
      this.setColor(options.color);
    }

    if (options.url) {
      this.setURL(options.url);
    }

    if (options.thumbnail) {
      this.setThumbnail(options.thumbnail);
    }

    if (options.image) {
      this.setImage(options.image);
    }

    if (options.fields) {
      for (const field of options.fields) {
        this.addField(field.name, field.value, field.inline);
      }
    }

    if (options.footer) {
      this.setFooter(options.footer, options.footerIcon);
    }

    if (options.timestamp) {
      this.setTimestamp(options.timestamp);
    }

    if (options.authorName) {
      this.setAuthor(options.authorName, options.authorIcon, options.authorUrl);
    }

    return this;
  }

  /**
   * Set embed title (auto-truncates to 256 characters)
   * @param title - Embed title text
   * @returns this for chaining
   */
  setTitle(title: string): this {
    const truncated = TextTruncator.truncateTitle(title);
    this.embed.setTitle(truncated);
    return this;
  }

  /**
   * Set embed description (auto-truncates to 4096 characters)
   * @param description - Embed description text
   * @returns this for chaining
   */
  setDescription(description: string): this {
    const truncated = TextTruncator.truncateDescription(description);
    this.embed.setDescription(truncated);
    return this;
  }

  /**
   * Set embed color
   * @param color - Hex string ("#FF5733"), decimal number, or named color ("RED")
   * @returns this for chaining
   */
  setColor(color: string | number): this {
    const decimal = ColorConverter.toDecimal(color);
    this.embed.setColor(decimal);
    return this;
  }

  /**
   * Set thumbnail image
   * @param url - Image URL
   * @returns this for chaining
   */
  setThumbnail(url: string): this {
    this.embed.setThumbnail(url);
    return this;
  }

  /**
   * Set main image
   * @param url - Image URL
   * @returns this for chaining
   */
  setImage(url: string): this {
    this.embed.setImage(url);
    return this;
  }

  /**
   * Add a field to the embed
   * @param name - Field name (auto-truncates to 256 chars)
   * @param value - Field value (auto-truncates to 1024 chars)
   * @param inline - Whether field displays inline (default: false)
   * @returns this for chaining
   */
  addField(name: string, value: string, inline = false): this {
    const truncatedName = TextTruncator.truncateFieldName(name);
    const truncatedValue = TextTruncator.truncateFieldValue(value);
    this.embed.addFields({ name: truncatedName, value: truncatedValue, inline });
    return this;
  }

  /**
   * Set footer text
   * @param text - Footer text (auto-truncates to 2048 chars)
   * @param iconURL - Optional footer icon URL
   * @returns this for chaining
   */
  setFooter(text: string, iconURL?: string): this {
    const truncated = TextTruncator.truncateFooter(text);
    this.embed.setFooter({ text: truncated, iconURL });
    return this;
  }

  /**
   * Set timestamp
   * @param date - Date object or ISO string (default: current time)
   * @returns this for chaining
   */
  setTimestamp(date?: Date | string): this {
    if (date === undefined) {
      this.embed.setTimestamp();
    } else if (typeof date === 'string') {
      this.embed.setTimestamp(new Date(date).getTime());
    } else {
      this.embed.setTimestamp(date.getTime());
    }
    return this;
  }

  /**
   * Set author
   * @param name - Author name
   * @param iconURL - Optional author icon URL
   * @param url - Optional author URL (makes name clickable)
   * @returns this for chaining
   */
  setAuthor(name: string, iconURL?: string, url?: string): this {
    this.embed.setAuthor({ name, iconURL, url });
    return this;
  }

  /**
   * Set title URL (makes title clickable)
   * @param url - URL
   * @returns this for chaining
   */
  setURL(url: string): this {
    this.embed.setURL(url);
    return this;
  }

  /**
   * Build and return discord.js EmbedBuilder instance
   * @returns Discord.js EmbedBuilder
   */
  build(): DiscordEmbedBuilder {
    return this.embed;
  }
}
