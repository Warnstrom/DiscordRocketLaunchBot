import settings from "./settings";
import DiscordJS, {
  ButtonInteraction,
  Client,
  CommandInteraction,
  Intents,
  Message,
} from "discord.js";
import Command from "./structs/command";
import * as listWithCommands from "./commands/index";
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
const rest = new REST({ version: "9" }).setToken(settings.CLIENT_TOKEN);
const { SlashCommandBuilder } = require("@discordjs/builders");
export const commands: { [key: string]: typeof Command } = {
  next: listWithCommands.Next,
  daily: listWithCommands.Daily,
  missions: listWithCommands.Missions,
  agency: listWithCommands.Agency,
};
class Bot extends Client {
  constructor() {
    super({
      intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
    });
  }
  public start(): void {
    super.login(settings.CLIENT_TOKEN);
    super.on("ready", async (client) => {
      if (client.isReady()) {
        console.log(`Bot ready status: ${client.isReady()}`);
        const commandList: any[] = [];
        const commandNames: string[] = Object.keys(commands);
        for (const commandKeys of commandNames) {
          const command: Command = new commands[commandKeys]();
          commandList.push(
            new SlashCommandBuilder()
              .setName(command.name)
              .setDescription(command.description)
              .addStringOption((option: any) => option.setName("agency").setDescription("The user"))
          );
          commandList.map((command) => command.toJSON());
        }
        (async () => {
          try {
            console.log("Started refreshing application (/) commands.");

            await rest.put(Routes.applicationGuildCommands(settings.CLIENT_ID, settings.GUILD_ID), {
              body: commandList,
            });

            console.log("Successfully reloaded application (/) commands.");
          } catch (error) {
            console.error(error);
          }
        })();
      }
    });
    super.on("interactionCreate", async (interaction: DiscordJS.Interaction) => {
      if (interaction.isCommand()) {
        this.onCommandInteraction(interaction);
      } else if (interaction.isButton()) {
        this.onButtonInteraction(interaction);
      }
    });
    super.on("error", (error: Error) => {
      console.error(error);
    });
  }

  private async onButtonInteraction(interaction: ButtonInteraction) {
    const { customId } = interaction;
    //console.log(interaction.message.interaction?.commandName, customId);
  }

  private async onCommandInteraction(interaction: CommandInteraction) {
    const { commandName, options } = interaction;
    const c: typeof Command = commands[commandName];
    if (c) {
      new c().execute(interaction, options);
    }
  }
}

const client: Bot = new Bot();
client.start();
export default client;
/*
{
            name: command.name,
            description: command.description,
            options: [
              {
                name: command.agencyOption,
                description: command.agencyDescriptionOption,
                type: DiscordJS.Constants.ApplicationCommandOptionTypes.STRING,
              },
            ],
          }
          new SlashCommandBuilder()
              .setName(command.name)
              .setDescription(command.description)
              .addStringOption((option: any) => {
                option.setName("agency").setDescription("The user");
                console.log(option);
              })*/
