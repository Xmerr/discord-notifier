import { EmbedBuilder } from '../../../src/builders/EmbedBuilder';

describe('EmbedBuilder', () => {
  describe('constructor', () => {
    it('should create empty embed', () => {
      const builder = new EmbedBuilder();
      const embed = builder.build();

      expect(embed).toBeDefined();
    });

    it('should initialize from options', () => {
      const builder = new EmbedBuilder({
        title: 'Test Title',
        description: 'Test Description',
        color: '#FF0000',
      });
      const embed = builder.build();

      expect(embed.data.title).toBe('Test Title');
      expect(embed.data.description).toBe('Test Description');
      expect(embed.data.color).toBe(16711680);
    });
  });

  describe('setTitle', () => {
    it('should set title', () => {
      const builder = new EmbedBuilder();
      builder.setTitle('Test Title');
      const embed = builder.build();

      expect(embed.data.title).toBe('Test Title');
    });

    it('should truncate title over 256 characters', () => {
      const longTitle = 'a'.repeat(300);
      const builder = new EmbedBuilder();
      builder.setTitle(longTitle);
      const embed = builder.build();

      expect(embed.data.title).toHaveLength(256);
      expect(embed.data.title?.endsWith('...')).toBe(true);
    });

    it('should support method chaining', () => {
      const builder = new EmbedBuilder();
      const result = builder.setTitle('Test');

      expect(result).toBe(builder);
    });
  });

  describe('setDescription', () => {
    it('should set description', () => {
      const builder = new EmbedBuilder();
      builder.setDescription('Test Description');
      const embed = builder.build();

      expect(embed.data.description).toBe('Test Description');
    });

    it('should truncate description over 4096 characters', () => {
      const longDesc = 'a'.repeat(5000);
      const builder = new EmbedBuilder();
      builder.setDescription(longDesc);
      const embed = builder.build();

      expect(embed.data.description).toHaveLength(4096);
      expect(embed.data.description?.endsWith('...')).toBe(true);
    });
  });

  describe('setColor', () => {
    it('should set color from hex string', () => {
      const builder = new EmbedBuilder();
      builder.setColor('#FF0000');
      const embed = builder.build();

      expect(embed.data.color).toBe(16711680);
    });

    it('should set color from decimal', () => {
      const builder = new EmbedBuilder();
      builder.setColor(16711680);
      const embed = builder.build();

      expect(embed.data.color).toBe(16711680);
    });

    it('should set color from named color', () => {
      const builder = new EmbedBuilder();
      builder.setColor('RED');
      const embed = builder.build();

      expect(embed.data.color).toBe(0xff0000);
    });
  });

  describe('addField', () => {
    it('should add field', () => {
      const builder = new EmbedBuilder();
      builder.addField('Field Name', 'Field Value');
      const embed = builder.build();

      expect(embed.data.fields).toHaveLength(1);
      expect(embed.data.fields![0]).toEqual({
        name: 'Field Name',
        value: 'Field Value',
        inline: false,
      });
    });

    it('should add inline field', () => {
      const builder = new EmbedBuilder();
      builder.addField('Field Name', 'Field Value', true);
      const embed = builder.build();

      expect(embed.data.fields![0].inline).toBe(true);
    });

    it('should truncate field name over 256 characters', () => {
      const longName = 'a'.repeat(300);
      const builder = new EmbedBuilder();
      builder.addField(longName, 'Value');
      const embed = builder.build();

      expect(embed.data.fields![0].name).toHaveLength(256);
    });

    it('should truncate field value over 1024 characters', () => {
      const longValue = 'a'.repeat(1100);
      const builder = new EmbedBuilder();
      builder.addField('Name', longValue);
      const embed = builder.build();

      expect(embed.data.fields![0].value).toHaveLength(1024);
    });
  });

  describe('setFooter', () => {
    it('should set footer', () => {
      const builder = new EmbedBuilder();
      builder.setFooter('Footer Text');
      const embed = builder.build();

      expect(embed.data.footer?.text).toBe('Footer Text');
    });

    it('should set footer with icon', () => {
      const builder = new EmbedBuilder();
      builder.setFooter('Footer Text', 'https://example.com/icon.png');
      const embed = builder.build();

      expect(embed.data.footer?.icon_url).toBe('https://example.com/icon.png');
    });

    it('should truncate footer over 2048 characters', () => {
      const longFooter = 'a'.repeat(2100);
      const builder = new EmbedBuilder();
      builder.setFooter(longFooter);
      const embed = builder.build();

      expect(embed.data.footer?.text).toHaveLength(2048);
    });
  });

  describe('setTimestamp', () => {
    it('should set current timestamp when no argument', () => {
      const builder = new EmbedBuilder();
      builder.setTimestamp();
      const embed = builder.build();

      expect(embed.data.timestamp).toBeDefined();
      expect(typeof embed.data.timestamp).toBe('string');
      expect(embed.data.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should set timestamp from Date object', () => {
      const date = new Date('2023-01-01T00:00:00Z');
      const builder = new EmbedBuilder();
      builder.setTimestamp(date);
      const embed = builder.build();

      expect(embed.data.timestamp).toBeDefined();
      expect(typeof embed.data.timestamp).toBe('string');
    });

    it('should set timestamp from ISO string', () => {
      const isoString = '2023-01-01T00:00:00Z';
      const builder = new EmbedBuilder();
      builder.setTimestamp(isoString);
      const embed = builder.build();

      expect(embed.data.timestamp).toBeDefined();
      expect(typeof embed.data.timestamp).toBe('string');
    });
  });

  describe('setThumbnail', () => {
    it('should set thumbnail URL', () => {
      const builder = new EmbedBuilder();
      builder.setThumbnail('https://example.com/thumb.png');
      const embed = builder.build();

      expect(embed.data.thumbnail?.url).toBe('https://example.com/thumb.png');
    });
  });

  describe('setImage', () => {
    it('should set image URL', () => {
      const builder = new EmbedBuilder();
      builder.setImage('https://example.com/image.png');
      const embed = builder.build();

      expect(embed.data.image?.url).toBe('https://example.com/image.png');
    });
  });

  describe('setAuthor', () => {
    it('should set author name only', () => {
      const builder = new EmbedBuilder();
      builder.setAuthor('Author Name');
      const embed = builder.build();

      expect(embed.data.author?.name).toBe('Author Name');
      expect(embed.data.author?.icon_url).toBeUndefined();
      expect(embed.data.author?.url).toBeUndefined();
    });

    it('should set author with icon', () => {
      const builder = new EmbedBuilder();
      builder.setAuthor('Author Name', 'https://example.com/icon.png');
      const embed = builder.build();

      expect(embed.data.author?.name).toBe('Author Name');
      expect(embed.data.author?.icon_url).toBe('https://example.com/icon.png');
    });

    it('should set author with icon and URL', () => {
      const builder = new EmbedBuilder();
      builder.setAuthor('Author Name', 'https://example.com/icon.png', 'https://example.com');
      const embed = builder.build();

      expect(embed.data.author?.name).toBe('Author Name');
      expect(embed.data.author?.icon_url).toBe('https://example.com/icon.png');
      expect(embed.data.author?.url).toBe('https://example.com');
    });
  });

  describe('setURL', () => {
    it('should set title URL', () => {
      const builder = new EmbedBuilder();
      builder.setURL('https://example.com');
      const embed = builder.build();

      expect(embed.data.url).toBe('https://example.com');
    });
  });

  describe('fromOptions with all optional fields', () => {
    it('should initialize with url', () => {
      const builder = new EmbedBuilder({ url: 'https://example.com' });
      const embed = builder.build();

      expect(embed.data.url).toBe('https://example.com');
    });

    it('should initialize with thumbnail', () => {
      const builder = new EmbedBuilder({ thumbnail: 'https://example.com/thumb.png' });
      const embed = builder.build();

      expect(embed.data.thumbnail?.url).toBe('https://example.com/thumb.png');
    });

    it('should initialize with image', () => {
      const builder = new EmbedBuilder({ image: 'https://example.com/image.png' });
      const embed = builder.build();

      expect(embed.data.image?.url).toBe('https://example.com/image.png');
    });

    it('should initialize with fields', () => {
      const builder = new EmbedBuilder({
        fields: [
          { name: 'Field 1', value: 'Value 1', inline: true },
          { name: 'Field 2', value: 'Value 2', inline: false },
        ],
      });
      const embed = builder.build();

      expect(embed.data.fields).toHaveLength(2);
      expect(embed.data.fields![0].name).toBe('Field 1');
      expect(embed.data.fields![0].inline).toBe(true);
    });

    it('should initialize with footer and icon', () => {
      const builder = new EmbedBuilder({
        footer: 'Footer Text',
        footerIcon: 'https://example.com/icon.png',
      });
      const embed = builder.build();

      expect(embed.data.footer?.text).toBe('Footer Text');
      expect(embed.data.footer?.icon_url).toBe('https://example.com/icon.png');
    });

    it('should initialize with timestamp', () => {
      const builder = new EmbedBuilder({ timestamp: new Date('2023-01-01T00:00:00Z') });
      const embed = builder.build();

      expect(embed.data.timestamp).toBeDefined();
    });

    it('should initialize with author name only', () => {
      const builder = new EmbedBuilder({ authorName: 'Author Name' });
      const embed = builder.build();

      expect(embed.data.author?.name).toBe('Author Name');
    });

    it('should initialize with author name, icon, and URL', () => {
      const builder = new EmbedBuilder({
        authorName: 'Author Name',
        authorIcon: 'https://example.com/icon.png',
        authorUrl: 'https://example.com',
      });
      const embed = builder.build();

      expect(embed.data.author?.name).toBe('Author Name');
      expect(embed.data.author?.icon_url).toBe('https://example.com/icon.png');
      expect(embed.data.author?.url).toBe('https://example.com');
    });
  });

  describe('adult content suppression', () => {
    it('should remove thumbnail and image URLs', () => {
      const builder = new EmbedBuilder({
        thumbnail: 'https://example.com/thumb.png',
        image: 'https://example.com/image.png',
        suppressAdultImages: true,
      });
      const embed = builder.build();

      expect(embed.data.thumbnail).toBeUndefined();
      expect(embed.data.image).toBeUndefined();
    });

    it('should prepend warning to description', () => {
      const builder = new EmbedBuilder({
        description: 'Test Description',
        suppressAdultImages: true,
      });
      const embed = builder.build();

      expect(embed.data.description).toContain('⚠️ Content Warning:');
      expect(embed.data.description).toContain('Test Description');
    });

    it('should set orange color if no color specified', () => {
      const builder = new EmbedBuilder({
        suppressAdultImages: true,
      });
      const embed = builder.build();

      expect(embed.data.color).toBe(0xff8c00); // Orange
    });

    it('should not override existing color', () => {
      const builder = new EmbedBuilder({
        color: '#FF0000',
        suppressAdultImages: true,
      });
      const embed = builder.build();

      expect(embed.data.color).toBe(16711680); // Red, not orange
    });
  });
});
