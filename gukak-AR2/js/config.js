/* =========================================================================
   gukak-AR2 프로젝트 설정 — common.js 보다 "먼저" 로드된다.
   ★ 오디오는 아직 미납품이다. 아래 경로는 예약해 둔 이름이며, 파일이 없으면
     AR.Sound 가 조용히 무시하고 진행한다(무음 graceful). 납품되면 파일만 넣으면 된다.
   ========================================================================= */
window.AR_CONFIG = {
  bgm: "audio/bgm.mp3",
  bgmVolume: 0.2,
  clickSfx: "audio/effects/click.mp3",
  hoverSfx: "audio/effects/hover.mp3",
  prefix: "gukak_ar2",
};

/* 내레이션 / 효과음 경로 — 각 화면 js 가 참조한다(경로는 여기 한 곳에만 둔다). */
window.AR2_SFX = {
  // 가람 내레이션 (기획서 Audio 열)
  n01: "audio/narration/garam_01.mp3", // 만파식적, 나라를 지킨 악기            (HOME)
  n02: "audio/narration/garam_02.mp3", // 바다의 용이 나타나 신비한 대나무를 주었어. (MAIN 진입)
  n03: "audio/narration/garam_03.mp3", // 신비한 대나무로 대금을 만들어볼까?      (MAIN 선택①)
  n04: "audio/narration/garam_04.mp3", // 나라를 지키기 위해 대금을 불어볼까?     (MAIN 선택②)
  n05: "audio/narration/garam_05.mp3", // 구멍을 뚫고, 갈대청을 붙여 대금을 만들자 (활동1 안내)
  n06: "audio/narration/garam_06.mp3", // 취구
  n07: "audio/narration/garam_07.mp3", // 청공
  n08: "audio/narration/garam_08.mp3", // 지공
  n09: "audio/narration/garam_09.mp3", // 칠성공
  n10: "audio/narration/garam_10.mp3", // 갈대청
  n11: "audio/narration/garam_11.mp3", // 각 부분을 눌러 대금을 더 알아보자       (정보)
  n12: "audio/narration/garam_12.mp3", // 한 음씩 대금을 불어, 파도를 잠재우자!    (활동2 안내)
  king01: "audio/narration/king_01.mp3", // 신문왕: 세상을 편안하게 하는 대금, 역시 '만파식적'이로구나!

  // 대금 중간음역 7음 (활동2에서 홀드하는 동안 순서대로)
  notes: [
    "audio/daegeum/note1.mp3", // 청중려
    "audio/daegeum/note2.mp3", // 청고선
    "audio/daegeum/note3.mp3", // 청태주
    "audio/daegeum/note4.mp3", // 청황종
    "audio/daegeum/note5.mp3", // 무역
    "audio/daegeum/note6.mp3", // 남려
    "audio/daegeum/note7.mp3", // 임종
  ],

  drill: "audio/effects/drill.mp3", // 대나무 가공음(구멍 뚫을 때 짧게)
  sixNotes: "audio/daegeum/six_notes.mp3", // 지공 6개 완성 시 대금 음 6개
  cheong: "audio/daegeum/cheong.mp3", // 갈대청을 붙였을 때 청이 울리는 소리
  melody: "audio/daegeum/melody_exp1.mp3", // 만파식적 완성 가락
};
