import settings from "./settings";
import { ButtonInteraction, Client, CommandInteraction, GuildScheduledEventEditOptions, Intents, Interaction } from "discord.js";
import Command from "./structs/command";
import * as commandList from "./commands/index";
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";
import { API, connectToDatabase } from "./utils/database";
import { mission } from "./api/nextMissionApi";
import { NextType } from "./interfaces/next";
import { helpers } from "./utils/helpers";
import { events } from "./utils/event";
import { log } from "./utils/logger";
import instadate from "instadate";
const cron = require("node-cron");

const rest = new REST({ version: "10" }).setToken(settings.CLIENT_TOKEN);
const commands: { [key: string]: typeof Command } = {
  next: commandList.Next,
  daily: commandList.Daily,
  missions: commandList.Missions,
  agency: commandList.Agency,
  seteventchannel: commandList.SetEventChannel,
  seteventrole: commandList.SetEventRole,
  seteventlimit: commandList.SetEventLimit,
};
class Bot extends Client {
  constructor() {
    super({
      intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
      partials: ["MESSAGE", "CHANNEL"],
    });
    connectToDatabase();
    cron.schedule("*/5 * * * *", async () => {
      const result = await API.launch.find();
      const upcomingLaunch = mission.limit("", 50);
      if (result?.length === 0) {
        // if the database has no launches, fill it
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
          });
        }
      }
      const guilds = client.guilds.cache.map((guild) => guild);
      guilds.map(async (guild) => {
        guild.scheduledEvents.cache.map((event) => {
          log(event.scheduledStartAt, new Date(), instadate.differenceInHours(new Date(), event.scheduledStartAt));
          const anHourTimeDifference = instadate.differenceInMinutes(new Date(), event.scheduledStartAt);
          if (anHourTimeDifference <= 60 && anHourTimeDifference >= 0) {
            API.guild.findGuild(event.guildId).then((guild) => {
              if (guild) {
                const channel = guild.announceChannel;
                const role = guild.announceRole;
                log(channel, role);
              }
            });
          }
        });
      });
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
        //events.deleteAll();
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
    if (!result || result?.length === 0) {
      mission.limit("", 50).then(async (value) => {
        await API.launch.add(value);
      });
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
