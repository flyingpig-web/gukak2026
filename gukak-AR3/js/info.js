/* =========================================================================
   더 알아보기 (info1.html / info2.html) — 기획서 p15~p17, p28~p30
   한 파일로 두 화면을 돌린다(<body data-info="1|2">).
     정보1 : 춘앵전이란? · 춘앵전 복식 · 춘앵전 무대
     정보2 : 춘앵전의 뜻 · 만든 사람 · 춘앵전 공연자
   가운데 것을 누르면 딤드 + 세부 정보 팝업 + 내레이션. 화면을 누르면 닫힌다.
   [뒤로가기] 는 왔던 활동의 종료 화면으로(?from=exp1|exp2), [홈] 은 MAIN 으로.

   ★ 도는 방향 — "보이는 동안의 움직임은 전부 한 방향" (AR4 에서 정리된 원칙).
     [▶] 를 누르면 줄 전체가 왼쪽으로 밀리고 오른쪽 것이 가운데로 온다.
     줄 왼쪽 끝의 한 장만 화면 밖까지 같은 방향으로 밀려 나가 투명해진 뒤,
     안 보이는 동안 오른쪽 밖으로 옮겨져 거기서 들어온다(roll).
     off 를 가운데에서 오른쪽으로 세어 나가므로 첫 화면이 목업(p15/p28)과 같고,
     [▶] 를 누를 때마다 1 → 2 → 3 차례로 가운데에 온다.
   ========================================================================= */
$(function () {
  const S = window.AR3_SFX;
  const N = window.AR3_N;

  const pcX = (px) => (px / 1920) * 100 + "%";
  const pcY = (px) => (px / 1080) * 100 + "%";

  const which = $("body").attr("data-info") === "2" ? 2 : 1;

  const TURN_MS = 350; //  한 칸 굴러가는 시간(css .item 의 transition 과 맞춘다)
  const OUT_MS = 360; //   화면 밖으로 빠져나가는 시간

  /* 자리 — cx·cy 는 족자 중심(디자인 px), s 는 가운데 것 대비 크기, z 는 겹침 순서.
     목업 p15 / p28 실측값: 가운데 1.0, 좌우 0.80 이고 좌우는 조금 위로 올라가 있다. */
  const SLOTS = [
    { off: 0, cx: 960.5, cy: 533.5, s: 1.0, z: 10 }, //  가운데(앞)
    { off: 1, cx: 1234, cy: 472, s: 0.8, z: 8 }, //      오른쪽
    { off: 2, cx: 688.5, cy: 462, s: 0.8, z: 8 }, //     왼쪽
  ];
  const OUT_L = { cx: 240, cy: 440, s: 0.62, z: 1 };
  const OUT_R = { cx: 1680, cy: 440, s: 0.62, z: 1 };
  const SIZE = [381, 381]; // 족자 그림 원본 크기(이름표는 css 로 그 아래 붙는다)

  const IMG = "img/05_info/";
  const card = (tone, labelN, popN, vo, alt) => ({
    scroll: `${IMG}scroll_${tone}.png`,
    label: `${IMG}label_exp${which}_${labelN}.png`,
    pop: `${IMG}popup_exp${which}_${popN}.png`,
    vo: N(vo),
    alt,
  });

  /* 족자 색은 목업 그대로 — 가운데 빨강 · 오른쪽 초록 · 왼쪽 파랑 */
  const PAGES = {
    1: {
      items: [
        card("red", 1, 1, "info_exp1_01", "춘앵전이란?"),
        card("green", 2, 2, "info_exp1_02", "춘앵전 복식"),
        card("blue", 3, 3, "info_exp1_03", "춘앵전 무대"),
      ],
      back: "exp1.html?done",
    },
    2: {
      items: [
        card("red", 1, 1, "info_exp2_01", "춘앵전의 뜻"),
        card("green", 2, 2, "info_exp2_02", "만든 사람"),
        card("blue", 3, 3, "info_exp2_03", "춘앵전 공연자"),
      ],
      back: "exp2.html?done",
    },
  };

  const P = PAGES[which];
  const n = P.items.length;
  let cur = 0;
  let busy = false; //    팝업이 열려 있다
  let turning = false; // 굴러가는 중
  const timers = [];

  /* ----- 칸 만들기 ----------------------------------------------------- */
  const $car = $("#carousel");
  const $items = P.items.map(function (it, i) {
    return $("<div class='item' role='button'></div>")
      .attr("data-i", i)
      .attr("aria-label", it.alt)
      .append($("<img class='ci-scroll'>").attr("src", it.scroll).attr("alt", it.alt))
      .append($("<img class='ci-label'>").attr("src", it.label).attr("alt", ""))
      .appendTo($car);
  });

  const offOf = (i, c) => (((i - c) % n) + n) % n; // 항목이 가운데에서 몇 번째 뒤인가
  const slotOf = (off) => SLOTS.find((s) => s.off === off);

  function boxOf(slot, shown) {
    const w = SIZE[0] * slot.s;
    const h = SIZE[1] * slot.s;
    return {
      left: pcX(slot.cx - w / 2),
      top: pcY(slot.cy - h / 2),
      width: pcX(w),
      height: pcY(h),
      zIndex: slot.z,
      opacity: shown ? 1 : 0,
    };
  }

  function place($el, i, c) {
    const slot = slotOf(offOf(i, c));
    $el.css(boxOf(slot, true)).toggleClass("center", slot.off === 0);
  }

  /* 줄 끝에서 반대쪽으로 넘어가는 한 장 — 화면 밖까지 같은 방향으로 밀려 나간 뒤,
     안 보이는 동안 반대편 밖으로 옮겨 거기서 제자리로 들어온다. */
  function roll($el, i, side) {
    const out = side === "right" ? OUT_R : OUT_L;
    const back = side === "right" ? OUT_L : OUT_R;
    $el.removeClass("center").css(boxOf(out, false));
    timers.push(
      setTimeout(function () {
        $el.css("transition", "none").css(boxOf(back, false));
        void $el[0].offsetHeight; // 순간이동이 애니메이션으로 보이지 않도록 리플로우
        $el.css("transition", "");
        void $el[0].offsetHeight;
        place($el, i, cur);
      }, OUT_MS)
    );
  }

  function layout() {
    $items.forEach(($el, i) => place($el, i, cur));
  }

  function rotate(dir) {
    if (busy || turning) return;
    turning = true;
    const prev = cur;
    cur = (cur + dir + n) % n;
    $items.forEach(function ($el, i) {
      const from = slotOf(offOf(i, prev));
      const to = slotOf(offOf(i, cur));
      const dx = to.cx - from.cx;
      // [▶](dir>0) 이면 줄 전체가 왼쪽으로 민다 — 오른쪽으로 가야 하는 한 장이 넘어갈 차례다.
      if (dir > 0 && dx > 1) roll($el, i, "left");
      else if (dir < 0 && dx < -1) roll($el, i, "right");
      else place($el, i, cur);
    });
    timers.push(setTimeout(() => (turning = false), OUT_MS + TURN_MS + 40));
  }

  /* ----- 팝업 ---------------------------------------------------------- */
  function open(i) {
    const it = P.items[i];
    busy = true;
    $("#infoPop").attr("src", it.pop).attr("alt", it.alt);
    AR.openPopup("#infoDim");
    AR.Sound.narrate(it.vo);
  }
  function close() {
    busy = false;
    AR.closePopup("#infoDim");
    AR.Sound.stopNarration();
  }

  /* ----- 묶기 ---------------------------------------------------------- */
  $car.on("click", ".item.center", function () {
    open(parseInt($(this).attr("data-i"), 10));
  });
  $("#btnLeft").on("click", () => rotate(-1));
  $("#btnRight").on("click", () => rotate(1));

  // 기획 "화면 클릭 시 팝업창이 닫히며 화면 복귀"
  $("#infoDim").on("click", close);
  $("#btnPopClose").on("click", function (e) {
    e.stopPropagation();
    close();
  });

  $("#btnBack").on("click", function () {
    // 왔던 활동의 종료 화면으로 되돌아간다
    const from = (location.search.match(/from=(exp[12])/) || [])[1];
    AR.go(from ? from + ".html?done" : P.back);
  });
  $("#btnHome").on("click", () => AR.go("main.html"));

  /* ----- 시작 ---------------------------------------------------------- */
  AR.Sound.prime([S.infoEnter].concat(P.items.map((x) => x.vo)));
  AR.preload(
    [IMG + "bg_info.png", IMG + "title_info.png", IMG + "btn_left.png", IMG + "btn_right.png"]
      .concat(P.items.map((x) => x.scroll))
      .concat(P.items.map((x) => x.label))
  ).then(function () {
    AR.prefetch(P.items.map((x) => x.pop));
  });

  layout();
  AR.Sound.narrate(S.infoEnter);
});
