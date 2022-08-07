import { CommandInteraction, CommandInteractionOptionResolver, MessageEmbed } from "discord.js";
import Command from "../structs/command";
import { API } from "../utils/database";
import { log } from "../utils/logger";

const { SlashCommandBuilder } = require("@discordjs/builders");

export class AddEventLimit implements Command {
  private interaction: CommandInteraction | undefined;
  readonly name = "addeventlimit";
  readonly description = "Add a limit to how many events you want (max 50)";
  readonly option: boolean = false;
  readonly agencyOption: string = "limit";
  readonly agencyDescriptionOption: string = "Enter a limit to how many events you want (max 50)";
  readonly disabled: boolean = false;
  readonly admin: boolean = true;
  private readonly color = 39423;
  async execute(interaction: CommandInteraction, options: Omit<CommandInteractionOptionResolver, "getMessage" | "getFocused">): Promise<void> {
    if (interaction.memberPermissions?.has("ADMINISTRATOR")) {
      const limit: string | null = options.getString("limit");
      this.interaction = interaction;
      this.send(limit);
    } else {
      this.interaction?.reply("You don't have the permission to use this command");
    }
  }

  slashCommand() {
    return new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .addStringOption((option: any) => option.setName(this.agencyOption).setDescription(this.agencyDescriptionOption));
  }

  private async send(limit: string | null) {
    if (limit) {
      const serverId = this.interaction?.guildId;
      API.guild.addEventLimit({ guildId: serverId, limit: parseInt(limit) });
      await this.interaction?.reply(`Changed the max limit to ${limit} launch event(s)`);
    }
  }
}
