# prototype/

정식 구현(P0~) 전에 설계를 검증하는 임시 도구. 정식 코드(`src/`)가 생기면 이 폴더의 로직은 참고용으로만 남는다.

```
prototype/
  narrative-sim/
    narrate_demo.py      서술 엔진 프로토타입 (narrative-engine.md §6~§8 규칙). 데이터에서 대사·나레이션을 골라 대본 출력
  mockup/
    src/mockup.html      화면 목업 템플릿 (메인 · 소환 · 맵 · 전투/다이스)
    build.py             데이터 + 시뮬레이터 대본 + 후유키 타일 이미지를 HTML 한 파일로 묶음
    dist/fsn6-mockup.html  빌드 결과 (브라우저·폰에서 바로 열기)
```

## 실행
```
npm run sim      # 시드 6으로 대본 출력 (선택 근거 포함)
npm run mockup   # 목업 다시 빌드 (npm install 필요: 폰트를 node_modules/pretendard에서 가져온다)
```
대사 JSON(`data/`)을 고친 뒤 `build.py`를 다시 돌리면 목업에 반영된다.

## 목업 범위
- 메인 → 소환(랜덤/촉매, 7기) → 1일차 낮(교류·정보 수집·이동) → 밤 → 강변 조우 → 3국면 전투(2d10 3D 다이스, 기적, 보구 개방) → 2일차 아침
- 전투 대본은 시뮬레이터 시드 6 출력(알트리아 vs 랜서). 낮 교류 대사는 목업 안에서 현재 타일 지형으로 실제 선택
- 비활성(미정 항목): 제작, 마력 공급, 밤 대기·정찰, 도주, 영주 버프 분기
