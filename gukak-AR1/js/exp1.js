/* =========================================================================
   활동1 — 정간보의 빈 곳을 채워보자 (exp1.html)  기획서 p6~11

   안내(체험 방법) → 플레이(7문항) → 종료

   플레이 — 문항마다 같은 흐름을 되풀이한다(정답 순서·보기 배치는 기획 p10 표)
     ① 채울 칸 강조 + 상단 [정답 이미지·이름·설명] + 오른쪽 보기 3개
     ② 이름 → 설명 내레이션(재생 중엔 보기를 누를 수 없다)
     ③ 정답 → 효과음 + 칸에 음표가 채워지고 다음 칸으로 / 오답 → 효과음 + 보기 흔들림(다시 고를 수 있다)
   7칸을 다 채우면 세레머니 → 종료(이전 화면 딤드 + 완성 정간보 + [듣기])

   좌표: 목업(1920×1080) 실측, 디자인 px 로 적고 at() 이 %로 바꾼다.
   ========================================================================= */
$(function () {
  const S = window.AR1_SFX;
  const N = window.AR1_N;
  const IMG = "img/03_exp1/";

  const NEXT_MS = 900; // 정답 → 다음 문항
  const FINISH_MS = 900; // 마지막 정답 → 세레머니·종료 화면
  const NOTE = 142; // 칸에 채우는 음표 크기(목업 p8: 원본 178 의 0.8배)
  const HL = 222; // 칸 강조 이미지 크기(원본 그대로)
  const CHOICE_X = 1556; // 보기 3개 좌상단 x / y (원본 크기 179×178)
  const CHOICE_Y = [388, 588, 788];

  // 정간보 칸 중심(panel_score_question 격자선 실측). 열은 왼쪽부터, 행은 위부터.
  const COL = [649, 827, 1014, 1195];
  const ROW = [523, 656, 786, 916];
  const BREATH = [1297, 716]; // 오른쪽 좁은 칸의 숨표 자리

  // 문항 — note 는 img/03_exp1/btn_note_<note>.png (숨표 '<' 파일이 rest, '>' 가 chevron_right)
  // ★ 문제판(panel_score_question) 실루엣 기준 — 3번째 열 위 황태중, 2번째 열 위 황태.
  //   p9 칸 순서(오른쪽부터)대로 ④ 황태중(3소박) → ⑤ 황태(2소박)(사용자 요청, p10 표의 4·5번과 순서가 바뀜).
  //   완성 이미지(image_score_complete)는 반대 배치라 종료 화면에선 두 칸이 바뀌어 보인다 — PD 문의 중.
  const STEPS = [
    { note: "hwang", cell: [COL[3], ROW[0]], name: "한 정간", desc: "황을 한 박만큼 소리내요.", vo: [2, 3], choices: ["hwang", "jung_im_nam_hwang", "horizontal_line"] },
    { note: "rest", cell: BREATH, name: "숨표", desc: "연주하다가 숨을 쉬어요.", vo: [4, 5], choices: ["hwang_tae", "rest", "chevron_right"] },
    { note: "triangle_up", cell: [COL[3], ROW[3]], name: "쉼표", desc: "연주를 쉬어요.", vo: [6, 7], choices: ["triangle_up", "horizontal_line", "hwang"] },
    { note: "hwang_tae_jung", cell: [COL[2], ROW[0]], name: "3소박", desc: "한 박을 셋으로 나누어, 황·태·중을 소리내요.", vo: [10, 11], choices: ["hwang_tae_jung", "hwang", "rest"] },
    { note: "hwang_tae", cell: [COL[1], ROW[0]], name: "2소박", desc: "한 박을 둘로 나누어, 황과 태를 소리내요.", vo: [8, 9], choices: ["jung_im_nam_hwang", "triangle_up", "hwang_tae"] },
    { note: "jung_im_nam_hwang", cell: [COL[1], ROW[2]], name: "4소박", desc: "한 박을 넷으로 나누어, 중·임·남·황을 소리내요.", vo: [12, 13], choices: ["triangle_down", "hwang_tae", "jung_im_nam_hwang"] },
    { note: "horizontal_line", cell: [COL[0], ROW[3]], name: "마침표", desc: "음악이 끝났다고 알려줘요.", vo: [14, 15], choices: ["rest", "horizontal_line", "hwang_tae_jung"] },
  ];
  const vo = (n) => N("duri_exp1_" + String(n).padStart(2, "0"));
  const noteSrc = (id) => `${IMG}btn_note_${id}.png`;
  const ALT = {
    hwang: "황",
    hwang_tae: "황 태",
    hwang_tae_jung: "황 태 중",
    jung_im_nam_hwang: "중 임 남 황",
    rest: "숨표",
    chevron_right: "꺾쇠",
    triangle_up: "쉼표",
    triangle_down: "역삼각형",
    horizontal_line: "마침표",
  };

  const pct = (px, of) => (px / of) * 100 + "%";
  // 중심 (cx, cy) 에 size 정사각형
  const at = (cx, cy, size) => ({ left: pct(cx - size / 2, 1920), top: pct(cy - size / 2, 1080) });

  const $hl = $("#cellHl");
  const $notes = $("#notes");
  const $choices = $("#choices");

  /* ----- 보기 버튼 3개(이미지만 문항마다 바꾼다) ---------------------------- */
  const $btns = CHOICE_Y.map((y, i) =>
    $(`<button class="choice" data-i="${i}"><img src="" alt="" /></button>`)
      .css({ top: pct(y, 1080) })
      .appendTo($choices)
  );

  /* ----- 진행 ------------------------------------------------------------- */
  let idx = 0;
  let token = 0; // [다시하기]/이탈 시 올려서 이전 흐름의 지연 콜백을 무효화

  function lock(on) {
    $choices.toggleClass("lock", on);
  }

  function reset() {
    token++;
    AR.Sound.stopNarration();
    Melody.stop();
    $notes.empty();
    $hl.removeClass("on");
    lock(true);
  }

  function startPlay() {
    reset();
    $("#stage, .duri").addClass("on");
    enter(0);
  }

  function enter(i) {
    const my = token;
    const s = STEPS[i];
    idx = i;
    lock(true);

    $hl.css(at(s.cell[0], s.cell[1], HL)).addClass("on");
    $("#hintIcon").attr({ src: noteSrc(s.note), alt: ALT[s.note] });
    $("#hintName").text(s.name);
    $("#hintDesc").text(s.desc);
    $btns.forEach(($b, k) => $b.find("img").attr({ src: noteSrc(s.choices[k]), alt: ALT[s.choices[k]] }));
    // 문항이 바뀌었음을 보이도록 안내·보기를 다시 띄운다
    $("#hint, .choice").removeClass("swap wrong");
    void $("#hint")[0].offsetWidth;
    $("#hint, .choice").addClass("swap");

    AR.Sound.narrate(vo(s.vo[0]), {
      onEnd() {
        if (my !== token) return;
        AR.Sound.narrate(vo(s.vo[1]), {
          onEnd() {
            if (my === token) lock(false);
          },
        });
      },
    });
  }

  $choices.on("click", ".choice", function () {
    const s = STEPS[idx];
    const pick = s.choices[$(this).data("i")];
    if (pick !== s.note) {
      AR.Sound.sfx(S.incorrect);
      const $b = $(this).removeClass("wrong");
      void this.offsetWidth;
      $b.addClass("wrong");
      return;
    }
    correct(s);
  });

  function correct(s) {
    const my = token;
    lock(true);
    AR.Sound.stopNarration();
    AR.Sound.sfx(S.correct);
    $hl.removeClass("on");
    $(`<img class="note-fill" src="${noteSrc(s.note)}" alt="${ALT[s.note]}" />`)
      .css(at(s.cell[0], s.cell[1], NOTE))
      .appendTo($notes);

    const last = idx + 1 >= STEPS.length;
    setTimeout(
      function () {
        if (my !== token) return;
        if (last) complete();
        else enter(idx + 1);
      },
      last ? FINISH_MS : NEXT_MS
    );
  }

  // 정간보 완성 — 세레머니(기획 p3 체험1-⑥) → 두리N_13
  function complete() {
    const my = token;
    openFinish();
    AR.Sound.sfxThen(S.ceremony, () => my === token && AR.Sound.narrate(S.exp1End));
  }

  function openFinish() {
    $("#stage").removeClass("on");
    $(".duri").addClass("on");
    AR.openPopup("#finishDim");
  }

  /* ----- [듣기] — 완성된 정간보 가야금 연주 -------------------------------- */
  const Melody = (() => {
    let a = null;
    const $btn = $("#btnListen");
    function stop() {
      if (a) {
        a.pause();
        a = null;
      }
      $btn.removeClass("playing");
    }
    function play() {
      stop();
      AR.Sound.stopNarration();
      a = new Audio(S.melody);
      const mine = a;
      const end = () => mine === a && stop();
      a.addEventListener("ended", end);
      a.addEventListener("error", end);
      a.play()?.catch(end);
      $btn.addClass("playing");
    }
    return { play, stop };
  })();

  $("#btnListen").on("click", () => Melody.play());

  /* ----- 안내 → 플레이 ------------------------------------------------------ */
  // 정보 화면에서 [뒤로] 로 돌아오면(?done) 완료 화면 그대로 — [다시하기] 로 다시 할 수 있게
  const DONE = new URLSearchParams(location.search).has("done");
  if (DONE) {
    history.replaceState(null, "", location.pathname); // 새로고침하면 처음부터
    AR.closePopup("#guideDim");
    openFinish();
  }

  // 안내 화면은 진입 즉시 떠 있다(HTML 에 .flex). 자동재생이 막히면 첫 터치에서 다시 시도.
  const guideVo = DONE ? null : AR.Sound.narrate(S.exp1Guide);
  if (guideVo) {
    $(document).one("pointerdown", function () {
      if (guideVo.paused && guideVo.currentTime === 0 && $("#guideDim").hasClass("flex")) AR.Sound.narrate(S.exp1Guide);
    });
  }

  $("#btnGuidePlay").on("click", function () {
    AR.closePopup("#guideDim");
    startPlay();
  });

  /* ----- 종료 팝업 / 상단바 ------------------------------------------------- */
  // [다시하기] → 활동1-플레이(기획 p11, 안내 생략)
  $("#btnRetry").on("click", function () {
    AR.closePopup("#finishDim");
    startPlay();
  });
  $("#btnMore").on("click", () => AR.go("info.html?from=exp1"));
  $("#btnExit").on("click", () => AR.go("main.html"));
  $("#btnBack").on("click", () => AR.go("main.html"));
  // [홈] 은 타이틀이 아니라 MAIN 으로 — 활동 선택 화면이 이 콘텐츠의 홈(AR2·AR5 와 동일)
  $("#btnHome").on("click", () => AR.go("main.html"));

  /* ----- 프리로드 ----------------------------------------------------------- */
  AR.preload(
    [
      "bg_exp1.png",
      "text_exp1.png",
      "popup_tutorial.png",
      "character_guide_with_speech.png",
      "panel_score_question.png",
      "panel_hint.png",
      "panel_choices.png",
      "effect_cell_highlight.png",
      "text_complete.png",
      "image_score_complete.png",
    ]
      .map((f) => IMG + f)
      .concat(Object.keys(ALT).map(noteSrc), "img/04_exp2/btn_listen.png")
  );
  AR.Sound.prime([S.exp1Guide, S.correct, S.incorrect, S.ceremony, S.exp1End, ...STEPS.flatMap((s) => s.vo.map(vo))]);
});
