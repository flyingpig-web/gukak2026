/* =========================================================================
   MAIN (main.html) — 기획서 p6 · p19
   1. 진입 시 '가람N_02' 자동 재생 + 말풍선 문구
   2. 선택 버튼을 한 번 누르면 해당 내레이션 + 문구 교체,
      (연속) 두 번 누르면 해당 활동으로 이동
   3. [홈] → HOME
   ※ 호버 효과는 스케일이 아니라 (ON) 이미지 교체 (기획 p7)
   ========================================================================= */
$(function () {
  const S = window.AR2_SFX;

  const CHOICES = {
    exp1: {
      hit: "#hitExp1",
      img: "#imgExp1",
      off: "img/02_main/btn_exp1.png",
      on: "img/02_main/btn_exp1_on.png",
      vo: S.n03,
      text: "img/02_main/text_exp1.png",
      href: "exp1.html",
    },
    exp2: {
      hit: "#hitExp2",
      img: "#imgExp2",
      off: "img/02_main/btn_exp2.png",
      on: "img/02_main/btn_exp2_on.png",
      vo: S.n04,
      text: "img/02_main/text_exp2.png",
      href: "exp2.html",
    },
  };

  // 말풍선은 문구가 구워진 소스 3종(text_main / text_exp1 / text_exp2)을 페이드 교체한다.
  function showBubble(src) {
    const $b = $("#mainText");
    if ($b.attr("src") === src) return;
    $b.stop(true).animate({ opacity: 0 }, 180, function () {
      $b.attr("src", src).animate({ opacity: 1 }, 180);
    });
  }

  AR.preload([
    "img/02_main/bg_main.png",
    "img/02_main/text_main.png",
    CHOICES.exp1.text,
    CHOICES.exp2.text,
    CHOICES.exp1.off,
    CHOICES.exp1.on,
    CHOICES.exp2.off,
    CHOICES.exp2.on,
  ]).then(function () {
    AR.Sound.narrate(S.n02);
  });

  let selected = null;

  Object.keys(CHOICES).forEach(function (key) {
    const c = CHOICES[key];
    const $img = $(c.img);
    $(c.hit)
      .on("mouseenter", function () {
        $img.attr("src", c.on);
      })
      .on("mouseleave", function () {
        $img.attr("src", c.off);
      })
      .on("click", function () {
        // 두 번째 클릭(같은 버튼) → 이동, 첫 클릭 → 내레이션 + 문구
        if (selected === key) {
          AR.go(c.href);
          return;
        }
        selected = key;
        showBubble(c.text);
        AR.Sound.narrate(c.vo);
      });
  });

  $("#btnHome").on("click", function () {
    AR.go("index.html");
  });
});
