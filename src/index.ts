import settings from "./settings";
import { ButtonInteraction, Client, CommandInteraction, Guild, Intents, Interaction, TextChannel } from "discord.js";
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

const launchThreads = new Map<string, { threadName: string | null; threadId: string | null }>();
class Bot extends Client {
  constructor() {
    super({
      intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
      partials: ["MESSAGE", "CHANNEL"],
    });
    connectToDatabase();
    cron.schedule("*/5 * * * *", async () => {
      this.updateLaunches();
      //this.updateEventData();
      const guilds: Guild[] = client.guilds.cache.map((guild) => guild);
      guilds.map(async (guild) => {
        let t: Guild = guild;
        const events = await guild.scheduledEvents.fetch();
        events.map((event) => {
          log(
            event,
            new Date(),
            `hours: ${instadate.differenceInHours(new Date(), event.scheduledStartAt)}`,
            `minutes: ${instadate.differenceInMinutes(new Date(), event.scheduledStartAt)}`
          );

          const timeDifferenceInMinutes = instadate.differenceInMinutes(new Date(), event.scheduledStartAt);
          const timeDifferenceInHours = instadate.differenceInHours(new Date(), event.scheduledStartAt);
          const sameDayCheck = instadate.differenceInMinutes(new Date(), event.scheduledStartAt);
          if (timeDifferenceInHours <= 24 && timeDifferenceInHours >= 0) {
            API.guild.findOne(event.guildId).then(async (guild) => {
              if (guild && event.creator?.username) {
                if (timeDifferenceInHours <= 1 && timeDifferenceInHours >= 0) {
                  const thread = launchThreads.get(event.creator.username);
                  if (thread?.threadId) {
                    const activeThread = (await t.channels.fetchActiveThreads()).threads.get(thread?.threadId);
                    activeThread?.send("");
                  }
                } else {
                  //const launchDate: number = Math.floor(new Date(event.scheduledStartAt).getTime() / 1000);
                  const channel: string = guild.announceChannel;
                  const role: string = guild.announceRole;
                  const textChannel: TextChannel = t.channels.cache.get(channel) as TextChannel;
                  if (!(launchThreads.get(event.creator.username)?.threadName === event.name)) {
                    let threadId: string | null = null;
                    textChannel.send(`${role}`);
                    new commands["next"]().execute(null, null, channel);
                    (t.channels.cache.get(channel) as TextChannel).threads
                      .create({
                        name: event.name,
                        autoArchiveDuration: 1440,
                        reason: event.creator.username,
                      })
                      .then((thread) => {
                        threadId = thread.id;
                      });
                    launchThreads.set(event.creator.username, { threadName: event.name, threadId: threadId });
                  } else {
                    log(event.name, "thread exists");
                  }
                }
              }
            });
          }
        });
      });
    });
  }
  public async start(): Promise<void> {
    try {
      await super.login(settings.CLIENT_TOKEN);
  
      super.on("guildCreate", this.onGuildCreate);
      super.on("guildDelete", this.onGuildDelete);
      super.on("ready", this.onReady);
      super.on("interactionCreate", this.onInteractionCreate);
      super.on("error", this.onError);
  
      log("Bot is now online and ready.");
    } catch (error) {
      console.error("An error occurred during bot startup:", error);
    }
  }
  
  private onGuildCreate = async (guild: Guild): Promise<void> => {
    await API.guild.insert({ guildId: guild.id, announceChannel: null, announceRole: null, eventLimit: 0 });
  };
  
  private onGuildDelete = async (guild: Guild): Promise<void> => {
    await API.guild.delete(guild);
  };
  
  private onReady = async (): Promise<void> => {
    try {
      if (this.isReady()) {
        const commandList: any[] = [];
        const commandNames: string[] = Object.keys(commands);
  
        for (const commandKey of commandNames) {
          const command: Command = new commands[commandKey]();
          if (!command.disabled) {
            const slashCommand = command.slashCommand();
            commandList.push(slashCommand);
          }
        }
  
        log("Started refreshing application (/) commands.");
  
        await rest.put(Routes.applicationCommands(settings.CLIENT_ID), {
          body: commandList,
        });
  
        log("Successfully reloaded application (/) commands.");
      }
    } catch (error: any) {
      console.error("An error occurred during command reload:", error);
    }
  };
  
  private onInteractionCreate = async (interaction: Interaction): Promise<void> => {
    try {
      if (interaction.isCommand()) {
        await this.onCommandInteraction(interaction);
      } else if (interaction.isButton()) {
        await this.onButtonInteraction(interaction);
      } else {
        throw new Error("Unsupported interaction type.");
      }
    } catch (error: any) {
      console.error("An error occurred during interaction processing:", error);
    }
  };
  
  private onError = (error: Error): void => {
    console.error("An error occurred:", error);
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
  private async updateLaunches() {
    const result: any[] | undefined = await API.launch.find();
    const upcomingLaunch: Promise<NextType[]> = mission.limit("", 50);
    if (result?.length === 0) {
      // if the database has no launches, fill it
      upcomingLaunch.then(async (value) => {
        API.launch.insert(value);
      });
    } else {
      if (result) {
        result.map((launch) => {
          API.launch.delete(launch.id);
        });
        upcomingLaunch.then(async (value) => {
          API.launch.insert(value);
        });
      }
    }
  }
  }

const client: Bot = new Bot();
client.start();
export default client;