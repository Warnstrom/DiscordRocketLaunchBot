import settings from "./settings";
import { ButtonInteraction, Client, CommandInteraction, Intents, Interaction, Message } from "discord.js";
import Command from "./structs/command";
import * as commandList from "./commands/index";
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";
import { log } from "./utils/logger";
import { mission } from "./api/nextMissionApi";
import { addGuilds, addLaunches, connectToDatabase } from "./utils/database";

const rest = new REST({ version: "9" }).setToken(settings.CLIENT_TOKEN);
export const commands: { [key: string]: typeof Command } = {
  next: commandList.Next,
  daily: commandList.Daily,
  missions: commandList.Missions,
  agency: commandList.Agency,
};

type LaunchEvent = {
  name: string;
  scheduledStartTime: Date;
  scheduledEndTime: Date;
  privacyLevel: string;
  entityType: string;
  description: string;
  entityMetadata: { location: string };
};

class Bot extends Client {
  constructor() {
    super({
      intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
    });
    connectToDatabase();
  }
  public start(): void {
    super.login(settings.CLIENT_TOKEN);
    super.on("ready", async (client): Promise<void> => {
      if (client.isReady()) {
        const listOfGuilds = client.guilds.cache.map((guild) => guild);
        //await addGuilds(listOfGuildId);
        try {
          const upcomingLaunch = await mission.limit("", 50);
          await addLaunches(upcomingLaunch);
          for (const launches of upcomingLaunch) {
            if (launches.status?.abbrev != "Success") {
              //log(launches.name, launches.status?.abbrev);
              for (const guild of listOfGuilds) {
                let listOfChannels = guild.channels.cache.map((channels) => {
                  if (channels.name === "launch") {
                    return { guildId: channels.guildId, channelId: channels.id };
                  }
                });
                //guild.scheduledEvents.cache.forEach((event)=> guild.scheduledEvents.delete)

                //guild.scheduledEvents.cache

                /*
                const end_window = new Date(launches.window_end);
                const dateCheck = launches.window_end === launches.window_start;
                guild.scheduledEvents.create({
                  name: launches.name,
                  scheduledStartTime: new Date(launches.window_start),
                  scheduledEndTime: dateCheck ? end_window.setDate(end_window.getDate() + 1) : new Date(launches.window_end),
                  privacyLevel: "GUILD_ONLY",
                  entityType: "EXTERNAL",
                  description: launches.mission?.description,
                  entityMetadata: { location: "here" },
                });*/
              }
            }
          }
        } catch (e) {
          log(e);
        }

        const commandList: any[] = [];
        const commandNames: string[] = Object.keys(commands);
        for (const commandKeys of commandNames) {
          const command: Command = new commands[commandKeys]();
          if (!command.disabled) {
            const SlashCommand = command.slashCommand();
            commandList.push(SlashCommand);
          }
        }
        async () => {
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
        };
      }
    });
    super.on("interactionCreate", async (interaction: Interaction): Promise<void> => {
      if (!interaction.isCommand() && !interaction.isButton()) {
        throw new Error("No interaction found");
      }
      if (interaction.isCommand()) {
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
    const commandName = customId.split("-")[0];
    const c: typeof Command = commands[commandName];
    if (c) {
      new c().update!(customId);
    }
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
