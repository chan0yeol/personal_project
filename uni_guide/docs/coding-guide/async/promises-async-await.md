# Promise와 async/await ​

jQuery Deferred를 대체하는 현대적이고 표준적인 비동기 처리 방법을 배웁니다.

## 개요 ​

UniWORKS 프로젝트에서 jQuery의 `Deferred`와 `$.when()`을 사용하는 코드를 자주 볼 수 있습니다. 하지만 이는 구식 방법이며, 현대 JavaScript의 **Promise**와 **async/await**을 사용하면 더 깔끔하고 안전한 코드를 작성할 수 있습니다.

## jQuery Deferred의 문제점 ​

### 문제 1: 표준이 아님 ​

jQuery Deferred는 jQuery에 종속된 비표준 API입니다.

javascript```
// ❌ jQuery Deferred - 비표준
const deferred = $.Deferred();

setTimeout(() => {
    deferred.resolve('완료');
}, 1000);

deferred.done((result) => {
    console.log(result);
});```
### 문제 2: 에러 처리가 불명확 ​

javascript```
// ❌ fail, always, then 등 여러 메서드가 혼재
$.ajax('/api/data')
    .done(function(data) {
        console.log('성공:', data);
    })
    .fail(function(error) {
        console.log('실패:', error);
    })
    .always(function() {
        console.log('항상 실행');
    });```
### 문제 3: 체이닝이 직관적이지 않음 ​

javascript```
// ❌ jQuery $.when - 복잡함
$.when(
    $.ajax('/api/user'),
    $.ajax('/api/orders')
).then(function(userData, ordersData) {
    // userData[0]이 실제 데이터 (배열 래핑)
    console.log(userData[0]);
    console.log(ordersData[0]);
});```
## Promise - 표준 방식 ​

Promise는 ES6(ES2015)에 도입된 **JavaScript 표준** 비동기 처리 객체입니다.

### 기본 문법 ​

javascript```
// Promise 생성
const myPromise = new Promise((resolve, reject) => {
    setTimeout(() => {
        const success = true;

        if (success) {
            resolve('성공 데이터');
        } else {
            reject('에러 발생');
        }
    }, 1000);
});

// Promise 사용
myPromise
    .then((result) => {
        console.log('성공:', result);
    })
    .catch((error) => {
        console.error('실패:', error);
    })
    .finally(() => {
        console.log('완료');
    });```
### UniWORKS 서버 호출을 Promise로 래핑 ​

UniWORKS의 `$nst.*` 함수는 콜백 기반이므로 Promise로 래핑하면 더 편리합니다:

javascript```
// ✅ Promise 래퍼 함수 만들기
function fetchData(funcName, params) {
    return new Promise((resolve, reject) => {
        $nst.is_data_ot_data(funcName, params, (data) => {
            if (data && data.length >= 0) {
                resolve(data);
            } else {
                reject(new Error('데이터 조회 실패'));
            }
        });
    });
}

// 사용
fetchData('GET_USER_DATA', { USER_ID: '001' })
    .then((data) => {
        console.log('데이터:', data);
        const gridObj = $u.gridWrapper.getGrid();
        gridObj.setJSONData(data);
    })
    .catch((error) => {
        console.error('에러:', error);
        unidocuAlert('데이터 조회 중 오류가 발생했습니다.');
    });```
### Promise 체이닝 ​

여러 비동기 작업을 순차적으로 실행:

javascript```
// ✅ Promise 체이닝
fetchData('GET_USER', { USER_ID: '001' })
    .then((userData) => {
        console.log('1. 사용자 정보 조회 완료');
        // 다음 호출로 userData 전달
        return fetchData('GET_ORDERS', { USER_ID: userData.USER_ID });
    })
    .then((ordersData) => {
        console.log('2. 주문 정보 조회 완료');
        return processOrders(ordersData);
    })
    .then((result) => {
        console.log('3. 처리 완료:', result);
    })
    .catch((error) => {
        console.error('에러 발생:', error);
    });```
### Promise.all - 병렬 처리 ​

여러 비동기 작업을 **동시에** 실행하고 모두 완료될 때까지 대기:

javascript```
// ✅ Promise.all - 동시 실행
Promise.all([
    fetchData('GET_USER', { USER_ID: '001' }),
    fetchData('GET_PRODUCTS', {}),
    fetchData('GET_ORDERS', {})
])
.then(([userData, productsData, ordersData]) => {
    console.log('모든 데이터 로드 완료');
    console.log('사용자:', userData);
    console.log('상품:', productsData);
    console.log('주문:', ordersData);
})
.catch((error) => {
    console.error('하나라도 실패하면 에러:', error);
});```
`Promise.all`은 하나라도 실패하면 전체가 실패합니다.

### Promise.allSettled - 실패해도 계속 ​

모든 Promise의 결과를 받고 싶을 때 (일부 실패해도 OK):

javascript```
// ✅ Promise.allSettled - 실패해도 계속
Promise.allSettled([
    fetchData('GET_USER', { USER_ID: '001' }),
    fetchData('GET_PRODUCTS', {}),
    fetchData('GET_INVALID', {}) // 이것이 실패해도 계속 진행
])
.then((results) => {
    results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
            console.log(`${index}번 성공:`, result.value);
        } else {
            console.log(`${index}번 실패:`, result.reason);
        }
    });
});```
## async/await - 더 깔끔한 문법 ​

ES2017에 도입된 `async/await`은 Promise를 **동기 코드처럼** 작성할 수 있게 해줍니다.

### 기본 문법 ​

javascript```
// ✅ async/await
async function loadUserData() {
    try {
        const userData = await fetchData('GET_USER', { USER_ID: '001' });
        console.log('사용자 정보:', userData);

        const ordersData = await fetchData('GET_ORDERS', { USER_ID: userData.USER_ID });
        console.log('주문 정보:', ordersData);

        return { user: userData, orders: ordersData };
    } catch (error) {
        console.error('에러:', error);
        throw error;
    }
}

// 사용
loadUserData()
    .then((result) => {
        console.log('완료:', result);
    })
    .catch((error) => {
        unidocuAlert('데이터 로드 실패');
    });```
### 실전 예제: 버튼 클릭 핸들러 ​

javascript```
// ✅ async/await을 활용한 버튼 핸들러
async function handleSaveButton() {
    try {
        const gridObj = $u.gridWrapper.getGrid();

        // 1. 검증
        gridObj.asserts.rowSelected();
        const selectedData = gridObj.getSELECTEDJSONData();

        // 2. 저장
        const saveResult = await saveData('SAVE_FUNCTION', selectedData);
        console.log('저장 완료:', saveResult);

        // 3. 재조회
        const newData = await fetchData('GET_DATA', {});
        gridObj.setJSONData(newData);

        unidocuAlert('저장이 완료되었습니다.');
    } catch (error) {
        console.error('저장 실패:', error);
        unidocuAlert('저장 중 오류가 발생했습니다.');
    }
}

// Promise 래퍼
function saveData(funcName, data) {
    return new Promise((resolve, reject) => {
        $nst.it_data_returnMessage(funcName, data, (message) => {
            resolve(message);
        });
    });
}```
### 병렬 처리 with async/await ​

javascript```
// ✅ 병렬 처리
async function loadAllData() {
    try {
        // 동시 실행
        const [userData, productsData, ordersData] = await Promise.all([
            fetchData('GET_USER', { USER_ID: '001' }),
            fetchData('GET_PRODUCTS', {}),
            fetchData('GET_ORDERS', {})
        ]);

        console.log('모든 데이터 로드 완료');
        return { userData, productsData, ordersData };
    } catch (error) {
        console.error('데이터 로드 실패:', error);
        throw error;
    }
}```
### 순차 처리 vs 병렬 처리 ​

javascript```
// ❌ 불필요한 순차 처리 (느림 - 3초)
async function slow() {
    const user = await fetchData('GET_USER', {}); // 1초
    const products = await fetchData('GET_PRODUCTS', {}); // 1초
    const orders = await fetchData('GET_ORDERS', {}); // 1초
    return { user, products, orders };
}

// ✅ 병렬 처리 (빠름 - 1초)
async function fast() {
    const [user, products, orders] = await Promise.all([
        fetchData('GET_USER', {}), // 동시 실행
        fetchData('GET_PRODUCTS', {}), // 동시 실행
        fetchData('GET_ORDERS', {}) // 동시 실행
    ]);
    return { user, products, orders };
}```
## jQuery Deferred → Promise 마이그레이션 ​

### Before: jQuery $.when ​

javascript```
// ❌ Before - jQuery Deferred
function loadData() {
    const dfd1 = $.Deferred();
    const dfd2 = $.Deferred();

    $nst.is_data_ot_data('GET_USER', {}, (data) => {
        dfd1.resolve(data);
    });

    $nst.is_data_ot_data('GET_ORDERS', {}, (data) => {
        dfd2.resolve(data);
    });

    $.when(dfd1, dfd2).then(function(userData, ordersData) {
        console.log('완료');
    });
}```
### After: Promise.all ​

javascript```
// ✅ After - Promise.all
async function loadData() {
    const [userData, ordersData] = await Promise.all([
        fetchData('GET_USER', {}),
        fetchData('GET_ORDERS', {})
    ]);

    console.log('완료');
}```
## 실전 패턴 모음 ​

### 패턴 1: 유틸리티 함수 만들기 ​

javascript```
// ✅ 재사용 가능한 Promise 래퍼
const $nstAsync = {
    fetchTable(funcName, params) {
        return new Promise((resolve, reject) => {
            $nst.is_data_ot_data(funcName, params, (data) => {
                resolve(data || []);
            });
        });
    },

    fetchSingle(funcName, params) {
        return new Promise((resolve, reject) => {
            $nst.is_data_os_data(funcName, params, (data) => {
                resolve(data || {});
            });
        });
    },

    save(funcName, data) {
        return new Promise((resolve, reject) => {
            $nst.it_data_returnMessage(funcName, data, (message) => {
                resolve(message);
            });
        });
    }
};

// 사용
async function example() {
    const tableData = await $nstAsync.fetchTable('GET_TABLE', {});
    const singleData = await $nstAsync.fetchSingle('GET_SINGLE', {});
    const result = await $nstAsync.save('SAVE_DATA', tableData);
}```
### 패턴 2: 타임아웃 처리 ​

javascript```
// ✅ Promise에 타임아웃 추가
function withTimeout(promise, timeout = 5000) {
    return Promise.race([
        promise,
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error('시간 초과')), timeout)
        )
    ]);
}

// 사용
try {
    const data = await withTimeout(
        fetchData('GET_DATA', {}),
        3000 // 3초 타임아웃
    );
} catch (error) {
    if (error.message === '시간 초과') {
        unidocuAlert('서버 응답 시간이 초과되었습니다.');
    }
}```
### 패턴 3: 재시도 로직 ​

javascript```
// ✅ 실패 시 재시도
async function fetchWithRetry(funcName, params, maxRetries = 3) {
    for (let i = 0; i  maxRetries; i++) {
        try {
            return await fetchData(funcName, params);
        } catch (error) {
            if (i === maxRetries - 1) throw error;
            console.log(`재시도 ${i + 1}/${maxRetries}`);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
}```
## 주의사항 ​

개발자는 다음 사항에 유의해야 합니다:

- `async` 함수는 항상 Promise를 반환합니다
- `await`은 `async` 함수 내에서만 사용 가능합니다
- `try-catch`로 에러를 꼭 처리하세요
- 불필요한 `await`은 성능을 저하시킵니다 (병렬 처리 고려)

## 브라우저 호환성 ​

| 기능 | Chrome | Edge | Firefox | Safari |
| Promise | ✅ 32+ | ✅ 12+ | ✅ 29+ | ✅ 8+ |
| async/await | ✅ 55+ | ✅ 15+ | ✅ 52+ | ✅ 10.1+ |
UniWORKS는 최신 브라우저를 지원하므로 안전하게 사용 가능합니다.

## 요약 ​

|  | jQuery Deferred | Promise/async-await |
| 표준 | ❌ jQuery 전용 | ✅ JavaScript 표준 |
| 가독성 | ⚠️ 복잡 | ✅ 직관적 |
| 에러 처리 | ⚠️ 불명확 | ✅ try-catch로 명확 |
| 체이닝 | ⚠️ 어려움 | ✅ 쉬움 |
| 권장 | ❌ 지양 | ✅ 권장 |
## 참고 자료 ​

- MDN - Promise
- MDN - async/await
- JavaScript.info - Promise