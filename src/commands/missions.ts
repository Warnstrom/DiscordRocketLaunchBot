import {
  CacheType,
  CommandInteraction,
  CommandInteractionOptionResolver,
  MessageActionRow,
  MessageButton,
  MessageEmbed,
} from "discord.js";
import Command from "../structs/command";
import { mission } from "../api/nextMissionApi";
import { NextType } from "../interfaces/next";
import { helpers } from "../utils/helpers";
const { SlashCommandBuilder } = require("@discordjs/builders");

export class Missions implements Command {
  readonly interactionComponents: string[] = ["leftTurnPageAction", "rightTurnPageAction"];
  private interaction: CommandInteraction | undefined;
  readonly name = "missions";
  readonly description = "Replies with next seven launches";
  readonly option: boolean | undefined;
  readonly agencyOption: string | undefined = "agency";
  readonly agencyDescriptionOption: string = "Enter an agency";
  async execute(
    interaction: CommandInteraction,
    options: Omit<CommandInteractionOptionResolver, "getMessage" | "getFocused">
  ): Promise<void> {
    this.interaction = interaction;
    const agency = options.getString("agency");
    const row = new MessageActionRow().addComponents(
      new MessageButton().setCustomId("leftTurnPageAction").setLabel("⬅️").setStyle("PRIMARY"),
      new MessageButton().setCustomId("rightTurnPageAction").setLabel("➡️").setStyle("PRIMARY")
    );

    let pageNumber = 0;
    const missions = await mission.week(agency);
    const embed = await this.generateEmbed(missions, pageNumber);
    interaction.reply({ embeds: [embed], components: [row] });
  }

   slashCommand() {
    return new SlashCommandBuilder()
    .setName(this.name)
    .setDescription(this.description)
    .addStringOption((option: any) =>
      option.setName(this.agencyOption).setDescription(this.agencyDescriptionOption)
    );
  }

  private generateEmbed = async (
    mission: NextType[],
    missionNumber: number
  ): Promise<MessageEmbed> => {
    const data = mission[missionNumber];
    const launchDate = Math.floor(new Date(data.window_start).getTime() / 1000);

    const embed = new MessageEmbed()
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
      .setFooter({ text: `Page: ${missionNumber + 1} / ${7}` });
    return embed;
  };
}
