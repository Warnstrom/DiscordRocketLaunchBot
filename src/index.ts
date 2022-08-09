import settings from "./settings";
import { ButtonInteraction, Client, CommandInteraction, GuildScheduledEventEditOptions, Intents, Interaction } from "discord.js";
import Command from "./structs/command";
import * as commandList from "./commands/index";
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";
import { error, log } from "./utils/logger";
import { API, connectToDatabase } from "./utils/database";
import { mission } from "./api/nextMissionApi";
import { NextType } from "./interfaces/next";
const cron = require("node-cron");

const rest = new REST({ version: "10" }).setToken(settings.CLIENT_TOKEN);
export const commands: { [key: string]: typeof Command } = {
  next: commandList.Next,
  daily: commandList.Daily,
  missions: commandList.Missions,
  agency: commandList.Agency,
  addeventchannel: commandList.AddEventChannel,
  addeventrole: commandList.AddEventRole,
  addeventlimit: commandList.AddEventLimit,
};
class Bot extends Client {
  constructor() {
    super({
      intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
      partials: ["MESSAGE", "CHANNEL", "REACTION"],
    });
    connectToDatabase();
    this.fillDatabase();
    cron.schedule("*/10 * * * *", async () => {
      const result = await API.launch.find();
      const upcomingLaunch = mission.limit("", 50);
      if (result?.length === 0) {
        upcomingLaunch.then(async (value) => {
          await API.launch.add(value);
        });
      } else {
        if (result) {
          for (const launches of result) {
            await API.launch.delete(launches.id);
            log("Deleted launch", launches.id);
          }
          upcomingLaunch.then(async (value) => {
            await API.launch.add(value);
            log("Added launches", value.length);
            //await this.editLaunchEvents();
            log("Updated channel launch events");
          });
        }
      }
    });
  }
  public start(): void {
    super.login(settings.CLIENT_TOKEN);
    super.on("guildCreate", async (guild) => {
      await API.guild.insertMany({ guildId: guild.id, announceChannel: null, announceRole: null, eventLimit: 0 });
    });
    super.on("guildDelete", async (guild) => {
      await API.guild.deleteOne(guild);
    });
    super.on("ready", async (client) => {
      if (client.isReady()) {
        await this.addLaunchEvents();
        this.editLaunchEvents();
        const commandList: any[] = [];
        const commandNames: string[] = Object.keys(commands);
        for (const commandKeys of commandNames) {
          const command: Command = new commands[commandKeys]();
          if (!command.disabled) {
            const SlashCommand = command.slashCommand();
            commandList.push(SlashCommand);
          }
        }
        try {
          log("Started refreshing application (/) commands.");
          //Routes.applicationGuildCommands(settings.CLIENT_ID, settings.GUILD_ID
          rest.put(Routes.applicationCommands(settings.CLIENT_ID), {
            body: commandList,
          });

          log("Successfully reloaded application (/) commands.");
        } catch (error: any) {
          error(error);
        }
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

  private async fillDatabase() {
    const result = await API.launch.find();
    if (result?.length === 0) {
      await mission.limit("", 50).then(async (value) => {
        await API.launch.add(value);
      });
    }
  }

  private async editLaunchEvents() {
    try {
      const guilds = client.guilds.cache.map((guild) => guild);
      for (const guild of guilds) {
        if (guild.scheduledEvents.cache.size != 0) {
          const limit = await API.guild.findGuild(guild.id);
          const limitedLaunches: NextType[] | undefined = await API.launch.findMany(limit.eventLimit);
          //Add launch events to Discord channels
          limitedLaunches?.map((launch) => {
            //log(launch.name, guild.id);
            const end_window = new Date(launch.window_end);
            const start_window = new Date(launch.window_start);
            const dateCheck = launch.window_end === launch.window_start;
            const getStatus = (launch: any): any => {
              switch (launch.status.abbrev) {
                case "Success" || "Failure":
                  return "COMPLETED";
                case "TBD" || "TBC":
                  return "SCHEDULED";
                case "Go":
                  return "SCHEDULED";
              }
            };
            log(guild.scheduledEvents.cache.values().next().value);
          });
          guild.scheduledEvents.cache.map((event) => {
            //log(event.name, guild.id);
            /*guild.scheduledEvents.edit(event, {
                name: launch.id,
                scheduledStartTime: start_window,
                scheduledEndTime: dateCheck ? end_window.setDate(end_window.getDate() + 1) : new Date(launch.window_end),
                status: getStatus(launch),
                entityMetadata: { location: launch.webcast_live ? launch.vidURLs[0].url : "No stream yet" },
              });*/
          });
          if (limitedLaunches) {
            for (const launch of limitedLaunches) {
              const end_window = new Date(launch.window_end);
              const start_window = new Date(launch.window_start);
              const dateCheck = launch.window_end === launch.window_start;
              const getStatus = (launch: any): any => {
                switch (launch.status.abbrev) {
                  case "Success" || "Failure":
                    return "COMPLETED";
                  case "TBD" || "TBC":
                    return "SCHEDULED";
                  case "Go":
                    return "SCHEDULED";
                }
              };
            }
          } else {
            log("Didn't find any launches");
          }
        }
      }
    } catch (error: any) {
      error(error);
    }
  }

  private async addLaunchEvents() {
    try {
      const guilds = client.guilds.cache.map((guild) => guild);
      for (const guild of guilds) {
        //guild.scheduledEvents.cache.map((event) => event.delete());
        const guilds = await API.guild.findGuild(guild.id);
        log(guild.scheduledEvents.cache.size, guilds.eventLimit);
        if (guild.scheduledEvents.cache.size === 0 && guilds.eventLimit != 0) {
          const launches: NextType[] | undefined = await API.launch.findMany(guilds.eventLimit);
          //Add launch events to Discord channels
          if (launches) {
            for (const launch of launches) {
              const end_window = new Date(launch.window_end);
              const start_window = new Date(launch.window_start);
              const dateCheck = launch.window_end === launch.window_start;
              guild.scheduledEvents.create({
                name: launch.name,
                scheduledStartTime: start_window,
                image: launch.image,
                scheduledEndTime: dateCheck ? end_window.setDate(end_window.getDate() + 1) : new Date(launch.window_end),
                privacyLevel: "GUILD_ONLY",
                entityType: "EXTERNAL",
                description: launch.mission?.description,
                entityMetadata: { location: launch.webcast_live ? launch.vidURLs[0].url : "No stream yet" },
              });
            }
          } else {
            log("Didn't find any launches");
          }
        } else if (guilds.eventLimit === 0) {
          //Delete all events from the event list for each guild
          guild.scheduledEvents.cache.map((event) => event.delete());
        }
      }
    } catch (e: any) {
      error(e);
    }
  }

  private async onButtonInteraction(interaction: ButtonInteraction): Promise<void> {
    const { customId } = interaction;
    const commandName = customId.split("-")[0];
    const c: typeof Command = commands[commandName];
    if (c) {
      new c().update!(customId);
    }
  }

  private async onCommandInteraction(interaction: CommandInteraction): Promise<void> {
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
