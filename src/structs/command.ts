import { CacheType, CommandInteraction, CommandInteractionOptionResolver } from 'discord.js';
export default class Command {
	public readonly name: string | undefined
	public readonly description: string | undefined
	readonly agencyOption?: string | undefined;
	readonly agencyDescriptionOption?: string | undefined;
	async execute(interaction: CommandInteraction, options: Omit<CommandInteractionOptionResolver<CacheType>, "getMessage" | "getFocused">) { };
}