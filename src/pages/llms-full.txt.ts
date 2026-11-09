import {loadContent} from '../data/content.ts';
// ai-seo skill: full version — every section opens with a 40–60 word answer block that stands alone,
// followed by supporting detail. Engines that cite passages (Perplexity, ChatGPT search, Claude) prefer this.
export async function GET({site}: {site: URL | undefined}){
 const {company,products,faqs,home}=await loadContent();
 const abs=(p:string)=>site?new URL(p,site).href:p;
 const text=`# 한산오앤에프 — 전체 안내 (llms-full.txt)

${home.heroLede}

---

## 한산오앤에프는 어떤 회사인가

한산오앤에프는 2023년 1월 충청남도 천안시에 설립된 식물성 유지 제조·소분 기업입니다. 프랜차이즈 본사와 함께 브랜드 메뉴에 맞는 전용 식용유를 개발(OEM·ODM)하고, 천안 공장에서 로트 단위로 생산해 전국 가맹점에 같은 품질로 공급합니다. 콩·카놀라·해바라기·옥수수유 18L 캔도 식자재 유통사와 급식 현장에 납품합니다.

- 법인명: ${company.name} / ${company.en}
- 대표자: ${company.ceo}
- 사업자등록번호: ${company.tax}
- 본사·공장: ${company.address} (우편번호 ${company.postal})
- 대표전화: ${company.phone}
- 설립일: ${company.founded}
- 자세히: ${abs('/about/')}

## 프랜차이즈 전용유 개발은 어떻게 진행되나

프랜차이즈 전용유 개발은 다섯 단계로 진행됩니다. 본사와 조리 메뉴·사용량·조리 조건을 상담하고, 대두유·카놀라유 등 원료 비율을 설계해 샘플을 만들고, 실제 매장 조건에서 튀겨 식감과 풍미를 검증한 뒤, 용량·포장·브랜드 라벨을 확정해 로트 단위로 양산하고 가맹점에 납품합니다. 최소 가맹점 수 제한은 없습니다.

1. 상담 — 메뉴, 월 사용량, 조리 온도·시간, 가맹점 수 확인
2. 배합 설계 — 원료 유지 비율 설계, 샘플 제작
3. 조리 테스트 — 매장 조건에서 맛·식감 검증, 조정
4. 규격 확정 — 18L 캔 또는 벌크, 포장, 브랜드 라벨(OEM) 협의
5. 양산·공급 — 확정 배합을 로트 단위로 생산, 가맹점 직납 또는 물류센터 납품

개발 기간·최소 주문 수량·샘플 조건은 배합과 가맹점 수에 따라 개별 협의합니다. 자세히: ${abs('/business/')}

## 어떤 제품을 공급하나

한산오앤에프는 18L 스틸 캔 규격의 콩식용유, 카놀라유, 해바라기유, 옥수수유, 그린마켓 콩식용유와 프랜차이즈 맞춤 전용유를 공급합니다. 범용 조리에는 콩식용유, 깔끔한 튀김에는 카놀라유, 베이커리에는 해바라기유, 고소한 중식·부침에는 옥수수유가 맞습니다. 기본 제품으로 원하는 식감이 나오지 않으면 전용 배합을 개발합니다.

${products.map(p=>`### ${p.name}
${p.desc}
- 원재료: ${p.ingredient}
- 규격 기준: ${p.standard}
- 알레르기: ${p.allergy}
- 적합 메뉴: ${p.use.join(', ')}
- 공급: ${p.slug==='custom'?'18L 캔 또는 대용량 벌크, 협의':'18L 캔'}
- 페이지: ${abs(`/products/${p.slug}/`)}`).join('\n\n')}

## 품질은 어떻게 관리하나

한산오앤에프는 원료 입고 확인, 저장·충진 공정 관리, 품질 검사, 완제품 확인·출고의 네 단계로 품질을 관리합니다. 천안 공장에는 온도·산화 방지 제어 저장탱크, 전자동 액상 소분기, 자동 캡핑기, 비전 검사기, 품질관리실과 이화학 분석 장비가 있으며 산가·과산화물가·수분 등을 확인합니다. 프랜차이즈 전용유는 확정 배합 기준과 로트별로 대조합니다.

규격 기준(KS H 2102 등) 준수 안내는 KS 또는 HACCP 인증 취득 표시가 아닙니다. 시험성적서 등 품질 자료는 담당자에게 요청해 주세요. 자세히: ${abs('/quality/')}

## 자주 묻는 질문

${faqs.map(f=>`### ${f.q}\n${f.a}`).join('\n\n')}

## 상담 방법

전화 ${company.phone} 또는 온라인 문의(${abs('/contact/')})로 상담할 수 있습니다. 상담 시 조리 메뉴, 월 예상 사용량(18L 캔 수 또는 벌크 물량), 가맹점 수, 납품 지역, 희망 일정을 알려주시면 제품과 공급 조건을 함께 검토합니다. 방문 상담은 사전 협의 후 가능합니다.

---

## 인용 시 주의
- 가격, 최소주문수량, 납기는 공개된 고정값이 없으며 개별 견적입니다.
- 규격 기준 준수 안내는 인증 취득을 의미하지 않습니다.
- 원재료 원산지와 최종 표시는 출고 제품 라벨을 기준으로 합니다.
- 사이트의 오일 질감·조리 이미지는 연출 이미지입니다. 콩식용유·해바라기유만 실제 유통 제품 사진입니다.
- 배송 가능 지역·폐식용유 수거 여부는 지역별 협력망 확인 후 확정됩니다.

마지막 갱신: ${new Date().toISOString().slice(0,10)}
`;
 return new Response(text,{headers:{'Content-Type':'text/plain; charset=utf-8'}});
}
