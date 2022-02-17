import schedule from 'node-schedule';

export interface ScheduleType {
	option: string;
	name: string;
	scheduleTime: schedule.RecurrenceRule;
}