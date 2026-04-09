import { NextResponse } from "next/server";
import {
  buildSearchQuery,
  type DatePreset,
  fetchNaverNewsPages,
  filterByDatePreset,
} from "@/lib/naver-news";
import { analyzeNewsWithOpenAI } from "@/lib/openai-analyze";

export const runtime = "nodejs";

type Body = {
  keyword?: string;
  preset?: DatePreset;
};

function getEnv(name: string): string | undefined {
  const v = process.env[name];
  return v && v.trim() ? v.trim() : undefined;
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "JSON 본문이 필요합니다." }, { status: 400 });
  }

  const preset: DatePreset =
    body.preset === "today" || body.preset === "week" ? body.preset : "none";
  const keyword =
    typeof body.keyword === "string" ? body.keyword : undefined;

  const naverId = getEnv("NAVER_CLIENT_ID");
  const naverSecret = getEnv("NAVER_CLIENT_SECRET");
  const openaiKey = getEnv("OPENAI_API_KEY");
  const model = getEnv("OPENAI_MODEL") ?? "gpt-4o-mini";

  if (!naverId || !naverSecret) {
    return NextResponse.json(
      { error: "NAVER_CLIENT_ID / NAVER_CLIENT_SECRET 환경 변수를 설정하세요." },
      { status: 500 }
    );
  }
  if (!openaiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY 환경 변수를 설정하세요." },
      { status: 500 }
    );
  }

  const query = buildSearchQuery(keyword, preset);

  try {
    const rawItems = await fetchNaverNewsPages({
      clientId: naverId,
      clientSecret: naverSecret,
      query,
      displayPerPage: 10,
      maxPages: preset === "none" ? 3 : 5,
    });

    const filtered = filterByDatePreset(rawItems, preset);
    const toAnalyze = filtered.slice(0, 25);

    const analysis = await analyzeNewsWithOpenAI(openaiKey, model, toAnalyze);

    return NextResponse.json({
      query,
      preset,
      keyword: keyword?.trim() ?? "",
      totalFetched: rawItems.length,
      totalAfterDateFilter: filtered.length,
      analyzedCount: toAnalyze.length,
      articles: toAnalyze.map((a) => ({
        title: a.title,
        description: a.description,
        link: a.link,
        pubDate: a.pubDate,
      })),
      analysis,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "알 수 없는 오류";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
