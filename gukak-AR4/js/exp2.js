/* =========================================================================
   활동2 — 말없이 몸짓으로 이야기해요! (exp2.html, 기획서 p22~p38)

   다섯 마당을 차례로 본다. 한 마당은
     등장인물 동작 루프(2~3장) + 보기 2개
       → 맞는 보기를 고르면 : 음성 → 딤드 + 정답 그림 + [마당 이름] + 장단/효과 → 5초 뒤 다음 마당
       → 틀린 보기를 고르면 : 음성 + 오답음 + 버튼이 좌우로 흔들림(다시 고르기)
   좌표는 디자인 px(1920×1080). 보기 두 개의 자리는 다섯 마당 모두 같다.
   ========================================================================= */
$(function () {
  const S = window.AR4_SFX;
  const N = window.AR4_N;

  /* ----- 조정 포인트 ------------------------------------------------- */
  const FRAME_MS = 550; //   동작 루프 한 장당
  const ANSWER_MS = 5000; // 정답 화면 유지(기획 "5초 유지 후 다음 페이지")
  const LEAD_MS = 400; //    보기 음성 뒤 정답 화면으로 넘어가기까지 최소 간격
  const CONFETTI = {
    count: 50,
    colors: ["#3462C4", "#E23A30", "#FAC028", "#309C56"],
    minMs: 2600, //    떨어지는 데 걸리는 시간(느릴수록 더 흩날려 보인다)
    maxMs: 4200,
    // 좌우로 살랑이는 폭 — translateX 의 % 는 "조각 자신의 너비" 기준이다.
    // 조각이 가로 10~22 디자인 px 이므로 250~900% 면 한쪽으로 25~200px 쯤 흔들린다.
    swayMin: 250,
    swayMax: 900,
    swayMinMs: 900, // 좌우 한 번 왕복
    swayMaxMs: 1900,
    spinMinMs: 700, // 제자리에서 한 바퀴 뒤집히는 시간
    spinMaxMs: 1600,
  };

  /* 마당 다섯 — answer/title 은 목업 실측값(좌상단 + 크기) */
  const MADANG = [
    {
      n: 1,
      frames: 3,
      answer: [423, 202, 1019, 582],
      title: [443, 806, 1035, 190],
      voCorrect: N("siyun_exp2_02"), // 시윤N_12 재미있게 장난을 쳐요
      voWrong: N("siyun_exp2_03"), //   시윤N_13 무섭게 화를 내요
      voTitle: N("siyun_exp2_04"), //   시윤N_14 장자마리의 놀이마당!   ✗
      jangdan: S.jangdan.samchae,
      sfx: S.laugh, // 관객 웃음소리  ✗
      jiggle: true,
    },
    {
      n: 2,
      frames: 3,
      answer: [423, 194, 1019, 590],
      title: [376, 824, 1169, 172],
      voCorrect: N("siyun_exp2_05"), // 시윤N_15 서로 마음을 전해요
      voWrong: N("siyun_exp2_06"), //   시윤N_16 싫어서 쫓아내요
      voTitle: N("siyun_exp2_07"), //   시윤N_17 양반광대와 소매각시의 사랑마당!  ✗
      jangdan: S.jangdan.gutgeori,
      fx: "heart",
    },
    {
      n: 3,
      frames: 3,
      answer: [423, 207, 1019, 577],
      title: [442, 822, 1037, 174],
      voCorrect: N("siyun_exp2_08"), // 시윤N_18 둘 사이를 방해해요
      voWrong: N("siyun_exp2_09"), //   시윤N_19 반갑게 인사해요
      voTitle: N("siyun_exp2_10"), //   시윤N_20 시시딱딱이의 훼방마당!  ✗
      jangdan: S.jangdan.ichae,
      fx: "dust",
      jiggle: true,
    },
    {
      n: 4,
      frames: 3,
      answer: [423, 195, 1019, 589],
      title: [444, 797, 1032, 199],
      voCorrect: N("siyun_exp2_11"), // 시윤N_21 서로 오해가 생겼어요
      voWrong: N("siyun_exp2_12"), //   시윤N_22 함께 기뻐하고 있어요
      voTitle: N("siyun_exp2_13"), //   시윤N_23 소매각시의 기절소동!   ✗
      jangdan: S.jangdan.seonghwanggut,
      fx: "dizzy",
    },
    {
      n: 5,
      frames: 2, // 다섯째 마당만 동작이 두 장이다
      answer: [270, 76, 1323, 742],
      title: [233, 803, 1454, 193],
      voCorrect: N("siyun_exp2_14"), // 시윤N_24 서로 용서하고 화해해요
      voWrong: N("siyun_exp2_15"), //   시윤N_25 화가 나서 헤어져요
      voTitle: N("siyun_exp2_16"), //   시윤N_26 양반광대와 소매각시의 화해마당!  ✗
      jangdan: S.jangdan.gutgeori,
      fx: "confetti",
    },
  ];

  /* 마당별 효과 소스 — 목업 실측 자리 그대로 */
  const FX = {
    heart: [
      { cls: "fx-heart", src: "img/04_exp2/heart1.png", box: [1200, 276, 201, 201], delay: 0 },
      { cls: "fx-heart", src: "img/04_exp2/heart2.png", box: [417, 396, 161, 161], delay: 700 },
      { cls: "fx-heart", src: "img/04_exp2/heart3.png", box: [1149, 574, 121, 121], delay: 1300 },
    ],
    dust: [
      { cls: "fx-dust-left", src: "img/04_exp2/effect_dust_left.png", box: [306, 603, 403, 216], delay: 0 },
      { cls: "fx-dust-right", src: "img/04_exp2/effect_dust_right.png", box: [1196, 597, 426, 227], delay: 0 },
    ],
    dizzy: [
      { cls: "fx-dizzy", src: "img/04_exp2/effect_dizzy.png", box: [326, 415, 521, 301], delay: 0 },
      { cls: "fx-sweat", src: "img/04_exp2/effect_sweat.png", box: [1131, 264, 152, 180], delay: 0 },
    ],
  };

  const pcX = (px) => (px / 1920) * 100 + "%";
  const pcY = (px) => (px / 1080) * 100 + "%";

  const $stage = $("#stage");
  const $frame = $("#frame");
  const $dim = $("#answerDim");
  const $answer = $("#answer");
  const $title = $("#title");
  const $fx = $("#fx");
  const $bc = $("#btnCorrect");
  const $bw = $("#btnWrong");

  let mi = -1;
  let m = null;
  let frameTimer = 0;
  let stepTimer = 0;
  let locked = true;

  function clearTimers() {
    clearInterval(frameTimer);
    clearTimeout(stepTimer);
    frameTimer = stepTimer = 0;
  }

  /* ----- 한 마당 시작 -------------------------------------------------- */
  function startMadang(i) {
    clearTimers();
    mi = i;
    m = MADANG[i];

    $dim.removeClass("on");
    $answer.removeClass("on jiggle");
    $title.removeClass("on");
    $fx.empty();

    $frame.attr("src", `img/04_exp2/madang${m.n}_1.png`).css("opacity", 1);
    $("#imgCorrect").attr("src", `img/04_exp2/btn_madang${m.n}_correct.png`);
    $("#imgWrong").attr("src", `img/04_exp2/btn_madang${m.n}_wrong.png`);
    $bc.addClass("on");
    $bw.addClass("on");
    $stage.addClass("on");
    locked = false;

    let f = 0;
    frameTimer = setInterval(function () {
      f = (f + 1) % m.frames;
      $frame.attr("src", `img/04_exp2/madang${m.n}_${f + 1}.png`);
    }, FRAME_MS);
  }

  /* ----- 정답 ---------------------------------------------------------- */
  function onCorrect() {
    if (locked) return;
    locked = true;
    AR.Sound.sfx(S.correct); // 올바른 보기를 눌렀을 때(수정요청안 261110 p3)
    $bc.removeClass("on");
    $bw.removeClass("on");

    let moved = false;
    const go = function () {
      if (moved) return;
      moved = true;
      showAnswer();
    };
    AR.Sound.narrate(m.voCorrect, { onEnd: () => setTimeout(go, LEAD_MS) });
    setTimeout(go, 3200); // 음원이 없거나 길어도 멈추지 않도록
  }

  function showAnswer() {
    clearInterval(frameTimer);
    const [ax, ay, aw, ah] = m.answer;
    const [tx, ty, tw, th] = m.title;

    $frame.css("opacity", 0);
    $dim.addClass("on");
    $answer
      .attr("src", `img/04_exp2/madang${m.n}_answer.png`)
      .css({ left: pcX(ax), top: pcY(ay), width: pcX(aw), height: pcY(ah) })
      .addClass("on")
      .toggleClass("jiggle", !!m.jiggle);
    $title
      .attr("src", `img/04_exp2/madang${m.n}_title.png`)
      .css({ left: pcX(tx), top: pcY(ty), width: pcX(tw), height: pcY(th) })
      .addClass("on");

    playFx();
    AR.Sound.playBgm(m.jangdan, { loop: false, volume: 0.6 });
    if (m.sfx) AR.Sound.sfx(m.sfx);
    AR.Sound.narrate(m.voTitle);

    stepTimer = setTimeout(function () {
      if (mi >= MADANG.length - 1) finish();
      else startMadang(mi + 1);
    }, ANSWER_MS);
  }

  function playFx() {
    $fx.empty();
    if (m.fx === "confetti") return confetti();
    (FX[m.fx] || []).forEach(function (f) {
      const [x, y, w, h] = f.box;
      $("<img class='fx'>")
        .addClass(f.cls)
        .attr("src", f.src)
        .css({
          left: pcX(x),
          top: pcY(y),
          width: pcX(w),
          height: pcY(h),
          animationDelay: f.delay + "ms",
        })
        .appendTo($fx);
    });
  }

  /* 다섯째 마당 — 색종이가 위에서 아래로 흩날리며 떨어진다(기획 p37-3,
     수정요청안 261110 p4 "살짝 흩날리면서 내려오는 느낌").
     한 장이 세 겹이다 — 바깥은 곧게 떨어지고(fall), 가운데는 좌우로 살랑이고(sway),
     안쪽은 제자리에서 뒤집힌다(spin). 세 가지 주기를 서로 다르게 줘야
     같은 박자로 움직이지 않고 종이처럼 제각각 날린다. */
  function confetti() {
    const C = CONFETTI;
    const rnd = (a, b) => a + Math.random() * (b - a);
    for (let i = 0; i < C.count; i++) {
      const w = 10 + Math.random() * 12;
      const h = w * (0.5 + Math.random() * 0.9);
      const $sway = $("<i class='cf-sway'></i>").css({
        animationDuration: rnd(C.swayMinMs, C.swayMaxMs) + "ms",
        animationDelay: rnd(-C.swayMaxMs, 0) + "ms", // 시작 위상을 흩어 놓는다
      });
      $("<i class='cf-spin'></i>")
        .css({
          background: C.colors[i % C.colors.length],
          animationDuration: rnd(C.spinMinMs, C.spinMaxMs) + "ms",
          animationDirection: Math.random() < 0.5 ? "normal" : "reverse",
        })
        .appendTo($sway);
      $("<i class='fx fx-confetti'></i>")
        .css({
          left: Math.random() * 100 + "%",
          width: pcX(w),
          height: pcY(h),
          "--sway": rnd(C.swayMin, C.swayMax) + "%",
          animationDuration: rnd(C.minMs, C.maxMs) + "ms",
          animationDelay: Math.random() * 900 + "ms",
        })
        .append($sway)
        .appendTo($fx);
    }
  }

  /* ----- 오답 ---------------------------------------------------------- */
  function onWrong() {
    if (locked) return;
    AR.Sound.sfx(S.incorrect);
    AR.Sound.narrate(m.voWrong);
    $bw.addClass("shake-x");
    setTimeout(() => $bw.removeClass("shake-x"), 470);
  }

  /* ----- 종료 ---------------------------------------------------------- */
  function finish() {
    clearTimers();
    locked = true;
    $stage.removeClass("on");
    AR.Sound.stopBgm();
    AR.openPopup("#finishDim");
    AR.Sound.sfxThen(S.ceremony, function () {
      AR.Sound.narrate(S.exp2End);
    });
  }

  function reset() {
    AR.closePopup("#finishDim");
    AR.Sound.stopNarration();
    AR.Sound.stopBgm();
    startMadang(0);
  }

  /* ----- 묶기 ---------------------------------------------------------- */
  $("#btnGuidePlay").on("click", function () {
    $("#guideDim").removeClass("flex");
    AR.Sound.stopNarration();
    startMadang(0);
  });

  $bc.on("click", onCorrect);
  $bw.on("click", onWrong);

  $("#btnRetry").on("click", reset);
  $("#btnMore").on("click", () => AR.go("info2.html?from=exp2"));
  $("#btnExit").on("click", () => AR.go("main.html"));
  $("#btnBack, #btnHome").on("click", () => AR.go("main.html"));

  /* ----- 시작 ---------------------------------------------------------- */
  AR.Sound.prime([S.exp2Guide, S.ceremony, S.exp2End, S.incorrect, S.correct]);
  AR.preload(
    ["img/04_exp2/bg_exp2.png", "img/04_exp2/exp2_tutorial.png"].concat(
      MADANG.map((x) => `img/04_exp2/madang${x.n}_1.png`),
      MADANG.map((x) => `img/04_exp2/madang${x.n}_answer.png`),
      MADANG.map((x) => `img/04_exp2/madang${x.n}_title.png`)
    )
  );

  if (location.search.indexOf("done") >= 0) {
    $("#guideDim").removeClass("flex");
    mi = MADANG.length - 1;
    m = MADANG[mi];
    finish();
  } else {
    AR.Sound.narrate(S.exp2Guide);
  }
});
