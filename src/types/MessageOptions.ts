import { EmbedOptions } from './EmbedOptions';
import { ActionRowBuilder } from '../builders/ActionRowBuilder';

/**
 * Options for posting or editing a message
 */
export interface MessageOptions {
  /**
   * Message content (plain text)
   */
  content?: string;

  /**
   * Array of embeds to include in the message
   */
  embeds?: EmbedOptions[];

  /**
   * Array of action rows containing interactive components (buttons)
   */
  components?: ActionRowBuilder[];
}

/**
 * Represents a sent message
 */
export interface Message {
  /**
   * Unique message ID
   */
  id: string;

  /**
   * Channel ID where message was sent
   */
  channelId: string;

  /**
   * Guild ID (server) where message was sent
   */
  guildId?: string;

  /**
   * Timestamp when message was created
   */
  createdAt: Date;

  /**
   * Message content
   */
  content?: string;

  /**
   * Message embeds
   */
  embeds?: EmbedOptions[];
}

/**
 * Options for error posting
 */
export interface ErrorPostOptions {
  /**
   * Operation that failed
   */
  operation?: string;

  /**
   * Additional metadata to include in error embed
   */
  metadata?: Record<string, unknown>;

  /**
   * Whether to include stack trace (default: true)
   */
  includeStack?: boolean;
}
