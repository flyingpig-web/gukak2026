/* =========================================================================
   정보 — 더 알아보기 (info1.html 기획서 p18~19 / info2.html p40~41)
   1. 진입 시 안내 내레이션 자동 재생 (정보1 찬돌N_06 / 정보2 다온N_04)
   2. [좌우 화살표] 로 책 3권 회전 — 가운데 책만 컬러, 누를 수 있다
   3. 가운데 책을 누르면 딤드 + 정보 팝업 + 책 내레이션. 정보1 은 [X] 로만, 정보2 는 화면 아무 곳이나 누르면 닫힘
   페이지 구분은 <body data-info="1|2">.
   ※ 기획 p40 의 셋째 책 "노랫말은 달라도 후렴은 함께" 는 납품 에셋 기준 "아리랑 이야기"(story)
   ========================================================================= */
$(function () {
  const S = window.AR5_SFX;

  // slots = 자리(왼쪽·가운데·오른쪽)의 책 중심점, 목업 실측(디자인 px)
  // books = 처음 배치 순서(왼쪽부터). size = 책 이미지 원본, pop = 팝업 [left, top, width, height] (px)
  const PAGES = {
    1: {
      img: "img/05_info1/",
      intro: S.chandol06,
      back: "exp1.html",
      xOnly: true, // 기획 p19 는 "화면 클릭 시 닫힘"이지만 사용자 요청으로 [X] 로만 닫는다
      slots: [
        [801, 468.5],
        [943, 597],
        [1109, 469],
      ],
      books: [
        { id: "jeongseon", size: [282, 347], pop: [437, 262, 1009, 555], vo: S.exp1Info1, alt: "정선아리랑" },
        { id: "miryang", size: [292, 354], pop: [435, 263, 1015, 560], vo: S.exp1Info2, alt: "밀양아리랑" },
        { id: "jindo", size: [278, 346], pop: [437, 262, 1009, 555], vo: S.exp1Info3, alt: "진도아리랑" },
      ],
    },
    2: {
      img: "img/06_info2/",
      intro: S.daon04,
      back: "exp2.html",
      slots: [
        [780, 467],
        [965, 579.5],
        [1162.5, 470.5],
      ],
      books: [
        { id: "semachi", size: [292, 354], pop: [437, 262, 1009, 555], vo: S.exp2Info2, alt: "세마치장단으로 불러요" },
        { id: "megigo", size: [282, 347], pop: [437, 262, 1009, 555], vo: S.exp2Info1, alt: "메기고 받는 아리랑" },
        { id: "story", size: [281, 349], pop: [437, 262, 1009, 555], vo: S.exp2Info3, alt: "아리랑 이야기" },
      ],
    },
  };
  const P = PAGES[document.body.dataset.info];
  const IMG = P.img;
  const BOOKS = P.books;
  let center = 1; // 가운데 자리에 있는 책 번호

  const pct = (px, of) => (px / of) * 100 + "%";

  BOOKS.forEach(function (b) {
    b.$el = $(
      `<button class="book" aria-label="${b.alt}">` +
        `<img class="off-img" src="${IMG}btn_${b.id}_book_off.png" alt="" />` +
        `<img class="on-img" src="${IMG}btn_${b.id}_book_on.png" alt="" />` +
        "</button>"
    )
      .css({ width: pct(b.size[0], 1920), height: pct(b.size[1], 1080) })
      .on("click", () => openBook(b))
      .appendTo("#books");
  });

  function layout() {
    BOOKS.forEach(function (b, i) {
      const [cx, cy] = P.slots[(i - center + 1 + 3) % 3];
      b.$el
        .toggleClass("center", i === center)
        .css({ left: pct(cx - b.size[0] / 2, 1920), top: pct(cy - b.size[1] / 2, 1080) });
    });
  }
  layout();

  $("#btnPrev").on("click", () => ((center = (center + 2) % 3), layout()));
  $("#btnNext").on("click", () => ((center = (center + 1) % 3), layout()));

  function openBook(b) {
    $("#bookPop")
      .attr({ src: `${IMG}popup_${b.id}.png`, alt: b.alt })
      .css({ left: pct(b.pop[0], 1920), top: pct(b.pop[1], 1080), width: pct(b.pop[2], 1920), height: pct(b.pop[3], 1080) });
    $("#bookCloseImg").attr("src", `${IMG}btn_close_${b.id}.png`);
    AR.openPopup("#bookDim");
    AR.Sound.narrate(b.vo);
  }
  // 정보1 은 [X] 만, 정보2 는 [X] 포함 화면 어디를 눌러도 닫힌다
  $(P.xOnly ? "#bookClose" : "#bookDim").on("click", function () {
    AR.closePopup("#bookDim");
    AR.Sound.stopNarration();
  });

  // 활동 종료 화면에서만 들어온다 → 뒤로가기는 그 활동의 종료 화면으로(?done)
  $("#btnBack").on("click", () => AR.go(P.back + "?done"));
  $("#btnHome").on("click", () => AR.go("main.html"));

  AR.Sound.prime([P.intro, ...BOOKS.map((b) => b.vo)]);
  AR.preload(
    ["bg_info.png", "title_info.png", "speech_bubble.png", "btn_left.png", "btn_right.png"]
      .concat(BOOKS.flatMap((b) => [`btn_${b.id}_book_off.png`, `btn_${b.id}_book_on.png`, `popup_${b.id}.png`, `btn_close_${b.id}.png`]))
      .map((f) => IMG + f)
  ).then(() => AR.Sound.narrate(P.intro));
});
