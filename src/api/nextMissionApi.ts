import axios, { AxiosResponse } from "axios";
import { NextType } from "../interfaces/next";
import { DailyPicture } from "../interfaces/daily";
import settings from "../settings";
import { SpaceAgency } from "../interfaces/agency";
import { log } from "../utils/logger";

const instance = axios.create({
  baseURL: "https://lldev.thespacedevs.com/2.2.0/",
});

const responseBody = (response: AxiosResponse) => response.data;

const requests = {
  getMission: (url: string) => instance.get(url).then(responseBody),
  getNASA: (url: string) => instance.get(url).then(responseBody),
  getAgency: (url: string) => instance.get(url).then(responseBody),
};

export const daily = {
  apod: async (): Promise<DailyPicture> => {
    return await requests.getNASA(`planetary/apod?api_key=${settings.NASA_API_TOKEN}&concent_tags=True`);
  },
};

export const agency = {
  info: async (spaceAgency: string | null): Promise<SpaceAgency> => {
    console.log(spaceAgency);
    return (await requests.getAgency("agencies/?search=" + `${spaceAgency}`)).results[0];
  },
};

export const mission = {
  next: async (spaceAgency: string | null): Promise<NextType> => {
    const result = (
      await requests.getMission(
        !spaceAgency ? "launch/upcoming/?limit=1&offset=1%22" : "launch/upcoming/?search=" + `${spaceAgency}`
      )
    ).results;
    log(result)
    if (result.length) {
      return result[0];
    } else {
      throw new Error("No upcoming launches");
    }
  },
  week: async (spaceAgency: string | null): Promise<NextType[]> => {
    return (
      await requests.getMission(
        !spaceAgency ? "launch/upcoming/?limit=7&offset=7%22" : "launch/upcoming/?search=" + `${spaceAgency}`
      )
    ).results;
  },
  all: async (spaceAgency: string): Promise<NextType[]> => {
    return (
      await requests.getMission(!spaceAgency ? "launch/upcoming/" : "launch/upcoming/?search=" + `${spaceAgency}`)
    ).results;
  },
  limit: async (spaceAgency?: string, limit?: number): Promise<NextType[]> => {
    return (
      await requests.getMission(!spaceAgency ? "launch/upcoming/?limit="+`${limit}` : "launch/upcoming/?search=" + `${spaceAgency}`)
    ).results;
  },
};