/* =========================================================================
   활동2 — 꾀꼬리를 보고 춤 동작을 만들어요 (exp2.html) — 기획서 p19~p27

   한 문제
     ① '무희N_22'("꾀꼬리의 움직임을 잘 살펴보세요!") — 재생 중에는 버튼을 못 누른다(기획 p20-2)
     ② 내레이션이 끝나면 꾀꼬리가 그 춤사위를 네 프레임으로 반복하고,
        그 춤사위가 나오는 춘앵전 음악을 BGM 으로 반복 재생한다(기획 p20-3·4, 음원 미납품)
     ③ 맞는 버튼을 누르면 그 춤사위 구체가 버튼 위에 생겨 화면 밖으로 날아가고
        정답 내레이션이 이어진다(기획 p24-1·2)
     ④ 틀린 버튼은 효과음 + 흔들림만 주고 다시 고르게 둔다(기획 p24-3)

   진행 순서는 기획 p20 "춤사위 진행 순서" — 회란 → 비리 → 낙화유수 → 사사보여의풍.
   (하단 버튼의 좌우 배치는 목업대로 비리 · 회란 · 낙화유수 · 사사보여의풍 그대로 둔다)
   ========================================================================= */
$(function () {
  const S = window.AR3_SFX;
  const N = window.AR3_N;

  /* ----- 조정 포인트 ------------------------------------------------ */
  const FRAME_MS = 440; //     꾀꼬리 프레임 간격(4프레임 = 한 바퀴). 220 → 440 으로 절반 속도(PD 요청 261119)
  const ORB_MS = 1700; //      구체가 날아가는 시간(css .orb-fly 와 맞출 것)
  const COMPLETE_HOLD = 1500; // 완료 문구가 떠 있는 시간 → 종료 화면
  //                             (기획 p26-2 는 "1초후" 지만 활동1 과 템포를 맞춘다 — PD 요청 261119)
  const BGM_VOL = 0.45;

  /* ----- 춤사위 ------------------------------------------------------
     vo 는 납품 파일 그대로다. 회란·사사보여의풍은 [명칭+설명]이 한 파일,
     비리·낙화유수는 [명칭][설명] 두 파일로 나뉘어 있어 이어서 재생한다. */
  const DANCES = {
    hoeran: { label: "회란", vo: ["heejin_exp2_03"], bgm: S.danceBgm.hoeran },
    biri: { label: "비리", vo: ["heejin_exp2_04", "heejin_exp2_05"], bgm: S.danceBgm.biri },
    nakhwa: { label: "낙화유수", vo: ["heejin_exp2_06", "heejin_exp2_07"], bgm: S.danceBgm.nakhwa },
    sasa: { label: "사사보여의풍", vo: ["heejin_exp2_08"], bgm: S.danceBgm.sasa },
  };
  const ORDER = ["hoeran", "biri", "nakhwa", "sasa"];

  const IMG = "img/04_exp2/";
  const frameSrc = (k, i) => `${IMG}bird_${k}/bird_${k}_${i}.png`;
  const orbSrc = (k) => `${IMG}orb_${k}.png`;

  /* 프레임별 세로 보정 (디자인 px, 음수 = 위로) ----------------------------
     네 춤사위 × 4프레임이 같은 캔버스(462×390)지만 그림 안에서 발의 높이가 조금씩 다르다.
     대부분은 나뭇가지 윗면(실측 y 465~475)에 잘 얹히는데, 몇 장은 발이 가지보다
     아래로 내려가 새가 떠 있는 것처럼 보였다(PD 지적 261119) → 그 장만 끌어올린다.
     0 인 프레임은 손대지 않은 것이다. */
  const BIRD_TOP = 171; // css .bird 의 기준 top(디자인 px)
  const FRAME_DY = {
    hoeran: [0, 0, 0, 0],
    biri: [0, 0, 0, 0],
    nakhwa: [0, -54, 0, 0],
    sasa: [0, -36, 0, 0],
  };
  const dyOf = (k, n) => ((FRAME_DY[k] || [])[n - 1] || 0);
  const topPct = (dy) => ((BIRD_TOP + dy) / 1080) * 100 + "%";

  /* 프레임별 크기 보정 — `nakhwa_2`(뒤도는 동작)만 다른 장보다 커 보인다(PD 지적 261119).
     뒤돌아 서서 목을 길게 뺀 자세라 실루엣이 세로로 길어진 탓이다(노란 몸통 면적은 다른 장과
     ±2% 안으로 같다). 줄이는 기준점은 `transform-origin: center bottom`(css)이라
     발 높이는 거의 그대로다. 1 인 프레임은 손대지 않은 것. */
  const FRAME_SCALE = {
    nakhwa: [1, 0.8, 1, 1],
    sasa: [1, 0.9, 1, 1],
  };
  const scaleOf = (k, n) => ((FRAME_SCALE[k] || [])[n - 1] || 1);

  /* ----- 상태 ------------------------------------------------------- */
  let idx = -1;
  let locked = true; // 내레이션·연출 중에는 버튼을 받지 않는다
  let frameTimer = 0;
  let frame = 1;

  const $bird = $("#bird");
  const $ghost1 = $("#birdGhost1");
  const $ghost2 = $("#birdGhost2");
  const $orb = $("#orb");

  // 잔상이 옅어지는 시간은 프레임 간격에 맞춘다(FRAME_MS 를 바꿔도 따라온다)
  [$ghost1, $ghost2].forEach(($g) =>
    $g[0].style.setProperty("--ghost-ms", Math.round(FRAME_MS * 1.7) + "ms")
  );

  function setButtons(on) {
    locked = !on;
    $(".dance-btn").prop("disabled", !on);
  }

  /* ----- 꾀꼬리 프레임 ------------------------------------------------
     프레임을 갈아 끼울 때 직전 두 장을 잔상으로 남긴다 — 멈춘 그림만 번갈아 보면
     새가 어느 쪽으로 도는지 알기 어렵다(PD 요청 261119). 잔상은 옅어지며 사라진다. */
  function stopFrames() {
    clearInterval(frameTimer);
    frameTimer = 0;
  }

  let curBird = { dy: 0, sc: 1 }; // 지금 꾀꼬리에 걸린 보정
  let curGhost1 = { dy: 0, sc: 1 };

  function paint($el, src, dy, sc) {
    $el.attr("src", src).css({ top: topPct(dy), transform: "scale(" + sc + ")" });
  }

  // 잔상 없이 그 프레임만 보여 준다(문제 시작 등)
  function setFrame(key, n) {
    frame = n;
    curBird = { dy: dyOf(key, n), sc: scaleOf(key, n) };
    paint($bird, frameSrc(key, n), curBird.dy, curBird.sc);
    $ghost1.removeClass("flash").attr("src", "");
    $ghost2.removeClass("flash").attr("src", "");
  }

  function showFrame(key, n) {
    // 잔상을 한 칸씩 밀어낸다(g1 = 직전, g2 = 그 전) — 보정값도 같이 따라간다
    const prev = { src: $bird.attr("src"), dy: curBird.dy, sc: curBird.sc };
    const prev2 = { src: $ghost1.attr("src"), dy: curGhost1.dy, sc: curGhost1.sc };
    [[$ghost2, prev2], [$ghost1, prev]].forEach(function ([$g, p]) {
      $g.removeClass("flash");
      if (!p.src) return;
      paint($g, p.src, p.dy, p.sc);
      void $g[0].offsetWidth; // 애니메이션 재시작
      $g.addClass("flash");
    });
    curGhost1 = { dy: prev.dy, sc: prev.sc };
    frame = n;
    curBird = { dy: dyOf(key, n), sc: scaleOf(key, n) };
    paint($bird, frameSrc(key, n), curBird.dy, curBird.sc);
  }

  function playFrames(key) {
    stopFrames();
    setFrame(key, 1);
    frameTimer = setInterval(function () {
      showFrame(key, (frame % 4) + 1);
    }, FRAME_MS);
  }

  /* ----- 내레이션 이어 재생 ------------------------------------------- */
  function narrateChain(list, done) {
    const q = list.slice();
    (function next() {
      if (!q.length) return done && done();
      AR.Sound.narrate(N(q.shift()), { onEnd: next });
    })();
  }

  /* ----- 한 문제 ------------------------------------------------------ */
  function ask(i) {
    idx = i;
    if (i >= ORDER.length) return finishPlay();

    const key = ORDER[i];
    const d = DANCES[key];

    setButtons(false);
    stopFrames();
    setFrame(key, 1); // 내레이션 동안은 잔상 없이 멈춰 있는다

    AR.Sound.narrate(S.exp2Watch, {
      onEnd: function () {
        playFrames(key);
        AR.Sound.loop("dance", d.bgm, { volume: BGM_VOL }); // 미납품 → 무음
        setButtons(true);
      },
    });
  }

  /* ----- 선택 --------------------------------------------------------- */
  function pick(key, $btn) {
    if (locked) return;
    const want = ORDER[idx];

    if (key !== want) {
      AR.Sound.sfx(S.incorrect);
      $btn.find("img").addClass("shake");
      setTimeout(() => $btn.find("img").removeClass("shake"), 800);
      return;
    }

    setButtons(false);
    // 꾀꼬리는 계속 그 춤사위를 춘다 — 정답 멘트가 나오는 동안 멈춰 있으면 어색하다(PD 요청 261119).
    // 다음 문제로 넘어갈 때 ask() 가 새 춤사위 첫 프레임으로 갈아 끼운다.
    AR.Sound.stopLoop("dance"); // 멘트가 들리도록 BGM 만 멈춘다
    AR.Sound.sfx(S.correct);
    AR.Sound.sfx(S.orb); // 구체 효과음 — 미납품(무음)
    $btn.addClass("done");

    // 구체가 고른 버튼 위에 생겨나 화면 밖으로
    const left = parseFloat($btn.css("left")) / $(".container").width() * 100;
    const wPct = parseFloat($btn.css("width")) / $(".container").width() * 100;
    $orb
      .attr("src", orbSrc(key))
      .css("left", left + wPct / 2 + "%")
      .removeClass("on");
    void $orb[0].offsetWidth; // 애니메이션 재시작
    $orb.addClass("on");
    setTimeout(() => $orb.removeClass("on"), ORB_MS);

    narrateChain(DANCES[key].vo, function () {
      ask(idx + 1);
    });
  }

  $(".dance-btn").on("click", function () {
    pick($(this).data("key"), $(this));
  });

  /* ----- 완료 → 종료 (기획 p26) ---------------------------------------- */
  // 완료 문구(text_complete)가 뜰 때는 꾀꼬리도 멈춘다 — 연출을 정리하고 보여 주는 장면이다
  function finishPlay() {
    stopFrames();
    $ghost1.removeClass("flash");
    $ghost2.removeClass("flash");
    AR.Sound.stopLoop("dance");
    AR.Sound.sfx(S.ceremony);
    $("#exp2Dim").addClass("on"); // 배경·꾀꼬리·버튼을 가라앉힌다(활동1 세레모니와 같은 결)
    $("#completeText").addClass("on");
    setTimeout(showFinish, COMPLETE_HOLD);
  }

  function showFinish() {
    stopFrames(); // 화면을 덮기 전에 타이머를 거둔다
    $ghost1.removeClass("flash");
    $ghost2.removeClass("flash");
    $("#completeText").removeClass("on");
    $("#stage").removeClass("on");
    AR.openPopup("#finishDim");
    AR.Sound.narrate(S.exp2End); // 기획 p27-1 — 종료 화면 진입 시
  }

  /* ----- 안내 → 플레이 -------------------------------------------------- */
  $("#btnGuidePlay").on("click", function () {
    AR.closePopup("#guideDim");
    $("#stage").addClass("on");
    ask(0);
  });

  /* ----- 상단바 / 종료 버튼 ---------------------------------------------- */
  $("#btnBack").on("click", () => AR.go("main.html"));
  $("#btnHome").on("click", () => AR.go("main.html"));
  $("#btnRetry").on("click", () => AR.go("exp2.html"));
  $("#btnMore").on("click", () => AR.go("info2.html?from=exp2"));
  $("#btnExit").on("click", () => AR.go("main.html"));

  /* ----- 진입 ------------------------------------------------------------ */
  setButtons(false);
  AR.Sound.prime([S.exp2Guide, S.exp2Watch, S.exp2End, S.correct, S.incorrect]);
  AR.preload([
    IMG + "bg_exp2.png",
    IMG + "exp2_tutorial.png",
    IMG + "btn_biri.png",
    IMG + "btn_hoeran.png",
    IMG + "btn_nakhwa.png",
    IMG + "btn_sasa.png",
    frameSrc("hoeran", 1),
  ]).then(function () {
    const list = [];
    ORDER.forEach(function (k) {
      for (let i = 1; i <= 4; i++) list.push(frameSrc(k, i));
      list.push(orbSrc(k));
    });
    list.push(IMG + "text_complete.png", IMG + "end_main.png");
    AR.prefetch(list);
  });

  // info2 에서 [뒤로] 로 돌아오면 종료 화면을 그대로 복원한다
  if (/(\?|&)done\b/.test(location.search)) {
    AR.closePopup("#guideDim");
    AR.openPopup("#finishDim");
  } else {
    AR.Sound.narrate(S.exp2Guide);
  }
});
