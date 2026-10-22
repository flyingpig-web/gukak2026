/* =========================================================================
   HOME (index.html) — 기획서 p4
   1. 버튼 외 배경을 처음 클릭하면 '두리N_01'(title.mp3) 내레이션 — 1번만
   2. [시작] 클릭 시 MAIN 이동
   ========================================================================= */
$(function () {
  const S = window.AR1_SFX;

  AR.Sound.prime([S.title, S.main01]);
  AR.preload(["img/01_title/bg_title.png", "img/01_title/btn_start.png"]);

  let played = false;
  $(".container").on("click", function (e) {
    if (played || $(e.target).closest("button").length) return;
    played = true;
    AR.Sound.narrate(S.title);
  });

  $("#btnStart").on("click", function () {
    AR.go("main.html");
  });
});
