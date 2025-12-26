import { EmbedBuilder } from './EmbedBuilder';
import { ErrorPostOptions } from '../types/MessageOptions';

/**
 * Specialized builder for error notification embeds
 */
export class ErrorEmbedBuilder {
  /**
   * Create error embed from Error object
   * @param error - Error instance
   * @param context - Additional context (operation, metadata)
   * @returns EmbedBuilder configured for error display
   */
  static fromError(error: Error, context?: ErrorPostOptions): EmbedBuilder {
    const embed = new EmbedBuilder();

    // Set title with error name
    embed.setTitle(`❌ Error: ${error.name || 'Unknown Error'}`);

    // Format description
    const description = this.formatErrorDescription(
      error,
      context?.includeStack ?? true
    );
    embed.setDescription(description);

    // Set color based on error type
    const color = this.getErrorColor(error);
    embed.setColor(color);

    // Add operation if provided
    if (context?.operation) {
      embed.addField('Operation', context.operation, false);
    }

    // Add metadata if provided
    if (context?.metadata) {
      const metadataStr = JSON.stringify(context.metadata, null, 2);
      if (metadataStr.length < 1024) {
        embed.addField('Metadata', `\`\`\`json\n${metadataStr}\n\`\`\``, false);
      }
    }

    // Set timestamp
    embed.setTimestamp(new Date());

    return embed;
  }

  /**
   * Format error for embed description
   * @param error - Error instance
   * @param includeStack - Whether to include stack trace (default: true)
   * @returns Formatted error description
   */
  static formatErrorDescription(error: Error, includeStack = true): string {
    let description = error.message || 'No error message provided';

    if (includeStack && error.stack) {
      // Extract first few lines of stack trace
      const stackLines = error.stack.split('\n').slice(0, 10);
      const stackTrace = stackLines.join('\n');

      description += `\n\n**Stack Trace:**\n\`\`\`\n${stackTrace}\n\`\`\``;
    }

    return description;
  }

  /**
   * Get appropriate color for error type
   * @param error - Error instance
   * @returns Decimal color code (red for critical, orange for warnings)
   */
  static getErrorColor(error: Error): number {
    // Check error name for warnings
    if (
      error.name.toLowerCase().includes('warning') ||
      error.name.toLowerCase().includes('validation')
    ) {
      return 0xff8c00; // Orange for warnings
    }

    // Default to red for errors
    return 0xff0000; // Red
  }
}
