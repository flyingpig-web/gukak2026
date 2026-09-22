/* =========================================================================
   활동1 — 나라를 지킬 만파식적을 만들자! (exp1.html)  기획서 p8~18

   안내(체험 방법) → 플레이 → 종료

   플레이 순서(기획 p12~17, Mission 5종 / 클릭 11회)
     ① 취구      → 송곳 액팅 → 구멍 → [취구] 텍스트 + 내레이션
     ② 청공      → 〃 [청공]
     ③ 지공 6개  → 오른쪽부터 차례로. 여섯 번째(마지막)에 [지공] 타이포 + 대금 음 6개
     ④ 칠성공 2개 → 오른쪽부터. 마지막(왼쪽 끝)에 [칠성공] + 송곳 사라짐
     ⑤ 나무 그릇 → 갈대청이 커서를 따라옴 + [갈대청]
        청공     → 세로였던 갈대청이 90° 회전하며 청공에 붙고 청이 울리는 소리
                 → 대금이 daegeum2(완성본)로 디졸브, 1초 뒤 종료 화면

   좌표: 목업(1920×1080) 실측. 구멍 세로 중심은 전부 59.03%.
   ========================================================================= */
$(function () {
  const S = window.AR2_SFX;

  /* ----- 구멍 정의 (cx = 가로 중심 %, type = 에셋 종류 1/2/3) ----------- */
  const CY = 59.03; // 구멍 세로 중심(%)
  const H = {
    chwigu: { id: "chwigu", type: 3, cx: 85.312, label: "취구", vo: "n06" },
    cheonggong: { id: "cheonggong", type: 2, cx: 70.495, label: "청공", vo: "n07" },
    // 지공 6개 — 취구에 가까운(오른쪽) 것부터.
    // [지공] 타이포와 대금 음 6개는 마지막(왼쪽 끝) 지공에서 나온다(260921 수정요청).
    ji1: { id: "ji1", type: 1, cx: 55.677 },
    ji2: { id: "ji2", type: 1, cx: 49.323 },
    ji3: { id: "ji3", type: 1, cx: 43.021 },
    ji4: { id: "ji4", type: 1, cx: 35.365 },
    ji5: { id: "ji5", type: 1, cx: 29.74 },
    ji6: { id: "ji6", type: 1, cx: 22.135, label: "지공", vo: "n08", extraSfx: "sixNotes" },
    // 칠성공 2개 — hole1/line_hole1 을 75% 로 줄여 배치(260921 수정요청).
    // 뚫는 순서는 오른쪽→왼쪽이라 chil2 가 먼저, [칠성공] 타이포와 송곳 사라짐은 마지막 구멍에서.
    chil2: { id: "chil2", type: 1, small: true, cx: 15.7 },
    chil1: { id: "chil1", type: 1, small: true, cx: 12.3, label: "칠성공", vo: "n09", lastDrill: true },
  };
  // 부위 명칭 타이포 — 구멍 id 와 파일명이 다른 것들(지공 6개는 모두 label-jigong)
  const LABEL_IMG = {
    chwigu: "chwigu",
    cheonggong: "cheonggong",
    ji6: "jigong",
    chil1: "chilseonggong",
    bowl: "galdaecheong",
  };
  const ORDER = ["chwigu", "cheonggong", "ji1", "ji2", "ji3", "ji4", "ji5", "ji6", "chil2", "chil1"];

  const BOWL = { cx: 18.5, cy: 36.5 }; // 나무 그릇 중심(배경 그림 기준)
  const DRILL_DOWN_MS = 260; // 송곳이 구멍에 닿는 시점(전체 액팅 0.5s)

  /* ----- 구멍 DOM 생성 -------------------------------------------------- */
  const $holes = $("#holes");
  ORDER.forEach(function (key) {
    const h = H[key];
    $holes.append(
      '<button class="hole hole-t' + h.type + (h.small ? " hole-sm" : "") + '" id="hole-' + h.id + '" style="left:' + h.cx + '%"' +
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

  // 종료 화면 — 진입 시 내레이션(260921 수정요청). 완료 직후 / ?success=1 복귀 모두 여기로.
  function openFinish() {
    AR.openPopup("#finishDim");
    AR.Sound.narrate(S.n13);
  }

  function clearHints() {
    $fx.removeClass("on");
    $arrow.removeClass("on point-left").css("left", "");
    $(".hole").removeClass("active");
    $("#bowlHit").removeClass("active");
  }

  function showName(key) {
    $name.attr("src", "img/03_exp1/label-" + LABEL_IMG[key] + ".png").removeClass("show");
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
            showName(h.id);
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
        showName("bowl");
        AR.Sound.narrate(S.n10);
        reedFollow = true;
        $reed.removeClass("attached").addClass("on").css({ left: BOWL.cx + "%", top: BOWL.cy + "%" });
        next();
        return;
      }

      if (step.kind === "attach") {
        // 세로로 들고 있던 갈대청이 90° 돌아 눕고 청공 크기로 줄어들며 붙는다(수정요청 레퍼런스).
        reedFollow = false;
        $reed.addClass("attached").css({ left: H.cheonggong.cx + "%", top: CY + "%" });
        AR.Sound.sfx(S.cheong); // 청을 울리는 대금 소리
        setTimeout(next, 900);
      }
    },

    onDone: function () {
      // 완성 — 대금이 daegeum2 로 디졸브되고 1초 뒤 종료 화면(수정요청).
      // 가락(melody)은 그 위에 겹쳐 재생된다.
      $("#daegeum2").addClass("on");
      // 갈대청과 청공은 완성본(daegeum2)의 청가리개 장식에 덮이는 자리라 함께 사라진다.
      // 나머지 구멍은 그대로 둔다(수정요청 "구멍은 그대로 유지").
      $reed.add("#hole-cheonggong").addClass("gone");
      AR.Sound.sfx(S.melody);
      setTimeout(openFinish, 1000);
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

  /* ----- 안내 → 플레이 --------------------------------------------------- */
  function startPlay() {
    $("#stage").addClass("on");
    reedFollow = false;
    $("#daegeum2").removeClass("on");
    $reed.removeClass("on attached gone");
    $drill.removeClass("hide drilling");
    $(".hole").removeClass("open active gone");
    $name.removeClass("show").removeAttr("src");
    runner.start();
  }

  // 안내 화면은 진입 즉시 떠 있다(HTML 에 .flex). 내레이션만 여기서 건다.
  // 자동재생이 막히면 첫 터치에서 한 번 더 시도한다.
  const vo = AR.Sound.narrate(S.n05);
  if (vo) {
    $(document).one("pointerdown", function () {
      if (vo.paused) AR.Sound.narrate(S.n05);
    });
  }

  // ?success=1 — 안내를 건너뛰고 완료 화면 바로 보기([더 알아보기] 뒤로가기 복귀)
  if (new URLSearchParams(location.search).get("success") === "1") {
    AR.closePopup("#guideDim");
    openFinish();
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
    "img/03_exp1/daegeum2.png",
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
    "img/03_exp1/label-chwigu.png",
    "img/03_exp1/label-cheonggong.png",
    "img/03_exp1/label-jigong.png",
    "img/03_exp1/label-chilseonggong.png",
    "img/03_exp1/label-galdaecheong.png",
  ]);
  AR.Sound.prime([S.drill, S.n05, S.n06, S.n07, S.n08, S.n09, S.n10, S.n13, S.cheong, S.melody, S.sixNotes]);
});
