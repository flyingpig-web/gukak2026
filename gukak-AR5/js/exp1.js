/* =========================================================================
   활동1 — 지역마다 달라지는 아리랑을 들어보자! (exp1.html)  기획서 p6~18

   안내(체험 방법) → 플레이 → 세 지역 완료 팝업(2초) → 종료

   플레이(Mission 3종) — 캐릭터마다 같은 흐름을 되풀이한다
     도람 → 정선 / 찬돌 → 밀양 / 다온 → 진도
     ① 한양에 캐릭터 생성 + 목적지 화살표 + 찬돌 내레이션(재생 중엔 조작 불가)
     ② 내레이션이 끝나면 자진아라리 후렴 반복 재생, 캐릭터를 잡을 수 있다
     ③ 드래그하는 동안 이동 동작 2프레임 반복(산 타기 / 풀 헤치기 / 배 젓기)
     ④ 목적지에 놓으면 노래 포즈로 고정 + 지역 아리랑 후렴으로 크로스페이드
        (후렴이 끝날 때까지 조작 불가) → 대기 포즈로 그 자리에 남고 다음 캐릭터
        목적지 밖에 놓으면 한양으로 돌아간다

   좌표: 목업(1920×1080) 실측, 디자인 px 로 적고 place() 가 %로 바꾼다.
   ========================================================================= */
$(function () {
  const S = window.AR5_SFX;

  const HANYANG = { x: 885, b: 444 }; // 한양 출발점 — 캐릭터 발밑 가운데
  const DROP_R = 170; // 캐릭터 중심이 목적지 표지판에서 이 거리(디자인 px) 안이면 도착
  const FRAME_MS = 500; // 이동 동작 2프레임 교체 주기(기획 p9 "1초마다 반복" = 1초에 한 사이클)
  const SING_MIN_MS = 3000; // 후렴 음원이 없거나 짧아도 노래 포즈를 보여주는 최소 시간
  const SING_MAX_MS = 90000; // 음원이 끝났다는 신호가 안 올 때 대비
  const SUCCESS_MS = 2000; // 완료 팝업 → 종료 화면(기획 p17)
  const MUSIC_VOL = 0.6;
  const FADE_MS = 800;

  // size = [w, h] 디자인 px. move 는 큰 원본(1083~1536px)을 축소한 크기.
  // dest = 목적지 노래 포즈의 발밑 가운데, zone = 목적지 표지판 중심, arrow = 화살표 좌상단.
  const CHARS = [
    {
      id: "doram",
      vo: S.chandol02,
      song: S.jeongseon,
      size: { wait: [97, 206], sing: [176, 228], move: [217, 290] },
      dest: { x: 1222, b: 478 },
      zone: [1354, 412],
      arrow: [1316, 254],
    },
    {
      id: "chandol",
      vo: S.chandol03,
      song: S.miryang,
      size: { wait: [131, 228], sing: [177, 237], move: [430, 287] },
      dest: { x: 1266, b: 757 },
      zone: [1411, 602],
      arrow: [1376, 454],
    },
    {
      id: "daon",
      vo: S.chandol04,
      song: S.jindo,
      // 대기 포즈는 목업에서 원본(115×254)의 0.9배로 놓여 있다
      size: { wait: [104, 229], sing: [159, 251], move: [387, 319] },
      dest: { x: 943, b: 841 },
      zone: [902, 818],
      arrow: [866, 654],
    },
  ];

  const $stage = $("#stage");
  const $arrow = $("#arrow");
  const container = $(".container")[0];

  /* ----- 캐릭터 DOM 생성 ------------------------------------------------- */
  CHARS.forEach(function (c) {
    const src = (pose) => `img/03_exp1/${c.id}_${pose}.png`;
    c.$el = $(
      `<div class="char" id="char-${c.id}" data-pose="wait">` +
        ["wait", "move1", "move2", "sing"].map((p) => `<img class="p-${p}" src="${src(p)}" alt="" draggable="false" />`).join("") +
        "</div>"
    ).appendTo($stage);
  });

  // 캐릭터 중심(cx, cy)에 포즈 크기만큼 배치
  function place(c, pose) {
    const [w, h] = c.size[pose.startsWith("move") ? "move" : pose];
    c.$el.attr("data-pose", pose).css({
      left: ((c.cx - w / 2) / 1920) * 100 + "%",
      top: ((c.cy - h / 2) / 1080) * 100 + "%",
      width: (w / 1920) * 100 + "%",
      height: (h / 1080) * 100 + "%",
    });
  }

  // 발밑 기준점(x, b)에 포즈 세우기
  function stand(c, pose, at) {
    c.cx = at.x;
    c.cy = at.b - c.size[pose][1] / 2;
    place(c, pose);
  }

  /* ----- 음악 — 한 채널, 곡을 바꾸면 크로스페이드 --------------------------
     AR.Sound.playBgm 은 페이드가 없어 여기서 따로 둔다(활동1 에서만 씀).
     파일이 없거나(404) 재생이 막히면 onEnd 를 즉시 불러 진행이 멈추지 않게 한다. */
  const Music = (() => {
    let cur = null;

    function fade(a, to, ms, done) {
      cancelAnimationFrame(a._raf);
      const from = a.volume;
      const t0 = performance.now();
      (function tick() {
        const k = Math.min(1, (performance.now() - t0) / ms);
        a.volume = from + (to - from) * k;
        if (k < 1) a._raf = requestAnimationFrame(tick);
        else if (done) done();
      })();
    }

    function stop() {
      const a = cur;
      cur = null;
      if (a) fade(a, 0, FADE_MS, () => a.pause());
    }

    function play(src, { loop = false, onEnd } = {}) {
      stop();
      const a = new Audio(src);
      a.loop = loop;
      a.volume = 0;
      cur = a;
      let fired = false;
      const end = () => {
        if (fired || cur !== a) return;
        fired = true;
        onEnd?.();
      };
      a.addEventListener("ended", end);
      a.addEventListener("error", end);
      a.play()?.catch(end);
      fade(a, MUSIC_VOL, FADE_MS);
    }

    return { play, stop };
  })();

  /* ----- 진행 ------------------------------------------------------------- */
  let idx = 0;
  let token = 0; // [다시하기]/이탈 시 올려서 이전 흐름의 지연 콜백을 무효화

  function reset() {
    token++;
    Music.stop();
    AR.Sound.stopNarration();
    stopDrag();
    CHARS.forEach((c) => c.$el.removeClass("on grab dragging returning"));
    $arrow.removeClass("on");
    AR.closePopup("#successDim");
  }

  function startPlay() {
    reset();
    $stage.addClass("on");
    enter(0);
  }

  function enter(i) {
    const my = token;
    const c = CHARS[i];
    idx = i;
    Music.stop(); // 지역 후렴 → (내레이션) → 자진아라리 로 돌아간다(기획 p11)
    stand(c, "wait", HANYANG);
    c.$el.addClass("on");
    $arrow.css({ left: (c.arrow[0] / 1920) * 100 + "%", top: (c.arrow[1] / 1080) * 100 + "%" }).addClass("on");
    AR.Sound.narrate(c.vo, {
      onEnd() {
        if (my !== token) return;
        c.$el.addClass("grab");
        Music.play(S.jajin, { loop: true });
      },
    });
  }

  function arrive(c) {
    const my = token;
    const t0 = performance.now();
    c.$el.removeClass("grab");
    $arrow.removeClass("on");
    stand(c, "sing", c.dest);

    let done = false;
    const finish = () => {
      if (done || my !== token) return;
      done = true;
      clearTimeout(safety);
      setTimeout(function () {
        if (my !== token) return;
        stand(c, "wait", c.dest);
        if (idx + 1 < CHARS.length) enter(idx + 1);
        else success();
      }, Math.max(0, SING_MIN_MS - (performance.now() - t0)));
    };
    const safety = setTimeout(finish, SING_MAX_MS);
    Music.play(c.song, { onEnd: finish });
  }

  function success() {
    const my = token;
    Music.stop();
    AR.openPopup("#successDim");
    AR.Sound.sfx(S.ceremony);
    setTimeout(function () {
      if (my !== token) return;
      AR.closePopup("#successDim");
      openFinish();
    }, SUCCESS_MS);
  }

  function openFinish() {
    AR.openPopup("#finishDim");
    AR.Sound.narrate(S.chandol05);
  }

  /* ----- 드래그 ------------------------------------------------------------ */
  let drag = null; // { c, dx, dy, timer }

  function toDesign(e) {
    const r = container.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * 1920, y: ((e.clientY - r.top) / r.height) * 1080 };
  }

  function stopDrag() {
    if (!drag) return;
    clearInterval(drag.timer);
    drag.c.$el.removeClass("dragging");
    drag = null;
  }

  CHARS.forEach(function (c) {
    const el = c.$el[0];

    el.addEventListener("pointerdown", function (e) {
      if (drag || !c.$el.hasClass("grab")) return;
      e.preventDefault();
      try {
        el.setPointerCapture(e.pointerId);
      } catch (err) {}
      const p = toDesign(e);
      c.$el.removeClass("returning").addClass("dragging");
      place(c, "move1");
      drag = {
        c,
        dx: c.cx - p.x,
        dy: c.cy - p.y,
        timer: setInterval(() => place(c, c.$el.attr("data-pose") === "move1" ? "move2" : "move1"), FRAME_MS),
      };
    });

    el.addEventListener("pointermove", function (e) {
      if (drag?.c !== c) return;
      const p = toDesign(e);
      c.cx = Math.min(1920, Math.max(0, p.x + drag.dx));
      c.cy = Math.min(1080, Math.max(0, p.y + drag.dy));
      place(c, c.$el.attr("data-pose"));
    });

    const drop = function () {
      if (drag?.c !== c) return;
      stopDrag();
      if (Math.hypot(c.cx - c.zone[0], c.cy - c.zone[1]) <= DROP_R) {
        arrive(c);
        return;
      }
      c.$el.addClass("returning");
      stand(c, "wait", HANYANG);
      setTimeout(() => c.$el.removeClass("returning"), 400);
    };
    el.addEventListener("pointerup", drop);
    el.addEventListener("pointercancel", drop);
    el.addEventListener("contextmenu", (e) => e.preventDefault());
  });

  /* ----- 안내 → 플레이 ------------------------------------------------------ */
  // 안내 화면은 진입 즉시 떠 있다(HTML 에 .flex). 자동재생이 막히면 첫 터치에서 다시 시도.
  const vo = AR.Sound.narrate(S.chandol01);
  if (vo) {
    $(document).one("pointerdown", function () {
      if (vo.paused && vo.currentTime === 0 && $("#guideDim").hasClass("flex")) AR.Sound.narrate(S.chandol01);
    });
  }

  $("#btnGuidePlay").on("click", function () {
    AR.closePopup("#guideDim");
    startPlay();
  });

  /* ----- 종료 팝업 / 상단바 ------------------------------------------------- */
  // [다시하기] — 기획 p18 은 "활동1-준비"/"활동1-체험" 두 가지로 적혀 있다. AR2 와 같이 체험으로 바로.
  $("#btnRetry").on("click", function () {
    AR.closePopup("#finishDim");
    startPlay();
  });
  $("#btnExit").on("click", function () {
    AR.go("main.html");
  });
  $("#btnBack").on("click", function () {
    AR.go("main.html");
  });
  // [홈] 은 타이틀이 아니라 MAIN 으로 — 활동 선택 화면이 이 콘텐츠의 홈(AR2 수정요청과 동일)
  $("#btnHome").on("click", function () {
    AR.go("main.html");
  });

  /* ----- 프리로드 ----------------------------------------------------------- */
  AR.preload(
    [
      "img/03_exp1/bg_exp1.png",
      "img/03_exp1/sign.png",
      "img/03_exp1/title_exp1.png",
      "img/03_exp1/exp1_tutorial.png",
      "img/03_exp1/arrow.png",
      "img/03_exp1/end_bg.png",
      "img/03_exp1/end_success.png",
      "img/03_exp1/end_text.png",
      "img/03_exp1/end_image.png",
    ].concat(CHARS.flatMap((c) => ["wait", "move1", "move2", "sing"].map((p) => `img/03_exp1/${c.id}_${p}.png`)))
  );
  AR.Sound.prime([S.chandol01, S.chandol02, S.chandol03, S.chandol04, S.chandol05, S.ceremony]);
});
