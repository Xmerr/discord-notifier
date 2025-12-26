# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-12-26

### Added
- Initial release of @xmer/discord-notifier
- DiscordNotifier main client class
- Rich embed support with auto-truncation
- Interactive button components
- Token bucket rate limiting (5 req/s per channel, 50 req/s global)
- Exponential backoff retry logic
- Error channel fallback system
- Adult content suppression feature
- Custom error classes (RateLimitError, PermissionError, etc.)
- Comprehensive TypeScript types
- EmbedBuilder with auto-truncation
- ButtonBuilder with validation
- ActionRowBuilder with component limits
- ErrorEmbedBuilder for consistent error formatting
- TextTruncator utility
- ColorConverter utility (hex/named/decimal support)
- RetryHandler utility
- MessageService for message operations
- InteractionService for button handling
- RateLimitService for rate limiting
- Jest test suite with 71.58% coverage
- Mock Discord client for testing
- Comprehensive documentation and README

### Known Issues
- Test coverage at 71.58% (target: 80%+)
- Missing tests for services and main client
- One failing test in RetryHandler (network error scenario)

### Future Improvements
- Add service and client tests to reach 80%+ coverage
- Add integration tests
- Improve EmbedBuilder test coverage
- Add more advanced interaction types (select menus, modals)
