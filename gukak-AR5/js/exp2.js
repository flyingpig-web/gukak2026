/* =========================================================================
   활동2 — 각 아리랑에 담긴 고향 풍경을 완성해보자! (exp2.html)  기획서 p21~39

   안내(체험 방법) → 선택 → (캐릭터마다) 노래 → 세 고장 완료 → 풍경 완성 팝업(1초) → 종료

   선택: 세 고장 흑백 띠 배경 앞에 다온·도람·찬돌. 다온N_02 가 끝나야 고를 수 있다(순서 자유).
   노래(Mission 3종) — 고른 캐릭터마다 같은 흐름
     ① 고장 배경이 띠에서 화면 전체로 펼쳐지고, 캐릭터는 왼쪽(다온 자리)으로, 나머지는 -70%
     ② 보름달 등장 → 메기는 소리(말풍선) → 받는 소리 동안 터치 글자마다 달무리가 줄어든다
     ③ 달무리가 달과 겹칠 때 달을 누르면 글자가 빛나고 컬러 배경이 가운데부터 1/N 씩 번진다
        (놓쳐도 노래는 끝까지 간다)
     ④ 세 고장 화면으로 돌아온다(기획 p36)
        성공(터치 글자를 모두 맞힘) → 그 고장 띠는 컬러, 그 캐릭터는 다시 못 고른다
        실패 → 흑백으로 남고 그 캐릭터를 다시 고를 수 있다. 세 고장 모두 성공해야 종료

   ★ 음원 미납품 — 아래 hits(터치 글자별 목표 시각)는 가짜 값이다. 음원이 오면 URL 에
     ?tap 을 붙여 노래에 맞춰 달을 두드리면 콘솔에 시각(ms)이 찍힌다 → 그 값으로 교체.
   ========================================================================= */
$(function () {
  const S = window.AR5_SFX;

  const LEAD_MS = 1200; // 달무리가 나타나서 달 크기로 줄어들기까지
  const HIT_MS = 300; // 목표 시각 앞뒤로 이만큼 안에 누르면 성공
  const TAIL_MS = 1500; // 마지막 터치 뒤 노래 마무리
  const SONG_MAX_MS = 90000; // 음원 ended 가 안 올 때 대비
  const PASS_RATIO = 1; // 터치 글자 중 이 비율 이상 맞히면 성공(1 = 전부). 너무 어려우면 낮춘다
  const REVEAL_MAX = 112; // 번짐 반지름 %(closest-corner 기준) — 가장자리 흐림(12%)까지 모서리를 넘긴다
  const DONE_WAIT_MS = 1200; // 컬러가 다 번진 뒤 세 고장 화면으로
  const OPEN_MS = 900; // 배경 펼침(0.8s) 뒤 보름달 등장
  const ALL_DONE_WAIT_MS = 1000; // 세 고장 모두 컬러가 된 화면(기획 p37)을 보여주는 시간
  const SUCCESS_MS = 2000; // 풍경 완성 팝업 → 종료(기획 p38) — 활동1 과 같게
  const MUSIC_VOL = 0.8;
  const SLOT_PLAY = 177.5; // 노래할 때 캐릭터 자리 = 다온 자리

  // 가사: '*' 다음 글자가 터치 글자(기획 p25 빨간 원). '\n' 은 줄바꿈(목업 p24/31/34).
  // strip = [left, width] 디자인 px (off / on 폭이 조금 다르다), slot = 캐릭터 버튼 left.
  // ponytail: hits 는 음원 없이 1.6초 간격으로 넣은 가짜 타이밍 — 음원 받으면 실측값으로.
  const REGIONS = [
    {
      id: "daon",
      place: "jindo",
      strip: { off: [0, 621], on: [0, 621] },
      slot: 177.5,
      song: S.exp2Jindo,
      lyrics: "*아리아리랑 *쓰리쓰리랑\n*아라리가 났네 *아리랑 음- *아라리가 났네",
      hits: [4500, 6100, 7700, 9300, 10900],
    },
    {
      id: "doram",
      place: "jeongseon",
      strip: { off: [620, 687], on: [620, 690] },
      slot: 803.5,
      song: S.exp2Jeongseon,
      lyrics: "*아리랑 *고개로 *나를 *넘겨*주게",
      hits: [4500, 6100, 7700, 9300, 10900],
    },
    {
      id: "chandol",
      place: "miryang",
      strip: { off: [1304, 617], on: [1306, 614] },
      slot: 1451.5,
      song: S.exp2Miryang,
      lyrics: "*아리 아리랑 *쓰리 쓰리랑 *아라리가 났네\n*아리랑 *고개로 *넘어간다",
      hits: [4500, 6100, 7700, 9300, 10900, 12500],
    },
  ];

  const IMG = "img/04_exp2/";
  const pct = (px, of = 1920) => (px / of) * 100 + "%";
  const $scene = $("#scene");
  const $moon = $("#btnMoon");
  const $rings = $("#rings");
  const $callText = $("#callText");
  const $board = $("#board");
  const $lyrics = $("#lyrics");
  const TAP_LOG = new URLSearchParams(location.search).has("tap");

  /* ----- 세 고장 DOM 생성 ------------------------------------------------- */
  REGIONS.forEach(function (r) {
    const [ol, ow] = r.strip.off;
    const [nl, nw] = r.strip.on;
    r.$el = $(
      `<div class="region" id="region-${r.id}">` +
        `<img class="strip" src="${IMG}bg_${r.place}_off.png" alt="" style="left:${pct(ol)};width:${pct(ow)}" />` +
        `<img class="strip on-img" src="${IMG}bg_${r.place}_on.png" alt="" style="left:${pct(nl)};width:${pct(nw)}" />` +
        `<div class="full" style="--l:${pct(ol)};--r:${pct(1920 - ol - ow)}">` +
        `<img class="full-off" src="${IMG}f_${r.place}_off.png" alt="" />` +
        `<img class="full-on" src="${IMG}f_${r.place}_on.png" alt="" />` +
        "</div>" +
        `<button class="e2-char" disabled aria-label="${r.id}" style="left:${pct(r.slot)}">` +
        `<img class="pose-btn" src="${IMG}${r.id}_btn.png" alt="" />` +
        `<img class="pose-sing" src="${IMG}${r.id}_sing.png" alt="" />` +
        "</button>" +
        "</div>"
    ).appendTo($scene);
    r.$char = r.$el.find(".e2-char");
    r.$full = r.$el.find(".full");
    r.$fullOn = r.$el.find(".full-on");
    r.$char.on("click", () => select(r));
  });

  /* ----- 진행 ------------------------------------------------------------- */
  let token = 0; // [다시하기]/이탈 시 올려서 이전 흐름의 지연 콜백을 무효화
  let timers = [];
  let song = null; // { r, t0, audio, judged[] }

  const later = (ms, fn) => {
    const my = token;
    timers.push(setTimeout(() => my === token && fn(), ms));
  };

  function stopSong() {
    if (song?.audio) song.audio.pause();
    song = null;
  }

  function reveal(r, k) {
    r.$fullOn[0].style.setProperty("--rv", REVEAL_MAX * k + "%");
  }

  function setChoosable(on) {
    REGIONS.forEach((r) => r.$char.prop("disabled", !on || r.$el.hasClass("done")));
  }

  function reset() {
    token++;
    timers.forEach(clearTimeout);
    timers = [];
    stopSong();
    AR.Sound.stopNarration();
    $scene.removeClass("playing");
    REGIONS.forEach(function (r) {
      r.$el.removeClass("active done");
      r.$full.removeClass("open");
      r.$char.removeClass("singing").css("left", pct(r.slot));
      reveal(r, 0);
    });
    $moon.removeClass("on");
    $rings.empty();
    $callText.removeClass("on");
    $board.removeClass("on");
    AR.closePopup("#successDim");
  }

  // 선택 화면 — 다온N_02 가 끝나야 고를 수 있다(기획 p22-3)
  function startPlay() {
    reset();
    setChoosable(false);
    const my = token;
    AR.Sound.narrate(S.daon02, { onEnd: () => my === token && setChoosable(true) });
  }

  function select(r) {
    if (song) return;
    AR.Sound.stopNarration();
    setChoosable(false);
    $scene.addClass("playing");
    r.$el.addClass("active");
    r.$char.css("left", pct(SLOT_PLAY));
    r.$full[0].offsetWidth; // 띠 폭에서 시작하도록 한 번 그린 뒤 펼친다
    r.$full.addClass("open");
    later(OPEN_MS, () => {
      $moon.addClass("on");
      sing(r);
    });
  }

  // 가사 글자마다 span, 터치 글자는 .tgt — 반환: 터치 글자 span 배열
  function buildLyrics(text) {
    $lyrics.empty();
    const tgts = [];
    let mark = false;
    for (const ch of text) {
      if (ch === "*") {
        mark = true;
        continue;
      }
      if (ch === "\n") {
        $lyrics.append("<br>");
        continue;
      }
      const $s = $("<span>").text(ch).appendTo($lyrics);
      if (mark) tgts.push($s.addClass("tgt"));
      mark = false;
    }
    return tgts;
  }

  function sing(r) {
    const tgts = buildLyrics(r.lyrics);
    const $spans = $lyrics.children("span");
    r.$char.addClass("singing");
    $callText.attr("src", `${IMG}${r.id}_text.png`).addClass("on");
    $board.addClass("on");

    // 음원 — 없거나(404) 막혀도 가짜 타이밍으로 끝까지 진행한다
    const audio = new Audio(r.song);
    audio.volume = MUSIC_VOL;
    // ponytail: 판정·연출 모두 벽시계(performance.now) 기준. 음원 시작 지연이 문제되면 audio.currentTime 으로 동기화.
    // me — 이 회차의 노래. 이전 회차의 지연 콜백(SONG_MAX_MS 안전 타이머 등)이 같은 캐릭터의 새 회차를 끝내지 않도록 비교용
    const me = (song = { r, t0: performance.now(), audio, tgts, hits: 0, judged: r.hits.map(() => false) });
    let audioDone = false;
    let timeDone = false;
    const maybeEnd = () => audioDone && timeDone && finishRegion(me);
    const endAudio = () => {
      audioDone = true;
      maybeEnd();
    };
    audio.addEventListener("ended", endAudio);
    audio.addEventListener("error", endAudio);
    audio.play()?.catch(endAudio);

    const first = r.hits[0] - LEAD_MS;
    later(first, () => $callText.removeClass("on")); // 메기는 소리 끝 → 받는 소리

    r.hits.forEach(function (t, i) {
      let $ring;
      later(t - LEAD_MS, () => {
        tgts[i].addClass("cue");
        $ring = $('<div class="ring">').css("--lead", LEAD_MS + "ms").appendTo($rings);
      });
      later(t + HIT_MS, () => {
        me.judged[i] = true;
        $ring.addClass("out");
        setTimeout(() => $ring.remove(), 300);
      });
    });

    // 노래방처럼 한 글자씩 — 터치 글자는 목표 시각에, 사이 글자는 두 목표 시각 사이를 고르게 나눠 채운다.
    // 마지막 터치 글자 뒤는 앞 구간의 글자당 평균 속도로(TAIL_MS 안에 끝나게).
    const idx = tgts.map(($t) => $spans.index($t));
    const perChar = (r.hits.at(-1) - r.hits[0]) / Math.max(1, idx.at(-1) - idx[0]);
    const tailStep = Math.min(perChar, (TAIL_MS - 200) / Math.max(1, $spans.length - 1 - idx.at(-1)));
    $spans.each(function (k) {
      let a = idx.findLastIndex((x) => x <= k);
      if (a < 0) a = 0; // 첫 터치 글자 앞 글자(현재 가사엔 없음)
      const t =
        a + 1 < idx.length
          ? r.hits[a] + ((k - idx[a]) / (idx[a + 1] - idx[a])) * (r.hits[a + 1] - r.hits[a])
          : r.hits[a] + Math.max(0, k - idx[a]) * tailStep;
      later(t, () => $(this).addClass("sung"));
    });

    later(r.hits.at(-1) + TAIL_MS, () => {
      $spans.addClass("sung");
      timeDone = true;
      maybeEnd();
    });
    later(SONG_MAX_MS, endAudio);
  }

  // 달 누르기 — 달무리가 떠 있는(목표 LEAD_MS 전부터) 아직 판정 안 된 첫 터치 글자를 판정한다.
  // ±HIT_MS 안이면 성공, 그보다 이르면 그 글자는 놓침(연타로 전부 맞히는 것 방지). 달무리가 없을 때 누르면 무시.
  $moon.on("pointerdown", function (e) {
    e.preventDefault();
    if (!song) return;
    const t = performance.now() - song.t0;
    if (TAP_LOG) console.log(`[tap] ${song.r.id} ${Math.round(t)}ms`);
    const i = song.r.hits.findIndex((h, j) => !song.judged[j] && t >= h - LEAD_MS && t <= h + HIT_MS);
    if (i < 0) return;
    song.judged[i] = true;
    if (t < song.r.hits[i] - HIT_MS) return; // 너무 일찍 누름 → 놓침
    song.hits++;
    const $t = song.tgts[i].addClass("hit");
    setTimeout(() => $t.removeClass("hit"), 600);
    $("#moonEffect").removeClass("pop")[0].offsetWidth;
    $("#moonEffect").addClass("pop");
    reveal(song.r, song.hits / song.r.hits.length);
  });

  function finishRegion(me) {
    if (song !== me) return;
    const { r } = me;
    const ok = song.hits >= Math.ceil(r.hits.length * PASS_RATIO);
    stopSong();
    reveal(r, ok ? 1 : 0); // 실패면 번진 컬러를 거둬 흑백으로
    later(DONE_WAIT_MS, () => {
      $moon.removeClass("on");
      $rings.empty();
      $callText.removeClass("on");
      $board.removeClass("on");
      r.$char.removeClass("singing").css("left", pct(r.slot));
      r.$el.toggleClass("done", ok);
      r.$full.removeClass("open");
      $scene.removeClass("playing");
      later(800, () => {
        r.$el.removeClass("active");
        if (REGIONS.every((x) => x.$el.hasClass("done"))) later(ALL_DONE_WAIT_MS, success);
        else setChoosable(true);
      });
    });
  }

  function success() {
    AR.openPopup("#successDim");
    AR.Sound.sfx(S.ceremony);
    later(SUCCESS_MS, () => {
      AR.closePopup("#successDim");
      AR.openPopup("#finishDim");
      AR.Sound.narrate(S.daon03);
    });
  }

  /* ----- 안내 → 선택 -------------------------------------------------------- */
  // 안내 화면은 진입 즉시 떠 있다(HTML 에 .flex). 자동재생이 막히면 첫 터치에서 다시 시도.
  const vo = AR.Sound.narrate(S.daon01);
  if (vo) {
    $(document).one("pointerdown", function () {
      if (vo.paused && vo.currentTime === 0 && $("#guideDim").hasClass("flex")) AR.Sound.narrate(S.daon01);
    });
  }

  $("#btnGuidePlay").on("click", function () {
    AR.closePopup("#guideDim");
    startPlay();
  });

  /* ----- 종료 팝업 / 상단바 ------------------------------------------------- */
  // [다시하기] — 기획 p39 "활동2-체험" / "활동2-준비" 두 가지. 활동1 과 같이 체험(선택 화면)으로 바로.
  $("#btnRetry").on("click", function () {
    AR.closePopup("#finishDim");
    startPlay();
  });
  $("#btnMore").on("click", function () {
    AR.go("info2.html");
  });
  $("#btnExit, #btnBack, #btnHome").on("click", function () {
    AR.go("main.html");
  });

  /* ----- 프리로드 ----------------------------------------------------------- */
  AR.preload(
    [
      "title_exp2.png",
      "exp2_tutorial.png",
      "btn_moon.png",
      "moon_effect.png",
      "bord.png",
      "end_success.png",
      "end_text.png",
      "end_main.png",
    ]
      .concat(
        REGIONS.flatMap((r) => [
          `bg_${r.place}_off.png`,
          `bg_${r.place}_on.png`,
          `f_${r.place}_off.png`,
          `f_${r.place}_on.png`,
          `${r.id}_btn.png`,
          `${r.id}_sing.png`,
          `${r.id}_text.png`,
        ])
      )
      .map((f) => IMG + f)
      .concat("img/03_exp1/end_bg.png")
  );
  AR.Sound.prime([S.daon01, S.daon02, S.daon03, S.ceremony]);
});
