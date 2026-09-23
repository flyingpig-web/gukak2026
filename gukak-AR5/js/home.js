/* =========================================================================
   HOME (index.html) — 기획서 p4
   1. '타이틀N' 내레이션 자동 재생
      ★ 첫 화면이라 브라우저 자동재생 정책에 막힐 수 있다 → 막히면 첫 터치에서 재생.
   2. [시작] 클릭 시 MAIN 이동
   3. 달 주변 빛 일렁임 — css/main.css .title-glow
   ========================================================================= */
$(function () {
  const S = window.AR5_SFX;

  AR.Sound.prime([S.title01, S.doram01]);
  AR.preload(["img/01_title/bg_title.png", "img/01_title/bg_title_effect.png", "img/01_title/btn_start.png"]).then(function () {
    const vo = AR.Sound.narrate(S.title01);
    if (!vo) return;
    $(document).one("pointerdown", function () {
      if (vo.paused && vo.currentTime === 0) AR.Sound.narrate(S.title01);
    });
  });

  $("#btnStart").on("click", function () {
    AR.go("main.html");
  });
});
