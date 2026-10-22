/* =========================================================================
   정보 — 더 알아보기 (info.html)  기획서 p19~21
   1. 진입 시 '두리N_14'(info_01) 자동 재생
   2. 책 3권(기호·정간·정간보) — 책이나 이름표를 누르면 딤드 + 책 팝업 + 그 쪽 내레이션
      팝업 안 [◀][▶] 로 쪽을 넘긴다(기호 3쪽 / 정간 2쪽 / 정간보 1쪽, 기획 p21)
   3. [X] 또는 책 바깥을 누르면 닫히고 내레이션 정지
      (기획 "화면 클릭 시 닫힘" — 책 안을 누르면 닫히지 않게 했다. 쪽 넘기기를 누르다 닫히지 않도록)
   활동1·2 종료 화면 [더 알아보기] 에서 들어온다(?from=exp1|exp2) → [뒤로]는 그 활동 종료 화면으로.
   ========================================================================= */
$(function () {
  const S = window.AR1_SFX;
  const N = window.AR1_N;
  const IMG = "img/05_info/";
  const NOTE = "img/03_exp1/btn_note_";

  // desc 의 \n 은 줄바꿈(목업 p20 "연주하다가 잠깐 / 숨을 쉬라는 표시랍니다." 처럼 구 단위로)
  // 쪽 그림: src, 크기 [w, h] 디자인 px — 왼쪽 쪽 중심 (690, 477)에 놓는다
  // 음표는 목업 p20 에서 원본 178 의 1.33배(237). 정간보는 score_blank(1600×1200)를 축소.
  const NOTE_SIZE = [237, 237];
  const PAGE_C = [690, 477];
  const BOOKS = [
    {
      id: "symbols",
      color: "green",
      book: [82, 478],
      label: [161, 796],
      alt: "기호",
      pages: [
        { img: NOTE + "rest.png", title: "숨표", desc: "연주하다가 잠깐\n숨을 쉬라는 표시랍니다.", vo: ["info_02"] },
        { img: NOTE + "triangle_up.png", title: "쉼표", desc: "소리를 잠깐 멈추고\n쉬는 자리예요.", vo: ["info_03"] },
        { img: NOTE + "horizontal_line.png", title: "끝줄", desc: "음악이 여기서 끝난다고\n알려줘요.", vo: ["info_04"] },
      ],
    },
    {
      id: "jeonggan",
      color: "blue",
      book: [677, 478],
      label: [767, 796],
      alt: "정간",
      pages: [
        { img: NOTE + "empty.png", size: [253, 253], title: "정간", desc: "정간보의 네모 한 칸을\n부르는 말이에요.", vo: ["info_05"] },
        { img: NOTE + "hwang_tae.png", title: "소박", desc: "한 박을 더 작게 나눈 것으로\n2소박, 3소박, 4소박이 있어요.", vo: ["info_06"] },
      ],
    },
    {
      id: "jeongganbo",
      color: "red",
      book: [1284, 478],
      label: [1374, 796],
      alt: "정간보",
      pages: [
        // info_07 은 "정간보"(이름), info_08 이 설명 — 이어서 재생
        { img: "img/03_exp1/score_blank.png", size: [440, 330], title: "정간보", desc: "소리의 높고 낮음, 길고 짧음을\n칸으로 나타낸 우리 악보예요.", vo: ["info_07", "info_08"] },
      ],
    },
  ];

  const pct = (px, of) => (px / of) * 100 + "%";
  const box = (l, t, w, h) => ({ left: pct(l, 1920), top: pct(t, 1080), width: pct(w, 1920), height: pct(h, 1080) });
  const bookImg = (b) => `${IMG}btn_book_${b.id}_${b.color}.png`;

  BOOKS.forEach(function (b) {
    $(`<button class="book" aria-label="${b.alt}"><img src="${bookImg(b)}" alt="" /></button>`)
      .css(box(...b.book, 562, 375))
      .on("click", () => openBook(b))
      .appendTo("#books");
    $(`<button class="book-label" aria-label="${b.alt}"><img src="${IMG}text_book_${b.id}.png" alt="${b.alt}" /></button>`)
      .css(box(...b.label, 386, 150))
      .on("click", () => openBook(b))
      .appendTo("#books");
  });

  /* ----- 팝업 ------------------------------------------------------------- */
  let cur = null; // 열린 책
  let page = 0;

  // 내레이션 여러 개를 이어서
  function narrateAll(list, i = 0) {
    if (i >= list.length) return;
    AR.Sound.narrate(N(list[i]), { onEnd: () => narrateAll(list, i + 1) });
  }

  function showPage(n) {
    page = (n + cur.pages.length) % cur.pages.length; // 양끝에서 돌아간다(p21 첫 쪽에도 ◀)
    const p = cur.pages[page];
    const [w, h] = p.size || NOTE_SIZE;
    $("#pageImg")
      .html(`<img src="${p.img}" alt="" />`)
      .find("img")
      .css(box(PAGE_C[0] - w / 2, PAGE_C[1] - h / 2, w, h));
    $("#pageTitle").text(p.title);
    $("#pageDesc").text(p.desc);
    $("#pageDots").html(cur.pages.map((_, i) => `<i class="${i === page ? "on" : ""}"></i>`).join(""));
    $("#pageImg, .page-right").removeClass("swap");
    void $("#pageImg")[0].offsetWidth;
    $("#pageImg, .page-right").addClass("swap");
    narrateAll(p.vo);
  }

  function openBook(b) {
    cur = b;
    $("#bookPop").attr({ src: `${IMG}popup_book_${b.color}.png`, alt: b.alt });
    $(".book-card").toggleClass("single", b.pages.length === 1);
    AR.openPopup("#bookDim");
    showPage(0);
  }

  function closeBook() {
    AR.closePopup("#bookDim");
    AR.Sound.stopNarration();
    cur = null;
  }

  $("#btnPagePrev").on("click", () => showPage(page - 1));
  $("#btnPageNext").on("click", () => showPage(page + 1));
  $("#bookClose").on("click", closeBook);
  // 책 바깥(딤드)을 누르면 닫힌다 — 책 그림 영역(알파) 안은 무시
  $("#bookDim").on("click", function (e) {
    if ($(e.target).closest("button").length) return;
    const r = $(".container")[0].getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 1920;
    const y = ((e.clientY - r.top) / r.height) * 1080;
    // popup_book_* 알파 영역: (334+13, 123+83) ~ (334+1241, 123+760)
    const inBook = x >= 347 && x <= 1575 && y >= 206 && y <= 883;
    if (!inBook) closeBook();
  });

  // 활동 종료 화면에서 들어온다 → 뒤로가기는 그 활동의 종료 화면으로(?done)
  const from = new URLSearchParams(location.search).get("from");
  $("#btnBack").on("click", () => AR.go(from === "exp1" || from === "exp2" ? `${from}.html?done` : "main.html"));
  $("#btnHome").on("click", () => AR.go("main.html"));

  AR.Sound.prime([S.info01, ...BOOKS.flatMap((b) => b.pages.flatMap((p) => p.vo.map(N)))]);
  AR.preload(
    ["bg_info_with_guide.png", "text_info.png", "btn_close.png", "btn_prev.png", "btn_next.png"]
      .map((f) => IMG + f)
      .concat(
        BOOKS.flatMap((b) => [bookImg(b), `${IMG}text_book_${b.id}.png`, `${IMG}popup_book_${b.color}.png`, ...b.pages.map((p) => p.img)])
      )
  ).then(function () {
    const vo = AR.Sound.narrate(S.info01);
    if (!vo) return;
    $(document).one("pointerdown", function () {
      if (vo.paused && vo.currentTime === 0 && !cur) AR.Sound.narrate(S.info01);
    });
  });
});
