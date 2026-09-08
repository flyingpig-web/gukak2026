/* =========================================================================
   HOME (index.html) — 기획서 p5
   1. 버튼 외 배경 클릭 시 '가람N_01' 내레이션 재생 (1번만)
   2. [시작] 버튼 클릭 시 'MAIN' 페이지로 이동
   ========================================================================= */
$(function () {
  const S = window.AR2_SFX;

  AR.preload(["img/01_title/bg_title.png", "img/01_title/btn_start.png"]);
  AR.Sound.prime([S.n01, S.n02]);

  let narrated = false;
  $("#homeHit").on("click", function () {
    if (narrated) return;
    narrated = true;
    AR.Sound.narrate(S.n01);
  });

  $("#btnStart").on("click", function () {
    AR.go("main.html");
  });
});
