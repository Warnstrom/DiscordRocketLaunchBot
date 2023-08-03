const { CacheType, CommandInteraction, CommandInteractionOptionResolver, GuildChannel, MessageEmbed, TextChannel } = require("discord.js");
import Command from "../structs/command";
import { mission } from "../api/nextMissionApi";
import { NextType } from "../interfaces/next";
import { helpers } from "../utils/helpers";
import { log } from "../utils/logger";
import client from "..";
const { SlashCommandBuilder } = require("@discordjs/builders");

export class Next implements Command {
  private interaction: typeof CommandInteraction | undefined;
  readonly name: string = "next";
  readonly option: boolean = true;
  readonly description: string = "Replies with upcoming launch";
  readonly agencyOption: string = "agency";
  readonly agencyDescriptionOption: string = "Enter an agency";
  readonly disabled: boolean = false;
  async execute(
    interaction: typeof CommandInteraction,
    options: Omit<typeof CommandInteractionOptionResolver, "getMessage" | "getFocused">,
    channel: string
  ): Promise<void | typeof MessageEmbed | undefined> {
    this.interaction = interaction;
    let agency: string | null = null;
    if (!channel) {
      agency = options.getString("agency");
    }
    try {
      const value = await mission.next(agency);
      this.sendEmbed(value, channel);
    } catch (error) {
      console.error(error);
    }
  }

  slashCommand() {
    const slashCommand = new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .addStringOption((option: any) => option.setName(this.agencyOption).setDescription(this.agencyDescriptionOption));
      return slashCommand;
  }

  private async sendEmbed(data: NextType, channel: string): Promise<void | typeof MessageEmbed | undefined> {
    const textChannel = client.channels.cache.get(channel) as typeof TextChannel;
    const launchDate: number = Math.floor(new Date(data.net).getTime() / 1000);
    const embed: typeof MessageEmbed = new MessageEmbed()
      .setColor(helpers.getColor(data.status?.abbrev))
      .setThumbnail(data.launch_service_provider?.info_url ? data.launch_service_provider?.info_url : helpers.imageUrl)
      .setTitle(data.name || "")
      .setURL(data.infographic || data.image || "")
      .setAuthor({ name: data.launch_service_provider?.name || "Unknown" })
      .addFields(
        {
          name: "Description",
          value: data.mission?.description || "",
        },
        {
          name: "Launch Pad",
          value: data.pad?.name || "",
          inline: true,
        },
        {
          name: "Pad location",
          value: data.pad?.location.name || "",
          inline: true,
        },
        {
          name: "Mission type",
          value: data.mission?.type || "",
          inline: true,
        },
        {
          name: "Launch date",
          value: `<t:${launchDate}:F>` + " - " + `<t:${launchDate}:R>` || "",
          inline: true,
        },
        {
          name: "Launch status",
          value: data.status?.name || "",
        },
        {
          name: "Live stream",
          value: data.webcast_live || data.vidURLs.length != 0 ? data.vidURLs[0].url : "No stream yet",
        }
      )
      .setImage(data.image || "")
      .setFooter({ text: data.pad?.location.name || "" });
    if (!channel) {
      this.interaction?.reply({ embeds: [embed] });
    } else {
      textChannel.send({ embeds: [embed] });
    }
  }
}
