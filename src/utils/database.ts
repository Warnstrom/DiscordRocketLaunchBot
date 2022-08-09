import settings from "../settings";
import * as mongoDB from "mongodb";
import { error, log } from "./logger";
import { NextType } from "../interfaces/next";
import { Guild } from "discord.js";

type GuildType = {
  guildId: string;
  announceChannel: string;
  announceRole: string;
  eventLimit: number;
};

export const collections: { guilds?: mongoDB.Collection<any>; launches?: mongoDB.Collection<any> } = {};
const client: mongoDB.MongoClient = new mongoDB.MongoClient(settings.DATABASE.URL, {
  serverApi: mongoDB.ServerApiVersion.v1,
});
export const connectToDatabase = async () => {
  // Create a new MongoDB client with the connection string from settings.ts

  // Connect to the cluster
  try {
    await client.connect();
    log("Connected to MongoDB");
  } catch (e) {
    error(e);
    await client.close();
  }
  // Connect to the database with the name specified in settings.ts
  const db = client.db(settings.DATABASE.NAME);

  // Connect to the collection with the specific name from settings.ts, found in the database previously specified
  const guildsCollection = db.collection<GuildType>(settings.DATABASE.GUILDS_COLLECTION_NAME);
  const launchesCollection = db.collection<any>(settings.DATABASE.LAUNCHES_COLLECTION_NAME);

  collections.guilds = guildsCollection;
  collections.launches = launchesCollection;
};

export const API = {
  guild: {
    getGuilds: async () => {
      try {
        const guilds: any[] | undefined = await collections.guilds?.find({}).toArray();
      } catch (e) {
        error(e);
      }
    },
    findGuild: async (guildId: string) => {
      try {
        const result = await collections.guilds?.findOne({ guildId: guildId });
        return result;
      } catch (e) {
        error(e);
      }
    },
    deleteOne: async (guild: Guild) => {
      try {
        const result = await collections.guilds?.deleteOne({ guildId: guild.id });
      } catch (e) {
        error(e);
      }
    },
    insertMany: async (guild: any) => {
      log(guild);
      try {
        const result = await collections.guilds?.updateMany({ guildId: guild.id }, { $setOnInsert: guild }, { upsert: true });
      } catch (e) {
        error(e);
      }
    },
    updateMany: async (guilds: any) => {
      log(guilds);
      try {
        const result: mongoDB.Document | mongoDB.UpdateResult | undefined = await collections.guilds?.updateMany(guilds, { upsert: true });
      } catch (e) {
        error(e);
      }
    },
    addEventChannel: async (eventChannel: any) => {
      try {
        const result: Promise<mongoDB.UpdateResult> | undefined = collections.guilds?.updateOne(
          { guildId: eventChannel.guildId },
          { $set: { announceChannel: eventChannel.eventChannelId } }
        );
      } catch (e) {
        error(e);
      }
    },
    addEventRole: async (eventRole: any) => {
      try {
        const result: Promise<mongoDB.UpdateResult> | undefined = collections.guilds?.updateOne(
          { guildId: eventRole.guildId },
          { $set: { announceRole: eventRole.eventRoleId } }
        );
      } catch (e) {
        error(e);
      }
    },
    addEventLimit: async (eventLimit: any) => {
      try {
        const result: Promise<mongoDB.UpdateResult> | undefined = collections.guilds?.updateOne(
          { guildId: eventLimit.guildId },
          { $set: { eventLimit: eventLimit.limit } }
        );
      } catch (e) {
        error(e);
      }
    },
  },

  launch: {
    add: async (launches: any) => {
      try {
        await collections.launches?.insertMany(launches);
      } catch (e) {
        error(e);
      }
    },
    delete: async (launchId: any) => {
      try {
        const result = await collections.launches?.deleteOne({ id: launchId });
      } catch (e) {
        error(e);
      }
    },
    updateLaunches: async (launches: any) => {
      try {
        //const result = await collections.launches?.updateMany(launches, { $set: launches }, { upsert: true });
        const result = await collections.launches?.bulkWrite(
          launches.map((d: any) =>
            //log(d),
            ({
              updateOne: {
                filter: { last_updated: d.last_updated },
                replacement: { d },
              },
            })
          )
        );
      } catch (e) {
        error(e);
      }
    },
    find: async () => {
      try {
        return await collections.launches?.find({}).toArray();
      } catch (e) {
        error(e);
      }
    },
    findMany: async (launchLimit: number): Promise<NextType[] | undefined> => {
      try {
        if (collections.launches) {
          return await collections.launches.find({}).limit(launchLimit).toArray();
        }
      } catch (e) {
        error(e);
      }
    },
  },
};
