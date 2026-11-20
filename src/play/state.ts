/** What the "last run" card shows. Lives as play.json on the output branch. */
export interface PlayState {
  runs: number;
  last?: {
    user: string;
    command: string;
    output: string[];
    ok: boolean;
    at: string;
    issue: number;
  };
}

const emptyPlay: PlayState = { runs: 0 };

export const parsePlayState = (raw: string | undefined): PlayState => {
  if (!raw) return emptyPlay;
  try {
    const s = JSON.parse(raw) as PlayState;
    return typeof s.runs === "number" ? s : emptyPlay;
  } catch {
    return emptyPlay;
  }
};
