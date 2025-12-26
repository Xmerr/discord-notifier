import {
  DiscordNotifierError,
  RateLimitError,
  PermissionError,
  ChannelNotFoundError,
  InteractionTimeoutError,
  ValidationError,
} from '../../../src/errors/DiscordErrors';

describe('DiscordErrors', () => {
  describe('DiscordNotifierError', () => {
    it('should create base error with message', () => {
      const error = new DiscordNotifierError('Test error');

      expect(error.message).toBe('Test error');
      expect(error.name).toBe('DiscordNotifierError');
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(DiscordNotifierError);
    });
  });

  describe('RateLimitError', () => {
    it('should create error with retry time', () => {
      const error = new RateLimitError(5000);

      expect(error.message).toBe('Rate limited. Retry after 5000ms');
      expect(error.name).toBe('RateLimitError');
      expect(error.retryAfter).toBe(5000);
      expect(error.channelId).toBeUndefined();
      expect(error).toBeInstanceOf(RateLimitError);
      expect(error).toBeInstanceOf(DiscordNotifierError);
    });

    it('should create error with channel ID', () => {
      const error = new RateLimitError(3000, 'channel123');

      expect(error.retryAfter).toBe(3000);
      expect(error.channelId).toBe('channel123');
    });
  });

  describe('PermissionError', () => {
    it('should create error with message only', () => {
      const error = new PermissionError('Missing permission');

      expect(error.message).toBe('Missing permission');
      expect(error.name).toBe('PermissionError');
      expect(error.requiredPermission).toBeUndefined();
      expect(error.channelId).toBeUndefined();
      expect(error).toBeInstanceOf(PermissionError);
      expect(error).toBeInstanceOf(DiscordNotifierError);
    });

    it('should create error with required permission', () => {
      const error = new PermissionError('Missing permission', 'SEND_MESSAGES');

      expect(error.message).toBe('Missing permission');
      expect(error.requiredPermission).toBe('SEND_MESSAGES');
      expect(error.channelId).toBeUndefined();
    });

    it('should create error with permission and channel ID', () => {
      const error = new PermissionError('Missing permission', 'SEND_MESSAGES', 'channel123');

      expect(error.requiredPermission).toBe('SEND_MESSAGES');
      expect(error.channelId).toBe('channel123');
    });
  });

  describe('ChannelNotFoundError', () => {
    it('should create error with channel ID', () => {
      const error = new ChannelNotFoundError('channel123');

      expect(error.message).toBe('Channel not found: channel123');
      expect(error.name).toBe('ChannelNotFoundError');
      expect(error.channelId).toBe('channel123');
      expect(error).toBeInstanceOf(ChannelNotFoundError);
      expect(error).toBeInstanceOf(DiscordNotifierError);
    });
  });

  describe('InteractionTimeoutError', () => {
    it('should create error with custom ID', () => {
      const error = new InteractionTimeoutError('download_button');

      expect(error.message).toBe(
        'Interaction timed out for button: download_button. Must acknowledge within 3 seconds.'
      );
      expect(error.name).toBe('InteractionTimeoutError');
      expect(error.customId).toBe('download_button');
      expect(error).toBeInstanceOf(InteractionTimeoutError);
      expect(error).toBeInstanceOf(DiscordNotifierError);
    });
  });

  describe('ValidationError', () => {
    it('should create error with message only', () => {
      const error = new ValidationError('Invalid input');

      expect(error.message).toBe('Invalid input');
      expect(error.name).toBe('ValidationError');
      expect(error.field).toBeUndefined();
      expect(error).toBeInstanceOf(ValidationError);
      expect(error).toBeInstanceOf(DiscordNotifierError);
    });

    it('should create error with field name', () => {
      const error = new ValidationError('Invalid input', 'username');

      expect(error.message).toBe('Invalid input');
      expect(error.field).toBe('username');
    });
  });
});
