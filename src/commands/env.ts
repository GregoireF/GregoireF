import { writeFileSync } from "node:fs";
import config from "../../profile.config";

export { config };
export const REPO = `${config.login}/${config.login}`;

export const env = (name: string): string => {
  const v = process.env[name];
  if (!v) throw new Error(`missing env ${name}`);
  return v;
};

export const log = (msg: string) => console.log(msg);

/** Appends to the workflow's job summary when running in GitHub Actions. */
export const summary = (md: string) => {
  const file = process.env.GITHUB_STEP_SUMMARY;
  if (file) writeFileSync(file, `${md}\n`, { flag: "a" });
};
