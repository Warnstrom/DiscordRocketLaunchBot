import { CacheType, CommandInteraction, CommandInteractionOptionResolver } from "discord.js";
export default class Command {
  readonly name: string | undefined;
  readonly description: string | undefined;
  readonly option: boolean | undefined;
  readonly agencyOption?: string | undefined;
  readonly agencyDescriptionOption?: string | undefined;
  slashCommand() {}
  async execute(
    interaction: CommandInteraction,
    options: Omit<CommandInteractionOptionResolver<CacheType>, "getMessage" | "getFocused">
  ) {}
}
