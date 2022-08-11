import { CommandInteraction, CommandInteractionOptionResolver, GuildBasedChannel, MessageEmbed } from "discord.js";
import client from "..";
import Command from "../structs/command";
import { API } from "../utils/database";
import { log } from "../utils/logger";

const { SlashCommandBuilder } = require("@discordjs/builders");

export class SetEventChannel implements Command {
  private interaction: CommandInteraction | undefined;
  readonly name = "seteventchannel";
  readonly description = "Set a channel to announce launch events in";
  readonly option: boolean = false;
  readonly agencyOption: string = "channel";
  readonly agencyDescriptionOption: string = "Enter a channel where you want your launch announcement";
  readonly disabled: boolean = false;
  readonly admin: boolean = true;
  private readonly color = 39423;
  async execute(interaction: CommandInteraction, options: Omit<CommandInteractionOptionResolver, "getMessage" | "getFocused">): Promise<void> {
    if (interaction.memberPermissions?.has("ADMINISTRATOR")) {
      const channel: string | null = options.getString("channel");
      this.interaction = interaction;
      this.send(channel);
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

  private async send(channel: string | null) {
    if (channel && this.interaction) {
      const channelId = this.interaction.channelId;
      const serverId = this.interaction.guildId;
      let checkedChannelId: GuildBasedChannel | undefined;
      if (serverId) {
        const guild = client.guilds.cache.get(serverId?.toString());
        checkedChannelId = guild?.channels.cache.get(channel.toString().slice(2, 20));
      }
      if (checkedChannelId) {
        API.guild.addEventChannel({ guildId: serverId, eventChannelId: channelId });
        await this.interaction?.reply(`Added ${channel} as a launch event channel`);
      } else {
        await this.interaction?.reply(`Found no channel called: ${channel}`);
      }
    }
  }
}
