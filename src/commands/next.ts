import {
  CacheType,
  CommandInteraction,
  CommandInteractionOptionResolver,
  MessageEmbed,
} from "discord.js";
import Command from "../structs/command";
import { mission } from "../api/nextMissionApi";
import { NextType } from "../interfaces/next";
import { helpers } from "../utils/helpers";
import { log } from "../utils/logger";
const { SlashCommandBuilder } = require("@discordjs/builders");

export class Next implements Command {
  private interaction: CommandInteraction | undefined;
  readonly name: string = "next";
  readonly description: string | undefined = "Replies with upcoming launch";
  readonly option: boolean = true;
  readonly agencyOption: string | undefined = "agency";
  readonly agencyDescriptionOption: string = "Enter an agency";
  async execute(
    interaction: CommandInteraction,
    options: Omit<CommandInteractionOptionResolver, "getMessage" | "getFocused">
  ): Promise<void> {
    this.interaction = interaction;
    const agency: string | null = options.getString("agency");
    try {
      const value = await mission.next(agency);
      this.sendEmbed(value);
    } catch (error) {
      console.error(error);
    }
  }

  slashCommand() {
    return new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .addStringOption((option: any) =>
        option.setName(this.agencyOption).setDescription(this.agencyDescriptionOption)
      );
  }

  private async sendEmbed(data: NextType) {
    const launchDate: number = Math.floor(new Date(data.window_start).getTime() / 1000);
    const embed: MessageEmbed = new MessageEmbed()
      .setColor(helpers.getColor(data.status?.abbrev))
      .setThumbnail(helpers.imageUrl)
      .setTitle(data.name)
      .setURL(data.infographic || data.image)
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
        }
      )
      .setImage(data.image)
      .setFooter({ text: data.pad?.location.name || "" });
    this.interaction?.reply({ embeds: [embed] });
  }
}
