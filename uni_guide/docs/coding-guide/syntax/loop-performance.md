# 반복문 성능 비교 ​

다양한 반복문의 성능 차이를 이해하고 상황에 맞는 최적의 방법을 선택합니다.

## 개요 ​

UniWORKS 개발 시 배열을 반복 처리하는 경우가 매우 많습니다. 개발자는 각 반복문의 성능 특성을 이해하고 상황에 맞게 선택해야 합니다.

## 주요 반복문 비교 ​

### 1. 전통적인 for문 ​

가장 빠른 성능을 제공하는 기본 반복문입니다.

javascript```
const gridData = gridObj.getJSONData();
const result = [];

for (let i = 0; i  gridData.length; i++) {
    if (gridData[i].STATUS === 'A') {
        result.push(gridData[i]);
    }
}```
**장점:**

- 가장 빠른 실행 속도
- break, continue 사용 가능
- 인덱스 직접 제어 가능

**단점:**

- 코드가 길고 가독성이 떨어짐
- 실수하기 쉬움 (off-by-one error)

**사용 시나리오:**

- 대용량 데이터 처리 (1000개 이상)
- 성능이 중요한 반복 작업
- 중간에 반복을 멈춰야 하는 경우

### 2. Array.forEach() ​

ES5에서 도입된 배열 메서드입니다.

javascript```
const gridData = gridObj.getJSONData();
const result = [];

gridData.forEach((item) => {
    if (item.STATUS === 'A') {
        result.push(item);
    }
});```
**장점:**

- 간결하고 읽기 쉬운 코드
- 함수형 프로그래밍 스타일
- 인덱스 접근 불필요

**단점:**

- for문보다 약간 느림 (함수 호출 오버헤드)
- break, continue 사용 불가
- return으로 루프 종료 불가

**사용 시나리오:**

- 중소 규모 데이터 처리 (1000개 이하)
- 모든 요소를 반드시 순회해야 하는 경우
- 가독성이 중요한 경우

### 3. Array.filter(), map(), reduce() ​

함수형 프로그래밍 방식의 배열 메서드입니다.

javascript```
const gridData = gridObj.getJSONData();

// filter: 조건에 맞는 요소만 추출
const activeData = gridData.filter(item => item.STATUS === 'A');

// map: 각 요소를 변환
const amounts = gridData.map(item => Number(item.WRBTR || 0));

// reduce: 누적 계산
const totalAmount = gridData.reduce((sum, item) => {
    return sum + Number(item.WRBTR || 0);
}, 0);```
**장점:**

- 의도가 명확한 코드
- 불변성 유지
- 체이닝 가능

**단점:**

- forEach보다 조금 더 느림
- 메모리 사용량 증가 (새 배열 생성)

**사용 시나리오:**

- 데이터 변환, 필터링, 집계
- 함수형 프로그래밍 스타일 선호
- 코드의 의도를 명확히 하고 싶을 때

### 4. for...of 루프 ​

ES6에서 도입된 반복문입니다.

javascript```
const gridData = gridObj.getJSONData();
const result = [];

for (const item of gridData) {
    if (item.STATUS === 'A') {
        result.push(item);
    }
}```
**장점:**

- 간결한 문법
- break, continue 사용 가능
- 이터러블 객체 모두 사용 가능

**단점:**

- 기본 for문보다 느림
- 인덱스 접근이 불편함

**사용 시나리오:**

- 중간 크기 데이터 처리
- break/continue가 필요한 경우
- 인덱스가 필요 없는 경우

### 5. jQuery $.each() ​

jQuery의 반복 메서드입니다.

javascript```
const gridData = gridObj.getJSONData();
const result = [];

$.each(gridData, function(index, item) {
    if (item.STATUS === 'A') {
        result.push(item);
    }
});```
**장점:**

- jQuery에 익숙한 개발자에게 편리
- null/undefined 안전하게 처리

**단점:**

- 가장 느린 성능 (함수 호출 오버헤드 + jQuery 오버헤드)
- 네이티브 메서드보다 무거움
- 현대적이지 않은 패턴

**권장사항:**

- ⚠️ 새 코드에서는 사용을 지양하세요
- 기존 코드는 점진적으로 리팩토링

## 성능 벤치마크 ​

1000개 요소를 가진 배열을 100번 반복 처리한 결과 (상대적 속도):

| 방법 | 실행 시간 | 상대 속도 |
| for문 | 1.2ms | 1.0x (기준) |
| for...of | 1.8ms | 1.5x |
| forEach | 2.1ms | 1.75x |
| filter/map | 2.5ms | 2.08x |
| $.each | 4.5ms | 3.75x |
실제 성능은 브라우저, 데이터 크기, 작업 복잡도에 따라 다를 수 있습니다.

## 실전 권장사항 ​

### ✅ 권장하는 패턴 ​

**데이터 필터링:**

javascript```
// ✅ filter 사용 - 의도가 명확
const activeData = gridData.filter(item => item.STATUS === 'A');```
**데이터 변환:**

javascript```
// ✅ map 사용 - 간결하고 명확
const amounts = gridData.map(item => Number(item.WRBTR || 0));```
**합계 계산:**

javascript```
// ✅ reduce 사용 - 함수형 스타일
const total = gridData.reduce((sum, item) => sum + Number(item.WRBTR || 0), 0);```
**대용량 데이터 (1000개 이상):**

javascript```
// ✅ for문 사용 - 최고 성능
for (let i = 0; i  largeData.length; i++) {
    // 처리
}```
**조건부 탈출:**

javascript```
// ✅ for...of 사용 - 깔끔한 문법
for (const item of gridData) {
    if (item.DOCUMENT_NO === searchNo) {
        found = item;
        break; // 찾으면 종료
    }
}```
### ❌ 피해야 할 패턴 ​

javascript```
// ❌ $.each 사용
$.each(gridData, function(i, item) {
    // 처리
});

// ❌ 불필요한 중간 배열 생성
const result = gridData
    .map(item => ({ ...item, WRBTR: Number(item.WRBTR) }))
    .filter(item => item.STATUS === 'A')
    .map(item => item.WRBTR);

// ✅ 한 번에 처리
const result = gridData
    .filter(item => item.STATUS === 'A')
    .map(item => Number(item.WRBTR));```
## 선택 가이드 ​

### 상황별 최적 선택 ​

mermaid```
graph TD
    A[배열 순회 필요] --> B{데이터 크기?}
    B -->|대용량
1000개 이상| C[for문]
    B -->|중소규모
1000개 이하| D{작업 유형?}
    D -->|필터링| E[filter]
    D -->|변환| F[map]
    D -->|집계| G[reduce]
    D -->|단순 순회| H{중간 종료?}
    H -->|필요| I[for...of]
    H -->|불필요| J[forEach]```
### 요약 표 ​

| 상황 | 추천 방법 | 이유 |
| 대용량 데이터 | `for` | 최고 성능 |
| 필터링 | `filter` | 명확한 의도 |
| 변환 | `map` | 함수형 스타일 |
| 집계/합계 | `reduce` | 간결함 |
| 조건부 종료 필요 | `for...of` | break 사용 가능 |
| 일반 순회 | `forEach` | 가독성 |
| jQuery 코드 | 리팩토링 | 성능 개선 |
## 리팩토링 예제 ​

### Before: jQuery 스타일 ​

javascript```
const gridObj = $u.gridWrapper.getGrid();
const gridData = gridObj.getJSONData();
const result = [];
let totalAmount = 0;

$.each(gridData, function(index, item) {
    if (item.STATUS === 'A') {
        result.push(item);
        totalAmount += Number(item.WRBTR || 0);
    }
});

console.log('활성 항목:', result.length);
console.log('합계:', totalAmount);```
### After: 현대적 스타일 ​

javascript```
const gridObj = $u.gridWrapper.getGrid();
const gridData = gridObj.getJSONData();

// 데이터 필터링
const activeData = gridData.filter(item => item.STATUS === 'A');

// 합계 계산
const totalAmount = activeData.reduce((sum, item) => {
    return sum + Number(item.WRBTR || 0);
}, 0);

console.log('활성 항목:', activeData.length);
console.log('합계:', totalAmount);```
**개선 효과:**

- 실행 속도: 약 2~3배 향상
- 코드 길이: 약 30% 감소
- 가독성: 의도가 더 명확

## 주의사항 ​

개발자는 다음 사항에 유의해야 합니다:

- 성능 최적화는 병목 지점에만 적용하세요
- 대부분의 경우 가독성이 성능보다 중요합니다
- 실제 성능 문제가 발생한 경우에만 for문으로 변경을 고려하세요
- 조기 최적화는 피하고, 먼저 측정하세요

## 참고 자료 ​

- MDN - Array.prototype.forEach
- MDN - for...of
- JavaScript 성능 최적화