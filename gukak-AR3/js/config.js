/* =========================================================================
   gukak-AR3(춘앵전) 프로젝트 설정 — common.js 보다 "먼저" 로드된다.

   내레이션 파일명은 납품 그대로이고, 기획서 번호("무희N_xx")와는 다르다.
   어떤 파일이 어떤 대사인지는 43개를 전부 들어 확인했다(DEVELOPMENT.md 5장).
   ★ 아직 안 들어온 음원(장단·효과음 일부)은 경로만 예약해 둔다.
     common.js 의 Sound 는 파일이 없으면 조용히 넘어가므로(무음 graceful)
     같은 이름으로 파일만 채우면 그대로 울린다.
   공용음(클릭/호버/정답/오답/세레머니)은 PD 요청대로 이전 편 것을 복사해 뒀다.
   ========================================================================= */
window.AR_CONFIG = {
  bgm: "", // HOME/MAIN 배경음 없음(기획)
  clickSfx: "audio/effects/click.mp3",
  hoverSfx: "audio/effects/hover.mp3",
  prefix: "gukak_ar3",
};

const N = (f) => `audio/narration/${f}.mp3`;
const E = (f) => `audio/effects/${f}.mp3`;
const B = (f) => `audio/bgm/${f}.mp3`;

window.AR3_SFX = {
  title: N("title"), //              타이틀N  춘앵전, 봄날 지저귀는 꾀꼬리의 춤   (HOME 배경 첫 클릭)

  main01: N("heejin_main_01"), //    무희N_01 춘앵전의 중요한 정보가 담긴 그림들이야…  (MAIN 진입)
  main02: N("heejin_main_02"), //    무희N_02 춘앵전 공연 그림의 색이 사라졌어…       (MAIN 활동1)
  main03: N("heejin_main_03"), //    무희N_03 꾀꼬리의 어떤 모습이 춤으로 완성됐는지…  (MAIN 활동2)

  exp1Guide: N("heejin_exp1_01"), // 무희N_04 아이콘을 보며 내가 말하는 옷이나 장식이…(활동1 안내)
  exp1End: N("heejin_exp1_23"), //   무희N_20 춘앵전의 색이 모두 채워졌어. 정말 예쁘지!(활동1 종료)
  // 복식 7종의 [안내][명칭][설명] 3개씩(heejin_exp1_02~22)은 js/exp1.js STEPS 에서 지정

  exp2Guide: N("heejin_exp2_01"), // 무희N_21 꾀꼬리의 움직임을 보고 비슷한 춤 동작을…(활동2 안내)
  exp2Watch: N("heejin_exp2_02"), // 무희N_22 꾀꼬리의 움직임을 잘 살펴보세요!        (문제 제시)
  exp2End: N("heejin_exp2_09"), //   무희N_27 잘했어! 꾀꼬리를 보고 춘앵전의 네 가지… (활동2 종료)
  // 춤사위 4종 정답 멘트(heejin_exp2_03~08)는 js/exp2.js DANCES 에서 지정

  infoEnter: N("info_intro"), //     무희N_20 궁금한 기록을 눌러 하나씩 살펴볼까?  (정보1·2 공용 진입)
  // 족자 6종 설명(info_exp1_01~03 / info_exp2_01~03)은 js/info.js PAGES 에서 지정

  /* ----- 효과음 ----- */
  click: E("click"),
  hover: E("hover"),
  correct: E("correct"), //      색칠 성공 / 춤사위 정답
  incorrect: E("incorrect"), //  오답(기획 p24-3)
  ceremony: E("ceremony"), //    활동 종료 세레머니
  glow: E("glow"), //            10초 무터치 강조 효과음(기획 p10 "(e) 강조 효과음")   ✗ 미납품
  fill: E("fill"), //            먹선 안으로 색이 번질 때                              ✗ 미납품
  orb: E("orb"), //              춤사위 구체가 날아갈 때                               ✗ 미납품

  /* ----- BGM ----- 활동2 에서 그 춤사위가 나오는 춘앵전 음악을 반복 재생(기획 p20-4) ✗ 전부 미납품 */
  danceBgm: {
    hoeran: B("chunaeng_hoeran"),
    biri: B("chunaeng_biri"),
    nakhwa: B("chunaeng_nakhwa"),
    sasa: B("chunaeng_sasa"),
  },
};
window.AR3_N = N;
