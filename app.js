// ============================================================
//  Formula Registry – add new formula files, register here
// ============================================================
const FORMULAS = [Formula1, Formula2];

// ============================================================
//  Initialise
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
  populateFormulaDropdown();
  loadDefaults();
});

function populateFormulaDropdown() {
  const select = document.getElementById("formulaSelect");
  FORMULAS.forEach((f) => {
    const opt = document.createElement("option");
    opt.value = f.id;
    opt.textContent = f.name;
    select.appendChild(opt);
  });
}

// Pre-fill sample data so the user can compute immediately
function loadDefaults() {
  document.getElementById("totalPlayers").value  = 100;
  document.getElementById("totalEntries").value  = 120;
  document.getElementById("regFeeCoins").value   = 100;
  document.getElementById("regFeeGems").value    = 10;
  document.getElementById("regFeeGG").value      = 5;

  // Distribution rules
  [
    { s: 0,  e: 10,  share: 50 },
    { s: 10, e: 30,  share: 30 },
    { s: 30, e: 100, share: 20 },
  ].forEach(r => addDistributionRule(r.s, r.e, r.share));

  // Trophy rules
  [
    { s: 0,  e: 20,  t: 100 },
    { s: 20, e: 50,  t: 50  },
    { s: 50, e: 100, t: 25  },
  ].forEach(r => addTrophyRule(r.s, r.e, r.t));

  // Extra rank-wise rewards
  [
    { coins: 500, gems: 100, trophies: 50, GG: 50 },
    { coins: 300, gems: 75,  trophies: 30, GG: 30 },
    { coins: 200, gems: 50,  trophies: 20, GG: 20 },
  ].forEach(r => addExtraReward(r.coins, r.gems, r.trophies, r.GG));
}

// ============================================================
//  Dynamic row builders
// ============================================================
function addDistributionRule(startPct = "", endPct = "", sharePct = "") {
  const container = document.getElementById("distributionRules");
  const row = document.createElement("div");
  row.className = "rule-row";
  row.innerHTML = `
    <input type="number" placeholder="0"   value="${startPct}" min="0" max="100" class="dist-start" />
    <input type="number" placeholder="100" value="${endPct}"   min="0" max="100" class="dist-end"   />
    <input type="number" placeholder="50"  value="${sharePct}" min="0" max="100" class="dist-share" />
    <button class="btn-remove" onclick="removeRow(this)" title="Remove">×</button>
  `;
  container.appendChild(row);
}

function addTrophyRule(startPct = "", endPct = "", trophies = "") {
  const container = document.getElementById("trophyRules");
  const row = document.createElement("div");
  row.className = "rule-row";
  row.innerHTML = `
    <input type="number" placeholder="0"   value="${startPct}" min="0" max="100" class="trophy-start"   />
    <input type="number" placeholder="100" value="${endPct}"   min="0" max="100" class="trophy-end"     />
    <input type="number" placeholder="50"  value="${trophies}" min="0"           class="trophy-trophies"/>
    <button class="btn-remove" onclick="removeRow(this)" title="Remove">×</button>
  `;
  container.appendChild(row);
}

function addExtraReward(coins = "", gems = "", trophies = "", GG = "") {
  const container  = document.getElementById("extraRewards");
  const rankNumber = container.children.length + 1;

  const badgeClass =
    rankNumber === 1 ? "rank-badge" :
    rankNumber === 2 ? "rank-badge rank-2" :
    rankNumber === 3 ? "rank-badge rank-3" : "rank-badge";

  const medal =
    rankNumber === 1 ? "🥇" :
    rankNumber === 2 ? "🥈" :
    rankNumber === 3 ? "🥉" : `#${rankNumber}`;

  const card = document.createElement("div");
  card.className = "extra-reward-card";
  card.innerHTML = `
    <div class="extra-reward-header">
      <span class="${badgeClass}">${medal} Rank ${rankNumber}</span>
      <button class="btn-remove" onclick="removeExtraReward(this)" title="Remove">×</button>
    </div>
    <div class="extra-reward-fields">
      <div class="form-field">
        <label>🪙 Coins</label>
        <input type="number" value="${coins}" min="0" class="er-coins" placeholder="0"/>
      </div>
      <div class="form-field">
        <label>💎 Gems</label>
        <input type="number" value="${gems}" min="0" class="er-gems" placeholder="0"/>
      </div>
      <div class="form-field">
        <label>🏆 Trophies</label>
        <input type="number" value="${trophies}" min="0" class="er-trophies" placeholder="0"/>
      </div>
      <div class="form-field">
        <label>⭐ GG</label>
        <input type="number" value="${GG}" min="0" class="er-gg" placeholder="0"/>
      </div>
      <div class="form-field">
        <label>🎁 Physical</label>
        <input type="text" class="er-physical" placeholder="item1, item2" />
      </div>
    </div>
  `;
  container.appendChild(card);
}

function removeRow(btn) {
  btn.closest(".rule-row").remove();
}

function removeExtraReward(btn) {
  btn.closest(".extra-reward-card").remove();
  // Refresh rank numbers
  const container = document.getElementById("extraRewards");
  Array.from(container.children).forEach((card, i) => {
    const rankNumber = i + 1;
    const badgeClass =
      rankNumber === 1 ? "rank-badge" :
      rankNumber === 2 ? "rank-badge rank-2" :
      rankNumber === 3 ? "rank-badge rank-3" : "rank-badge";
    const medal =
      rankNumber === 1 ? "🥇" :
      rankNumber === 2 ? "🥈" :
      rankNumber === 3 ? "🥉" : `#${rankNumber}`;
    const badge = card.querySelector(".rank-badge, .rank-badge.rank-2, .rank-badge.rank-3");
    if (badge) {
      badge.className = badgeClass;
      badge.textContent = `${medal} Rank ${rankNumber}`;
    }
  });
}

// ============================================================
//  Read form data
// ============================================================
function getFormData() {
  const totalPlayers       = parseInt(document.getElementById("totalPlayers").value) || 0;
  const totalEntries       = parseInt(document.getElementById("totalEntries").value) || 0;
  const registrationFeeCoins = parseFloat(document.getElementById("regFeeCoins").value) || 0;
  const registrationFeeGems  = parseFloat(document.getElementById("regFeeGems").value)  || 0;
  const registrationFeeGG    = parseFloat(document.getElementById("regFeeGG").value)    || 0;
  const selectedFormula    = document.getElementById("formulaSelect").value;

  // Distribution rules
  const prizeDistributionRules = [];
  document.querySelectorAll("#distributionRules .rule-row").forEach((row) => {
    prizeDistributionRules.push({
      rankStartPercent: parseFloat(row.querySelector(".dist-start").value) || 0,
      rankEndPercent:   parseFloat(row.querySelector(".dist-end").value)   || 0,
      sharePercent:     parseFloat(row.querySelector(".dist-share").value) || 0,
    });
  });

  // Trophy rules
  const trophyDistributionRules = [];
  document.querySelectorAll("#trophyRules .rule-row").forEach((row) => {
    trophyDistributionRules.push({
      rankStartPercent:      parseFloat(row.querySelector(".trophy-start").value)    || 0,
      rankEndPercent:        parseFloat(row.querySelector(".trophy-end").value)      || 0,
      trophiesPerParticipant: parseFloat(row.querySelector(".trophy-trophies").value) || 0,
    });
  });

  // Extra rank-wise rewards
  const extraRankWiseRewards = [];
  document.querySelectorAll("#extraRewards .extra-reward-card").forEach((card) => {
    const physicalRaw = card.querySelector(".er-physical").value.trim();
    const physicalRewards = physicalRaw
      ? physicalRaw.split(",").map(s => s.trim()).filter(Boolean)
      : [];
    extraRankWiseRewards.push({
      coins:    parseFloat(card.querySelector(".er-coins").value)    || 0,
      gems:     parseFloat(card.querySelector(".er-gems").value)     || 0,
      trophies: parseFloat(card.querySelector(".er-trophies").value) || 0,
      GG:       parseFloat(card.querySelector(".er-gg").value)       || 0,
      physicalRewards,
    });
  });

  return {
    totalPlayers,
    totalEntries,
    registrationFeeCoins,
    registrationFeeGems,
    registrationFeeGG,
    selectedFormula,
    prizeDistributionRules,
    trophyDistributionRules,
    extraRankWiseRewards,
  };
}

// ============================================================
//  Compute
// ============================================================
function computeResults() {
  const data = getFormData();

  // Validate
  if (data.totalPlayers < 1) {
    showToast("Please enter a valid number of players.");
    return;
  }
  if (data.totalEntries < 1) {
    showToast("Please enter a valid number of entries.");
    return;
  }
  if (data.prizeDistributionRules.length === 0) {
    showToast("Add at least one prize distribution rule.");
    return;
  }

  // Find formula
  const formula = FORMULAS.find(f => f.id === data.selectedFormula);
  if (!formula) {
    showToast("Selected formula not found.");
    return;
  }

  let results;
  try {
    results = formula.compute({
      totalPlayers:        data.totalPlayers,
      totalEntries:        data.totalEntries,
      registrationFeeCoins: data.registrationFeeCoins,
      registrationFeeGems:  data.registrationFeeGems,
      registrationFeeGG:    data.registrationFeeGG,
      prizeDistributionRules:  data.prizeDistributionRules,
      trophyDistributionRules: data.trophyDistributionRules,
      extraRankWiseRewards:    data.extraRankWiseRewards,
    });
  } catch (err) {
    showToast(err.message || "Computation error.");
    return;
  }

  // Store for PDF export
  window._lastResults   = results;
  window._lastInputData = data;

  renderResults(results, data);
}

// ============================================================
//  Render Results
// ============================================================
function renderResults(results, data) {
  const panel = document.getElementById("resultsPanel");
  panel.style.display = "block";

  // Scroll to results
  setTimeout(() => panel.scrollIntoView({ behavior: "smooth", block: "start" }), 50);

  // Meta chips
  document.getElementById("resultsMeta").innerHTML = `
    <span class="meta-chip">👥 ${data.totalPlayers} Players</span>
    <span class="meta-chip">🎫 ${data.totalEntries} Entries</span>
  `;

  // Summary cards (top 3 totals)
  const totalCoinsPool = data.registrationFeeCoins * data.totalEntries;
  const totalGemsPool  = data.registrationFeeGems  * data.totalEntries;
  const totalGGPool    = data.registrationFeeGG    * data.totalEntries;

  document.getElementById("summaryCards").innerHTML = `
    <div class="summary-card">
      <span class="card-icon">🪙</span>
      <div class="card-value">${totalCoinsPool.toLocaleString()}</div>
      <div class="card-label">Total Coins Pool</div>
    </div>
    <div class="summary-card">
      <span class="card-icon">💎</span>
      <div class="card-value">${totalGemsPool.toLocaleString()}</div>
      <div class="card-label">Total Gems Pool</div>
    </div>
    <div class="summary-card">
      <span class="card-icon">⭐</span>
      <div class="card-value">${totalGGPool.toLocaleString()}</div>
      <div class="card-label">Total GG Pool</div>
    </div>
    <div class="summary-card">
      <span class="card-icon">🏅</span>
      <div class="card-value">${results.length}</div>
      <div class="card-label">Ranked Players</div>
    </div>
  `;

  // Table body
  const tbody = document.getElementById("resultsBody");
  tbody.innerHTML = "";

  results.forEach((row) => {
    const rankClass =
      row.rank === 1 ? "rank-1" :
      row.rank === 2 ? "rank-2" :
      row.rank === 3 ? "rank-3" : "";

    const rankDisplay =
      row.rank === 1 ? "🥇 1" :
      row.rank === 2 ? "🥈 2" :
      row.rank === 3 ? "🥉 3" : row.rank;

    const physicalHTML =
      row.physicalRewards && row.physicalRewards.length > 0
        ? row.physicalRewards.map(r => `<span class="physical-reward-tag">${r}</span>`).join("")
        : `<span class="no-physical">—</span>`;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="rank-cell ${rankClass}">${rankDisplay}</td>
      <td class="${row.coins    > 0 ? 'value-coins'  : 'value-zero'}">${row.coins.toLocaleString()}</td>
      <td class="${row.gems     > 0 ? 'value-gems'   : 'value-zero'}">${row.gems.toLocaleString()}</td>
      <td class="${row.trophies > 0 ? 'value-trophy' : 'value-zero'}">${row.trophies.toLocaleString()}</td>
      <td class="${row.gg       > 0 ? 'value-gg'     : 'value-zero'}">${row.gg.toLocaleString()}</td>
      <td>${physicalHTML}</td>
    `;
    tbody.appendChild(tr);
  });
}

// ============================================================
//  Toast notification
// ============================================================
function showToast(message) {
  let toast = document.getElementById("appToast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "appToast";
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3500);
}


// ============================================================
//  PDF Export
// ============================================================
function downloadPDF() {
  if (!window._lastResults || !window._lastInputData) {
    showToast("No results to export. Please compute first.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const results = window._lastResults;
  const data    = window._lastInputData;

  const PAGE_W    = 210;
  const MARGIN    = 14;
  const CONTENT_W = PAGE_W - MARGIN * 2;

  // ── Palette ───────────────────────────────────────────────
  const WHITE    = [255, 255, 255];
  const ROW_ALT  = [245, 247, 252];   // very light blue-grey for alternate rows
  const NEAR_WH  = [248, 249, 252];
  const DARK     = [28,  32,  56];
  const MUTED    = [100, 105, 140];
  const BORDER   = [215, 218, 232];

  const INDIGO   = [63,  81,  181];

  // Header band colours (dark bg, white text)
  const HDR_GOLD   = [160, 115,  10];
  const HDR_GREEN  = [25,  115,  70];
  const HDR_PURPLE = [90,  55,  185];
  const HDR_BLUE   = [40,  90,  200];
  const HDR_ROSE_GOLD = [200, 120, 100];
  const HDR_GREY_ALT = [110, 110, 120]

  // Soft pastel row tints (light bg, dark text — used in body rows)
  const TINT_GOLD   = [255, 251, 230];
  const TINT_GREEN  = [232, 250, 241];
  const TINT_PURPLE = [243, 238, 255];
  const TINT_BLUE   = [232, 241, 255];

  // Top-3 rank row highlights
  const RANK1_BG = [255, 249, 215];
  const RANK2_BG = [240, 242, 248];
  const RANK3_BG = [255, 242, 225];

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const rgb = (c) => ({ r: c[0], g: c[1], b: c[2] });

  function sf(...c) { doc.setFillColor(...c); }
  function rf(x,y,w,h) { doc.rect(x,y,w,h,"F"); }
  function st(...c)  { doc.setTextColor(...c); }

  // ── HEADER BANNER ─────────────────────────────────────────
  sf(...INDIGO);
  rf(0, 0, PAGE_W, 32);
  sf(245, 200, 66);
  rf(0, 30, PAGE_W, 2);

  // Badge circle
  sf(245, 200, 66);
  doc.circle(MARGIN + 7, 16, 6.5, "F");
  doc.setFontSize(9);
  st(...DARK);
  doc.setFont("helvetica", "bold");
  doc.text("GP", MARGIN + 4.2, 18.5);

  const formulaObj = FORMULAS.find(f => f.id === data.selectedFormula);

  doc.setFontSize(16);
  st(...WHITE);
  doc.setFont("helvetica", "bold");
  doc.text("Tournament Prize Distribution", MARGIN + 18, 13);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  st(200, 210, 255);
  doc.text(
    `Formula: ${formulaObj?.name ?? data.selectedFormula}   |   Generated: ${new Date().toLocaleString()}`,
    MARGIN + 18, 21
  );

  doc.setFontSize(9.5);
  doc.setFont("helvetica", "italic");
  st(200, 210, 255);
  doc.text("Author: Pritesh Srv", PAGE_W - MARGIN, 10, { align: "right" });

  let curY = 40;

  // ── Section header bar ────────────────────────────────────
  function sectionHeader(label, y, bg) {
    sf(...bg);
    rf(MARGIN, y, CONTENT_W, 8);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    st(...WHITE);
    doc.text(label.toUpperCase(), MARGIN + 4, y + 5.5);
    return y + 12;
  }

  // ── Stat card helper ──────────────────────────────────────
  function statCard(x, y, w, h, label, value, tint, textColor) {
    sf(...tint);
    doc.setDrawColor(...BORDER);
    doc.setLineWidth(0.25);
    doc.roundedRect(x, y, w, h, 2, 2, "FD");
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    st(...MUTED);
    doc.text(label.toUpperCase(), x + w / 2, y + 5.5, { align: "center" });
    doc.setFontSize(10.5);
    doc.setFont("helvetica", "bold");
    st(...textColor);
    doc.text(String(value), x + w / 2, y + 13, { align: "center" });
  }

  // ── Shared table builder ───────────────────────────────────
  // rowTint: light pastel applied to ALL body rows (alternating row is slightly darker)
  function makeTable(startY, head, body, hdrBg, rowTint, colStyles, didParseCell) {
    const altTint = rowTint.map(v => Math.max(0, v - 8)); // slightly darker for alt rows
    doc.autoTable({
      startY,
      margin: { left: MARGIN, right: MARGIN },
      tableWidth: CONTENT_W,
      showHead: "everyPage",
      head: [head],
      body,
      styles: {
        font: "helvetica",
        fontSize: 8.5,
        textColor: rgb(DARK),
        fillColor: rgb(rowTint),
        lineColor: rgb(BORDER),
        lineWidth: 0.25,
        cellPadding: { top: 3, bottom: 3, left: 4, right: 4 },
      },
      headStyles: {
        fillColor: rgb(hdrBg),
        textColor: rgb(WHITE),
        fontStyle: "bold",
        fontSize: 8,
        halign: "center",
      },
      alternateRowStyles: {
        fillColor: rgb(altTint),
      },
      columnStyles: colStyles || {},
      didParseCell: didParseCell || undefined,
    });
    return doc.lastAutoTable.finalY + 10;
  }

  // ── INPUT SUMMARY CARDS ───────────────────────────────────
  curY = sectionHeader("Input Summary", curY, INDIGO);

  const totalCoinsPool = data.registrationFeeCoins * data.totalEntries;
  const totalGemsPool  = data.registrationFeeGems  * data.totalEntries;
  const totalGGPool    = data.registrationFeeGG    * data.totalEntries;

  const CARD_W = (CONTENT_W - 5 * 3) / 3;
  let cx = MARGIN;
  [
    { label: "Players",   value: data.totalPlayers.toLocaleString(),         tint: TINT_BLUE,   text: HDR_BLUE   },
    { label: "Entries",   value: data.totalEntries.toLocaleString(),          tint: TINT_PURPLE, text: HDR_PURPLE },
    { label: "Coin Fee",  value: data.registrationFeeCoins.toLocaleString(),  tint: TINT_GOLD,   text: HDR_GOLD   },
    { label: "Gem Fee",   value: data.registrationFeeGems.toLocaleString(),   tint: TINT_PURPLE, text: HDR_PURPLE },
    { label: "GG Fee",    value: data.registrationFeeGG.toLocaleString(),     tint: TINT_GREEN,  text: HDR_GREEN  },
    { label: "Formula",   value: (formulaObj?.name ?? data.selectedFormula).split("–")[0].trim(), tint: TINT_BLUE, text: HDR_BLUE },
  ].forEach((card, i) => {
    if (i === 3) { cx = MARGIN; curY += 20; }
    statCard(cx, curY, CARD_W, 17, card.label, card.value, card.tint, card.text);
    cx += CARD_W + 3;
  });
  curY += 26;

  // ── PRIZE POOL TOTAL CARDS ────────────────────────────────
  curY = sectionHeader("Total Prize Pools", curY, HDR_GOLD);
  const POOL_W = (CONTENT_W - 3 * 3) / 4;
  cx = MARGIN;
  [
    { label: "Coins Pool",     value: totalCoinsPool.toLocaleString(), tint: TINT_GOLD,   text: HDR_GOLD   },
    { label: "Gems Pool",      value: totalGemsPool.toLocaleString(),  tint: TINT_PURPLE, text: HDR_PURPLE },
    { label: "GG Pool",        value: totalGGPool.toLocaleString(),    tint: TINT_GREEN,  text: HDR_GREEN  },
    { label: "Ranked Players", value: results.length.toLocaleString(), tint: TINT_BLUE,   text: HDR_BLUE   },
  ].forEach(c => {
    statCard(cx, curY, POOL_W, 17, c.label, c.value, c.tint, c.text);
    cx += POOL_W + 3;
  });
  curY += 26;

  // ── DISTRIBUTION RULES TABLE ──────────────────────────────
  if (data.prizeDistributionRules.length > 0) {
    curY = sectionHeader("Entry Fee Distribution Rules", curY, HDR_PURPLE);
    curY = makeTable(
      curY,
      ["Rank Start %", "Rank End %", "Share %"],
      data.prizeDistributionRules.map(r => [
        `${r.rankStartPercent}%`, `${r.rankEndPercent}%`, `${r.sharePercent}%`
      ]),
      HDR_PURPLE,
      TINT_PURPLE,
      { 0:{halign:"center"}, 1:{halign:"center"}, 2:{halign:"center"} }
    );
  }

  // ── TROPHY RULES TABLE ────────────────────────────────────
  if (data.trophyDistributionRules.length > 0) {
    curY = sectionHeader("Trophy Distribution Rules", curY, HDR_GREEN);
    curY = makeTable(
      curY,
      ["Rank Start %", "Rank End %", "Trophies / Player"],
      data.trophyDistributionRules.map(r => [
        `${r.rankStartPercent}%`, `${r.rankEndPercent}%`, r.trophiesPerParticipant.toLocaleString()
      ]),
      HDR_GREEN,
      TINT_GREEN,
      { 0:{halign:"center"}, 1:{halign:"center"}, 2:{halign:"center"} }
    );
  }

  // ── EXTRA RANK-WISE REWARDS TABLE ─────────────────────────
  if (data.extraRankWiseRewards.length > 0) {
    curY = sectionHeader("Extra Rank-Wise Rewards", curY, HDR_GOLD);
    curY = makeTable(
      curY,
      ["Rank", "Coins", "Gems", "Trophies", "GG", "Physical Rewards"],
      data.extraRankWiseRewards.map((r, i) => [
        `#${i + 1}`,
        r.coins.toLocaleString(),
        r.gems.toLocaleString(),
        r.trophies.toLocaleString(),
        r.GG.toLocaleString(),
        r.physicalRewards.length ? r.physicalRewards.join(", ") : "-",
      ]),
      HDR_GOLD,
      TINT_GOLD,
      {
        0:{halign:"center"},
        1:{halign:"right"}, 2:{halign:"right"},
        3:{halign:"right"}, 4:{halign:"right"},
        5:{halign:"left"},
      }
    );
  }

  // ── RESULTS TABLE ─────────────────────────────────────────
  curY = sectionHeader("Prize Distribution Results", curY, HDR_GREY_ALT);

  // No emojis — use plain text medal labels
  const rankLabel = (rank) =>
    rank === 1 ? "#1  Gold"   :
    rank === 2 ? "#2  Silver" :
    rank === 3 ? "#3  Bronze" : `#${rank}`;

  doc.autoTable({
    startY: curY,
    margin: { left: MARGIN, right: MARGIN },
    tableWidth: CONTENT_W,
    showHead: "everyPage",
    head: [["Rank", "Coins", "Gems", "Trophies", "GG", "Physical Rewards"]],
    body: results.map(r => [
      rankLabel(r.rank),
      r.coins.toLocaleString(),
      r.gems.toLocaleString(),
      r.trophies.toLocaleString(),
      r.gg.toLocaleString(),
      r.physicalRewards.length ? r.physicalRewards.join(", ") : "-",
    ]),
    styles: {
      font: "helvetica",
      fontSize: 8.5,
      textColor: rgb(DARK),
      fillColor: rgb(TINT_GREEN),
      lineColor: rgb(BORDER),
      lineWidth: 0.25,
      cellPadding: { top: 3, bottom: 3, left: 4, right: 4 },
    },
    headStyles: {
      fillColor: rgb(HDR_GREEN),
      textColor: rgb(WHITE),
      fontStyle: "bold",
      fontSize: 8,
      halign: "center",
    },
    alternateRowStyles: {
      fillColor: rgb(TINT_GREEN.map(v => Math.max(0, v - 8))),
    },
    columnStyles: {
      0: { halign: "center", fontStyle: "bold" },
      1: { halign: "right", textColor: rgb(HDR_GOLD)   },
      2: { halign: "right", textColor: rgb(HDR_PURPLE) },
      3: { halign: "right", textColor: rgb(HDR_GREEN)  },
      4: { halign: "right", textColor: rgb(HDR_BLUE)   },
      5: { halign: "left",  textColor: rgb(MUTED)      },
    },
    // Soft highlight for top 3 ranks, plain text rank label colours
    didParseCell(d) {
      if (d.section !== "body") return;
      const rank = results[d.row.index]?.rank;
      if (rank === 1) {
        d.cell.styles.fillColor = rgb(RANK1_BG);
        if (d.column.index === 0) {
          d.cell.styles.textColor = rgb(HDR_GOLD);
          d.cell.styles.fontStyle = "bold";
        }
      } else if (rank === 2) {
        d.cell.styles.fillColor = rgb(RANK2_BG);
        if (d.column.index === 0) {
          d.cell.styles.textColor = rgb([80, 85, 120]);
          d.cell.styles.fontStyle = "bold";
        }
      } else if (rank === 3) {
        d.cell.styles.fillColor = rgb(RANK3_BG);
        if (d.column.index === 0) {
          d.cell.styles.textColor = rgb([160, 80, 20]);
          d.cell.styles.fontStyle = "bold";
        }
      }
    },
  });

  // ── FOOTER ON ALL PAGES ────────────────────────────────────
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    sf(...INDIGO);
    rf(0, 289, PAGE_W, 0.8);
    sf(...NEAR_WH);
    rf(0, 289.8, PAGE_W, 8);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    st(...MUTED);
    doc.text("Tournament Prize Simulator", MARGIN, 295);
    doc.text(`Page ${p} of ${totalPages}`, PAGE_W - MARGIN, 295, { align: "right" });
  }

  // ── SAVE ──────────────────────────────────────────────────
  const ts = new Date().toISOString().slice(0,16).replace("T","_").replace(/:/g,"-");
  doc.save(`prize_distribution_${ts}.pdf`);
}

// ============================================================
//  Copy Result JSON to Clipboard
// ============================================================
function copyResultJSON() {
  if (!window._lastResults || !window._lastInputData) {
    showToast("No results to copy. Please compute first.");
    return;
  }

  const data    = window._lastInputData;
  const results = window._lastResults;
  const formulaObj = FORMULAS.find(f => f.id === data.selectedFormula);

  const output = {
    meta: {
      formula:             formulaObj?.name ?? data.selectedFormula,
      totalPlayers:        data.totalPlayers,
      totalEntries:        data.totalEntries,
      registrationFeeCoins: data.registrationFeeCoins,
      registrationFeeGems:  data.registrationFeeGems,
      registrationFeeGG:    data.registrationFeeGG,
      totalCoinsPool:      data.registrationFeeCoins * data.totalEntries,
      totalGemsPool:       data.registrationFeeGems  * data.totalEntries,
      totalGGPool:         data.registrationFeeGG    * data.totalEntries,
      generatedAt:         new Date().toISOString(),
    },
    config: {
      prizeDistributionRules:  data.prizeDistributionRules,
      trophyDistributionRules: data.trophyDistributionRules,
      extraRankWiseRewards:    data.extraRankWiseRewards,
    },
    results: results.map(r => ({
      rank:            r.rank,
      coins:           r.coins,
      gems:            r.gems,
      trophies:        r.trophies,
      gg:              r.gg,
      physicalRewards: r.physicalRewards,
    })),
  };

  const jsonStr = JSON.stringify(output, null, 2);

  navigator.clipboard.writeText(jsonStr).then(() => {
    // Visual feedback on the button
    const btn = document.querySelector(".btn-copy-json");
    if (btn) {
      btn.classList.add("copied");
      btn.innerHTML = `<span>&#10003;</span> Copied!`;
      setTimeout(() => {
        btn.classList.remove("copied");
        btn.innerHTML = `<span>&#10697;</span> Copy JSON`;
      }, 2000);
    }
  }).catch(() => {
    // Fallback for browsers that block clipboard API
    const ta = document.createElement("textarea");
    ta.value = jsonStr;
    ta.style.position = "fixed";
    ta.style.opacity  = "0";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    showToast("JSON copied to clipboard!");
  });
}