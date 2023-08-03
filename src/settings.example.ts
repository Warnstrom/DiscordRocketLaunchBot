import { Settings } from "./interfaces/settings";
/*
  Don't change the naming of Settings properties
  Only the values should be changed if you're using an API or Database
*/
const settings: Settings = {
  GUILD_ID: "YOUR GUILD ID",
  CLIENT_ID: "YOUR CLIENT ID",
  CLIENT_TOKEN: "YOUR CLIENT TOKEN",
  LAUNCH_API_TOKEN: "EXTERNAL API TOKEN",
  NASA_API_TOKEN: "YOUR NASA API TOKEN",
  DATABASE: {
    URL: "DATABASE URL",
    NAME: "DATABASE NAME",
    PASSWORD: "DATABASE PASSWORD",
    LAUNCHES_COLLECTION_NAME: "LAUNCH COLLECTION NAME",
    GUILDS_COLLECTION_NAME: "GUILDS COLLECTION NAME",
  },
};

export default settings;
