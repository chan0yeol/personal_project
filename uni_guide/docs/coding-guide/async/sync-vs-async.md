# 동기 vs 비동기 ​

동기와 비동기의 차이를 이해하고 올바르게 활용합니다.

## 개요 ​

개발자는 JavaScript의 동기(Synchronous)와 비동기(Asynchronous) 실행 방식의 차이를 정확히 이해해야 합니다. 특히 UniWORKS에서는 서버 통신이 빈번하므로 비동기 처리에 대한 이해가 필수입니다.

## 동기 vs 비동기 ​

### 동기 (Synchronous) ​

코드가 **순차적으로 실행**되며, 한 작업이 끝나야 다음 작업이 시작됩니다.

javascript```
console.log('1. 첫 번째 작업');
console.log('2. 두 번째 작업');
console.log('3. 세 번째 작업');

// 출력:
// 1. 첫 번째 작업
// 2. 두 번째 작업
// 3. 세 번째 작업```
**특징:**

- 코드가 위에서 아래로 순차 실행
- 이전 작업이 완료될 때까지 대기
- 예측 가능하고 이해하기 쉬움
- 오래 걸리는 작업은 전체를 블로킹

### 비동기 (Asynchronous) ​

작업을 **동시에 진행**하며, 완료 시점이 다를 수 있습니다.

javascript```
console.log('1. 첫 번째 작업');

setTimeout(() => {
    console.log('2. 두 번째 작업 (1초 후)');
}, 1000);

console.log('3. 세 번째 작업');

// 출력:
// 1. 첫 번째 작업
// 3. 세 번째 작업
// 2. 두 번째 작업 (1초 후)```
**특징:**

- 작업 완료를 기다리지 않고 다음 코드 실행
- 긴 작업이 전체를 블로킹하지 않음
- 콜백, Promise, async/await으로 처리
- 실행 순서가 예측하기 어려울 수 있음

## UniWORKS에서의 비동기 ​

UniWORKS의 대부분의 서버 통신은 **비동기**로 처리됩니다.

### 서버 데이터 조회 ​

javascript```
// ❌ 잘못된 이해 - 동기적으로 생각
$u.buttons.addHandler({
    "doQuery": function() {
        let gridData; // undefined

        $nst.is_data_ot_data('GET_DATA', $u.getValues(), function(ot_data) {
            gridData = ot_data; // 콜백 안에서 할당
        });

        // ⚠️ 이 시점에 gridData는 아직 undefined!
        console.log(gridData); // undefined
    }
});```
javascript```
// ✅ 올바른 방법 - 비동기 콜백 내에서 처리
$u.buttons.addHandler({
    "doQuery": function() {
        $nst.is_data_ot_data('GET_DATA', $u.getValues(), function(ot_data) {
            // 데이터를 받은 후에 처리
            const gridObj = $u.gridWrapper.getGrid();
            gridObj.setJSONData(ot_data);

            console.log('데이터 로드 완료:', ot_data.length);
        });
    }
});```
### 순차적 서버 호출 ​

여러 서버 호출을 순차적으로 실행해야 하는 경우:

javascript```
// ❌ 문제가 있는 코드 - 순서 보장 안 됨
$u.buttons.addHandler({
    "doProcess": function() {
        let userData;
        let orderData;

        // 첫 번째 호출
        $nst.is_data_os_data('GET_USER', { USER_ID: '001' }, function(os_data) {
            userData = os_data;
        });

        // 두 번째 호출 - userData를 사용하려 하지만 아직 없을 수 있음!
        $nst.is_data_ot_data('GET_ORDERS', { USER_ID: userData.USER_ID }, function(ot_data) {
            orderData = ot_data;
        });
    }
});```
javascript```
// ✅ 올바른 방법 - 중첩 콜백 (순서 보장)
$u.buttons.addHandler({
    "doProcess": function() {
        // 첫 번째 호출
        $nst.is_data_os_data('GET_USER', { USER_ID: '001' }, function(userData) {
            console.log('1. 사용자 정보 조회 완료');

            // 두 번째 호출 - userData를 안전하게 사용
            $nst.is_data_ot_data('GET_ORDERS', { USER_ID: userData.USER_ID }, function(orderData) {
                console.log('2. 주문 정보 조회 완료');

                // 모든 데이터를 받은 후 처리
                processData(userData, orderData);
            });
        });
    }
});```
이 패턴은 작동하지만 중첩이 깊어지면 "콜백 지옥"이 됩니다. 콜백 지옥 탈출하기 가이드를 참고하세요.

## 비동기 처리 방법 ​

### 1. 콜백 함수 ​

가장 기본적인 비동기 처리 방법입니다.

javascript```
function getData(callback) {
    setTimeout(() => {
        const data = { name: 'UniWORKS', version: '6.0' };
        callback(data);
    }, 1000);
}

getData((result) => {
    console.log(result); // { name: 'UniWORKS', version: '6.0' }
});```
**장점:**

- 간단하고 직관적
- 모든 브라우저 지원

**단점:**

- 중첩 시 가독성 저하
- 에러 처리 복잡

### 2. Promise ​

ES6에서 도입된 비동기 처리 객체입니다.

javascript```
function getData() {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const data = { name: 'UniWORKS', version: '6.0' };
            resolve(data);
        }, 1000);
    });
}

getData()
    .then((result) => {
        console.log(result);
    })
    .catch((error) => {
        console.error(error);
    });```
**장점:**

- 체이닝 가능
- 에러 처리 명확
- 콜백 지옥 방지

**단점:**

- 문법이 복잡할 수 있음

### 3. async/await ​

ES2017에서 도입된 가장 현대적인 비동기 처리 방법입니다.

javascript```
async function fetchData() {
    try {
        const result = await getData();
        console.log(result);
    } catch (error) {
        console.error(error);
    }
}

fetchData();```
**장점:**

- 동기 코드처럼 읽힘
- 가장 깔끔한 문법
- 에러 처리 간편

**단점:**

- async 함수 내에서만 사용 가능

자세한 내용은 Promise와 async/await 가이드를 참고하세요.

## 실전 예제 ​

### 예제 1: 데이터 저장 후 재조회 ​

javascript```
$u.buttons.addHandler({
    "doSave": function() {
        const gridObj = $u.gridWrapper.getGrid();

        // 1. 선택된 데이터 가져오기
        gridObj.asserts.rowSelected();
        const selectedData = gridObj.getSELECTEDJSONData();

        // 2. 서버에 저장
        $nst.it_data_returnMessage('SAVE_DATA', selectedData, (message) => {
            unidocuAlert(message, () => {
                // 3. 저장 완료 후 재조회
                $u.buttons.triggerFormTableButtonClick();
            });
        });
    }
});```
### 예제 2: 병렬 처리 ​

여러 서버 호출을 **동시에** 실행하고 모두 완료될 때까지 대기:

javascript```
$u.buttons.addHandler({
    "loadAllData": function() {
        let userData;
        let productData;
        let orderData;
        let completedCount = 0;
        const totalCalls = 3;

        function checkAllComplete() {
            completedCount++;
            if (completedCount === totalCalls) {
                // 모든 데이터가 준비되면 처리
                processAllData(userData, productData, orderData);
            }
        }

        // 세 개의 호출을 동시에 시작
        $nst.is_data_os_data('GET_USER', {}, (data) => {
            userData = data;
            checkAllComplete();
        });

        $nst.is_data_ot_data('GET_PRODUCTS', {}, (data) => {
            productData = data;
            checkAllComplete();
        });

        $nst.is_data_ot_data('GET_ORDERS', {}, (data) => {
            orderData = data;
            checkAllComplete();
        });
    }
});```
Promise.all()을 사용하면 더 깔끔하게 작성할 수 있습니다.

### 예제 3: 타임아웃 처리 ​

javascript```
function fetchDataWithTimeout(timeout = 5000) {
    let timeoutId;
    let isCompleted = false;

    // 타임아웃 설정
    timeoutId = setTimeout(() => {
        if (!isCompleted) {
            unidocuAlert('서버 응답 시간이 초과되었습니다.');
        }
    }, timeout);

    // 서버 호출
    $nst.is_data_ot_data('GET_DATA', {}, (data) => {
        isCompleted = true;
        clearTimeout(timeoutId);

        // 데이터 처리
        const gridObj = $u.gridWrapper.getGrid();
        gridObj.setJSONData(data);
    });
}```
## 자주 하는 실수 ​

### 실수 1: 비동기 결과를 동기적으로 사용 ​

javascript```
// ❌ 잘못된 코드
function getUserData() {
    let result;

    $nst.is_data_os_data('GET_USER', {}, function(data) {
        result = data;
    });

    return result; // undefined 반환!
}

const user = getUserData();
console.log(user.NAME); // 에러!```
javascript```
// ✅ 올바른 방법 - 콜백 사용
function getUserData(callback) {
    $nst.is_data_os_data('GET_USER', {}, function(data) {
        callback(data);
    });
}

getUserData((user) => {
    console.log(user.NAME); // 정상 작동
});```
### 실수 2: 반복문에서 비동기 처리 ​

javascript```
// ❌ 순서가 보장되지 않음
const items = [1, 2, 3, 4, 5];

items.forEach((item) => {
    $nst.is_data_returnMessage('PROCESS_ITEM', { ITEM_NO: item }, (message) => {
        console.log(message); // 순서대로 출력되지 않을 수 있음
    });
});```
javascript```
// ✅ 순차 처리가 필요한 경우
async function processItemsSequentially() {
    const items = [1, 2, 3, 4, 5];

    for (const item of items) {
        await processItem(item);
    }
}

function processItem(itemNo) {
    return new Promise((resolve) => {
        $nst.is_data_returnMessage('PROCESS_ITEM', { ITEM_NO: itemNo }, (message) => {
            console.log(message);
            resolve();
        });
    });
}```
### 실수 3: 에러 처리 누락 ​

javascript```
// ❌ 에러 처리 없음
$nst.is_data_ot_data('GET_DATA', {}, function(data) {
    const gridObj = $u.gridWrapper.getGrid();
    gridObj.setJSONData(data);
});```
javascript```
// ✅ 에러 처리 추가
$nst.is_data_ot_data('GET_DATA', {}, function(data) {
    try {
        if (!data || data.length === 0) {
            unidocuAlert('조회된 데이터가 없습니다.');
            return;
        }

        const gridObj = $u.gridWrapper.getGrid();
        gridObj.setJSONData(data);
    } catch (error) {
        console.error('데이터 처리 오류:', error);
        unidocuAlert('데이터 처리 중 오류가 발생했습니다.');
    }
});```
## 동기 vs 비동기 선택 가이드 ​

| 상황 | 권장 방식 | 이유 |
| 서버 통신 | 비동기 | UI 블로킹 방지 |
| 간단한 계산 | 동기 | 불필요한 복잡도 방지 |
| 파일 업로드 | 비동기 | 사용자 경험 향상 |
| 배열 변환 | 동기 | 즉시 결과 필요 |
| 여러 API 호출 | 비동기 | 성능 최적화 |
## 요약 ​

개발자는 다음 사항을 기억해야 합니다:

- 서버 통신은 항상 비동기입니다
- 비동기 결과는 콜백 내에서 처리해야 합니다
- 순차 처리가 필요하면 중첩 콜백 또는 async/await 사용
- 병렬 처리가 가능하면 동시에 호출하여 성능 향상
- 항상 에러 처리를 고려하세요

## 다음 단계 ​

- Promise와 async/await - 현대적인 비동기 처리
- 콜백 지옥 탈출하기 - 중첩 콜백 리팩토링

## 참고 자료 ​

- MDN - 비동기 JavaScript
- JavaScript 이벤트 루프