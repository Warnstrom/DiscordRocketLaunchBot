import { CommandInteraction, CommandInteractionOptionResolver, MessageEmbed } from "discord.js";
import client from "..";
import Command from "../structs/command";
import { API } from "../utils/database";
import { log } from "../utils/logger";
import { events } from "../utils/event";
const { SlashCommandBuilder } = require("@discordjs/builders");

export class SetEventLimit implements Command {
  private interaction: CommandInteraction | undefined;
  readonly name = "seteventlimit";
  readonly description = "Set a limit to how many events you want (max 50)";
  readonly option: boolean = false;
  readonly agencyOption: string = "limit";
  readonly agencyDescriptionOption: string = "Enter a limit to how many events you want (max 50)";
  readonly disabled: boolean = false;
  readonly admin: boolean = true;
  private readonly color = 39423;
  async execute(
    interaction: CommandInteraction,
    options: Omit<CommandInteractionOptionResolver, "getMessage" | "getFocused">,
    channel: string
  ): Promise<void> {
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

  private async send(eventLimit: string | null) {
    if (eventLimit != null) {
      const limit = parseInt(eventLimit);
      if (limit < 50 && limit >= 0) {
        const serverId = this.interaction?.guildId;
        if (serverId) {
          API.guild
            .findOne(serverId)
            .then(async (guild) => {
              if (guild) {
                if (guild.eventLimit < limit) {
                  log("add");
                  events.add(limit, serverId);
                } else if (guild.eventLimit > limit || limit === 0) {
                  log("delete");
                  await events.deleteLimit(limit, serverId);
                }
              }
            })
            .finally(() => {
              API.guild.addEventLimit({ guildId: serverId, limit: limit });
            });
          await this.interaction?.reply({ content: `Updated the max limit to ${limit} launch event(s)`, ephemeral: true });
        }
      } else {
        await this.interaction?.reply({ content: `Max limit is 50`, ephemeral: true });
      }
    }
  }
}
