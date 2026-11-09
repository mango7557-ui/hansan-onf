import {company,products} from '../data/site.js';
export function GET(){
 const text=`# 한산오앤에프 / HANSAN O&F

> 식물성 유지 제조·소분, 브랜드 맞춤 전용유 개발 및 전국 유통 연계 기업.

## 기업 정보
- 법인명: ${company.name}
- 설립: ${company.founded}
- 전화: ${company.phone}
- 주소: ${company.address}

## 안내 페이지
- [회사소개](/about/)
- [사업영역: OEM·ODM, 제조, 유통](/business/)
- [제품안내](/products/)
- [품질관리](/quality/)
- [제품 선택 및 FAQ](/guide/)
- [공급 문의](/contact/)

## 제품
${products.map(p=>`- [${p.name}](/products/${p.slug}/): ${p.slug==='custom'?'18L 캔 / 벌크':'18L 캔'}. ${p.use.join(', ')}.`).join('\n')}

## 정확한 안내를 위한 참고
- 가격, 최소주문수량, 납기: 거래 조건별 개별 상담.
- 규격 기준 준수 안내는 KS/HACCP 인증 취득을 의미하지 않음.
- 원재료 원산지 및 최종 표시는 출고 제품 확인 필요.
- 콩식용유와 해바라기유는 공개 유통 제품 이미지를 참고. 나머지 오일 이미지 및 조리 이미지는 브랜드 연출 이미지.
- 배송 및 폐유 수거는 지역별 협력망 확인 후 확정.
`;
 return new Response(text,{headers:{'Content-Type':'text/plain; charset=utf-8'}});
}
