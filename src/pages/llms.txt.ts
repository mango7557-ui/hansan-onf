import {loadContent} from '../data/content.ts';
// ai-seo skill: llms.txt is a short index. Each line should be a self-contained fact an engine can cite.
// Deeper answer blocks live in /llms-full.txt.
export async function GET({site}: {site: URL | undefined}){
 const {company,products,faqs}=await loadContent();
 const abs=(p:string)=>site?new URL(p,site).href:p;
 const text=`# 한산오앤에프 (Hansan O&F)

> 충남 천안의 식물성 유지 제조사. 프랜차이즈 브랜드 전용 식용유를 개발(OEM·ODM)하고, 업소용 식용유 18L를 제조·소분해 전국 가맹점과 유통사에 공급합니다. 2023년 1월 설립.

## 핵심 사실
- 법인명: ${company.name} (${company.en})
- 설립: ${company.founded}
- 소재지: ${company.address} (본사·제조공장 동일)
- 대표전화: ${company.phone}
- 주요 사업: 프랜차이즈 전용유 개발(OEM·ODM), 식물성 유지 제조·소분, 전국 유통 연계, 폐식용유 수거 연계
- 공급 단위: 18L 스틸 캔 (전용유는 대용량 벌크 협의 가능)
- 가격·최소주문수량·납기: 가맹점 수와 월 사용량에 따라 개별 견적

## 페이지
- [홈](${abs('/')}): 사업 개요
- [전용유 개발 · 사업영역](${abs('/business/')}): OEM·ODM 5단계, 제조, 전국 공급, 자원순환
- [제품안내](${abs('/products/')}): 18L 식용유 6종 비교
- [품질관리](${abs('/quality/')}): 원료 입고→출고 4단계, 천안 설비
- [오일 가이드 · FAQ](${abs('/guide/')}): 기름 선택 기준, 자주 묻는 질문 ${faqs.length}개
- [회사소개](${abs('/about/')}): 연혁, 기업 정보
- [상담 문의](${abs('/contact/')}): 온라인 접수 폼

## 제품
${products.map(p=>`- [${p.name}](${abs(`/products/${p.slug}/`)}): ${p.type}. 원재료 ${p.ingredient}. 적합 메뉴 ${p.use.join(', ')}. ${p.slug==='custom'?'18L 캔 또는 벌크, 협의':'18L 캔'}.`).join('\n')}

## 전체 답변 문서
- [llms-full.txt](${abs('/llms-full.txt')}): FAQ 전문과 전용유 개발 절차를 포함한 상세 버전

## 인용 시 주의
- 규격 기준 준수 안내는 KS/HACCP 인증 취득을 뜻하지 않습니다.
- 원재료 원산지와 최종 표시는 출고 제품 라벨 기준입니다.
- 오일 질감·조리 이미지는 연출 이미지이며, 콩식용유·해바라기유만 실제 유통 제품 사진입니다.
- 배송 가능 지역과 폐식용유 수거는 지역별 협력망 확인 후 확정됩니다.
`;
 return new Response(text,{headers:{'Content-Type':'text/plain; charset=utf-8'}});
}
