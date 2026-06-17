import type { Plant } from '@/data/mockData';

// 결정론적 해시 (id 기반) – 발전소별 데이터 보유 상황 모의
function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export interface PlantCapabilities {
  hasDcCombiner: boolean;   // 접속반 데이터
  hasWeatherSensor: boolean; // 일사량 센서
  inverterCount: number;
}

export function getCapabilities(plant: Plant): PlantCapabilities {
  const h = hash(plant.id);
  // 용량이 클수록 인버터 수 많음
  const inverterCount = Math.max(2, Math.min(12, Math.round(plant.capacityMW * 1.5) + 2));
  // 1MW 이상이면 접속반 DC 데이터 보유 확률↑
  const hasDcCombiner = plant.capacityMW >= 1.0 ? (h % 5) !== 0 : (h % 4) === 0;
  // 대형 발전소(2MW+) 일부에 기상센서
  const hasWeatherSensor = plant.capacityMW >= 2.0 ? (h % 3) !== 0 : (h % 7) === 0;
  return { hasDcCombiner, hasWeatherSensor, inverterCount };
}

export interface InverterOutput {
  id: string;
  name: string;
  ac: number;        // kW
  dc?: number;       // kW (DC 입력)
  ratedKW: number;
}

export function getInverterOutputs(plant: Plant): InverterOutput[] {
  const caps = getCapabilities(plant);
  const ratedKW = (plant.capacityMW * 1000) / caps.inverterCount;
  const h = hash(plant.id);
  // 시간대에 따른 출력 변화(0~1)
  const hour = new Date().getHours();
  const dayFactor = hour >= 6 && hour <= 19 ? Math.sin(((hour - 6) / 13) * Math.PI) : 0;
  return Array.from({ length: caps.inverterCount }, (_, i) => {
    const seed = ((h >> i) % 100) / 100;
    // 0.78 ~ 1.0 범위, 한두 개는 의도적으로 낮춤
    let factor = 0.85 + seed * 0.15;
    if (i === (h % caps.inverterCount)) factor -= 0.12; // 저성능 인버터
    const ac = Math.max(0, ratedKW * dayFactor * factor);
    const dc = caps.hasDcCombiner ? ac / (0.93 + (seed * 0.06)) : undefined;
    return {
      id: `${plant.id}-INV${String(i + 1).padStart(2, '0')}`,
      name: `INV-${String(i + 1).padStart(2, '0')}`,
      ac, dc, ratedKW,
    };
  });
}

// 인버터 상호 비교: 평균보다 8%↓ 인버터 탐지
export function compareInverters(invs: InverterOutput[]) {
  const active = invs.filter(i => i.ac > 0);
  if (active.length < 2) return { avg: 0, warnings: [] as InverterOutput[], items: invs };
  const avg = active.reduce((s, i) => s + i.ac, 0) / active.length;
  const warnings = active.filter(i => i.ac < avg * 0.92);
  return { avg, warnings, items: invs };
}

// 변환효율
export function efficiencyOf(invs: InverterOutput[]) {
  const items = invs.filter(i => i.dc && i.dc > 0).map(i => ({
    ...i, eff: (i.ac / (i.dc as number)) * 100,
  }));
  const avg = items.length ? items.reduce((s, x) => s + x.eff, 0) / items.length : 0;
  const warnings = items.filter(x => x.eff < 94);
  return { items, avg, warnings };
}

// 일사량 기반 PR 계수 (모의)
export function performanceRatio(plant: Plant, invs: InverterOutput[]) {
  const h = hash(plant.id);
  const hour = new Date().getHours();
  const irr = hour >= 6 && hour <= 19 ? Math.sin(((hour - 6) / 13) * Math.PI) * (700 + (h % 250)) : 0; // W/m²
  const totalAcKW = invs.reduce((s, i) => s + i.ac, 0);
  const expectedKW = (plant.capacityMW * 1000) * (irr / 1000);
  const pr = expectedKW > 0 ? (totalAcKW / expectedKW) * 100 : 0;
  return { irradiance: irr, totalAcKW, expectedKW, pr };
}
