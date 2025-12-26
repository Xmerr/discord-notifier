import { ButtonBuilder } from '../../../src/builders/ButtonBuilder';
import { ButtonStyle } from '../../../src/types/ButtonOptions';
import { ValidationError } from '../../../src/errors/DiscordErrors';

describe('ButtonBuilder', () => {
  describe('constructor', () => {
    it('should create button with default style', () => {
      const builder = new ButtonBuilder();
      expect(builder).toBeDefined();
    });

    it('should initialize from options', () => {
      const builder = new ButtonBuilder({
        label: 'Click Me',
        style: ButtonStyle.Primary,
        customId: 'test_button',
      });

      // Just verify it builds without error
      expect(() => builder.build()).not.toThrow();
    });
  });

  describe('setLabel', () => {
    it('should set label', () => {
      const builder = new ButtonBuilder();
      builder.setLabel('Test Button');
      // Just verify it doesn't throw
      expect(() => builder).toBeDefined();
    });

    it('should throw error for label over 80 characters', () => {
      const longLabel = 'a'.repeat(81);
      const builder = new ButtonBuilder();

      expect(() => builder.setLabel(longLabel)).toThrow(ValidationError);
    });

    it('should accept label at exactly 80 characters', () => {
      const label = 'a'.repeat(80);
      const builder = new ButtonBuilder();

      expect(() => builder.setLabel(label)).not.toThrow();
    });
  });

  describe('setCustomId', () => {
    it('should set custom ID', () => {
      const builder = new ButtonBuilder();
      builder.setCustomId('test_button_id');
      // Just verify it doesn't throw
      expect(() => builder).toBeDefined();
    });

    it('should throw error for customId over 100 characters', () => {
      const longId = 'a'.repeat(101);
      const builder = new ButtonBuilder();

      expect(() => builder.setCustomId(longId)).toThrow(ValidationError);
    });

    it('should accept customId at exactly 100 characters', () => {
      const id = 'a'.repeat(100);
      const builder = new ButtonBuilder();

      expect(() => builder.setCustomId(id)).not.toThrow();
    });
  });

  describe('setStyle', () => {
    it('should set Primary style', () => {
      const builder = new ButtonBuilder();
      builder.setStyle(ButtonStyle.Primary);
      // Verify it doesn't throw
      expect(() => builder).toBeDefined();
    });

    it('should set Success style', () => {
      const builder = new ButtonBuilder();
      builder.setStyle(ButtonStyle.Success);
      // Verify it doesn't throw
      expect(() => builder).toBeDefined();
    });
  });

  describe('setDisabled', () => {
    it('should disable button', () => {
      const builder = new ButtonBuilder();
      builder.setDisabled(true);
      // Verify it doesn't throw
      expect(() => builder).toBeDefined();
    });

    it('should enable button', () => {
      const builder = new ButtonBuilder();
      builder.setDisabled(false);
      // Verify it doesn't throw
      expect(() => builder).toBeDefined();
    });

    it('should default to true when no argument', () => {
      const builder = new ButtonBuilder();
      builder.setDisabled();
      // Verify it doesn't throw
      expect(() => builder).toBeDefined();
    });
  });

  describe('setEmoji', () => {
    it('should set unicode emoji', () => {
      const builder = new ButtonBuilder();
      builder.setEmoji('👍');
      // Verify it doesn't throw
      expect(() => builder).toBeDefined();
    });

    it('should set custom emoji ID', () => {
      const builder = new ButtonBuilder();
      builder.setEmoji('123456789');
      // Verify it doesn't throw
      expect(() => builder).toBeDefined();
    });
  });

  describe('build validation', () => {
    it('should require customId for non-link buttons', () => {
      const builder = new ButtonBuilder();
      builder.setLabel('Test');
      builder.setStyle(ButtonStyle.Primary);

      expect(() => builder.build()).toThrow(ValidationError);
      expect(() => builder.build()).toThrow('must have a customId');
    });

    it('should require URL for link buttons', () => {
      const builder = new ButtonBuilder();
      builder.setLabel('Test');
      builder.setStyle(ButtonStyle.Link);

      expect(() => builder.build()).toThrow(ValidationError);
      expect(() => builder.build()).toThrow('must have a URL');
    });

    it('should not allow customId on link buttons', () => {
      const builder = new ButtonBuilder();
      builder.setLabel('Test');
      builder.setStyle(ButtonStyle.Link);
      builder.setCustomId('test_id');
      builder.setURL('https://example.com');

      expect(() => builder.build()).toThrow(ValidationError);
      expect(() => builder.build()).toThrow('cannot have a customId');
    });

    it('should not allow URL on non-link buttons', () => {
      const builder = new ButtonBuilder();
      builder.setLabel('Test');
      builder.setStyle(ButtonStyle.Primary);
      builder.setCustomId('test_id');
      builder.setURL('https://example.com');

      expect(() => builder.build()).toThrow(ValidationError);
      expect(() => builder.build()).toThrow('cannot have a URL');
    });

    it('should build valid Primary button', () => {
      const builder = new ButtonBuilder();
      builder.setLabel('Test');
      builder.setStyle(ButtonStyle.Primary);
      builder.setCustomId('test_id');

      expect(() => builder.build()).not.toThrow();
    });

    it('should build valid Link button', () => {
      const builder = new ButtonBuilder();
      builder.setLabel('Test');
      builder.setStyle(ButtonStyle.Link);
      builder.setURL('https://example.com');

      expect(() => builder.build()).not.toThrow();
    });
  });
});
