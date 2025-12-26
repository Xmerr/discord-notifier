import { ErrorEmbedBuilder } from '../../../src/builders/ErrorEmbedBuilder';
import { ValidationError } from '../../../src/errors/DiscordErrors';

describe('ErrorEmbedBuilder', () => {
  describe('fromError', () => {
    it('should create embed from error', () => {
      const error = new Error('Test error message');
      const embed = ErrorEmbedBuilder.fromError(error);
      const built = embed.build();

      expect(built.data.title).toContain('Error:');
      expect(built.data.description).toContain('Test error message');
    });

    it('should include operation in fields', () => {
      const error = new Error('Test error');
      const embed = ErrorEmbedBuilder.fromError(error, { operation: 'testOperation' });
      const built = embed.build();

      const operationField = built.data.fields?.find((f) => f.name === 'Operation');
      expect(operationField).toBeDefined();
      expect(operationField?.value).toBe('testOperation');
    });

    it('should include metadata in fields', () => {
      const error = new Error('Test error');
      const embed = ErrorEmbedBuilder.fromError(error, {
        metadata: { key: 'value' },
      });
      const built = embed.build();

      const metadataField = built.data.fields?.find((f) => f.name === 'Metadata');
      expect(metadataField).toBeDefined();
    });

    it('should include stack trace by default', () => {
      const error = new Error('Test error');
      const embed = ErrorEmbedBuilder.fromError(error);
      const built = embed.build();

      expect(built.data.description).toContain('Stack Trace:');
    });

    it('should exclude stack trace when requested', () => {
      const error = new Error('Test error');
      const embed = ErrorEmbedBuilder.fromError(error, { includeStack: false });
      const built = embed.build();

      expect(built.data.description).not.toContain('Stack Trace:');
    });
  });

  describe('getErrorColor', () => {
    it('should return orange for validation errors', () => {
      const error = new ValidationError('Test validation error');
      const color = ErrorEmbedBuilder.getErrorColor(error);

      expect(color).toBe(0xff8c00); // Orange
    });

    it('should return red for generic errors', () => {
      const error = new Error('Test error');
      const color = ErrorEmbedBuilder.getErrorColor(error);

      expect(color).toBe(0xff0000); // Red
    });
  });
});
