/* ===== Calc Suite — Shared logic ===== */
/* Handles: tab switching, help overlay, bottom drawer, history */

const CalcApp = (() => {
  /* ----- State ----- */
  let currentTab = "distribution";
  const historyRenderers = {};

  /* ----- Helpers (shared across calculators) ----- */
  const toNumber = (val) => {
    const num = parseFloat(val);
    return Number.isFinite(num) ? num : 0;
  };
  const fmt = (v) => Number(v).toFixed(2);
  const fmt0 = (v) => Number(v).toFixed(0);
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

  /* ----- DOM refs ----- */
  const helpBtn = document.getElementById("helpButton");
  const overlay = document.getElementById("helpOverlay");
  const overlayClose = overlay.querySelector(".help-overlay__close");
  const drawer = document.getElementById("historyDrawer");
  const scrim = document.getElementById("drawerScrim");
  const drawerHandle = document.getElementById("drawerHandle");
  const historyList = document.getElementById("historyList");
  const clearHistoryBtn = document.getElementById("clearHistoryBtn");

  /* ===== Tab switching ===== */
  function switchTab(id) {
    currentTab = id;

    // Theme class on <body>
    document.body.className = `theme-${id}`;

    // Show/hide panels
    document.querySelectorAll(".calc-panel").forEach((p) => {
      p.classList.toggle("active", p.id === `panel-${id}`);
    });

    // Update tab buttons
    document.querySelectorAll(".tab").forEach((t) => {
      const active = t.dataset.tab === id;
      t.classList.toggle("active", active);
      t.setAttribute("aria-selected", active);
    });

    // Show correct help content
    document.querySelectorAll("[data-help]").forEach((h) => {
      h.hidden = h.dataset.help !== id;
    });

    // Re-render history for the active calculator
    renderHistory();
  }

  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => switchTab(tab.dataset.tab));
  });

  /* ===== Help overlay ===== */
  let lastActive = null;

  function lockScroll(lock) {
    document.documentElement.style.overflow = lock ? "hidden" : "";
    document.body.style.overflow = lock ? "hidden" : "";
  }

  function openHelp() {
    lastActive = document.activeElement;
    overlay.setAttribute("aria-hidden", "false");
    helpBtn.setAttribute("aria-expanded", "true");
    lockScroll(true);
    overlayClose?.focus({ preventScroll: true });
  }

  function closeHelp() {
    overlay.setAttribute("aria-hidden", "true");
    helpBtn.setAttribute("aria-expanded", "false");
    lockScroll(false);
    lastActive?.focus?.({ preventScroll: true });
  }

  helpBtn.addEventListener("click", openHelp);
  overlayClose.addEventListener("click", closeHelp);

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeHelp();
  });

  window.addEventListener("keydown", (e) => {
    if (overlay.getAttribute("aria-hidden") === "false") {
      if (e.key === "Escape") {
        e.preventDefault();
        closeHelp();
      } else if (e.key === "Tab") {
        const focusables = overlay.querySelectorAll(
          'button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );
        const list = Array.from(focusables).filter(
          (el) => el.offsetParent !== null,
        );
        if (list.length) {
          const first = list[0];
          const last = list[list.length - 1];
          if (e.shiftKey && document.activeElement === first) {
            last.focus();
            e.preventDefault();
          } else if (!e.shiftKey && document.activeElement === last) {
            first.focus();
            e.preventDefault();
          }
        }
      }
    }
  });

  /* ===== History (per-calculator localStorage) ===== */
  function getHistoryKey(calcId) {
    return `${calcId}_calc_history_v1`;
  }

  function getHistory(calcId) {
    try {
      const h = JSON.parse(
        localStorage.getItem(getHistoryKey(calcId)) || "[]",
      );
      return Array.isArray(h) ? h : [];
    } catch {
      return [];
    }
  }

  function addHistory(calcId, entry) {
    if (!entry.ts) entry.ts = Date.now();
    let history = getHistory(calcId);
    history.unshift(entry);
    history = history.slice(0, 100);
    try {
      localStorage.setItem(getHistoryKey(calcId), JSON.stringify(history));
    } catch {
      /* ignore storage errors */
    }
    if (calcId === currentTab) renderHistory();
  }

  function clearHistory(calcId) {
    try {
      localStorage.removeItem(getHistoryKey(calcId));
    } catch {
      /* ignore */
    }
    if (calcId === currentTab) renderHistory();
  }

  function registerHistoryRenderer(calcId, fn) {
    historyRenderers[calcId] = fn;
  }

  function renderHistory() {
    const history = getHistory(currentTab);
    if (!history.length) {
      historyList.innerHTML =
        '<li class="empty">No calculations yet</li>';
      return;
    }
    const renderer = historyRenderers[currentTab];
    if (!renderer) {
      historyList.innerHTML =
        '<li class="empty">History not available</li>';
      return;
    }
    historyList.innerHTML = history.map(renderer).join("");
  }

  clearHistoryBtn.addEventListener("click", () => {
    clearHistory(currentTab);
  });

  /* ===== Bottom drawer (shared) ===== */
  let startY = 0;
  let startTranslate = 0;
  let currentTranslate = 0;
  const PEEK = 68;
  let closedY = 0;

  function computeClosedY() {
    closedY = drawer.getBoundingClientRect().height - PEEK;
    closedY = Math.max(0, closedY);
  }

  function setTranslate(y, animate = true) {
    currentTranslate = clamp(y, 0, closedY);
    drawer.style.transform = `translateY(${currentTranslate}px)`;
    drawer.classList.toggle("dragging", !animate);
    const openness = closedY === 0 ? 0 : 1 - currentTranslate / closedY;
    scrim.style.opacity = (0.45 * openness).toFixed(3);
    scrim.classList.toggle("visible", openness > 0.02);
  }

  function isOpen() {
    return currentTranslate <= 2;
  }

  function openDrawer() {
    drawer.setAttribute("aria-hidden", "false");
    setTranslate(0, true);
  }

  function closeDrawer() {
    drawer.setAttribute("aria-hidden", "true");
    setTranslate(closedY, true);
  }

  function toggleDrawer() {
    isOpen() ? closeDrawer() : openDrawer();
  }

  /* Pointer drag handlers */
  function onPointerDown(e) {
    if (!e.target.closest("#drawerHandle")) return;
    drawer.classList.add("dragging");
    startY = e.clientY;
    startTranslate = currentTranslate;
    drawerHandle.setPointerCapture?.(e.pointerId);
    e.preventDefault();
  }

  function onPointerMove(e) {
    if (!drawer.classList.contains("dragging")) return;
    const delta = e.clientY - startY;
    setTranslate(startTranslate + delta, false);
  }

  function onPointerUp(e) {
    if (!drawer.classList.contains("dragging")) return;
    drawer.classList.remove("dragging");
    const THRESHOLD = Math.min(120, closedY * 0.35);
    if (currentTranslate < closedY - THRESHOLD) {
      openDrawer();
    } else {
      closeDrawer();
    }
    drawerHandle.releasePointerCapture?.(e.pointerId);
  }

  drawerHandle.addEventListener("click", () => {
    if (!drawer.classList.contains("dragging")) toggleDrawer();
  });

  scrim.addEventListener("click", closeDrawer);

  drawerHandle.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);
  window.addEventListener("pointercancel", onPointerUp);

  window.addEventListener("resize", () => {
    const wasOpen = isOpen();
    computeClosedY();
    setTranslate(wasOpen ? 0 : closedY, false);
  });

  /* ===== Init ===== */
  renderHistory();
  requestAnimationFrame(() => {
    computeClosedY();
    setTranslate(closedY, false);
  });

  /* ===== Public API ===== */
  return {
    get currentTab() {
      return currentTab;
    },
    switchTab,
    toNumber,
    fmt,
    fmt0,
    clamp,
    addHistory,
    clearHistory,
    registerHistoryRenderer,
    renderHistory,
    openDrawer,
  };
})();