// 전체 서번트 프로필 한 묶음 (D-166). 촉매 목록·판 구성에 전원이 필요하므로, 수백 기를 파일마다 따로 요청하지 않도록 한 청크로 묶는다.
// load.ts가 동적으로 불러온다 (첫 화면 번들에는 들어가지 않는다). 판 로딩(loadServantProfiles)도 이 묶음을 쓴다.
const raw = import.meta.glob<unknown>('/data/servants/*/profile.json', { eager: true, import: 'default' });

export const profiles: unknown[] = Object.keys(raw)
  .sort()
  .map((k) => raw[k]);

/** 서번트 ID(폴더 이름) → 원본 프로필 */
export const profileById = new Map(Object.entries(raw).map(([k, v]) => [k.split('/')[3]!, v]));
