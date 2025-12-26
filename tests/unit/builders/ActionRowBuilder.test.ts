import { ActionRowBuilder } from '../../../src/builders/ActionRowBuilder';
import { ButtonBuilder } from '../../../src/builders/ButtonBuilder';
import { ButtonStyle } from '../../../src/types/ButtonOptions';
import { ValidationError } from '../../../src/errors/DiscordErrors';

describe('ActionRowBuilder', () => {
  const createButton = (customId: string): ButtonBuilder => {
    return new ButtonBuilder({
      label: 'Test',
      style: ButtonStyle.Primary,
      customId,
    });
  };

  describe('addComponents', () => {
    it('should add single component', () => {
      const row = new ActionRowBuilder();
      const button = createButton('button1');

      row.addComponents(button);
      const built = row.build();

      expect(built.components).toHaveLength(1);
    });

    it('should add multiple components at once', () => {
      const row = new ActionRowBuilder();
      const buttons = [createButton('button1'), createButton('button2'), createButton('button3')];

      row.addComponents(...buttons);
      const built = row.build();

      expect(built.components).toHaveLength(3);
    });

    it('should add components incrementally', () => {
      const row = new ActionRowBuilder();

      row.addComponents(createButton('button1'));
      row.addComponents(createButton('button2'));
      row.addComponents(createButton('button3'));

      const built = row.build();
      expect(built.components).toHaveLength(3);
    });

    it('should throw error when adding more than 5 components at once', () => {
      const row = new ActionRowBuilder();
      const buttons = [
        createButton('button1'),
        createButton('button2'),
        createButton('button3'),
        createButton('button4'),
        createButton('button5'),
        createButton('button6'),
      ];

      expect(() => row.addComponents(...buttons)).toThrow(ValidationError);
      expect(() => row.addComponents(...buttons)).toThrow('maximum 5 components');
    });

    it('should throw error when adding to row that already has 5 components', () => {
      const row = new ActionRowBuilder();
      const buttons = [
        createButton('button1'),
        createButton('button2'),
        createButton('button3'),
        createButton('button4'),
        createButton('button5'),
      ];

      row.addComponents(...buttons);

      expect(() => row.addComponents(createButton('button6'))).toThrow(ValidationError);
    });

    it('should allow exactly 5 components', () => {
      const row = new ActionRowBuilder();
      const buttons = [
        createButton('button1'),
        createButton('button2'),
        createButton('button3'),
        createButton('button4'),
        createButton('button5'),
      ];

      expect(() => row.addComponents(...buttons)).not.toThrow();
      expect(row.build().components).toHaveLength(5);
    });

    it('should support method chaining', () => {
      const row = new ActionRowBuilder();
      const result = row.addComponents(createButton('button1'));

      expect(result).toBe(row);
    });
  });

  describe('build', () => {
    it('should throw error when building empty row', () => {
      const row = new ActionRowBuilder();

      expect(() => row.build()).toThrow(ValidationError);
      expect(() => row.build()).toThrow('at least 1 component');
    });

    it('should build valid row', () => {
      const row = new ActionRowBuilder();
      row.addComponents(createButton('button1'));

      expect(() => row.build()).not.toThrow();
    });
  });
});
