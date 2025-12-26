import { ValidationError } from '../errors/DiscordErrors';

/**
 * Utility class for converting color formats to Discord's decimal format
 */
export class ColorConverter {
  /**
   * Predefined named colors
   */
  private static readonly NAMED_COLORS: Record<string, number> = {
    RED: 0xff0000,
    GREEN: 0x00ff00,
    BLUE: 0x0000ff,
    YELLOW: 0xffff00,
    ORANGE: 0xff8c00,
    PURPLE: 0x800080,
    PINK: 0xffc0cb,
    WHITE: 0xffffff,
    BLACK: 0x000000,
    GREY: 0x808080,
    GRAY: 0x808080,
    CYAN: 0x00ffff,
    MAGENTA: 0xff00ff,
    GOLD: 0xffd700,
    SILVER: 0xc0c0c0,
    BLURPLE: 0x5865f2, // Discord's blurple
  };

  /**
   * Convert color to decimal format
   * @param color - Hex string ("#FF5733"), decimal number, or named color
   * @returns Decimal color value
   * @throws ValidationError if color format is invalid
   */
  static toDecimal(color: string | number): number {
    // If already a number, validate and return
    if (typeof color === 'number') {
      if (color < 0 || color > 0xffffff) {
        throw new ValidationError(
          `Color must be between 0 and 16777215 (0xFFFFFF), got ${color}`,
          'color'
        );
      }
      return color;
    }

    // If string, determine format
    if (typeof color === 'string') {
      // Try hex format first (with or without #)
      if (color.startsWith('#') || /^[0-9A-Fa-f]{6}$/.test(color)) {
        return this.fromHex(color);
      }

      // Try named color
      return this.fromNamed(color);
    }

    throw new ValidationError(
      `Invalid color format. Expected hex string, decimal number, or named color, got ${typeof color}`,
      'color'
    );
  }

  /**
   * Convert hex string to decimal
   * @param hex - Hex color string (e.g., "#FF5733")
   * @returns Decimal color value
   * @throws ValidationError if hex format is invalid
   */
  static fromHex(hex: string): number {
    // Remove # if present
    const cleanHex = hex.startsWith('#') ? hex.substring(1) : hex;

    // Validate hex format
    if (!/^[0-9A-Fa-f]{6}$/.test(cleanHex)) {
      throw new ValidationError(
        `Invalid hex color format. Expected #RRGGBB or RRGGBB, got ${hex}`,
        'color'
      );
    }

    // Convert to decimal
    return parseInt(cleanHex, 16);
  }

  /**
   * Convert named color to decimal
   * @param name - Color name (e.g., "RED", "BLUE")
   * @returns Decimal color value
   * @throws ValidationError if color name is not recognized
   */
  static fromNamed(name: string): number {
    const upperName = name.toUpperCase();
    const color = this.NAMED_COLORS[upperName];

    if (color === undefined) {
      throw new ValidationError(
        `Unknown color name: ${name}. Available colors: ${Object.keys(this.NAMED_COLORS).join(', ')}`,
        'color'
      );
    }

    return color;
  }
}
