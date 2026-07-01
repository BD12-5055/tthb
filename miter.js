/* ===== Miter Calculator ===== */

(function () {
  const form = document.getElementById("form-miter");
  const resetBtn = document.querySelector('[data-reset="miter"]');
  const inputAngle = document.getElementById("miter-angle");
  const inputDepthA = document.getElementById("miter-depthA");
  const inputDepthB = document.getElementById("miter-depthB");
  const result1El = document.getElementById("miter-miterA");
  const result2El = document.getElementById("miter-miterB");

  const { toNumber, fmt, addHistory } = CalcApp;

  function calculate() {
    const theta_deg = toNumber(inputAngle.value);
    const theta = (theta_deg * Math.PI) / 180;
    const depthA = toNumber(inputDepthA.value);
    const depthB = toNumber(inputDepthB.value);

    const narrower = Math.min(depthA, depthB);
    const wider = Math.max(depthA, depthB);

    const narrower_angle_rad = Math.atan(
      (wider * Math.sin(theta)) / (narrower + wider * Math.cos(theta)),
    );
    const narrower_angle = (narrower_angle_rad * 180) / Math.PI;
    const wider_angle = theta_deg - narrower_angle;

    let miterA, miterB;
    if (depthA <= depthB) {
      miterA = narrower_angle;
      miterB = wider_angle;
    } else {
      miterA = wider_angle;
      miterB = narrower_angle;
    }

    result1El.textContent = Number.isFinite(miterA)
      ? `${fmt(miterA)}°`
      : "-";
    result2El.textContent = Number.isFinite(miterB)
      ? `${fmt(miterB)}°`
      : "-";

    return { theta: theta_deg, depthA, depthB, miterA, miterB };
  }

  function reset() {
    inputAngle.value = "";
    inputDepthA.value = "";
    inputDepthB.value = "";
    result1El.textContent = "-";
    result2El.textContent = "-";
    inputAngle.focus();
  }

  /* History renderer */
  CalcApp.registerHistoryRenderer("miter", (h) => {
    const dt = new Date(h.ts);
    const stamp = dt.toLocaleString([], {
      dateStyle: "medium",
      timeStyle: "short",
    });
    return `
      <li class="history-item">
        <div class="row1">
          <time datetime="${dt.toISOString()}">${stamp}</time>
          <span class="tag">Angle: ${fmt(h.theta)}°</span>
        </div>
        <div class="row2">
          Depth A: ${fmt(h.depthA)} · Depth B: ${fmt(h.depthB)} →
          <strong>Miter A: ${fmt(h.miterA)}° · Miter B: ${fmt(h.miterB)}°</strong>
        </div>
      </li>`;
  });

  /* Events */
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const r = calculate();
    if (
      r.theta > 0 &&
      r.depthA > 0 &&
      r.depthB > 0 &&
      Number.isFinite(r.miterA) &&
      Number.isFinite(r.miterB)
    ) {
      addHistory("miter", r);
    }
  });

  resetBtn.addEventListener("click", reset);

  [inputAngle, inputDepthA, inputDepthB].forEach((inp) =>
    inp.addEventListener("input", calculate),
  );
})();