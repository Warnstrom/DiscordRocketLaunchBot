import settings from "./settings";
import {
  ButtonInteraction,
  Client,
  CommandInteraction,
  Intents,
  Interaction,
  Message,
} from "discord.js";
import Command from "./structs/command";
import * as listWithCommands from "./commands/index";
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";
import { log } from "./utils/logger";
const rest = new REST({ version: "9" }).setToken(settings.CLIENT_TOKEN);
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
    super.on("ready", async (client): Promise<void> => {
      if (client.isReady()) {
        const commandList: any[] = [];
        const commandNames: string[] = Object.keys(commands);
        for (const commandKeys of commandNames) {
          const command: Command = new commands[commandKeys]();
          const SlashCommand = command.slashCommand();
          commandList.push(SlashCommand);
        }
        (async () => {
          try {
            log("Started refreshing application (/) commands.");
            //Routes.applicationGuildCommands(settings.CLIENT_ID, settings.GUILD_ID
            await rest.put(Routes.applicationCommands(settings.CLIENT_ID), {
              body: commandList,
            });
            log("Successfully reloaded application (/) commands.");
          } catch (error) {
            console.error(error);
          }
        })();
      }
    });
    super.on("interactionCreate", async (interaction: Interaction): Promise<void> => {
      if (!interaction.isCommand() && !interaction.isButton()) {
        throw new Error("No interaction found");
      }
      if (interaction.isCommand()) {
        const { commandName } = interaction;
        this.onCommandInteraction(interaction);
      }
      if (interaction.isButton()) {
        this.onButtonInteraction(interaction);
      }
    });
    super.on("error", (error: Error): void => {
      console.error(error);
    });
  }

  private async onButtonInteraction(interaction: ButtonInteraction): Promise<void> {
    const { customId } = interaction;
  }

  private async onCommandInteraction(interaction: CommandInteraction) {
    const { commandName, options } = interaction;
    const c: typeof Command = commands[commandName];
    if (c) {
      await new c().execute(interaction, options);
    }
  }
}

const client: Bot = new Bot();
client.start();
export default client;
