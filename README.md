# @xmer/discord-notifier

A TypeScript Discord bot client for posting rich embeds, handling interactive components (buttons), and managing messages with automatic rate limiting.

## Features

- 🚀 **Rich Embeds** - Create beautiful Discord embeds with auto-truncation
- 🎯 **Interactive Buttons** - Handle button clicks with ease
- ⚡ **Rate Limiting** - Built-in token bucket algorithm (5 req/s per channel, 50 req/s global)
- 🔄 **Auto-Retry** - Exponential backoff for transient failures
- 🛡️ **Error Handling** - Comprehensive error classes and fallback channels
- ⚠️ **Adult Content** - Built-in content warning system
- 📝 **TypeScript** - Full type safety and IntelliSense support

## Installation

```bash
npm install @xmer/discord-notifier
```

## Getting Your Bot Token and Channel IDs

Before using this package, you need to create a Discord bot and obtain your credentials.

### 1. Create a Discord Application and Bot

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application" and give it a name
3. Navigate to the "Bot" tab in the left sidebar
4. Click "Add Bot" and confirm

### 2. Get Your Bot Token

1. In the Bot tab, under the "TOKEN" section, click "Reset Token"
2. Copy the token that appears - **save this securely!** You won't be able to see it again
3. Never share your token publicly or commit it to version control

**Security Note:** Store your token in environment variables:
```typescript
const notifier = new DiscordNotifier({
  token: process.env.DISCORD_BOT_TOKEN,
  channelId: process.env.DISCORD_CHANNEL_ID,
});
```

### 3. Enable Required Intents

In the Bot tab, scroll down to "Privileged Gateway Intents" and enable:
- ✅ **SERVER MEMBERS INTENT** (if you need member data)
- ✅ **MESSAGE CONTENT INTENT** (required for reading messages)

### 4. Set Bot Permissions

1. Navigate to the "OAuth2" > "URL Generator" tab
2. Under "SCOPES", select:
   - ✅ `bot`
3. Under "BOT PERMISSIONS", select:
   - ✅ `View Channels`
   - ✅ `Send Messages`
   - ✅ `Embed Links`
   - ✅ `Use External Emojis`
4. Copy the generated URL at the bottom

### 5. Invite Your Bot to Your Server

1. Paste the URL from step 4 into your browser
2. Select the Discord server you want to add the bot to
3. Click "Authorize" and complete the captcha
4. Your bot should now appear offline in your server's member list

### 6. Get Your Channel ID

You need to enable Developer Mode in Discord to see channel IDs:

1. Open Discord (desktop or web app)
2. Go to User Settings (gear icon) > App Settings > Advanced
3. Enable "Developer Mode"
4. Right-click on any text channel and select "Copy Channel ID"

**Primary Channel ID:** The channel where your bot will post messages
**Error Channel ID (Optional):** A separate channel for error notifications

### 7. Test Your Configuration

```typescript
import { DiscordNotifier } from '@xmer/discord-notifier';

const notifier = new DiscordNotifier({
  token: 'YOUR_BOT_TOKEN_HERE',
  channelId: 'YOUR_CHANNEL_ID_HERE',
  debug: true,
});

await notifier.connect();
console.log('Bot connected successfully!');

await notifier.postMessage({
  content: 'Hello from discord-notifier!',
});

await notifier.disconnect();
```

If you see the message in your Discord channel, you're all set!

## Quick Start

```typescript
import { DiscordNotifier, ButtonStyle } from '@xmer/discord-notifier';

// Initialize the client
const notifier = new DiscordNotifier({
  token: 'YOUR_BOT_TOKEN',
  channelId: 'YOUR_CHANNEL_ID',
  errorChannelId: 'ERROR_CHANNEL_ID', // Optional
  debug: true, // Optional
});

// Connect to Discord
await notifier.connect();

// Post a message with an embed
const message = await notifier.postMessage({
  embeds: [{
    title: 'Game Release',
    description: 'New game available!',
    color: '#FFD700',
    thumbnail: 'https://example.com/cover.jpg',
    fields: [
      { name: 'Size', value: '50 GB', inline: true },
      { name: 'Version', value: '1.0.0', inline: true },
    ],
  }],
});

console.log(`Posted message: ${message.id}`);

// Disconnect when done
await notifier.disconnect();
```

## Usage Examples

### Creating Embeds with Auto-Truncation

```typescript
const embed = notifier.createEmbed({
  title: 'Very long title that will be automatically truncated if it exceeds 256 characters...',
  description: 'Long description...',
  color: 'RED', // Supports hex (#FF0000), decimal (16711680), or named colors
  fields: [
    {
      name: 'Field Name',
      value: 'Field value with automatic truncation to 1024 characters',
      inline: true
    },
  ],
});

await notifier.postMessage({ embeds: [embed] });
```

### Adding Interactive Buttons

```typescript
// Create buttons
const downloadButton = notifier.createButton({
  customId: 'download_123',
  label: 'Download',
  style: ButtonStyle.Success,
});

const infoButton = notifier.createButton({
  customId: 'info_123',
  label: 'More Info',
  style: ButtonStyle.Secondary,
});

// Create action row (max 5 buttons per row)
const row = notifier.createActionRow([downloadButton, infoButton]);

// Post message with buttons
await notifier.postMessage({
  content: 'Click a button below',
  components: [row],
});

// Handle button clicks
notifier.onButtonClick('download_123', async (interaction, context) => {
  // IMPORTANT: Acknowledge within 3 seconds!
  await interaction.deferReply({ ephemeral: true });

  // Perform long operation
  await startDownload(context.userId);

  // Respond to user
  await interaction.editReply('Download started!');

  // Optionally disable the button
  await notifier.editMessage(context.messageId, {
    components: [
      notifier.createActionRow([
        notifier.createButton({
          customId: 'download_123',
          label: 'Downloaded',
          style: ButtonStyle.Secondary,
          disabled: true,
        }),
      ]),
    ],
  });
});
```

### Adult Content Suppression

```typescript
await notifier.postMessage({
  embeds: [{
    title: 'Game Title',
    description: 'Game description',
    thumbnail: 'https://example.com/cover.jpg',
    image: 'https://example.com/screenshot.jpg',
    suppressAdultImages: true, // Removes images, adds ⚠️ warning, sets orange color
  }],
});
```

### Error Handling

```typescript
import {
  RateLimitError,
  PermissionError,
  ChannelNotFoundError,
} from '@xmer/discord-notifier';

try {
  await notifier.postMessage({ embeds: [embed] });
} catch (error) {
  if (error instanceof RateLimitError) {
    console.log(`Rate limited. Retry after ${error.retryAfter}ms`);
    await sleep(error.retryAfter);
    // Retry operation
  } else if (error instanceof PermissionError) {
    console.error(`Bot missing permission: ${error.requiredPermission}`);
  } else if (error instanceof ChannelNotFoundError) {
    console.error(`Channel not found: ${error.channelId}`);
  } else {
    // Unknown error - post to error channel
    await notifier.postError(error, {
      operation: 'postMessage',
      metadata: { attempted: 'embed' },
    });
  }
}
```

### Editing and Deleting Messages

```typescript
// Edit a message
await notifier.editMessage(messageId, {
  embeds: [{
    title: 'Updated Title',
    description: 'Updated description',
  }],
});

// Delete a message
await notifier.deleteMessage(messageId);

// Use a different channel
await notifier.postMessage({ content: 'Hello!' }, 'OTHER_CHANNEL_ID');
```

## API Reference

### DiscordNotifier

#### Constructor Options

```typescript
interface ClientOptions {
  token: string;                  // Discord bot token
  channelId: string;              // Primary channel ID
  errorChannelId?: string;        // Optional error channel
  maxRetries?: number;            // Max retries (default: 3)
  retryDelay?: number;            // Base retry delay in ms (default: 1000)
  debug?: boolean;                // Enable debug logging (default: false)
}
```

#### Methods

- `connect()` - Connect to Discord
- `disconnect()` - Disconnect from Discord
- `postMessage(options, channelId?)` - Post a message
- `editMessage(messageId, options, channelId?)` - Edit a message
- `deleteMessage(messageId, channelId?)` - Delete a message
- `postError(error, context?)` - Post error to error channel
- `onButtonClick(customId, handler)` - Register button handler
- `offButtonClick(customId)` - Unregister button handler
- `createEmbed(options?)` - Create embed builder
- `createButton(options?)` - Create button builder
- `createActionRow(components?)` - Create action row builder
- `isReady()` - Check if client is ready
- `getClient()` - Get underlying Discord.js client

### Button Styles

```typescript
enum ButtonStyle {
  Primary = 1,   // Blurple
  Secondary = 2, // Grey
  Success = 3,   // Green
  Danger = 4,    // Red
  Link = 5,      // Grey with link
}
```

### Error Classes

- `DiscordNotifierError` - Base error class
- `RateLimitError` - Rate limit exceeded (429)
- `PermissionError` - Missing permissions (403)
- `ChannelNotFoundError` - Channel not found (404)
- `InteractionTimeoutError` - Interaction not acknowledged within 3s
- `ValidationError` - Invalid input

## Discord Limits

The package automatically handles Discord's limits:

- **Embed title**: 256 characters
- **Embed description**: 4096 characters
- **Field name**: 256 characters
- **Field value**: 1024 characters
- **Footer text**: 2048 characters
- **Buttons per row**: 5 maximum
- **Rate limits**: 5 req/s per channel, 50 req/s global

## Required Discord Bot Permissions

Your bot needs these permissions:
- `VIEW_CHANNEL`
- `SEND_MESSAGES`
- `EMBED_LINKS`
- `USE_EXTERNAL_EMOJIS`

Required intents:
- `Guilds`
- `GuildMessages`
- `MessageContent`

## Development

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint
```

## License

MIT

## Contributing

Contributions welcome! Please ensure:
- Tests pass (`npm test`)
- Coverage >= 80% (`npm run test:coverage`)
- Linting passes (`npm run lint`)
- TypeScript compiles (`npm run build`)

## Support

For issues or questions, please open an issue on GitHub.
