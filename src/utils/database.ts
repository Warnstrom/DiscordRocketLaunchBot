import settings from "../settings";
import * as mongoDB from "mongodb";
import { error, log } from "./logger";
import { NextType } from "../interfaces/next";
import { Guild } from "discord.js";
import { AnyBulkWriteOperation, Collection } from 'mongodb'; 
import { UpdateOneModel } from 'mongodb';
import { DatabaseFunctions, GuildFunctions,LaunchFunctions,APIType,Collections } from "../interfaces/database";

export type GuildType =
  | {
      guildId: string;
      announceChannel: string;
      announceRole: string;
      eventLimit: number;
    }
  | undefined;

  export const collections: Collections = {};
const client: mongoDB.MongoClient = new mongoDB.MongoClient(settings.DATABASE.URL, {
  serverApi: mongoDB.ServerApiVersion.v1,
});

export const connectToDatabase = async () => {
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
  const guildsCollection = db.collection<any>(settings.DATABASE.GUILDS_COLLECTION_NAME);
  const launchesCollection = db.collection<any>(settings.DATABASE.LAUNCHES_COLLECTION_NAME);
  
  (collections as any).guilds = guildsCollection;
  (collections as any).launches = launchesCollection;
};


const createDatabaseFunctions = (collection: string): DatabaseFunctions => {
  return {
    get: async (filter) => {
      try {
        if (filter) {
          return collections[collection]?.find(filter).toArray();
        } else {
          return collections[collection]?.find({}).toArray();
        }
      } catch (e) {
        error(e);
      }
    },
    find: async (filter) => {
      try {
        if (filter) {
          return collections[collection]?.find(filter).toArray();
        } else {
          return collections[collection]?.find({}).toArray();
        }
      } catch (e) {
        error(e);
      }
    },
    findOne: async (filter) => {
      try {
        return collections[collection]?.findOne(filter);
      } catch (e) {
        error(e);
      }
    },
    insert: async (data) => {
      try {
        await collections[collection]?.insertMany(data);
      } catch (e) {
        error(e);
      }
    },
    update: async (filter, data) => {
      try {
        await collections[collection]?.updateMany(filter, { $set: data });
      } catch (e) {
        error(e);
      }
    },
    delete: async (filter) => {
      try {
        await collections[collection]?.deleteMany(filter);
      } catch (e) {
        error(e);
      }
    },
  };
};

export const API: APIType = {
  guild: {
    ...createDatabaseFunctions('guilds'),
    addEventChannel: async (eventChannel) => {
      try {
        await collections.guilds?.updateOne(
          { guildId: eventChannel.guildId },
          { $set: { announceChannel: eventChannel.eventChannelId } }
        );
      } catch (e) {
        error(e);
      }
    },
    addEventRole: async (eventRole) => {
      try {
        await collections.guilds?.updateOne(
          { guildId: eventRole.guildId },
          { $set: { announceRole: eventRole.eventRoleId } }
        );
      } catch (e) {
        error(e);
      }
    },
    addEventLimit: async (eventLimit) => {
      try {
        await collections.guilds?.updateOne(
          { guildId: eventLimit.guildId },
          { $set: { eventLimit: eventLimit.limit } }
        );
      } catch (e) {
        error(e);
      }
    },
  },
  launch: {
    ...createDatabaseFunctions('launches'),
    updateLaunches: async (launches) => {
      try {
        const bulkOps: AnyBulkWriteOperation<any>[] = launches.map((d: any) => ({
          updateOne: {
            filter: { last_updated: d.last_updated },
            update: { $set: d },
          },
        }));
        await collections.launches?.bulkWrite(bulkOps);
      } catch (e) {
        error(e);
      }
    },
  },
};