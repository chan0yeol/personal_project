const store = {}
const devtoolsPorts = {}
const scriptUrlMap = {} // `${tabId}:${scriptId}` → url

// scriptParsed 이벤트로 scriptId→URL 맵 구축
chrome.debugger.onEvent.addListener((source, method, params) => {
  if (method === 'Debugger.scriptParsed' && params.url) {
    scriptUrlMap[`${source.tabId}:${params.scriptId}`] = params.url
  }
})

function cdp(tabId, method, params = {}) {
  return new Promise((resolve, reject) => {
    chrome.debugger.sendCommand({ tabId }, method, params, (result) => {
      if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message))
      else resolve(result || {})
    })
  })
}

// 함수 선언 위의 /** */ JSDoc 블록 추출
// lineNumber: CDP 기준 0-based 줄 번호
function extractJsdocBefore(lines, lineNumber) {
  let i = lineNumber - 1
  // 함수 선언 바로 위 빈 줄 건너뜀
  while (i >= 0 && lines[i].trim() === '') i--
  // */ 로 끝나는 줄이 없으면 JSDoc 없음
  if (i < 0 || !lines[i].trim().endsWith('*/')) return null
  const end = i
  // /** 시작 줄까지 역방향 탐색
  while (i >= 0 && !lines[i].trim().startsWith('/**')) i--
  if (i < 0) return null
  return lines.slice(i, end + 1).join('\n')
}

async function getFunctionLocation(tabId, expr, withJsdoc = false) {
  // attach
  await new Promise((resolve, reject) => {
    chrome.debugger.attach({ tabId }, '1.3', () => {
      if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message))
      else resolve()
    })
  })

  try {
    // Debugger.enable → 로딩된 모든 스크립트에 대해 scriptParsed 이벤트 발생
    await cdp(tabId, 'Debugger.enable', {})
    // onEvent는 비동기라 잠깐 대기
    await new Promise(r => setTimeout(r, 250))

    // 함수 객체 평가
    const evalResult = await cdp(tabId, 'Runtime.evaluate', {
      expression: expr,
      objectGroup: 'uni-ev'
    })

    if (!evalResult.result?.objectId) {
      return { error: '함수를 찾을 수 없음' }
    }

    // 내부 프로퍼티에서 [[FunctionLocation]] 추출
    const props = await cdp(tabId, 'Runtime.getProperties', {
      objectId: evalResult.result.objectId,
      ownProperties: false
    })

    await cdp(tabId, 'Runtime.releaseObjectGroup', { objectGroup: 'uni-ev' }).catch(() => {})

    const locProp = props.internalProperties?.find(p => p.name === '[[FunctionLocation]]')
    if (!locProp) return { error: '위치 정보 없음' }

    const { scriptId, lineNumber, columnNumber } = locProp.value.value
    const url = scriptUrlMap[`${tabId}:${scriptId}`] || ''

    // withJsdoc 요청 시 스크립트 소스에서 JSDoc 추출
    let jsdoc = null
    if (withJsdoc && scriptId) {
      try {
        const srcResult = await cdp(tabId, 'Debugger.getScriptSource', { scriptId })
        const lines = (srcResult.scriptSource || '').split('\n')
        jsdoc = extractJsdocBefore(lines, lineNumber)
      } catch (e) { /* JSDoc 추출 실패는 무시 */ }
    }

    return { url, lineNumber: lineNumber ?? 0, columnNumber: columnNumber ?? 0, jsdoc }

  } finally {
    chrome.debugger.detach({ tabId }, () => {})
  }
}

// DevTools 패널 포트 연결
chrome.runtime.onConnect.addListener((port) => {
  if (!port.name.startsWith('devtools-')) return
  const tabId = parseInt(port.name.replace('devtools-', ''))
  devtoolsPorts[tabId] = port

  if (store[tabId]) {
    port.postMessage({ type: 'INIT', events: store[tabId] })
  }

  port.onDisconnect.addListener(() => {
    delete devtoolsPorts[tabId]
  })
})

// 코드 분석 모드 — "AI에게 묻기"로 이벤트 컨텍스트가 첨부된 경우 사용
const ANALYSIS_SYSTEM_PROMPT = `당신은 $u 프레임워크 코드 분석 전문가입니다. 제공된 소스 코드를 분석해 답변하세요.

## 응답 규칙
- 반드시 한국어로만 답변. 중국어(汉字/漢字) 절대 사용 금지. 일본어 절대 사용 금지.
- 소스 코드 원문 재출력 절대 금지 (개발자가 이미 보유 중).
- 코드 분석·설명 요청 시 반드시 아래 구조로 답변:

**핵심 동작**
조건 분기 중심으로 "~이면 ~한다" 형태, 2~5줄 이내.

**영향 범위**
읽거나 쓰는 필드/그리드 ID 나열. (없으면 생략)

**주의사항**
null 처리 누락, 중복 등록 가능성 등 비명백한 문제만 1~2줄. (없으면 생략)

- 새 코드 예시는 사용자가 명시적으로 요청한 경우에만 코드 블록 출력.
- "복사 가능", "완성된 코드" 같은 불필요한 헤더 금지.`

// 코드 생성 모드 — 일반 AI 가이드 탭에서 사용
const GROQ_SYSTEM_PROMPT = `당신은 $u 프레임워크 전문 코딩 어시스턴트입니다. 사내 엔터프라이즈 웹 솔루션 개발에 사용되는 $u 프레임워크 코드를 작성해주세요.

## 변수 선언
- const / let 우선 사용 (var 지양)
- 재할당 없으면 const, 재할당 필요하면 let

## 그리드 (RealGrid 래퍼)
var gridObj = $u.gridWrapper.getGrid('그리드ID')

### 이벤트 등록 (direct)
gridObj.onCellClick(function(columnKey, rowIndex) { })
gridObj.onChangeCell(function(columnKey, rowIndex, oldValue, newValue) { })
gridObj.onRowActivate(function(rowIndex) { })
gridObj.onCellDblClick(function(columnKey, rowIndex) { })
gridObj.onChangeRow(function(rowIndex) { })
gridObj.onHeaderClick(function(columnKey) { })
gridObj.onChangeHeaderCheckBox(function(checked) { })
gridObj.onBlockPaste(function(columnKey, rowIndex, value) { })
gridObj.onRowScroll(function(rowIndex) { })

### 이벤트 등록 (_rg 경유, RealGrid 네이티브)
gridObj._rg.onCellClicked(function(grid, index) { })
gridObj._rg.onCellDblClicked(function(grid, index) { })
gridObj._rg.onCurrentChanged(function(grid, newIndex, oldIndex) { })
gridObj._rg.onCurrentRowChanged(function(grid, oldRow, newRow) { })
gridObj._rg.onEditRowChanged(function(grid, itemIndex, dataRow, field, oldValue, newValue) { })
gridObj._rg.onItemChecked(function(grid, itemIndex, checked) { })
gridObj._rg.onItemAllChecked(function(grid, checked) { })
gridObj._rg.onColumnCheckedChanged(function(grid, column, checked) { })
gridObj._rg.onRowCountChanged(function(grid, newCount, oldCount) { })
gridObj._rg.onTopIndexChanged(function(grid, newIndex) { })
gridObj._rg.onGetEditValue(function(grid, index, editResult) { })

### 데이터 읽기/쓰기
gridObj.$V('COLUMN_KEY', rowIndex)              // 셀 값 읽기
gridObj.$V('COLUMN_KEY', rowIndex, value)       // 셀 값 쓰기
gridObj.$F(value, 'COLUMN_KEY')                 // 특정 값인 행 인덱스 배열 반환
gridObj.getJSONData()                           // 전체 데이터 배열 반환
gridObj.getJSONDataByRowIndex(rowIndex)         // 특정 행 데이터 객체 반환
gridObj.setJSONData(array)                      // 전체 데이터 바인딩
gridObj.getSELECTEDJSONData()                   // 체크된 행만 JSON 배열 반환
gridObj.getRowCount()                           // 전체 행 수
gridObj.getActiveRowIndex()                     // 현재 포커스 행 인덱스
gridObj.getSelectedRowIndexes()                 // 체크된 행 인덱스 배열 (getSELECTEDJSONData와 순서 일치)

### 행 조작
gridObj.addRow()                                // 빈 행 추가 (그리드 기본 신규 행)
gridObj.appendRow(rowData)                      // 마지막에 행 추가 (rowData: 객체 또는 생략)
gridObj.insertRow(rowIndex, rowData)            // 특정 위치에 행 삽입
gridObj.deleteRow(rowIndex)                     // 단일 행 삭제
gridObj.deleteSelectedRows()                    // 체크된 행 일괄 삭제
gridObj.clearGridData()                         // 그리드 전체 데이터 초기화
gridObj.setRowDataByJSONObj(rowIndex, jsonObj)  // 특정 행 데이터를 JSON 객체로 일괄 교체
gridObj.makeRowEditable(rowIndex)               // 행 편집 가능
gridObj.makeRowReadOnly(rowIndex)               // 행 읽기 전용

### 셀/컬럼 제어
gridObj.isEmpty(columnKey, rowIndex)            // 셀 빈값 여부 (boolean)
gridObj.makeCellRequired(columnKey, rowIndex)   // 셀 필수 입력 표시
gridObj.setColumnRequired(columnKey, required)  // 컬럼 전체 필수 입력 설정
gridObj.setColumnHide(columnKey, true/false)    // 컬럼 숨김/표시
gridObj.setColumnBgColor(columnKey, styleName)  // 컬럼 배경색 (styleName: CSS 클래스명)
gridObj.setColumnFgColor(columnKey, color)      // 컬럼 글자색
gridObj.getActiveColumnKey()                    // 현재 포커스 컬럼 키
gridObj.checkAll()                              // 전체 행 체크
gridObj.unCheckAll()                            // 전체 행 체크 해제
gridObj.excelDownload(fileName)                 // 그리드 데이터 엑셀 다운로드

### 검증
gridObj.asserts.rowSelected()                   // 체크 행 없으면 자동 throw
gridObj.asserts.selectedExactOneRow()           // 체크 행이 정확히 1개가 아니면 throw
gridObj.validateGridRequired()                  // 그리드 전체 필수 입력 검증
gridObj.validateSELECTEDGridRequired()          // 체크된 행만 필수 입력 검증
gridObj.validateRequiredByRowIndex(rowIndex)    // 특정 행 필수 입력 검증

## 필드
$u.get('FIELD_ID').getValue()                   // 값 읽기
$u.get('FIELD_ID').setValue('새값')             // 값 쓰기
$u.getValues()                                  // 현재 화면 전체 필드 값 객체로 반환
$u.getValues('tableId')                         // 특정 테이블(search-condition 등) 필드 값만 반환
$u.setValues('tableId', data)                   // 특정 테이블에 데이터 객체 세팅 (getValues 반대)
$u.validateRequired('tableId')                  // 특정 테이블 필수 입력 검증 (미입력 시 throw)
$u.get('FIELD_ID').$el.change(function() { })
$u.get('FIELD_ID').$el.click(function() { })
$u.get('FIELD_ID').$el.keyup(function() { })
$u.get('FIELD_ID').$el.blur(function() { })

## 버튼 / 핸들러
// ── addHandler: 화면 버튼 ID와 매핑 → 해당 버튼 클릭 시 자동 실행
// ── addCustomHandler: 유틸·기능성 함수 등록 → runCustomHandler()로 직접 호출
//    (화면 버튼과 무관, 로직 분리/재사용 목적)

// 단일 등록
$u.addHandler('BTN_SAVE', function() { })           // 화면의 BTN_SAVE 버튼 클릭 시 실행
$u.buttons.addCustomHandler('doSave', function(params) { }) // 직접 호출용 유틸 함수
// 여러 개 한번에 등록 (권장)
$u.buttons.addCustomHandler({ fn1: function() { }, fn2: function() { } })
$u.buttons.addHandler({ BTN_SEARCH: function() { }, BTN_SAVE: function() { } })
// 핸들러 직접 실행
$u.buttons.runHandler('BTN_SAVE')               // addHandler 등록 핸들러 강제 실행
$u.buttons.runCustomHandler('doSave', params)   // addCustomHandler 등록 함수 실행 (파라미터 전달 가능)
$u.buttons.triggerFormTableButtonClick()        // 현재 화면 조회 버튼 강제 트리거 (저장/삭제 후 재조회 시 사용)

## 서버 통신 ($nst)
// is_data → OT_DATA 반환 (콜백 없으면 동기)
$nst.is_data_ot_data(namedServiceId, is_data, function(ot_data) { })
// is_data → 단일 메시지 반환 후 alert 패턴
$nst.is_data_returnMessage(namedServiceId, is_data, function(message) {
  unidocuAlert(message, function() { $u.buttons.triggerFormTableButtonClick() })
})
// it_data만 전달 (is_data 없을 때)
$nst.it_data_nsReturn(namedServiceId, it_data, function(nsReturn) {
  unidocuAlert(nsReturn.getReturnMessage(), function() { $u.buttons.triggerFormTableButtonClick() })
})
// is_data + it_data 모두 전달
$nst.is_data_it_data_nsReturn(namedServiceId, is_data, it_data, function(nsReturn) {
  var ot_data = nsReturn.getTableReturn('OT_DATA');
})
// nsReturn 직접 사용
$nst.is_data_nsReturn(namedServiceId, is_data, function(nsReturn) {
  var ot_data   = nsReturn.getTableReturn('OT_DATA');
  var os_data   = nsReturn.getExportMap('OS_DATA');
  var message   = nsReturn.getReturnMessage();   // 단일 메시지
  var strReturn = nsReturn.getStringReturns();   // 문자열 맵
})

## 알림
unidocuAlert(message)                          // 커스텀 alert (브라우저 기본 alert 대신 사용)
unidocuAlert(message, function() { })          // 확인 후 콜백

## 팝업
$u.popup.openByProgramId(programId, width, height, data)  // 프로그램 ID로 팝업 열기

## 엑셀
$u.excel.templateDownload(gridObj)             // 엑셀 템플릿 다운로드

## F4 코드 데이터
// 코드 데이터 목록 조회 (동기 또는 콜백)
$u.f4Data.getCodeDataWithParams(codeKey, params)
$u.f4Data.getCodeDataWithParams(codeKey, params, function(codeData) { })
// 캐시 포함 코드 데이터 조회 (동기)
$u.f4Data.getCachedCodeData(codeKey, params)
// 코드→텍스트 맵 반환 { 코드값: 텍스트값, ... }
$u.f4Data.getCodeMapWithParams(codeKey, targetKey, params)
// 콤보박스 옵션 배열 반환 [{ value, text }, ...]
$u.f4Data.getCodeComboOption(codeKey, params)
// F4 팝업 직접 열기
$u.dialog.f4CodeDialog.open({
  popupKey: 'F4_CODE_KEY',          // F4 코드 키
  searchWord: '',                    // 초기 검색어 (optional)
  queryParams: { SUB_ID: '' },       // 추가 쿼리 파라미터 (optional)
  codePopupCallBack: function(code, name, jsonObj) {
    // code: 선택한 코드값, name: 텍스트, jsonObj: 전체 행 데이터
  }
})

## 유틸
$u.util.formatString('{key} 값', { key: value }) // 문자열 포맷

## programSetting (화면별 설정 템플릿)
$u.programSetting.appendTemplate('key', { defaultValue: 'value', description: '설명' })
$u.programSetting.getValue('key')              // 설정값 읽기
$u.programSetting.setValue('key', value)       // 설정값 쓰기

## 페이지
$u.page.getPROGRAM_ID()                        // 현재 프로그램 ID
$u.page.getVIEW_NAME()                         // 뷰 이름 (mustache)
$u.page.getBASE_PRG()                          // 베이스 JS 이름
$u.page.getPageParams()                        // 현재 페이지 파라미터 객체
$u.isPopupView()                               // 팝업으로 열린 화면이면 'true' 반환

## 페이지 이동
$u.navigate(url, params)                       // URL로 페이지 이동
$u.navigateByProgramId(programId, params)      // 프로그램 ID로 페이지 이동
$u.moveToHome()                                // 홈으로 이동
$u.pageReload()                                // 현재 페이지 새로고침

## 코딩 규칙
- 배열 순회는 for 루프 대신 forEach / filter / map 사용 (함수형 프로그래밍 권장).
- getJSONData() / getSELECTEDJSONData() 결과는 반드시 length 체크 후 처리.
  예: var data = gridObj.getJSONData(); if (!data.length) return;
- 그리드 셀 값을 여러 행에 걸쳐 수정할 때는 $V 루프 대신
  getJSONData() → 배열 가공(map/forEach) → setJSONData() 패턴 사용 (DOM 조작 최소화).
  단, 단일 셀 읽기/쓰기는 $V 사용.

## 응답 규칙
- 반드시 한국어로만 답변. 중국어(汉字/漢字) 절대 사용 금지. 일본어 절대 사용 금지.
- 코드 위에 1~2줄 요약 필수 (예: "체크된 행을 역순으로 삭제합니다."). 이후 코드만 출력.
- 단계별 설명 목록 금지. 주의사항은 비명백한 것만 1줄 이내, 없으면 생략.
- [현재 화면 컨텍스트]가 제공된 경우 해당 실제 ID(그리드 ID, 필드 ID, 버튼 ID)를 코드에 그대로 사용. 'GRID_ID' · '그리드ID' 같은 임의 placeholder 사용 금지.
- 위 API 목록에 없는 메서드는 절대 만들어내지 말 것.
- "복사 가능", "완성된 코드" 같은 불필요한 헤더 금지.`


chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'UNI_EVENT') {
    const tabId = sender.tab?.id
    if (!tabId) return
    if (!store[tabId]) store[tabId] = []
    store[tabId].push(msg.event)
    if (devtoolsPorts[tabId]) {
      devtoolsPorts[tabId].postMessage({ type: 'NEW_EVENT', event: msg.event })
    }
    return
  }

  if (msg.type === 'PICK_RESULT') {
    const tabId = sender.tab?.id
    if (tabId && devtoolsPorts[tabId]) {
      devtoolsPorts[tabId].postMessage({ type: 'PICK_RESULT', info: msg.info })
    }
    return
  }

  if (msg.type === 'NST_CALL') {
    const tabId = sender.tab?.id
    if (tabId && devtoolsPorts[tabId]) {
      devtoolsPorts[tabId].postMessage({ type: 'NST_CALL', data: msg.data })
    }
    return
  }

  if (msg.type === 'GET_FUNCTION_LOCATION') {
    getFunctionLocation(msg.tabId, msg.expr, !!msg.withJsdoc)
      .then(sendResponse)
      .catch(e => sendResponse({ error: String(e) }))
    return true
  }

  if (msg.type === 'GROQ_CHAT') {
    const { apiKey, provider, messages, ragUrl, hasSourceContext, hasEventContext, question } = msg

    const PROVIDERS = {
      groq:    { url: 'https://api.groq.com/openai/v1/chat/completions',  model: 'llama-3.3-70b-versatile' },
      upstage: { url: 'https://api.upstage.ai/v1/chat/completions',       model: 'solar-pro' },
    }
    const providerCfg = PROVIDERS[provider] || PROVIDERS.groq

    async function run() {
      var ragContext = ''

      if (ragUrl && !hasSourceContext) {
        try {
          var ragRes = await fetch(`${ragUrl}/search`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: (question || '').slice(0, 200), topK: 3 })
          })
          var ragData = await ragRes.json()
          if (ragData.chunks && ragData.chunks.length) {
            var snippets = ragData.chunks
              .map(function(c) { return c.code })
              .join('\n\n---\n\n')
              .slice(0, 4000)
            ragContext = '\n\n[관련 가이드 및 코드]\n' + snippets
          }
        } catch (e) {
          // RAG 실패 시 스킵
        }
      }

      // 이벤트 컨텍스트가 첨부된 경우 분석 프롬프트, 아니면 코드 생성 프롬프트
      const basePrompt = hasEventContext ? ANALYSIS_SYSTEM_PROMPT : GROQ_SYSTEM_PROMPT
      const systemMsg = { role: 'system', content: basePrompt + ragContext }
      const res = await fetch(providerCfg.url, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: providerCfg.model,
          messages: [systemMsg, ...messages],
          max_tokens: 2048,
          temperature: 0.3
        })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error.message)
      return data.choices[0]?.message?.content || ''
    }

    run()
      .then(content => sendResponse({ ok: true, content }))
      .catch(e => sendResponse({ ok: false, error: e.message }))
    return true
  }
})

chrome.tabs.onRemoved.addListener((tabId) => {
  delete store[tabId]
  delete devtoolsPorts[tabId]
  Object.keys(scriptUrlMap).forEach(k => {
    if (k.startsWith(`${tabId}:`)) delete scriptUrlMap[k]
  })
})

// injected.js는 manifest.json content_scripts(world: MAIN, document_start)로 주입됨
