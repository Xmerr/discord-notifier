/**
 * Options for creating an embed
 */
export interface EmbedOptions {
  /**
   * Embed title (max 256 characters, auto-truncated)
   */
  title?: string;

  /**
   * Embed description (max 4096 characters, auto-truncated)
   */
  description?: string;

  /**
   * Embed color (hex string like "#FF5733", decimal number, or named color)
   */
  color?: string | number;

  /**
   * Thumbnail image URL
   */
  thumbnail?: string;

  /**
   * Main image URL
   */
  image?: string;

  /**
   * Array of embed fields
   */
  fields?: EmbedField[];

  /**
   * Footer text (max 2048 characters, auto-truncated)
   */
  footer?: string;

  /**
   * Footer icon URL
   */
  footerIcon?: string;

  /**
   * Timestamp (ISO string or Date object)
   */
  timestamp?: string | Date;

  /**
   * Author name
   */
  authorName?: string;

  /**
   * Author icon URL
   */
  authorIcon?: string;

  /**
   * Author URL (clickable link on author name)
   */
  authorUrl?: string;

  /**
   * URL to make the title clickable
   */
  url?: string;

  /**
   * If true, removes thumbnail and image URLs and adds content warning
   */
  suppressAdultImages?: boolean;
}

/**
 * Represents an embed field
 */
export interface EmbedField {
  /**
   * Field name (max 256 characters, auto-truncated)
   */
  name: string;

  /**
   * Field value (max 1024 characters, auto-truncated)
   */
  value: string;

  /**
   * Whether field should display inline (default: false)
   */
  inline?: boolean;
}
