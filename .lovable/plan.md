# 수익분석 개선 및 발전소 단일 대시보드 탭 구성

## 작업 범위

### 1. 정렬 가능한 컬럼 헤더 (매출관리/비용관리/수익분석)
- 사업소명, 발전원, 발전량, 설비용량, 매출, 비용, 순이익 등 숫자/문자 컬럼 헤더에 ▲▼ 아이콘 추가
- 클릭 시 오름차순 → 내림차순 → 원래대로 토글
- `src/pages/revenue/SalesAndCost.tsx`, `src/pages/Revenue.tsx`에 적용

### 2. 발전소 드래그앤드롭 정렬 (전역)
- `@dnd-kit/core`, `@dnd-kit/sortable` 설치
- `PlantOrderContext` 신규 생성, `localStorage`에 `plantOrder` 키로 사용자별 순서 저장
- `plantsForScope()`에서 저장된 순서 적용
- 매출/비용/수익 테이블의 사업소명 셀에 드래그 핸들 추가
- 정렬 컬럼이 활성화된 경우 DnD 비활성화 (충돌 방지)

### 3. 기간 선택 (연/월 드롭다운 + 달력 + 텍스트)
- 신규 컴포넌트 `src/components/PeriodPicker.tsx`
  - 시작/종료 각각: 연도 드롭다운 + 월 드롭다운 + Popover 달력 + `YYYY-MM-DD` 텍스트 입력
- 매출관리/비용관리/수익분석 페이지 헤더 바로 아래 배치
- 선택 범위에 포함된 모든 월을 표출 (예: 2026-05 ~ 2027-03 → 11개월)
- mockData에 `getRevenueByPlantForMonths(plantId, [{year, month}, ...])` 헬퍼 추가 (기존 월별 시뮬레이션 시드 활용)

### 4. "설비용량 단위 일괄입력" 버튼 (비용관리 카테고리 탭)
- 각 카테고리 탭 우측 상단 버튼
- 활성화 조건: `scope`가 "전체"일 때만 (사업소/발전원 필터 시 disabled + 툴팁)
- 클릭 → Dialog에서 총 금액 입력 → `각 발전소 비용 = 총금액 × (해당발전소 capacityMW / 전체 capacityMW합)`로 자동 배분
- `edits` 상태에 일괄 반영

### 5. 발전소 단일 대시보드 상단 탭
- `src/pages/PlantDetail.tsx`를 Tabs 구조로 재구성:
  - **요약**: 기존 출력량/발전량 위젯
  - **출력제어**: `OutputControl` 페이지 로직 재사용 (단일 발전소 한정)
  - **성능분석**: `PerformanceWidget` 또는 `PerformanceAnalysis` 컴포넌트 재사용
  - **수익분석**: 해당 발전소의 매출/비용/순이익 (기간선택 포함)
- 매출/비용이 이전 3개월 평균 대비 +50% 초과 시 진입 즉시 AlertDialog 팝업 ("⚠ 이상 감지 - 항목/금액/평균대비%")

### 6. 매출/비용/수익 페이지 이상 감지 팝업
- 페이지 로드 시 모든 발전소 × (매출, 비용, 순이익) 이전 3개월 평균 검사
- 50% 초과 항목들을 모아 단일 AlertDialog로 표시: 발전소명 + 항목 + 금액 + 평균값 + 초과율
- 버튼: "다시 보지 않음" (localStorage `revenueAlertDismissed:{YYYY-MM}` 저장) / "닫기"

## 추가 반영 (메모리 기반)
- Dashboard `예상 수익` → `금일 누적 수익` 라벨 변경 (보류 중이던 항목)

## 기술 세부

- 정렬 상태: `useState<{key, dir}>` 페이지별 로컬
- DnD 저장 키: `krems:plantOrder` (전역, 단일 사용자 가정 — mock)
- 기간 → 월 배열 변환: `eachMonthOfInterval` from `date-fns` (이미 설치됨)
- 이상 감지 임계치 상수 `ANOMALY_THRESHOLD = 0.5`
- 팝업 dismiss 키: `krems:anomalyDismissed:{period-hash}`

## 영향 파일
- 신규: `src/components/PeriodPicker.tsx`, `src/components/PlantOrderContext.tsx`, `src/components/AnomalyAlert.tsx`, `src/components/SortableHeader.tsx`
- 수정: `src/pages/Revenue.tsx`, `src/pages/revenue/SalesAndCost.tsx`, `src/pages/PlantDetail.tsx`, `src/components/ScopeFilter.tsx`, `src/data/mockData.ts`, `src/App.tsx` (Provider), `src/pages/Dashboard.tsx` (라벨)
- 의존성: `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`

작업량이 큽니다. 이대로 진행할까요?
