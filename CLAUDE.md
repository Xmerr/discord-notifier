# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is `@xmer/discord-notifier`, a standalone TypeScript npm package that provides a Discord bot client for posting rich embeds, handling interactive components (buttons), and managing messages. It's designed for notification bots that post game releases, news, or other content to Discord channels.

**Key Package Details:**
- Standalone package at repository root
- Built with TypeScript 5.3+
- Uses discord.js v14 as the underlying Discord API client
- Main exports: `dist/index.js` with types at `dist/index.d.ts`

## Build, Test, and Development Commands

```bash
# Build the TypeScript package
npm run build

# Run all tests
npm test

# Run tests in watch mode (during development)
npm run test:watch

# Generate test coverage report (aim for 80%+ coverage)
npm run test:coverage

# Lint the codebase
npm run lint

# Pre-publish checks (builds and tests)
npm run prepublishOnly
```

## Architecture Overview

### Core Design Principles

1. **Rate Limiting First**: All Discord API operations must flow through `RateLimitService` which implements token bucket algorithm per channel (5 req/s per channel, 50 req/s global)

2. **Error Channel Fallback**: The package supports a primary channel and optional error channel. All error notifications attempt error channel first, fall back to primary channel gracefully

3. **Interaction Response Timing**: Button interactions must acknowledge within 3 seconds or Discord invalidates the token. Use `interaction.deferReply()` immediately for long operations

4. **Auto-truncation**: All embed fields are automatically truncated to Discord limits (title: 256 chars, description: 4096 chars, field values: 1024 chars) by `TextTruncator` utility

### Module Responsibilities

**`DiscordNotifier` (Main Client)**
- Entry point for all package functionality
- Manages Discord WebSocket connection lifecycle (connect/reconnect/disconnect)
- Coordinates between MessageService, InteractionService, and RateLimitService
- Provides public API surface for posting, editing, deleting messages
- Registers and routes button click handlers to user callbacks

**`MessageService`**
- Handles all message operations: post, edit, delete
- Manages message queue during rate limit periods
- Wraps all operations with RateLimitService
- Returns standardized `Message` interface

**`InteractionService`**
- Listens for Discord interaction events (button clicks)
- Routes interactions to registered handlers via customId
- Manages interaction tokens and ensures 3-second acknowledgment rule
- Provides helper methods for replying (ephemeral/public) and follow-ups

**`RateLimitService`**
- Implements token bucket algorithm per channel
- Queues operations when rate limited
- Exponential backoff: 1s, 2s, 4s, 8s (max 3 retries)
- Throws `RateLimitError` after max retries exceeded

**`EmbedBuilder`, `ButtonBuilder`, `ActionRowBuilder`**
- Fluent builders wrapping discord.js builders
- EmbedBuilder auto-truncates all text fields
- ButtonBuilder validates button styles and customId requirements
- ActionRowBuilder enforces component limits (max 5 buttons per row)

**`ErrorEmbedBuilder`**
- Specialized builder for error notifications
- Formats errors with operation context, stack traces, and metadata
- Uses consistent error embed styling (red color, ❌ icon)

### File Structure

```
discord-notifier/
├── src/
│   ├── client/
│   │   └── DiscordNotifier.ts       # Main client class, public API
│   ├── services/
│   │   ├── MessageService.ts        # Message CRUD operations
│   │   ├── InteractionService.ts    # Button interaction handling
│   │   └── RateLimitService.ts      # Token bucket rate limiting
│   ├── builders/
│   │   ├── EmbedBuilder.ts          # Embed builder with auto-truncation
│   │   ├── ButtonBuilder.ts         # Button component builder
│   │   ├── ActionRowBuilder.ts      # Action row builder (max 5 components)
│   │   └── ErrorEmbedBuilder.ts     # Error message embed builder
│   ├── utils/
│   │   ├── TextTruncator.ts         # Truncate text to Discord limits
│   │   ├── ColorConverter.ts        # Convert hex strings to decimal colors
│   │   └── RetryHandler.ts          # Exponential backoff retry logic
│   ├── errors/
│   │   └── DiscordErrors.ts         # Custom error classes
│   ├── types/
│   │   ├── MessageOptions.ts        # Message posting options
│   │   ├── EmbedOptions.ts          # Embed configuration
│   │   ├── ButtonOptions.ts         # Button configuration
│   │   └── index.ts                 # Type re-exports
│   └── index.ts                     # Public API exports only
├── tests/
│   ├── unit/                        # Fast, isolated unit tests
│   ├── integration/                 # Tests requiring real Discord API
│   └── fixtures/
│       └── mockMessages.json        # Mock Discord message responses
├── package.json
├── tsconfig.json
└── jest.config.js
```

## Critical Implementation Details

### Rate Limiting Strategy

Discord enforces strict rate limits:
- **Global**: 50 requests per second
- **Per Channel**: 5 requests per second
- **Per Guild**: 10 requests per second

The `RateLimitService` must maintain separate token buckets per channel. When a 429 (rate limit) error occurs, extract `retry_after` from the error response and throw `RateLimitError` with that delay. The `RetryHandler` implements exponential backoff for transient errors (500, 502, 503, 504) but fails fast on 4xx client errors except 429.

### Button Interaction Flow

1. User clicks button in Discord
2. Discord sends interaction event to bot
3. `InteractionService` receives event, looks up handler by `customId`
4. Handler MUST call `interaction.deferReply()` within 3 seconds
5. Handler performs long operation (download, API call, etc.)
6. Handler calls `interaction.editReply()` or `interaction.followUp()` with result
7. Optionally edit original message to disable button (grey out)

### Embed Auto-Truncation

The `TextTruncator` utility enforces Discord limits:
- **Title**: 256 characters (truncate with "..." if exceeded)
- **Description**: 4096 characters
- **Field name**: 256 characters
- **Field value**: 1024 characters
- **Footer text**: 2048 characters

All `EmbedBuilder` methods must call `TextTruncator` before setting values.

### Color Handling

`ColorConverter` accepts three formats:
- Hex string: `#FF5733` → convert to decimal
- Decimal number: `16729155` → use directly
- Named color: `"RED"`, `"GREEN"`, `"BLUE"` → map to predefined decimal values

### Error Notification Flow

When any error occurs:
1. `DiscordNotifier.postError()` is called with error and context
2. `ErrorEmbedBuilder` formats error with stack trace and metadata
3. Attempt to post to `errorChannelId` if configured
4. If error channel fails, fall back to primary `channelId`
5. If both fail, log error to console but don't throw (avoid infinite error loops)

## Testing Requirements

**Unit Tests (80%+ coverage required):**
- All builders must test field truncation, validation, and limits
- `TextTruncator`: Test edge cases (exactly at limit, 1 char over, empty string)
- `ColorConverter`: Test all three color formats and invalid inputs
- `RetryHandler`: Test exponential backoff timing calculations
- Mock the Discord client for all unit tests

**Integration Tests:**
- `DiscordNotifier.connect()`: Test connection success and WebSocket errors
- `DiscordNotifier.postEmbed()`: Post to real Discord channel (requires test bot token)
- Button interaction handling: Simulate button click and verify handler called
- Rate limiting: Trigger 429 error and verify retry logic
- Error channel fallback: Make error channel invalid, verify fallback to primary

**Mock Discord Client:**
Create a comprehensive mock in `tests/fixtures/` that simulates:
- Message posting responses with message IDs
- 429 rate limit errors with `retry_after` header
- Permission errors (403)
- Channel not found errors (404)
- Interaction events with user context

## Discord API Requirements

**Required Intents:**
```typescript
GatewayIntentBits.Guilds           // Access to guild info
GatewayIntentBits.GuildMessages    // Send/receive messages
GatewayIntentBits.MessageContent   // Read message content
```

**Required Bot Permissions:**
- `VIEW_CHANNEL` on target channels
- `SEND_MESSAGES` on target channels
- `EMBED_LINKS` for rich embeds
- `USE_EXTERNAL_EMOJIS` for custom emoji in buttons

## Dependencies

**Production:**
- `discord.js@^14.14.1` - Discord API client
- `@discordjs/builders@^1.7.0` - Official embed/component builders
- `@discordjs/rest@^2.2.0` - REST API client with rate limiting

**Development:**
- `typescript@^5.3.0`
- `jest@^29.7.0` with `ts-jest@^29.1.0`
- `eslint@^8.55.0` with TypeScript parser

## Common Development Patterns

### Creating a New Message with Button

```typescript
const message = await notifier.postMessage({
  embeds: [{
    title: 'Game Title',
    description: 'Game description',
    color: '#FFD700',
    thumbnail: 'https://example.com/image.jpg',
    fields: [
      { name: 'Size', value: '50 GB', inline: true },
      { name: 'Version', value: '1.0', inline: true }
    ]
  }],
  components: [
    notifier.createActionRow([
      notifier.createButton({
        customId: 'download_123',
        label: 'Download',
        style: ButtonStyle.Success
      })
    ])
  ]
});
```

### Handling Button Click

```typescript
notifier.onButtonClick('download_123', async (interaction, context) => {
  // Acknowledge immediately (3-second deadline)
  await interaction.deferReply({ ephemeral: true });

  // Perform operation
  await externalService.startDownload(gameId);

  // Respond to user
  await interaction.editReply('Download started!');

  // Update original message to disable button
  await notifier.editMessage(context.messageId, {
    components: [
      notifier.createActionRow([
        notifier.createButton({
          customId: 'download_123',
          label: 'Downloaded',
          style: ButtonStyle.Secondary,
          disabled: true
        })
      ])
    ]
  });
});
```

### Error Handling Pattern

```typescript
try {
  await notifier.postEmbed({ title: 'Test' });
} catch (error) {
  if (error instanceof RateLimitError) {
    await sleep(error.retryAfter);
    // Retry operation
  } else if (error instanceof PermissionError) {
    console.error(`Bot missing permission: ${error.requiredPermission}`);
  } else if (error instanceof ChannelNotFoundError) {
    console.error('Invalid channel ID in config');
  } else {
    // Unknown error, report to error channel
    await notifier.postError(error, {
      operation: 'postEmbed',
      metadata: { attemptedTitle: 'Test' }
    });
  }
}
```

## Adult Content Handling

When `suppressAdultImages: true` in embed options:
- Remove `thumbnail` and `image` URLs from embed
- Prepend "⚠️ Content Warning" to description
- Use warning color (orange: `#FF8C00`)
- Keep all other fields intact

## Git Commit Guidelines

When creating git commits:
- Write clear, concise commit messages that focus on what changed and why
- Do NOT include "Claude Code" or similar AI tool references in commit messages
- Do NOT add "Generated with Claude Code" or "Co-Authored-By: Claude" footers
- Keep commit messages professional and focused on the technical changes
- Follow conventional commit format when appropriate (feat:, fix:, docs:, etc.)