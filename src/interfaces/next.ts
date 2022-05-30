interface agency {
  id: number;
  url: string;
  name: string;
  type: string;
}
interface ProgramType {
  id: number | null;
  url: string | null;
  name: string | null;
  description: string | null;
  agencies: agency[];
  image_url: string | null;
  start_date: string | null;
  end_date: string | null;
  info_url: string | null;
  wiki_url: string | null;
  mission_patches: Array<any>;
}

export interface NextType {
  id: string;
  url: string;
  slug: string;
  name: string;
  status?: {
    id: number;
    name: string;
    abbrev: string;
    description: string;
  };
  last_updated: string;
  net: string;
  window_end: string;
  window_start: string;
  probability: number | null;
  holdreason: string | null;
  failreason: string | null;
  hashtag: string | null;
  launch_service_provider?: {
    id: number;
    url: string;
    name?: string;
    type: string;
  };
  rocket?: {
    id: number;
    configuration: {
      id: number;
      url: string;
      name: string;
      family: string;
      full_name: string;
      variant: string;
      country_code?: string;
    };
  };
  mission: {
    id: number;
    name: string;
    description: string;
    launch_designator: string | null;
    type: string;
    orbit: {
      id: number;
      name: string;
      abbrev: string;
    };
  } | null;
  pad?: {
    id: number;
    url: string;
    agency_id: number | null;
    name: string;
    info_url: string | null;
    wiki_url: string;
    map_url: string;
    latitude: string;
    longitude: string;
    location: {
      id: number;
      url: string;
      name: string;
      country_code: string;
      map_image: string;
      total_launch_count: number;
      total_landing_count: number;
    };
    map_image: string;
    total_launch_count: number;
  };
  webcast_live: boolean | string;
  image: string;
  infographic: string | null;
  program: Array<ProgramType> | [];
}
