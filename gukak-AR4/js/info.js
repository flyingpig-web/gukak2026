/* =========================================================================
   더 알아보기 (info1.html / info2.html) — 기획서 p18~p20, p39~p41
   한 파일로 두 화면을 돌린다(<body data-info="1|2">).
     정보1 : 등장인물 탈 네 개
     정보2 : 다섯 마당 카드
   가운데 것을 누르면 딤드 + 세부 정보 팝업 + 내레이션. 화면을 누르면 닫힌다.
   [뒤로가기] 는 왔던 활동의 종료 화면으로(?from=exp1|exp2), [홈] 은 MAIN 으로.

   ★ 도는 방식이 화면마다 다르다.
     정보1(orbit) : 네 자리가 회전목마처럼 한 바퀴를 이룬다 — 6시(앞 가운데) · 9시(왼쪽)
       · 12시(가운데 뒤) · 3시(오른쪽). [▶] 를 누르면 9시 → 6시 → 3시 → 12시 → 9시 로
       모두가 궤도를 따라 한 칸씩 돈다. 앞쪽은 오른쪽으로 흐르고 뒤쪽은 위로 돌아가며
       작아진다. 건너뛰는 칸이 없어 아이들이 방향을 헷갈리지 않는다.
     정보2 : 카드가 한 줄로 늘어서 있어, 줄 끝에서 반대쪽으로 넘어가는 한 장만
       화면 밖까지 같은 방향으로 빠져나갔다가(투명해진 뒤) 반대쪽 밖에서 들어온다.
   ========================================================================= */
$(function () {
  const S = window.AR4_SFX;
  const N = window.AR4_N;

  const pcX = (px) => (px / 1920) * 100 + "%";
  const pcY = (px) => (px / 1080) * 100 + "%";

  const which = $("body").attr("data-info") === "2" ? 2 : 1;

  const TURN_MS = 350; //  한 칸 굴러가는 시간(css .item 의 transition 과 맞춘다)
  const OUT_MS = 360; //   화면 밖으로 빠져나가는 시간

  /* 자리 — cx·cy 는 중심(디자인 px), s 는 가운데 것 대비 크기, z 는 겹침 순서.
     off = 가운데 것에서 몇 번째 뒤 항목인가(0 = 가운데, 1 = 그다음 …).
     전부 목업 실측값이다(p18 / p39).
     정보1 은 네 자리가 한 바퀴(9시 → 6시 → 3시 → 12시 → 9시)를 이룬다. off 가
     그 궤도의 순서이므로, 항목 차례를 궤도에 맞춰 적어야 첫 화면이 목업과 같아진다. */
  const PAGES = {
    1: {
      enter: S.info1Enter, // 시윤N_10
      size: [412, 411],
      orbit: true, // 한 바퀴 도는 배치 — 화면 밖을 거치지 않는다
      slots: [
        { off: 0, cx: 959, cy: 582.5, s: 1.0, z: 10 }, //  6시 · 앞 가운데
        { off: 1, cx: 701, cy: 500.5, s: 0.9, z: 8 }, //   9시 · 왼쪽
        { off: 2, cx: 959.5, cy: 407, s: 0.78, z: 6 }, //  12시 · 가운데 뒤(앞엣것에 반쯤 가린다)
        { off: 3, cx: 1217, cy: 500.5, s: 0.9, z: 8 }, //  3시 · 오른쪽
      ],
      // 궤도 차례대로 — 첫 화면이 목업 p18(왼쪽 소매각시 · 가운데 양반광대 · 뒤 장자마리 · 오른쪽 시시딱딱이)이 된다
      items: [
        { key: "yangban", img: "img/05_info/medal_yangban.png", pop: "img/05_info/popup_yangban.png", vo: N("info_exp1_02"), alt: "양반광대" },
        { key: "somae", img: "img/05_info/medal_somae.png", pop: "img/05_info/popup_somae.png", vo: N("info_exp1_03"), alt: "소매각시" },
        { key: "jangja", img: "img/05_info/medal_jangja.png", pop: "img/05_info/popup_jangja.png", vo: N("info_exp1_05"), alt: "장자마리" },
        { key: "sisi", img: "img/05_info/medal_sisi.png", pop: "img/05_info/popup_sisi.png", vo: N("info_exp1_04"), alt: "시시딱딱이" },
      ],
      back: "exp1.html?done",
    },
    2: {
      enter: S.info2Enter, // 시윤N_28
      size: [400, 470],
      flip: true, // 한 줄 배치라 [◀][▶] 가 "카드가 밀려가는 쪽"을 가리킨다(사용자 요청 2026-11-06)
      slots: [
        { off: 0, cx: 958, cy: 501, s: 1.0, z: 10 }, //   가운데(앞)
        { off: 1, cx: 755, cy: 501, s: 0.926, z: 8 }, //  왼쪽
        { off: 2, cx: 565, cy: 501, s: 0.787, z: 6 }, //  왼쪽 바깥
        { off: 3, cx: 1355, cy: 501, s: 0.787, z: 6 }, // 오른쪽 바깥
        { off: 4, cx: 1165, cy: 501, s: 0.926, z: 8 }, // 오른쪽
      ],
      outL: { cx: 330, cy: 501, s: 0.68, z: 1 },
      outR: { cx: 1590, cy: 501, s: 0.68, z: 1 },
      items: [1, 2, 3, 4, 5].map((n) => ({
        key: "madang" + n,
        img: `img/05_info/card_madang${n}.png`,
        pop: `img/05_info/popup_madang${n}.png`,
        vo: N("info_exp2_0" + (n + 1)), // 첫째~다섯째 마당 = info_exp2_02~06
        alt: n + "번째 마당",
      })),
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
      .append($("<img>").attr("src", it.img).attr("alt", it.alt))
      .appendTo($car);
  });

  const offOf = (i, c) => (((i - c) % n) + n) % n; // 항목이 가운데에서 몇 번째 뒤인가
  const slotOf = (off) => P.slots.find((s) => s.off === off);

  function boxOf(slot, shown) {
    const [bw, bh] = P.size;
    const w = bw * slot.s;
    const h = bh * slot.s;
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

  /* 오른쪽(또는 왼쪽) 끝에서 반대쪽으로 넘어가는 한 장 —
     화면 밖까지 같은 방향으로 밀려 나간 뒤, 안 보이는 동안 반대편 밖으로 옮겨
     거기서 제자리로 들어온다. 보이는 동안의 움직임은 전부 한 방향이다. */
  function roll($el, i, side) {
    const out = side === "right" ? P.outR : P.outL;
    const back = side === "right" ? P.outL : P.outR;
    $el.removeClass("center").css(boxOf(out, false));
    timers.push(
      setTimeout(function () {
        $el.css("transition", "none").css(boxOf(back, false));
        void $el[0].offsetHeight; // 순간이동을 애니메이션으로 만들지 않도록 리플로우
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
      // 한 바퀴 도는 배치(정보1)는 모두가 궤도를 따라가므로 건너뛰는 칸이 없다.
      // 한 줄 배치(정보2)에서만, 굴리는 방향과 반대로 가야 하는 한 장이 화면 밖을 거친다.
      if (P.orbit) place($el, i, cur);
      else if (dir > 0 && dx < -1) roll($el, i, "right");
      else if (dir < 0 && dx > 1) roll($el, i, "left");
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
  // 정보1(궤도)은 [▶] 에 왼쪽 것이 앞으로 나온다. 정보2(한 줄)는 그 반대가 자연스러워 뒤집는다.
  const SIGN = P.flip ? -1 : 1;
  $("#btnLeft").on("click", () => rotate(-SIGN));
  $("#btnRight").on("click", () => rotate(SIGN));

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
  AR.Sound.prime([P.enter].concat(P.items.map((x) => x.vo)));
  AR.preload(["img/05_info/bg_info.png"].concat(P.items.map((x) => x.img))).then(function () {
    AR.prefetch(P.items.map((x) => x.pop));
  });

  layout();
  AR.Sound.narrate(P.enter);
});
