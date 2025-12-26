# Discord Notifier Architecture

## System Overview

The `@xmer/discord-notifier` package provides a Discord bot client for posting rich embeds, handling interactive components (buttons), and managing messages with automatic rate limiting.

## Architecture Principles

1. **Rate Limiting First**: All Discord API operations flow through `RateLimitService`
2. **Error Channel Fallback**: Errors attempt error channel first, fall back to primary channel
3. **Interaction Response Timing**: Button interactions acknowledge within 3 seconds
4. **Auto-truncation**: All embed fields auto-truncate to Discord limits

## Module Dependency Graph

```
DiscordNotifier (Main Client)
├── MessageService
│   └── RateLimitService
│       └── RetryHandler
├── InteractionService
└── Builders
    ├── EmbedBuilder
    │   └── TextTruncator
    ├── ButtonBuilder
    ├── ActionRowBuilder
    └── ErrorEmbedBuilder
        └── EmbedBuilder
            └── TextTruncator

Utilities (Shared)
├── TextTruncator
├── ColorConverter
└── RetryHandler

Errors
└── DiscordErrors
```

## Component Responsibilities

### DiscordNotifier (Client Layer)
- **Responsibility**: Entry point, lifecycle management, API coordination
- **Dependencies**: MessageService, InteractionService
- **Public API**:
  - `connect()`: Initialize Discord connection
  - `disconnect()`: Graceful shutdown
  - `postMessage(options)`: Post message with embeds/components
  - `editMessage(messageId, options)`: Edit existing message
  - `deleteMessage(messageId)`: Delete message
  - `postError(error, context)`: Post error to error channel
  - `onButtonClick(customId, handler)`: Register button handler
  - `createEmbed(options)`: Create EmbedBuilder
  - `createButton(options)`: Create ButtonBuilder
  - `createActionRow(components)`: Create ActionRowBuilder

### MessageService (Service Layer)
- **Responsibility**: Message CRUD operations, queue management
- **Dependencies**: RateLimitService, Discord.js Client
- **Methods**:
  - `sendMessage(channelId, options)`: Send message with rate limiting
  - `updateMessage(channelId, messageId, options)`: Update message
  - `removeMessage(channelId, messageId)`: Delete message
  - `queueMessage(channelId, options)`: Add to queue when rate limited

### InteractionService (Service Layer)
- **Responsibility**: Button interaction handling, response management
- **Dependencies**: Discord.js Client
- **Methods**:
  - `registerHandler(customId, callback)`: Register button handler
  - `handleInteraction(interaction)`: Route interaction to handler
  - `deferReply(interaction, ephemeral)`: Acknowledge interaction
  - `editReply(interaction, content)`: Update deferred reply
  - `followUp(interaction, content)`: Send follow-up message

### RateLimitService (Service Layer)
- **Responsibility**: Token bucket rate limiting, retry queue
- **Dependencies**: RetryHandler
- **Methods**:
  - `acquireToken(channelId)`: Get permission to execute operation
  - `handleRateLimit(channelId, retryAfter)`: Process 429 error
  - `queueOperation(channelId, operation)`: Queue during rate limit
  - **Rate Limits**:
    - Global: 50 req/s
    - Per Channel: 5 req/s
    - Token bucket with automatic refill

### EmbedBuilder (Builder Layer)
- **Responsibility**: Build Discord embeds with auto-truncation
- **Dependencies**: TextTruncator, ColorConverter
- **Methods**:
  - `setTitle(text)`: Set title (truncate to 256 chars)
  - `setDescription(text)`: Set description (truncate to 4096 chars)
  - `setColor(color)`: Set color (hex/decimal/named)
  - `setThumbnail(url)`: Set thumbnail URL
  - `setImage(url)`: Set image URL
  - `addField(name, value, inline)`: Add field (truncate name/value)
  - `setFooter(text, iconURL)`: Set footer (truncate to 2048 chars)
  - `setTimestamp(date)`: Set timestamp
  - `build()`: Return discord.js embed

### ButtonBuilder (Builder Layer)
- **Responsibility**: Build button components with validation
- **Dependencies**: None
- **Methods**:
  - `setCustomId(id)`: Set custom ID (required for non-link buttons)
  - `setLabel(text)`: Set button text
  - `setStyle(style)`: Set button style (Primary/Secondary/Success/Danger/Link)
  - `setDisabled(disabled)`: Enable/disable button
  - `setURL(url)`: Set URL (required for Link style)
  - `setEmoji(emoji)`: Set button emoji
  - `build()`: Return discord.js button

### ActionRowBuilder (Builder Layer)
- **Responsibility**: Build action rows with component limits
- **Dependencies**: None
- **Methods**:
  - `addComponents(...components)`: Add components (max 5)
  - `build()`: Return discord.js action row

### ErrorEmbedBuilder (Builder Layer)
- **Responsibility**: Format error messages consistently
- **Dependencies**: EmbedBuilder
- **Methods**:
  - `fromError(error, context)`: Create error embed from Error object
  - `setOperation(operation)`: Set operation context
  - `setMetadata(metadata)`: Set additional metadata
  - `build()`: Return error embed

### TextTruncator (Utility)
- **Responsibility**: Truncate text to Discord limits
- **Static Methods**:
  - `truncateTitle(text)`: Truncate to 256 chars
  - `truncateDescription(text)`: Truncate to 4096 chars
  - `truncateFieldName(text)`: Truncate to 256 chars
  - `truncateFieldValue(text)`: Truncate to 1024 chars
  - `truncateFooter(text)`: Truncate to 2048 chars
  - `truncate(text, limit)`: Generic truncation with "..."

### ColorConverter (Utility)
- **Responsibility**: Convert color formats to Discord decimal
- **Static Methods**:
  - `toDecimal(color)`: Convert hex/named/decimal to decimal
  - `fromHex(hex)`: Convert hex string to decimal
  - `fromNamed(name)`: Convert named color to decimal
  - **Named Colors**: RED, GREEN, BLUE, YELLOW, ORANGE, PURPLE, etc.

### RetryHandler (Utility)
- **Responsibility**: Exponential backoff retry logic
- **Methods**:
  - `execute(operation, options)`: Execute with retry
  - `calculateDelay(attempt)`: Calculate exponential backoff
  - **Backoff Schedule**: 1s, 2s, 4s, 8s (max 3 retries)
  - **Retry on**: 429, 500, 502, 503, 504
  - **Fail fast on**: 4xx (except 429)

## Error Handling Strategy

### Custom Error Classes

1. **RateLimitError**: 429 response, includes `retryAfter` ms
2. **PermissionError**: 403 response, includes `requiredPermission`
3. **ChannelNotFoundError**: 404 response for channel
4. **InteractionTimeoutError**: Interaction token expired (>3s)
5. **ValidationError**: Invalid input (e.g., button without customId)

### Error Flow

```
Operation Error
├── RateLimitError (429) → Queue & retry after delay
├── PermissionError (403) → Post to error channel, throw
├── ChannelNotFoundError (404) → Post to error channel, throw
├── InteractionTimeoutError → Log warning, throw
├── ValidationError → Throw immediately
└── Unknown Error → Post to error channel, throw
```

### Error Channel Fallback

```
Error occurs
├── Try errorChannelId (if configured)
│   ├── Success → Posted
│   └── Fail → Fall back to primary channelId
├── Try primary channelId
│   ├── Success → Posted
│   └── Fail → Log to console, don't throw (avoid infinite loop)
```

## Rate Limiting Implementation

### Token Bucket Algorithm

```
Per-Channel Bucket:
- Capacity: 5 tokens
- Refill rate: 5 tokens/second
- Refill interval: 200ms (1 token every 200ms)

Global Bucket:
- Capacity: 50 tokens
- Refill rate: 50 tokens/second
- Refill interval: 20ms (1 token every 20ms)

Operation Flow:
1. Acquire global token (wait if needed)
2. Acquire channel token (wait if needed)
3. Execute operation
4. Handle 429 → Extract retry_after, throw RateLimitError
```

### Queue Management

When rate limited:
1. Extract `retry_after` from 429 response
2. Add operation to channel queue
3. Set timer to process queue after `retry_after`
4. Process queue: retry all queued operations sequentially

## Interaction Handling

### Button Click Flow

```
1. User clicks button
   ↓
2. Discord sends interaction event
   ↓
3. InteractionService receives event
   ↓
4. Look up handler by customId
   ↓
5. Call handler(interaction, context)
   ↓
6. Handler MUST call deferReply() within 3s
   ↓
7. Handler performs long operation
   ↓
8. Handler calls editReply() or followUp()
   ↓
9. (Optional) Edit original message to disable button
```

### Interaction Context

Passed to button handlers:

```typescript
{
  interaction: Discord.ButtonInteraction,
  messageId: string,
  channelId: string,
  guildId: string,
  userId: string,
  customId: string
}
```

## Testing Strategy

### Unit Tests (Isolated)

- **Builders**: Test truncation, validation, limits
  - EmbedBuilder: Truncate all fields, color conversion
  - ButtonBuilder: Validate styles, customId requirements
  - ActionRowBuilder: Enforce 5-component limit
  - ErrorEmbedBuilder: Format errors correctly

- **Utilities**: Test edge cases
  - TextTruncator: At limit, over limit, empty string, unicode
  - ColorConverter: All three formats, invalid inputs
  - RetryHandler: Exponential backoff timing, max retries

- **Services**: Mock Discord client
  - MessageService: Mock send/edit/delete operations
  - InteractionService: Mock interaction events
  - RateLimitService: Mock token buckets, test queuing

- **Errors**: Test error creation and properties

### Integration Tests (Real API)

- **Connection**: Test connect/disconnect lifecycle
- **Message Operations**: Post/edit/delete to real channel
- **Rate Limiting**: Trigger 429, verify retry logic
- **Interaction Handling**: Simulate button clicks
- **Error Channel Fallback**: Invalid error channel, verify fallback

### Test Coverage Target

- **Minimum**: 80% overall coverage
- **Critical paths**: 100% coverage (rate limiting, error handling)
- **Utilities**: 100% coverage (pure functions)

### Mock Strategy

Create comprehensive Discord client mock:
- Message responses with IDs
- 429 errors with retry_after
- 403 permission errors
- 404 not found errors
- Interaction events with user context

## Discord API Requirements

### Intents

```typescript
GatewayIntentBits.Guilds           // Guild info
GatewayIntentBits.GuildMessages    // Send/receive messages
GatewayIntentBits.MessageContent   // Read content
```

### Permissions

- `VIEW_CHANNEL` on target channels
- `SEND_MESSAGES` on target channels
- `EMBED_LINKS` for rich embeds
- `USE_EXTERNAL_EMOJIS` for custom emojis

### Discord Limits

- **Embed title**: 256 characters
- **Embed description**: 4096 characters
- **Embed field name**: 256 characters
- **Embed field value**: 1024 characters
- **Embed footer**: 2048 characters
- **Total embed size**: 6000 characters
- **Components per row**: 5 buttons
- **Rows per message**: 5 action rows

## Package Configuration

### package.json

```json
{
  "name": "@xmer/discord-notifier",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "files": ["dist"],
  "scripts": {
    "build": "tsc",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint src --ext .ts",
    "prepublishOnly": "npm run build && npm test"
  }
}
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "declaration": true,
    "outDir": "./dist",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```
