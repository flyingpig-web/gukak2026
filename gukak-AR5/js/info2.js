/* =========================================================================
   활동2 정보 — 더 알아보기 (info2.html)  기획서 p40~41
   1. 진입 시 '다온N_04' 자동 재생
   2. [좌우 화살표] 로 책 3권 회전 — 가운데 책만 컬러, 누를 수 있다
   3. 가운데 책을 누르면 딤드 + 정보 팝업, 화면 아무 곳이나 누르면 닫힘
   ※ 기획 p40 의 셋째 책 "노랫말은 달라도 후렴은 함께" 는 납품 에셋 기준 "아리랑 이야기"(story)
   ========================================================================= */
$(function () {
  const S = window.AR5_SFX;
  const IMG = "img/06_info2/";

  // 자리(왼쪽·가운데·오른쪽)의 책 중심점 — 목업 p40 실측(디자인 px)
  const SLOTS = [
    [780, 467],
    [965, 579.5],
    [1162.5, 470.5],
  ];
  // 처음 배치 순서 = 왼쪽부터. size = 책 이미지 원본(px)
  const BOOKS = [
    { id: "semachi", size: [292, 354], alt: "세마치장단으로 불러요" },
    { id: "megigo", size: [282, 347], alt: "메기고 받는 아리랑" },
    { id: "story", size: [281, 349], alt: "아리랑 이야기" },
  ];
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
      const [cx, cy] = SLOTS[(i - center + 1 + 3) % 3];
      b.$el
        .toggleClass("center", i === center)
        .css({ left: pct(cx - b.size[0] / 2, 1920), top: pct(cy - b.size[1] / 2, 1080) });
    });
  }
  layout();

  $("#btnPrev").on("click", () => ((center = (center + 2) % 3), layout()));
  $("#btnNext").on("click", () => ((center = (center + 1) % 3), layout()));

  function openBook(b) {
    $("#bookPop").attr({ src: `${IMG}popup_${b.id}.png`, alt: b.alt });
    $("#bookCloseImg").attr("src", `${IMG}btn_close_${b.id}.png`);
    AR.openPopup("#bookDim");
  }
  // [X] 포함 화면 어디를 눌러도 닫힌다
  $("#bookDim").on("click", () => AR.closePopup("#bookDim"));

  // 활동2 종료 화면에서만 들어온다 → 뒤로가기는 활동2 로
  $("#btnBack").on("click", () => AR.go("exp2.html"));
  $("#btnHome").on("click", () => AR.go("main.html"));

  AR.Sound.prime([S.daon04]);
  AR.preload(
    ["bg_info.png", "title_info.png", "speech_bubble.png", "btn_left.png", "btn_right.png"]
      .concat(BOOKS.flatMap((b) => [`btn_${b.id}_book_off.png`, `btn_${b.id}_book_on.png`, `popup_${b.id}.png`, `btn_close_${b.id}.png`]))
      .map((f) => IMG + f)
  ).then(() => AR.Sound.narrate(S.daon04));
});
