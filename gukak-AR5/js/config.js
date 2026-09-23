/* =========================================================================
   gukak-AR5(아리랑) 프로젝트 설정 — common.js 보다 "먼저" 로드된다.
   ★ 오디오는 아직 미납품이다(클릭/호버음만 AR2 것을 복사해 둠). 아래 경로는 예약해 둔
     이름이며, 파일이 없으면 조용히 무시하고 진행한다(무음 graceful).
     납품되면 파일만 넣으면 된다 — audio/README.txt 참고.
   ========================================================================= */
window.AR_CONFIG = {
  bgm: "", // HOME/MAIN 배경음 없음(기획). 활동1 음악은 exp1.js 가 직접 관리
  clickSfx: "audio/effects/click.mp3",
  hoverSfx: "audio/effects/hover.mp3",
  prefix: "gukak_ar5",
};

/* 내레이션 / 음악 / 효과음 경로 — 각 화면 js 가 참조한다(경로는 여기 한 곳에만 둔다). */
window.AR5_SFX = {
  title01: "audio/narration/title_01.mp3", // 아리랑, 같은 마음으로 부르는 노래          (HOME)
  doram01: "audio/narration/doram_01.mp3", // 아리랑이 각 지역의 풍경을 만나 어떻게 발전됐을까? (MAIN 진입)
  doram02: "audio/narration/doram_02.mp3", // 아리랑이 산 넘고 바다를 건너며 어떻게 바뀌었을까? (MAIN 활동1)
  doram03: "audio/narration/doram_03.mp3", // 각 지역 아리랑에는 어떤 풍경이 담겨있을까?        (MAIN 활동2)
  chandol01: "audio/narration/chandol_01.mp3", // 우리와 함께 아리랑이 산 넘고 바다를 건너게 도와줘! (활동1 안내)
  chandol02: "audio/narration/chandol_02.mp3", // 도람이를 고향인 정선으로 옮겨줘!
  chandol03: "audio/narration/chandol_03.mp3", // 이번에는 나를 고향 밀양으로 데려가줘!
  chandol04: "audio/narration/chandol_04.mp3", // 다온이를 진도로 옮겨주세요!
  chandol05: "audio/narration/chandol_05.mp3", // 정선, 밀양, 진도의 아리랑을 모두 들어봤어! (활동1 종료)

  // 활동1 음악 — 한양 대기 중 반복 / 도착 시 지역 후렴(크로스페이드)
  jajin: "audio/bgm/jajin_arari.mp3", // 자진아라리 후렴 (모심는소리-자진아라리 0:15~0:29), 반복
  jeongseon: "audio/bgm/jeongseon.mp3", // 정선아리랑 후렴 (V022205 2:58~3:50)
  miryang: "audio/bgm/miryang.mp3", // 밀양아리랑 후렴 (민요(동부) 배우기 04)
  jindo: "audio/bgm/jindo.mp3", // 진도아리랑 후렴 (남도민요 0:12~0:27)

  ceremony: "audio/effects/ceremony.mp3", // 세 지역 완료 팝업 세레머니
};
