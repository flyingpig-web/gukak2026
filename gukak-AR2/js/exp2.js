/* =========================================================================
   활동2 — 만파식적을 불어 음을 내보자! (exp2.html)  기획서 p19~26

   안내(체험 방법) → 플레이 → 종료

   플레이 규칙(기획 p23~25)
     · [불기] 버튼을 "누르고 있는 동안" 중간음역 7음을 순서대로 연주
       청중려 → 청고선 → 청태주 → 청황종 → 무역 → 남려 → 임종
     · 한 음 = 2초 홀드(기획 p22 "버튼 2초 홀드 시 이미지 전환")
     · 손을 떼면 소리가 멈추고 게이지가 리셋된다(처음부터 다시)
     · 게이지가 차는 동안 태풍/바다 상태가 0→1→2→3단계로 바뀐다
       (BG 전환은 청태주·남려 진입 시점 — 기획 p22 도식)
   ========================================================================= */
$(function () {
  const S = window.AR2_SFX;

  const N = 7; // 중간음역 7음
  const NOTE_MS = 2000; // 한 음을 채우는 데 걸리는 시간

  /* 각 음이 속한 배경 단계 — 3번째(청태주), 6번째(남려)에서 전환 */
  const LEVEL_OF = [1, 1, 2, 2, 2, 3, 3];

  /* 손을 뗐을 때 되돌리는 범위. 기획서 문구는 전체 리셋.
     저학년에게 14초 연속 홀드가 가혹하면 "note"(현재 음만)로 바꾸면 된다. */
  const RESET_ON_RELEASE = "all"; // "all" | "note"

  /* ----- 게이지 DOM 생성 (7칸) ------------------------------------------- */
  const GAGE_L0 = 6.406; // 첫 칸 left(%)
  const GAGE_DX = 7.8125; // 칸 간격(%)
  const $gages = $("#gages");
  for (let i = 0; i < N; i++) {
    $gages.append(
      '<div class="gage" data-i="' + i + '" style="left:' + (GAGE_L0 + GAGE_DX * i).toFixed(3) + '%">' +
        '<img class="gage-off" src="img/04_exp2/gage_off.png" alt="" />' +
        '<img class="gage-on" src="img/04_exp2/gage_on.png" alt="" />' +
        "</div>"
    );
  }
  const gageOn = $gages.find(".gage-on").toArray();

  function setGage(i, k) {
    gageOn.forEach(function (el, idx) {
      el.style.setProperty("--k", String(idx < i ? 1 : idx === i ? k : 0));
    });
  }

  /* ----- 상태 ------------------------------------------------------------ */
  let note = 0; // 완성한 음의 개수(= 현재 연주 중인 음의 index)
  let level = 1;
  let finished = false;

  function setLevel(l) {
    if (l === level) return;
    level = l;
    $(".scene-bg.layer").removeClass("on").filter('[data-level="' + l + '"]').addClass("on");
    $(".boat").removeClass("on").filter('[data-level="' + l + '"]').addClass("on");
  }

  function showNote(i) {
    $(".garam").removeClass("on").filter('[data-note="' + i + '"]').addClass("on");
    setLevel(LEVEL_OF[i]);
    AR.Sound.loop("daegeum", S.notes[i], { volume: 0.7 });
  }

  function resetAll() {
    note = 0;
    setGage(0, 0);
    $(".garam").removeClass("on").filter('[data-note="0"]').addClass("on");
    setLevel(1);
  }

  /* ----- [불기] 홀드 ----------------------------------------------------- */
  const holder = AR.hold("#btnBlow", {
    ms: NOTE_MS,
    repeat: true,

    onStart: function () {
      if (finished) return;
      $("#btnBlow").addClass("blowing");
      showNote(note);
    },

    onProgress: function (k) {
      setGage(note, k);
    },

    onDone: function () {
      setGage(note, 1);
      note++;
      if (note >= N) {
        finish();
        return;
      }
      showNote(note);
    },

    onCancel: function () {
      $("#btnBlow").removeClass("blowing");
      AR.Sound.stopLoop("daegeum");
      if (finished) return;
      if (RESET_ON_RELEASE === "all") {
        resetAll();
      } else {
        setGage(note, 0); // 현재 음만 되돌리기
      }
    },
  });

  /* ----- 종료 ------------------------------------------------------------ */
  function finish() {
    finished = true;
    holder.stop(); // onCancel 은 finished 가드로 리셋하지 않는다
    AR.Sound.stopLoop("daegeum");
    $("#btnBlow").removeClass("blowing").prop("disabled", true);
    // 종료 팝업에서는 연주 UI 를 감춘다(기획 p26 목업 — 게이지·[불기] 가 보이지 않는다)
    $("#gages, #btnBlow").hide();

    setTimeout(function () {
      AR.openPopup("#finishDim");
      // 기획 p26: 신문왕N_01 이 끝난 뒤에 버튼이 활성화된다.
      const $btns = $("#finishDim .finish-btns button").prop("disabled", true);
      AR.Sound.narrate(S.king01, {
        onEnd: function () {
          $btns.prop("disabled", false);
        },
      });
    }, 700);
  }

  /* ----- 안내 → 플레이 --------------------------------------------------- */
  function startPlay() {
    $("#stage").addClass("on");
    $("#gages, #btnBlow").show();
    finished = false;
    $("#btnBlow").prop("disabled", false);
    resetAll();
  }

  // 안내 화면은 진입 즉시 떠 있다(HTML 에 .flex). 내레이션만 여기서 건다.
  // 자동재생이 막히면 첫 터치에서 한 번 더 시도한다.
  const vo = AR.Sound.narrate(S.n12);
  if (vo) {
    $(document).one("pointerdown", function () {
      if (vo.paused) AR.Sound.narrate(S.n12);
    });
  }

  // ?success=1 — 안내를 건너뛰고 완료 화면 바로 보기([더 알아보기] 뒤로가기 복귀)
  if (new URLSearchParams(location.search).get("success") === "1") {
    AR.closePopup("#guideDim");
    $("#gages, #btnBlow").hide();
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
    AR.go("info.html?from=exp2");
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
  setGage(0, 0);
  AR.preload([
    "img/04_exp2/bg_level1.png",
    "img/04_exp2/bg_level2.png",
    "img/04_exp2/bg_level3.png",
    "img/04_exp2/boat_level1.png",
    "img/04_exp2/boat_level2.png",
    "img/04_exp2/boat_level3.png",
    "img/04_exp2/rendition1.png",
    "img/04_exp2/rendition2.png",
    "img/04_exp2/rendition3.png",
    "img/04_exp2/rendition4.png",
    "img/04_exp2/rendition5.png",
    "img/04_exp2/rendition6.png",
    "img/04_exp2/rendition7.png",
    "img/04_exp2/gage_off.png",
    "img/04_exp2/gage_on.png",
    "img/04_exp2/btn_blowing.png",
    "img/04_exp2/exp2_tutorial.png",
    "img/04_exp2/exp2_title.png",
  ]);
  AR.Sound.prime(S.notes.concat([S.n12, S.king01]));
});
