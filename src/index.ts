// Main export
export { DiscordNotifier } from './client/DiscordNotifier';

// Types
export * from './types';

// Builders
export { EmbedBuilder } from './builders/EmbedBuilder';
export { ButtonBuilder } from './builders/ButtonBuilder';
export { ActionRowBuilder } from './builders/ActionRowBuilder';
export { ErrorEmbedBuilder } from './builders/ErrorEmbedBuilder';

// Utilities
export { TextTruncator } from './utils/TextTruncator';
export { ColorConverter } from './utils/ColorConverter';
export { RetryHandler } from './utils/RetryHandler';

// Errors
export * from './errors/DiscordErrors';

// Services (exported for advanced use cases)
export { MessageService } from './services/MessageService';
export { InteractionService } from './services/InteractionService';
export { RateLimitService } from './services/RateLimitService';
