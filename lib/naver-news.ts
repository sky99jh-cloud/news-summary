export type DatePreset = "none" | "today" | "week";

export type NaverNewsItem = {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  pubDateMs: number;
};

type NaverNewsApiItem = {
  title: string;
  description: string;
  link: string;
  pubDate: string;
};

type NaverNewsApiResponse = {
  items?: NaverNewsApiItem[];
  total?: number;
  start?: number;
  display?: number;
};

const NAVER_NEWS_URL = "https://openapi.naver.com/v1/search/news.json";

function stripHtml(input: string): string {
  return input
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function parsePubDateMs(pubDate: string): number {
  const ms = Date.parse(pubDate);
  return Number.isFinite(ms) ? ms : 0;
}

function normalizeItem(raw: NaverNewsApiItem): NaverNewsItem {
  const pubDateMs = parsePubDateMs(raw.pubDate);
  return {
    title: stripHtml(raw.title),
    description: stripHtml(raw.description),
    link: raw.link,
    pubDate: raw.pubDate,
    pubDateMs,
  };
}

/** 한국 시간 기준 달력 날짜 (년·월·일) */
function getKstYmd(d: Date): { y: number; m: number; day: number } {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = fmt.formatToParts(d);
  const y = Number(parts.find((p) => p.type === "year")?.value);
  const m = Number(parts.find((p) => p.type === "month")?.value);
  const day = Number(parts.find((p) => p.type === "day")?.value);
  return { y, m, day };
}

/** 해당 KST 달력 날짜의 00:00 (KST) 시각을 UTC ms로 */
function kstMidnightUtcMs(y: number, m: number, day: number): number {
  return Date.UTC(y, m - 1, day, -9, 0, 0, 0);
}

function startOfTodayKst(now: Date): number {
  const { y, m, day } = getKstYmd(now);
  return kstMidnightUtcMs(y, m, day);
}

/** KST 기준 이번 주 월요일 00:00 */
function startOfWeekKst(now: Date): number {
  const { y, m, day } = getKstYmd(now);
  const todayMidnight = kstMidnightUtcMs(y, m, day);
  const weekdayShort = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    weekday: "short",
  }).format(new Date(todayMidnight + 12 * 60 * 60 * 1000));
  const orderMon0: Record<string, number> = {
    Mon: 0,
    Tue: 1,
    Wed: 2,
    Thu: 3,
    Fri: 4,
    Sat: 5,
    Sun: 6,
  };
  const dow = orderMon0[weekdayShort] ?? 0;
  return todayMidnight - dow * 24 * 60 * 60 * 1000;
}

export function filterByDatePreset(
  items: NaverNewsItem[],
  preset: DatePreset,
  now: Date = new Date()
): NaverNewsItem[] {
  if (preset === "none") return items;

  const endMs = now.getTime();
  const startMs =
    preset === "today" ? startOfTodayKst(now) : startOfWeekKst(now);

  return items.filter((it) => it.pubDateMs >= startMs && it.pubDateMs <= endMs);
}

export function buildSearchQuery(keyword: string | undefined, preset: DatePreset): string {
  const k = (keyword ?? "").trim();
  if (k) return k;
  if (preset === "today") return "주요뉴스";
  if (preset === "week") return "주요뉴스";
  return "뉴스";
}

type FetchNewsParams = {
  clientId: string;
  clientSecret: string;
  query: string;
  displayPerPage?: number;
  maxPages?: number;
};

export async function fetchNaverNewsPages({
  clientId,
  clientSecret,
  query,
  displayPerPage = 10,
  maxPages = 5,
}: FetchNewsParams): Promise<NaverNewsItem[]> {
  const collected: NaverNewsItem[] = [];
  const seen = new Set<string>();

  for (let page = 0; page < maxPages; page++) {
    const start = page * displayPerPage + 1;
    const url = new URL(NAVER_NEWS_URL);
    url.searchParams.set("query", query);
    url.searchParams.set("display", String(displayPerPage));
    url.searchParams.set("start", String(start));
    url.searchParams.set("sort", "date");

    const res = await fetch(url.toString(), {
      headers: {
        "X-Naver-Client-Id": clientId,
        "X-Naver-Client-Secret": clientSecret,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`네이버 뉴스 API 오류 (${res.status}): ${text.slice(0, 200)}`);
    }

    const data = (await res.json()) as NaverNewsApiResponse;
    const items = data.items ?? [];
    if (items.length === 0) break;

    for (const raw of items) {
      const n = normalizeItem(raw);
      const key = n.link || `${n.title}-${n.pubDate}`;
      if (seen.has(key)) continue;
      seen.add(key);
      collected.push(n);
    }

    if (items.length < displayPerPage) break;
  }

  return collected;
}
