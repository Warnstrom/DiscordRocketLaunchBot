export const log = (...log: any): void => {
  console.info("[INFO] - ", new Date().toISOString(), log);
};

export const error = (...error: any): void => {
  console.error("[ERROR] - ", new Date().toISOString(), error);
};
