/* =========================================================================
   gukak-AR4(관노가면극) 프로젝트 설정 — common.js 보다 "먼저" 로드된다.
   내레이션 파일명은 납품 그대로다(기획서 번호 "시윤N_xx" 와 다르다 — 아래 주석에 대응 표기).
   ★ 아직 안 들어온 음원(내레이션 10개 · 장단 5종 · 관객웃음 · 장구)은 경로만 등록해 둔다.
     common.js 의 Sound 는 파일이 없으면 조용히 무시하고 진행한다(무음 graceful).
     같은 이름으로 파일만 채우면 그대로 울린다.
   공용음(클릭/호버/정답/오답/세레머니)은 PD 요청대로 이전 편(AR1) 것을 복사해 뒀다.
   ========================================================================= */
window.AR_CONFIG = {
  bgm: "", // HOME/MAIN 배경음 없음(기획)
  clickSfx: "audio/effects/click.mp3",
  hoverSfx: "audio/effects/hover.mp3",
  prefix: "gukak_ar4",
};

const N = (f) => `audio/narration/${f}.mp3`;
const E = (f) => `audio/effects/${f}.mp3`;
const B = (f) => `audio/bgm/${f}.mp3`;

/* 기획서 번호 ↔ 납품 파일명 — ✗ 표시가 아직 안 들어온 음원이다. */
window.AR4_SFX = {
  title: N("title"), //            시윤N_01  관노가면극, 탈과 몸짓으로 전하는 이야기 (HOME 배경 첫 클릭)

  main01: N("siyun_main_01"), //   시윤N_02  강릉단오제에 왔으면 관노가면극을 놓칠 수 없지! (MAIN 진입)
  main02: N("siyun_main_02"), //   시윤N_03  관노가면극에는 어떤 탈이 나올까?            (MAIN 천막)
  main03: N("siyun_main_03"), //   시윤N_04  관노가면극 공연은 어떻게 진행될까?          (MAIN 무대)

  exp1Guide: N("siyun_exp1_01"), // 시윤N_05 탈의 조각을 맞춰 남은 세 개의 탈을 만들어줘 (활동1 안내)
  exp1Done: {
    yangban: N("siyun_exp1_02"), // 시윤N_06 양반광대탈 완성!    ✗
    somae: N("siyun_exp1_03"), //   시윤N_07 소매각시탈 완성!    ✗
    sisi: N("siyun_exp1_04"), //    시윤N_08 시시딱딱이탈 완성!  ✗
  },
  exp1End: N("siyun_exp1_05"), //  시윤N_09  참 잘했어! 신나는 관노가면극 무대가 열렸어! (활동1 종료)  ✗

  exp2Guide: N("siyun_exp2_01"), // 시윤N_11 몸짓을 보고 어떤 이야기인지 알맞은 내용을 골라보자! (활동2 안내)
  // 마당별 보기 2개(시윤N_12~N_25) 와 마당 타이틀(N_14·17·20·23·26)은 exp2.js MADANG 에서 직접 지정
  exp2End: N("siyun_exp2_17"), //  시윤N_27  대단해! 관노가면극의 이야기를 완성시켰어!   ✗

  info1Enter: N("info_exp1_01"), // 시윤N_10 탈을 눌러 어떤 인물인지 알아보자!   (정보1 진입)
  info2Enter: N("info_exp2_01"), // 시윤N_28 몸짓으로만 전하는 다섯 마당이야…    (정보2 진입)
  // 인물·마당 설명(info_exp1_02~05 / info_exp2_02~06)은 info.js BOOKS 에서 지정

  /* ----- 효과음 ----- */
  click: E("click"),
  hover: E("hover"), //         마우스 호버(공용 버튼은 common.js 가 자동, 퍼즐 조각은 exp1.js 가 직접)
  correct: E("correct"), //     정답(마당 보기 선택)
  incorrect: E("incorrect"), //  오답(버튼 흔들림)
  ceremony: E("ceremony"), //    활동 종료 세레머니
  janggu: E("janggu"), //        탈 조각이 제자리에 붙을 때(기획 "효과음(장구)")  ✗
  laugh: E("audience_laugh"), // 첫째 마당 관객 웃음소리                        ✗

  /* ----- 장단(마당별 연주) ----- 전부 ✗ */
  jangdan: {
    gutgeori: B("jangdan_gutgeori"), //      굿거리장단 — 양반광대·소매각시 탈 완성, 둘째·다섯째 마당
    ichae: B("jangdan_ichae"), //            이채장단   — 시시딱딱이 탈 완성, 셋째 마당
    samchae: B("jangdan_samchae"), //        삼채장단   — 첫째 마당
    seonghwanggut: B("jangdan_seonghwanggut"), // 성황굿장단 — 넷째 마당
    insagut: B("jangdan_insagut"), //        인사굿장단 — 활동1 전원 등장(인사굿)
  },
};
window.AR4_N = N;
