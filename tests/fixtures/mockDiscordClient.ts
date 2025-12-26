/**
 * Mock Discord.js client for testing
 */
export class MockDiscordClient {
  public user = {
    tag: 'TestBot#1234',
    id: '123456789',
  };

  public channels = new MockChannelManager();
  public isReady = () => true;

  private eventListeners: Map<string, Function[]> = new Map();

  public on(event: string, listener: Function): this {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(listener);
    return this;
  }

  public once(event: string, listener: Function): this {
    const wrappedListener = (...args: any[]) => {
      listener(...args);
      this.off(event, wrappedListener);
    };
    this.on(event, wrappedListener);
    return this;
  }

  public off(event: string, listener: Function): this {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    }
    return this;
  }

  public emit(event: string, ...args: any[]): boolean {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach((listener) => listener(...args));
      return true;
    }
    return false;
  }

  public async login(token: string): Promise<string> {
    setTimeout(() => this.emit('ready'), 10);
    return token;
  }

  public destroy(): void {
    this.eventListeners.clear();
  }
}

/**
 * Mock channel manager
 */
class MockChannelManager {
  private channels: Map<string, MockTextChannel> = new Map();

  public async fetch(channelId: string): Promise<MockTextChannel> {
    let channel = this.channels.get(channelId);
    if (!channel) {
      channel = new MockTextChannel(channelId);
      this.channels.set(channelId, channel);
    }
    return channel;
  }

  public setChannel(channelId: string, channel: MockTextChannel): void {
    this.channels.set(channelId, channel);
  }
}

/**
 * Mock text channel
 */
export class MockTextChannel {
  public id: string;
  public messages = new MockMessageManager();

  constructor(id: string) {
    this.id = id;
  }

  public isTextBased(): boolean {
    return true;
  }

  public async send(options: any): Promise<MockMessage> {
    const message = new MockMessage(this.id, options);
    this.messages.addMessage(message);
    return message;
  }
}

/**
 * Mock message manager
 */
class MockMessageManager {
  private messages: Map<string, MockMessage> = new Map();

  public async fetch(messageId: string): Promise<MockMessage> {
    const message = this.messages.get(messageId);
    if (!message) {
      throw { status: 404, message: 'Unknown Message' };
    }
    return message;
  }

  public addMessage(message: MockMessage): void {
    this.messages.set(message.id, message);
  }
}

/**
 * Mock message
 */
export class MockMessage {
  public id: string;
  public channelId: string;
  public guildId?: string;
  public content: string;
  public embeds: any[];
  public components: any[];
  public createdAt: Date;

  private static messageCounter = 0;

  constructor(channelId: string, options: any) {
    this.id = `${Date.now()}${MockMessage.messageCounter++}`;
    this.channelId = channelId;
    this.guildId = '1111111111111111111';
    this.content = options.content || '';
    this.embeds = options.embeds || [];
    this.components = options.components || [];
    this.createdAt = new Date();
  }

  public async edit(options: any): Promise<MockMessage> {
    if (options.content !== undefined) {
      this.content = options.content;
    }
    if (options.embeds !== undefined) {
      this.embeds = options.embeds;
    }
    if (options.components !== undefined) {
      this.components = options.components;
    }
    return this;
  }

  public async delete(): Promise<void> {
    // Message deleted
  }
}

/**
 * Mock button interaction
 */
export class MockButtonInteraction {
  public customId: string;
  public message: MockMessage;
  public user = { id: '987654321' };
  public channelId: string;
  public guildId?: string;
  public replied = false;
  public deferred = false;

  constructor(customId: string, message: MockMessage) {
    this.customId = customId;
    this.message = message;
    this.channelId = message.channelId;
    this.guildId = message.guildId;
  }

  public isButton(): boolean {
    return true;
  }

  public async deferReply(options?: any): Promise<any> {
    this.deferred = true;
    return {};
  }

  public async reply(options: any): Promise<any> {
    this.replied = true;
    return {};
  }

  public async editReply(options: any): Promise<any> {
    return {};
  }

  public async followUp(options: any): Promise<any> {
    return {};
  }
}
