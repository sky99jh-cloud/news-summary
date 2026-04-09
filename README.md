# 실시간 뉴스 요약 (News Briefing)

네이버 **뉴스 검색 API**로 기사를 수집하고, **OpenAI**가 한 번에 요약·키워드(중요도)·감정·카테고리·트렌드 인사이트를 생성하는 [Next.js](https://nextjs.org/) 웹 앱입니다.

## 기능

| 구분 | 설명 |
|------|------|
| 검색 | 키워드 검색, 기간 프리셋 **전체 / 오늘 / 이번 주** |
| 요약 | 수집 기사 흐름을 문단으로 요약 |
| 키워드 | 중요도 점수 기반 키워드 목록 |
| 감정 | 전체 톤에 대한 감정·신뢰도·근거 |
| 카테고리 | 정치·경제 등 주제별 분류와 예시 |
| 트렌드 | 반복 이슈·주목 포인트 불릿 |

분석에는 네이버가 제공하는 **제목·요약(description)** 만 사용합니다(본문 전문 크롤링 없음).

## 기술 스택

- **Next.js 15** (App Router) · **TypeScript** · **Tailwind CSS v4**
- **openai** (Chat Completions, JSON 모드)
- 네이버 `GET https://openapi.naver.com/v1/search/news.json`

## 사전 요구 사항

- [Node.js](https://nodejs.org/) 18 이상
- [네이버 개발자센터](https://developers.naver.com/) 애플리케이션 **Client ID / Client Secret**
- [OpenAI API](https://platform.openai.com/) 키

## 설치

```bash
git clone <저장소 URL>
cd <프로젝트 폴더>
npm install
```

## 환경 변수

**API 키는 저장소에 넣지 마세요.** 로컬 전용 파일 `.env.local`에만 설정합니다.

1. 예시 파일을 복사합니다.

   **Windows (cmd)**

   ```bat
   copy .env.example .env.local
   ```

   **macOS / Linux**

   ```bash
   cp .env.example .env.local
   ```

2. `.env.local`을 열고 아래 값을 채웁니다.

| 변수 | 필수 | 설명 |
|------|------|------|
| `NAVER_CLIENT_ID` | 예 | 네이버 애플리케이션 Client ID |
| `NAVER_CLIENT_SECRET` | 예 | 네이버 애플리케이션 Client Secret |
| `OPENAI_API_KEY` | 예 | OpenAI API 키 |
| `OPENAI_MODEL` | 아니오 | 기본값 `gpt-4o-mini` |

`.gitignore`에 `.env*.local`이 포함되어 있어 Git에 올라가지 않습니다.

## 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 을 엽니다.

## 빌드

```bash
npm run build
npm start
```

## API

`POST /api/news-analyze`

**요청 본문 (JSON)**

```json
{
  "keyword": "선택, 검색어",
  "preset": "none | today | week"
}
```

- `preset`: `today`·`week` 선택 시 `pubDate`를 **한국 시간(KST)** 기준으로 필터링합니다. `keyword`가 비어 있으면 기본 검색어로 뉴스를 수집합니다.

**응답**: 수집·필터 통계, 참고 기사 목록, `analysis` 객체(요약·키워드·감정·카테고리·트렌드).

## 보안 안내

- 키가 코드·이슈·채팅 등에 노출된 적이 있다면 **네이버·OpenAI 콘솔에서 키를 재발급**하고 기존 키는 비활성화하세요.
- 본 레포에는 **민감 정보가 들어 있는 로컬 메모 파일**을 커밋하지 않도록 `info.md` 등을 `.gitignore`에 둘 수 있습니다.

## 라이선스

이 저장소의 라이선스는 저장소 소유자가 별도로 지정하지 않은 경우 적용되지 않을 수 있습니다. 필요 시 `LICENSE` 파일을 추가하세요.
