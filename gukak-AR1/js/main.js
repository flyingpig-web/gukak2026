/* =========================================================================
   MAIN (main.html) — 기획서 p5
   1. 진입 시 '두리N_02' 자동 재생
   2. 선택 버튼 hover → select 이미지
      한 번 누르면 해당 내레이션 + 말풍선 문구 교체, (연속) 두 번 누르면 해당 활동으로 이동
   3. [홈] → HOME
   ========================================================================= */
$(function () {
  const S = window.AR1_SFX;

  const CHOICES = {
    exp1: { hit: "#hitExp1", on: ".choice-on.img-exp1", vo: S.main02, text: "<em>정간보</em>의 빈 곳을 채워 볼까?", href: "exp1.html" },
    exp2: { hit: "#hitExp2", on: ".choice-on.img-exp2", vo: S.main03, text: "나만의 <em>정간보</em>를 만들어 볼까?", href: "exp2.html" },
  };

  function showBubble(html) {
    const $b = $("#mainBubble");
    if ($b.html() === html) return;
    $b.stop(true).animate({ opacity: 0 }, 150, function () {
      $b.html(html).animate({ opacity: 1 }, 150);
    });
  }

  AR.Sound.prime([S.main01, S.main02, S.main03]);
  AR.preload([
    "img/02_main/bg_main.png",
    "img/02_main/btn_exp1.png",
    "img/02_main/btn_exp1_select.png",
    "img/02_main/btn_exp2.png",
    "img/02_main/btn_exp2_select.png",
    "img/02_main/text_exp1.png",
    "img/02_main/text_exp2.png",
  ]).then(function () {
    // 첫 화면이 아니라 보통은 재생된다. 새로고침 등으로 막히면 첫 터치에서 다시 시도.
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
      // 선택된 버튼은 select 를 유지 — 터치 기기엔 hover 가 없어서 무엇을 골랐는지 보여야 한다
      .on("mouseleave", () => selected !== key && $on.removeClass("on"))
      .on("click", function () {
        if (selected === key) {
          AR.go(c.href);
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
