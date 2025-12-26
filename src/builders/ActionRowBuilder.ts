import { ActionRowBuilder as DiscordActionRowBuilder } from '@discordjs/builders';
import { ButtonBuilder } from './ButtonBuilder';
import { ValidationError } from '../errors/DiscordErrors';

/**
 * Builder for creating Discord action rows with component limits
 */
export class ActionRowBuilder {
  private row: DiscordActionRowBuilder<any>;
  private components: ButtonBuilder[];

  constructor() {
    this.row = new DiscordActionRowBuilder();
    this.components = [];
  }

  /**
   * Add components to the action row
   * @param components - Button builders to add
   * @returns this for chaining
   * @throws ValidationError if more than 5 components total
   */
  addComponents(...components: ButtonBuilder[]): this {
    // Check component limit
    const totalComponents = this.components.length + components.length;
    if (totalComponents > 5) {
      throw new ValidationError(
        `Action row can have maximum 5 components, attempted to add ${totalComponents}`,
        'components'
      );
    }

    this.components.push(...components);

    // Build all components and add to Discord action row
    const builtComponents = components.map((c) => c.build());
    this.row.addComponents(...builtComponents);

    return this;
  }

  /**
   * Build and return discord.js ActionRowBuilder instance
   * @returns Discord.js ActionRowBuilder
   * @throws ValidationError if no components
   */
  build(): DiscordActionRowBuilder<any> {
    if (this.components.length === 0) {
      throw new ValidationError(
        'Action row must have at least 1 component',
        'components'
      );
    }

    return this.row;
  }
}
