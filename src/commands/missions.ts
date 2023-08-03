import {
  CacheType,
  CommandInteraction,
  CommandInteractionOptionResolver,
  MessageActionRow,
  MessageActionRowComponentResolvable,
  MessageButton,
  MessageEmbed,
} from "discord.js";
import Command from "../structs/command";
import { mission } from "../api/nextMissionApi";
import { NextType } from "../interfaces/next";
import { helpers } from "../utils/helpers";
import { log } from "../utils/logger";
const { SlashCommandBuilder } = require("@discordjs/builders");
const missionData = (agency: string | null) => {
  return mission.week(agency);
};
export class Missions implements Command {
  private interaction: CommandInteraction | undefined;
  private missionData: Promise<NextType[]> | undefined;
  private actionRowComponents: MessageActionRowComponentResolvable[] = [
    new MessageButton().setCustomId("missions-leftTurnPageAction").setLabel("⬅️").setStyle("PRIMARY"),
    new MessageButton().setCustomId("missions-rightTurnPageAction").setLabel("➡️").setStyle("PRIMARY"),
  ];
  private actionRow: MessageActionRow = new MessageActionRow().addComponents(this.actionRowComponents);
  private pageNumber = 0;
  readonly name = "missions";
  readonly description = "Replies with next seven launches";
  readonly option: boolean | undefined;
  readonly agencyOption: string | undefined = "agency";
  readonly agencyDescriptionOption: string = "Enter an agency";
  readonly disabled: boolean = true;

  async execute(interaction: CommandInteraction, options: Omit<CommandInteractionOptionResolver, "getMessage" | "getFocused">): Promise<void> {
    const agency = options.getString("agency");
    const missions: Promise<NextType[]> | undefined = missionData(agency);
    const embed = await this.generateEmbed(missions, this.pageNumber);
    if (embed) {
      interaction.reply({ embeds: [embed], components: [this.actionRow] });
    }
  }

  async update(customButtonId: string) {
    log(customButtonId, this.pageNumber);
    if (this.missionData && this.pageNumber) {
      const embed = await this.generateEmbed(this.missionData, this.pageNumber + 1);
      if (embed) {
        this.interaction?.editReply({ embeds: [embed], components: [this.actionRow] });
      }
    } else {
      log(this);
    }
  }

  slashCommand() {
    return new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .addStringOption((option: any) => option.setName(this.agencyOption).setDescription(this.agencyDescriptionOption));
  }

  private generateEmbed = async (missions: Promise<NextType[]> | undefined, missionNumber: number): Promise<MessageEmbed | undefined> => {
    if (missions != undefined) {
      const { window_start, status, name, infographic, image, launch_service_provider, mission, pad } = await missions.then(
        (result) => result[missionNumber]
      );
      const launchDate = Math.floor(new Date(window_start).getTime() / 1000);

      const embed = new MessageEmbed()
        .setColor(helpers.getColor(status?.abbrev))
        .setThumbnail(helpers.imageUrl)
        .setTitle(name)
        .setURL(infographic || image)
        .setAuthor({ name: launch_service_provider?.name || "Unknown" })
        .addFields(
          {
            name: "Description",
            value: mission?.description || "",
          },
          {
            name: "Launch Pad",
            value: pad?.name || "",
            inline: true,
          },
          {
            name: "Pad location",
            value: pad?.location.name || "",
            inline: true,
          },
          {
            name: "Mission type",
            value: mission?.type || "",
            inline: true,
          },
          {
            name: "Launch date",
            value: `<t:${launchDate}:F>` + " - " + `<t:${launchDate}:R>` || "",
            inline: true,
          },
          {
            name: "Launch status",
            value: status?.name || "",
          }
        )
        .setImage(image)
        .setFooter({ text: `Page: ${missionNumber + 1} / ${7}` });
      return embed;
    }
  };
}
