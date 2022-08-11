import { CommandInteraction, CommandInteractionOptionResolver, Role } from "discord.js";
import client from "..";
import Command from "../structs/command";
import { API } from "../utils/database";
import { log } from "../utils/logger";

const { SlashCommandBuilder } = require("@discordjs/builders");

export class SetEventRole implements Command {
  private interaction: CommandInteraction | undefined;
  readonly name = "seteventrole";
  readonly description = "Set a role to be tagged for a launch event";
  readonly option: boolean = false;
  readonly agencyOption: string = "role";
  readonly agencyDescriptionOption: string = "Enter a role";
  readonly disabled: boolean = false;
  readonly admin: boolean = true;
  private readonly color = 39423;
  async execute(interaction: CommandInteraction, options: Omit<CommandInteractionOptionResolver, "getMessage" | "getFocused">): Promise<void> {
    if (interaction.memberPermissions?.has("ADMINISTRATOR")) {
      const role: string | null = options.getString("role");

      this.interaction = interaction;
      this.send(role);
    } else {
      await this.interaction?.reply("You don't have the permission to use this command");
    }
  }

  slashCommand() {
    return new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .addStringOption((option: any) => option.setName(this.agencyOption).setDescription(this.agencyDescriptionOption));
  }

  private async send(role: string | null) {
    if (this.interaction && role) {
      const serverId = this.interaction?.guildId;
      let checkedRoleId: Role | undefined;
      if (serverId) {
        const guild = client.guilds.cache.get(serverId?.toString());
        checkedRoleId = guild?.roles.cache.get(role.toString().slice(3, 21));
      }
      if (checkedRoleId) {
        API.guild.addEventRole({ guildId: serverId, eventRoleId: role });
        await this.interaction.reply(`Added ${role} as an event role`);
      } else {
        await this.interaction.reply(`Found no role called: ${role}`);
      }
    }
  }
}
