/* =========================================================================
   정보(더 알아보기) — info.html   기획서 p27~29
   1. 진입 시 '가람N_11' 자동 재생
   2. [취구][청공][지공][칠성공] 클릭 → 배경 딤드 + 해당 정보 팝업
   3. [청공] 은 청공 → 갈대청 → 청가리개 를 좌우 화살표로 순서대로 확인
   4. 화면(딤드) 클릭 시 팝업이 닫히며 화면 복귀
   ========================================================================= */
$(function () {
  const S = window.AR2_SFX;
  const DIR = "img/05_info/";

  const PARTS = {
    chwigu: ["popup_chwigu.png"],
    cheonggong: ["popup_cheonggong.png", "popup_galdaecheong.png", "popup_cheong-galigae.png"],
    jigong: ["popup_jigong.png"],
    chilseonggong: ["popup_chilseonggong.png"],
  };

  let list = [];
  let idx = 0;

  function render() {
    $("#popImg").attr("src", DIR + list[idx]);
    const many = list.length > 1;
    $("#btnPrev").toggle(many && idx > 0);
    $("#btnNext").toggle(many && idx < list.length - 1);
  }

  function open(part) {
    list = PARTS[part] || [];
    if (!list.length) return;
    idx = 0;
    render();
    AR.openPopup("#infoDim");
  }

  $(".part-btn").on("click", function () {
    open($(this).data("part"));
  });

  $("#btnPrev").on("click", function (e) {
    e.stopPropagation();
    if (idx > 0) {
      idx--;
      render();
    }
  });

  $("#btnNext").on("click", function (e) {
    e.stopPropagation();
    if (idx < list.length - 1) {
      idx++;
      render();
    }
  });

  $("#btnClose").on("click", function (e) {
    e.stopPropagation();
    AR.closePopup("#infoDim");
  });

  // 기획 p27/p28 "화면 클릭 시 팝업창이 닫히며 화면 복귀" — 팝업 이미지 위도 포함.
  // 좌우 화살표(6.35% / 87.92%)와 [X] 는 팝업 바깥이라 위에서 stopPropagation 으로 살린다.
  $("#infoDim").on("click", function () {
    AR.closePopup("#infoDim");
  });

  /* ----- 상단바 — [뒤로가기] 는 들어온 활동으로 돌아간다 ------------------ */
  const from = new URLSearchParams(location.search).get("from");
  // 완료 팝업의 [더 알아보기] 로 들어온 것이므로, 돌아갈 때도 완료 화면으로 복귀한다.
  const back = from === "exp1" ? "exp1.html?success=1" : from === "exp2" ? "exp2.html?success=1" : "main.html";

  $("#btnBack").on("click", function () {
    AR.go(back);
  });
  // [홈] 은 타이틀(index)이 아니라 MAIN 으로 — 활동 선택 화면이 이 콘텐츠의 홈이다.
  $("#btnHome").on("click", function () {
    AR.go("main.html");
  });

  /* ----- 진입 연출 / 프리로드 -------------------------------------------- */
  AR.preload(
    [
      "img/05_info/bg_info.png",
      "img/05_info/daegeum.png",
      "img/05_info/speech_bubble.png",
      "img/05_info/title_info.png",
      "img/05_info/btn_close.png",
      "img/05_info/btn_next.png",
    ].concat(
      Object.keys(PARTS).reduce(function (acc, k) {
        return acc.concat(PARTS[k].map(function (f) {
          return DIR + f;
        }));
      }, [])
    )
  ).then(function () {
    AR.Sound.narrate(S.n11);
  });
});
