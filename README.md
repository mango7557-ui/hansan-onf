# 한산오앤에프 홈페이지

엑셀 제공 자료를 토대로 제작한 한국어 B2B 식용유 브랜드 웹사이트. Astro 정적 HTML + Node.js 문의 접수 서버입니다.

## 실행

```bash
npm install
npm run build
npm start
```

접속: http://localhost:4321

`npm run dev`는 화면 개발용입니다. 문의 접수까지 확인할 때는 빌드 후 `npm start`를 사용하세요.

## 구성

- 홈, 회사소개, 사업영역, 제품 목록 및 6종 상세, 품질관리, 오일 가이드/FAQ, 문의, 개인정보처리방침, 404.
- 정적 HTML에 본문과 FAQ 포함. JavaScript 없이도 주요 정보 확인 가능.
- Organization / Product / FAQPage 구조화 데이터. 운영 도메인 지정 시 제품 BreadcrumbList 추가.
- 페이지별 제목·설명, OG, canonical, robots.txt, sitemap.xml, 보조 안내용 llms.txt.
- 제품 필터, 인쇄/PDF 저장, 제품 선택 자동 입력, 모바일 메뉴, 실제 서버 접수, 키보드 접근, 모션 감소 설정 지원.

## 운영 도메인

실제 도메인이 전달되지 않아 가상의 도메인은 넣지 않았습니다. 배포할 때 **빌드와 서버 실행 환경 모두** `SITE_URL`을 설정하세요. 예시 주소는 실제 회사 소유 도메인으로 변경합니다.

```bash
SITE_URL=https://실제도메인.kr npm run build
SITE_URL=https://실제도메인.kr npm start
```

PowerShell:

```powershell
$env:SITE_URL="https://실제도메인.kr"
npm run build
npm start
```

`SITE_URL` 미설정 시 canonical 및 sitemap의 도메인 링크가 생략됩니다. 등록 후 Google Search Console / 네이버 서치어드바이저에서 소유권 확인 및 sitemap을 제출하세요. 검색/AI 답변 노출은 보장되지 않으며, llms.txt는 보조 안내입니다.

## 문의 데이터

- POST `/api/inquiries` → `data/inquiries/*.json` 저장, 접수번호 반환.
- 저장 위치는 웹 공개 디렉터리 `dist`와 분리. 요청 검증·본문 크기 제한·중복 요청 방지·IP별 시간당 요청 제한 적용.
- `DATA_DIR`로 영속 저장 위치 변경 가능. 여러 서버에 분산 배포할 경우 공유 데이터베이스와 공통 요청 제한 저장소로 교체해야 합니다.
- `INQUIRY_WEBHOOK_URL`에 HTTPS 수신 주소를 연결하면 저장 후 접수 알림 JSON을 전송합니다. 미설정 시 로컬 접수 저장만 작동합니다.
- 알림 실패 시 `notification: "failed"`로 기록합니다. 저장 완료 이후에만 성공 응답을 반환하므로 알림 장애가 문의 유실로 이어지지 않습니다.
- 개인정보 데이터이므로 접근 가능한 운영자만 열람하며, 상담 완료일과 보유기간을 관리해 종료 후 1년 이내 삭제하세요. `status` 초기값은 `new`입니다.
- 개인정보처리방침의 처리 담당·위탁 업체 등은 실제 운영 환경 확정 시 검토해 반영하세요.

## 적용 스킬 (2026-11-09)

GitHub에서 내려받아 `.opencode/skills/`에 설치했습니다. 두 스킬의 지침을 기준으로 홈페이지 전체를 다시 다듬었습니다.

| 스킬 | 출처 | 기준 |
|---|---|---|
| frontend-design | [anthropics/skills](https://github.com/anthropics/skills) (190k★, GitHub에서 가장 많은 별을 받은 스킬 저장소) | 템플릿형 기본값 배제, 타이포그래피 중심, 한 곳에만 과감함, 사용자 행동에 응답하는 모션 |
| motion-design | [LottieFiles/motion-design-skill](https://github.com/LottieFiles/motion-design-skill) (2.9k★, 모션 그래픽 단일 스킬 중 최다) | Premium 아키타입: 350–600ms, cubic-bezier(.4,0,.2,1), 오버슈트 0%. 3단 구조(Setup → Action → Resolution), 1/3 규칙, 3개 모션 레이어 |

### find-skills (2026-11-10)

| 스킬 | 출처 | 역할 |
|---|---|---|
| find-skills | [vercel-labs/skills](https://github.com/vercel-labs/skills) (38.7k★, skills.sh 설치 1위) | 작업에 맞는 스킬을 `npx skills find <검색어>`로 찾고 설치 수·출처·별점으로 검증하는 절차 |

이후 "~하는 스킬 있어?" 류의 요청은 이 스킬의 절차(skills.sh 리더보드 확인 → CLI 검색 → 1K+ 설치·공식 출처·100★ 이상 검증 → 제시)를 따릅니다.

### impeccable (2026-11-10)

| 스킬 | 출처 | 내용 |
|---|---|---|
| impeccable 4.8.1 (엔진 v0.1.19) | [pbakaus/impeccable](https://github.com/pbakaus/impeccable) (106.7k★, Paul Bakaus) | 코딩 에이전트용 디자인 어휘. **24개 명령**: Steer(`bolder`·`quieter`·`distill`·`colorize`·`typeset`·`layout`·`animate`·`delight`·`overdrive`), Review(`critique` 점수형 UX 리뷰·`audit` P0–P3 기술 감사), Finish(`polish`·`harden`·`clarify`·`adapt`·`optimize`·`onboard`), Live(`live` 브라우저에서 요소 골라 변형 순환·`generate`), Plan(`shape`·`init`→PRODUCT.md·`document`→DESIGN.md·`extract`). **62개 결정론적 슬롭 탐지 규칙** — LLM·API 키 없이 Rust 바이너리로 실행. |

공식 설치기(`npx impeccable install --agent opencode`)로 설치. skills.sh에는 미등록이지만 GitHub 별점으로 검증 통과. 사용: `/impeccable critique <대상>`, `/impeccable init`.

**설치 직후 `detect` 결과** (빌드된 HTML 3개 페이지): 18건.
- `side-tab` / `border-accent-on-rounded` ×7 — 카드 한쪽의 두꺼운 색 테두리(인용구 왼쪽 앰버 선, 안내 박스 왼쪽 선, 연락처 카드 상단 선, 지역 카드 상단 선, 푸터 상단 선). 스킬 설명: "AI 생성 UI의 가장 알아보기 쉬운 표시"
- `cramped-padding` ×9 — 섹션 배경 위 `.container`가 좌우 inset 없이 붙음(오탐에 가까움: `.container`가 `width:min(1280px, 100% - 96px)`로 여백을 만들지만 탐지기가 padding만 봄)
- `low-contrast` ×3 — 고정 헤더가 스크롤 시 배경 바뀌는 것을 탐지기가 읽지 못한 오탐
- `skipped-heading` ×1 — 제품 목록 페이지 h1 → h3 (h2 없음). 실제 결함
- `overused-font` ×1 — Instrument Serif. 흔한 폰트 목록에 포함

### hallmark (2026-11-10)

| 스킬 | 출처 | 설치 수 | 내용 |
|---|---|---|---|
| hallmark 2.0.0 | [Nutlope/hallmark](https://github.com/Nutlope/hallmark) (51.6k★, Vercel의 Hassan El Mghari) | 97.9K | "anti-AI-slop" 디자인 스킬. 16개 **Floor** 규칙(토큰 외 색·폰트 금지, `transition: all` 금지, 로만 제목 속 이탤릭 한 단어 금지, `overflow-x: clip`, 모든 인터랙티브 요소 `:focus-visible`, 가운뎃점 메타 문자열·장식 점 금지, 보라→파랑 그라데이션·카드 속 카드·이모지 아이콘 금지, 화면당 80단어, 1280×800에서 히어로 전부 보이기 등), 51개 테마 딜러, 21개 매크로 구조, 장르 4종, `sloplint.mjs`(Floor/Reflex/Finish 3단계 린터, `--render`로 실제 브라우저 검사). |

`/hallmark redesign <path>` · `/hallmark audit <path>` 슬래시 동사 지원. 설치 직후 `sloplint`로 현재 사이트를 감사한 결과: FAIL 2건(`overflow-x: clip` 부재, 스크롤 인디케이터의 가운뎃점 문자열), REFLEX 3건(`:active`/`:disabled` 상태, 비디오 poster).

### taste-skill (2026-11-10)

| 스킬 | 출처 | 설치 수 | 내용 |
|---|---|---|---|
| taste-skill 2.5.1 (design-taste-frontend) | [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill) (112k★) | 752K | "anti-slop" 프론트엔드 스킬. figma.com·x.ai 수준을 기준으로 삼는 9가지 하우스 룰(이미지 아래 캡션 금지, 화면당 한 섹션, 좌우 여백 동일, 호버 마이크로 모션, 실사진 우선, 주소·연락처 표기 규칙 등), 업종별 페이지 플랜, 실제 브라우저에서 검사하는 `gate.mjs`·`consistency.mjs`·`copy-lint.mjs`·`perf.mjs`, 레이아웃·팔레트 딜러(`deal.mjs`, `start.mjs`), 사진·아이콘 검색기. 38MB(에셋 포함). |

skills.sh 전체 설치 순위 2위. `find-skills` 기준(1K+ 설치, 100★+, 신뢰 출처) 전부 통과.

### find-skills로 찾아 설치한 스킬 (2026-11-10)

`npx skills find`로 seo·astro·firebase·korean·performance·schema·landing·form·image 9개 키워드를 검색하고, find-skills 검증 기준(설치 1K+, 공식 출처, 저장소 100★+)을 통과한 것만 설치했습니다.

| 스킬 | 출처 | 설치 수 | 반영 |
|---|---|---|---|
| schema | coreyhaines31/marketingskills (59k★) | 86.6K | Organization에 logo·contactPoint·knowsAbout·@id, WebSite 노드, Product에 image·offers·sku·manufacturer. schema.org 검증기 오류 0 |
| ai-seo | 〃 | 161K | llms.txt를 인용 가능한 한 줄 사실 중심으로 재작성, 섹션마다 40–60자 독립 답변 블록을 둔 llms-full.txt 신설 |
| seo-audit | 〃 | 249.8K | 8개 페이지 title/description/h1/canonical/og 점검 → 전부 통과 |
| web-perf | cloudflare/skills (3.3k★) | 122.5K | 헤더·압축·캐시 점검(전부 br/gzip, immutable), Pretendard Bold·Regular woff2 preload 추가 |
| firebase-auth-basics, firebase-hosting-basics | firebase/agent-skills (507★) | 182K / 177K | 관리자 인증·호스팅 설정 참고용 |
| korean-spell-check | nomadamas/k-skill (8.4k★) | 11.6K | 전체 한글 문구 흔한 오탈자 스캔 → 0건 |

탈락: astrolicious/agent-skills(13★), autonnel/autonnel-skills(8★), 101-skills/superpowers(22★) — 별점 기준 미달.

### 2차 추가 스킬 (2026-11-09 저녁)

| 스킬 | 출처 | 역할 |
|---|---|---|
| ui-ux-pro-max | [nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) (147k★) | 120개 UX 가이드라인, Astro 스택 규칙, 디자인 시스템 검색 도구 |
| web-design-guidelines | [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) (33.7k★) | Vercel Web Interface Guidelines 감사 체크리스트 |
| accessibility | [KreerC/ACCESSIBILITY.md](https://github.com/KreerC/ACCESSIBILITY.md) | 실무 접근성 전문가가 쓴 WCAG 2.2 기준 |

세 스킬로 사이트를 감사해 다음을 고쳤습니다.

- **이미지 파이프라인** (ui-ux-pro-max Astro 규칙): 수동 WebP 대신 `astro:assets` `<Picture>`. AVIF + WebP + JPG 폴백, 뷰포트별 srcset. 제품 컷아웃 230 kB → 6–10 kB(AVIF). 모든 이미지에 width/height 유지.
- **폼** (Vercel WIG + ui-ux-pro-max Forms): 필드별 인라인 오류를 `aria-describedby`로 연결, 제출 시 첫 오류 필드로 포커스 이동, blur 시 검증, `inputmode="tel"`/`email`, 이메일 `spellcheck=false`, 모든 입력에 `autocomplete`, 플레이스홀더에 실제 예시.
- **대비** (accessibility): 모든 텍스트/배경 쌍을 WCAG 공식으로 계산. 푸터 저작권 3.87:1 → 5.73:1로 수정. 나머지 전부 4.5:1 이상.
- **타이포그래피** (Vercel WIG): 헤드라인 `text-wrap: balance`, 숫자 열 `tabular-nums`, 로딩 문구 `…`.
- **테마** (Vercel WIG): `theme-color`를 실제 페이지 배경과 일치, `color-scheme` 명시, 브랜드명·전화번호 `translate="no"`.

ui-ux-pro-max의 `--design-system` 검색은 이 브리프에 "Claymorphism + 테라코타/그린 + Varela Round"를 추천했습니다. 식용유 B2B 제조사에는 맞지 않는 결과(장난감·어린이 앱용 스타일)라 채택하지 않았고, 대신 UX 가이드라인·스택 규칙·체크리스트 데이터만 사용했습니다. 스킬 출력은 추천이지 지시가 아닙니다.

### 스킬 적용 내용

- **frontend-design**: 대문자 추적 라벨(eyebrow), `01 / 02 / 03` 번호 장식, 링크 뒤 `↗`, 가운뎃점 메타 문자열, 다크+네온 강조 등 "AI 생성물 신호"로 지목된 패턴을 전부 제거. 번호는 실제 순서(OEM 개발 단계, 품질관리 단계)에만 사용. 본문 줄 길이 34em 이하. 영문 디스플레이 대신 한국어 헤드라인이 페이지의 성격을 담당.
- **motion-design**: 페이지 로드 시 단 하나의 연출 — 사진 와이프(0–900ms) → 헤드라인 3줄 상승(300ms부터 120ms 간격) → 본문·버튼 정착(660–780ms). 이후 사진은 9초 주기 1.5% 호흡과 14초 글로우 드리프트(ambient, 주 모션 대비 20% 이하)만 유지. 섹션별 스크롤 페이드인 제거. 탭·FAQ·필터·폼 오류(shake 320ms)는 사용자 행동에만 응답. `prefers-reduced-motion`에서는 모든 애니메이션 1ms로 축소.

## 리디자인 방향 (2026-11-09)

- 해바라기·초록 기업 템플릿을 대신해 잉크 블랙 / 웜 화이트 / 앰버 기반 편집 디자인으로 전면 재구축.
- 오일 조형, 조리 질감, 오일 매크로 3종 브랜드 이미지 직접 제작. 실제 회사 시설이나 실적 사진을 의미하지 않는 연출 이미지.
- 제품 카드의 SVG 가상 패키지를 화면에서 제거. 확보된 2종 제품은 실제 사진의 배경을 제거해 사용하고 나머지는 오일 질감 비주얼로 안내.
- 키보드 조작을 지원하는 메인 컬렉션 탭, 모션 감소 설정을 존중하는 이미지 스크롤 효과.
- 모든 하위 페이지, 제품 목록/상세, 문의 폼과 모바일 화면까지 동일한 편집 디자인 적용.

## 이미지 및 콘텐츠 근거

- 주요 기업·제품 정보: 사용자 제공 `한산오앤에프_데이터_수집_요청-Genspark_AI_Sheets-20261109_2129.xlsx`.
- 브랜드 비주얼: `oil-sculpture.webp`, `culinary-study.webp`, `oil-study.webp` — 자체 기획 후 이미지 생성 도구로 제작한 연출 이미지. 사용 모델 GPT Image 2.6. 사진 원본과 WebP 버전을 함께 보관.
- 콩식용유·해바라기유 실제 제품: [청일유통 콩식용유](https://cheongil.co.kr/shop_view/?idx=80), [해바라기유](https://cheongil.co.kr/shop_view/?idx=81). 공개 제품 이미지를 출처와 함께 반영했습니다. 운영 전 자체 보유 제품 사진 또는 사용 승인된 원본으로 교체할 수 있습니다.
- 실제 제품 카드: 기존 공개 제품 이미지에 배경 제거만 적용한 `soybean-cutout.webp`, `sunflower-cutout.webp`. 제품 라벨과 형태 유지. 실물 이미지 미확보 제품은 MATERIAL STUDY로 구분.
- KS 규격 기준을 인증 취득으로 표현하지 않음. HACCP 등 제공되지 않은 인증 로고 미삽입.
- 확인되지 않은 발연점, 최소주문수량, 배송기간, 가격, 성과 수치, 고객 후기, 협력사 로고는 사용하지 않음.
- 참고 디자인: 나비촌의 제조업 정보 구조, 비앤비코리아의 브랜드 중심 레이아웃.
- 최신 검색 가이드: https://developers.google.com/search/docs/appearance/ai-features

## 검증

```bash
npx playwright install chromium
npm test
```

테스트는 별도 4322 포트 서버와 임시 문의 저장 공간을 사용합니다. 페이지/이미지 링크, 반응형 화면, 필터, FAQ, 문의 접수·검증·중복 요청, 구조화 데이터를 확인합니다. 스크린샷은 `artifacts/`에 생성합니다.

## 배포

Node.js 22 이상 권장. `dist/`, `server.mjs`, 영속 `DATA_DIR`로 실행하고 HTTPS 리버스 프록시를 연결합니다. 정적 파일만 배포하면 문의 API는 동작하지 않으므로 별도 서버리스 API 연결이 필요합니다. 서버 데이터 디렉터리를 웹 공개 경로로 매핑하지 마세요.
