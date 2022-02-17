export interface NextType {
	name: string;
	status?: {
		name: string;
		abbrev: string;
	}
	window_end: string;
	window_start: string;
	launch_service_provider?: {
		name?: string;
		type: string;
	}
	rocket?: {
		configuration: {
			name: string;
			country_code: string;
		}
	}
	mission?: {
		name: string;
		description: string;
		type: string;
	}
	pad?: {
		name: string;
		location: {
			name: string;
			country_code: string;
		}
	}
	webcast: boolean | string;
	image: string;
	infographic: string;
};

