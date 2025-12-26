import { TextTruncator } from '../../../src/utils/TextTruncator';

describe('TextTruncator', () => {
  describe('truncate', () => {
    it('should return empty string for empty input', () => {
      expect(TextTruncator.truncate('', 100)).toBe('');
    });

    it('should return original text if under limit', () => {
      const text = 'Short text';
      expect(TextTruncator.truncate(text, 100)).toBe(text);
    });

    it('should return original text if exactly at limit', () => {
      const text = 'a'.repeat(100);
      expect(TextTruncator.truncate(text, 100)).toBe(text);
    });

    it('should truncate text over limit and add ellipsis', () => {
      const text = 'a'.repeat(105);
      const result = TextTruncator.truncate(text, 100);

      expect(result).toHaveLength(100);
      expect(result.endsWith('...')).toBe(true);
    });

    it('should handle unicode characters correctly', () => {
      const text = '🎉'.repeat(60);
      const result = TextTruncator.truncate(text, 100);

      expect(result.length).toBeLessThanOrEqual(100);
    });
  });

  describe('truncateTitle', () => {
    it('should truncate to 256 characters', () => {
      const text = 'a'.repeat(300);
      const result = TextTruncator.truncateTitle(text);

      expect(result).toHaveLength(256);
      expect(result.endsWith('...')).toBe(true);
    });

    it('should not truncate text under 256 characters', () => {
      const text = 'a'.repeat(200);
      expect(TextTruncator.truncateTitle(text)).toBe(text);
    });
  });

  describe('truncateDescription', () => {
    it('should truncate to 4096 characters', () => {
      const text = 'a'.repeat(5000);
      const result = TextTruncator.truncateDescription(text);

      expect(result).toHaveLength(4096);
      expect(result.endsWith('...')).toBe(true);
    });

    it('should not truncate text under 4096 characters', () => {
      const text = 'a'.repeat(4000);
      expect(TextTruncator.truncateDescription(text)).toBe(text);
    });
  });

  describe('truncateFieldName', () => {
    it('should truncate to 256 characters', () => {
      const text = 'a'.repeat(300);
      const result = TextTruncator.truncateFieldName(text);

      expect(result).toHaveLength(256);
      expect(result.endsWith('...')).toBe(true);
    });
  });

  describe('truncateFieldValue', () => {
    it('should truncate to 1024 characters', () => {
      const text = 'a'.repeat(1100);
      const result = TextTruncator.truncateFieldValue(text);

      expect(result).toHaveLength(1024);
      expect(result.endsWith('...')).toBe(true);
    });
  });

  describe('truncateFooter', () => {
    it('should truncate to 2048 characters', () => {
      const text = 'a'.repeat(2100);
      const result = TextTruncator.truncateFooter(text);

      expect(result).toHaveLength(2048);
      expect(result.endsWith('...')).toBe(true);
    });
  });
});
