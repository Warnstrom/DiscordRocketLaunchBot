import settings from "../settings";
import * as mongoDB from "mongodb";
import { error, log } from "./logger";

export const collections: { guilds?: mongoDB.Collection<any>; launches?: mongoDB.Collection<any> } = {};

export const connectToDatabase = async () => {
  // Create a new MongoDB client with the connection string from .env
  const client = new mongoDB.MongoClient(settings.DATABASE.DATABASE_URL, {
    serverApi: mongoDB.ServerApiVersion.v1,
  });

  // Connect to the cluster
  await client.connect();

  // Connect to the database with the name specified in .env
  const db = client.db(process.env.DB_NAME);

  // Connect to the collection with the specific name from .env, found in the database previously specified
  const guildsCollection = db.collection<any>(settings.DATABASE.GUILDS_COLLECTION_NAME);
  const launchesCollection = db.collection<any>(settings.DATABASE.LAUNCHES_COLLECTION_NAME);

  // Persist the connection to the Games collection
  collections.guilds = guildsCollection;
  collections.launches = launchesCollection;
  log("Connected to MongoDB");
};

export const getGuilds = async () => {
  try {
    const guilds: any[] | undefined = await collections.guilds?.find({}).toArray();
    log(guilds);
  } catch (e) {
    error(e);
  }
};

export const addGuilds = async (guilds: Array<any>) => {
  log(guilds);
  try {
    const result: mongoDB.InsertManyResult<any> | undefined = await collections.guilds?.insertMany(guilds);
    log(result);
  } catch (e) {
    error(e);
  }
};

export const addLaunches = async (launches: Array<any>) => {
  log(collections.launches);
  try {
    const result: mongoDB.InsertManyResult<any> | undefined = await collections.launches?.insertMany(launches);
    log(result);
  } catch (e) {
    error(e);
  }
};

export const findLaunches = async () => {
  try {
    const listOfLaunches: any[] | undefined = await collections.launches?.find({}).toArray();
    log(listOfLaunches);
    return listOfLaunches;
  } catch (e) {
    error(e);
  }
};
