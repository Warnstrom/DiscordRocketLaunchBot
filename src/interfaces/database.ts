import { Collection } from 'mongodb'; 

export interface DatabaseFunctions {
    get: (filter?: any) => Promise<any[] | undefined>;
    find: (filter?: any) => Promise<any[] | undefined>;
    findOne: (filter: any) => Promise<any | undefined>;
    insert: (data: any) => Promise<void>;
    update: (filter: any, data: any) => Promise<void>;
    delete: (filter: any) => Promise<void>;
  }
  
export interface GuildFunctions extends DatabaseFunctions {
    addEventChannel: (eventChannel: any) => Promise<void>;
    addEventRole: (eventRole: any) => Promise<void>;
    addEventLimit: (eventLimit: { guildId: string; limit: number }) => Promise<void>;
}
  
export interface LaunchFunctions extends DatabaseFunctions {
    updateLaunches: (launches: any[]) => Promise<void>;
}
  
export interface APIType {
    guild: GuildFunctions;
    launch: LaunchFunctions;
}
  
export interface Collections {
    [key: string]: Collection<any> | undefined;
}