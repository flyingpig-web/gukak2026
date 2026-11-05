/* =========================================================================
   MAIN (main.html) — 기획서 p5 / p21
   1. 진입 시 '시윤N_02' 자동 재생 + 말풍선 text_main
   2. 선택 버튼 hover → on 이미지
      한 번 누르면 해당 내레이션 + 말풍선 교체(text_exp1 / text_exp2),
      (연속) 두 번 누르면 해당 활동으로 이동
   3. [홈] → HOME
   ========================================================================= */
$(function () {
  const S = window.AR4_SFX;

  const CHOICES = {
    exp1: { hit: "#hitExp1", on: ".on-exp1", vo: S.main02, href: "exp1.html" },
    exp2: { hit: "#hitExp2", on: ".on-exp2", vo: S.main03, href: "exp2.html" },
  };

  function showBubble(key) {
    $(".main-speech").removeClass("on").filter(`[data-key="${key}"]`).addClass("on");
  }

  AR.Sound.prime([S.main01, S.main02, S.main03]);
  AR.preload([
    "img/02_main/bg_main.png",
    "img/02_main/btn_exp1.png",
    "img/02_main/btn_exp1_on.png",
    "img/02_main/btn_exp2.png",
    "img/02_main/btn_exp2_on.png",
    "img/02_main/label_exp1.png",
    "img/02_main/label_exp2.png",
    "img/02_main/text_main.png",
    "img/02_main/text_exp1.png",
    "img/02_main/text_exp2.png",
  ]).then(function () {
    // 보통은 재생된다. 새로고침 등 자동재생이 막히면 첫 터치에서 다시 시도.
    const vo = AR.Sound.narrate(S.main01);
    if (!vo) return;
    $(document).one("pointerdown", function () {
      if (vo.paused && vo.currentTime === 0 && !selected) AR.Sound.narrate(S.main01);
    });
  });

  let selected = null;

  Object.entries(CHOICES).forEach(function ([key, c]) {
    const $on = $(c.on);
    $(c.hit)
      .on("mouseenter", () => $on.addClass("on"))
      // 선택된 쪽은 on 을 유지 — 터치 기기엔 hover 가 없어서 무엇을 골랐는지 보여야 한다
      .on("mouseleave", () => selected !== key && $on.removeClass("on"))
      .on("click", function () {
        if (selected === key) {
          AR.go(c.href);
          return;
        }
        selected = key;
        $(".choice-on").removeClass("on");
        $on.addClass("on");
        showBubble(key);
        AR.Sound.narrate(c.vo);
      });
  });

  $("#btnHome").on("click", function () {
    AR.go("index.html");
  });
});
