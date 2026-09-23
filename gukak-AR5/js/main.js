/* =========================================================================
   MAIN (main.html) — 기획서 p5
   1. 진입 시 '도람N_01' 자동 재생
   2. 선택 버튼 hover → 활성(on) 이미지
      한 번 누르면 해당 내레이션 + 말풍선 교체, (연속) 두 번 누르면 해당 활동으로 이동
   3. [홈] → HOME
   ※ 활동2 는 기획·에셋 미납품 — 한 번 누르기(내레이션·말풍선)까지만 동작하고 이동은 없다.
   ========================================================================= */
$(function () {
  const S = window.AR5_SFX;

  const CHOICES = {
    exp1: { hit: "#hitExp1", on: ".img-exp1-on", vo: S.doram02, text: "img/02_main/text_exp1.png", href: "exp1.html" },
    exp2: { hit: "#hitExp2", on: ".img-exp2-on", vo: S.doram03, text: "img/02_main/text_exp2.png", href: null },
  };

  function showBubble(src) {
    const $b = $("#mainText");
    if ($b.attr("src") === src) return;
    $b.stop(true).animate({ opacity: 0 }, 180, function () {
      $b.attr("src", src).animate({ opacity: 1 }, 180);
    });
  }

  AR.Sound.prime([S.doram01, S.doram02, S.doram03]);
  AR.preload([
    "img/02_main/bg_main.png",
    "img/02_main/text_main.png",
    CHOICES.exp1.text,
    CHOICES.exp2.text,
    "img/02_main/btn_exp1.png",
    "img/02_main/btn_exp1_on.png",
    "img/02_main/btn_exp2.png",
    "img/02_main/btn_exp2_on.png",
  ]).then(function () {
    AR.Sound.narrate(S.doram01);
  });

  let selected = null;

  Object.entries(CHOICES).forEach(function ([key, c]) {
    const $on = $(c.on);
    $(c.hit)
      .on("mouseenter", () => $on.addClass("on"))
      // 선택된 버튼은 on 을 유지 — 터치 기기엔 hover 가 없어서 무엇을 골랐는지 보여야 한다
      .on("mouseleave", () => selected !== key && $on.removeClass("on"))
      .on("click", function () {
        if (selected === key) {
          if (c.href) AR.go(c.href);
          return;
        }
        selected = key;
        $(".choice-on").removeClass("on");
        $on.addClass("on");
        showBubble(c.text);
        AR.Sound.narrate(c.vo);
      });
  });

  $("#btnHome").on("click", function () {
    AR.go("index.html");
  });
});
