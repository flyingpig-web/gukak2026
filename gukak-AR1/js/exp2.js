/* =========================================================================
   활동2 — 나만의 정간보를 만들어 보자 (exp2.html)  기획서 p13~18

   안내(체험 방법) → 만들기 → [듣기] 연주 → 종료

   만들기 — 나무판의 장단 기호(덩·쿵·덕·더러러러·기덕)를 정간보 칸으로 끌어 놓는다
     · 기호에 마우스를 올리면 구음(터치 기기는 누를 때)
     · 나무판 기호를 끌면 복사본이 따라오고, 칸에 놓으면 들어간다(찬 칸이면 바꿔 넣음)
     · 칸에 있는 기호를 다른 칸으로 끌면 옮겨지고, 정간보 밖에 놓으면 지워진다
   연주 — 오른쪽 열 위→아래, 다음 왼쪽 열(참고영상). 한 칸 = BEAT_MS.
     지금 칸을 밝히고, 기호가 있으면 장구 소리 + 악사 3명 포즈 전환·스케일 Up-Down(p17).
     빈 칸은 소리 없이 한 박 쉰다. 다 치면 FINISH_MS 뒤 종료 화면.

   좌표: 목업(1920×1080) 실측, 디자인 px 로 적고 %로 바꾼다.
   ========================================================================= */
$(function () {
  const S = window.AR1_SFX;
  const N = window.AR1_N;
  const IMG = "img/04_exp2/";

  const BEAT_MS = 800; // 한 칸 연주 시간(기획에 템포가 없어 정함)
  const POSE_MS = 560; // 기호 포즈 유지 시간(더러러러는 한 박 내내)
  const FINISH_MS = 1000; // 연주 끝 → 종료 화면
  const TILE = 178; // 나무판 기호 크기(원본 그대로)
  const PLACED = 123; // 칸에 놓인 기호(목업 p15: 원본의 0.69배)
  const GHOST = 150; // 끌고 다니는 복사본
  const HIT_PAD = 14; // 칸 판정 여유(디자인 px)

  // 나무판 기호 — 목업 p14 왼쪽부터. 구음 내레이션 duri_exp2_02~06 은 기획 p16 순서(덩·쿵·덕·더러러러·기덕)
  const SYMBOLS = [
    { id: "gideok", img: "dot_line", x: 264, vo: 6, pose: "deok", fx: "double", alt: "기덕" },
    { id: "deoreoreoreo", img: "four_dots", x: 454, vo: 5, pose: "deok", fx: "jiggle", alt: "더러러러" },
    { id: "deok", img: "line", x: 631, vo: 4, pose: "deok", fx: "bounce", alt: "덕" },
    { id: "kung", img: "circle", x: 811, vo: 3, pose: "kung", fx: "bounce", alt: "쿵" },
    { id: "deong", img: "circle_line", x: 998, vo: 2, pose: "deong", fx: "bounce", alt: "덩" },
  ];
  const TILE_Y = 814;
  const SYM = Object.fromEntries(SYMBOLS.map((s) => [s.id, s]));
  const tileSrc = (s) => `${IMG}btn_rhythm_${s.img}.png`;
  const vo = (n) => N("duri_exp2_" + String(n).padStart(2, "0"));
  const snd = (s) => `audio/janggu/${s.id}.mp3`;

  // 악사 [left, top, size] — 원본 1254 정사각형을 축소
  const MUSICIANS = [
    { side: "left", box: [99, 240, 520] },
    { side: "center", box: [500, 234, 439] },
    { side: "right", box: [827, 240, 520] },
  ];

  // 정간보 칸(panel_score_empty 격자선 실측). 연주 순서대로 — 오른쪽 열 위→아래, 다음 왼쪽 열.
  const COLS = [
    [1603, 1745],
    [1441, 1575],
  ];
  const ROWS = [265, 389, 504, 620, 736, 850, 967];
  const CELLS = COLS.flatMap(([x0, x1]) => ROWS.slice(0, -1).map((y0, r) => ({ x0, x1, y0, y1: ROWS[r + 1] })));
  // 정간보 바깥 판정 — 패널 테두리 안쪽(알파 영역)
  const BOARD = { x0: 1389, x1: 1825, y0: 210, y1: 1021 };

  const pct = (px, of) => (px / of) * 100 + "%";
  const box = (l, t, w, h) => ({ left: pct(l, 1920), top: pct(t, 1080), width: pct(w, 1920), height: pct(h, 1080) });
  const center = (cx, cy, size) => box(cx - size / 2, cy - size / 2, size, size);
  const cellCenter = (c) => [(c.x0 + c.x1) / 2, (c.y0 + c.y1) / 2];

  const container = $(".container")[0];
  const $stage = $("#stage");
  const $listen = $("#btnListen");

  /* ----- DOM 생성 --------------------------------------------------------- */
  MUSICIANS.forEach(function (m) {
    const [l, t, s] = m.box;
    m.$el = $(
      `<div class="musician ${m.side}" data-pose="idle"><div class="mu-body">` +
        ["idle", "deong", "kung", "deok"].map((p) => `<img class="p-${p}" src="${IMG}character_janggu_${m.side}_${p}.png" alt="" />`).join("") +
        "</div></div>"
    )
      .css(box(l, t, s, s))
      .appendTo("#musicians");
    m.$body = m.$el.find(".mu-body");
  });

  SYMBOLS.forEach(function (s) {
    s.$el = $(`<div class="tile" data-id="${s.id}" aria-label="${s.alt}"><img src="${tileSrc(s)}" alt="${s.alt}" draggable="false" /></div>`)
      .css(box(s.x, TILE_Y, TILE, TILE))
      .appendTo("#palette");
  });

  CELLS.forEach(function (c) {
    c.$el = $('<div class="cell"></div>')
      .css(box(c.x0, c.y0, c.x1 - c.x0, c.y1 - c.y0))
      .appendTo("#cells");
    c.sym = null; // 놓인 기호 id
    c.$tile = null;
  });

  /* ----- 정간보 편집 ------------------------------------------------------ */
  function setCell(i, id) {
    const c = CELLS[i];
    c.$tile?.remove();
    c.sym = id;
    c.$tile = null;
    if (id) {
      const s = SYM[id];
      c.$tile = $(`<div class="placed drop" data-cell="${i}"><img src="${tileSrc(s)}" alt="${s.alt}" draggable="false" /></div>`)
        .css(center(...cellCenter(c), PLACED))
        .appendTo("#tiles");
    }
    $listen.prop("disabled", !CELLS.some((x) => x.sym));
  }

  function clearBoard() {
    CELLS.forEach((c, i) => setCell(i, null));
  }

  function toDesign(e) {
    const r = container.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * 1920, y: ((e.clientY - r.top) / r.height) * 1080 };
  }

  const cellAt = (p) => CELLS.findIndex((c) => p.x >= c.x0 - HIT_PAD && p.x <= c.x1 + HIT_PAD && p.y >= c.y0 - HIT_PAD && p.y <= c.y1 + HIT_PAD);
  const onBoard = (p) => p.x >= BOARD.x0 && p.x <= BOARD.x1 && p.y >= BOARD.y0 && p.y <= BOARD.y1;

  // 구음 — 마우스는 hover, 터치는 누를 때
  function speak(s) {
    if (!playing) AR.Sound.narrate(vo(s.vo));
  }

  /* ----- 드래그 ------------------------------------------------------------ */
  let drag = null; // { id, from(칸 번호 | -1), $src(끌어낸 원래 기호), $ghost, target }

  function startDrag(e, id, from) {
    if (drag || playing || !$stage.hasClass("on")) return;
    e.preventDefault();
    const s = SYM[id];
    drag = {
      id,
      from,
      target: -1,
      pointerId: e.pointerId,
      $src: from >= 0 ? CELLS[from].$tile : s.$el,
      $ghost: $(`<div class="ghost"><img src="${tileSrc(s)}" alt="" /></div>`).appendTo($stage),
    };
    // 끌어낸 원래 자리는 비어 보이게(261026 수정요청 — 나무판 기호도). 놓으면 다시 보인다
    drag.$src?.addClass("lift");
    moveDrag(e);
  }

  function moveDrag(e) {
    if (!drag || e.pointerId !== drag.pointerId) return;
    const p = toDesign(e);
    drag.$ghost.css(center(p.x, p.y, GHOST));
    const t = cellAt(p);
    if (t !== drag.target) {
      if (drag.target >= 0) CELLS[drag.target].$el.removeClass("target");
      if (t >= 0) CELLS[t].$el.addClass("target");
      drag.target = t;
    }
  }

  function endDrag(e, cancel) {
    if (!drag || e.pointerId !== drag.pointerId) return;
    const { id, from, target, $src, $ghost } = drag;
    drag = null;
    $ghost.remove();
    if (target >= 0) CELLS[target].$el.removeClass("target");
    $src?.removeClass("lift");
    if (cancel) return;

    const p = toDesign(e);
    if (target >= 0) {
      if (target === from) return;
      if (from >= 0) setCell(from, null); // 칸 → 칸 옮기기
      setCell(target, id); // 찬 칸이면 바꿔 넣는다
      AR.Sound.sfx(S.correct); // 칸에 놓일 때 효과음(261026 수정요청)
    } else if (from >= 0 && !onBoard(p)) {
      setCell(from, null); // 정간보 밖에 놓으면 삭제(기획 p14-5)
    }
    // 나무판 기호를 칸 밖에 놓거나, 칸 기호를 정간보 안 빈 곳(칸 사이)에 놓으면 그대로
  }

  let touchAt = 0; // 터치 뒤 따라오는 호환 mouseenter 로 구음이 두 번 나지 않게
  $("#palette")
    .on("pointerdown", ".tile", function (e) {
      const s = SYM[this.dataset.id];
      if (e.pointerType !== "mouse") {
        touchAt = performance.now();
        speak(s);
      }
      startDrag(e, s.id, -1);
    })
    .on("mouseenter", ".tile", function () {
      if (!drag && performance.now() - touchAt > 1000) speak(SYM[this.dataset.id]);
    });

  $("#tiles").on("pointerdown", ".placed", function (e) {
    const i = +this.dataset.cell;
    startDrag(e, CELLS[i].sym, i);
  });

  window.addEventListener("pointermove", moveDrag);
  window.addEventListener("pointerup", (e) => endDrag(e, false));
  window.addEventListener("pointercancel", (e) => endDrag(e, true));
  container.addEventListener("contextmenu", (e) => e.preventDefault());

  /* ----- 연주 ------------------------------------------------------------- */
  let playing = false;
  let token = 0; // [다시하기]/이탈 시 올려서 이전 흐름의 지연 콜백을 무효화
  const timers = [];

  function later(fn, ms) {
    const my = token;
    timers.push(setTimeout(() => my === token && fn(), ms));
  }

  function pose(name, fx) {
    MUSICIANS.forEach(function (m) {
      m.$el.attr("data-pose", name);
      m.$body.removeClass("fx-bounce fx-double fx-jiggle");
      if (fx) {
        void m.$body[0].offsetWidth; // 같은 효과를 연달아 다시 시작
        m.$body.addClass("fx-" + fx);
      }
    });
  }

  function stopPlay() {
    token++;
    timers.splice(0).forEach(clearTimeout);
    playing = false;
    $stage.removeClass("playing");
    CELLS.forEach((c) => c.$el.removeClass("now"));
    pose("idle");
    $listen.prop("disabled", !CELLS.some((x) => x.sym));
  }

  function play() {
    if (playing || !CELLS.some((c) => c.sym)) return;
    stopPlay();
    AR.Sound.stopNarration();
    playing = true;
    $stage.addClass("playing");
    $listen.prop("disabled", true);

    CELLS.forEach(function (c, i) {
      later(function () {
        CELLS.forEach((x) => x.$el.removeClass("now"));
        c.$el.addClass("now");
        if (!c.sym) return pose("idle");
        const s = SYM[c.sym];
        AR.Sound.sfx(snd(s));
        pose(s.pose, s.fx);
        if (s.fx !== "jiggle") later(() => pose("idle"), POSE_MS);
      }, i * BEAT_MS);
    });
    later(function () {
      CELLS.forEach((x) => x.$el.removeClass("now"));
      pose("idle");
    }, CELLS.length * BEAT_MS);
    later(openFinish, CELLS.length * BEAT_MS + FINISH_MS);
  }

  $listen.on("click", play);

  /* ----- 종료 ------------------------------------------------------------- */
  function openFinish() {
    stopPlay();
    $stage.removeClass("on");
    AR.openPopup("#finishDim");
    // 세레머니 → 두리N_27 (261026 수정요청, 활동1 과 같은 순서)
    const my = token;
    AR.Sound.sfxThen(S.ceremony, () => my === token && $("#finishDim").hasClass("flex") && AR.Sound.narrate(S.exp2End));
  }

  function startPlay() {
    stopPlay();
    AR.Sound.stopNarration();
    clearBoard();
    $stage.addClass("on");
  }

  /* ----- 안내 → 만들기 ------------------------------------------------------ */
  // 정보 화면에서 [뒤로] 로 돌아오면(?done) 완료 화면 그대로
  const DONE = new URLSearchParams(location.search).has("done");
  if (DONE) {
    history.replaceState(null, "", location.pathname); // 새로고침하면 처음부터
    AR.closePopup("#guideDim");
    $stage.removeClass("on");
    AR.openPopup("#finishDim");
  }

  const guideVo = DONE ? null : AR.Sound.narrate(S.exp2Guide);
  if (guideVo) {
    $(document).one("pointerdown", function () {
      if (guideVo.paused && guideVo.currentTime === 0 && $("#guideDim").hasClass("flex")) AR.Sound.narrate(S.exp2Guide);
    });
  }

  $("#btnGuidePlay").on("click", function () {
    AR.closePopup("#guideDim");
    startPlay();
  });

  /* ----- 종료 팝업 / 상단바 ------------------------------------------------- */
  // [다시하기] → 활동2-플레이(기획 p18, 안내 생략) — 빈 정간보부터
  $("#btnRetry").on("click", function () {
    AR.closePopup("#finishDim");
    startPlay();
  });
  $("#btnMore").on("click", () => AR.go("info.html?from=exp2"));
  $("#btnExit").on("click", () => AR.go("main.html"));
  $("#btnBack").on("click", () => AR.go("main.html"));
  $("#btnHome").on("click", () => AR.go("main.html"));

  /* ----- 프리로드 ----------------------------------------------------------- */
  AR.preload(
    ["bg_exp2.png", "text_exp2.png", "popup_tutorial.png", "btn_listen.png", "panel_rhythm_choices.png", "panel_score_empty.png", "text_complete.png", "character_janggu_group_complete.png"]
      .map((f) => IMG + f)
      .concat(
        SYMBOLS.map(tileSrc),
        MUSICIANS.flatMap((m) => ["idle", "deong", "kung", "deok"].map((p) => `${IMG}character_janggu_${m.side}_${p}.png`))
      )
  );
  AR.Sound.prime([S.exp2Guide, S.exp2End, S.correct, S.ceremony, ...SYMBOLS.flatMap((s) => [vo(s.vo), snd(s)])]);
});
