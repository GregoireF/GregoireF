import type { ProfileConfig } from "../config";
import type { GithubData } from "../data/github";
import type { Wakatime } from "../data/wakatime";
import type { HeroCapture } from "../hero/capture";
import type { PlayState } from "../play/state";
import type { Theme } from "../svg/theme";

export interface Ctx {
  config: ProfileConfig;
  data: GithubData;
  waka?: Wakatime;
  play: PlayState;
  hero: HeroCapture;
  now: Date;
}

/**
 * A card renders the same content for each theme. `K` names the parts of the
 * context it reads, so a card can be drawn without the rest (the play card is
 * redrawn after each visitor run without fetching anything from GitHub).
 */
export type Card<K extends keyof Ctx = keyof Ctx> = (t: Theme, ctx: Pick<Ctx, K>) => string;
