import { CommandInteraction, MessageEmbed } from "discord.js";
import Command from "../structs/command";
import { DailyPicture } from "../interfaces/daily";
import { daily } from "../api/nextMissionApi";

export class Daily implements Command {
  readonly name = "daily";
  readonly description = "Replies with daily picture or video from NASA";
  private readonly color = 39423;
  private interaction: CommandInteraction | undefined;

  async execute(interaction: CommandInteraction): Promise<void> {
    this.interaction = interaction;
    const dailyPicture = await daily.apod();
    this.sendEmbed(dailyPicture);
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
