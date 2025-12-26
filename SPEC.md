Project Overview
Create a standalone npm package that provides a TypeScript client for Discord bot integration with rich embeds, interactive components (buttons), and message management. This package is designed for notification bots that post game releases, news, or other content to Discord channels.
Package Metadata

Name: @xmer/discord-notifier
Version: 1.0.0
Description: Discord bot client for posting rich embeds and handling interactive components
License: MIT
Standalone package at repository root
Built with TypeScript 5.3+
Uses discord.js v14 as the underlying Discord API client
Main exports: `dist/index.js` with types at `dist/index.d.ts`

Core Requirements
1. Discord Client Wrapper

Authenticate with Discord Bot API using bot token
Manage WebSocket connection lifecycle (connect, reconnect, disconnect)
Handle Discord rate limits with exponential backoff
Support multiple channels (main channel + error channel)
Graceful degradation if error channel is unavailable

2. Rich Embed Builder

Create visually appealing embeds for game/content notifications
Support all Discord embed fields:

Title (with optional URL)
Description
Color (hex code)
Thumbnail image
Main image
Footer (text + timestamp)
Fields (name/value pairs, inline/block)


Auto-truncate fields to Discord limits (title: 256, description: 4096, field value: 1024)
Support for adult content warnings (suppress images, add warning text)

3. Interactive Components

Create action rows with button components
Support button styles: Primary, Secondary, Success, Danger, Link
Handle button click interactions with custom callbacks
Manage interaction tokens and response timing (3-second rule)
Support disabled buttons (for completed actions)

4. Message Management

Post new messages with embeds and components
Edit existing messages (update embeds, disable buttons)
Delete messages programmatically
Reply to interactions (ephemeral or public)
Send follow-up messages after interactions

5. Rate Limiting & Retry Logic

Respect Discord's rate limits (50 requests per second global, 5 per channel)
Exponential backoff for 429 (rate limit) responses
Retry transient errors (500, 502, 503, 504) up to 3 times
Queue messages during rate limit periods
Fail fast for 4xx client errors (except 429)

6. Error Handling

Send error notifications to error channel (if configured)
Format error embeds with stack traces and context
Gracefully handle missing permissions
Detect and report channel access issues
Custom error types for different failure modes

Public API Surface
typescript// Main Client Class
export class DiscordNotifier {
  constructor(config: DiscordNotifierConfig);
  
  // Lifecycle Management
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  
  // Message Posting
  postMessage(options: MessageOptions): Promise<Message>;
  postEmbed(embed: EmbedOptions): Promise<Message>;
  postError(error: Error, context?: ErrorContext): Promise<void>;
  
  // Message Management
  editMessage(messageId: string, options: MessageOptions): Promise<Message>;
  deleteMessage(messageId: string): Promise<void>;
  
  // Interaction Handling
  onButtonClick(customId: string, handler: ButtonClickHandler): void;
  removeButtonHandler(customId: string): void;
  
  // Utilities
  createEmbed(options: EmbedOptions): EmbedBuilder;
  createButton(options: ButtonOptions): ButtonBuilder;
  createActionRow(components: ButtonBuilder[]): ActionRowBuilder;
}

// Configuration Interface
export interface DiscordNotifierConfig {
  botToken: string;                    // Required: Discord bot token
  channelId: string;                   // Required: Primary channel ID
  errorChannelId?: string;             // Optional: Error channel ID (defaults to main)
  rateLimitRetries?: number;           // Optional: Max retry attempts (default: 3)
  rateLimitDelay?: number;             // Optional: Base delay in ms (default: 1000)
  intents?: GatewayIntentBits[];       // Optional: Additional intents (defaults included)
  enableLogging?: boolean;             // Optional: Enable debug logging (default: false)
}

// Message Options
export interface MessageOptions {
  content?: string;                    // Plain text content
  embeds?: EmbedOptions[];             // Array of embeds (max 10)
  components?: ActionRowBuilder[];     // Interactive components
  files?: FileAttachment[];            // File attachments
}

// Embed Options
export interface EmbedOptions {
  title?: string;                      // Embed title (max 256 chars)
  description?: string;                // Description (max 4096 chars)
  url?: string;                        // Title URL
  color?: number | string;             // Color (hex or decimal)
  thumbnail?: string;                  // Thumbnail image URL
  image?: string;                      // Main image URL
  footer?: {
    text: string;                      // Footer text (max 2048 chars)
    iconUrl?: string;                  // Footer icon URL
  };
  timestamp?: Date | number;           // Timestamp
  fields?: Array<{
    name: string;                      // Field name (max 256 chars)
    value: string;                     // Field value (max 1024 chars)
    inline?: boolean;                  // Display inline (default: false)
  }>;
}

// Button Options
export interface ButtonOptions {
  customId?: string;                   // Custom ID for interaction (required for non-link)
  label: string;                       // Button text (max 80 chars)
  style: ButtonStyle;                  // Button color/style
  emoji?: string;                      // Unicode emoji or custom emoji ID
  url?: string;                        // URL (only for Link style)
  disabled?: boolean;                  // Disabled state (default: false)
}

// Button Styles
export enum ButtonStyle {
  Primary = 1,     // Blurple
  Secondary = 2,   // Grey
  Success = 3,     // Green
  Danger = 4,      // Red
  Link = 5         // Grey with link
}

// Button Click Handler
export type ButtonClickHandler = (
  interaction: ButtonInteraction,
  context: InteractionContext
) => Promise<void>;

// Interaction Context
export interface InteractionContext {
  customId: string;
  user: {
    id: string;
    username: string;
    discriminator: string;
  };
  channelId: string;
  messageId: string;
  guildId?: string;
}

// Error Context
export interface ErrorContext {
  operation: string;                   // What was being attempted
  channelId?: string;                  // Relevant channel
  metadata?: Record<string, any>;      // Additional context
}

// Discord Message (Return Type)
export interface Message {
  id: string;
  channelId: string;
  content: string;
  embeds: Embed[];
  components: ActionRow[];
  createdAt: Date;
  editedAt?: Date;
}
Error Types
typescript// Custom Error Classes
export class DiscordNotifierError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'DiscordNotifierError';
  }
}

export class RateLimitError extends DiscordNotifierError {
  constructor(
    message: string,
    public retryAfter: number  // Milliseconds until retry allowed
  ) {
    super(message, 'RATE_LIMIT');
    this.name = 'RateLimitError';
  }
}

export class PermissionError extends DiscordNotifierError {
  constructor(message: string, public requiredPermission: string) {
    super(message, 'MISSING_PERMISSIONS');
    this.name = 'PermissionError';
  }
}

export class ChannelNotFoundError extends DiscordNotifierError {
  constructor(channelId: string) {
    super(`Channel not found: ${channelId}`, 'CHANNEL_NOT_FOUND');
    this.name = 'ChannelNotFoundError';
  }
}

export class InteractionExpiredError extends DiscordNotifierError {
  constructor() {
    super('Interaction token expired (>15min)', 'INTERACTION_EXPIRED');
    this.name = 'InteractionExpiredError';
  }
}
```

## Project Structure
```
packages/discord-notifier/
├── src/
│   ├── client/
│   │   └── DiscordNotifier.ts       # Main client class
│   ├── builders/
│   │   ├── EmbedBuilder.ts          # Rich embed builder
│   │   ├── ButtonBuilder.ts         # Button component builder
│   │   ├── ActionRowBuilder.ts      # Action row builder
│   │   └── ErrorEmbedBuilder.ts     # Error message embeds
│   ├── services/
│   │   ├── MessageService.ts        # Post/edit/delete messages
│   │   ├── InteractionService.ts    # Handle button interactions
│   │   └── RateLimitService.ts      # Rate limit management
│   ├── utils/
│   │   ├── TextTruncator.ts         # Truncate text to Discord limits
│   │   ├── ColorConverter.ts        # Convert hex to decimal color
│   │   └── RetryHandler.ts          # Exponential backoff retry logic
│   ├── errors/
│   │   └── DiscordErrors.ts         # Custom error classes
│   ├── types/
│   │   ├── MessageOptions.ts
│   │   ├── EmbedOptions.ts
│   │   ├── ButtonOptions.ts
│   │   └── index.ts
│   └── index.ts                     # Public API exports
├── tests/
│   ├── unit/
│   │   ├── EmbedBuilder.test.ts
│   │   ├── ButtonBuilder.test.ts
│   │   ├── TextTruncator.test.ts
│   │   └── RetryHandler.test.ts
│   ├── integration/
│   │   ├── DiscordNotifier.test.ts
│   │   └── InteractionHandling.test.ts
│   └── fixtures/
│       └── mockMessages.json
├── package.json
├── tsconfig.json
├── jest.config.js
├── .eslintrc.js
└── README.md
Dependencies
Production Dependencies
json{
  "discord.js": "^14.14.1",          // Discord API client
  "@discordjs/builders": "^1.7.0",   // Embed and component builders
  "@discordjs/rest": "^2.2.0"        // REST API client
}
Development Dependencies
json{
  "typescript": "^5.3.0",
  "@types/node": "^20.10.0",
  "jest": "^29.7.0",
  "@types/jest": "^29.5.0",
  "ts-jest": "^29.1.0",
  "eslint": "^8.55.0",
  "@typescript-eslint/eslint-plugin": "^6.15.0",
  "@typescript-eslint/parser": "^6.15.0"
}
Discord Intents Required
typescriptimport { GatewayIntentBits } from 'discord.js';

const defaultIntents = [
  GatewayIntentBits.Guilds,           // Access to guild info
  GatewayIntentBits.GuildMessages,    // Send/receive messages
  GatewayIntentBits.MessageContent    // Read message content (if needed)
];
Testing Requirements
Unit Tests (80%+ Coverage)

EmbedBuilder: Test field truncation, color conversion, field limits
ButtonBuilder: Test all button styles, emoji handling, disabled state
ActionRowBuilder: Test component limits (max 5 per row)
TextTruncator: Test truncation at various limits with ellipsis
RetryHandler: Test exponential backoff timing

Integration Tests

DiscordNotifier.connect(): Test successful connection and error handling
DiscordNotifier.postEmbed(): Post embed to real Discord channel
DiscordNotifier.onButtonClick(): Test button interaction handling
Rate limiting: Simulate 429 responses and verify retry logic
Error channel fallback: Test error posting when error channel unavailable

Mock Discord Client
Create a mock Discord client for unit tests that simulates:

Message posting responses
Rate limit errors (429)
Permission errors
Channel not found errors
Interaction events

Rate Limiting Strategy
Discord Rate Limits

Global: 50 requests per second
Per Channel: 5 requests per second
Per Guild: 10 requests per second

Implementation
Use a token bucket algorithm per channel:

Track requests per channel
Queue messages when rate limited
Exponential backoff: 1s, 2s, 4s, 8s (max 3 retries)
Return RateLimitError after max retries

typescriptclass RateLimitService {
  private buckets = new Map<string, TokenBucket>();
  
  async executeWithRateLimit<T>(
    channelId: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const bucket = this.getBucket(channelId);
    await bucket.waitForToken();
    
    try {
      return await operation();
    } catch (error) {
      if (error.code === 429) {
        const retryAfter = error.retry_after * 1000;
        throw new RateLimitError('Rate limited', retryAfter);
      }
      throw error;
    }
  }
}
Embed Builder Features
Auto-truncation
typescriptconst builder = new EmbedBuilder();

// Automatically truncates to 256 chars
builder.setTitle('Very long title that exceeds Discord limits...');

// Automatically truncates to 4096 chars
builder.setDescription('Very long description...');

// Field values truncated to 1024 chars
builder.addField('Field Name', 'Very long field value...');
Color Handling
typescript// Hex string
builder.setColor('#FF5733');

// Decimal number
builder.setColor(16729155);

// Named colors
builder.setColor('RED');
builder.setColor('GREEN');
builder.setColor('BLUE');
Adult Content Mode
typescriptconst embed = createGameEmbed(game, { suppressAdultImages: true });

// When suppressAdultImages = true:
// - No thumbnail or image URLs included
// - Adds "⚠️ Content Warning" to description
// - Uses orange/warning color
Button Interaction Handling
Register Handler
typescriptnotifier.onButtonClick('download_game', async (interaction, context) => {
  // Acknowledge interaction immediately (3-second window)
  await interaction.deferReply({ ephemeral: true });
  
  // Perform long-running operation
  await downloadGame(context.metadata.gameId);
  
  // Send follow-up response
  await interaction.editReply('Download started!');
});
Update Button State
typescript// Disable button after click
await notifier.editMessage(messageId, {
  components: [
    createActionRow([
      createButton({
        customId: 'download_game',
        label: 'Download',
        style: ButtonStyle.Success,
        disabled: true  // Greyed out
      })
    ])
  ]
});
Error Notification Format
typescriptasync postError(error: Error, context?: ErrorContext): Promise<void> {
  const embed = new EmbedBuilder()
    .setTitle('❌ Error Occurred')
    .setDescription(error.message)
    .setColor('RED')
    .addField('Operation', context?.operation || 'Unknown')
    .addField('Stack Trace', '```' + error.stack + '```')
    .setTimestamp();
  
  if (context?.metadata) {
    embed.addField('Context', JSON.stringify(context.metadata, null, 2));
  }
  
  await this.postToErrorChannel(embed);
}
Usage Examples
Basic Message Posting
typescriptimport { DiscordNotifier } from '@xmer/discord-notifier';

const notifier = new DiscordNotifier({
  botToken: process.env.DISCORD_BOT_TOKEN,
  channelId: process.env.DISCORD_CHANNEL_ID
});

await notifier.connect();

// Post simple embed
await notifier.postEmbed({
  title: 'Game Release',
  description: 'New game available!',
  color: '#00FF00',
  timestamp: new Date()
});
Rich Game Notification
typescriptawait notifier.postMessage({
  embeds: [{
    title: 'Cyberpunk 2077',
    url: 'https://store.steampowered.com/app/1091500/',
    description: 'New release from FitGirl',
    color: '#FFD700',
    thumbnail: 'https://cdn.akamai.steamstatic.com/steam/apps/1091500/header.jpg',
    fields: [
      { name: '💰 Price', value: '$59.99', inline: true },
      { name: '📅 Release', value: 'Dec 10, 2020', inline: true },
      { name: '⭐ Rating', value: 'Metacritic: 87/100', inline: true }
    ],
    footer: { text: 'FitGirl ID: 12345' },
    timestamp: new Date()
  }],
  components: [
    notifier.createActionRow([
      notifier.createButton({
        customId: 'download_12345',
        label: '📥 Download',
        style: ButtonStyle.Success
      })
    ])
  ]
});
Interactive Download Button
typescript// Register handler
notifier.onButtonClick('download_12345', async (interaction, context) => {
  await interaction.deferReply({ ephemeral: true });
  
  // Start download in external system
  await qbittorrent.addTorrent(magnetLink);
  
  await interaction.editReply({
    content: '✅ Download started in qBittorrent!'
  });
  
  // Disable button
  await notifier.editMessage(context.messageId, {
    components: [
      notifier.createActionRow([
        notifier.createButton({
          customId: 'download_12345',
          label: '✅ Downloaded',
          style: ButtonStyle.Secondary,
          disabled: true
        })
      ])
    ]
  });
});
Error Handling
typescripttry {
  await notifier.postEmbed({ title: 'Test' });
} catch (error) {
  if (error instanceof RateLimitError) {
    console.log(`Rate limited, retry after ${error.retryAfter}ms`);
    await sleep(error.retryAfter);
  } else if (error instanceof PermissionError) {
    console.log(`Missing permission: ${error.requiredPermission}`);
  } else if (error instanceof ChannelNotFoundError) {
    console.log('Channel not found, check channel ID');
  }
}
README Sections

Installation: npm install @xmer/discord-notifier
Quick Start: Basic setup and first message
API Reference: Complete API documentation
Embed Builder: How to create rich embeds
Interactive Components: Button creation and handling
Rate Limiting: How rate limits are handled
Error Handling: All error types and recovery strategies
Examples: Common usage patterns
Testing: How to run tests
Discord Bot Setup: How to create a bot and get tokens

Build & Publish Scripts
json{
  "scripts": {
    "build": "tsc",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint src/**/*.ts",
    "prepublishOnly": "npm run build && npm run test"
  }
}
Performance Targets

Message posting latency: < 200ms (no rate limit)
Button interaction response: < 50ms (acknowledgment only)
Memory footprint: < 30MB
Connection recovery: < 5 seconds after disconnect

Quality Checklist

 All tests passing with 80%+ coverage
 No TypeScript errors
 ESLint passes
 All public APIs have JSDoc comments
 README complete with examples
 Rate limiting tested with real Discord API
 Interaction handling tested
 Error channel fallback verified

Future Enhancements (v2.0.0)

Slash command support
Select menu components
Modal form support
Thread creation and management
Webhook support for faster posting
Message templates system
Scheduled message posting