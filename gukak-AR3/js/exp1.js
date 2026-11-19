/* =========================================================================
   활동1 — 춘앵전 그림에 색을 채워요 (exp1.html) — 기획서 p7~p14

   흐름
     안내(튜토리얼 + ▶) → 복식 7종을 정해진 차례로 터치 → 세레모니 → 종료 화면

   한 요소의 한 판
     ① 안내바·아이콘을 그 요소로 바꾸고 [안내] 내레이션
     ② 10초가 지나도록 안 누르면 글로우로 자리를 알려준다(기획 p9-4)
     ③ 맞는 자리를 누르면 먹선 안으로 색이 번지고(단계 그림 fade-in),
        명칭 텍스트가 튀어나오며 [명칭] → [설명] 내레이션이 이어진다.
        텍스트는 2초 뒤 사라진다(기획 p9-3).
     ④ 설명이 끝나면 다음 요소로.

   터치 판정은 `js/hit-mask.js`(scripts/gen-hit-mask.py 가 만든 6px 격자 비트맵).
   `dancer_part_*.png` 와 먹선 그림의 픽셀 차이에서 뽑은 것이라 요소 모양 그대로다.
   ========================================================================= */
$(function () {
  const S = window.AR3_SFX;
  const N = window.AR3_N;
  const HIT = window.AR3_HIT;

  /* ----- 조정 포인트 ------------------------------------------------ */
  const HINT_DELAY = 10000; // 터치가 없을 때 글로우까지(기획 "10초 이상")
  const NAME_HOLD = 2000; //   명칭 텍스트가 떠 있는 시간(기획 "2초 후 fade out")
  const FILL_MS = 700; //      색이 번지는 시간(css .dancer-img.step 와 맞출 것)
  const STAGE_MS = 1500; //    무대 배경 디졸브 + 완성 무용수가 다 올라올 때까지
  //                           (css .scene-bg.layer 1.2초, .dancer-full 0.45+0.85초와 맞춘다)
  const COMPLETE_HOLD = 1500; // 완성 문구가 떠 있는 시간 → 종료 화면
  //                             (기획 p12-2 는 "1초후" 지만 너무 짧아 1.5초로 — PD 요청 261119)
  const HIT_PAD = 2; //        터치 판정에 더해 주는 여유(격자 칸 수, 1칸 = 6px)

  /* ----- 진행 순서 (기획 p11 "진행 순서") ----------------------------
     내레이션은 납품 파일 3개씩 — [안내] [명칭] [설명] 순서다. */
  const STEPS = [
    { key: "hwangcho", n: 1, ask: "heejin_exp1_02", name: "heejin_exp1_03", desc: "heejin_exp1_04" },
    { key: "chorok", n: 2, ask: "heejin_exp1_05", name: "heejin_exp1_06", desc: "heejin_exp1_07" },
    { key: "hwagwan", n: 3, ask: "heejin_exp1_08", name: "heejin_exp1_09", desc: "heejin_exp1_10" },
    { key: "hongdan", n: 4, ask: "heejin_exp1_11", name: "heejin_exp1_12", desc: "heejin_exp1_13" },
    { key: "osaek", n: 5, ask: "heejin_exp1_14", name: "heejin_exp1_15", desc: "heejin_exp1_16" },
    { key: "hongcho", n: 6, ask: "heejin_exp1_17", name: "heejin_exp1_18", desc: "heejin_exp1_19" },
    { key: "hwamun", n: 7, ask: "heejin_exp1_20", name: "heejin_exp1_21", desc: "heejin_exp1_22" },
  ];

  const IMG = "img/03_exp1/";
  const icon = (k) => `${IMG}icon_${k}.png`;
  const guide = (k) => `${IMG}guide_${k}.png`;
  const hintImg = (k) => `${IMG}dancer/hint/dancer_hint_${k}.png`;
  const nameImg = (k) => `${IMG}text_name_${k}.png`;

  /* ----- 마스크 비트맵 디코딩 --------------------------------------- */
  const MASK = {};
  Object.keys(HIT.mask).forEach(function (k) {
    const bin = atob(HIT.mask[k]);
    const b = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) b[i] = bin.charCodeAt(i);
    MASK[k] = b;
  });

  function cellOn(key, cx, cy) {
    if (cx < 0 || cy < 0 || cx >= HIT.cols || cy >= HIT.rows) return false;
    const i = cy * HIT.cols + cx;
    return ((MASK[key][i >> 3] >> (i & 7)) & 1) === 1;
  }

  // 디자인 좌표(1920×1080)가 그 요소 위인지. HIT_PAD 칸만큼 여유를 둔다
  // — 홍단금루수대처럼 가느다란 요소는 정확히 짚기 어렵다.
  function hitTest(key, dx, dy) {
    const cx = Math.floor(dx / HIT.cell);
    const cy = Math.floor(dy / HIT.cell);
    for (let r = 0; r <= HIT_PAD; r++) {
      for (let oy = -r; oy <= r; oy++) {
        for (let ox = -r; ox <= r; ox++) {
          if (Math.max(Math.abs(ox), Math.abs(oy)) !== r) continue;
          if (cellOn(key, cx + ox, cy + oy)) return true;
        }
      }
    }
    return false;
  }

  // 화면 좌표 → 디자인 좌표
  function toDesign(e) {
    const r = document.querySelector(".container").getBoundingClientRect();
    const p = e.touches && e.touches[0] ? e.touches[0] : e;
    return {
      x: ((p.clientX - r.left) / r.width) * 1920,
      y: ((p.clientY - r.top) / r.height) * 1080,
    };
  }

  /* ----- 상태 ------------------------------------------------------- */
  let idx = -1;
  let busy = false; // 연출 중에는 터치를 받지 않는다
  let hintTimer = 0;
  let nameTimer = 0;

  const $hint = $("#hint");
  const $icon = $("#panelIcon");
  const $guide = $("#guideBar");
  const $name = $("#namePop");

  /* ----- 글로우 힌트 ------------------------------------------------ */
  function armHint(key) {
    clearTimeout(hintTimer);
    hintTimer = setTimeout(function () {
      $hint.attr("src", hintImg(key)).addClass("on");
      AR.Sound.sfx(S.glow); // 기획 p10 "(e) 강조 효과음" — 미납품(무음)
    }, HINT_DELAY);
  }
  function clearHint() {
    clearTimeout(hintTimer);
    $hint.removeClass("on");
  }

  /* ----- 명칭 텍스트 ------------------------------------------------ */
  function popName(key) {
    const im = new Image();
    im.onload = function () {
      $name
        .attr("src", im.src)
        .css({ width: (im.naturalWidth / 19.2) + "%", height: (im.naturalHeight / 10.8) + "%" })
        .removeClass("off")
        .addClass("on");
      clearTimeout(nameTimer);
      nameTimer = setTimeout(function () {
        $name.removeClass("on").addClass("off");
      }, NAME_HOLD);
    };
    im.src = nameImg(key);
  }

  /* ----- 한 요소 진입 ------------------------------------------------ */
  function enter(i) {
    idx = i;
    if (i >= STEPS.length) return ceremony();
    const st = STEPS[i];
    busy = true; // ★ [안내]를 끝까지 들은 뒤에 누를 수 있다

    // 아이콘·안내바 교체(짧은 페이드)
    $icon.addClass("swap");
    $guide.addClass("swap");
    setTimeout(function () {
      $icon.attr("src", icon(st.key)).removeClass("swap");
      $guide.attr("src", guide(st.key)).removeClass("swap");
    }, 250);

    // 안내가 끝나야 터치를 받고, 글로우까지의 10초도 그때부터 센다
    AR.Sound.narrate(N(st.ask), {
      onEnd: function () {
        if (idx !== i) return; // 그 사이 다음 요소로 넘어갔으면 무시
        busy = false;
        armHint(st.key);
      },
    });
  }

  /* ----- 정답 터치 --------------------------------------------------- */
  function fill(st) {
    busy = true;
    clearHint();
    AR.Sound.sfx(S.correct);
    AR.Sound.sfx(S.fill); // 색이 번지는 소리 — 미납품(무음)

    $("#step" + st.n).addClass("on"); // 색이 번진다(누적이라 이전 단계는 켜 둔 채)
    popName(st.key);

    AR.Sound.narrate(N(st.name), {
      onEnd: function () {
        AR.Sound.narrate(N(st.desc), {
          onEnd: function () {
            enter(idx + 1);
          },
        });
      },
    });
  }

  $("#hitLayer").on("click", function (e) {
    if (busy || idx < 0 || idx >= STEPS.length) return;
    const st = STEPS[idx];
    const d = toDesign(e);
    if (!hitTest(st.key, d.x, d.y)) return; // 엉뚱한 곳은 조용히 무시(기획에 오답 처리 없음)
    fill(st);
  });

  /* ----- 세레모니 → 종료 (기획 p12·p13) ------------------------------ */
  function ceremony() {
    busy = true;
    clearHint();
    AR.Sound.sfx(S.ceremony);

    // 마지막 요소의 명칭 텍스트가 아직 떠 있으면 먼저 걷는다(완성 문구와 겹치지 않게)
    clearTimeout(nameTimer);
    if ($name.hasClass("on")) $name.removeClass("on").addClass("off");

    // 배경이 무대로 디졸브되고, 먹선 그림을 걷으면서 완성 무용수(3D)로 넘어간다
    // — 둘은 무용수 크기·자리가 달라 겹쳐 두면 두 겹으로 보인다.
    $("#bgStage").addClass("on");
    $("#stage").addClass("ceremony");
    $("#dancerFull").addClass("on");
    $(".guide-bar").css("opacity", 0);

    setTimeout(function () {
      $("#completeText").addClass("on");
      setTimeout(showFinish, COMPLETE_HOLD);
    }, STAGE_MS);
  }

  // 기획 p14-1 — 종료 화면에 "진입할 때" 무희N_20 을 재생한다
  function showFinish() {
    $("#completeText").removeClass("on");
    $("#stage").removeClass("on");
    AR.openPopup("#finishDim");
    AR.Sound.narrate(S.exp1End);
  }

  /* ----- 안내 → 플레이 ------------------------------------------------ */
  function startPlay() {
    AR.closePopup("#guideDim");
    $("#stage").addClass("on");
    enter(0);
  }

  $("#btnGuidePlay").on("click", startPlay);

  /* ----- 상단바 / 종료 버튼 -------------------------------------------- */
  $("#btnBack").on("click", () => AR.go("main.html"));
  $("#btnHome").on("click", () => AR.go("main.html"));
  $("#btnRetry").on("click", () => AR.go("exp1.html"));
  $("#btnMore").on("click", () => AR.go("info1.html?from=exp1"));
  $("#btnExit").on("click", () => AR.go("main.html"));

  /* ----- 진입 --------------------------------------------------------- */
  AR.Sound.prime([S.exp1Guide, S.exp1End, S.correct, S.ceremony]);
  AR.preload([
    IMG + "bg_exp1.png",
    IMG + "exp1_tutorial.png",
    IMG + "dancer/dancer_step0_line.png",
    IMG + "panel_target.png",
    IMG + "icon_hwangcho.png",
    IMG + "guide_hwangcho.png",
  ]).then(function () {
    AR.prefetch(
      STEPS.map((s) => IMG + "dancer/dancer_step" + s.n + "_" + s.key + ".png")
        .concat(STEPS.map((s) => icon(s.key)))
        .concat(STEPS.map((s) => guide(s.key)))
        .concat(STEPS.map((s) => nameImg(s.key)))
        .concat(STEPS.map((s) => hintImg(s.key)))
        .concat([IMG + "bg_exp1_stage.png", IMG + "dancer/dancer_full.png", IMG + "end_main.png"])
    );
  });

  // info1 에서 [뒤로] 로 돌아오면 종료 화면을 그대로 복원한다
  if (/(\?|&)done\b/.test(location.search)) {
    AR.closePopup("#guideDim");
    $("#bgStage").addClass("on");
    AR.openPopup("#finishDim");
  } else {
    AR.Sound.narrate(S.exp1Guide);
  }
});
