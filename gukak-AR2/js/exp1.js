/* =========================================================================
   활동1 — 나라를 지킬 만파식적을 만들자! (exp1.html)  기획서 p8~18

   준비(화면 터치) → 안내(체험 방법) → 플레이 → 종료

   플레이 순서(기획 p12~17, Mission 5종 / 클릭 11회)
     ① 취구      → 송곳 액팅 → 구멍 → [취구] 텍스트 + 내레이션
     ② 청공      → 〃 [청공]
     ③ 지공 6개  → 오른쪽부터 차례로. 여섯 번째에 [지공] 텍스트 + 대금 음 6개
     ④ 칠성공    → [칠성공] + 송곳 사라짐
     ⑤ 나무 그릇 → 갈대청이 커서를 따라옴 + [갈대청]
        청공     → 갈대청이 청공에 붙고 청이 울리는 대금 소리 → 완성

   좌표: 목업(1920×1080) 실측. 구멍 세로 중심은 전부 59.03%.
   ========================================================================= */
$(function () {
  const S = window.AR2_SFX;

  /* ----- 구멍 정의 (cx = 가로 중심 %, type = 에셋 종류 1/2/3) ----------- */
  const CY = 59.03; // 구멍 세로 중심(%)
  const H = {
    chwigu: { id: "chwigu", type: 3, cx: 85.312, label: "취구", vo: "n06" },
    cheonggong: { id: "cheonggong", type: 2, cx: 70.495, label: "청공", vo: "n07" },
    // 지공 6개 — 취구에 가까운(오른쪽) 것부터
    ji1: { id: "ji1", type: 1, cx: 55.677 },
    ji2: { id: "ji2", type: 1, cx: 49.323 },
    ji3: { id: "ji3", type: 1, cx: 43.021 },
    ji4: { id: "ji4", type: 1, cx: 35.365 },
    ji5: { id: "ji5", type: 1, cx: 29.74 },
    ji6: { id: "ji6", type: 1, cx: 22.135, label: "지공", vo: "n08", extraSfx: "sixNotes" },
    // 칠성공 — 목업의 대금에는 작은 구멍이 7개(지공 6 + 칠성공 1)뿐이라 1개로 구현한다.
    //   (기획서 본문에는 "칠성공 1개"와 "두번째 칠성"이 함께 적혀 있어 목업을 따랐다)
    chilseonggong: { id: "chilseonggong", type: 1, cx: 12.604, label: "칠성공", vo: "n09", lastDrill: true },
  };
  const ORDER = ["chwigu", "cheonggong", "ji1", "ji2", "ji3", "ji4", "ji5", "ji6", "chilseonggong"];

  const BOWL = { cx: 18.5, cy: 36.5 }; // 나무 그릇 중심(배경 그림 기준)
  const DRILL_DOWN_MS = 260; // 송곳이 구멍에 닿는 시점(전체 액팅 0.5s)

  /* ----- 구멍 DOM 생성 -------------------------------------------------- */
  const $holes = $("#holes");
  ORDER.forEach(function (key) {
    const h = H[key];
    $holes.append(
      '<button class="hole hole-t' + h.type + '" id="hole-' + h.id + '" style="left:' + h.cx + '%"' +
        ' aria-label="' + (h.label || "지공") + '">' +
        '<img class="hole-line" src="img/03_exp1/line_hole' + h.type + '.png" alt="" />' +
        '<img class="hole-open" src="img/03_exp1/hole' + h.type + '.png" alt="" />' +
        "</button>"
    );
  });

  /* ----- 스텝 정의 ------------------------------------------------------ */
  const STEPS = ORDER.map(function (key) {
    return { kind: "hole", hole: H[key], el: "#hole-" + H[key].id };
  }).concat([
    { kind: "bowl", el: "#bowlHit" },
    { kind: "attach", el: "#hole-cheonggong" },
  ]);

  /* ----- 화면 요소 ------------------------------------------------------ */
  const $drill = $("#drill");
  const $fx = $("#fx");
  const $arrow = $("#arrow");
  const $reed = $("#reed");
  const $name = $("#partName");
  const $container = $(".container");

  let reedFollow = false;

  function clearHints() {
    $fx.removeClass("on");
    $arrow.removeClass("on point-left").css("left", "");
    $(".hole").removeClass("active");
    $("#bowlHit").removeClass("active");
  }

  function showName(text) {
    $name.text(text).removeClass("show");
    // 애니메이션 재시작을 위해 리플로우 한 번
    void $name[0].offsetWidth;
    $name.addClass("show");
  }

  function pointAt(cx) {
    $fx.css("left", cx + "%").addClass("on");
    $arrow.css("left", cx + "%").addClass("on");
  }

  /* ----- 스텝 머신 ------------------------------------------------------ */
  const runner = AR.steps(STEPS, {
    onEnter: function (step) {
      clearHints();
      if (step.kind === "hole") {
        $("#hole-" + step.hole.id).addClass("active");
        $drill.css("left", step.hole.cx + "%");
        pointAt(step.hole.cx);
      } else if (step.kind === "bowl") {
        // 칠성공까지 끝나 송곳은 사라진 상태. 나무 그릇 옆 화살표로 안내.
        $("#bowlHit").addClass("active");
        $arrow.addClass("on point-left");
      } else if (step.kind === "attach") {
        $("#hole-cheonggong").addClass("active");
        pointAt(H.cheonggong.cx);
      }
    },

    onHit: function (step, i, next) {
      clearHints();

      if (step.kind === "hole") {
        const h = step.hole;
        AR.Sound.sfx(S.drill); // 대나무 가공음
        $drill.addClass("drilling");
        setTimeout(function () {
          $("#hole-" + h.id).addClass("open");
          if (h.lastDrill) $drill.addClass("hide"); // 칠성공 뒤 송곳 사라짐
          if (h.label) {
            showName(h.label);
            AR.Sound.narrate(S[h.vo]);
          }
          if (h.extraSfx) AR.Sound.sfx(S[h.extraSfx]);
          setTimeout(function () {
            $drill.removeClass("drilling");
            next();
          }, h.label ? 1500 : 260);
        }, DRILL_DOWN_MS);
        return;
      }

      if (step.kind === "bowl") {
        // 갈대청을 집어 커서에 붙인다.
        showName("갈대청");
        AR.Sound.narrate(S.n10);
        reedFollow = true;
        $reed.removeClass("attached").addClass("on").css({ left: BOWL.cx + "%", top: BOWL.cy + "%" });
        next();
        return;
      }

      if (step.kind === "attach") {
        reedFollow = false;
        $reed.addClass("attached").css({ left: H.cheonggong.cx + "%", top: CY + "%" });
        AR.Sound.sfx(S.cheong); // 청을 울리는 대금 소리
        setTimeout(next, 900);
      }
    },

    onDone: function () {
      // 모든 부위 완성 → 대금 가락이 울린 뒤 종료 팝업
      setTimeout(function () {
        AR.Sound.sfxThen(S.melody, function () {
          AR.openPopup("#finishDim");
        }, { maxWaitMs: 3500 });
      }, 500);
    },
  });

  /* ----- 갈대청 커서 추종 ------------------------------------------------ */
  $container.on("pointermove", function (e) {
    if (!reedFollow) return;
    const r = this.getBoundingClientRect();
    $reed.css({
      left: ((e.clientX - r.left) / r.width) * 100 + "%",
      top: ((e.clientY - r.top) / r.height) * 100 + "%",
    });
  });

  /* ----- 준비 → 안내 → 플레이 ------------------------------------------- */
  function startPlay() {
    $("#stage").addClass("on");
    reedFollow = false;
    $reed.removeClass("on attached");
    $drill.removeClass("hide drilling");
    $(".hole").removeClass("open active");
    $name.removeClass("show").text("");
    runner.start();
  }

  $("#readyDim").on("click", function () {
    AR.closePopup("#readyDim");
    AR.openPopup("#guideDim");
    AR.Sound.narrate(S.n05);
  });

  // ?success=1 — 준비/안내를 건너뛰고 완료 화면 바로 보기([더 알아보기] 뒤로가기 복귀)
  if (new URLSearchParams(location.search).get("success") === "1") {
    AR.closePopup("#readyDim");
    AR.openPopup("#finishDim");
  }

  $("#btnGuidePlay").on("click", function () {
    AR.closePopup("#guideDim");
    AR.Sound.stopNarration();
    startPlay();
  });

  /* ----- 종료 팝업 / 상단바 --------------------------------------------- */
  $("#btnRetry").on("click", function () {
    AR.closePopup("#finishDim");
    startPlay();
  });
  $("#btnMore").on("click", function () {
    AR.go("info.html?from=exp1");
  });
  $("#btnExit").on("click", function () {
    AR.go("main.html");
  });
  $("#btnBack").on("click", function () {
    AR.go("main.html");
  });
  // [홈] 은 타이틀(index)이 아니라 MAIN 으로 — 활동 선택 화면이 이 콘텐츠의 홈이다.
  $("#btnHome").on("click", function () {
    AR.go("main.html");
  });

  /* ----- 프리로드 -------------------------------------------------------- */
  AR.preload([
    "img/03_exp1/bg_exp1.png",
    "img/03_exp1/daegeum.png",
    "img/03_exp1/drill.png",
    "img/03_exp1/arrow.png",
    "img/03_exp1/hole_effect.png",
    "img/03_exp1/reed_membrane.png",
    "img/03_exp1/line_hole1.png",
    "img/03_exp1/line_hole2.png",
    "img/03_exp1/line_hole3.png",
    "img/03_exp1/hole1.png",
    "img/03_exp1/hole2.png",
    "img/03_exp1/hole3.png",
    "img/03_exp1/exp1_tutorial.png",
    "img/03_exp1/title_exp1.png",
  ]);
  AR.Sound.prime([S.drill, S.n05, S.n06, S.n07, S.n08, S.n09, S.n10, S.cheong, S.melody, S.sixNotes]);
});
