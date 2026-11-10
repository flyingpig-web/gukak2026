/* =========================================================================
   활동1 — 탈을 만들어 공연을 시작해요! (exp1.html, 기획서 p6~p17)

   흐름: 안내 → [▶] → 양반광대 → 소매각시 → 시시딱딱이 → (인사굿) → 종료
   한 탈의 한 판:
     조각 5개를 끌어 틀에 맞춘다 → 완성 탈이 가운데로 → 펑(연기) → 사라짐
     → 장단 + 후광 + [OO탈 완성!] + 전신 등장 → 장단이 끝나면 전신이 작아져 무대에 배치
     → [다음으로] / [OO는 누구일까?] 등장

   좌표는 모두 디자인 px(1920×1080). 화면에 넣을 때만 % 로 바꾼다(pc/pr).
   조각의 정답 위치는 js/puzzle-data.js — *_align.png 에서 뽑은 캔버스 비율이라
   틀(.mask-box)을 어디에 어떤 크기로 두든 그대로 들어맞는다.
   ========================================================================= */
$(function () {
  const S = window.AR4_SFX;
  const N = window.AR4_N;
  const P = window.PUZZLE_DATA;

  /* ----- 조정 포인트 ------------------------------------------------- */
  const MOVE_MS = 600; //      완성 탈이 화면 가운데로 가는 시간
  const POP_FRAME_MS = 90; //  연기 효과 한 장당(8장)
  const JANGDAN_MS = 10000; // 탈 완성 장단 연주(기획 "10초")
  const SHRINK_MS = 900; //    전신이 작아져 무대에 배치되는 시간
  const INSAGUT_MS = 7000; //  인사굿 + 좌우 움찔(기획 "5~10초")
  const HIT_PAD = 40; //       정답 판정 여유(디자인 px)
  const CAN_HOVER = !window.matchMedia || window.matchMedia("(hover: hover)").matches;

  const POPS = [1, 2, 3, 4, 5, 6, 7, 8].map((i) => `img/03_exp1/effect_pop_0${i}.png`);

  /* 탈 세 개 — box/big 은 목업 실측값, tray 는 조각판 안의 조각 위치(좌상단) */
  const ROUNDS = [
    {
      key: "yangban",
      box: [601, 102, 413, 898],
      scale: 0.368,
      tray: {
        piece1_hat: [1334, 253],
        piece2_face: [1342, 763],
        piece3_beard: [1634, 763],
        piece4_string_left: [1644, 565],
        piece5_string_right: [1671, 365],
      },
      big: [814, 171, 292, 813],
      char: ".stage-yangban",
      complete: "img/03_exp1/text_complete_yangban.png",
      who: "img/03_exp1/btn_who_yangban.png",
      popup: "img/05_info/popup_yangban.png",
      vo: S.exp1Done.yangban, //  시윤N_06
      popVo: N("info_exp1_02"), // 활동1N_인포1 양반광대
      jangdan: S.jangdan.gutgeori,
    },
    {
      key: "somae",
      box: [447, 268, 697, 697],
      scale: 0.188,
      tray: {
        piece1_hair: [1341, 488],
        piece2_face: [1502, 734],
        piece3_eyes: [1644, 362],
        piece4_nose_mouth: [1454, 357],
        piece5_dots: [1645, 554],
      },
      big: [806, 310, 311, 608],
      char: ".stage-somae",
      complete: "img/03_exp1/text_complete_somae.png",
      who: "img/03_exp1/btn_who_somae.png",
      popup: "img/05_info/popup_somae.png",
      vo: S.exp1Done.somae, //    시윤N_07
      popVo: N("info_exp1_03"), // 활동1N_인포2 소매각시
      jangdan: S.jangdan.gutgeori,
    },
    {
      key: "sisi",
      box: [447, 268, 697, 697],
      scale: 0.188,
      tray: {
        piece1_hair: [1371, 244],
        piece2_face: [1502, 730],
        piece3_eyes: [1642, 346],
        piece4_nose_mouth: [1414, 592],
        piece5_pattern: [1633, 542],
      },
      big: [708, 353, 503, 611],
      char: ".stage-sisi",
      complete: "img/03_exp1/text_complete_sisi.png",
      who: "img/03_exp1/btn_who_sisi.png",
      popup: "img/05_info/popup_sisi.png",
      vo: S.exp1Done.sisi, //     시윤N_08
      popVo: N("info_exp1_04"), // 활동1N_인포3 시시딱딱이
      jangdan: S.jangdan.ichae, //  시시딱딱이는 이채 장단(기획 p15)
    },
  ];

  /* ----- 좌표 도우미 ------------------------------------------------- */
  const pcX = (px) => (px / 1920) * 100 + "%"; // 디자인 px → 가로 %
  const pcY = (px) => (px / 1080) * 100 + "%"; // 디자인 px → 세로 %

  const $cont = $(".container");
  const $stage = $("#stage");
  const $box = $("#maskBox");
  const $ghost = $("#maskGhost");
  const $full = $("#maskFull");
  const $pieces = $("#pieces");
  const $pop = $("#pop");
  const $halo = $("#halo");
  const $text = $("#completeText");
  const $sdim = $("#stageDim");
  const $btnNext = $("#btnNext");
  const $btnWho = $("#btnWho");

  let ri = -1; //      현재 라운드
  let round = null;
  let pieces = []; //  현재 라운드 조각들
  let left = 0; //     남은 조각 수
  let locked = true; // 연출 중 입력 잠금
  let finished = false;

  function dir(key) {
    return `img/03_exp1/puzzle_${key}`;
  }

  /* 컨테이너 기준 좌표를 디자인 px 로 */
  function toDesign(e) {
    const r = $cont[0].getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * 1920,
      y: ((e.clientY - r.top) / r.height) * 1080,
    };
  }

  /* ----- 한 판 시작 --------------------------------------------------- */
  function startRound(i) {
    ri = i;
    round = ROUNDS[i];
    const k = round.key;
    const [bx, by, bw, bh] = round.box;

    $stage.removeClass("cleared").addClass("on");
    $box
      .css({ left: pcX(bx), top: pcY(by), width: pcX(bw), height: pcY(bh), opacity: 1 })
      .find(".piece")
      .remove();
    $ghost.attr("src", `${dir(k)}/${k}_frame_ghost.png`).css("opacity", 1);
    $full.attr("src", `${dir(k)}/${k}_full.png`).removeClass("on");
    $halo.removeClass("on");
    $text.removeClass("on").attr("src", round.complete);
    $btnNext.removeClass("on");
    $btnWho.removeClass("on");
    $("#btnWhoImg").attr("src", round.who);
    $(".stage-char").removeClass("jiggle");
    $sdim.removeClass("on");

    // 조각 만들기 — 트레이 안에는 원본 크기 × round.scale 로 놓는다
    $pieces.empty();
    pieces = P[k].pieces.map(function (d) {
      const [pw, ph] = d.piece;
      const w = pw * round.scale;
      const h = ph * round.scale;
      const [tx, ty] = round.tray[d.id];
      const $el = $("<img class='piece'>")
        .attr("src", `${dir(k)}/${k}_${d.id}.png`)
        .css({ left: pcX(tx), top: pcY(ty), width: pcX(w), height: pcY(h), zIndex: 20 + d.n });
      $pieces.append($el);
      const p = { d, $el, tray: [tx, ty, w, h], fixed: false };
      bindDrag(p);
      return p;
    });
    left = pieces.length;
    locked = false;
  }

  /* ----- 드래그 ------------------------------------------------------- */
  function bindDrag(p) {
    const el = p.$el[0];
    let grab = null;

    // 조각도 버튼처럼 소리가 난다(수정요청안 261110 p2).
    // 공용 효과음은 common.js 가 button/.btn 에만 걸어 두므로 여기서 직접 울린다.
    if (CAN_HOVER) {
      el.addEventListener("mouseenter", function () {
        if (locked || p.fixed) return;
        AR.Sound.sfx(S.hover);
      });
    }

    el.addEventListener("pointerdown", function (e) {
      if (locked || p.fixed) return;
      e.preventDefault();
      AR.Sound.sfx(S.click);
      try {
        el.setPointerCapture(e.pointerId);
      } catch (err) {}

      const [bx, by, bw, bh] = round.box;
      const now = toDesign(e);
      // 트레이에서 들어올리면 정답 크기로 커진다 — 어디에 놓아야 하는지 가늠이 쉽다
      const w = p.d.fit.w * bw;
      const h = p.d.fit.h * bh;
      const cur = { x: p.tray[0], y: p.tray[1], w: p.tray[2], h: p.tray[3] };
      const rel = { x: (now.x - cur.x) / cur.w, y: (now.y - cur.y) / cur.h };
      grab = { w, h, rel };
      p.$el.addClass("drag");
      move(e);
    });

    function move(e) {
      if (!grab) return;
      const now = toDesign(e);
      const x = now.x - grab.rel.x * grab.w;
      const y = now.y - grab.rel.y * grab.h;
      p.$el.css({ left: pcX(x), top: pcY(y), width: pcX(grab.w), height: pcY(grab.h) });
      p.at = [x, y, grab.w, grab.h];
    }

    el.addEventListener("pointermove", function (e) {
      if (!grab) return;
      e.preventDefault();
      move(e);
    });

    function end() {
      if (!grab) return;
      grab = null;
      p.$el.removeClass("drag");
      drop(p);
    }
    el.addEventListener("pointerup", end);
    el.addEventListener("pointercancel", end);
  }

  /* 놓았을 때 — 정답이면 제자리에 붙고, 아니면 조각판으로 튕겨 돌아간다 */
  function drop(p) {
    const [bx, by, bw, bh] = round.box;
    const d = p.d;
    const at = p.at || p.tray;

    // 조각 그림(여백 제외)의 중심이 지금 어디에 있나
    const curCx = at[0] + (d.x + d.w / 2 - d.fit.x) * bw;
    const curCy = at[1] + (d.y + d.h / 2 - d.fit.y) * bh;
    // 정답 자리의 중심
    const ansCx = bx + (d.x + d.w / 2) * bw;
    const ansCy = by + (d.y + d.h / 2) * bh;

    const tol = Math.max(d.w * bw, d.h * bh) * 0.5 + HIT_PAD;
    const hit = Math.hypot(curCx - ansCx, curCy - ansCy) <= tol;

    if (!hit) {
      p.$el
        .addClass("wrong")
        .css({
          left: pcX(p.tray[0]),
          top: pcY(p.tray[1]),
          width: pcX(p.tray[2]),
          height: pcY(p.tray[3]),
        });
      setTimeout(() => p.$el.removeClass("wrong"), 420);
      AR.Sound.sfx(S.incorrect); // 틀린 곳(수정요청안 261110 p2)
      p.at = null;
      return;
    }

    // 정답 — 틀 안으로 옮겨 붙인다(이후 틀이 움직여도 함께 따라간다)
    p.fixed = true;
    p.$el
      .removeClass("wrong")
      .css({
        left: d.fit.x * 100 + "%",
        top: d.fit.y * 100 + "%",
        width: d.fit.w * 100 + "%",
        height: d.fit.h * 100 + "%",
        zIndex: 10 + d.n,
        transition: "none",
      })
      .addClass("piece-fix")
      .appendTo($box);
    AR.Sound.sfx(S.correct); // 올바른 곳(수정요청안 261110 p2)
    AR.Sound.sfx(S.janggu); //  조각이 붙는 순간의 장구(기획 p7) — 아직 미납품

    if (--left === 0) setTimeout(complete, 400);
  }

  /* ----- 완성 연출 ---------------------------------------------------- */
  function complete() {
    locked = true;
    const [bx, by, bw, bh] = round.box;

    // 조각판을 치우고, 맞춘 조각을 완성 탈 그림으로 바꾼다(경계가 깔끔해진다)
    $stage.addClass("cleared");
    $sdim.addClass("on"); // 완성 진입 — 배경 딤드 fade in(수정요청안 261110 p1)
    $full.addClass("on");
    $ghost.css("opacity", 0);

    // 완성한 탈이 화면 가운데로(기획 p7-4)
    $box.css({ left: pcX(960 - bw / 2), top: pcY(by) });

    setTimeout(function () {
      // 펑 — 연기 효과 8장(기획 p8-5)
      const cx = 960;
      const cy = by + bh / 2;
      $pop
        .css({ left: pcX(cx - 450), top: pcY(cy - 450), width: pcX(900), height: pcY(900) })
        .attr("src", POPS[0])
        .addClass("on");
      $box.css({ transition: "opacity 0.3s ease", opacity: 0 });

      let f = 0;
      const timer = setInterval(function () {
        if (++f >= POPS.length) {
          clearInterval(timer);
          $pop.removeClass("on");
          showCharacter();
          return;
        }
        $pop.attr("src", POPS[f]);
      }, POP_FRAME_MS);
    }, MOVE_MS);
  }

  /* 장단 + 후광 + 완성 텍스트 + 전신 등장 → 장단이 끝나면 무대로 작아진다 */
  function showCharacter() {
    const [gx, gy, gw, gh] = round.big;
    const $char = $(round.char);

    $halo.addClass("on");
    $char
      .addClass("on big")
      .css({ left: pcX(gx), top: pcY(gy), width: pcX(gw), height: pcY(gh) });
    $text.addClass("on");

    AR.Sound.playBgm(round.jangdan, { loop: false, volume: 0.6 });
    AR.Sound.narrate(round.vo);

    setTimeout(function () {
      AR.Sound.stopBgm();
      $halo.removeClass("on");
      $text.removeClass("on");
      $sdim.removeClass("on"); // 캐릭터가 무대에 배치되는 동안 딤드 fade out
      // 인라인 좌표를 지우면 css 의 무대 자리로 되돌아간다(.big 의 transition 으로 축소)
      $char.css({ left: "", top: "", width: "", height: "" });
      setTimeout(function () {
        $char.removeClass("big");
        showButtons();
      }, SHRINK_MS);
    }, JANGDAN_MS);
  }

  function showButtons() {
    $btnNext.addClass("on");
    $btnWho.addClass("on");
    locked = false;

    // 마지막 탈이면 인사굿 장단 + 등장인물이 좌우로 움찔거린다(기획 p16-8)
    if (ri === ROUNDS.length - 1) {
      AR.Sound.playBgm(S.jangdan.insagut, { loop: false, volume: 0.6 });
      $(".stage-char.on, .stage-jangja").addClass("jiggle");
      setTimeout(() => $(".stage-char").removeClass("jiggle"), INSAGUT_MS);
    }
  }

  /* ----- 인물 정보 팝업 ------------------------------------------------ */
  function openInfo() {
    $("#infoPop").attr("src", round.popup);
    AR.openPopup("#infoDim");
    AR.Sound.narrate(round.popVo);
  }
  function closeInfo() {
    AR.closePopup("#infoDim");
    AR.Sound.stopNarration();
  }

  /* ----- 종료 --------------------------------------------------------- */
  function finish() {
    finished = true;
    locked = true;
    $stage.removeClass("on");
    $sdim.removeClass("on");
    AR.Sound.stopBgm();
    AR.openPopup("#finishDim");
    AR.Sound.sfxThen(S.ceremony, function () {
      AR.Sound.narrate(S.exp1End);
    });
  }

  function reset() {
    finished = false;
    AR.closePopup("#finishDim");
    AR.Sound.stopNarration();
    AR.Sound.stopBgm();
    $sdim.removeClass("on");
    $(".stage-char").removeClass("on big jiggle").css({ left: "", top: "", width: "", height: "" });
    $box.css({ transition: "", opacity: 1 });
    startRound(0);
  }

  /* ----- 묶기 --------------------------------------------------------- */
  $("#btnGuidePlay").on("click", function () {
    AR.closePopup("#guideDim");
    $("#guideDim").removeClass("flex");
    AR.Sound.stopNarration();
    startRound(0);
  });

  $btnNext.on("click", function () {
    if (locked) return;
    AR.Sound.stopBgm();
    $(".stage-char").removeClass("jiggle");
    if (ri >= ROUNDS.length - 1) {
      finish();
      return;
    }
    $btnNext.removeClass("on");
    $btnWho.removeClass("on");
    $box.css({ transition: "", opacity: 1 });
    startRound(ri + 1);
  });

  $btnWho.on("click", function () {
    if (locked) return;
    openInfo();
  });

  // 기획 p10-9 "화면 클릭 시 팝업창이 닫히고 이전 화면으로 전환"
  $("#infoDim").on("click", closeInfo);
  $("#btnPopClose").on("click", function (e) {
    e.stopPropagation();
    closeInfo();
  });

  $("#btnRetry").on("click", reset);
  $("#btnMore").on("click", () => AR.go("info1.html?from=exp1"));
  $("#btnExit").on("click", () => AR.go("main.html"));
  $("#btnBack, #btnHome").on("click", () => AR.go("main.html"));

  /* ----- 시작 --------------------------------------------------------- */
  AR.Sound.prime([S.exp1Guide, S.ceremony, S.exp1End, S.janggu, S.correct, S.incorrect, S.hover, S.click]);
  AR.preload(
    [
      "img/03_exp1/bg_exp1.png",
      "img/03_exp1/exp1_tutorial.png",
      "img/03_exp1/puzzle_tray.png",
      "img/03_exp1/jangja_wait.png",
      "img/03_exp1/effect_halo.png",
    ].concat(
      POPS,
      ROUNDS.map((r) => `${dir(r.key)}/${r.key}_frame_ghost.png`),
      ROUNDS.map((r) => `${dir(r.key)}/${r.key}_full.png`)
    )
  );

  // 정보 화면에서 [뒤로] 로 돌아오면 종료 화면을 그대로 보여준다
  if (location.search.indexOf("done") >= 0) {
    $("#guideDim").removeClass("flex");
    ri = ROUNDS.length - 1;
    round = ROUNDS[ri];
    $(".stage-char").addClass("on");
    finish();
  } else {
    AR.Sound.narrate(S.exp1Guide);
  }
});
