# const/let 활용 가이드 ​

앞으로의 코드 작성 시 const와 let을 활용하여 더 안전하고 예측 가능한 코드를 작성하는 방법을 알아봅니다.

## 개요 ​

UniWORKS는 과거 IE 지원을 위해 `var`를 사용해왔습니다. 이는 당시 브라우저 호환성을 위한 올바른 선택이었습니다.

이제는 모던 브라우저 환경에서 ES6의 `const`와 `let`을 활용하면 다음과 같은 장점을 얻을 수 있습니다:

- 🎯 명확한 의도 표현: 변수가 재할당되는지 한눈에 파악
- 🔒 안전한 코드: 의도하지 않은 재할당 방지
- 📦 블록 스코프: 변수의 유효 범위가 명확해짐
- 🐛 버그 감소: 호이스팅 관련 오류 예방

앞으로 새로운 코드를 작성할 때는 `const`와 `let` 사용을 권장합니다.

## var 대신 const/let을 사용하면 좋은 이유 ​

### 1. 블록 스코프로 변수 범위가 명확해집니다 ​

**기존 방식 (var)**:

javascript```
if (true) {
    var status = 'Active';
}
console.log(status); // 'Active' - 블록 밖에서도 접근됨```
**권장 방식 (const/let)**:

javascript```
if (true) {
    const status = 'Active';
}
console.log(status); // ReferenceError - 블록 스코프로 안전하게 격리```
**장점**: 변수가 사용되는 범위가 명확하여 의도하지 않은 접근을 방지할 수 있습니다.

### 2. 변수 선언 전 사용을 방지합니다 ​

**기존 방식 (var)**:

javascript```
console.log(count); // undefined - 호이스팅으로 에러가 발생하지 않음
var count = 10;```
**권장 방식 (const/let)**:

javascript```
console.log(count); // ReferenceError - TDZ(Temporal Dead Zone)로 명확한 에러 발생
const count = 10;```
**장점**: 선언 전 사용 시 즉시 에러가 발생하여 버그를 조기에 발견할 수 있습니다.

### 3. 실수로 인한 재선언을 방지합니다 ​

**기존 방식 (var)**:

javascript```
var userId = 'USER001';
// ... 100줄 후
var userId = 'USER002'; // 재선언되어도 에러 없음```
**권장 방식 (const/let)**:

javascript```
const userId = 'USER001';
const userId = 'USER002'; // SyntaxError - 재선언 불가```
**장점**: 같은 이름의 변수를 실수로 재선언하는 것을 방지할 수 있습니다.

## const와 let, 언제 사용하면 좋을까요? ​

### const 사용을 기본으로 (권장) ​

재할당이 필요 없는 경우 `const`를 사용하면 코드의 의도가 명확해집니다:

javascript```
// 재할당하지 않는 변수
const userId = $u.get('USER_ID');
const maxCount = 100;
const gridData = gridObj.getData();

// 객체/배열도 재할당하지 않으면 const 사용
const user = {
    id: 'USER001',
    name: '홍길동'
};
user.name = '김철수'; // 👍 내부 속성 변경은 가능

const items = [];
items.push('item1'); // 👍 배열 요소 추가도 가능```
**장점**:

- 이 변수가 재할당되지 않음을 명확히 표현
- 다른 개발자가 코드를 읽을 때 의도 파악이 쉬움

### let 사용 (재할당이 필요한 경우) ​

값이 변경되어야 하는 경우에만 `let`을 사용합니다:

javascript```
// 루프 카운터
for (let i = 0; i  data.length; i++) {
    console.log(data[i]);
}

// 조건에 따라 값이 변경되는 경우
let status = 'pending';
if (result.success) {
    status = 'completed';
}

// 누적 계산
let totalAmount = 0;
gridData.forEach(row => {
    totalAmount += Number(row.AMOUNT);
});```
**장점**:

- 이 변수가 변경될 수 있음을 표현
- 재할당이 필요한 로직을 명확히 드러냄

## 실무 적용 예제 ​

💡 **참고**: 아래 예제는 일반소스(`D:\unidocu\unidocu6\unidocu6`)의 실제 코드를 기반으로 작성되었습니다. 기존 코드를 비판하는 것이 아니라, 앞으로 새로운 코드를 작성할 때 참고할 수 있는 권장 패턴입니다.

## 실전 예제 ​

### 예제 1: 그리드와 페이지 파라미터 초기화 ​

**참고 소스**: `uni-e-fi/view/UD_0201_001.js:17-18` (법인카드 전표등록)

**기존 스타일 (var)**:

javascript```
var gridObj = $u.gridWrapper.getGrid();
var pageParams = $u.page.getPageParams();```
**권장 스타일 (const)**:

javascript```
const gridObj = $u.gridWrapper.getGrid();
const pageParams = $u.page.getPageParams();```
**이렇게 하면 좋은 점**:

- ✨ `gridObj`와 `pageParams`가 재할당되지 않음을 명확히 표현
- ✨ 그리드 객체와 페이지 파라미터는 초기화 후 변경되지 않는 것이 일반적
- ✨ 다른 개발자가 코드를 읽을 때 이 변수들이 불변임을 즉시 인식

### 예제 2: 그리드 초기화와 설정 ​

**참고 소스**: `uni-e-fi/view/UD_0220_001.js:43-44` (출장비 신청)

**기존 스타일 (var)**:

javascript```
var gridObj = $u.gridWrapper.getGrid();
gridObj.fitToWindowSize();```
**권장 스타일 (const)**:

javascript```
const gridObj = $u.gridWrapper.getGrid();
gridObj.fitToWindowSize();```
**이렇게 하면 좋은 점**:

- ✨ 그리드 객체 자체는 재할당되지 않음
- ✨ 객체의 메서드를 호출하는 것은 재할당이 아니므로 `const` 사용 가능
- ✨ 코드 의도가 명확해짐

### 예제 3: 설정값과 그리드 객체 초기화 ​

**참고 소스**: `uni-e-approval/view/DRAFT_0061.js:15-22`

**기존 스타일 (var)**:

javascript```
var useAttachSetting = $u.programSetting.getValue('첨부파일 사용(yes/no) 빈값은 경우 ATTACH 설정 따름');
var $fileAttachWrapper = $('#file-attach-wrapper');
if(useAttachSetting === 'yes') $fileAttachWrapper.show();
else if(useAttachSetting === 'no') $fileAttachWrapper.hide();

var gridObj = $u.gridWrapper.getGrid('DRAFT_0061-grid');
var gridObj3 = $u.gridWrapper.getGrid('DRAFT_0061-grid3');```
**권장 스타일 (const)**:

javascript```
const useAttachSetting = $u.programSetting.getValue('첨부파일 사용(yes/no) 빈값은 경우 ATTACH 설정 따름');
const $fileAttachWrapper = $('#file-attach-wrapper');
if(useAttachSetting === 'yes') $fileAttachWrapper.show();
else if(useAttachSetting === 'no') $fileAttachWrapper.hide();

const gridObj = $u.gridWrapper.getGrid('DRAFT_0061-grid');
const gridObj3 = $u.gridWrapper.getGrid('DRAFT_0061-grid3');```
**이렇게 하면 좋은 점**:

- ✨ 변수가 재할당되지 않음을 명확히 표현
- ✨ 다른 개발자가 코드를 읽을 때 "이 변수는 바뀌지 않는구나" 하고 바로 이해
- ✨ 실수로 재할당하는 것을 컴파일 단계에서 방지

### 예제 4: 여러 그리드 객체 초기화 ​

**참고 소스**: `uni-e-approval/view/DRAFT_0061.js:21-22` (출장비정산)

**기존 스타일 (var)**:

javascript```
var gridObj = $u.gridWrapper.getGrid('DRAFT_0061-grid');
var gridObj3 = $u.gridWrapper.getGrid('DRAFT_0061-grid3');```
**권장 스타일 (const)**:

javascript```
const gridObj = $u.gridWrapper.getGrid('DRAFT_0061-grid');
const gridObj3 = $u.gridWrapper.getGrid('DRAFT_0061-grid3');```
**이렇게 하면 좋은 점**:

- ✨ 여러 그리드를 사용하는 화면에서도 `const`로 명확히 표현
- ✨ 각 그리드 객체가 재할당되지 않음을 보장
- ✨ `gridObj`와 `gridObj3` 같은 명명으로 구별

### 예제 5: 필수 필드 리스트와 플래그 변수 ​

**참고 소스**: `uni-e-approval/view/DRAFT_0030.js` (예산변경 품의)

**기존 스타일 (var)**:

javascript```
var requireList = ['TMON','TKOSTL', 'THKONT'];
var flag;
if (someCondition) {
    flag = true;
} else {
    flag = false;
}```
**권장 스타일 (const/let)**:

javascript```
const requireList = ['TMON','TKOSTL', 'THKONT'];
let flag;
if (someCondition) {
    flag = true;
} else {
    flag = false;
}```
**이렇게 하면 좋은 점**:

- ✨ 필수 필드 목록은 변경되지 않으므로 `const` 사용
- ✨ 조건에 따라 값이 변경되는 `flag`는 `let` 사용
- ✨ 변수의 성격(불변 vs 가변)을 선언만으로 파악 가능

### 예제 6: 루프 변수에 let 활용 ​

**참고 소스**: `uni-e-fi/view/UD_0220_001.js:68` (출장비 신청)

**기존 스타일 (var)**:

javascript```
for (var i = startRowIndex, len = endRowIndex; i  len; i++) {
    if (columnKey === 'LAND1') {
        gridObj.$V('D_GRADE', i, gridObj.getCachedCodeMap('LAND1')[gridObj.$V(columnKey, i)]['D_GRADE']);
    }
    if (/DATE$/.test(columnKey)) {
        gridObj.triggerChangeCell(columnKey, i);
    }
}```
**권장 스타일 (let)**:

javascript```
for (let i = startRowIndex, len = endRowIndex; i  len; i++) {
    if (columnKey === 'LAND1') {
        gridObj.$V('D_GRADE', i, gridObj.getCachedCodeMap('LAND1')[gridObj.$V(columnKey, i)]['D_GRADE']);
    }
    if (/DATE$/.test(columnKey)) {
        gridObj.triggerChangeCell(columnKey, i);
    }
}```
**이렇게 하면 좋은 점**:

- ✨ 루프 변수 `i`와 `len`이 루프 블록 내에서만 유효
- ✨ 루프 밖에서 실수로 `i`에 접근하는 것을 방지
- ✨ 블록 스코프로 변수 범위가 명확

### 예제 7: 조건부 변수 ​

javascript```
// ❌ var 사용
var message;
if (result.success) {
    message = '성공했습니다.';
} else {
    message = '실패했습니다.';
}

// ✅ const 사용 (삼항 연산자)
const message = result.success
    ? '성공했습니다.'
    : '실패했습니다.';```
## 변환 단계별 가이드 ​

### 1단계: 변경되지 않는 변수 찾기 ​

javascript```
// 변경 전
var userId = 'USER001';
var gridData = gridObj.getData();

// ↓ const로 변경 가능 여부 확인
// userId가 재할당되는가? → 아니오 → const
// gridData가 재할당되는가? → 아니오 → const

// 변경 후
const userId = 'USER001';
const gridData = gridObj.getData();```
### 2단계: 재할당이 필요한 변수는 let ​

javascript```
// 변경 전
var total = 0;
for (var i = 0; i  data.length; i++) {
    total += data[i].amount;
}

// ↓ 재할당 여부 확인
// total이 재할당되는가? → 예 → let
// i가 재할당되는가? → 예 → let

// 변경 후
let total = 0;
for (let i = 0; i  data.length; i++) {
    total += data[i].amount;
}```
### 3단계: 스코프 확인 ​

javascript```
// 변경 전
for (var i = 0; i  10; i++) {
    // ...
}
console.log(i); // 10 - 의도하지 않은 접근

// 변경 후
for (let i = 0; i  10; i++) {
    // ...
}
console.log(i); // ReferenceError - 명확한 에러```
## 주의사항 ​

### 1. const는 재할당 금지, 불변(immutable)이 아님 ​

javascript```
const user = { name: '홍길동' };
user.name = '김철수'; // ✅ OK - 객체 내부 수정 가능
user = { name: '이영희' }; // ❌ Error - 재할당 불가

const items = [1, 2, 3];
items.push(4); // ✅ OK - 배열 내부 수정 가능
items = [5, 6, 7]; // ❌ Error - 재할당 불가```
### 2. 루프에서는 항상 let 사용 ​

javascript```
// ❌ const는 루프에서 재할당 에러
for (const i = 0; i  10; i++) { // TypeError
    console.log(i);
}

// ✅ let 사용
for (let i = 0; i  10; i++) {
    console.log(i);
}

// ✅ const는 for...of에서 사용 가능 (매 반복마다 새로운 바인딩)
const items = [1, 2, 3];
for (const item of items) {
    console.log(item); // OK
}```
### 3. 선언 전 사용 불가 (TDZ) ​

javascript```
// var는 undefined 반환
console.log(count); // undefined
var count = 10;

// const/let은 ReferenceError
console.log(count); // ReferenceError
const count = 10;```
## 마이그레이션 체크리스트 ​

프로젝트에서 var를 const/let으로 변환할 때:

- [ ] 모든 `var` 선언을 찾기 (IDE 검색 기능 활용)
- [ ] 각 변수가 재할당되는지 확인
- [ ] 재할당 없음 → `const`
- [ ] 재할당 있음 → `let`
- [ ] 테스트 실행으로 동작 확인
- [ ] 스코프 문제가 없는지 확인 (특히 루프, 클로저)

## 참고 자료 ​

- MDN: const
- MDN: let