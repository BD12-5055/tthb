/* ===== Distribution Calculator ===== */

(function () {
  const form = document.getElementById("form-distribution");
  const resetBtn = document.querySelector('[data-reset="distribution"]');
  const inputTotWid = document.getElementById("dist-totWid");
  const inputMaxDis = document.getElementById("dist-maxDis");
  const inputSpa = document.getElementById("dist-spa");
  const result1El = document.getElementById("dist-calcDis");
  const result2El = document.getElementById("dist-nDis");

  const { toNumber, fmt, fmt0, addHistory } = CalcApp;

  function calculate() {
    const a = toNumber(inputTotWid.value); // total width
    const b = toNumber(inputMaxDis.value); // max distribution
    const c = toNumber(inputSpa.value); // spacing

    const num = Math.ceil(a / b); // number of distributions
    let calcDis = 0;
    if (num > 1) {
      calcDis = (a - c * (num + 1)) / num;
    }

    result1El.textContent = Number.isFinite(calcDis)
      ? `${fmt(calcDis)} mm`
      : "-";
    result2El.textContent = Number.isFinite(num) ? fmt0(num) : "-";

    return { a, b, c, num, calcDis };
  }

  function reset() {
    inputTotWid.value = "";
    inputMaxDis.value = "";
    inputSpa.value = "";
    result1El.textContent = "-";
    result2El.textContent = "-";
    inputTotWid.focus();
  }

  /* History renderer */
  CalcApp.registerHistoryRenderer("distribution", (h) => {
    const dt = new Date(h.ts);
    const stamp = dt.toLocaleString([], {
      dateStyle: "medium",
      timeStyle: "short",
    });
    return `
      <li class="history-item">
        <div class="row1">
          <time datetime="${dt.toISOString()}">${stamp}</time>
          <span class="tag"># Distributions: ${fmt0(h.num)}</span>
        </div>
        <div class="row2">
          A: ${fmt(h.a)} · B: ${fmt(h.b)} · C: ${fmt(h.c)} →
          <strong>Distribution: ${fmt(h.calcDis)} mm</strong>
        </div>
      </li>`;
  });

  /* Events */
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const r = calculate();
    if (r.num > 0 && Number.isFinite(r.calcDis)) {
      addHistory("distribution", r);
    }
  });

  resetBtn.addEventListener("click", reset);

  [inputTotWid, inputMaxDis, inputSpa].forEach((inp) =>
    inp.addEventListener("input", calculate),
  );
})();