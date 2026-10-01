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

   sy(가사 글자별 시각)·end(가사 끝)는 음원 실측값(2026-10-02, 보컬 분리 → 강제 정렬(MMS) + 음높이·장단 박 대조).
   터치 시각(hits)은 sy 중 터치 글자 것. 다시 맞출 땐 URL 에 ?tap 을 붙여 노래에 맞춰 달을 두드리면
   콘솔에 시각(ms)이 찍힌다.
   ========================================================================= */
$(function () {
  const S = window.AR5_SFX;

  const LEAD_MS = 1200; // 달무리가 나타나서 달 크기로 줄어들기까지
  const HIT_MS = 300; // 목표 시각 앞뒤로 이만큼 안에 누르면 성공
  const CUE_MS = 300; // 터치 글자가 주황으로 켜지는 시각 = 목표 이만큼 전(달무리가 달과 겹치기 직전)
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
  // sy = 가사 글자(공백·줄바꿈·'*' 제외)마다 그 글자를 부르기 시작하는 시각(음원 시작 기준 초), end = 가사 끝(ms).
  // 앞부분(메기는 소리) 동안은 말풍선만 보인다.
  const REGIONS = [
    {
      id: "daon",
      place: "jindo",
      strip: { off: [0, 621], on: [0, 621] },
      slot: 177.5,
      song: S.exp2Jindo,
      lyrics: "*아리아리랑 *쓰리쓰리랑\n*아라리가 났네 *아리랑 음- *아라리가 났네",
      // 메기는 소리 0~15.1초. 둘째 줄 '아리랑'은 작게 시작해 '랑'(24.0)에서 커진다. '음-' = 응 응
      sy: [
        [15.13, 15.35, 15.65, 15.95, 16.35], [17.1, 17.32, 17.62, 17.95, 18.26], // 아리아리랑 쓰리쓰리랑
        [18.96, 19.18, 19.55, 19.8, 20.22, 20.9], [22.85, 23.45, 24.0], [24.69, 25.21], // 아라리가 났네 아리랑 음-
        [26.5, 26.9, 27.2, 27.45, 28.35, 28.95], // 아라리가 났네
      ],
      end: 30000,
    },
    {
      id: "doram",
      place: "jeongseon",
      strip: { off: [620, 687], on: [620, 690] },
      slot: 803.5,
      song: S.exp2Jeongseon,
      lyrics: "*아리랑 *고개로 *나를 *넘겨*주게",
      // 앞 "아리랑 아리랑 아라리요" 0~11.4초
      sy: [[11.5, 12.36, 12.95], [14.2, 15.35, 16.08], [17.0, 17.41], [18.01, 18.6, 19.15, 19.93]], // 아리랑 고개로 나를 넘겨주게
      end: 22200,
    },
    {
      id: "chandol",
      place: "miryang",
      strip: { off: [1304, 617], on: [1306, 614] },
      slot: 1451.5,
      song: S.exp2Miryang,
      lyrics: "*아리 아리랑 *쓰리 쓰리랑 *아라리가 났네\n*아리랑 *고개로 *넘어간다",
      // 메기는 소리 "날 좀 보소" 0~15.9초
      sy: [
        [16.14, 16.52], [16.82, 17.18, 17.42], [18.06, 18.52], [18.66, 19.2, 19.42], // 아리 아리랑 쓰리 쓰리랑
        [20.13, 20.31, 20.79, 21.21], [21.45, 21.93], // 아라리가 났네
        [24.17, 24.77, 25.21], [26.11, 26.75, 27.41], [28.06, 28.84, 29.44, 30.1], // 아리랑 고개로 넘어간다
      ],
      end: 31400,
    },
  ];

  // 가사 → 글자 목록 [{ ch, tgt, t(ms) }]. 공백은 바로 앞 글자 시각(보이지 않으니 무관)
  REGIONS.forEach(function (r) {
    const sy = r.sy.flat().map((v) => Math.round(v * 1000));
    let k = 0;
    let mark = false;
    r.chars = [];
    for (const ch of r.lyrics) {
      if (ch === "*") mark = true;
      else if (ch === "\n") r.chars.push({ br: true });
      else if (ch === " ") r.chars.push({ ch, t: sy[k - 1] ?? sy[0] });
      else r.chars.push({ ch, tgt: mark, t: sy[k++] }), (mark = false);
    }
    if (k !== sy.length) console.warn(`[exp2] ${r.id} 가사 글자 ${k}개 ≠ 시각 ${sy.length}개`);
    r.hits = r.chars.filter((c) => c.tgt).map((c) => c.t);
  });

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
        "</div>",
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
    AR.Sound.narrate(S.daon02, {
      onEnd: () => my === token && setChoosable(true),
    });
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

  // 가사 글자마다 span(시각은 data), 터치 글자는 .tgt — 반환: 터치 글자 span 배열
  function buildLyrics(r) {
    $lyrics.empty();
    const tgts = [];
    r.chars.forEach(function (c) {
      if (c.br) return void $lyrics.append("<br>");
      const $s = $("<span>").text(c.ch).data("t", c.t).appendTo($lyrics);
      if (c.tgt) tgts.push($s.addClass("tgt"));
    });
    return tgts;
  }

  function sing(r) {
    const tgts = buildLyrics(r);
    const $spans = $lyrics.children("span");
    r.$char.addClass("singing");
    $callText.attr("src", `${IMG}${r.id}_text.png`).addClass("on");
    $board.addClass("on");

    const audio = new Audio(r.song);
    audio.volume = MUSIC_VOL;
    // 판정·연출 시계 = 음원 재생 위치(audio.currentTime). 벽시계로 재면 실제 소리가 나오기까지의 지연(약 0.2초)만큼
    // 화면이 앞서고 버퍼링에도 밀린다. 음원이 없거나 막히면 벽시계(t0 부터)로 대신한다.
    // me — 이 회차의 노래. 이전 회차의 지연 콜백(SONG_MAX_MS 안전 타이머 등)이 같은 캐릭터의 새 회차를 끝내지 않도록 비교용
    const me = (song = { r, t0: null, audio, noAudio: false, tgts, hits: 0, judged: r.hits.map(() => false) });
    me.now = () => (me.noAudio ? performance.now() - me.t0 : audio.currentTime * 1000);
    let audioDone = false;
    let timeDone = false;
    const maybeEnd = () => audioDone && timeDone && finishRegion(me);
    const endAudio = () => {
      audioDone = true;
      maybeEnd();
    };
    // 음원이 없거나(404) 막혀도 타임라인은 시작해 끝까지 진행한다
    const start = () => {
      if (me.t0 !== null || song !== me) return;
      me.t0 = performance.now();
      timeline();
      run();
    };
    const fail = () => {
      me.noAudio = true;
      endAudio();
      start();
    };
    audio.addEventListener("playing", start);
    audio.addEventListener("ended", endAudio);
    audio.addEventListener("error", fail);
    audio.play()?.catch(fail);
    later(SONG_MAX_MS, endAudio);

    // 시각(ms) 순 일정표 — 매 프레임 시계를 보고 지난 것을 실행한다
    const queue = [];
    const at = (t, fn) => queue.push({ t, fn });
    function run() {
      if (song !== me) return;
      const now = me.now();
      while (queue.length && queue[0].t <= now) queue.shift().fn();
      if (queue.length) requestAnimationFrame(run);
    }

    function timeline() {
      const first = r.hits[0] - LEAD_MS;
      at(first, () => $callText.removeClass("on")); // 메기는 소리 끝 → 받는 소리

      r.hits.forEach(function (t, i) {
        let $ring;
        at(t - CUE_MS, () => tgts[i].addClass("cue"));
        at(t - LEAD_MS, () => {
          $ring = $('<div class="ring">').css("--lead", LEAD_MS + "ms").appendTo($rings);
        });
        at(t + HIT_MS, () => {
          me.judged[i] = true;
          $ring.addClass("out");
          setTimeout(() => $ring.remove(), 300);
        });
      });

      // 노래방처럼 한 글자씩 — 글자마다 그 글자를 부르기 시작하는 시각(sy)에 채운다
      $spans.each(function () {
        at($(this).data("t"), () => $(this).addClass("sung"));
      });

      at(r.end, () => {
        $spans.addClass("sung");
        timeDone = true;
        maybeEnd();
      });
      queue.sort((a, b) => a.t - b.t);
    }
  }

  // 달 누르기 — 달무리가 떠 있는(목표 LEAD_MS 전부터) 아직 판정 안 된 첫 터치 글자를 판정한다.
  // ±HIT_MS 안이면 성공, 그보다 이르면 그 글자는 놓침(연타로 전부 맞히는 것 방지). 달무리가 없을 때 누르면 무시.
  $moon.on("pointerdown", function (e) {
    e.preventDefault();
    if (song?.t0 == null) return;
    const t = song.now();
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
  // 정보2 에서 [뒤로] 로 돌아오면(?done) 세 고장 완료 + 종료 화면 그대로 — [다시하기] 로 다시 할 수 있게
  const DONE = new URLSearchParams(location.search).has("done");
  if (DONE) {
    history.replaceState(null, "", location.pathname); // 새로고침하면 처음부터
    AR.closePopup("#guideDim");
    REGIONS.forEach((r) => r.$el.addClass("done"));
    AR.openPopup("#finishDim");
  }

  // 안내 화면은 진입 즉시 떠 있다(HTML 에 .flex). 자동재생이 막히면 첫 터치에서 다시 시도.
  const vo = DONE ? null : AR.Sound.narrate(S.daon01);
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
    ["title_exp2.png", "exp2_tutorial.png", "btn_moon.png", "moon_effect.png", "bord.png", "end_success.png", "end_text.png", "end_main.png"]
      .concat(
        REGIONS.flatMap((r) => [
          `bg_${r.place}_off.png`,
          `bg_${r.place}_on.png`,
          `f_${r.place}_off.png`,
          `f_${r.place}_on.png`,
          `${r.id}_btn.png`,
          `${r.id}_sing.png`,
          `${r.id}_text.png`,
        ]),
      )
      .map((f) => IMG + f)
      .concat("img/03_exp1/end_bg.png"),
  );
  AR.Sound.prime([S.daon01, S.daon02, S.daon03, S.ceremony]);
});
