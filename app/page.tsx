"use client";

import { useCallback, useState } from "react";

type DatePreset = "none" | "today" | "week";

type Analysis = {
  summary: string;
  keywords: { term: string; score: number }[];
  sentiment: { label: string; confidence: number; rationale: string };
  categories: { name: string; relevance: number; examples: string[] }[];
  trendInsights: string[];
};

type ApiOk = {
  query: string;
  preset: DatePreset;
  keyword: string;
  totalFetched: number;
  totalAfterDateFilter: number;
  analyzedCount: number;
  articles: {
    title: string;
    description: string;
    link: string;
    pubDate: string;
  }[];
  analysis: Analysis;
};

const PRESETS: { value: DatePreset; label: string; hint: string }[] = [
  { value: "none", label: "전체", hint: "날짜 제한 없음" },
  { value: "today", label: "오늘", hint: "KST 기준 당일" },
  { value: "week", label: "이번 주", hint: "월요일~오늘" },
];

function SectionTitle({
  children,
  index,
}: {
  children: React.ReactNode;
  index: string;
}) {
  return (
    <div className="mb-4 flex items-baseline gap-3">
      <span className="font-display text-[10px] font-semibold tracking-[0.35em] text-[var(--paper-muted)]">
        {index}
      </span>
      <h2 className="font-display text-lg font-semibold tracking-tight text-[var(--paper)]">
        {children}
      </h2>
    </div>
  );
}

export default function Home() {
  const [keyword, setKeyword] = useState("");
  const [preset, setPreset] = useState<DatePreset>("none");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ApiOk | null>(null);

  const run = useCallback(async () => {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await fetch("/api/news-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyword: keyword.trim() || undefined,
          preset,
        }),
      });
      const json = (await res.json()) as { error?: string } & Partial<ApiOk>;
      if (!res.ok) {
        setError(json.error ?? `요청 실패 (${res.status})`);
        return;
      }
      if ("analysis" in json && json.analysis) {
        setData(json as ApiOk);
      } else {
        setError("응답 형식이 올바르지 않습니다.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "네트워크 오류");
    } finally {
      setLoading(false);
    }
  }, [keyword, preset]);

  const resultKey = data
    ? `${data.query}-${data.analyzedCount}-${data.totalAfterDateFilter}`
    : "idle";

  return (
    <div className="grain relative min-h-screen overflow-hidden">
      {/* Atmosphere */}
      <div
        className="pointer-events-none fixed inset-0 -z-10"
        aria-hidden
        style={{
          background: `
            radial-gradient(ellipse 90% 60% at 10% -10%, rgba(199, 62, 46, 0.18), transparent 55%),
            radial-gradient(ellipse 70% 50% at 100% 20%, rgba(196, 163, 90, 0.1), transparent 50%),
            radial-gradient(ellipse 60% 40% at 50% 100%, rgba(30, 28, 45, 0.9), transparent 55%),
            linear-gradient(165deg, var(--ink) 0%, var(--ink-elevated) 45%, #0a0812 100%)
          `,
        }}
      />
      <div
        className="pointer-events-none fixed inset-0 -z-10 opacity-[0.07]"
        aria-hidden
        style={{
          backgroundImage: `linear-gradient(var(--border-subtle) 1px, transparent 1px),
            linear-gradient(90deg, var(--border-subtle) 1px, transparent 1px)`,
          backgroundSize: "48px 48px",
        }}
      />

      <main className="relative z-10 mx-auto max-w-4xl px-5 pb-24 pt-14 sm:px-8 sm:pt-20">
        {/* Masthead */}
        <header className="animate-rise relative mb-14 sm:mb-16" style={{ animationDelay: "0s" }}>
          <div className="absolute -left-1 top-0 hidden h-full w-px rule-vertical sm:block" />
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-xl">
              <p className="mb-3 font-display text-[11px] font-semibold uppercase tracking-[0.42em] text-[var(--gold)]">
                Briefing Desk
              </p>
              <h1 className="font-display text-[clamp(2rem,6vw,3.25rem)] font-bold leading-[1.08] tracking-[-0.03em] text-[var(--paper)]">
                실시간
                <br />
                <span className="text-[var(--vermillion)]">뉴스 요약</span>
              </h1>
              <p className="mt-4 max-w-md text-[15px] leading-relaxed text-[var(--paper-muted)]">
                네이버 뉴스를 모아 AI가 요약·키워드·감정·주제·트렌드를 한 번에 정리합니다.
              </p>
            </div>
            <div className="shrink-0 text-right">
              <div className="inline-block border border-[var(--border-strong)] bg-[var(--glass)] px-4 py-3 backdrop-blur-md">
                <p className="font-display text-[10px] tracking-[0.2em] text-[var(--paper-muted)]">
                  EDITION
                </p>
                <p className="font-display text-2xl font-semibold tabular-nums text-[var(--paper)]">
                  {new Date().getFullYear()}
                </p>
                <div className="mt-2 h-px w-full overflow-hidden bg-[var(--border-subtle)]">
                  <div className="h-full w-1/3 bg-[var(--vermillion)] animate-shimmer" />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Control deck */}
        <section
          className="animate-rise relative rounded-2xl border border-[var(--border-strong)] bg-[var(--glass)] p-6 shadow-[0_24px_80px_-20px_rgba(0,0,0,0.65)] backdrop-blur-xl sm:p-8"
          style={{ animationDelay: "0.08s" }}
        >
          <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[var(--vermillion)]/40 to-transparent" />

          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="min-w-0 space-y-2">
              <label
                htmlFor="kw"
                className="font-display text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--paper-muted)]"
              >
                검색 키워드
              </label>
              <p className="text-xs text-[var(--paper-muted)]/90">
                비우면 프리셋에 맞는 기본 검색어로 수집합니다.
              </p>
              <input
                id="kw"
                type="search"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") run();
                }}
                placeholder="예: 반도체 · 부동산 · 환율…"
                className="mt-3 w-full rounded-xl border border-[var(--border-strong)] bg-[var(--ink)]/80 px-4 py-3.5 text-[15px] text-[var(--paper)] outline-none ring-0 transition placeholder:text-[var(--paper-muted)]/50 focus:border-[var(--vermillion)]/80 focus:shadow-[0_0_0_3px_var(--vermillion-glow)]"
              />
            </div>

            <div className="flex flex-col gap-3 lg:items-end">
              <span className="font-display text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--paper-muted)]">
                기간
              </span>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    title={p.hint}
                    onClick={() => setPreset(p.value)}
                    className={`group relative overflow-hidden rounded-full px-4 py-2 text-sm font-medium transition ${
                      preset === p.value
                        ? "bg-[var(--vermillion)] text-white shadow-[0_8px_32px_-8px_var(--vermillion-glow)]"
                        : "border border-[var(--border-strong)] bg-[var(--ink)]/50 text-[var(--paper-muted)] hover:border-[var(--gold)]/40 hover:text-[var(--paper)]"
                    }`}
                  >
                    <span className="relative z-10">{p.label}</span>
                    {preset === p.value && (
                      <span className="absolute inset-0 -z-0 bg-gradient-to-tr from-white/10 to-transparent opacity-60" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-[var(--paper-muted)]">
              Enter로도 실행할 수 있어요. 결과는 제목·요약만으로 분석합니다.
            </p>
            <button
              type="button"
              onClick={run}
              disabled={loading}
              className="group relative inline-flex items-center justify-center overflow-hidden rounded-xl bg-[var(--paper)] px-8 py-3.5 text-sm font-semibold text-[var(--ink)] transition hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45"
            >
              <span className="relative z-10">
                {loading ? "편집 중…" : "브리핑 생성"}
              </span>
              {!loading && (
                <span className="absolute inset-0 -z-0 translate-y-full bg-[var(--gold)] transition-transform duration-300 group-hover:translate-y-0" />
              )}
            </button>
          </div>
        </section>

        {error && (
          <div
            className="animate-rise mt-10 rounded-xl border border-red-500/35 bg-red-950/35 px-5 py-4 text-sm text-red-100 backdrop-blur-sm"
            style={{ animationDelay: "0s" }}
            role="alert"
          >
            <span className="font-semibold text-red-200">오류 · </span>
            {error}
          </div>
        )}

        {loading && (
          <div
            className="mt-14 flex flex-col items-center justify-center gap-4 py-16"
            aria-live="polite"
            aria-busy="true"
          >
            <div className="relative h-14 w-14">
              <span className="absolute inset-0 rounded-full border-2 border-[var(--border-strong)]" />
              <span className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-[var(--vermillion)] border-r-[var(--gold)]/60" />
              <span className="absolute inset-2 animate-pulse-soft rounded-full bg-[var(--vermillion)]/15" />
            </div>
            <p className="font-display text-sm tracking-wide text-[var(--paper-muted)]">
              뉴스를 모으고 편집장이 요약을 씁니다…
            </p>
          </div>
        )}

        {data && !loading && (
          <div key={resultKey} className="mt-16 space-y-12">
            <p
              className="animate-rise font-ui text-xs tracking-wide text-[var(--paper-muted)]"
              style={{ animationDelay: "0.02s" }}
            >
              <span className="text-[var(--gold)]">검색</span> {data.query}
              <span className="mx-2 text-[var(--border-strong)]">·</span>
              수집 <strong className="text-[var(--paper)]">{data.totalFetched}</strong>건 → 필터{" "}
              <strong className="text-[var(--paper)]">{data.totalAfterDateFilter}</strong>건 → 분석{" "}
              <strong className="text-[var(--paper)]">{data.analyzedCount}</strong>건
            </p>

            <article
              className="animate-rise relative rounded-2xl border border-[var(--border-strong)] bg-[var(--glass)] p-6 shadow-[0_20px_60px_-24px_rgba(0,0,0,0.55)] backdrop-blur-md sm:p-8"
              style={{ animationDelay: "0.08s" }}
            >
              <div className="absolute left-0 top-8 h-12 w-1 rounded-r bg-[var(--vermillion)] opacity-90" />
              <SectionTitle index="01">요약</SectionTitle>
              <p className="whitespace-pre-wrap pl-0 text-[16px] leading-[1.75] text-[var(--paper)]/95 sm:pl-6">
                {data.analysis.summary}
              </p>
            </article>

            <article
              className="animate-rise rounded-2xl border border-[var(--border-strong)] bg-[var(--glass)] p-6 backdrop-blur-md sm:p-8"
              style={{ animationDelay: "0.14s" }}
            >
              <SectionTitle index="02">키워드</SectionTitle>
              <p className="mb-4 pl-0 text-xs text-[var(--paper-muted)] sm:pl-6">
                중요도 순 — 호버하면 점수를 볼 수 있어요.
              </p>
              <ul className="flex flex-wrap gap-2 pl-0 sm:pl-6">
                {data.analysis.keywords.map((k, i) => (
                  <li key={k.term}>
                    <span
                      className="group inline-flex items-center gap-2 rounded-lg border border-[var(--border-strong)] bg-[var(--ink)]/60 px-3 py-1.5 text-sm text-[var(--paper)] transition hover:-translate-y-0.5 hover:border-[var(--gold)]/35"
                      title={`중요도 ${(k.score * 100).toFixed(0)}%`}
                      style={{ animationDelay: `${0.18 + i * 0.03}s` }}
                    >
                      <span className="font-medium">{k.term}</span>
                      <span className="font-ui text-[10px] tabular-nums text-[var(--paper-muted)] opacity-0 transition group-hover:opacity-100">
                        {(k.score * 100).toFixed(0)}%
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </article>

            <div className="grid gap-8 lg:grid-cols-2">
              <article
                className="animate-rise rounded-2xl border border-[var(--border-strong)] bg-[var(--glass)] p-6 backdrop-blur-md sm:p-8"
                style={{ animationDelay: "0.2s" }}
              >
                <SectionTitle index="03">감정</SectionTitle>
                <p className="mt-2 pl-0 font-display text-2xl font-semibold text-[var(--paper)] sm:pl-6">
                  {data.analysis.sentiment.label}
                </p>
                <p className="mt-1 pl-0 text-sm text-[var(--gold)] sm:pl-6">
                  신뢰도 {(data.analysis.sentiment.confidence * 100).toFixed(0)}%
                </p>
                <p className="mt-4 pl-0 text-sm leading-relaxed text-[var(--paper-muted)] sm:pl-6">
                  {data.analysis.sentiment.rationale}
                </p>
              </article>

              <article
                className="animate-rise rounded-2xl border border-[var(--border-strong)] bg-[var(--glass)] p-6 backdrop-blur-md sm:p-8"
                style={{ animationDelay: "0.26s" }}
              >
                <SectionTitle index="04">카테고리</SectionTitle>
                <ul className="mt-2 space-y-4 pl-0 sm:pl-6">
                  {data.analysis.categories.map((c) => (
                    <li key={c.name} className="border-b border-[var(--border-subtle)] pb-4 last:border-0 last:pb-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="font-medium text-[var(--paper)]">{c.name}</span>
                        <span className="font-ui text-xs tabular-nums text-[var(--paper-muted)]">
                          {(c.relevance * 100).toFixed(0)}%
                        </span>
                      </div>
                      {c.examples.length > 0 && (
                        <ul className="mt-2 space-y-1 text-xs leading-snug text-[var(--paper-muted)]">
                          {c.examples.slice(0, 3).map((ex) => (
                            <li key={ex} className="border-l-2 border-[var(--vermillion)]/35 pl-2">
                              {ex}
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              </article>
            </div>

            <article
              className="animate-rise rounded-2xl border border-[var(--border-strong)] bg-gradient-to-br from-[var(--glass)] to-[var(--ink)]/80 p-6 backdrop-blur-md sm:p-8"
              style={{ animationDelay: "0.32s" }}
            >
              <SectionTitle index="05">트렌드 인사이트</SectionTitle>
              <ul className="mt-4 space-y-3 pl-0 sm:pl-6">
                {data.analysis.trendInsights.map((t, i) => (
                  <li
                    key={t}
                    className="flex gap-3 text-sm leading-relaxed text-[var(--paper)]/92"
                  >
                    <span className="mt-0.5 font-display text-[var(--gold)]">{i + 1}.</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </article>

            <article
              className="animate-rise rounded-2xl border border-[var(--border-strong)] bg-[var(--glass)] p-6 backdrop-blur-md sm:p-8"
              style={{ animationDelay: "0.38s" }}
            >
              <SectionTitle index="06">참고 기사</SectionTitle>
              <ul className="mt-4 space-y-3 pl-0 sm:pl-6">
                {data.articles.map((a) => (
                  <li key={a.link} className="group">
                    <a
                      href={a.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block text-sm font-medium text-[var(--paper)] underline decoration-[var(--vermillion)]/40 underline-offset-4 transition hover:decoration-[var(--vermillion)]"
                    >
                      {a.title}
                    </a>
                    <p className="mt-1 font-ui text-[11px] text-[var(--paper-muted)]">{a.pubDate}</p>
                  </li>
                ))}
              </ul>
            </article>
          </div>
        )}
      </main>
    </div>
  );
}
