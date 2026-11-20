export interface Wakatime {
  totalSeconds: number;
  dailyAverage: number;
  languages: { name: string; percent: number }[];
}

/** Last 30 days from WakaTime. Returns undefined without a key or on any API trouble. */
export const fetchWakatime = async (apiKey: string | undefined): Promise<Wakatime | undefined> => {
  if (!apiKey) return undefined;
  try {
    const res = await fetch("https://wakatime.com/api/v1/users/current/stats/last_30_days", {
      headers: { authorization: `Basic ${Buffer.from(apiKey).toString("base64")}` },
    });
    if (!res.ok) return undefined;
    const { data } = (await res.json()) as {
      data: { total_seconds: number; daily_average: number; languages: { name: string; percent: number }[] };
    };
    if (!data?.total_seconds) return undefined;
    return {
      totalSeconds: data.total_seconds,
      dailyAverage: data.daily_average,
      languages: data.languages.filter((l) => l.percent >= 1).slice(0, 6),
    };
  } catch {
    return undefined;
  }
};
