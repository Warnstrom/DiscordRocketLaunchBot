import { APIEmbed } from "discord-api-types";
import {
  CacheType,
  CommandInteraction,
  CommandInteractionOptionResolver,
  GuildChannel,
  TextChannel,
} from "discord.js";
export default class Command {
  readonly name: string | undefined;
  readonly description: string | undefined;
  readonly option: boolean | undefined;
  readonly agencyOption?: string | undefined;
  readonly agencyDescriptionOption?: string | undefined;
  readonly disabled: boolean | undefined;
  slashCommand() {}
  async execute(
    interaction: CommandInteraction | null,
    options: Omit<CommandInteractionOptionResolver<CacheType>, "getMessage" | "getFocused"> | null,
    channel?: string | TextChannel | GuildChannel
  ) {}
  update?(customButtonId?: String): void;
}
