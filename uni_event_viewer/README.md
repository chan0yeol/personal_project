# UNI Event Viewer

$u 프레임워크 기반 사내 솔루션의 이벤트 핸들러를 Chrome DevTools에서 실시간으로 확인하고, AI 코드 어시스턴트 및 Performance 마커 연동으로 디버깅·개발을 보조하는 확장프로그램

---

## 설치

1. `chrome://extensions` 접속
2. 우측 상단 **개발자 모드** 활성화
3. **압축해제된 확장 프로그램 로드** 클릭
4. 이 폴더 선택

---

## 사용법

### 패널 열기
F12 → **UNI Events** 탭

---

### 등록 탭

페이지에 등록된 핸들러 전체를 확인합니다.

**Scan 버튼**
- 현재 페이지의 BTN/HDL 핸들러 전체를 스냅샷으로 수집
- 페이지 로드 시 등록된 핸들러 포함
- 새 화면으로 이동할 때마다 클릭 권장

**자동 수집 (후킹)**
- FLD(`$u.get().$el.change()` 등)는 등록 즉시 자동 수집
- GRD(`$u.gridWrapper.getGrid()` 이벤트)는 getGrid() 호출 시점부터 자동 수집
- BTN/HDL은 페이지 로드 후 동적으로 등록되는 경우에만 자동 수집

**필터 / 검색**
- `ALL` `HDL` `BTN` `FLD` `GRD` 버튼으로 타입 필터
- 검색창에 ID 또는 함수명 입력
- 프로그램 ID 드롭다운으로 화면별 필터

**상세 보기**
- 행 클릭 → 하단에 함수 소스 코드 미리보기
- **복사** 버튼: 전체 소스 클립보드 복사
- **소스 이동** 버튼: Sources 탭에서 해당 라인으로 이동 (익명함수 포함)
- **AI에게 묻기** 버튼: 소스코드·JSDoc·런타임 체인을 AI에 전달해 분석 요청
- **비활성화 토글** (`●` 버튼): 핸들러를 런타임으로 껐다 켜기 (페이지 소스 무수정)

**문서 생성**
- 각 행의 체크박스로 이벤트 선택 (헤더 체크박스로 전체 선택/해제)
- **문서 생성** 버튼 클릭 → AI가 이벤트별 설명 생성 후 인수인계 Markdown 다운로드
- AI 가이드 탭에 API Key가 설정되어 있으면 설명 자동 생성, 없으면 목록만 출력

---

### 실시간 탭

핸들러가 실제로 **실행될 때** 라이브로 표시됩니다.

**FLD / GRD**
- 등록 시점부터 자동으로 실행 추적 + Performance 마커 자동 삽입
- 별도 설정 불필요

**BTN / HDL**
- **감지 활성화** 버튼 클릭 필요
- 클릭 후 버튼이 `감지 중 ✓`로 바뀌면 활성화 완료
- 활성화 이후 실행부터 Performance 마커도 함께 삽입

**실행 횟수 카운트**
- 같은 핸들러가 반복 실행되면 새 행 추가 대신 `×N` 배지로 카운트 증가

**실행 시간**
- 각 핸들러 실행 시간을 `ms` 단위로 표시
- 500ms 초과 시 빨간색으로 강조

**실행 파라미터**
- 핸들러 호출 시 전달된 인수를 `(arg1, arg2, ...)` 형태로 표시

**소스 이동**
- 항목 클릭 → Sources 탭에서 해당 라인으로 이동

---

### AI 가이드 탭

#### 채팅
- Groq / Upstage 중 AI Provider 선택, API Key 설정
- $u 프레임워크 전체 API 기반으로 코드 생성
- **현재 화면 컨텍스트** 체크 시 `$u.getValues()` + 그리드 컬럼 자동 수집 → 실제 ID로 코드 생성
- RAG URL 설정 시 유니웍스6 소스 기반 관련 코드 자동 첨부

#### AI에게 묻기 (등록 탭 연동)
- 등록 탭에서 이벤트 행 클릭 → 상세 창의 **AI에게 묻기** 클릭
- 소스코드 + JSDoc 주석 + 런타임 호출 체인이 자동으로 컨텍스트에 첨부
- AI가 핵심 동작 / 영향 범위 / 주의사항 구조로 분석

#### 패턴 카드
- GRD / FLD / BTN / HDL / NST / PAGE 카테고리별 자주 쓰는 $u 코드 스니펫
- **복사** 버튼으로 즉시 클립보드 복사
- **AI에게 묻기** 버튼으로 현재 화면에 맞게 활용법 질문

---

### Performance 마커 연동

핸들러 실행마다 `performance.mark()` + `performance.measure()`가 자동으로 삽입됩니다.

**확인 방법**
1. 실시간 탭 → **감지 활성화** 클릭 (BTN/HDL 마커 활성화)
2. DevTools **성능** 탭 → 녹화 시작 (⏺)
3. 화면에서 버튼 클릭, 필드 변경, 그리드 조작
4. 녹화 중지 → 타임라인 하단 **타이밍** 섹션에서 `uni:BTN:XXX` / `uni:FLD:XXX` 등 확인

| 타입 | 마커 이름 예시 |
|------|--------------|
| FLD | `uni:FLD:FIELD_ID:change` |
| GRD | `uni:GRD:GRID_ID:onCellClick` |
| BTN | `uni:BTN:BTN_SAVE` |
| HDL | `uni:HDL:UF_INI` |

---

## 이벤트 타입

| 타입 | 설명 | 등록 감지 | 실행 감지 |
|------|------|----------|----------|
| `HDL` | `$u.addHandler()` | Scan / 동적 후킹 | 감지 활성화 후 |
| `BTN` | `$u.buttons.addCustomHandler()` | Scan / 동적 후킹 | 감지 활성화 후 |
| `FLD` | `$u.get().$el.change/click/...` | 자동 후킹 | 자동 추적 |
| `GRD` | `gridObj.onCellClick/onChangeCell/...` | 자동 후킹 | 자동 추적 |

### GRD 추적 대상 이벤트

**direct (gridObj.xxx)**
`onCellClick` `onChangeCell` `onRowActivate` `onCellDblClick` `onChangeRow`
`onHeaderClick` `onChangeHeaderCheckBox` `onBlockPaste` `onRowScroll`
`onBeforeShowUserContextMenu` `onTreeNodeClick` `onShowTooltip`

**_rg 경유 (gridObj._rg.xxx)**
`onCellClicked` `onCellDblClicked` `onCurrentChanged` `onEditRowChanged`
`onCurrentRowChanged` `onItemChecked` `onItemAllChecked` `onColumnCheckedChanged`
`onColumnHeaderClicked` `onEditRowPasted` `onRowsPasted` `onTreeItemExpanding`
`onContextMenuItemClicked` `onTopIndexChanged` `onGetEditValue`
`onInnerDragStart` `onInnerDrop` `onRowCountChanged`

---

## 권장 워크플로우

```
1. 페이지 로드 후 [등록 탭] → Scan 클릭
   → 현재 등록된 핸들러 전체 확인 (프로그램 ID 자동 감지)

2. 프로그램 ID 드롭다운으로 현재 화면 필터
   → 해당 화면 이벤트만 모아보기

3. [실시간 탭] → 감지 활성화 클릭
   → BTN/HDL 실행 추적 + Performance 마커 활성화

4. 화면에서 버튼 클릭, 필드 값 변경, 그리드 조작 등
   → 실시간 탭에서 어떤 핸들러가 실행됐는지 확인
   → 반복 실행은 카운트 배지로 누적, 느린 핸들러는 빨간색으로 표시

5. 항목 클릭 → 소스 이동 / 등록 탭에서 AI에게 묻기 → 분석

6. [AI 가이드 탭] → 코드 생성 질문 또는 패턴 카드 참고

7. 문서 생성 → 인수인계 Markdown 다운로드
```

---

## 참고

- 소스 이동 시 `DevTools is debugging this page` 경고 바가 약 300ms 표시됨 (정상)
- Scan은 현재 화면 기준 스냅샷이므로 화면 이동 시 재클릭 필요
- BTN/HDL Performance 마커는 **감지 활성화** 클릭 이후부터 삽입됨
- `$u` 없는 페이지에서는 동작하지 않음
