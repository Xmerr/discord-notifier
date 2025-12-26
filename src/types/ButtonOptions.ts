/**
 * Button styles supported by Discord
 */
export enum ButtonStyle {
  /**
   * Blurple button (Primary)
   */
  Primary = 1,

  /**
   * Grey button (Secondary)
   */
  Secondary = 2,

  /**
   * Green button (Success)
   */
  Success = 3,

  /**
   * Red button (Danger)
   */
  Danger = 4,

  /**
   * Grey button with link (Link)
   */
  Link = 5,
}

/**
 * Options for creating a button
 */
export interface ButtonOptions {
  /**
   * Custom ID for the button (required for non-link buttons)
   * Used to identify which handler should be called
   */
  customId?: string;

  /**
   * Button label text
   */
  label: string;

  /**
   * Button style (default: Secondary)
   */
  style?: ButtonStyle;

  /**
   * URL for link buttons (required when style is Link)
   */
  url?: string;

  /**
   * Whether button is disabled (default: false)
   */
  disabled?: boolean;

  /**
   * Emoji to display on button (can be unicode emoji or custom emoji ID)
   */
  emoji?: string;
}

/**
 * Context passed to button click handlers
 */
export interface ButtonInteractionContext {
  /**
   * Message ID where button was clicked
   */
  messageId: string;

  /**
   * Channel ID where button was clicked
   */
  channelId: string;

  /**
   * Guild ID (server) where button was clicked
   */
  guildId?: string;

  /**
   * User ID who clicked the button
   */
  userId: string;

  /**
   * Custom ID of the button that was clicked
   */
  customId: string;
}

/**
 * Handler function for button clicks
 */
export type ButtonClickHandler = (
  interaction: any, // discord.js ButtonInteraction type
  context: ButtonInteractionContext
) => Promise<void>;
