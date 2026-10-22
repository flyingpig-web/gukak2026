/* =========================================================================
   gukak-AR1(세종대왕과 정간보) 프로젝트 설정 — common.js 보다 "먼저" 로드된다.
   내레이션 파일명은 납품 그대로다(기획서 번호 "두리N_xx" 와 다르다 — 아래 주석에 대응 표기).
   정보 내레이션(info_*)은 PD 가 수정본으로 같은 이름에 덮어쓸 예정.
   공용음(클릭/호버/세레머니)은 PD 요청대로 이전 편(AR5) 것을 복사해 둠.
   파일이 없으면 조용히 무시하고 진행한다(무음 graceful).
   ========================================================================= */
window.AR_CONFIG = {
  bgm: "", // HOME/MAIN 배경음 없음(기획)
  clickSfx: "audio/effects/click.mp3",
  hoverSfx: "audio/effects/hover.mp3",
  prefix: "gukak_ar1",
};

/* 내레이션 / 음악 / 효과음 경로 — 각 화면 js 가 참조한다(경로는 여기 한 곳에만 둔다). */
const N = (f) => `audio/narration/${f}.mp3`;
window.AR1_SFX = {
  title: N("title"), // 두리N_01 세종대왕과 정간보, 칸에 담은 우리 음악 (HOME 배경 첫 클릭)
  main01: N("duri_main_01"), // 두리N_02 우리의 소리를 담는 정간보를 함께 만들어 볼까? (MAIN 진입)
  main02: N("duri_main_02"), // 두리N_03 정간보의 빈 곳을 채워 볼까?                 (MAIN 활동1)
  main03: N("duri_main_03"), // 두리N_04 나만의 정간보를 만들어 볼까?                 (MAIN 활동2)

  exp1Guide: N("duri_exp1_01"), // 두리N_05 설명을 잘 보고, 오른쪽 보기에서 똑같은 걸 골라줘
  // duri_exp1_02 ~ 15 — 문항 7개의 이름/설명(exp1.js STEPS 에서 N() 으로 직접 지정)
  exp1End: N("duri_exp1_16"), // 두리N_13 정간보를 채웠어! 소리를 들어보자

  exp2Guide: N("duri_exp2_01"), // 두리N_21 구음 기호를 골라 정간보를 채우고 소리를 들어보자
  // duri_exp2_02 ~ 06 — 구음 덩·쿵·덕·더러러러·기덕(exp2.js SYMBOLS)
  exp2End: N("duri_exp2_07"), // 두리N_27 나만의 정간보가 완성됐어!

  info01: N("info_01"), // 두리N_14 정보 진입 (info_02~08 은 info.js BOOKS)

  correct: "audio/effects/correct.mp3",
  incorrect: "audio/effects/incorrect.mp3",
  ceremony: "audio/effects/ceremony.mp3", // 활동1 정간보 완성
  melody: "audio/bgm/melody_exp1.mp3", // 활동1 완성 정간보 가야금 연주([듣기])
  // 장구 소리 — audio/janggu/*.mp3 (exp2.js SYMBOLS). 납품 wav 의 뒤 무음만 잘라 mp3 로 변환
};
window.AR1_N = N;
