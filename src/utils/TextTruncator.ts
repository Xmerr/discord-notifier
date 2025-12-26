/**
 * Utility class for truncating text to Discord's character limits
 */
export class TextTruncator {
  private static readonly ELLIPSIS = '...';

  /**
   * Truncate text to specified limit, appending "..." if truncated
   * @param text - Text to truncate
   * @param limit - Maximum character limit
   * @returns Truncated text
   */
  static truncate(text: string, limit: number): string {
    if (!text) {
      return '';
    }

    if (text.length <= limit) {
      return text;
    }

    return text.substring(0, limit - this.ELLIPSIS.length) + this.ELLIPSIS;
  }

  /**
   * Truncate embed title (max 256 characters)
   * @param text - Title text
   * @returns Truncated title
   */
  static truncateTitle(text: string): string {
    return this.truncate(text, 256);
  }

  /**
   * Truncate embed description (max 4096 characters)
   * @param text - Description text
   * @returns Truncated description
   */
  static truncateDescription(text: string): string {
    return this.truncate(text, 4096);
  }

  /**
   * Truncate embed field name (max 256 characters)
   * @param text - Field name
   * @returns Truncated field name
   */
  static truncateFieldName(text: string): string {
    return this.truncate(text, 256);
  }

  /**
   * Truncate embed field value (max 1024 characters)
   * @param text - Field value
   * @returns Truncated field value
   */
  static truncateFieldValue(text: string): string {
    return this.truncate(text, 1024);
  }

  /**
   * Truncate embed footer text (max 2048 characters)
   * @param text - Footer text
   * @returns Truncated footer text
   */
  static truncateFooter(text: string): string {
    return this.truncate(text, 2048);
  }
}
