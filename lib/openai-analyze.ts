import OpenAI from "openai";
import type { NaverNewsItem } from "./naver-news";

export type AnalysisResult = {
  summary: string;
  keywords: { term: string; score: number }[];
  sentiment: {
    label: string;
    confidence: number;
    rationale: string;
  };
  categories: {
    name: string;
    relevance: number;
    examples: string[];
  }[];
  trendInsights: string[];
};

function buildArticlesBlock(items: NaverNewsItem[]): string {
  return items
    .map((it, i) => {
      const date = new Date(it.pubDateMs).toISOString();
      return `[${i + 1}] (${date})\n제목: ${it.title}\n요약: ${it.description}`;
    })
    .join("\n\n");
}

const SYSTEM_PROMPT = `당신은 한국어 뉴스 분석가입니다. 입력으로 여러 뉴스 기사의 제목과 짧은 요약만 주어집니다. 본문 전문은 없습니다.
다음 JSON 형식으로만 응답하세요. 다른 텍스트는 넣지 마세요.
스키마:
{
  "summary": "전체 흐름을 2~4문장으로 요약",
  "keywords": [ { "term": "키워드", "score": 0.0~1.0 중요도 } ],
  "sentiment": { "label": "positive|negative|neutral|mixed 중 하나", "confidence": 0.0~1.0, "rationale": "맥락 근거 한국어" },
  "categories": [ { "name": "정치|경제|사회|국제|IT·과학|문화|스포츠|기타 중 선택", "relevance": 0.0~1.0, "examples": ["해당 주제로 보이는 기사 제목 일부"] } ],
  "trendInsights": [ "트렌드/패턴/주목할 점을 한국어 불릿 문자열로 3~6개" ]
}
keywords는 중요도 순으로 최대 12개. categories는 관련 있는 것만 relevance 순으로 최대 6개.`;

export async function analyzeNewsWithOpenAI(
  apiKey: string,
  model: string,
  items: NaverNewsItem[]
): Promise<AnalysisResult> {
  if (items.length === 0) {
    return {
      summary: "분석할 뉴스가 없습니다. 검색어를 바꾸거나 기간 제한을 해제해 보세요.",
      keywords: [],
      sentiment: {
        label: "neutral",
        confidence: 0,
        rationale: "뉴스 항목이 없습니다.",
      },
      categories: [],
      trendInsights: [],
    };
  }

  const client = new OpenAI({ apiKey });
  const userContent = `아래 기사들만 근거로 분석하세요.\n\n${buildArticlesBlock(items)}`;

  const completion = await client.chat.completions.create({
    model,
    temperature: 0.3,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userContent },
    ],
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) {
    throw new Error("OpenAI 응답이 비어 있습니다.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("OpenAI JSON 파싱에 실패했습니다.");
  }

  return normalizeAnalysisResult(parsed);
}

function normalizeAnalysisResult(input: unknown): AnalysisResult {
  if (!input || typeof input !== "object") {
    throw new Error("분석 결과 형식이 올바르지 않습니다.");
  }
  const o = input as Record<string, unknown>;

  const summary = typeof o.summary === "string" ? o.summary : "";

  const keywords: AnalysisResult["keywords"] = [];
  if (Array.isArray(o.keywords)) {
    for (const k of o.keywords) {
      if (!k || typeof k !== "object") continue;
      const kw = k as Record<string, unknown>;
      const term = typeof kw.term === "string" ? kw.term : "";
      const score = typeof kw.score === "number" ? kw.score : 0;
      if (term) keywords.push({ term, score });
    }
  }

  let sentiment: AnalysisResult["sentiment"] = {
    label: "neutral",
    confidence: 0,
    rationale: "",
  };
  if (o.sentiment && typeof o.sentiment === "object") {
    const s = o.sentiment as Record<string, unknown>;
    sentiment = {
      label: typeof s.label === "string" ? s.label : "neutral",
      confidence: typeof s.confidence === "number" ? s.confidence : 0,
      rationale: typeof s.rationale === "string" ? s.rationale : "",
    };
  }

  const categories: AnalysisResult["categories"] = [];
  if (Array.isArray(o.categories)) {
    for (const c of o.categories) {
      if (!c || typeof c !== "object") continue;
      const cat = c as Record<string, unknown>;
      const name = typeof cat.name === "string" ? cat.name : "";
      const relevance =
        typeof cat.relevance === "number" ? cat.relevance : 0;
      const examples = Array.isArray(cat.examples)
        ? cat.examples.filter((e): e is string => typeof e === "string")
        : [];
      if (name) categories.push({ name, relevance, examples });
    }
  }

  const trendInsights: string[] = Array.isArray(o.trendInsights)
    ? o.trendInsights.filter((t): t is string => typeof t === "string")
    : [];

  return {
    summary,
    keywords,
    sentiment,
    categories,
    trendInsights,
  };
}
