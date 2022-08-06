import settings from "./settings";
import { ButtonInteraction, Client, CommandInteraction, Intents, Interaction } from "discord.js";
import Command from "./structs/command";
import * as commandList from "./commands/index";
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";
import { log } from "./utils/logger";
import { mission } from "./api/nextMissionApi";
import { API, connectToDatabase } from "./utils/database";
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
    cron.schedule("*/1 * * * *", async () => {
      /* const upcomingLaunch = mission.limit("", 50);
      const result = await API.launch.find();
     if (result?.length != 0) {
        upcomingLaunch.then(async (value) => {
          await API.launch.add(value);
        });
      } else {
        for (const launches of await upcomingLaunch) {
          await API.launch.delete(launches.id);
          this.addDiscordEvents(launches);
        }
      }*/
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
        } catch (error) {
          console.error(error);
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
  private async addDiscordEvents(launches: any) {
    try {
      const guilds = client.guilds.cache.map((guild) => guild);

      for (const guild of guilds) {
        let listOfChannels = guild.channels.cache.map((channels) => {
          if (channels.name === "launch") {
            return channels;
            //return { guildId: channels.guildId, channelId: channels.id };
          }
        });
        /*
      Delete all events from the event list for each guild
      guild.scheduledEvents.cache.map((event) => event.delete());
      */
        //Add launch events to Discord channels
        const end_window = new Date(launches.window_end);
        const start_window = new Date(launches.window_start);
        log(start_window);
        const dateCheck = launches.window_end === launches.window_start;
        /* guild.scheduledEvents.create({
          name: launches.name,
          scheduledStartTime: start_window,
          scheduledEndTime: dateCheck ? end_window.setDate(end_window.getDate() + 1) : new Date(launches.window_end),
          privacyLevel: "GUILD_ONLY",
          entityType: "EXTERNAL",
          description: launches.mission?.description,
          entityMetadata: { location: "here" },
        });
        guild.scheduledEvents.cache.map((event) => {
          guild.scheduledEvents.edit(event, {
            name: launches.id,
          });
          log(event);
        });*/
      }
    } catch (e) {
      log(e);
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
