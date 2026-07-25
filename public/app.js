let predictions = [];
let activeFilter = "all";

async function loadConfig() {
  const config = await fetch("/api/config").then(r => r.json());
  document.getElementById("paymentName").textContent = config.paymentName;
  document.getElementById("paymentAccount").textContent = config.paymentAccount;
  document.getElementById("paymentProvider").textContent = config.paymentProvider;

  const planGrid = document.getElementById("planGrid");
  const planSelect = document.getElementById("planSelect");
  planGrid.innerHTML = "";
  planSelect.innerHTML = '<option value="">Select a plan</option>';

  Object.entries(config.plans).forEach(([name, details], index) => {
    planSelect.insertAdjacentHTML("beforeend", `<option value="${name}">${name}</option>`);
    planGrid.insertAdjacentHTML("beforeend", `
      <article class="card plan-card ${index === 1 ? "featured" : ""}">
        ${index === 1 ? '<span class="badge">POPULAR</span>' : ""}
        <h3>${name}</h3>
        <div class="plan-detail"><span>Rollover</span><strong>${details.rollover}</strong></div>
        <div class="plan-detail"><span>Duration</span><strong>${details.duration}</strong></div>
        <a class="button secondary" href="#payment" data-plan="${name}">Choose plan</a>
      </article>
    `);
  });

  document.querySelectorAll("[data-plan]").forEach(btn => btn.addEventListener("click", () => {
    planSelect.value = btn.dataset.plan;
  }));
}

function renderPredictions() {
  const grid = document.getElementById("predictionGrid");
  const filtered = activeFilter === "all" ? predictions : predictions.filter(p => p.sport === activeFilter);
  if (!filtered.length) {
    grid.innerHTML = `<div class="empty">No predictions have been published yet. Check back soon.</div>`;
    return;
  }
  grid.innerHTML = filtered.map(p => `
    <article class="card prediction-card">
      <div class="sport">${p.sport} ${p.is_free ? "• FREE" : "• VIP"}</div>
      <h3>${escapeHtml(p.title)}</h3>
      <div class="pick">${escapeHtml(p.pick)}</div>
      <div class="meta"><span>Odds: ${escapeHtml(p.odds || "—")}</span><span>${escapeHtml(p.confidence || "—")}</span></div>
    </article>
  `).join("");
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, ch => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;" }[ch]));
}

async function init() {
  await loadConfig();
  predictions = await fetch("/api/predictions").then(r => r.json());
  renderPredictions();
  document.getElementById("year").textContent = new Date().getFullYear();

  document.querySelectorAll(".filter").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".filter").forEach(x => x.classList.remove("active"));
      btn.classList.add("active");
      activeFilter = btn.dataset.filter;
      renderPredictions();
    });
  });

  document.getElementById("paymentForm").addEventListener("submit", async e => {
    e.preventDefault();
    const message = document.getElementById("paymentMessage");
    message.textContent = "Submitting...";
    const result = await fetch("/api/vip-request", { method: "POST", body: new FormData(e.target) });
    const data = await result.json();
    message.textContent = data.message || data.error;
    if (result.ok) e.target.reset();
  });
}
init();