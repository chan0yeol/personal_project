# ES6+ 활용하기 ​

현대적인 JavaScript 기능을 활용하여 코드를 간결하고 읽기 쉽게 작성합니다.

## 개요 ​

ES6(ECMAScript 2015) 이후 JavaScript에 많은 유용한 기능이 추가되었습니다. 개발자는 이러한 기능을 활용하여 더 깔끔하고 유지보수하기 쉬운 코드를 작성할 수 있습니다.

## 주요 기능 ​

### 1. const와 let ​

`var` 대신 `const`와 `let`을 사용합니다.

javascript```
// ❌ 구식 방법
var name = 'UniWORKS';
var version = 6.0;

// ✅ 현대적 방법
const name = 'UniWORKS';  // 재할당 불가
let version = 6.0;        // 재할당 가능```
**원칙:**

- 기본적으로 `const` 사용
- 값이 변경되어야 할 때만 `let` 사용
- `var`는 사용하지 않음

### 2. 화살표 함수 (Arrow Function) ​

간결한 함수 표현식입니다.

javascript```
// ❌ 구식 방법
gridData.forEach(function(item) {
    console.log(item.NAME);
});

// ✅ 화살표 함수
gridData.forEach((item) => {
    console.log(item.NAME);
});

// ✅ 단일 표현식은 더 간결하게
gridData.forEach(item => console.log(item.NAME));```
**이벤트 핸들러:**

javascript```
// ✅ 화살표 함수 사용
gridObj.onCellClick((columnKey, rowIndex) => {
    const value = gridObj.$V(columnKey, rowIndex);
    console.log(value);
});```
### 3. 템플릿 리터럴 (Template Literals) ​

문자열 연결을 간편하게 합니다.

javascript```
const name = 'UniWORKS';
const version = 6.0;

// ❌ 문자열 연결
const message = name + ' 버전 ' + version + '입니다.';

// ✅ 템플릿 리터럴
const message = `${name} 버전 ${version}입니다.`;```
**실전 예제:**

javascript```
// ✅ 에러 메시지
throw `${index + 1}번째 행의 회사코드를 입력해주세요.`;

// ✅ 알림 메시지
unidocuAlert(`${selectedData.length}개 항목이 선택되었습니다.`);

// ✅ 로그
console.log(`데이터 로드 완료: ${data.length}건`);```
### 4. 구조 분해 할당 (Destructuring) ​

객체나 배열에서 값을 쉽게 추출합니다.

javascript```
// ❌ 일일이 할당
const gridObj = $u.gridWrapper.getGrid();
const selectedData = gridObj.getSELECTEDJSONData();
const firstRow = selectedData[0];
const documentNo = firstRow.DOCUMENT_NO;
const fiscalYear = firstRow.FISCAL_YEAR;
const amount = firstRow.WRBTR;

// ✅ 구조 분해
const gridObj = $u.gridWrapper.getGrid();
const [firstRow] = gridObj.getSELECTEDJSONData();
const { DOCUMENT_NO, FISCAL_YEAR, WRBTR } = firstRow;```
**함수 파라미터:**

javascript```
// ✅ 필요한 필드만 추출
function processOrder({ DOCUMENT_NO, WRBTR, WAERS }) {
    console.log(`문서번호: ${DOCUMENT_NO}`);
    console.log(`금액: ${WRBTR} ${WAERS}`);
}

const order = gridObj.getJSONDataByRowIndex(0);
processOrder(order);```
### 5. 기본 매개변수 (Default Parameters) ​

함수 파라미터에 기본값을 설정합니다.

javascript```
// ❌ 구식 방법
function calculateAmount(price, quantity) {
    price = price || 0;
    quantity = quantity || 1;
    return price * quantity;
}

// ✅ 기본 매개변수
function calculateAmount(price = 0, quantity = 1) {
    return price * quantity;
}```
### 6. 스프레드 연산자 (Spread Operator) ​

배열이나 객체를 펼칩니다.

javascript```
// ✅ 배열 병합
const array1 = [1, 2, 3];
const array2 = [4, 5, 6];
const combined = [...array1, ...array2];

// ✅ 객체 병합
const defaultOptions = { pageSize: 10, sortBy: 'NAME' };
const userOptions = { pageSize: 20 };
const finalOptions = { ...defaultOptions, ...userOptions };

// ✅ 배열 복사
const gridData = gridObj.getJSONData();
const dataCopy = [...gridData];```
**실전 예제:**

javascript```
// ✅ 새 행 추가
const gridData = gridObj.getJSONData();
const newRow = { BUKRS: '1000', WRBTR: '0', STATUS: 'N' };
const updatedData = [...gridData, newRow];
gridObj.setJSONData(updatedData);```
### 7. 객체 속성 단축 (Object Property Shorthand) ​

키와 변수명이 같으면 간략하게 작성합니다.

javascript```
const documentNo = '12345';
const fiscalYear = '2025';
const amount = 1000000;

// ❌ 중복된 키-값
const data = {
    documentNo: documentNo,
    fiscalYear: fiscalYear,
    amount: amount
};

// ✅ 단축 표기
const data = {
    documentNo,
    fiscalYear,
    amount
};```
### 8. 옵셔널 체이닝 (Optional Chaining) ​

ES2020에서 도입된 기능으로 안전하게 중첩 속성에 접근합니다.

javascript```
const gridData = gridObj.getJSONData();
const firstRow = gridData[0];

// ❌ 에러 발생 가능
const userName = firstRow.USER.NAME; // firstRow.USER가 undefined면 에러

// ✅ 안전한 접근
const userName = firstRow?.USER?.NAME; // undefined 반환```
### 9. Nullish 병합 연산자 (Nullish Coalescing) ​

`null` 또는 `undefined`일 때만 기본값을 사용합니다.

javascript```
const amount = gridObj.$V('WRBTR', 0);

// ❌ 0도 false로 처리됨
const value = amount || 1000; // amount가 0이면 1000 반환

// ✅ null/undefined만 처리
const value = amount ?? 1000; // amount가 0이면 0 반환```
## 실전 리팩토링 ​

### Before: ES5 스타일 ​

javascript```
var gridObj = $u.gridWrapper.getGrid();

$u.buttons.addHandler({
    "doSave": function() {
        var selectedData = gridObj.getSELECTEDJSONData();

        if (selectedData.length === 0) {
            throw '행을 선택해주세요.';
        }

        var totalAmount = 0;
        for (var i = 0; i  selectedData.length; i++) {
            var item = selectedData[i];
            totalAmount += Number(item.WRBTR || 0);
        }

        var message = '총 ' + selectedData.length + '건, 합계: ' + totalAmount;

        $nst.it_data_returnMessage('SAVE_DATA', selectedData, function(response) {
            unidocuAlert(message);
        });
    }
});```
### After: ES6+ 스타일 ​

javascript```
const gridObj = $u.gridWrapper.getGrid();

$u.buttons.addHandler({
    "doSave": function() {
        const selectedData = gridObj.getSELECTEDJSONData();

        if (selectedData.length === 0) {
            throw '행을 선택해주세요.';
        }

        // reduce로 합계 계산
        const totalAmount = selectedData.reduce((sum, item) => {
            return sum + Number(item.WRBTR ?? 0);
        }, 0);

        // 템플릿 리터럴
        const message = `총 ${selectedData.length}건, 합계: ${totalAmount}`;

        // 화살표 함수
        $nst.it_data_returnMessage('SAVE_DATA', selectedData, (response) => {
            unidocuAlert(message);
        });
    }
});```
**개선 효과:**

- 코드 길이 20% 감소
- 가독성 크게 향상
- 버그 가능성 감소

## 자주 사용하는 패턴 ​

### 패턴 1: 배열 필터링 및 변환 ​

javascript```
const gridData = gridObj.getJSONData();

// ✅ 활성 상태인 항목의 금액만 추출
const activeAmounts = gridData
    .filter(item => item.STATUS === 'A')
    .map(item => Number(item.WRBTR ?? 0));```
### 패턴 2: 조건부 객체 속성 ​

javascript```
const searchParams = {
    BUKRS: '1000',
    ...(fiscalYear && { GJAHR: fiscalYear }),  // fiscalYear가 있을 때만 추가
    ...(status && { STATUS: status })
};```
### 패턴 3: 배열 중복 제거 ​

javascript```
const duplicates = ['A', 'B', 'A', 'C', 'B'];

// ✅ Set을 활용한 중복 제거
const unique = [...new Set(duplicates)];
// ['A', 'B', 'C']```
### 패턴 4: 객체 배열 그룹화 ​

javascript```
const gridData = gridObj.getJSONData();

// ✅ 상태별로 그룹화
const groupedByStatus = gridData.reduce((groups, item) => {
    const status = item.STATUS;
    groups[status] = groups[status] ?? [];
    groups[status].push(item);
    return groups;
}, {});

// { A: [...], P: [...], C: [...] }```
## 브라우저 호환성 ​

대부분의 ES6+ 기능은 최신 브라우저에서 지원됩니다:

| 기능 | Chrome | Edge | Firefox | Safari |
| const/let | ✅ 49+ | ✅ 12+ | ✅ 36+ | ✅ 10+ |
| 화살표 함수 | ✅ 45+ | ✅ 12+ | ✅ 22+ | ✅ 10+ |
| 템플릿 리터럴 | ✅ 41+ | ✅ 12+ | ✅ 34+ | ✅ 9+ |
| 구조 분해 | ✅ 49+ | ✅ 14+ | ✅ 41+ | ✅ 8+ |
| 스프레드 | ✅ 46+ | ✅ 12+ | ✅ 16+ | ✅ 8+ |
| 옵셔널 체이닝 | ✅ 80+ | ✅ 80+ | ✅ 74+ | ✅ 13.1+ |
UniWORKS는 최신 브라우저를 지원하므로 모든 ES6+ 기능을 안전하게 사용할 수 있습니다.

## 주의사항 ​

개발자는 다음 사항에 유의해야 합니다:

- 과도한 체이닝은 가독성을 해칠 수 있습니다
- 성능이 중요한 부분에서는 기본 for문이 더 빠를 수 있습니다
- 팀의 코딩 스타일에 맞춰 일관성을 유지하세요
- 레거시 코드를 점진적으로 개선하세요

## 요약 ​

ES6+ 기능을 활용하면:

- ✅ 코드가 간결해집니다
- ✅ 가독성이 향상됩니다
- ✅ 버그가 감소합니다
- ✅ 유지보수가 쉬워집니다

## 참고 자료 ​

- MDN - JavaScript 가이드
- ES6 기능 소개
- JavaScript.info