import { ColorConverter } from '../../../src/utils/ColorConverter';
import { ValidationError } from '../../../src/errors/DiscordErrors';

describe('ColorConverter', () => {
  describe('toDecimal', () => {
    it('should convert valid decimal number', () => {
      expect(ColorConverter.toDecimal(16711680)).toBe(16711680);
    });

    it('should convert hex string with #', () => {
      expect(ColorConverter.toDecimal('#FF0000')).toBe(16711680);
    });

    it('should convert hex string without #', () => {
      expect(ColorConverter.toDecimal('FF0000')).toBe(16711680);
    });

    it('should convert named color', () => {
      expect(ColorConverter.toDecimal('RED')).toBe(0xff0000);
    });

    it('should throw error for number out of range (too high)', () => {
      expect(() => ColorConverter.toDecimal(16777216)).toThrow(ValidationError);
    });

    it('should throw error for number out of range (negative)', () => {
      expect(() => ColorConverter.toDecimal(-1)).toThrow(ValidationError);
    });
  });

  describe('fromHex', () => {
    it('should convert hex with #', () => {
      expect(ColorConverter.fromHex('#FF0000')).toBe(16711680);
    });

    it('should convert hex without #', () => {
      expect(ColorConverter.fromHex('FF0000')).toBe(16711680);
    });

    it('should convert lowercase hex', () => {
      expect(ColorConverter.fromHex('#ff0000')).toBe(16711680);
    });

    it('should throw error for invalid hex format', () => {
      expect(() => ColorConverter.fromHex('#ZZZ000')).toThrow(ValidationError);
    });

    it('should throw error for short hex', () => {
      expect(() => ColorConverter.fromHex('#FFF')).toThrow(ValidationError);
    });

    it('should throw error for long hex', () => {
      expect(() => ColorConverter.fromHex('#FF000000')).toThrow(ValidationError);
    });
  });

  describe('fromNamed', () => {
    it('should convert RED', () => {
      expect(ColorConverter.fromNamed('RED')).toBe(0xff0000);
    });

    it('should convert GREEN', () => {
      expect(ColorConverter.fromNamed('GREEN')).toBe(0x00ff00);
    });

    it('should convert BLUE', () => {
      expect(ColorConverter.fromNamed('BLUE')).toBe(0x0000ff);
    });

    it('should convert ORANGE', () => {
      expect(ColorConverter.fromNamed('ORANGE')).toBe(0xff8c00);
    });

    it('should convert BLURPLE', () => {
      expect(ColorConverter.fromNamed('BLURPLE')).toBe(0x5865f2);
    });

    it('should be case insensitive', () => {
      expect(ColorConverter.fromNamed('red')).toBe(0xff0000);
      expect(ColorConverter.fromNamed('ReD')).toBe(0xff0000);
    });

    it('should handle GREY and GRAY', () => {
      expect(ColorConverter.fromNamed('GREY')).toBe(0x808080);
      expect(ColorConverter.fromNamed('GRAY')).toBe(0x808080);
    });

    it('should throw error for unknown color name', () => {
      expect(() => ColorConverter.fromNamed('UNKNOWN')).toThrow(ValidationError);
    });
  });
});
