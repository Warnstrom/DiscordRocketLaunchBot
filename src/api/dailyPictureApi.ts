import axios, { AxiosResponse } from 'axios';
import { DailyPicture } from '../interfaces/daily';
import settings from '../settings';

const instance = axios.create({
	baseURL: `https://api.nasa.gov/`,
	timeout: 15000,
});

const responseBody = (response: AxiosResponse) => response.data;

const requests = {
	get: (url: string) => instance.get(url).then(responseBody),
};

export const daily = {
	apod: async (): Promise<DailyPicture> => {
		return (await requests.get(`planetary/apod?api_key=${settings.NASA_API_TOKEN}&concept_tags=True`))
	}
};
