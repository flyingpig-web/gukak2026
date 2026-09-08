/* =========================================================================
   gukak 시리즈 공통 스크립트  (window.AR)
   ★ 다음 국악 편은 이 프로젝트 폴더를 통째로 복사해서 쓴다.
     (bohun-AR1~4 와 같은 방식 — 콘텐츠 폴더 하나가 그대로 서빙 단위)
     그래서 이 파일은 편마다 복사본이 생긴다. 고칠 일이 있으면 최신 편에서 고치고
     다음 복사 때 함께 옮긴다.
   - bohun-AR3 `js/common.js` 에서 확립한 공통 자산을 국악 시리즈용으로 정리한 것.
   - 제거: CutRunner(컷 시퀀스), bindSettings(설정 팝업) — 국악 편에는 없는 구조.
   - 추가: hold(길게 누르기), steps(순서 강제 스텝머신), narrate(종료 콜백), showText.
   - ★ 이 파일에는 프로젝트별 경로(이미지/사운드)를 하드코딩하지 않는다.
     각 프로젝트 HTML 이 이 스크립트 "앞에서" window.AR_CONFIG 를 선언한다.

     <script>window.AR_CONFIG = {
       bgm:      "audio/bgm.mp3",      // 없으면 BGM 미사용
       bgmVolume: 0.2,
       clickSfx: "audio/effects/click.mp3",
       hoverSfx: "audio/effects/hover.mp3",
       prefix:   "gukak_ar2"           // localStorage/sessionStorage 키 접두사
     };</script>
   ========================================================================= */
(function (global) {
  "use strict";

  const CFG = Object.assign(
    { bgm: "", bgmVolume: 0.2, clickSfx: "", hoverSfx: "", prefix: "gukak" },
    global.AR_CONFIG || {}
  );

  /* ---------------------------------------------------------------------
     1. 이미지 프리로드 / 백그라운드 프리페치
     - 화면 진입 시 그 화면에서 쓸 이미지를 먼저 받아두고 시작한다.
     - 실패(404 등)해도 reject 하지 않고 계속 진행(저사양/누락 대비).
     --------------------------------------------------------------------- */
  const requested = new Set();

  function preload(urls) {
    const list = (urls || []).filter(Boolean);
    return Promise.all(
      list.map(
        (src) =>
          new Promise((resolve) => {
            requested.add(src);
            const img = new Image();
            img.onload = img.onerror = () => resolve(src);
            img.src = src;
          })
      )
    );
  }

  // 현재 화면을 막지 않고(논블로킹), 낮은 동시성으로 이미지를 캐시에 채운다.
  function prefetch(urls, concurrency) {
    const queue = (urls || []).filter((u) => u && !requested.has(u));
    if (!queue.length) return;
    queue.forEach((u) => requested.add(u));
    const max = concurrency || 4;
    let i = 0;
    function next() {
      if (i >= queue.length) return;
      const src = queue[i++];
      const img = new Image();
      img.onload = img.onerror = next;
      img.src = src;
    }
    for (let k = 0; k < Math.min(max, queue.length); k++) next();
  }

  // window.AR_MANIFEST(preload-manifest.js)가 있을 때만 동작.
  // 현재 페이지 기준으로 "다음 화면들 → 공통 → 현재 → 이전" 순서로 전역 프리페치.
  function prefetchFlow(currentFile) {
    const M = global.AR_MANIFEST;
    if (!M || !Array.isArray(M.flow)) return;
    const file = (currentFile || location.pathname.split("/").pop() || "").toLowerCase();
    const idx = M.flow.findIndex((f) => file.endsWith(f.page.toLowerCase()));
    const order = [];
    if (idx >= 0) {
      for (let i = idx + 1; i < M.flow.length; i++) order.push(...M.flow[i].images);
      order.push(...(M.common || []));
      order.push(...M.flow[idx].images);
      for (let i = 0; i < idx; i++) order.push(...M.flow[i].images);
    } else {
      order.push(...(M.common || []));
      M.flow.forEach((f) => order.push(...f.images));
    }
    const start = () => prefetch(order);
    if (typeof global.requestIdleCallback === "function") {
      global.requestIdleCallback(start, { timeout: 2000 });
    } else {
      setTimeout(start, 800);
    }
  }

  /* ---------------------------------------------------------------------
     2. 사운드 매니저
     - 배경음(bgm) 1채널 + 효과음(sfx) 멀티 + 내레이션(narration) 1채널.
     - 파일이 없으면 조용히 무시(무음 graceful) — 사운드 미납품 상태로도 전 구간 진행.
     --------------------------------------------------------------------- */
  const Sound = (() => {
    const KEY_BGM = CFG.prefix + "_bgm_on";
    const KEY_SFX = CFG.prefix + "_sfx_on";
    let bgmOn = localStorage.getItem(KEY_BGM) !== "off";
    let sfxOn = localStorage.getItem(KEY_SFX) !== "off";
    let bgm = null;
    const cache = {};

    function load(src) {
      if (!src) return null;
      if (!cache[src]) {
        const a = new Audio(src);
        a.preload = "auto";
        cache[src] = a;
      }
      return cache[src];
    }

    // 재생 중인 Audio 를 반환(재생 길이만큼 기다렸다 다음 연출로 넘어갈 수 있도록).
    function sfx(src) {
      if (!sfxOn || !src) return null;
      try {
        const base = load(src);
        const a = base.cloneNode ? base.cloneNode() : base; // 겹쳐 재생 대비 복제
        a.currentTime = 0;
        const p = a.play();
        if (p && p.catch) p.catch(() => {});
        return a;
      } catch (e) {
        return null;
      }
    }

    /* 효과음을 재생하고 "재생이 끝난 뒤" done() 을 호출.
       ★ 파일이 없으면(404) ended 가 영영 오지 않는다. 사운드 미납품 상태에서
         연출이 몇 초씩 멈추지 않도록 error / play() reject 도 "끝남"으로 처리한다.
       효과음 OFF 면 즉시 done(). 그래도 안 오는 경우 대비 안전 타임아웃. */
    function sfxThen(src, done, { maxWaitMs = 4000 } = {}) {
      const cb = typeof done === "function" ? done : () => {};
      if (!sfxOn || !src) return cb();
      let fired = false;
      const fire = () => {
        if (fired) return;
        fired = true;
        cb();
      };
      let a = null;
      try {
        const base = load(src);
        a = base && base.cloneNode ? base.cloneNode() : base;
      } catch (e) {}
      if (!a) return cb();
      a.addEventListener("ended", fire, { once: true });
      a.addEventListener("error", fire, { once: true });
      try {
        a.currentTime = 0;
        const p = a.play();
        if (p && p.catch) p.catch(fire); // 로드 실패/자동재생 차단 → 즉시 진행
      } catch (e) {
        return fire();
      }
      setTimeout(fire, maxWaitMs);
    }

    /* 루프 효과음(상태가 유지되는 동안 계속 반복되는 소리 — 예: 대금 지속음).
       name 으로 채널 구분. want = "지금 켜져 있어야 하는가"(토글 복구용). */
    const loops = {};
    function loop(name, src, { volume = 0.6 } = {}) {
      let L = loops[name];
      if (L && L.src !== src) {
        // 같은 채널에 다른 음원 → 이전 것 정지 후 교체(활동2 음 전환)
        try {
          L.a.pause();
          L.a.currentTime = 0;
        } catch (e) {}
        L = null;
      }
      if (!L) {
        const a = load(src);
        if (!a) return;
        a.loop = true;
        a.volume = volume;
        L = loops[name] = { a, src };
      }
      L.want = true;
      if (!sfxOn) return;
      try {
        const p = L.a.play();
        if (p && p.catch) p.catch(() => {});
      } catch (e) {}
    }
    function stopLoop(name) {
      const L = loops[name];
      if (!L) return;
      L.want = false;
      try {
        L.a.pause();
        L.a.currentTime = 0;
      } catch (e) {}
    }

    // 지연 최소화용 오디오 프리로드(재생은 하지 않고 Audio 객체만 미리 생성)
    function prime(list) {
      (list || []).filter(Boolean).forEach(load);
    }

    function playBgm(src, { loop: lp = true, volume = 0.5, startAt = 0 } = {}) {
      try {
        if (bgm) bgm.pause();
        bgm = load(src);
        if (!bgm) return;
        bgm.loop = lp;
        bgm.volume = volume;
        if (startAt > 0) {
          try {
            bgm.currentTime = startAt;
          } catch (e) {}
        }
        if (bgmOn) {
          const p = bgm.play();
          if (p && p.catch) p.catch(() => {});
        }
      } catch (e) {}
    }

    // 현재 BGM 재생 위치(초) — 페이지 이동 시 이어듣기용
    function bgmTime() {
      try {
        return bgm ? bgm.currentTime || 0 : 0;
      } catch (e) {
        return 0;
      }
    }

    // 자동재생 차단으로 멈춰 있던 BGM 을 현재 위치 그대로 재개(첫 사용자 제스처 시).
    function resumeBgm() {
      try {
        if (bgm && bgmOn && bgm.paused) {
          const p = bgm.play();
          if (p && p.catch) p.catch(() => {});
        }
      } catch (e) {}
    }

    // 위치를 유지한 채 일시정지(페이지 이탈 시 중첩 방지 — 재생위치 보존).
    function pauseBgm() {
      try {
        if (bgm) bgm.pause();
      } catch (e) {}
    }

    function stopBgm() {
      try {
        if (bgm) {
          bgm.pause();
          bgm.currentTime = 0;
        }
      } catch (e) {}
    }

    function setBgm(on) {
      bgmOn = on;
      localStorage.setItem(KEY_BGM, on ? "on" : "off");
      try {
        if (!bgm) return;
        if (on) {
          const p = bgm.play();
          if (p && p.catch) p.catch(() => {});
        } else {
          bgm.pause();
        }
      } catch (e) {}
    }

    function setSfx(on) {
      sfxOn = on;
      localStorage.setItem(KEY_SFX, on ? "on" : "off");
      try {
        Object.keys(loops).forEach((k) => {
          const L = loops[k];
          if (!L || !L.want) return;
          if (on) {
            const p = L.a.play();
            if (p && p.catch) p.catch(() => {});
          } else {
            L.a.pause();
          }
        });
      } catch (e) {}
    }

    /* 내레이션(V.O) — bgm/sfx 와 독립된 1채널. 새 내레이션 재생 시 이전 것 정지.
       narrate(src, {onEnd}) : 재생이 끝나면 onEnd 호출.
       ★ 파일이 없거나 자동재생이 막혀도 onEnd 는 반드시 불린다(진행 멈춤 방지).
         → 활동2 종료 팝업처럼 "내레이션 끝난 뒤 버튼 활성" 연출을 무음 상태로도 통과. */
    let voice = null;
    let voiceSeq = 0;

    function narrate(src, { volume = 1, onEnd, maxWaitMs = 12000 } = {}) {
      const cb = typeof onEnd === "function" ? onEnd : () => {};
      if (!src) return cb(), null;
      let a = null;
      try {
        stopNarration(); // ★ voiceSeq 를 올리므로 반드시 my 를 잡기 "전에" 부른다
        a = load(src);
      } catch (e) {
        a = null;
      }
      if (!a) return cb(), null;
      const my = ++voiceSeq;

      voice = a;
      let fired = false;
      const fire = () => {
        if (fired || my !== voiceSeq) return; // 다음 내레이션으로 교체됐으면 무시
        fired = true;
        cb();
      };
      try {
        a.loop = false;
        a.volume = volume;
        a.currentTime = 0;
        a.addEventListener("ended", fire, { once: true });
        const p = a.play();
        if (p && p.catch)
          p.catch(() => {
            fire(); // 자동재생 차단 → 즉시 다음 연출로
          });
        // duration 을 못 얻는 경우 대비 안전 타임아웃
        setTimeout(fire, maxWaitMs);
      } catch (e) {
        fire();
      }
      return a;
    }

    // 예전 이름 호환(콜백 없이 재생만)
    function playNarration(src, opts) {
      return narrate(src, opts);
    }

    function stopNarration() {
      voiceSeq++;
      try {
        if (voice) {
          voice.pause();
          voice.currentTime = 0;
        }
      } catch (e) {}
      voice = null;
    }

    return {
      sfx,
      sfxThen,
      loop,
      stopLoop,
      prime,
      playBgm,
      bgmTime,
      resumeBgm,
      pauseBgm,
      stopBgm,
      setBgm,
      setSfx,
      narrate,
      playNarration,
      stopNarration,
      isBgmOn: () => bgmOn,
      isSfxOn: () => sfxOn,
    };
  })();

  /* ---------------------------------------------------------------------
     3. 팝업(딤드 + 다이얼로그) — common.css 의 .dimmed / .dialog 사용
     ★ 딤드와 안쪽 .dialog 둘 다 .flex 를 토글해야 보인다(안 하면 다이얼로그가 안 뜸).
     --------------------------------------------------------------------- */
  function openPopup(sel) {
    const $d = $(sel).addClass("flex");
    $d.find(".dialog").addClass("flex");
    return $d;
  }
  function closePopup(sel) {
    return $(sel).removeClass("flex").find(".dialog").removeClass("flex").end();
  }

  /* ---------------------------------------------------------------------
     4. 화면 이동
     --------------------------------------------------------------------- */
  function go(href) {
    global.location.href = href;
  }

  /* ---------------------------------------------------------------------
     5. hold — 길게 누르기(홀드) 게이지 공용
     AR.hold($el, {
       ms,                 // 1회 완료까지 걸리는 시간
       onStart(),          // 누르기 시작
       onProgress(k, ms),  // k = 0~1 진행률 (rAF 마다)
       onDone(),           // ms 를 다 채움 → 계속 누르고 있으면 다음 사이클로 이어짐
       onCancel(k),        // 손을 뗌 / 포인터 이탈 / 탭 비활성
       repeat: true        // true 면 누르고 있는 동안 onDone 후 다음 사이클 자동 시작
     })
     - pointer 이벤트 기반(마우스·터치 동일 경로). 롱프레스 컨텍스트메뉴/선택 방지.
     - 반환: { stop(), isHolding() }
     --------------------------------------------------------------------- */
  function hold($el, opts) {
    const o = Object.assign({ ms: 1000, repeat: false }, opts || {});
    const el = $($el)[0];
    if (!el) return { stop() {}, isHolding: () => false };

    let raf = 0;
    let t0 = 0;
    let holding = false;

    const call = (name, ...args) => {
      if (typeof o[name] === "function") o[name](...args);
    };

    function step() {
      if (!holding) return;
      const k = Math.min(1, (performance.now() - t0) / o.ms);
      call("onProgress", k, o.ms);
      if (k >= 1) {
        call("onDone");
        if (!holding) return; // onDone 안에서 stop() 한 경우
        if (o.repeat) {
          t0 = performance.now();
        } else {
          holding = false;
          return;
        }
      }
      raf = requestAnimationFrame(step);
    }

    function start(e) {
      if (holding) return;
      if (e && e.preventDefault) e.preventDefault(); // 롱프레스 메뉴·드래그 방지
      // ★ 포인터 캡처 — 이걸 안 하면 손가락이 버튼 안에서 조금만 흔들려도
      //   pointerleave 로 홀드가 끊긴다(수 초짜리 홀드에서는 사실상 진행 불가).
      try {
        if (e && e.pointerId !== undefined && el.setPointerCapture) {
          el.setPointerCapture(e.pointerId);
        }
      } catch (err) {}
      holding = true;
      t0 = performance.now();
      call("onStart");
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(step);
    }

    function cancel() {
      if (!holding) return;
      const k = Math.min(1, (performance.now() - t0) / o.ms);
      holding = false;
      cancelAnimationFrame(raf);
      call("onCancel", k);
    }

    el.addEventListener("pointerdown", start);
    // 포인터가 요소 밖으로 나가도 up 을 받도록 document 에 건다.
    // (캡처 중이면 이벤트가 el 로 리타깃되고 여기까지 버블링된다)
    document.addEventListener("pointerup", cancel);
    document.addEventListener("pointercancel", cancel);
    el.addEventListener("contextmenu", (e) => e.preventDefault());
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) cancel();
    });

    return {
      stop: cancel,
      isHolding: () => holding,
    };
  }

  /* ---------------------------------------------------------------------
     6. steps — 순서 강제 스텝 머신
     AR.steps([{ el, ... }, ...], {
       onEnter(step, i),   // 그 스텝에 진입(하이라이트 표시 등)
       onHit(step, i, next), // 타깃 클릭 — 연출이 끝나면 next() 를 불러 다음 스텝으로
       onDone()
     })
     - 현재 스텝의 el 만 클릭이 먹는다(나머지는 클릭해도 무시).
     - 반환: { start(), index(), goTo(i) }
     --------------------------------------------------------------------- */
  function steps(list, opts) {
    const o = opts || {};
    const items = (list || []).filter(Boolean);
    let i = -1;
    let busy = false;

    const call = (name, ...args) => {
      if (typeof o[name] === "function") o[name](...args);
    };

    function enter(n) {
      i = n;
      if (i >= items.length) {
        call("onDone");
        return;
      }
      busy = false;
      call("onEnter", items[i], i);
    }

    function hit(idx) {
      if (busy || idx !== i) return; // 순서 밖 클릭 무시
      busy = true;
      call("onHit", items[i], i, () => enter(i + 1));
    }

    items.forEach((s, idx) => {
      $(s.el).on("click", (e) => {
        e.stopPropagation();
        hit(idx);
      });
    });

    return {
      start: () => enter(0),
      index: () => i,
      goTo: enter,
    };
  }

  /* ---------------------------------------------------------------------
     7. fitText — 한 줄 텍스트가 상자 폭을 넘으면 글자 크기를 줄여 맞춘다.
     (말풍선/텍스트바가 고정 폭 이미지라서 문구 길이에 따라 넘칠 수 있다)
     대상 요소는 white-space:nowrap + 고정 폭이어야 한다.
     --------------------------------------------------------------------- */
  function fitText($box, { max = 3.4, min = 1.6, step = 0.1 } = {}) {
    const el = $($box)[0];
    if (!el) return;
    let size = max;
    el.style.fontSize = size + "rem";
    let guard = 0;
    while (el.scrollWidth > el.clientWidth && size > min && guard++ < 60) {
      size -= step;
      el.style.fontSize = size + "rem";
    }
  }

  /* ---------------------------------------------------------------------
     8. showText — 텍스트박스 문구 교체(페이드 + 폭 맞춤)
     --------------------------------------------------------------------- */
  function showText($box, text, { ms = 180, fit = true, fitOpts } = {}) {
    const $t = $($box);
    if (!$t.length) return;
    // 박스가 아니라 글자만 페이드한다 — 박스를 페이드하면 말풍선 배경(text_bar)까지
    // 투명해져서 배경 이미지에 구워진 이전 문구가 잠깐 비친다.
    let $inner = $t.children(".text-fade");
    if (!$inner.length) $inner = $("<span class='text-fade'></span>").appendTo($t.empty());
    const paint = function () {
      $inner.html(String(text || "").replace(/\n/g, "<br>"));
      if (fit) fitText($t, fitOpts);
    };
    if (!ms) return paint();
    $inner.stop(true, true).animate({ opacity: 0 }, ms, function () {
      paint();
      $inner.animate({ opacity: 1 }, ms);
    });
  }

  /* ---------------------------------------------------------------------
     9. 노출
     --------------------------------------------------------------------- */
  global.AR = {
    CFG,
    preload,
    prefetch,
    prefetchFlow,
    Sound,
    openPopup,
    closePopup,
    go,
    hold,
    steps,
    showText,
    fitText,
    isDebug: () => {
      try {
        return localStorage.getItem("db") === "1";
      } catch (e) {
        return false;
      }
    },
  };

  /* ---------------------------------------------------------------------
     10. 페이지 공통 초기화(DOM ready)
     --------------------------------------------------------------------- */
  $(function () {
    // 모바일 세로 → 가로 안내
    if (!$(".mobile-pop").length) {
      $(".container").append(
        "<div class='mobile-pop'><p>모바일 가로모드로 변경해 주세요.</p></div>"
      );
    }

    // 이미지 접근성 속성
    document.querySelectorAll("img").forEach((img) => {
      if (!img.hasAttribute("alt")) img.setAttribute("alt", "");
      img.setAttribute("aria-hidden", "true");
    });

    // data-hover-image — hover 시 이미지 교체(MAIN 선택 버튼 ON 이미지 등)
    $("[data-hover-image]")
      .on("mouseenter", function () {
        const $t = $(this);
        const $img = $t.is("img") ? $t : $t.find("img").first();
        if (!$img.length) return;
        $t.data("orig-src", $img.attr("src"));
        $img.attr("src", $t.attr("data-hover-image"));
      })
      .on("mouseleave", function () {
        const $t = $(this);
        const $img = $t.is("img") ? $t : $t.find("img").first();
        const o = $t.data("orig-src");
        if ($img.length && o) $img.attr("src", o);
      });

    // 공통 클릭 효과음(AR_CONFIG.clickSfx 가 있을 때만)
    if (CFG.clickSfx) {
      $(document).on("click", 'button, [role="button"], .btn', function () {
        Sound.sfx(CFG.clickSfx);
      });
    }

    // 버튼 호버 효과음 — hover 가능한 기기에서만
    if (CFG.hoverSfx && (!global.matchMedia || global.matchMedia("(hover: hover)").matches)) {
      $(document).on("mouseenter", 'button, [role="button"], .btn', function () {
        Sound.sfx(CFG.hoverSfx);
      });
    }

    /* ===== BGM — 화면이 바뀌어도 이어서 재생 =====
       허브형(HOME↔MAIN↔활동)이라 페이지 이동이 잦다. 이동 시 재생 위치를
       sessionStorage 에 저장해 다음 페이지에서 그 지점부터 잇는다.
       자동재생 정책상 첫 제스처 전엔 막힐 수 있어 첫 입력에서 한 번 더 시도. */
    if (CFG.bgm) {
      const KEY_T = CFG.prefix + "_bgm_t";
      let at = 0;
      try {
        at = parseFloat(sessionStorage.getItem(KEY_T) || "0") || 0;
      } catch (e) {}
      Sound.playBgm(CFG.bgm, { loop: true, volume: CFG.bgmVolume, startAt: at });

      const kick = () => {
        Sound.resumeBgm();
        ["click", "touchstart", "keydown"].forEach((ev) =>
          document.removeEventListener(ev, kick)
        );
      };
      ["click", "touchstart", "keydown"].forEach((ev) => document.addEventListener(ev, kick));

      let left = false;
      const onLeave = () => {
        if (left) return;
        left = true;
        try {
          sessionStorage.setItem(KEY_T, String(Sound.bgmTime()));
        } catch (e) {}
        Sound.pauseBgm();
      };
      global.addEventListener("pagehide", onLeave);
      global.addEventListener("beforeunload", onLeave);
    }

    // 개발자 모드 배지 + 디버그 토글(Ctrl + ;)
    if (global.AR.isDebug() && !$(".dev-badge").length) {
      $(".container").append(
        "<div class='dev-badge'>DEV <span>Ctrl+; 로 해제</span></div>"
      );
    }
    $(document).on("keydown", function (e) {
      if (e.ctrlKey && (e.key === ";" || e.code === "Semicolon")) {
        e.preventDefault();
        try {
          if (localStorage.getItem("db") === "1") localStorage.removeItem("db");
          else localStorage.setItem("db", "1");
        } catch (err) {}
        location.reload();
      }
    });

    // 전역 이미지 프리페치 — 현재 화면을 본 뒤(idle) 다음 화면들을 미리 받아둠.
    prefetchFlow();
  });
})(window);
