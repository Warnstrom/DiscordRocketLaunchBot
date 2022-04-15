import { CommandInteraction, MessageEmbed } from "discord.js";
import Command from "../structs/command";
import { DailyPicture } from "../interfaces/daily";
import { daily } from "../api/dailyPictureApi";
const { SlashCommandBuilder } = require("@discordjs/builders");

export class Daily implements Command {
  private interaction: CommandInteraction | undefined;
  readonly name = "daily";
  readonly description = "Replies with daily picture or video from NASA";
  readonly option: boolean = false;
  readonly agencyDescriptionOption: string | undefined = undefined;
  readonly agencyOption: string | undefined = undefined;
  private readonly color = 39423;
  async execute(interaction: CommandInteraction): Promise<void> {
    this.interaction = interaction;
    const dailyPicture = await daily.apod();
    this.sendEmbed(dailyPicture);
  }

  slashCommand() {
    return new SlashCommandBuilder()
    .setName(this.name)
    .setDescription(this.description).toJSON()
  }

  private async sendEmbed(data: DailyPicture) {
    const embed = new MessageEmbed()
      .setColor(this.color)
      .setTitle("HD version")
      .setAuthor({ name: data.title })
      .setURL(data.hdurl)
      .setImage(data.url)
      .setDescription(data.explanation)
      .setFooter({ text: data.date });
    await this.interaction?.reply({ embeds: [embed] });
  }
}
