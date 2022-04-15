import {
  CacheType,
  CommandInteraction,
  CommandInteractionOptionResolver,
  MessageEmbed,
} from "discord.js";
import Command from "../structs/command";
import { agency } from "../api/nextMissionApi";
import { SpaceAgency } from "../interfaces/agency";
import { helpers } from "../utils/helpers";
const { SlashCommandBuilder } = require("@discordjs/builders");

export class Agency implements Command {
  private interaction: CommandInteraction | undefined;
  readonly name: string = "agency";
  readonly description: string = "Replies with info about an agency";
  readonly option: boolean = true;
  readonly agencyOption: string | undefined = "name";
  readonly agencyDescriptionOption: string = "Enter an agency";
  async execute(
    interaction: CommandInteraction,
    options: Omit<CommandInteractionOptionResolver<CacheType>, "getMessage" | "getFocused">
  ): Promise<void> {
    this.interaction = interaction;
    const agencyName = options.getString("agency");
    try {
      if (agencyName != null) {
        const value = await agency.info(agencyName);
        this.sendEmbed(value);
      } else {
        this.sendErrorMessage();
      }
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
  private sendErrorMessage() {
    this.interaction?.reply("Couldn't find the specified agency");
  }
  private async sendEmbed(data: SpaceAgency) {
    const embed = new MessageEmbed()
      .setThumbnail(helpers.imageUrl)
      .setTitle(data.abbrev)
      .setAuthor({ name: data.name })
      .addFields(
        {
          name: "Country",
          value: data.country_code || "",
        },
        {
          name: "Administrator | CEO",
          value: data.administrator || "",
          inline: true,
        },
        {
          name: "Found year",
          value: data.founding_year || "",
          inline: true,
        },
        {
          name: "Description",
          value: data.description || "",
        },
        {
          name: "Type",
          value: data.type || "",
          inline: true,
        },
        {
          name: "Launchers",
          value: data.launchers || "",
          inline: true,
        },
        {
          name: "Spacecrafts",
          value: data.spacecraft || "",
          inline: true,
        }
      );
    await this.interaction?.reply({ embeds: [embed] });
  }
}
