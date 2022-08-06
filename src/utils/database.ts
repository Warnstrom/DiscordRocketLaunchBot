import settings from "../settings";
import * as mongoDB from "mongodb";
import { error, log } from "./logger";
import { NextType } from "../interfaces/next";
import { Guild } from "discord.js";

export const collections: { guilds?: mongoDB.Collection<any>; launches?: mongoDB.Collection<any> } = {};

export const connectToDatabase = async () => {
  // Create a new MongoDB client with the connection string from settings.ts
  const client: mongoDB.MongoClient = new mongoDB.MongoClient(settings.DATABASE.URL, {
    serverApi: mongoDB.ServerApiVersion.v1,
  });

  // Connect to the cluster
  try {
    await client.connect();
    log("Connected to MongoDB");
  } catch (e) {
    error(e);
  }
  // Connect to the database with the name specified in settings.ts
  const db = client.db(settings.DATABASE.NAME);

  // Connect to the collection with the specific name from settings.ts, found in the database previously specified
  const guildsCollection = db.collection<any>(settings.DATABASE.GUILDS_COLLECTION_NAME);
  const launchesCollection = db.collection<any>(settings.DATABASE.LAUNCHES_COLLECTION_NAME);

  collections.guilds = guildsCollection;
  collections.launches = launchesCollection;
};

export const getGuilds = async () => {
  try {
    const guilds: any[] | undefined = await collections.guilds?.find({}).toArray();
    log(guilds);
  } catch (e) {
    error(e);
  }
};
export const API = {
  guild: {
    findGuild: async (guildId: string) => {
      try {
        const result = await collections.guilds?.findOne({ guildId: guildId });
        log(result);
        return result;
      } catch (e) {
        error(e);
      }
    },
    deleteOne: async (guild: Guild) => {
      try {
        const result = await collections.guilds?.deleteOne({ guildId: guild.id });
        log(result);
      } catch (e) {
        error(e);
      }
    },
    insertMany: async (guild: any) => {
      log(guild);
      try {
        const result = await collections.guilds?.updateMany({ guildId: guild.id }, { $setOnInsert: guild }, { upsert: true });
        log(result);
      } catch (e) {
        error(e);
      }
    },
    updateMany: async (guilds: any) => {
      log(guilds);
      try {
        const result: mongoDB.Document | mongoDB.UpdateResult | undefined = await collections.guilds?.updateMany(guilds, { upsert: true });
        log(result);
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
        log(result);
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
        log(result);
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
        log(result);
      } catch (e) {
        error(e);
      }
    },
  },

  launch: {
    add: async (launches: any) => {
      try {
        const result: mongoDB.InsertManyResult<any> | undefined = await collections.launches?.insertMany(launches);
      } catch (e) {
        error(e);
      }
    },
    delete: async (launchId: any) => {
      try {
        const result = await collections.launches?.deleteOne({ id: launchId });
        log(result);
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
        log(result);
      } catch (e) {
        error(e);
      }
    },
    find: async () => {
      try {
        const listOfLaunches: any[] | undefined = await collections.launches?.find({}).toArray();
        log(listOfLaunches);
        return listOfLaunches;
      } catch (e) {
        error(e);
      }
    },
  },
};
