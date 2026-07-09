// KHNP 신재생통합관리시스템 - 모의 데이터
// 출처: 공공데이터포털 - 한국수력원자력 재생에너지 발전설비/출자회사 현황 (2025-06-30 기준)
// 실시간 발전량/통신상태/알람 등은 데모용 mock 데이터

export type EnergyType = 'solar' | 'wind' | 'hydro' | 'fuelcell' | 'ess';

export const ENERGY_LABEL: Record<EnergyType, string> = {
  solar: '태양광', wind: '풍력', hydro: '수력', fuelcell: '연료전지', ess: 'ESS',
};

export const ENERGY_COLOR_VAR: Record<EnergyType, string> = {
  solar: 'hsl(var(--energy-solar))',
  wind: 'hsl(var(--energy-wind))',
  hydro: 'hsl(var(--energy-hydro))',
  fuelcell: 'hsl(var(--energy-fuelcell))',
  ess: 'hsl(var(--energy-ess))',
};

export interface Operator {
  id: string;
  name: string;
  role: string;
  region: string;
}

export const OPERATORS: Operator[] = [
  { id: 'OP-01', name: '윤지훈', role: 'O&M 담당자', region: '수도권/강원/충청권역' },
  { id: 'OP-02', name: '김성민', role: 'O&M 담당자', region: '영남권역' },
  { id: 'OP-03', name: '차주현', role: 'O&M 담당자', region: '호남/제주권역' },
];

export interface Plant {
  id: string;
  name: string;
  type: EnergyType;
  region: string;
  lon: number;
  lat: number;
  capacityMW: number;
  comm: 'normal' | 'delay' | 'down';
  status: 'normal' | 'maintenance' | 'fault';
  commissionedYear: number;
  operatorId: string;
}

export const PLANTS: Plant[] = [
  { id: 'SOL-01', name: '한빛솔라파크#1', type: 'solar', region: '전남 영광군', lon: 126.51, lat: 35.28, capacityMW: 1.25, comm: 'normal', status: 'normal', commissionedYear: 2007, operatorId: 'OP-03' },
  { id: 'SOL-02', name: '한빛솔라파크#2', type: 'solar', region: '전남 영광군', lon: 126.51, lat: 35.28, capacityMW: 1.75, comm: 'normal', status: 'normal', commissionedYear: 2008, operatorId: 'OP-03' },
  { id: 'SOL-03', name: '한빛솔라파크#3', type: 'solar', region: '전남 영광군', lon: 126.51, lat: 35.28, capacityMW: 10.947, comm: 'normal', status: 'normal', commissionedYear: 2012, operatorId: 'OP-03' },
  { id: 'SOL-04', name: '예천#1', type: 'solar', region: '경북 예천군', lon: 128.45, lat: 36.65, capacityMW: 1.386, comm: 'normal', status: 'normal', commissionedYear: 2012, operatorId: 'OP-02' },
  { id: 'SOL-05', name: '예천#2', type: 'solar', region: '경북 예천군', lon: 128.45, lat: 36.65, capacityMW: 0.629, comm: 'normal', status: 'normal', commissionedYear: 2012, operatorId: 'OP-02' },
  { id: 'SOL-06', name: '고리 #1', type: 'solar', region: '부산광역시 기장군', lon: 129.29, lat: 35.32, capacityMW: 5.146, comm: 'normal', status: 'normal', commissionedYear: 2017, operatorId: 'OP-02' },
  { id: 'SOL-07', name: '농가참여형', type: 'solar', region: '경기도 가평군', lon: 127.42, lat: 37.74, capacityMW: 0.073, comm: 'normal', status: 'normal', commissionedYear: 2017, operatorId: 'OP-01' },
  { id: 'SOL-08', name: '수력교육훈련센터', type: 'solar', region: '경기도 가평군', lon: 127.42, lat: 37.74, capacityMW: 0.091, comm: 'normal', status: 'normal', commissionedYear: 2017, operatorId: 'OP-01' },
  { id: 'SOL-09', name: '청평양수운동장', type: 'solar', region: '경기도 가평군', lon: 127.42, lat: 37.74, capacityMW: 0.095, comm: 'normal', status: 'normal', commissionedYear: 2018, operatorId: 'OP-01' },
  { id: 'SOL-10', name: '청송양수옥상', type: 'solar', region: '경북 청송군', lon: 129.06, lat: 36.43, capacityMW: 0.046, comm: 'normal', status: 'normal', commissionedYear: 2018, operatorId: 'OP-02' },
  { id: 'SOL-11', name: '괴산수력', type: 'solar', region: '충북 괴산군', lon: 127.79, lat: 36.81, capacityMW: 0.245, comm: 'normal', status: 'normal', commissionedYear: 2018, operatorId: 'OP-01' },
  { id: 'SOL-12', name: '보성강#1', type: 'solar', region: '전남 고흥군', lon: 127.28, lat: 34.61, capacityMW: 0.992, comm: 'normal', status: 'normal', commissionedYear: 2018, operatorId: 'OP-03' },
  { id: 'SOL-13', name: '보성강#2', type: 'solar', region: '전남 고흥군', lon: 127.28, lat: 34.61, capacityMW: 0.999, comm: 'normal', status: 'normal', commissionedYear: 2018, operatorId: 'OP-03' },
  { id: 'SOL-14', name: '삼랑진#1', type: 'solar', region: '경남 밀양시', lon: 128.75, lat: 35.5, capacityMW: 2.234, comm: 'normal', status: 'normal', commissionedYear: 2018, operatorId: 'OP-02' },
  { id: 'SOL-15', name: '삼랑진#2', type: 'solar', region: '경남 밀양시', lon: 128.75, lat: 35.5, capacityMW: 0.538, comm: 'normal', status: 'normal', commissionedYear: 2019, operatorId: 'OP-02' },
  { id: 'SOL-16', name: '한빛본부 주차장', type: 'solar', region: '전남 영광군', lon: 126.51, lat: 35.28, capacityMW: 0.194, comm: 'normal', status: 'normal', commissionedYear: 2019, operatorId: 'OP-03' },
  { id: 'SOL-17', name: '제주 #1(제주탑)', type: 'solar', region: '제주도 제주시', lon: 126.53, lat: 33.5, capacityMW: 0.803, comm: 'normal', status: 'normal', commissionedYear: 2019, operatorId: 'OP-03' },
  { id: 'SOL-18', name: '제주 #2(월평)', type: 'solar', region: '제주도 서귀포시', lon: 126.56, lat: 33.25, capacityMW: 0.553, comm: 'normal', status: 'normal', commissionedYear: 2019, operatorId: 'OP-03' },
  { id: 'SOL-19', name: '보선 2호', type: 'solar', region: '경기도 연천군', lon: 127.07, lat: 38.1, capacityMW: 0.498, comm: 'normal', status: 'normal', commissionedYear: 2019, operatorId: 'OP-01' },
  { id: 'SOL-20', name: '연천 2호', type: 'solar', region: '경기도 연천군', lon: 127.07, lat: 38.1, capacityMW: 0.498, comm: 'normal', status: 'normal', commissionedYear: 2019, operatorId: 'OP-01' },
  { id: 'SOL-21', name: '한솔태양광', type: 'solar', region: '경북 경주시', lon: 129.22, lat: 35.84, capacityMW: 0.999, comm: 'normal', status: 'normal', commissionedYear: 2020, operatorId: 'OP-02' },
  { id: 'SOL-22', name: '수망태양광', type: 'solar', region: '제주도 서귀포시', lon: 126.56, lat: 33.25, capacityMW: 0.999, comm: 'normal', status: 'normal', commissionedYear: 2020, operatorId: 'OP-03' },
  { id: 'SOL-23', name: '평대태양광', type: 'solar', region: '제주도 제주시', lon: 126.53, lat: 33.5, capacityMW: 0.695, comm: 'normal', status: 'normal', commissionedYear: 2020, operatorId: 'OP-03' },
  { id: 'SOL-24', name: '미리내태양광', type: 'solar', region: '제주도 서귀포시', lon: 126.56, lat: 33.25, capacityMW: 0.939, comm: 'normal', status: 'normal', commissionedYear: 2020, operatorId: 'OP-03' },
  { id: 'SOL-25', name: '표선태양광', type: 'solar', region: '제주도 서귀포시', lon: 126.56, lat: 33.25, capacityMW: 0.918, comm: 'normal', status: 'normal', commissionedYear: 2020, operatorId: 'OP-03' },
  { id: 'SOL-26', name: '한빛솔라파크#4', type: 'solar', region: '전남 영광군', lon: 126.51, lat: 35.28, capacityMW: 3.686, comm: 'normal', status: 'normal', commissionedYear: 2020, operatorId: 'OP-03' },
  { id: 'SOL-27', name: '월성태양광', type: 'solar', region: '경북 경주시', lon: 129.22, lat: 35.84, capacityMW: 3.397, comm: 'normal', status: 'normal', commissionedYear: 2020, operatorId: 'OP-02' },
  { id: 'SOL-28', name: '한빛솔라파크#5', type: 'solar', region: '전남 영광군', lon: 126.51, lat: 35.28, capacityMW: 2.244, comm: 'normal', status: 'normal', commissionedYear: 2020, operatorId: 'OP-03' },
  { id: 'SOL-29', name: '한빛솔라파크#6', type: 'solar', region: '전남 영광군', lon: 126.51, lat: 35.28, capacityMW: 1.486, comm: 'normal', status: 'normal', commissionedYear: 2021, operatorId: 'OP-03' },
  { id: 'SOL-30', name: '대성메탈', type: 'solar', region: '경북 경주시', lon: 129.22, lat: 35.84, capacityMW: 0.983, comm: 'normal', status: 'normal', commissionedYear: 2021, operatorId: 'OP-02' },
  { id: 'SOL-31', name: '고리 #2', type: 'solar', region: '부산광역시 기장군', lon: 129.29, lat: 35.32, capacityMW: 1.709, comm: 'normal', status: 'normal', commissionedYear: 2021, operatorId: 'OP-02' },
  { id: 'SOL-32', name: '봉성태양광', type: 'solar', region: '제주도 제주시', lon: 126.53, lat: 33.5, capacityMW: 0.659, comm: 'normal', status: 'normal', commissionedYear: 2021, operatorId: 'OP-03' },
  { id: 'SOL-33', name: '남원태양광', type: 'solar', region: '제주도 서귀포시', lon: 126.56, lat: 33.25, capacityMW: 0.709, comm: 'normal', status: 'normal', commissionedYear: 2021, operatorId: 'OP-03' },
  { id: 'SOL-34', name: '애월태양광', type: 'solar', region: '제주도 제주시', lon: 126.53, lat: 33.5, capacityMW: 0.65, comm: 'normal', status: 'normal', commissionedYear: 2021, operatorId: 'OP-03' },
  { id: 'SOL-35', name: '우리태양광', type: 'solar', region: '제주도 제주시', lon: 126.53, lat: 33.5, capacityMW: 0.749, comm: 'normal', status: 'normal', commissionedYear: 2021, operatorId: 'OP-03' },
  { id: 'SOL-36', name: '오름제주태양광', type: 'solar', region: '제주도 서귀포시', lon: 126.56, lat: 33.25, capacityMW: 0.539, comm: 'normal', status: 'normal', commissionedYear: 2021, operatorId: 'OP-03' },
  { id: 'SOL-37', name: '탐라태양광', type: 'solar', region: '제주도 서귀포시', lon: 126.56, lat: 33.25, capacityMW: 0.723, comm: 'normal', status: 'normal', commissionedYear: 2021, operatorId: 'OP-03' },
  { id: 'SOL-38', name: '케이원태양광', type: 'solar', region: '제주도 서귀포시', lon: 126.56, lat: 33.25, capacityMW: 0.894, comm: 'normal', status: 'normal', commissionedYear: 2021, operatorId: 'OP-03' },
  { id: 'SOL-39', name: '청송양수 수상 #1', type: 'solar', region: '경북 청송군', lon: 129.06, lat: 36.43, capacityMW: 4.445, comm: 'normal', status: 'normal', commissionedYear: 2021, operatorId: 'OP-02' },
  { id: 'SOL-40', name: '본사사옥지붕', type: 'solar', region: '경북 경주시', lon: 129.22, lat: 35.84, capacityMW: 1.296, comm: 'normal', status: 'normal', commissionedYear: 2021, operatorId: 'OP-02' },
  { id: 'SOL-41', name: '금악태양광', type: 'solar', region: '제주도 제주시', lon: 126.53, lat: 33.5, capacityMW: 0.986, comm: 'normal', status: 'normal', commissionedYear: 2021, operatorId: 'OP-03' },
  { id: 'SOL-42', name: '금오름태양광', type: 'solar', region: '제주도 제주시', lon: 126.53, lat: 33.5, capacityMW: 0.428, comm: 'normal', status: 'normal', commissionedYear: 2021, operatorId: 'OP-03' },
  { id: 'SOL-43', name: '우리별태양광', type: 'solar', region: '제주도 서귀포시', lon: 126.56, lat: 33.25, capacityMW: 0.878, comm: 'normal', status: 'normal', commissionedYear: 2021, operatorId: 'OP-03' },
  { id: 'SOL-44', name: '성읍태양광', type: 'solar', region: '제주도 서귀포시', lon: 126.56, lat: 33.25, capacityMW: 0.962, comm: 'normal', status: 'normal', commissionedYear: 2021, operatorId: 'OP-03' },
  { id: 'SOL-45', name: '한동태양광', type: 'solar', region: '제주도 제주시', lon: 126.53, lat: 33.5, capacityMW: 0.997, comm: 'normal', status: 'normal', commissionedYear: 2021, operatorId: 'OP-03' },
  { id: 'SOL-46', name: '한강본부', type: 'solar', region: '강원도 춘천시', lon: 127.73, lat: 37.88, capacityMW: 0.098, comm: 'normal', status: 'normal', commissionedYear: 2021, operatorId: 'OP-01' },
  { id: 'SOL-47', name: '월성자재창고', type: 'solar', region: '경북 경주시', lon: 129.22, lat: 35.84, capacityMW: 1.391, comm: 'normal', status: 'normal', commissionedYear: 2022, operatorId: 'OP-02' },
  { id: 'SOL-48', name: '월성3발주차장', type: 'solar', region: '경북 경주시', lon: 129.22, lat: 35.84, capacityMW: 1.968, comm: 'normal', status: 'normal', commissionedYear: 2022, operatorId: 'OP-02' },
  { id: 'SOL-49', name: '녹동산단2', type: 'solar', region: '경북 경주시', lon: 129.22, lat: 35.84, capacityMW: 0.154, comm: 'down', status: 'normal', commissionedYear: 2022, operatorId: 'OP-02' },
  { id: 'SOL-50', name: '녹동산단3', type: 'solar', region: '경북 경주시', lon: 129.22, lat: 35.84, capacityMW: 0.312, comm: 'normal', status: 'normal', commissionedYear: 2022, operatorId: 'OP-02' },
  { id: 'SOL-51', name: '녹동산단4', type: 'solar', region: '경북 경주시', lon: 129.22, lat: 35.84, capacityMW: 0.278, comm: 'normal', status: 'normal', commissionedYear: 2022, operatorId: 'OP-02' },
  { id: 'SOL-52', name: '세진이엔드티', type: 'solar', region: '부산 강서구', lon: 128.97, lat: 35.21, capacityMW: 0.84, comm: 'normal', status: 'normal', commissionedYear: 2022, operatorId: 'OP-02' },
  { id: 'SOL-53', name: '광진상공', type: 'solar', region: '경북 경주시', lon: 129.22, lat: 35.84, capacityMW: 1.82, comm: 'normal', status: 'normal', commissionedYear: 2022, operatorId: 'OP-02' },
  { id: 'SOL-54', name: '청평유휴부지#1', type: 'solar', region: '경기도 가평군', lon: 127.42, lat: 37.74, capacityMW: 0.409, comm: 'normal', status: 'normal', commissionedYear: 2022, operatorId: 'OP-01' },
  { id: 'SOL-55', name: '청평유휴부지#2', type: 'solar', region: '경기도 가평군', lon: 127.42, lat: 37.74, capacityMW: 0.288, comm: 'normal', status: 'normal', commissionedYear: 2022, operatorId: 'OP-01' },
  { id: 'SOL-56', name: '울산 남부', type: 'solar', region: '울산광역시', lon: 129.31, lat: 35.54, capacityMW: 0.999, comm: 'normal', status: 'normal', commissionedYear: 2023, operatorId: 'OP-02' },
  { id: 'SOL-57', name: 'TSP 상개', type: 'solar', region: '울산강역시', lon: 129.31, lat: 35.54, capacityMW: 2.992, comm: 'down', status: 'normal', commissionedYear: 2023, operatorId: 'OP-02' },
  { id: 'SOL-58', name: '산청양수 수상', type: 'solar', region: '경남 산청군', lon: 127.87, lat: 35.41, capacityMW: 3.024, comm: 'normal', status: 'maintenance', commissionedYear: 2023, operatorId: 'OP-02' },
  { id: 'SOL-59', name: '원방테크', type: 'solar', region: '경기도 아산시', lon: 127.0, lat: 36.78, capacityMW: 0.999, comm: 'normal', status: 'normal', commissionedYear: 2023, operatorId: 'OP-01' },
  { id: 'SOL-60', name: '청송양수 수상 #2', type: 'solar', region: '경북 청송군', lon: 129.06, lat: 36.43, capacityMW: 0.787, comm: 'normal', status: 'normal', commissionedYear: 2024, operatorId: 'OP-02' },
  { id: 'SOL-61', name: '삼홍기계 제3공장', type: 'solar', region: '경남 함안군', lon: 128.41, lat: 35.27, capacityMW: 0.5, comm: 'normal', status: 'normal', commissionedYear: 2024, operatorId: 'OP-02' },
  { id: 'SOL-62', name: '하나3공장', type: 'solar', region: '경기도 화성시', lon: 126.83, lat: 37.2, capacityMW: 1.628, comm: 'normal', status: 'normal', commissionedYear: 2024, operatorId: 'OP-01' },
  { id: 'SOL-63', name: '거평그린', type: 'solar', region: '경북 영천시', lon: 128.94, lat: 35.97, capacityMW: 0.708, comm: 'normal', status: 'normal', commissionedYear: 2024, operatorId: 'OP-02' },
  { id: 'SOL-64', name: '팔팔온유어완트', type: 'solar', region: '경북 경산시', lon: 128.74, lat: 35.83, capacityMW: 0.25, comm: 'normal', status: 'normal', commissionedYear: 2024, operatorId: 'OP-02' },
  { id: 'SOL-65', name: '대명산업사', type: 'solar', region: '경북 구미시', lon: 128.34, lat: 36.12, capacityMW: 0.393, comm: 'down', status: 'normal', commissionedYear: 2024, operatorId: 'OP-02' },
  { id: 'SOL-66', name: '산호수출포장', type: 'solar', region: '경남 함안군', lon: 128.41, lat: 35.27, capacityMW: 0.907, comm: 'normal', status: 'maintenance', commissionedYear: 2024, operatorId: 'OP-02' },
  { id: 'SOL-67', name: '삼홍기계 제2공장', type: 'solar', region: '경남 창원시', lon: 128.68, lat: 35.23, capacityMW: 1.999, comm: 'normal', status: 'normal', commissionedYear: 2024, operatorId: 'OP-02' },
  { id: 'WND-01', name: '고리풍력', type: 'wind', region: '부산광역시 기장군', lon: 129.29, lat: 35.32, capacityMW: 0.75, comm: 'normal', status: 'normal', commissionedYear: 2008, operatorId: 'OP-02' },
  { id: 'HYD-01', name: '화천', type: 'hydro', region: '강원도 화천군', lon: 127.71, lat: 38.1, capacityMW: 108.0, comm: 'normal', status: 'normal', commissionedYear: 1944, operatorId: 'OP-01' },
  { id: 'HYD-02', name: '춘천', type: 'hydro', region: '강원도 춘천시', lon: 127.73, lat: 37.88, capacityMW: 62.28, comm: 'normal', status: 'normal', commissionedYear: 1964, operatorId: 'OP-01' },
  { id: 'HYD-03', name: '의암', type: 'hydro', region: '강원도 춘천시', lon: 127.73, lat: 37.88, capacityMW: 48.0, comm: 'normal', status: 'normal', commissionedYear: 1967, operatorId: 'OP-01' },
  { id: 'HYD-04', name: '청평', type: 'hydro', region: '경기도 가평군', lon: 127.42, lat: 37.74, capacityMW: 140.1, comm: 'normal', status: 'normal', commissionedYear: 1943, operatorId: 'OP-01' },
  { id: 'HYD-05', name: '팔당', type: 'hydro', region: '경기도 남양주시', lon: 127.21, lat: 37.64, capacityMW: 120.0, comm: 'normal', status: 'normal', commissionedYear: 1972, operatorId: 'OP-01' },
  { id: 'HYD-06', name: '칠보', type: 'hydro', region: '전북 정읍시', lon: 126.86, lat: 35.57, capacityMW: 34.8, comm: 'normal', status: 'normal', commissionedYear: 1945, operatorId: 'OP-03' },
  { id: 'HYD-07', name: '강릉', type: 'hydro', region: '강원도 강릉시', lon: 128.88, lat: 37.75, capacityMW: 82.0, comm: 'normal', status: 'normal', commissionedYear: 1990, operatorId: 'OP-01' },
  { id: 'HYD-08', name: '강림', type: 'hydro', region: '강원도 횡성군', lon: 127.99, lat: 37.49, capacityMW: 0.48, comm: 'normal', status: 'normal', commissionedYear: 1978, operatorId: 'OP-01' },
  { id: 'HYD-09', name: '보성강', type: 'hydro', region: '전남 보성군', lon: 127.07, lat: 34.77, capacityMW: 4.5, comm: 'normal', status: 'normal', commissionedYear: 1935, operatorId: 'OP-03' },
  { id: 'HYD-10', name: '괴산', type: 'hydro', region: '충북 괴산군', lon: 127.79, lat: 36.81, capacityMW: 2.8, comm: 'normal', status: 'normal', commissionedYear: 1957, operatorId: 'OP-01' },
  { id: 'HYD-11', name: '토평', type: 'hydro', region: '경기도 구리시', lon: 127.13, lat: 37.59, capacityMW: 0.045, comm: 'normal', status: 'normal', commissionedYear: 2011, operatorId: 'OP-01' },
  { id: 'HYD-12', name: '무주', type: 'hydro', region: '전북 무주군', lon: 127.66, lat: 36.0, capacityMW: 0.4, comm: 'normal', status: 'normal', commissionedYear: 2003, operatorId: 'OP-03' },
  { id: 'HYD-13', name: '양양', type: 'hydro', region: '강원도 양양군', lon: 128.62, lat: 38.07, capacityMW: 1.55, comm: 'normal', status: 'normal', commissionedYear: 2004, operatorId: 'OP-01' },
  { id: 'HYD-14', name: '산청', type: 'hydro', region: '경남 산청군', lon: 127.87, lat: 35.41, capacityMW: 0.995, comm: 'normal', status: 'normal', commissionedYear: 2010, operatorId: 'OP-02' },
  { id: 'HYD-15', name: '예천', type: 'hydro', region: '경북 예천군', lon: 128.45, lat: 36.65, capacityMW: 0.925, comm: 'normal', status: 'normal', commissionedYear: 2011, operatorId: 'OP-02' },
];

export function getOperator(id: string) { return OPERATORS.find(o => o.id === id); }
export function getPlantsByOperator(opId: string) { return PLANTS.filter(p => p.operatorId === opId); }

// === 설비 상태 (인버터/차단기/접속반) — 데모용 결정적 mock =================
export type EquipmentKind = 'inverter' | 'breaker' | 'combiner';
export const EQUIPMENT_LABEL: Record<EquipmentKind, string> = {
  inverter: '인버터', breaker: '차단기', combiner: '접속반',
};
export interface EquipmentItem { kind: EquipmentKind; name: string; ok: boolean; note?: string; }

function hashStr(s: string) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }

export function getPlantEquipment(plantId: string): EquipmentItem[] {
  const p = PLANTS.find(x => x.id === plantId);
  if (!p) return [];
  const h = hashStr(plantId);
  const invCount = Math.max(2, Math.min(8, Math.round(p.capacityMW) + 2));
  const items: EquipmentItem[] = [];
  for (let i = 1; i <= invCount; i++) items.push({ kind: 'inverter', name: `INV-${String(i).padStart(2, '0')}`, ok: true });
  items.push({ kind: 'breaker', name: '주차단기 ACB-01', ok: true });
  items.push({ kind: 'breaker', name: '저압 MCCB-01', ok: true });
  items.push({ kind: 'combiner', name: '접속반 CB-01', ok: true });
  if (p.status === 'fault') {
    // 1~2개 결정적 결함
    const idx = h % items.length;
    items[idx] = { ...items[idx], ok: false, note: 'IGBT 과열 정지' };
    if (invCount > 3) {
      const idx2 = (h >> 3) % items.length;
      if (idx2 !== idx) items[idx2] = { ...items[idx2], ok: false, note: 'DC 절연저항 저하' };
    }
  } else if (p.status === 'maintenance') {
    const idx = h % items.length;
    items[idx] = { ...items[idx], ok: false, note: '계획정비 중' };
  }
  return items;
}

export function getPlantEquipmentSummary(plantId: string) {
  const items = getPlantEquipment(plantId);
  const faults = items.filter(i => !i.ok);
  return { items, faults, ok: faults.length === 0, faultCount: faults.length };
}

export function getPlantCommSummary(plantId: string) {
  const p = PLANTS.find(x => x.id === plantId)!;
  const lastCheck = new Date(Date.now() - (p.comm === 'normal' ? 4 : p.comm === 'delay' ? 12 : 47) * 60_000);
  const fmt = lastCheck.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  const detail = p.comm === 'normal'
    ? `RTU 통신 정상 (마지막 헬스체크 ${fmt})`
    : p.comm === 'delay'
    ? `RTU 응답 지연 (마지막 정상 ${fmt}, 권장 15분 이내)`
    : `RTU 통신 단절 (마지막 정상 ${fmt}, 점검 필요)`;
  return { status: p.comm, lastCheck: fmt, detail };
}

// === SPC 출자회사 (한수원 출자, 별도 법인) ============================
export interface PlantGroup {
  id: string;
  name: string;
  type: 'spc' | 'region' | 'operator';
  plantIds: string[];
  description?: string;
}

// 지역(권역) 그룹
const REGION_GROUPS: PlantGroup[] = (() => {
  const buckets: Record<string, string[]> = {
    '수도권/강원': [], '충청권': [], '영남권': [], '호남권': [], '제주권': [],
  };
  for (const p of PLANTS) {
    const r = p.region;
    if (r.startsWith('제주')) buckets['제주권'].push(p.id);
    else if (r.startsWith('전남') || r.startsWith('전북') || r.startsWith('광주')) buckets['호남권'].push(p.id);
    else if (r.startsWith('경북') || r.startsWith('경남') || r.startsWith('부산') || r.startsWith('울산') || r.startsWith('대구')) buckets['영남권'].push(p.id);
    else if (r.startsWith('충')) buckets['충청권'].push(p.id);
    else buckets['수도권/강원'].push(p.id);
  }
  return Object.entries(buckets).filter(([_, ids]) => ids.length > 0).map(([n, ids], i) => ({
    id: `G-RGN-${String(i + 1).padStart(2, '0')}`, name: n, type: 'region' as const, plantIds: ids,
    description: `${n} 권역 발전소 (${ids.length}개소)`,
  }));
})();

// 담당자별 그룹 (자동 생성)
const OPERATOR_GROUPS: PlantGroup[] = OPERATORS.map((o, i) => ({
  id: `G-MGR-${String(i + 1).padStart(2, '0')}`,
  name: `${o.name} (${o.region})`,
  type: 'operator',
  plantIds: PLANTS.filter(p => p.operatorId === o.id).map(p => p.id),
  description: o.role,
}));

// SPC (출자회사 - 공공데이터포털 2025-06-30 기준)
const SPC_GROUPS: PlantGroup[] = [
  { id: 'G-SPC-01', name: '청송노래산풍력㈜', type: 'spc', plantIds: [], description: '풍력 19.2MW · 한수원·제피로스에너지·대명에너지' },
  { id: 'G-SPC-02', name: '한국해상풍력㈜', type: 'spc', plantIds: [], description: '해상풍력 60MW · 한수원·한전·발전 5사' },
  { id: 'G-SPC-03', name: '켑코솔라㈜', type: 'spc', plantIds: [], description: '태양광 103.7MW · 한수원·한전·발전 5사' },
  { id: 'G-SPC-04', name: '희망빛발전㈜', type: 'spc', plantIds: [], description: '태양광 2.498MW · 한수원·한전·발전 5사' },
  { id: 'G-SPC-05', name: '르솔레이한수원(유)', type: 'spc', plantIds: [], description: '태양광 14.593MW · 한수원·르솔레이' },
  { id: 'G-SPC-06', name: '비금주민태양광발전㈜', type: 'spc', plantIds: [], description: '태양광 199.992MW · 한수원·주민협동조합 외' },
  { id: 'G-SPC-07', name: 'SGC그린파워㈜', type: 'spc', plantIds: [], description: '바이오매스 100MW · 한수원·SGC에너지' },
];

export const PLANT_GROUPS: PlantGroup[] = [...REGION_GROUPS, ...OPERATOR_GROUPS, ...SPC_GROUPS];

export function getPlantsByGroup(groupId: string): Plant[] {
  const g = PLANT_GROUPS.find(x => x.id === groupId);
  if (!g) return [];
  return PLANTS.filter(p => g.plantIds.includes(p.id));
}

// 시드 기반 의사난수
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const CAPACITY_FACTOR: Record<EnergyType, number> = {
  solar: 0.16, wind: 0.27, hydro: 0.32, fuelcell: 0.85, ess: 0.18,
};

function hourlyFactor(type: EnergyType, hour: number, rand: () => number): number {
  switch (type) {
    case 'solar': {
      if (hour < 5 || hour > 19) return 0;
      const x = (hour - 12) / 7;
      return Math.max(0, Math.cos(x * (Math.PI / 2))) * (0.85 + rand() * 0.3);
    }
    case 'wind': return 0.3 + rand() * 0.9;
    case 'hydro':
      if ((hour >= 10 && hour <= 14) || (hour >= 18 && hour <= 21)) return 0.7 + rand() * 0.5;
      if (hour >= 23 || hour <= 5) return 0;
      return 0.1 + rand() * 0.3;
    case 'fuelcell': return 0.85 + rand() * 0.15;
    case 'ess':
      if (hour >= 18 && hour <= 22) return 0.6 + rand() * 0.5;
      if (hour >= 10 && hour <= 14) return 0.3 + rand() * 0.3;
      return 0.05 + rand() * 0.1;
    default: return 0;
  }
}

export interface HourPoint { hour: number; output: number; }

export function getPlantToday(plant: Plant, dateSeed = new Date().getDate()): HourPoint[] {
  const rand = mulberry32(plant.id.charCodeAt(0) * 7 + plant.id.charCodeAt(plant.id.length - 1) + dateSeed);
  const out: HourPoint[] = [];
  for (let h = 0; h < 24; h++) {
    const f = hourlyFactor(plant.type, h, rand);
    out.push({ hour: h, output: +(plant.capacityMW * f * 0.95).toFixed(2) });
  }
  return out;
}

export function getPlantDailyEnergy(plant: Plant, dateSeed = new Date().getDate()): number {
  return +getPlantToday(plant, dateSeed).reduce((s, p) => s + p.output, 0).toFixed(1);
}

export function getCurrentOutput(plant: Plant): number {
  if (plant.status === 'fault' || plant.comm === 'down') return 0;
  const now = new Date();
  const h = now.getHours();
  const series = getPlantToday(plant);
  const base = series[h]?.output ?? 0;
  const next = series[(h + 1) % 24]?.output ?? base;
  const t = now.getMinutes() / 60;
  return +((base * (1 - t) + next * t)).toFixed(2);
}

export function getMonthlyEnergyByType(year = new Date().getFullYear()): { month: string; solar: number; wind: number; hydro: number; fuelcell: number; ess: number; }[] {
  const result = [];
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  for (let m = 0; m < 12; m++) {
    if (year === currentYear && m > currentMonth) {
      result.push({ month: `${m + 1}월`, solar: 0, wind: 0, hydro: 0, fuelcell: 0, ess: 0 });
      continue;
    }
    const rand = mulberry32(year * 100 + m);
    const seasonalSolar = 0.7 + 0.5 * Math.sin(((m - 2) / 12) * Math.PI * 2);
    const seasonalWind = 0.7 + 0.4 * Math.cos(((m - 1) / 12) * Math.PI * 2);
    const seasonalHydro = 0.6 + 0.6 * Math.sin(((m - 5) / 12) * Math.PI * 2);
    const totals = { solar: 0, wind: 0, hydro: 0, fuelcell: 0, ess: 0 } as Record<EnergyType, number>;
    const hoursInMonth = 30 * 24;
    for (const p of PLANTS) {
      const cf = CAPACITY_FACTOR[p.type] * (
        p.type === 'solar' ? seasonalSolar :
        p.type === 'wind' ? seasonalWind :
        p.type === 'hydro' ? seasonalHydro : 1
      );
      const noise = 0.85 + rand() * 0.3;
      totals[p.type] += p.capacityMW * cf * hoursInMonth * noise;
    }
    result.push({
      month: `${m + 1}월`,
      solar: Math.round(totals.solar), wind: Math.round(totals.wind), hydro: Math.round(totals.hydro),
      fuelcell: Math.round(totals.fuelcell), ess: Math.round(totals.ess),
    });
  }
  return result;
}

// 발전소별 12개월 시스템 발전량(kWh) + 발전일수
export function getPlantMonthly12(plant: Plant, year = new Date().getFullYear()) {
  const now = new Date();
  return Array.from({ length: 12 }, (_, m) => {
    const isFuture = year === now.getFullYear() && m > now.getMonth();
    if (isFuture) return { month: m + 1, output: 0, days: 0 };
    const days = new Date(year, m + 1, 0).getDate();
    const rand = mulberry32(plant.id.charCodeAt(0) + year * 100 + m);
    const season = plant.type === 'solar' ? 0.7 + 0.5 * Math.sin(((m - 2) / 12) * Math.PI * 2)
      : plant.type === 'wind' ? 0.7 + 0.4 * Math.cos(((m - 1) / 12) * Math.PI * 2)
      : plant.type === 'hydro' ? 0.6 + 0.6 * Math.sin(((m - 5) / 12) * Math.PI * 2)
      : 1;
    const noise = 0.85 + rand() * 0.3;
    const mwh = plant.capacityMW * CAPACITY_FACTOR[plant.type] * season * days * 24 * noise;
    const kwh = Math.round(mwh * 1000);
    const genDays = plant.type === 'solar' ? Math.round(days * (0.85 + rand() * 0.1)) : days;
    return { month: m + 1, output: kwh, days: genDays };
  });
}

export function getThisMonthDailyByType() {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const today = now.getDate();
  const result = [];
  for (let d = 1; d <= lastDay; d++) {
    if (d > today) { result.push({ day: `${d}일`, solar: 0, wind: 0, hydro: 0, fuelcell: 0, ess: 0 }); continue; }
    const totals = { solar: 0, wind: 0, hydro: 0, fuelcell: 0, ess: 0 } as Record<EnergyType, number>;
    for (const p of PLANTS) totals[p.type] += getPlantDailyEnergy(p, d);
    result.push({
      day: `${d}일`,
      solar: Math.round(totals.solar), wind: Math.round(totals.wind), hydro: Math.round(totals.hydro),
      fuelcell: Math.round(totals.fuelcell), ess: Math.round(totals.ess),
    });
  }
  return result;
}

// 알람 (대시보드용 짧은 목록)
export interface Alarm { id: string; time: string; plantId: string; plantName: string; level: 'critical' | 'warning' | 'info'; message: string; }

function pickPlant(idx: number) { return PLANTS[idx % PLANTS.length]; }
export const ALARMS: Alarm[] = [
  { id: 'A1', time: '08:42', plantId: pickPlant(2).id, plantName: pickPlant(2).name, level: 'critical', message: '인버터 #3 정지 - 절연저항 저하' },
  { id: 'A2', time: '09:15', plantId: pickPlant(11).id, plantName: pickPlant(11).name, level: 'critical', message: 'SCADA 통신 두절 - 점검 요망' },
  { id: 'A3', time: '10:03', plantId: pickPlant(20).id, plantName: pickPlant(20).name, level: 'warning', message: '인버터 #7 온도 65℃ 경보' },
  { id: 'A4', time: '10:28', plantId: pickPlant(33).id, plantName: pickPlant(33).name, level: 'warning', message: '접속반 #2 DC 입력 불균형' },
  { id: 'A5', time: '11:10', plantId: pickPlant(50).id, plantName: pickPlant(50).name, level: 'warning', message: '응답 지연 (>3s)' },
  { id: 'A6', time: '11:45', plantId: pickPlant(60).id, plantName: pickPlant(60).name, level: 'info', message: '월간 정기 점검 완료' },
  { id: 'A7', time: '12:30', plantId: pickPlant(70).id, plantName: pickPlant(70).name, level: 'info', message: '예방정비 일정 등록' },
];

export function getYesterdayByPlant(): { plantId: string; plantName: string; type: EnergyType; capacityMW: number; energyMWh: number; utilization: number; }[] {
  const yDay = new Date(); yDay.setDate(yDay.getDate() - 1);
  return PLANTS.map(p => {
    const e = getPlantDailyEnergy(p, yDay.getDate());
    const util = (e / (p.capacityMW * 24)) * 100;
    return { plantId: p.id, plantName: p.name, type: p.type, capacityMW: p.capacityMW, energyMWh: e, utilization: +util.toFixed(1) };
  });
}

export const PRICE = { SMP: 142.5, REC: 75.2 };

export function getRevenueByPlantMonthly(year = new Date().getFullYear()) {
  const monthly = getMonthlyEnergyByType(year);
  return PLANTS.map(p => {
    const months = monthly.map((m, i) => {
      const typeMonth = m[p.type];
      const typeCap = PLANTS.filter(x => x.type === p.type).reduce((s, x) => s + x.capacityMW, 0);
      const share = typeCap > 0 ? p.capacityMW / typeCap : 0;
      const energy = typeMonth * share;
      const smp = energy * 1000 * PRICE.SMP;
      const rec = energy * 1000 * PRICE.REC;
      const revenue = smp + rec;
      const opex = p.capacityMW * 1_200_000;
      const maint = p.capacityMW * 800_000;
      const labor = p.capacityMW * 600_000;
      const cost = opex + maint + labor;
      return { month: m.month, energy: Math.round(energy), revenue: Math.round(revenue), cost: Math.round(cost), profit: Math.round(revenue - cost), smp: Math.round(smp), rec: Math.round(rec), opex, maint, labor };
    });
    return { plant: p, months };
  });
}

// ====== 설비(Device) ======
export type DeviceType = 'inverter' | 'combiner' | 'string' | 'weather' | 'communication';
export const DEVICE_LABEL: Record<DeviceType, string> = {
  inverter: '인버터', combiner: '접속반', string: '스트링', weather: '기상센서', communication: '통신설비',
};

export interface Device { id: string; plantId: string; type: DeviceType; name: string; capacityKW?: number; status: 'normal' | 'warning' | 'fault' | 'offline'; }

export function getDevicesForPlant(plantId: string): Device[] {
  const plant = PLANTS.find(p => p.id === plantId);
  if (!plant) return [];
  const rand = mulberry32(plantId.charCodeAt(0) * 31 + plantId.length);
  const devices: Device[] = [];
  devices.push({ id: `${plantId}-WS-01`, plantId, type: 'weather', name: '기상센서 #1', status: 'normal' });
  devices.push({ id: `${plantId}-COM-01`, plantId, type: 'communication', name: 'RTU/통신모뎀 #1', status: rand() > 0.92 ? 'warning' : 'normal' });
  if (plant.type === 'solar') {
    const invCount = Math.max(2, Math.round(plant.capacityMW / 5));
    for (let i = 1; i <= invCount; i++) {
      const r = rand();
      const status: Device['status'] = r > 0.95 ? 'fault' : r > 0.88 ? 'warning' : 'normal';
      devices.push({ id: `${plantId}-INV-${String(i).padStart(2, '0')}`, plantId, type: 'inverter', name: `인버터 #${i}`, capacityKW: Math.round((plant.capacityMW * 1000) / invCount), status });
    }
    const cbCount = Math.max(2, Math.round(invCount * 1.5));
    for (let i = 1; i <= cbCount; i++) devices.push({ id: `${plantId}-CB-${String(i).padStart(2, '0')}`, plantId, type: 'combiner', name: `접속반 #${i}`, status: rand() > 0.92 ? 'warning' : 'normal' });
    const strCount = cbCount * 8;
    for (let i = 1; i <= strCount; i++) {
      const r = rand();
      const status: Device['status'] = r > 0.97 ? 'fault' : r > 0.9 ? 'warning' : 'normal';
      devices.push({ id: `${plantId}-STR-${String(i).padStart(3, '0')}`, plantId, type: 'string', name: `스트링 #${i}`, status });
    }
  } else if (plant.type === 'wind') {
    const turbines = Math.max(3, Math.round(plant.capacityMW / 4));
    for (let i = 1; i <= turbines; i++) devices.push({ id: `${plantId}-TB-${String(i).padStart(2, '0')}`, plantId, type: 'inverter', name: `T-${String(i).padStart(2, '0')} 터빈`, capacityKW: Math.round((plant.capacityMW * 1000) / turbines), status: rand() > 0.93 ? 'warning' : 'normal' });
  } else {
    const units = plant.type === 'hydro' ? 4 : 6;
    for (let i = 1; i <= units; i++) devices.push({ id: `${plantId}-U-${String(i).padStart(2, '0')}`, plantId, type: 'inverter', name: `Unit #${i}`, capacityKW: Math.round((plant.capacityMW * 1000) / units), status: rand() > 0.94 ? 'warning' : 'normal' });
  }
  return devices;
}

export function getDeviceTimeSeries(deviceId: string, hours = 24, intervalMin: 15 | 60 | 1440 | 43200 = 60) {
  const rand = mulberry32(deviceId.split('').reduce((s, c) => s + c.charCodeAt(0), 0));
  const points: { ts: string; value: number; temp?: number; voltage?: number; current?: number }[] = [];
  const now = new Date();
  const stepMs = intervalMin * 60_000;
  const start = now.getTime() - hours * 3_600_000;
  const isWeather = deviceId.includes('WS');
  const isString = deviceId.includes('STR');
  for (let t = start; t <= now.getTime(); t += stepMs) {
    const d = new Date(t);
    const h = d.getHours() + d.getMinutes() / 60;
    const solarFactor = Math.max(0, Math.cos(((h - 12) / 7) * (Math.PI / 2))) * (h >= 5 && h <= 19 ? 1 : 0);
    const noise = 0.85 + rand() * 0.3;
    if (isWeather) points.push({ ts: d.toISOString(), value: +(800 * solarFactor * noise).toFixed(1), temp: +(15 + 12 * solarFactor + rand() * 3).toFixed(1) });
    else if (isString) points.push({ ts: d.toISOString(), value: +(8 * solarFactor * noise).toFixed(2), voltage: +(580 + rand() * 40).toFixed(1) });
    else points.push({ ts: d.toISOString(), value: +(500 * solarFactor * noise).toFixed(1), temp: +(35 + 25 * solarFactor + rand() * 5).toFixed(1), voltage: +(380 + rand() * 20).toFixed(1), current: +(120 * solarFactor * noise + rand() * 5).toFixed(1) });
  }
  return points;
}

export type Period = '15min' | '1h' | '1d' | '1mo';
export const PERIOD_LABEL: Record<Period, string> = { '15min': '15분', '1h': '1시간', '1d': '1일', '1mo': '1개월' };

export function getPlantHistory(plant: Plant, days: number, period: Period) {
  const rand = mulberry32(plant.id.charCodeAt(0) * 11 + days);
  const now = new Date();
  const points: { ts: string; energy: number; sales: number; utilization: number; irradiance: number }[] = [];
  let stepMs: number; let count: number;
  switch (period) {
    case '15min': stepMs = 15 * 60_000; count = (days * 24 * 60) / 15; break;
    case '1h': stepMs = 3_600_000; count = days * 24; break;
    case '1d': stepMs = 86_400_000; count = days; break;
    case '1mo': stepMs = 30 * 86_400_000; count = Math.max(1, Math.round(days / 30)); break;
  }
  for (let i = count - 1; i >= 0; i--) {
    const t = new Date(now.getTime() - i * stepMs);
    const h = t.getHours() + t.getMinutes() / 60;
    let factor = 0;
    const solarFactor = Math.max(0, Math.cos(((h - 12) / 7) * (Math.PI / 2))) * (h >= 5 && h <= 19 ? 1 : 0);
    if (plant.type === 'solar') factor = solarFactor;
    else if (plant.type === 'wind') factor = 0.3 + rand() * 0.6;
    else if (plant.type === 'fuelcell') factor = 0.85 + rand() * 0.1;
    else factor = 0.2 + rand() * 0.5;
    const noise = 0.85 + rand() * 0.3;
    const periodHours = period === '15min' ? 0.25 : period === '1h' ? 1 : period === '1d' ? 24 : 24 * 30;
    const energy = +(plant.capacityMW * factor * periodHours * noise * CAPACITY_FACTOR[plant.type] * 4).toFixed(2);
    const sales = +(energy * 0.97).toFixed(2);
    const util = +((energy / (plant.capacityMW * periodHours)) * 100).toFixed(1);
    const irradiance = +(800 * solarFactor * noise).toFixed(1);
    points.push({ ts: t.toISOString(), energy: Math.max(0, energy), sales: Math.max(0, sales), utilization: Math.max(0, util), irradiance });
  }
  return points;
}

// ====== 알람이력 ======
export interface AlarmRecord {
  id: string; ts: string; plantId: string; plantName: string; type: EnergyType;
  deviceType: DeviceType | 'plant'; deviceId?: string; level: 'critical' | 'warning' | 'info';
  message: string; resolved: boolean; memo?: string; relatedFaultId?: string;
}

export function getAlarmHistory(): AlarmRecord[] {
  const records: AlarmRecord[] = [];
  let id = 1;
  const messages: Record<string, string[]> = {
    inverter: ['DC 절연저항 저하', '온도 임계치 초과 (75℃)', '출력 0 - 정지 상태', 'AC 전압 변동 경보', '냉각팬 이상'],
    combiner: ['DC 입력 불균형', '퓨즈 단선 의심', '내부 온도 경보'],
    string: ['전류 저하 (-15%)', '핫스팟 의심', '단선 가능성'],
    weather: ['일사량 센서 응답 없음', '풍속계 이상치 감지'],
    communication: ['통신 두절 (RTU)', 'VPN 재접속 실패', '데이터 수집 지연'],
    plant: ['SCADA 통신 두절', '계통 차단기 동작', '비상정지 작동'],
  };
  const now = Date.now();
  for (let i = 0; i < 80; i++) {
    const p = PLANTS[Math.floor((Math.sin(i * 1.7) + 1) / 2 * (PLANTS.length - 1))];
    const dts: (DeviceType | 'plant')[] = ['inverter', 'combiner', 'string', 'weather', 'communication', 'plant'];
    const dt = dts[i % dts.length];
    const msgs = messages[dt];
    const level: AlarmRecord['level'] = i % 7 === 0 ? 'critical' : i % 3 === 0 ? 'warning' : 'info';
    const ago = i * 3_600_000 * 2 + Math.floor(((i * 9301 + 49297) % 233280) / 233280 * 1_800_000);
    records.push({
      id: `AL-${String(id++).padStart(5, '0')}`,
      ts: new Date(now - ago).toISOString(),
      plantId: p.id, plantName: p.name, type: p.type, deviceType: dt,
      deviceId: dt !== 'plant' ? `${p.id}-${dt.toUpperCase().slice(0, 3)}-01` : undefined,
      level, message: msgs[i % msgs.length], resolved: i > 10,
    });
  }
  return records;
}


// ====== 장애 등록 ======
export type DeviceCategory = '발전설비' | '통신설비' | '기타';
export const DEVICE_SUBCATEGORIES: Record<DeviceCategory, string[]> = {
  '발전설비': ['인버터', '기상센서', '접속반', '차단기', '기타'],
  '통신설비': ['라우터', 'VPN', 'RTU', '통신모뎀'],
  '기타': ['기타'],
};

export interface FaultRecord {
  id: string; plantId: string; plantName: string; type: EnergyType;
  deviceCategory: DeviceCategory; deviceSubcategory: string; deviceDetail: string; deviceName: string;
  faultStart: string; faultExpectedEnd: string; faultEnd?: string;
  description: string; lostEnergyMWh: number; lostRevenueKRW: number;
  status: 'open' | 'resolved'; relatedAlarmId?: string;
}

export function generateFaultRecords(): FaultRecord[] {
  const p0 = PLANTS[0], p1 = PLANTS[10], p2 = PLANTS[25], p3 = PLANTS[40], p4 = PLANTS[68];
  const list: FaultRecord[] = [
    { id: 'FT-2025-0001', plantId: p0.id, plantName: p0.name, type: p0.type, deviceCategory: '발전설비', deviceSubcategory: '인버터', deviceDetail: '#3', deviceName: '인버터 #3', faultStart: '2025-04-15T08:42:00', faultExpectedEnd: '2025-04-17T18:00:00', faultEnd: '2025-04-17T17:30:00', description: '인버터 #3 절연저항 저하로 정지. 모듈 교체 완료.', lostEnergyMWh: 0, lostRevenueKRW: 0, status: 'resolved' },
    { id: 'FT-2025-0002', plantId: p1.id, plantName: p1.name, type: p1.type, deviceCategory: '통신설비', deviceSubcategory: 'RTU', deviceDetail: 'RTU #1', deviceName: 'RTU #1', faultStart: '2025-04-22T09:15:00', faultExpectedEnd: '2025-04-30T00:00:00', description: 'SCADA 통신 두절. 부품 입고 대기.', lostEnergyMWh: 0, lostRevenueKRW: 0, status: 'open' },
    { id: 'FT-2025-0003', plantId: p2.id, plantName: p2.name, type: p2.type, deviceCategory: '발전설비', deviceSubcategory: '인버터', deviceDetail: '#7', deviceName: '인버터 #7', faultStart: '2025-04-10T10:03:00', faultExpectedEnd: '2025-04-10T18:00:00', faultEnd: '2025-04-10T16:00:00', description: '과열 자동 정지 → 냉각팬 교체.', lostEnergyMWh: 0, lostRevenueKRW: 0, status: 'resolved' },
    { id: 'FT-2025-0004', plantId: p3.id, plantName: p3.name, type: p3.type, deviceCategory: '발전설비', deviceSubcategory: '접속반', deviceDetail: '#12', deviceName: '접속반 #12', faultStart: '2025-03-28T14:20:00', faultExpectedEnd: '2025-03-29T12:00:00', faultEnd: '2025-03-29T09:00:00', description: '낙뢰 SPD 소손 → 교체.', lostEnergyMWh: 0, lostRevenueKRW: 0, status: 'resolved' },
    { id: 'FT-2025-0005', plantId: p4.id, plantName: p4.name, type: p4.type, deviceCategory: '발전설비', deviceSubcategory: '기타', deviceDetail: '주베어링', deviceName: '주베어링', faultStart: '2025-04-25T03:10:00', faultExpectedEnd: '2025-04-27T00:00:00', faultEnd: '2025-04-26T22:45:00', description: '진동 임계치 초과 → 베어링 교체.', lostEnergyMWh: 0, lostRevenueKRW: 0, status: 'resolved' },
  ];
  return list.map(f => {
    if (!f.faultEnd) return f;
    const plant = PLANTS.find(p => p.id === f.plantId)!;
    const hours = (new Date(f.faultEnd).getTime() - new Date(f.faultStart).getTime()) / 3_600_000;
    const lost = +(plant.capacityMW * hours * CAPACITY_FACTOR[plant.type] * 0.4).toFixed(2);
    const revenueLost = Math.round(lost * 1000 * (PRICE.SMP + PRICE.REC));
    return { ...f, lostEnergyMWh: lost, lostRevenueKRW: revenueLost };
  });
}

export const FAULT_RECORDS: FaultRecord[] = generateFaultRecords();

// ====== 예방정비 / 정기검사 ======
export type InspectionKind = '월간점검' | '분기점검' | '연간점검' | '특별점검' | '정기검사';

export interface MaintenanceRecord {
  id: string; plantId: string; plantName: string; type: EnergyType;
  category: InspectionKind;
  subKind?: string; // 특별점검/정기검사일 때 점검종류·검사종류
  scheduledDate: string; completedDate?: string;
  result?: 'confirmed' | 'revision' | 'pending'; notes?: string; inspector?: string;
  deficiency?: string; // 수정요청 시 감독이 남기는 미비점
  reportId?: string;
}

export const MAINTENANCE_RECORDS: MaintenanceRecord[] = (() => {
  const ops = ['윤지훈', '김성민', '차주현'];
  const cats: InspectionKind[] = ['월간점검', '분기점검', '연간점검', '특별점검', '정기검사'];
  const subs: Record<string, string[]> = {
    '특별점검': ['낙뢰 피해', '태풍 후 점검', '화재 대응'],
    '정기검사': ['전기설비 정기검사', '한전 계량설비 검사'],
  };
  const out: MaintenanceRecord[] = [];
  for (let i = 0; i < 14; i++) {
    const p = PLANTS[(i * 7) % PLANTS.length];
    const cat = cats[i % cats.length];
    const isPast = i % 3 !== 0;
    const m = (i % 5) + 1;
    const d = String(((i * 3) % 28) + 1).padStart(2, '0');
    const scheduled = `2025-${String(m).padStart(2, '0')}-${d}`;
    out.push({
      id: `MT-2025-${String(i + 1).padStart(3, '0')}`,
      plantId: p.id, plantName: p.name, type: p.type, category: cat,
      subKind: subs[cat] ? subs[cat][i % subs[cat].length] : undefined,
      scheduledDate: scheduled,
      completedDate: isPast ? scheduled : undefined,
      result: isPast ? (i % 8 === 0 ? 'revision' : 'confirmed') : 'pending',
      notes: isPast ? '정기 점검 수행 — 정상' : '예정',
      deficiency: isPast && i % 8 === 0 ? '접속함 케이블 결선상태 재확인 필요' : undefined,
      inspector: ops[i % 3],
    });
  }
  return out;
})();

// 향후 정기검사 일정 (대시보드 표시용)
export interface InspectionSchedule {
  id: string; plantId: string; plantName: string; type: EnergyType;
  scheduledDate: string; category: '정기검사' | '연차점검'; inspector: string; institution: string;
}

export const INSPECTION_SCHEDULES: InspectionSchedule[] = (() => {
  const out: InspectionSchedule[] = [];
  const ops = ['윤지훈', '김성민', '차주현'];
  for (let i = 0; i < PLANTS.length; i++) {
    if (i % 4 !== 0) continue;
    const p = PLANTS[i];
    const m = 5 + (i % 8);
    const day = String(((i * 5) % 28) + 1).padStart(2, '0');
    const year = m > 12 ? 2026 : 2025;
    const month = String(m > 12 ? m - 12 : m).padStart(2, '0');
    out.push({
      id: `INS-${String(out.length + 1).padStart(4, '0')}`,
      plantId: p.id, plantName: p.name, type: p.type,
      scheduledDate: `${year}-${month}-${day}`,
      category: i % 8 === 0 ? '연차점검' : '정기검사',
      inspector: ops[i % 3], institution: i % 2 === 0 ? '전기안전공사' : '내부 점검팀',
    });
  }
  return out.sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));
})();

// ====== 사업/수익 입력값 ======
export interface PlantBusiness {
  plantId: string; weight: number; capexKRW: number; depreciationYears: number;
  rentKRW: number; insuranceKRW: number; safetyMgmtKRW: number; repairKRW: number;
  outsourceKRW: number; miscIncomeKRW: number; miscLossKRW: number;
}

const WEIGHT_BY_TYPE: Record<EnergyType, number> = { solar: 1.2, wind: 1.0, hydro: 1.0, fuelcell: 2.0, ess: 5.0 };

export const PLANT_BUSINESS: Record<string, PlantBusiness> = Object.fromEntries(
  PLANTS.map(p => [p.id, {
    plantId: p.id, weight: WEIGHT_BY_TYPE[p.type],
    capexKRW: Math.round(p.capacityMW * 1_500_000_000),
    depreciationYears: p.type === 'solar' ? 20 : p.type === 'wind' ? 25 : p.type === 'hydro' ? 40 : 15,
    rentKRW: Math.round(p.capacityMW * 350_000),
    insuranceKRW: Math.round(p.capacityMW * 180_000),
    safetyMgmtKRW: Math.round(p.capacityMW * 80_000) + 200_000,
    repairKRW: Math.round(p.capacityMW * 250_000),
    outsourceKRW: Math.round(p.capacityMW * 150_000),
    miscIncomeKRW: Math.round(p.capacityMW * 30_000),
    miscLossKRW: Math.round(p.capacityMW * 20_000),
  }])
);

export const TOTAL_REPAIR_BUDGET_KRW = 3_500_000_000;

// 12개 비용 카테고리 (요구사항 기준)
export const COST_CATEGORY_KEYS = [
  'depreciation', 'repair', 'rent', 'safetyMgmt', 'elecComm', 'insurance',
  'repairMaint', 'outsource', 'recFee', 'misc', 'corporateTax', 'etc',
] as const;
export type CostCategoryKey = typeof COST_CATEGORY_KEYS[number];
export const COST_CATEGORY_LABEL: Record<CostCategoryKey, string> = {
  depreciation: '감가상각', repair: '경상정비', rent: '지급임차료',
  safetyMgmt: '전기안전관리대행', elecComm: '전력비/통신비', insurance: '보험료',
  repairMaint: '수선유지비', outsource: '외주용역비', recFee: '지급수수료',
  misc: '잡이익/잡손실', corporateTax: '법인세', etc: '기타비용',
};

export function getPlantCostBreakdown(plantId: string) {
  const p = PLANTS.find(x => x.id === plantId)!;
  const b = PLANT_BUSINESS[plantId];
  const totalCap = PLANTS.reduce((s, x) => s + x.capacityMW, 0);
  const depreciation = Math.round(b.capexKRW / b.depreciationYears / 12);
  const repairAlloc = Math.round((TOTAL_REPAIR_BUDGET_KRW * (p.capacityMW / totalCap)) / 12);
  const elecComm = Math.round(p.capacityMW * 90_000);
  const monthlyMWh = p.capacityMW * 24 * 30 * CAPACITY_FACTOR[p.type];
  const monthlyREC = Math.round(monthlyMWh * b.weight);
  const recFee = monthlyREC * 50;
  const corporateTax = Math.round((p.capacityMW * 1_100_000));
  const etc = Math.round(p.capacityMW * 50_000);
  return {
    depreciation, repair: repairAlloc, rent: b.rentKRW, elecComm,
    insurance: b.insuranceKRW, safetyMgmt: b.safetyMgmtKRW,
    repairMaint: b.repairKRW, outsource: b.outsourceKRW, recFee,
    miscIncome: b.miscIncomeKRW, miscLoss: b.miscLossKRW,
    misc: b.miscLossKRW - b.miscIncomeKRW, corporateTax, etc,
    total: depreciation + repairAlloc + b.rentKRW + elecComm + b.insuranceKRW + b.safetyMgmtKRW + b.repairKRW + b.outsourceKRW + recFee + b.miscLossKRW + corporateTax + etc - b.miscIncomeKRW,
  };
}

export function getPlantRevenueBreakdown(plantId: string) {
  const p = PLANTS.find(x => x.id === plantId)!;
  const b = PLANT_BUSINESS[plantId];
  const monthlyMWh = p.capacityMW * 24 * 30 * CAPACITY_FACTOR[p.type];
  const salesMWh = monthlyMWh * 0.97;
  const utilization = CAPACITY_FACTOR[p.type] * 100;
  const smpRevenue = Math.round(salesMWh * 1000 * PRICE.SMP);
  const recRevenue = Math.round(salesMWh * 1000 * PRICE.REC * b.weight);
  const totalRevenue = smpRevenue + recRevenue;
  const avgUnitPrice = +(totalRevenue / (salesMWh * 1000)).toFixed(1);
  return {
    capacityMW: p.capacityMW, weight: b.weight,
    monthlyMWh: +monthlyMWh.toFixed(1), salesMWh: +salesMWh.toFixed(1), utilization: +utilization.toFixed(1),
    avgSMP: PRICE.SMP, avgREC: PRICE.REC, smpRevenue, recRevenue, totalRevenue, avgUnitPrice,
  };
}

// === 출력제어 (인버터 RTU) ===========================================
export type InverterMode = 'on' | 'off' | 'target';
export interface InverterState {
  plantId: string;
  name: string;
  capacityKW: number;
  targetSupported: boolean;
  mode: InverterMode;
  targetPct: number; // 0~100, mode==='target'일 때 유효
}

const INVERTER_STORE = new Map<string, InverterState[]>();

export function getInvertersForPlant(plantId: string): InverterState[] {
  if (INVERTER_STORE.has(plantId)) return INVERTER_STORE.get(plantId)!;
  const p = PLANTS.find(x => x.id === plantId);
  if (!p) return [];
  const items = getPlantEquipment(plantId).filter(e => e.kind === 'inverter');
  const perKW = (p.capacityMW * 1000) / Math.max(1, items.length);
  const h = hashStr(plantId);
  const list: InverterState[] = items.map((it, i) => ({
    plantId,
    name: it.name,
    capacityKW: +perKW.toFixed(1),
    // 짝수 인덱스 + 해시 기반: 약 70%는 타겟제어 지원
    targetSupported: ((h >> i) & 1) === 1 || i % 2 === 0,
    mode: 'on',
    targetPct: 100,
  }));
  INVERTER_STORE.set(plantId, list);
  return list;
}

export function setInverterState(plantId: string, name: string, patch: Partial<InverterState>): InverterState[] {
  const list = getInvertersForPlant(plantId).map(v =>
    v.name === name ? { ...v, ...patch } : v
  );
  INVERTER_STORE.set(plantId, list);
  return list;
}

export interface PlantControlSummary {
  plant: Plant;
  total: number;
  on: number;
  off: number;
  targeted: number;
  avgTargetPct: number;
}

export function getControlledPlants(): PlantControlSummary[] {
  const result: PlantControlSummary[] = [];
  for (const p of PLANTS) {
    const list = INVERTER_STORE.get(p.id);
    if (!list) continue;
    const off = list.filter(v => v.mode === 'off').length;
    const targeted = list.filter(v => v.mode === 'target').length;
    if (off === 0 && targeted === 0) continue; // 전부 ON이면 미제어
    const on = list.filter(v => v.mode === 'on').length;
    const tList = list.filter(v => v.mode === 'target');
    const avgTargetPct = tList.length ? Math.round(tList.reduce((a, b) => a + b.targetPct, 0) / tList.length) : 0;
    result.push({ plant: p, total: list.length, on, off, targeted, avgTargetPct });
  }
  return result;
}

// ====== Period-based revenue/cost helpers (for SalesAndCost / Revenue with PeriodPicker) ======
function monthSeed(plantId: string, year: number, month: number) {
  return mulberry32(plantId.charCodeAt(0) * 7919 + plantId.length * 31 + year * 100 + month);
}

function monthlyEnergyMWh(plant: Plant, year: number, month: number): number {
  const now = new Date();
  if (year === now.getFullYear() && month - 1 > now.getMonth()) return 0;
  if (year > now.getFullYear()) return 0;
  const days = new Date(year, month, 0).getDate();
  const rand = monthSeed(plant.id, year, month);
  const m = month - 1;
  const season = plant.type === 'solar' ? 0.7 + 0.5 * Math.sin(((m - 2) / 12) * Math.PI * 2)
    : plant.type === 'wind' ? 0.7 + 0.4 * Math.cos(((m - 1) / 12) * Math.PI * 2)
    : plant.type === 'hydro' ? 0.6 + 0.6 * Math.sin(((m - 5) / 12) * Math.PI * 2)
    : 1;
  const noise = 0.85 + rand() * 0.3;
  return plant.capacityMW * CAPACITY_FACTOR[plant.type] * season * days * 24 * noise;
}

export interface PeriodMonthRow {
  year: number; month: number; label: string;
  energy: number; smp: number; rec: number; revenue: number; cost: number; profit: number;
}

/** Per-plant per-month detail used by Revenue / SalesAndCost pages. */
export function getPlantPeriodRow(plantId: string, year: number, month: number): PeriodMonthRow {
  const p = PLANTS.find(x => x.id === plantId)!;
  const b = PLANT_BUSINESS[plantId];
  const energy = monthlyEnergyMWh(p, year, month);
  const smp = energy * 1000 * PRICE.SMP;
  const rec = energy * 1000 * PRICE.REC * b.weight;
  const revenue = smp + rec;
  // monthly cost = sum of breakdown with small per-month noise
  const breakdown = getPlantCostBreakdown(plantId);
  const rand = monthSeed(plantId + 'C', year, month);
  const costNoise = 0.92 + rand() * 0.16;
  const cost = Math.round(breakdown.total * costNoise);
  return {
    year, month, label: `${year}-${String(month).padStart(2, '0')}`,
    energy: Math.round(energy),
    smp: Math.round(smp), rec: Math.round(rec),
    revenue: Math.round(revenue),
    cost, profit: Math.round(revenue) - cost,
  };
}

export function getPlantPeriodSeries(plantId: string, months: { year: number; month: number }[]): PeriodMonthRow[] {
  return months.map(m => getPlantPeriodRow(plantId, m.year, m.month));
}

/** Average of (prev 3 calendar months before given ym) for anomaly detection. */
export function getPlantPrev3Avg(plantId: string, year: number, month: number): { revenue: number; cost: number; profit: number } {
  const prev: PeriodMonthRow[] = [];
  let y = year, m = month;
  for (let i = 0; i < 3; i++) {
    m -= 1;
    if (m < 1) { m = 12; y -= 1; }
    prev.push(getPlantPeriodRow(plantId, y, m));
  }
  const n = prev.length;
  return {
    revenue: Math.round(prev.reduce((s, r) => s + r.revenue, 0) / n),
    cost: Math.round(prev.reduce((s, r) => s + r.cost, 0) / n),
    profit: Math.round(prev.reduce((s, r) => s + r.profit, 0) / n),
  };
}

// ====== Weather / Calendar / Equipment status for PlantDetail summary ======
const WEATHER_ICONS = ['sunny','cloudy','partly','rainy','snow'] as const;
export type WeatherIcon = typeof WEATHER_ICONS[number];

function pickWeather(seed: number): WeatherIcon {
  const r = ((seed * 9301 + 49297) % 233280) / 233280;
  if (r < 0.45) return 'sunny';
  if (r < 0.75) return 'partly';
  if (r < 0.9) return 'cloudy';
  if (r < 0.97) return 'rainy';
  return 'snow';
}

export interface CalendarDayWeather {
  day: number; icon: WeatherIcon; avgTemp: number; avgIrradiance: number;
}
export function getPlantWeatherCalendar(plantId: string, year: number, month: number): CalendarDayWeather[] {
  const days = new Date(year, month, 0).getDate();
  const h = hashStr(plantId);
  const out: CalendarDayWeather[] = [];
  const seasonT = month >= 6 && month <= 8 ? 27 : month >= 12 || month <= 2 ? 2 : 17;
  for (let d = 1; d <= days; d++) {
    const seed = h + year * 1000 + month * 50 + d;
    const r1 = mulberry32(seed)();
    const r2 = mulberry32(seed + 1)();
    const icon = pickWeather(seed);
    const temp = +(seasonT + (r1 - 0.5) * 8).toFixed(1);
    const baseIrr = icon === 'sunny' ? 650 : icon === 'partly' ? 480 : icon === 'cloudy' ? 280 : icon === 'rainy' ? 120 : 90;
    out.push({ day: d, icon, avgTemp: temp, avgIrradiance: Math.round(baseIrr + r2 * 80) });
  }
  return out;
}

export interface WeatherSummary {
  observedAt: string;
  today: { icon: WeatherIcon; temp: number };
  yesterday: { icon: WeatherIcon; temp: number };
  tomorrow: { icon: WeatherIcon; temp: number };
  irradiance: number; windDir: number; windSpeed: number; humidity: number;
}
export function getPlantWeatherSummary(plantId: string): WeatherSummary {
  const now = new Date();
  const cal = getPlantWeatherCalendar(plantId, now.getFullYear(), now.getMonth() + 1);
  const d = now.getDate();
  const today = cal[d - 1] ?? cal[0];
  const ySrc = cal[d - 2] ?? cal[0];
  const tSrc = cal[d] ?? cal[cal.length - 1];
  const h = hashStr(plantId + 'W');
  const rand = mulberry32(h + d);
  const obs = new Date(now);
  obs.setMinutes(0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    observedAt: `${obs.getFullYear()}-${pad(obs.getMonth() + 1)}-${pad(obs.getDate())} ${pad(obs.getHours())}:00:00`,
    today: { icon: today.icon, temp: today.avgTemp },
    yesterday: { icon: ySrc.icon, temp: ySrc.avgTemp },
    tomorrow: { icon: tSrc.icon, temp: tSrc.avgTemp },
    irradiance: today.avgIrradiance,
    windDir: Math.round(rand() * 360),
    windSpeed: +(0.5 + rand() * 5).toFixed(1),
    humidity: Math.round(40 + rand() * 55),
  };
}

export interface InverterStatusRow {
  name: string;
  activeP: number;     // 유효전력 kW
  reactiveP: number;   // 무효전력 kVar
  reactiveLag: number; // 무효지상 kVar
  reactiveLead: number;// 무효진상 kVar
  dcP: number;         // DC전력 kW
  acP: number;         // AC전력 kW
  cumEnergy: number;   // 누적발전량 MWh
  temp: number;        // ℃
  ok: boolean;
}
export function getPlantInverterStatus(plantId: string): InverterStatusRow[] {
  const items = getPlantEquipment(plantId).filter(e => e.kind === 'inverter');
  const p = PLANTS.find(x => x.id === plantId);
  if (!p) return [];
  const perKW = (p.capacityMW * 1000) / Math.max(1, items.length);
  const hour = new Date().getHours();
  const dayFactor = p.type === 'solar'
    ? (hour >= 6 && hour <= 19 ? Math.sin(((hour - 6) / 13) * Math.PI) : 0)
    : p.type === 'wind' ? 0.4 + 0.3 : p.type === 'fuelcell' ? 0.9 : 0.5;
  return items.map((it, i) => {
    const rand = mulberry32(hashStr(plantId + it.name));
    const factor = Math.max(0, dayFactor * (0.85 + rand() * 0.2));
    const acP = +(perKW * factor).toFixed(1);
    const dcP = +(acP / (0.94 + rand() * 0.04)).toFixed(1);
    const reactiveLag = +(acP * (0.05 + rand() * 0.05)).toFixed(1);
    const reactiveLead = +(acP * (0.02 + rand() * 0.03)).toFixed(1);
    const reactiveP = +(reactiveLag - reactiveLead).toFixed(1);
    return {
      name: it.name,
      activeP: acP,
      reactiveP, reactiveLag, reactiveLead,
      dcP, acP,
      cumEnergy: +(perKW * 0.001 * 24 * 365 * 2 * (0.9 + rand() * 0.2)).toFixed(2),
      temp: +(35 + factor * 25 + rand() * 4).toFixed(1),
      ok: it.ok,
    };
  });
}

export interface WeatherSensorRow {
  name: string; moduleTemp: number; ambientTemp: number; humidity: number; irradiance: number; ok: boolean;
}
export function getPlantWeatherSensors(plantId: string): WeatherSensorRow[] {
  const p = PLANTS.find(x => x.id === plantId);
  if (!p) return [];
  const s = getPlantWeatherSummary(plantId);
  const rand = mulberry32(hashStr(plantId + 'WS'));
  return [{
    name: 'WTH-01',
    moduleTemp: +(s.today.temp + 15 + rand() * 8).toFixed(1),
    ambientTemp: s.today.temp,
    humidity: s.humidity,
    irradiance: s.irradiance,
    ok: true,
  }];
}

export interface BreakerStatusRow {
  name: string; closed: boolean; activeP: number; reactiveP: number; ok: boolean;
}
export function getPlantBreakerStatus(plantId: string): BreakerStatusRow[] {
  const items = getPlantEquipment(plantId).filter(e => e.kind === 'breaker' || e.kind === 'combiner');
  const invs = getPlantInverterStatus(plantId);
  const totAc = invs.reduce((s, i) => s + i.acP, 0);
  return items.map((it, i) => {
    const rand = mulberry32(hashStr(plantId + it.name));
    return {
      name: it.name,
      closed: it.ok,
      activeP: +(totAc / items.length * (0.95 + rand() * 0.1)).toFixed(1),
      reactiveP: +(totAc / items.length * 0.05 * (0.5 + rand())).toFixed(1),
      ok: it.ok,
    };
  });
}

/** Current output aggregated by energy type, scoped to provided plant list. */
export function getCurrentOutputByType(plants: Plant[]): { type: EnergyType; output: number; capacity: number }[] {
  const map: Record<string, { output: number; capacity: number }> = {};
  for (const p of plants) {
    if (!map[p.type]) map[p.type] = { output: 0, capacity: 0 };
    map[p.type].output += getCurrentOutput(p);
    map[p.type].capacity += p.capacityMW;
  }
  return (Object.keys(map) as EnergyType[]).map(t => ({ type: t, output: +map[t].output.toFixed(2), capacity: +map[t].capacity.toFixed(2) }));
}
