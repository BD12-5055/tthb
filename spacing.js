/* ===== Spacing Calculator ===== */

(function () {
  const form = document.getElementById("form-spacing");
  const resetBtn = document.querySelector('[data-reset="spacing"]');
  const inputTotWid = document.getElementById("spa-totWid");
  const inputProWid = document.getElementById("spa-proWid");
  const inputDesSpa = document.getElementById("spa-desSpa");
  const result1El = document.getElementById("spa-calcSpa");
  const result2El = document.getElementById("spa-nPro");

  const { toNumber, fmt, fmt0, addHistory } = CalcApp;

  function calculate() {
    const a = toNumber(inputTotWid.value); // total width
    const b = toNumber(inputProWid.value); // profile width
    const c = toNumber(inputDesSpa.value); // desired spacing

    const num = Math.round((a - b) / (b + c) + 1); // number of profiles
    let calcSpa = 0;
    if (num > 1) {
      calcSpa = (a - b) / (num - 1) - b;
    }

    result1El.textContent = Number.isFinite(calcSpa)
      ? `${fmt(calcSpa)} mm`
      : "-";
    result2El.textContent = Number.isFinite(num) ? fmt0(num) : "-";

    return { a, b, c, num, calcSpa };
  }

  function reset() {
    inputTotWid.value = "";
    inputProWid.value = "";
    inputDesSpa.value = "";
    result1El.textContent = "-";
    result2El.textContent = "-";
    inputTotWid.focus();
  }

  /* History renderer */
  CalcApp.registerHistoryRenderer("spacing", (h) => {
    const dt = new Date(h.ts);
    const stamp = dt.toLocaleString([], {
      dateStyle: "medium",
      timeStyle: "short",
    });
    return `
      <li class="history-item">
        <div class="row1">
          <time datetime="${dt.toISOString()}">${stamp}</time>
          <span class="tag"># Profiles: ${fmt0(h.num)}</span>
        </div>
        <div class="row2">
          A: ${fmt(h.a)} · B: ${fmt(h.b)} · C: ${fmt(h.c)} →
          <strong>Spacing: ${fmt(h.calcSpa)} mm</strong>
        </div>
      </li>`;
  });

  /* Events */
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const r = calculate();
    if (r.num > 0 && Number.isFinite(r.calcSpa)) {
      addHistory("spacing", r);
    }
  });

  resetBtn.addEventListener("click", reset);

  [inputTotWid, inputProWid, inputDesSpa].forEach((inp) =>
    inp.addEventListener("input", calculate),
  );
})();