import client from "..";
import { NextType } from "../interfaces/next";
import instadate from "instadate";
import { API } from "./database";
import { error, log } from "./logger";

export const events = {
  add: async (limit?: number, guildId?: string) => {
    try {
      if (guildId) {
        const guilds = client.guilds.cache.get(guildId);
        const launches: NextType[] | undefined = await API.launch.find("Success");
        if (guilds && launches && limit) {
          //Add launch events to Discord channels
          if ((await guilds.scheduledEvents.fetch()).size === 0 && limit != 0) {
            let i;
            for (i = 0; i < limit; i++) {
              const end_window = new Date(launches[i].window_end);
              const dateCheck = launches[i].window_end === launches[i].net;
              guilds.scheduledEvents.create({
                name: launches[i].name,
                image: launches[i].image,
                scheduledStartTime: launches[i].net,
                scheduledEndTime: dateCheck ? end_window.setDate(end_window.getDate() + 1) : end_window,
                privacyLevel: "GUILD_ONLY",
                entityType: "EXTERNAL",
                description: launches[i].mission?.description,
                entityMetadata: { location: launches[i].webcast_live ? launches[i].vidURLs[0].url : "No stream yet" },
              });
              //(await event).scheduledStartTimestamp = new Date(launches[i].net).getTime();
            }
          } else if ((await guilds.scheduledEvents.fetch()).size < limit) {
            log("Nehe")
            let i;
            for (i = (await guilds.scheduledEvents.fetch()).size; i < limit; i++) {
              const end_window = new Date(launches[i].window_end);
              const dateCheck = launches[i].window_end === launches[i].net;
              guilds.scheduledEvents.create({
                name: launches[i].name,
                image: launches[i].image,
                scheduledStartTime: launches[i].net,
                scheduledEndTime: dateCheck ? end_window.setDate(end_window.getDate() + 1) : end_window,
                privacyLevel: "GUILD_ONLY",
                entityType: "EXTERNAL",
                description: launches[i].mission?.description,
                entityMetadata: { location: launches[i].webcast_live ? launches[i].vidURLs[0].url : "No stream yet" },
              });
              //(await event).scheduledStartTimestamp = new Date(launches[i].net).getTime();
            }
          } else if ((await guilds.scheduledEvents.fetch()).size > limit) {
            log("Jaha")
            events.deleteLimit(limit);
          } else {
            log("Fuck you")
          }
        }
      }
    } catch (e: any) {
      error(e);
    }
  },
  update: async () => {
    try {
      const guilds = client.guilds.cache.map((guild) => guild);
      for (const guild of guilds) {
        if (guild.scheduledEvents.cache.size != 0) {
          const limit = await API.guild.findGuild(guild.id);
          const limitedLaunches: NextType[] | undefined = await API.launch.findMany(limit.eventLimit);
          //Add launch events to Discord channels
          if (limitedLaunches) {
            for (const launch of limitedLaunches) {
              const end_window = new Date(launch.window_end);
              const start_window = new Date(launch.window_start);
              const dateCheck = launch.window_end === launch.window_start;
              guild.scheduledEvents.cache.map((event) => {
                log(new Date(launch.net).getTime() - new Date().getTime());
                if (event.name === launch.name) {
                  guild.scheduledEvents.edit(event, {
                    scheduledStartTime: start_window,
                    scheduledEndTime: dateCheck ? end_window.setDate(end_window.getDate() + 1) : end_window,
                    status: undefined,
                    entityMetadata: { location: launch.webcast_live ? launch.vidURLs[0].url : "No stream yet" },
                  });
                }
              });
            }
          } else {
            log("Didn't find any launches");
          }
        }
      }
    } catch (error: any) {
      error(error);
    }
  },
  deleteLimit: async (limit?: number, guildId?: string) => {
    log(guildId, limit)
    if (guildId && limit) {
      try {
        log(guildId, limit)
        const guilds = client.guilds.cache.get(guildId);
        let i;
        for (i = 0; i < limit; i++) {
          let lastKey = guilds?.scheduledEvents.cache.lastKey();
          log(await guilds?.scheduledEvents.fetch(lastKey));
          if (lastKey) {
            (await guilds?.scheduledEvents.fetch(lastKey))?.delete();
          }
        }
      } catch (e: any) {
        error(e);
      }
    }
  },
  deleteAll: async () => {
    try {
      const guilds = client.guilds.cache.map((guild) => guild);
      if (guilds)
        for (const guild of guilds) {
          guild.scheduledEvents.cache.map((event) => event.delete());
        }
    } catch (e: any) {
      error(e);
    }
  },
};
