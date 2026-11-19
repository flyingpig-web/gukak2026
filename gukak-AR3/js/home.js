/* =========================================================================
   HOME (index.html) — 기획서 p5
   1. 버튼 외 배경을 처음 클릭하면 '타이틀N'(title.mp3) 내레이션 — 1번만
      (기획은 "자동 재생" 이지만 브라우저 자동재생 정책상 첫 제스처가 필요하다.
       AR1·AR2·AR4·AR5 와 같은 처리)
   2. [시작] 클릭 시 MAIN 이동
   ========================================================================= */
$(function () {
  const S = window.AR3_SFX;

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
