# 함수형 프로그래밍 ​

JavaScript의 함수형 프로그래밍 패러다임을 이해하고, UniWORKS 개발에 실전 적용하는 방법을 배웁니다.

## 개요 ​

JavaScript는 **함수를 일급 객체(First-class Object)**로 취급하는 멀티 패러다임 언어입니다. 이는 함수를 변수에 할당하고, 인자로 전달하고, 반환값으로 사용할 수 있다는 의미입니다.

함수형 프로그래밍은 단순한 코딩 스타일이 아닌, **더 안전하고 예측 가능한 코드를 작성하는 사고방식**입니다.

### 왜 함수형 프로그래밍인가? ​

- 버그 감소: 순수 함수와 불변성으로 예측 가능한 코드 작성
- 테스트 용이성: 사이드 이펙트가 없어 단위 테스트가 쉬움
- 가독성 향상: 선언적 코드로 의도가 명확히 드러남
- 유지보수성: 함수 재사용과 조합으로 확장이 용이

## 핵심 개념 ​

### 1. 순수 함수 (Pure Function) ​

순수 함수는 **같은 입력에 항상 같은 출력을 반환**하고, **외부 상태를 변경하지 않는** 함수입니다.

javascript```
// ❌ 순수하지 않은 함수
let total = 0;
function addToTotal(value) {
    total += value;  // 외부 상태 변경
    return total;
}

// ✅ 순수 함수
function add(a, b) {
    return a + b;  // 입력만으로 출력 결정, 외부 영향 없음
}```
**UniWORKS 실전 예제:**

javascript```
// ❌ 외부 상태에 의존
let taxRate = 0.1;
function calculateTax(amount) {
    return amount * taxRate;  // 외부 변수에 의존
}

// ✅ 순수 함수로 개선
function calculateTax(amount, taxRate) {
    return amount * taxRate;  // 모든 의존성을 매개변수로
}

// 사용
const amount = parseFloat($u.get('WRBTR'));
const tax = calculateTax(amount, 0.1);```
### 2. 불변성 (Immutability) ​

데이터를 직접 수정하지 않고, **새로운 데이터를 생성**하는 방식입니다.

javascript```
// ❌ 원본 데이터 직접 수정
const data = gridObj.getData();
data[0].STATUS = 'APPROVED';  // 원본 수정

// ✅ 불변성 유지
const data = gridObj.getData();
const updatedData = data.map((item, index) =>
    index === 0 ? { ...item, STATUS: 'APPROVED' } : item
);```
**왜 중요한가?**

- 예상치 못한 버그 방지
- 데이터 변경 추적 가능
- 시간 여행 디버깅 지원

### 3. 고차 함수 (Higher-Order Function) ​

함수를 인자로 받거나 함수를 반환하는 함수입니다.

javascript```
// 고차 함수 예제
function createValidator(minValue) {
    return function(value) {
        return value >= minValue;
    };
}

// 사용
const isAdult = createValidator(19);
console.log(isAdult(20));  // true
console.log(isAdult(15));  // false```
## 주요 함수형 메서드 ​

### 1. map() - 변환 ​

배열의 각 요소를 **변환**하여 새로운 배열을 생성합니다.

javascript```
// ❌ 명령형 방식
const data = gridObj.getData();
const amounts = [];
for (let i = 0; i  data.length; i++) {
    amounts.push(parseFloat(data[i].WRBTR));
}

// ✅ 함수형 방식
const amounts = gridObj.getData()
    .map(item => parseFloat(item.WRBTR));```
**실전 활용:**

javascript```
// 그리드 데이터를 API 전송 형식으로 변환
const apiData = gridObj.getData().map(item => ({
    companyCode: item.BUKRS,
    amount: parseFloat(item.WRBTR),
    currency: item.WAERS,
    status: item.STATUS === 'A' ? 'active' : 'inactive'
}));```
### 2. filter() - 필터링 ​

조건에 맞는 요소만 **선택**하여 새로운 배열을 생성합니다.

javascript```
// ❌ 명령형 방식
const activeItems = [];
const data = gridObj.getData();
for (let i = 0; i  data.length; i++) {
    if (data[i].STATUS === 'A') {
        activeItems.push(data[i]);
    }
}

// ✅ 함수형 방식
const activeItems = gridObj.getData()
    .filter(item => item.STATUS === 'A');```
**실전 활용:**

javascript```
// 승인된 항목 중 금액이 1000 이상인 것만 추출
const approvedLargeItems = gridObj.getData()
    .filter(item => item.STATUS === 'APPROVED')
    .filter(item => parseFloat(item.WRBTR) >= 1000);

// 또는 조건을 조합
const approvedLargeItems = gridObj.getData()
    .filter(item =>
        item.STATUS === 'APPROVED' &&
        parseFloat(item.WRBTR) >= 1000
    );```
### 3. reduce() - 집계 ​

배열의 요소들을 **하나의 값으로 축약**합니다.

javascript```
// ❌ 명령형 방식
let totalAmount = 0;
const data = gridObj.getData();
for (let i = 0; i  data.length; i++) {
    totalAmount += parseFloat(data[i].WRBTR);
}

// ✅ 함수형 방식
const totalAmount = gridObj.getData()
    .reduce((sum, item) => sum + parseFloat(item.WRBTR), 0);```
**실전 활용:**

javascript```
// 통화별 합계 계산
const sumByCurrency = gridObj.getData().reduce((acc, item) => {
    const currency = item.WAERS;
    const amount = parseFloat(item.WRBTR);

    acc[currency] = (acc[currency] || 0) + amount;
    return acc;
}, {});

// 결과: { KRW: 5000000, USD: 10000, EUR: 8000 }```
### 4. 메서드 체이닝 ​

여러 함수형 메서드를 연결하여 복잡한 로직을 표현합니다.

javascript```
// 승인된 항목 중 금액이 1000 이상인 것들의 합계
const total = gridObj.getData()
    .filter(item => item.STATUS === 'APPROVED')
    .filter(item => parseFloat(item.WRBTR) >= 1000)
    .reduce((sum, item) => sum + parseFloat(item.WRBTR), 0);

// 더 나은 가독성을 위한 리팩토링
const isApproved = item => item.STATUS === 'APPROVED';
const isLargeAmount = item => parseFloat(item.WRBTR) >= 1000;
const sumAmount = (sum, item) => sum + parseFloat(item.WRBTR);

const total = gridObj.getData()
    .filter(isApproved)
    .filter(isLargeAmount)
    .reduce(sumAmount, 0);```
## 실전 패턴 ​

### 1. 데이터 검증 파이프라인 ​

javascript```
// 검증 함수들
const validators = {
    hasCompanyCode: item => item.BUKRS && item.BUKRS.trim() !== '',
    hasAmount: item => item.WRBTR && !isNaN(parseFloat(item.WRBTR)),
    hasCurrency: item => item.WAERS && item.WAERS.length === 3,
    isValidStatus: item => ['A', 'P', 'R'].includes(item.STATUS)
};

// 모든 검증 통과 확인
function validateAll(item) {
    return Object.values(validators).every(validator => validator(item));
}

// 사용
const validData = gridObj.getData().filter(validateAll);
const invalidData = gridObj.getData().filter(item => !validateAll(item));

if (invalidData.length > 0) {
    console.log('검증 실패 항목:', invalidData);
}```
### 2. 데이터 변환 파이프라인 ​

javascript```
// 변환 함수들
const transformers = {
    normalizeCompanyCode: item => ({
        ...item,
        BUKRS: item.BUKRS.padStart(4, '0')
    }),

    parseAmount: item => ({
        ...item,
        WRBTR: parseFloat(item.WRBTR) || 0
    }),

    addTimestamp: item => ({
        ...item,
        PROCESSED_AT: new Date().toISOString()
    })
};

// 파이프라인 함수
function pipe(...fns) {
    return (value) => fns.reduce((acc, fn) => fn(acc), value);
}

// 사용
const transform = pipe(
    transformers.normalizeCompanyCode,
    transformers.parseAmount,
    transformers.addTimestamp
);

const processedData = gridObj.getData().map(transform);```
### 3. 조건부 실행 ​

javascript```
// 고차 함수로 조건부 로직 추상화
function when(predicate, fn) {
    return (value) => predicate(value) ? fn(value) : value;
}

// 사용
const processLargeAmount = when(
    item => parseFloat(item.WRBTR) > 10000,
    item => ({ ...item, NEEDS_APPROVAL: true })
);

const data = gridObj.getData().map(processLargeAmount);```
## 성능 고려사항 ​

### 1. 지연 평가 (Lazy Evaluation) ​

배열 메서드는 즉시 평가(Eager Evaluation)되므로, 큰 데이터셋에서는 주의가 필요합니다.

javascript```
// ❌ 매번 새 배열 생성 (성능 저하)
const result = gridObj.getData()
    .filter(item => item.STATUS === 'A')    // 전체 순회
    .filter(item => parseFloat(item.WRBTR) > 1000)  // 전체 순회
    .map(item => item.BUKRS);              // 전체 순회

// ✅ 조건 합치기 (한 번만 순회)
const result = gridObj.getData()
    .filter(item =>
        item.STATUS === 'A' &&
        parseFloat(item.WRBTR) > 1000
    )
    .map(item => item.BUKRS);```
### 2. 조기 종료 ​

`some()`, `every()`, `find()` 등은 조건을 만족하면 즉시 종료합니다.

javascript```
// 하나라도 잘못된 데이터가 있는지 확인
const hasInvalidData = gridObj.getData()
    .some(item => !item.BUKRS || !item.WRBTR);

// 모든 데이터가 유효한지 확인
const allValid = gridObj.getData()
    .every(item => item.BUKRS && item.WRBTR);

// 첫 번째 매칭 항목 찾기
const firstApproved = gridObj.getData()
    .find(item => item.STATUS === 'APPROVED');```
## 주니어 개발자를 위한 학습 로드맵 ​

### 1단계: 기본 개념 이해 (1-2주) ​

**학습 목표:**

- 순수 함수의 개념과 이점 이해
- 불변성의 중요성 인식
- 일급 함수의 의미 파악

**실습:**

javascript```
// 명령형 코드를 함수형으로 리팩토링 연습
// AS-IS (명령형)
function getTotalAmount() {
    let total = 0;
    for (let i = 0; i  data.length; i++) {
        if (data[i].STATUS === 'A') {
            total += parseFloat(data[i].WRBTR);
        }
    }
    return total;
}

// TO-BE (함수형)
function getTotalAmount() {
    return data
        .filter(item => item.STATUS === 'A')
        .reduce((sum, item) => sum + parseFloat(item.WRBTR), 0);
}```
### 2단계: 배열 메서드 마스터 (2-3주) ​

**학습 목표:**

- `map`, `filter`, `reduce` 완전 숙지
- `some`, `every`, `find`, `findIndex` 활용
- 메서드 체이닝 패턴 이해

**실습:**

javascript```
// 프로젝트에서 다음 패턴 적극 활용
// 1. for 루프를 map/filter로 변경
// 2. 중첩 반복문을 flatMap으로 단순화
// 3. 조건부 집계를 reduce로 처리```
### 3단계: 고차 함수 작성 (3-4주) ​

**학습 목표:**

- 함수를 반환하는 함수 작성
- 커링(Currying)과 부분 적용(Partial Application)
- 함수 합성(Function Composition)

**실습:**

javascript```
// 재사용 가능한 유틸리티 함수 작성
const createFieldGetter = (fieldName) => (item) => item[fieldName];
const createFieldValidator = (fieldName, validator) => (item) => validator(item[fieldName]);

// 사용
const getBUKRS = createFieldGetter('BUKRS');
const isValidAmount = createFieldValidator('WRBTR', amount => amount > 0);

const companyCodes = data.map(getBUKRS);
const validItems = data.filter(isValidAmount);```
### 4단계: 실전 프로젝트 적용 (진행 중) ​

**방향성:**

- 점진적 리팩토링: 한 번에 모든 코드를 바꾸지 말고, 새로운 기능부터 적용
- 팀 코드 리뷰: 동료의 함수형 코드를 읽고 이해하는 연습
- 성능 측정: 함수형으로 바꾼 후 실제 성능 개선 확인
- 에러 처리: `try-catch`와 함수형 에러 처리 조합

## 흔한 실수와 해결 ​

### 실수 1: 부수 효과(Side Effect) 무시 ​

javascript```
// ❌ map 안에서 외부 상태 변경
let total = 0;
data.map(item => {
    total += parseFloat(item.WRBTR);  // 부수 효과!
    return item;
});

// ✅ 부수 효과 없이 처리
const total = data.reduce((sum, item) => sum + parseFloat(item.WRBTR), 0);```
### 실수 2: 원본 배열 수정 ​

javascript```
// ❌ 원본 배열 정렬 (원본 변경)
const sorted = data.sort((a, b) => a.WRBTR - b.WRBTR);

// ✅ 복사본 생성 후 정렬
const sorted = [...data].sort((a, b) => a.WRBTR - b.WRBTR);
// 또는
const sorted = data.slice().sort((a, b) => a.WRBTR - b.WRBTR);```
### 실수 3: 과도한 체이닝 ​

javascript```
// ❌ 읽기 어려운 긴 체이닝
const result = data.filter(x => x.STATUS === 'A').map(x => ({ ...x, amount: parseFloat(x.WRBTR) })).filter(x => x.amount > 1000).reduce((acc, x) => acc + x.amount, 0);

// ✅ 적절한 줄바꿈과 변수 사용
const result = data
    .filter(x => x.STATUS === 'A')
    .map(x => ({ ...x, amount: parseFloat(x.WRBTR) }))
    .filter(x => x.amount > 1000)
    .reduce((acc, x) => acc + x.amount, 0);

// ✅ 또는 중간 변수로 분리
const activeItems = data.filter(x => x.STATUS === 'A');
const parsedItems = activeItems.map(x => ({ ...x, amount: parseFloat(x.WRBTR) }));
const largeItems = parsedItems.filter(x => x.amount > 1000);
const total = largeItems.reduce((acc, x) => acc + x.amount, 0);```
### 추천 학습 자료 ​

- MDN - Array Methods
- JavaScript.info - Array Methods
- 책: "함수형 자바스크립트 프로그래밍" - 유인동

### 실습 사이트 ​

- JavaScript Array Explorer
- CodeWars - 함수형 문제 풀기

## 마무리 ​

함수형 프로그래밍은 **더 나은 개발자가 되기 위한 여정**입니다. 완벽하게 익히려 하지 말고, 오늘 하나씩 적용해보세요.

**오늘부터 시작하기:**

- 다음 작업에서 `for` 루프 대신 `map`/`filter` 사용해보기
- 변수 직접 수정 대신 새 객체/배열 생성하기
- 재사용 가능한 작은 함수 하나 만들어보기

**기억하세요:**

- 읽기 쉬운 코드가 좋은 코드입니다
- 성능도 중요하지만, 먼저 명확하게 작성하세요
- 팀원과 코드를 공유하고 피드백을 받으세요