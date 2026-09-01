"use strict";
const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

/* ══════════════════════════════════════════════════════════════
   1 · REAL DATA — MassDOT IMPACT, feature services 2021–2025.
       Aggregated with the project's own KSI + road-user rules.
   ══════════════════════════════════════════════════════════════ */
const CRASH = {
  2021:{mv:[122485,2190], ped:[1665,323], bike:[1062,117]},
  2022:{mv:[131095,2311], ped:[2029,389], bike:[1348,142]},
  2023:{mv:[131913,2189], ped:[1995,418], bike:[1418,146]},
  2024:{mv:[131904,2203], ped:[1956,385], bike:[1581,138]},
  2025:{mv:[127583,2149], ped:[1773,332], bike:[1568,125]}
};
const YEARS  = Object.keys(CRASH).map(Number);
const MODES  = [
  {k:"mv",   name:"Motor vehicle", v:"--s1"},
  {k:"ped",  name:"Pedestrian",    v:"--s2"},
  {k:"bike", name:"Bicyclist",     v:"--s3"}
];
const rate = (y,m) => CRASH[y][m][1] / CRASH[y][m][0] * 100;
const idx  = (y,m) => CRASH[y][m][0] / CRASH[YEARS[0]][m][0] * 100;

const MEASURES = {
  rate:{ fn:rate, label:"Share of crashes that are killed or seriously injured",
         unit:"%", dp:1, dom:[0,24], ticks:[0,6,12,18,24] },
  idx: { fn:idx,  label:"Crash volume, indexed to 2021 = 100",
         unit:"",  dp:0, dom:[80,160], ticks:[80,100,120,140,160] }
};
let measure = "rate";

const css = v => getComputedStyle(document.documentElement).getPropertyValue(v).trim();

/* ---------- chart ---------- */
const svg = document.getElementById("chart");
const NS = "http://www.w3.org/2000/svg";
const W = 720, H = 300, PL = 46, PR = 104, PT = 18, PB = 40;

function el(n, a){ const e = document.createElementNS(NS,n);
  for (const k in a) e.setAttribute(k, a[k]); return e; }

function drawChart(animate){
  const M = MEASURES[measure];
  const x = i => PL + i * (W - PL - PR) / (YEARS.length - 1);
  const y = v => PT + (1 - (v - M.dom[0]) / (M.dom[1] - M.dom[0])) * (H - PT - PB);
  svg.innerHTML = "";
  svg.setAttribute("aria-label",
    "Line chart. " + M.label + ", Massachusetts, 2021 to 2025, by road user.");

  M.ticks.forEach(t => {
    svg.appendChild(el("line",{class:"gridline",x1:PL,x2:W-PR+10,y1:y(t),y2:y(t)}));
    const lb = el("text",{class:"axis-t",x:PL-9,y:y(t)+3.5,"text-anchor":"end"});
    lb.textContent = t + M.unit; svg.appendChild(lb);
  });
  YEARS.forEach((yr,i) => {
    const lb = el("text",{class:"axis-t",x:x(i),y:H-PB+18,"text-anchor":"middle"});
    lb.textContent = yr; svg.appendChild(lb);
  });

  MODES.forEach(m => {
    const col = css(m.v);
    const pts = YEARS.map((yr,i) => [x(i), y(M.fn(yr,m.k))]);
    const d = pts.map((p,i) => (i?"L":"M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
    const path = el("path",{d:d,fill:"none",stroke:col,"stroke-width":2,
      "stroke-linejoin":"round","stroke-linecap":"round"});
    const len = 900;
    if (animate && !reduced.matches){
      path.classList.add("draw"); path.style.setProperty("--len", len);
      requestAnimationFrame(() => requestAnimationFrame(() => path.classList.add("in")));
    }
    svg.appendChild(path);
    pts.forEach(p => {
      svg.appendChild(el("circle",{cx:p[0],cy:p[1],r:4.5,fill:col,
        stroke:css("--surface"),"stroke-width":2}));
    });
    const last = pts[pts.length-1];
    const t1 = el("text",{class:"serieslabel",x:last[0]+11,y:last[1]-1,fill:col});
    t1.textContent = m.name; svg.appendChild(t1);
    const t2 = el("text",{class:"serieslabel",x:last[0]+11,y:last[1]+11,fill:css("--muted")});
    t2.textContent = M.fn(YEARS[YEARS.length-1],m.k).toFixed(M.dp) + M.unit;
    svg.appendChild(t2);
  });

  const ch = el("line",{class:"crosshair",y1:PT,y2:H-PB,x1:-99,x2:-99,opacity:0});
  ch.id = "ch"; svg.appendChild(ch);
  svg.appendChild(el("rect",{id:"hit",x:PL-14,y:PT,width:W-PL-PR+28,height:H-PT-PB,
    fill:"transparent",style:"cursor:crosshair"}));
  wireHover(x,y,M);
}

const tip = document.getElementById("tip");
function wireHover(x,y,M){
  const hit = svg.querySelector("#hit"), ch = svg.querySelector("#ch");
  const wrap = document.getElementById("chartwrap");
  function move(ev){
    const r = svg.getBoundingClientRect();
    const px = (ev.clientX - r.left) / r.width * W;
    let i = Math.round((px - PL) / ((W - PL - PR) / (YEARS.length - 1)));
    i = Math.max(0, Math.min(YEARS.length - 1, i));
    const yr = YEARS[i];
    ch.setAttribute("x1",x(i)); ch.setAttribute("x2",x(i)); ch.setAttribute("opacity",1);
    tip.innerHTML = "<b>" + yr + "</b><div style='height:.35rem'></div>" +
      MODES.map(m => "<div class='row'><span class='sw' style='background:" + css(m.v) +
        "'></span><span class='nm'>" + m.name + "</span><b>" +
        M.fn(yr,m.k).toFixed(M.dp) + M.unit + "</b></div>").join("");
    tip.style.opacity = 1;
    const wr = wrap.getBoundingClientRect();
    const px2 = x(i) / W * r.width + (r.left - wr.left) + wrap.scrollLeft;
    const tw = tip.offsetWidth;
    tip.style.left = Math.max(0, Math.min(wrap.clientWidth + wrap.scrollLeft - tw,
      px2 - tw / 2)) + "px";
    tip.style.top = "6px";
  }
  hit.addEventListener("mousemove", move);
  hit.addEventListener("touchstart", e => move(e.touches[0]), {passive:true});
  hit.addEventListener("touchmove",  e => move(e.touches[0]), {passive:true});
  hit.addEventListener("mouseleave", () => { tip.style.opacity = 0; ch.setAttribute("opacity",0); });
}

/* legend + table */
document.getElementById("legend").innerHTML = MODES.map(m =>
  "<span><i style='background:var(" + m.v + ")'></i>" + m.name + "</span>").join("");

function buildTable(){
  const M = MEASURES[measure];
  let h = "<table class='data'><caption class='eyebrow' style='text-align:left;padding:.4rem 0'>" +
    M.label + "</caption><thead><tr><th>Year</th>" +
    MODES.map(m => "<th>" + m.name + "</th>").join("") + "</tr></thead><tbody>";
  YEARS.forEach(yr => {
    h += "<tr><td>" + yr + "</td>" +
      MODES.map(m => "<td>" + M.fn(yr,m.k).toFixed(M.dp) + M.unit + "</td>").join("") + "</tr>";
  });
  document.getElementById("tablewrap").innerHTML = h + "</tbody></table>";
}

const bRate = document.getElementById("m-rate"), bIdx = document.getElementById("m-idx"),
      bTbl  = document.getElementById("m-tbl"),  tblWrap = document.getElementById("tablewrap");
function setMeasure(m){
  measure = m;
  bRate.setAttribute("aria-pressed", m === "rate");
  bIdx.setAttribute("aria-pressed",  m === "idx");
  drawChart(true); buildTable();
}
bRate.addEventListener("click", () => setMeasure("rate"));
bIdx .addEventListener("click", () => setMeasure("idx"));
bTbl .addEventListener("click", () => {
  const on = tblWrap.hidden;
  tblWrap.hidden = !on; bTbl.setAttribute("aria-pressed", on);
});

/* ══════════════════════════════════════════════════════════════
   1b · H-1B SUB-CATEGORY SCATTER — real output from the project's
        own pipeline. [category, sub-category, n POIs, % change]
   ══════════════════════════════════════════════════════════════ */
const SUB = [["T","Fitness and Recreational Sports Centers",136,-29.4],["T","Museums",36,-28.5],["C","Barber Shops",30,-27.6],["U","Snack and Nonalcoholic Beverage Bars",332,-16.7],["T","All Other Specialty Food Stores",44,-16.4],["U","Commercial Printing (except Screen and Books)",91,-15.4],["T","Home Centers",32,-15.0],["C","Drinking Places (Alcoholic Beverages)",263,-15.0],["U","Furniture Stores",53,-13.3],["U","Full-Service Restaurants",1177,-11.9],["C","Home Centers",38,-11.6],["C","Electronics Stores",93,-11.3],["U","Direct Property and Casualty Insurance Carriers",36,-11.2],["C","Tax Preparation Services",45,-10.3],["T","Plumbing, Heating, and Air-Conditioning Contractors",35,-8.2],["C","Women's Clothing Stores",137,-8.0],["U","Women's Clothing Stores",84,-7.9],["U","Commercial Banking",100,-7.2],["U","Painting and Wall Covering Contractors",35,-7.0],["T","Limited-Service Restaurants",147,-6.9],["U","All Other Specialty Food Stores",56,-6.8],["C","All Other Miscellaneous Store Retailers (except Tobacco Stores)",88,-6.1],["U","Museums",114,-5.7],["C","Beauty Salons",153,-5.4],["U","Florists",32,-5.3],["U","Parking Lots and Garages",136,-5.0],["C","Children's and Infants' Clothing Stores",32,-4.6],["T","Pharmacies and Drug Stores",41,-4.5],["U","Rooming and Boarding Houses, Dormitories, and Workers' Camps",87,-4.5],["U","Optical Goods Stores",56,-4.4],["C","Colleges, Universities, and Professional Schools",76,-3.7],["C","Gift, Novelty, and Souvenir Stores",72,-3.7],["U","Men's Clothing Stores",48,-3.6],["U","All Other General Merchandise Stores",36,-3.6],["T","All Other General Merchandise Stores",32,-3.4],["U","Limited-Service Restaurants",294,-3.3],["C","Cafeterias, Grill Buffets, and Buffets",44,-3.3],["C","Used Merchandise Stores",36,-3.1],["C","Lessors of Nonresidential Buildings (except Miniwarehouses)",482,-3.1],["U","Family Clothing Stores",46,-2.9],["C","Wireless Telecommunications Carriers (except Satellite)",74,-2.7],["T","Full-Service Restaurants",795,-2.5],["C","Nail Salons",46,-2.4],["U","All Other Health and Personal Care Stores",92,-2.3],["C","Family Clothing Stores",107,-2.3],["U","Wireless Telecommunications Carriers (except Satellite)",49,-2.2],["U","Used Merchandise Stores",32,-2.2],["U","Gasoline Stations with Convenience Stores",72,-2.1],["U","Hotels (except Casino Hotels) and Motels",211,-2.1],["T","Colleges, Universities, and Professional Schools",52,-1.9],["U","Book Stores",88,-1.8],["C","Furniture Stores",43,-1.8],["C","Direct Property and Casualty Insurance Carriers",216,-1.8],["C","Cosmetics, Beauty Supplies, and Perfume Stores",56,-1.6],["T","Men's Clothing Stores",33,-1.2],["U","Electronics Stores",92,-1.1],["C","Pharmacies and Drug Stores",70,-1.1],["U","Other Gasoline Stations",35,-1.0],["C","Convenience Stores",96,-1.0],["C","Limited-Service Restaurants",299,-0.9],["C","Parking Lots and Garages",178,-0.9],["C","Supermarkets and Other Grocery (except Convenience) Stores",120,-0.8],["C","Car Washes",40,-0.8],["C","Offices of Real Estate Agents and Brokers",72,-0.8],["T","Hotels (except Casino Hotels) and Motels",165,-0.6],["C","Other Activities Related to Credit Intermediation",95,-0.4],["C","Optical Goods Stores",79,-0.4],["U","Travel Agencies",47,0.1],["C","Passenger Car Rental",60,0.1],["C","Full-Service Restaurants",1724,0.1],["U","Colleges, Universities, and Professional Schools",229,0.3],["U","All Other Miscellaneous Store Retailers (except Tobacco Stores)",87,0.3],["U","Nail Salons",34,0.3],["U","Fitness and Recreational Sports Centers",180,0.4],["C","Locksmiths",32,0.5],["T","Parking Lots and Garages",111,0.6],["T","Other Activities Related to Credit Intermediation",49,0.6],["U","Other Activities Related to Credit Intermediation",74,0.6],["U","General Automotive Repair",50,0.6],["C","Fitness and Recreational Sports Centers",244,0.6],["U","Other Clothing Stores",32,0.9],["T","Other Gasoline Stations",73,1.0],["U","Pharmacies and Drug Stores",79,1.0],["T","Lessors of Residential Buildings and Dwellings",64,1.2],["C","Gasoline Stations with Convenience Stores",44,1.2],["T","Shoe Stores",56,1.3],["T","Drinking Places (Alcoholic Beverages)",66,1.3],["T","Gasoline Stations with Convenience Stores",56,1.6],["C","Department Stores",52,1.7],["T","Commercial Printing (except Screen and Books)",92,1.8],["T","Electronics Stores",100,1.9],["C","Plumbing, Heating, and Air-Conditioning Contractors",58,2.0],["T","Book Stores",64,2.2],["U","Supermarkets and Other Grocery (except Convenience) Stores",167,2.2],["U","Shoe Stores",44,2.2],["T","Retail Bakeries",52,2.3],["C","Commercial Banking",284,2.5],["U","Gift, Novelty, and Souvenir Stores",60,2.7],["T","All Other Miscellaneous Store Retailers (except Tobacco Stores)",32,2.8],["C","Commercial Printing (except Screen and Books)",140,3.1],["T","Women's Clothing Stores",37,3.5],["U","Sporting Goods Stores",44,3.5],["U","Taxi Service",60,3.5],["C","Hotels (except Casino Hotels) and Motels",469,3.7],["T","Supermarkets and Other Grocery (except Convenience) Stores",98,3.9],["T","Lessors of Nonresidential Buildings (except Miniwarehouses)",420,3.9],["C","Other Clothing Stores",52,3.9],["C","Book Stores",84,4.3],["C","Snack and Nonalcoholic Beverage Bars",374,4.9],["U","Convenience Stores",82,5.0],["U","Lessors of Nonresidential Buildings (except Miniwarehouses)",189,5.6],["T","Convenience Stores",31,6.0],["C","Retail Bakeries",105,6.2],["U","Drinking Places (Alcoholic Beverages)",101,6.4],["U","Plumbing, Heating, and Air-Conditioning Contractors",47,6.6],["T","Travel Agencies",64,7.2],["C","Jewelry Stores",44,7.4],["C","Shoe Stores",93,7.4],["C","All Other Specialty Food Stores",60,7.5],["C","Travel Agencies",79,7.5],["T","Commercial Banking",71,7.6],["T","Offices of Real Estate Agents and Brokers",112,8.0],["C","Museums",49,9.9],["U","Offices of Real Estate Agents and Brokers",56,10.5],["T","General Automotive Repair",40,10.7],["U","Retail Bakeries",75,13.4],["U","Convention and Trade Show Organizers",55,13.9],["C","Florists",60,15.5],["C","Men's Clothing Stores",122,16.6],["T","Snack and Nonalcoholic Beverage Bars",166,18.2],["U","Beauty Salons",76,18.4],["T","Family Clothing Stores",40,29.9],["T","Beauty Salons",47,35.9],["T","Painting and Wall Covering Contractors",33,56.5]];
const CATS = [
  {k:"T", name:"Tech areas",       v:"--s1"},
  {k:"U", name:"University areas", v:"--s2"},
  {k:"C", name:"Control areas",    v:"--s3"}
];
const CATNAME = {T:"Tech", U:"University", C:"Control"};

const sc = document.getElementById("scatter");
const SW = 720, SH = 360, SL = 52, SR = 26, ST = 22, SB = 46;
const XD = [-35, 60], YD = [28, 2000];

function drawScatter(animate){
  const x = v => SL + (v - XD[0]) / (XD[1] - XD[0]) * (SW - SL - SR);
  const ly = Math.log(YD[0]), lh = Math.log(YD[1]) - ly;
  const y = n => ST + (1 - (Math.log(n) - ly) / lh) * (SH - ST - SB);
  sc.innerHTML = "";

  [30,100,300,1000].forEach(t => {
    sc.appendChild(el("line",{class:"gridline",x1:SL,x2:SW-SR,y1:y(t),y2:y(t)}));
    const l = el("text",{class:"axis-t",x:SL-9,y:y(t)+3.5,"text-anchor":"end"});
    l.textContent = t.toLocaleString("en-US"); sc.appendChild(l);
  });
  [-30,-20,-10,0,10,20,30,40,50].forEach(t => {
    const l = el("text",{class:"axis-t",x:x(t),y:SH-SB+18,"text-anchor":"middle"});
    l.textContent = (t>0?"+":"") + t + "%"; sc.appendChild(l);
  });
  // zero line — the only reference that matters
  sc.appendChild(el("line",{x1:x(0),x2:x(0),y1:ST,y2:SH-SB,
    stroke:css("--muted"),"stroke-width":1}));
  const z = el("text",{class:"axis-t",x:x(0),y:ST-7,"text-anchor":"middle"});
  z.textContent = "no change"; sc.appendChild(z);

  const ax = el("text",{class:"axis-t",x:SL-9,y:ST-7,"text-anchor":"end"});
  ax.textContent = "POIs"; sc.appendChild(ax);
  const ax2 = el("text",{class:"axis-t",x:(SL+SW-SR)/2,y:SH-6,"text-anchor":"middle"});
  ax2.textContent = "change in average visits per location, Jan 2025 → Jan 2026";
  sc.appendChild(ax2);

  SUB.forEach((d,i) => {
    const col = css(CATS.find(c => c.k === d[0]).v);
    const c = el("circle",{cx:x(d[3]),cy:y(d[2]),r:4,fill:col,"fill-opacity":.72,
      stroke:css("--surface"),"stroke-width":1.5,"data-i":i});
    if (animate && !reduced.matches){
      c.style.opacity = 0;
      c.style.transition = "opacity 460ms ease " + Math.min(600, i*4) + "ms";
      requestAnimationFrame(() => requestAnimationFrame(() => c.style.opacity = 1));
    }
    sc.appendChild(c);
  });

  // label only the two claims the sample sizes actually support
  [["Snack and Nonalcoholic Beverage Bars","coffee shops"],
   ["Full-Service Restaurants","full-service restaurants"]].forEach(([key,label]) => {
    const d = SUB.find(s => s[1] === key && s[0] === "U");
    if (!d) return;
    const px = x(d[3]), py = y(d[2]);
    sc.appendChild(el("line",{x1:px+5,y1:py,x2:px+34,y2:py,
      stroke:css("--muted"),"stroke-width":1}));
    const t = el("text",{class:"serieslabel",x:px+38,y:py+3,fill:css("--ink")});
    t.textContent = label + " (" + d[2].toLocaleString("en-US") + ")";
    sc.appendChild(t);
  });

  sc.appendChild(el("rect",{id:"s-hit",x:SL,y:ST,width:SW-SL-SR,height:SH-ST-SB,
    fill:"transparent",style:"cursor:crosshair"}));
  wireScatter(x,y);
}

const tip2 = document.getElementById("tip2");
function wireScatter(x,y){
  const hit = sc.querySelector("#s-hit"), wrap = document.getElementById("scatterwrap");
  hit.addEventListener("mousemove", ev => {
    const r = sc.getBoundingClientRect();
    const mx = (ev.clientX - r.left) / r.width * SW, my = (ev.clientY - r.top) / r.height * SH;
    let best = null, bd = 1e9;
    SUB.forEach(d => {
      const dx = x(d[3]) - mx, dy = y(d[2]) - my, dist = dx*dx + dy*dy;
      if (dist < bd){ bd = dist; best = d; }
    });
    if (!best || bd > 400){ tip2.style.opacity = 0; return; }
    tip2.innerHTML = "<b>" + best[1] + "</b><div style='height:.3rem'></div>" +
      "<div class='row'><span class='sw' style='background:" +
      css(CATS.find(c=>c.k===best[0]).v) + "'></span><span class='nm'>" +
      CATNAME[best[0]] + " areas</span></div>" +
      "<div class='row'><span class='nm'>locations</span><b>" +
      best[2].toLocaleString("en-US") + "</b></div>" +
      "<div class='row'><span class='nm'>change</span><b>" +
      (best[3] > 0 ? "+" : "") + best[3] + "%</b></div>";
    tip2.style.opacity = 1;
    const wr = wrap.getBoundingClientRect(), tw = tip2.offsetWidth;
    const px = x(best[3]) / SW * r.width + (r.left - wr.left) + wrap.scrollLeft;
    tip2.style.left = Math.max(0, Math.min(wrap.clientWidth + wrap.scrollLeft - tw,
      px - tw/2)) + "px";
    tip2.style.top = Math.max(0, y(best[2]) / SH * r.height - 96) + "px";
  });
  hit.addEventListener("mouseleave", () => { tip2.style.opacity = 0; });
}

document.getElementById("legend2").innerHTML = CATS.map(c =>
  "<span><i style='background:var(" + c.v + ");height:8px;width:8px;border-radius:50%'></i>" +
  c.name + "</span>").join("") +
  "<span style='color:var(--muted)'>· vertical axis = sample size (log)</span>";

(function scatterTable(){
  let h = "<div style='max-height:18rem;overflow:auto'><table class='data'>" +
    "<caption class='eyebrow' style='text-align:left;padding:.4rem 0'>" +
    "All 134 sub-categories with at least 30 locations</caption><thead><tr>" +
    "<th>Sub-category</th><th>Area</th><th>Locations</th><th>Change</th></tr></thead><tbody>";
  SUB.forEach(d => {
    h += "<tr><td>" + d[1] + "</td><td>" + CATNAME[d[0]] + "</td><td>" +
      d[2].toLocaleString("en-US") + "</td><td>" + (d[3]>0?"+":"") + d[3] + "%</td></tr>";
  });
  document.getElementById("stablewrap").innerHTML = h + "</tbody></table></div>";
})();
const bSTbl = document.getElementById("s-tbl"), sTblWrap = document.getElementById("stablewrap");
bSTbl.addEventListener("click", () => {
  const on = sTblWrap.hidden;
  sTblWrap.hidden = !on; bSTbl.setAttribute("aria-pressed", on);
});

/* ══════════════════════════════════════════════════════════════
   1d · METHOD COMPARISON — a coefficient plot. Same data, three
        methods. The hollow mark is the one you should not believe.
   ══════════════════════════════════════════════════════════════ */
const METHODS = [
  {name:"Naive difference in means",  est:5.53,  note:"t = 6.49, p < 0.001", ok:true},
  {name:"OLS with controls",          est:-0.02, note:"p = 0.997",           ok:true, em:true},
  {name:"Propensity score matching",  est:13.10, note:"overlap fails",       ok:false}
];
function drawCoef(){
  const cf = document.getElementById("coef");
  const W2 = 720, H2 = 210, L2 = 214, R2 = 30, T2 = 26, B2 = 34;
  const dom = [-3, 15];
  const x = v => L2 + (v - dom[0]) / (dom[1] - dom[0]) * (W2 - L2 - R2);
  cf.innerHTML = "";
  [0,5,10,15].forEach(t => {
    cf.appendChild(el("line",{class:"gridline",x1:x(t),x2:x(t),y1:T2,y2:H2-B2}));
    const l = el("text",{class:"axis-t",x:x(t),y:H2-B2+17,"text-anchor":"middle"});
    l.textContent = (t>0?"+":"") + t; cf.appendChild(l);
  });
  cf.appendChild(el("line",{x1:x(0),x2:x(0),y1:T2,y2:H2-B2,
    stroke:css("--muted"),"stroke-width":1}));
  const zl = el("text",{class:"axis-t",x:x(0),y:T2-9,"text-anchor":"middle"});
  zl.textContent = "no effect"; cf.appendChild(zl);
  const xl = el("text",{class:"axis-t",x:(L2+W2-R2)/2,y:H2-6,"text-anchor":"middle"});
  xl.textContent = "estimated effect on conversion (percentage points)"; cf.appendChild(xl);

  const step = (H2 - T2 - B2) / METHODS.length;
  METHODS.forEach((m,i) => {
    const y = T2 + step*i + step/2;
    const col = m.em ? css("--accent") : css("--muted");
    const lab = el("text",{class:"axis-t",x:L2-14,y:y-2,"text-anchor":"end",
      fill: m.em ? css("--ink") : css("--ink-soft")});
    lab.textContent = m.name; cf.appendChild(lab);
    const sub = el("text",{class:"axis-t",x:L2-14,y:y+11,"text-anchor":"end"});
    sub.textContent = m.note; cf.appendChild(sub);

    cf.appendChild(el("line",{x1:x(0),x2:x(m.est),y1:y,y2:y,
      stroke:col,"stroke-width":m.em?2:1.5,"stroke-dasharray":m.ok?"":"3 3"}));
    cf.appendChild(el("circle",{cx:x(m.est),cy:y,r:m.em?6:5.5,
      fill:m.ok?col:css("--surface"), stroke:col,"stroke-width":2}));
    const v = el("text",{class:"serieslabel",x:x(m.est)+12,y:y+4,
      fill: m.em ? css("--ink") : css("--ink-soft")});
    v.textContent = (m.est>0?"+":"") + m.est.toFixed(2);
    cf.appendChild(v);
  });
}


/* ══════════════════════════════════════════════════════════════
   2 · SSGA PIPELINE DIAGRAM
   ══════════════════════════════════════════════════════════════ */
(function diagram(){
  const boxes = [
    [8,  18, 118, 40, "Market data",     "index-level returns"],
    [8,  76, 118, 40, "Macro data",      "regime indicators"],
    [156,18, 128, 40, "Technical sleeve","momentum + trend"],
    [156,76, 128, 40, "Macro sleeve",    "conditioning"],
    [314,47, 128, 40, "Primary signal",  "directional view", 1],
    [472,47, 132, 40, "Meta-label",      "trade / stand down", 1],
    [634,18, 130, 40, "Active weights",  "vs benchmark"],
    [634,76, 130, 40, "Two-layer costs", "applied on turnover"]
  ];
  const arrows = [
    [126,38,156,38],[126,96,156,96],
    [284,38,314,60],[284,96,314,74],
    [442,67,472,67],
    [604,67,634,38],[604,67,634,96]
  ];
  let s = '<svg viewBox="0 0 790 176" role="img" aria-label="Pipeline: market and macro data feed technical and macro signal sleeves, which produce a primary directional signal; a meta-labeling layer decides whether to trade it; the result becomes benchmark-relative active weights with two layers of transaction costs, evaluated by walk-forward validation.">';
  s += '<defs><marker id="ah" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto"><path class="dg-head" d="M0 0 L8 4 L0 8 z"/></marker></defs>';
  arrows.forEach(a => {
    const mid = (a[0] + a[2]) / 2;
    s += '<path class="dg-arrow" marker-end="url(#ah)" d="M' + a[0] + ' ' + a[1] +
         ' C' + mid + ' ' + a[1] + ' ' + mid + ' ' + a[3] + ' ' + (a[2]-5) + ' ' + a[3] + '"/>';
  });
  boxes.forEach(b => {
    const x = b[0], y = b[1], w = b[2], h = b[3], title = b[4], sub = b[5], em = b[6];
    s += '<rect class="dg-box' + (em ? ' em' : '') + '" x="' + x + '" y="' + y +
         '" width="' + w + '" height="' + h + '"/>' +
         '<text class="dg-t h" x="' + (x+10) + '" y="' + (y+17) + '">' + title + '</text>' +
         '<text class="dg-lbl" x="' + (x+10) + '" y="' + (y+31) + '">' + sub + '</text>';
  });
  s += '<line class="dg-arrow" x1="8" y1="146" x2="764" y2="146" stroke-dasharray="3 3"/>';
  s += '<text class="dg-lbl" x="8" y="164">walk-forward validation across folds — every stage re-fit out of sample</text>';
  s += '</svg>';
  document.getElementById("diagram").innerHTML = s;
})();

/* ══════════════════════════════════════════════════════════════
   3 · OVRULE guard() — local illustration of the six-rule flow
   ══════════════════════════════════════════════════════════════ */
/* "without manager approval" must read as denied, not as an approval mentioned */
const DENIED  = /without\s+(?:\w+\s+){0,3}(?:approval|authori[sz]ation|sign.?off|review|consent|confirmation)/i;
const GRANTED = /(?:approved|authori[sz]ed|signed.?off|cleared)\s+by\b|with\s+(?:\w+\s+){0,2}approval/i;
const PRIVILEGED = /(refund|pay|transfer|grant|issue|waive|delete|drop|deploy|merge|revoke|terminate)/i;

const RULES = [
  {id:"authority",    name:"Authority",      test:s => PRIVILEGED.test(s) && (DENIED.test(s) || !GRANTED.test(s))},
  {id:"reversible",   name:"Reversibility",  test:s => /(drop|delete|truncate|wipe|purge|destroy|revoke|terminate|rm -rf|force.?push)/i.test(s)},
  {id:"blast",        name:"Blast radius",   test:s => /(production|prod\b|all users|every|entire|global|fleet|master|main branch)/i.test(s)},
  {id:"exposure",     name:"Data exposure",  test:s => /(email|send|share|export|upload|publish|leak)/i.test(s)
                                                     && /(customer|user|client|personal|pii|list|database|record)/i.test(s)},
  {id:"spend",        name:"Spend limit",    test:s => {
                                                const m = s.match(/\$\s?([\d,]+(?:\.\d+)?)\s*(k|m)?/i);
                                                if (!m) return false;
                                                let v = parseFloat(m[1].replace(/,/g,""));
                                                if (/k/i.test(m[2]||"")) v *= 1e3;
                                                if (/m/i.test(m[2]||"")) v *= 1e6;
                                                return v >= 1000; }},
  {id:"escalation",   name:"Human escalation", test:s => DENIED.test(s)
                                                     || /(no review|skip (?:the )?(?:review|approval)|immediately|automatically)/i.test(s)}
];
const PRESETS = [
  "An AI coding agent wants to run DROP TABLE users on the production database.",
  "Support agent wants to refund $5,000 to a customer without manager approval.",
  "Read the last 20 rows of the staging analytics table.",
  "Email the full customer list to an external contractor immediately."
];
const REASONS = {
  authority:"no approving party named", reversible:"the action cannot be undone",
  blast:"scope reaches production", exposure:"customer data leaves the system",
  spend:"amount is over the auto-approval limit", escalation:"a human review step is skipped"
};

const presetsEl = document.getElementById("presets");
presetsEl.innerHTML = PRESETS.map((p,i) =>
  '<button type="button" data-i="' + i + '">Example ' + (i+1) + '</button>').join("");
presetsEl.addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b) return;
  document.getElementById("scenario").value = PRESETS[+b.dataset.i];
});

const rulesEl = document.getElementById("rules");
rulesEl.innerHTML = RULES.map(r =>
  '<li id="r-' + r.id + '"><span class="mark">·</span><span class="rn">' + r.name +
  '</span><span class="rv">—</span></li>').join("");

function hash8(s){
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(16).padStart(8,"0");
}

/* ── receipt typing ──────────────────────────────────────────────
   setTimeout chaining, no rAF loop. 12ms/char was chosen against the
   measured output: the receipt runs 125–158 characters, so this lands
   between 1.5s and 1.9s — on top of the ~1.2s the rule sequence already
   takes. Click the receipt to finish it instantly; reduced motion skips
   it entirely.                                                        */
const TYPE_MS = 12, TYPE_GAP = 120;
const receiptEl = document.querySelector(".receipt");
let activeTyper = null;

function reserve(el, txt){
  const prev = el.textContent;
  el.style.minHeight = "";
  el.textContent = txt;
  el.style.minHeight = el.offsetHeight + "px";
  el.textContent = prev;
}

function type(steps, done){
  if (activeTyper) activeTyper.skip();
  if (reduced.matches){
    steps.forEach(([el, txt]) => { el.textContent = txt; });
    done && done();
    return;
  }
  let si = 0, ci = 0, timer = null, live = true;
  function finish(){
    if (!live) return;
    live = false;
    clearTimeout(timer);
    steps.forEach(([el, txt]) => { el.textContent = txt; el.classList.remove("caret"); });
    receiptEl.classList.remove("typing");
    activeTyper = null;
    done && done();
  }
  function tick(){
    if (!live) return;
    const [el, txt] = steps[si];
    el.classList.add("caret");
    el.textContent = txt.slice(0, ++ci);
    if (ci < txt.length){ timer = setTimeout(tick, TYPE_MS); return; }
    el.classList.remove("caret");
    si++; ci = 0;
    timer = setTimeout(si < steps.length ? tick : finish, TYPE_GAP);
  }
  steps.forEach(([el]) => { el.textContent = ""; });
  receiptEl.classList.add("typing");
  activeTyper = {skip: finish};
  timer = setTimeout(tick, TYPE_MS);
}

receiptEl.addEventListener("click", () => { if (activeTyper) activeTyper.skip(); });

const runbtn = document.getElementById("runbtn");
runbtn.addEventListener("click", () => {
  const s = document.getElementById("scenario").value.trim();
  if (!s) return;
  runbtn.disabled = true;
  const verdict = document.getElementById("verdict");
  const badge = document.getElementById("vbadge"), vtext = document.getElementById("vtext");
  verdict.className = "verdict idle"; badge.textContent = "…"; vtext.textContent = "reviewing the action";
  document.getElementById("reason").textContent = "Six rules read the action in parallel.";
  document.getElementById("rid").textContent = "receipt —";
  document.getElementById("rlat").textContent = "—";
  RULES.forEach(r => { const li = document.getElementById("r-" + r.id);
    li.className = ""; li.querySelector(".rv").textContent = "—";
    li.querySelector(".mark").textContent = "·"; });

  const failed = [];
  const step = reduced.matches ? 0 : 170;
  RULES.forEach((r,i) => setTimeout(() => {
    const bad = r.test(s);
    if (bad) failed.push(r.id);
    const li = document.getElementById("r-" + r.id);
    li.classList.add("in", bad ? "fail" : "pass");
    li.querySelector(".rv").textContent = bad ? "FAIL" : "PASS";
    li.querySelector(".mark").textContent = bad ? "✕" : "✓";

    if (i === RULES.length - 1) setTimeout(() => {
      const ok = failed.length === 0;
      const reasonEl = document.getElementById("reason"),
            ridEl    = document.getElementById("rid");
      const txtV = ok ? "the action may run" : failed.length + " of 6 rules failed";
      const txtR = ok
        ? "Nothing in this action is irreversible, over limit, or outside the agent's authority."
        : "Refused — " + failed.map(f => REASONS[f]).join("; ") + ".";
      const txtI = "receipt " + hash8(s) + " · signed";

      // the badge is a state chip, not prose — it lands whole, with its colour
      verdict.className = "verdict " + (ok ? "allow" : "refuse");
      badge.textContent = ok ? "ALLOWED" : "REFUSED";
      document.getElementById("rlat").textContent = (0.9 + Math.random() * 0.4).toFixed(1) + "s";

      // reserve the final height before a single character is written, so nothing
      // below the demo moves while the text grows
      reserve(reasonEl, txtR);

      type([[vtext, txtV], [reasonEl, txtR], [ridEl, txtI]], () => { runbtn.disabled = false; });
    }, step);
  }, step * i));
});

/* ══════════════════════════════════════════════════════════════
   4 · PLATES
   ══════════════════════════════════════════════════════════════ */
/* Order and titles follow the 2025 portfolio; each file matched to its work
   by image correlation, not by filename. */
const MED = "Charcoal and charcoal pencil on paper";
const PLATES = [
  {n:"01", title:"Tidal Memory",         medium:MED, year:2025, dims:"22 × 14.5 in", src:"assets/plate-1.jpg"},
  {n:"02", title:"Aegean Garden",        medium:MED, year:2025, dims:"22 × 14.5 in", src:"assets/plate-3.jpg"},
  {n:"03", title:"Drift",                medium:MED, year:2025, dims:"30 × 22 in",   src:"assets/plate-4.jpg"},
  {n:"04", title:"Between Currents",     medium:MED, year:2025, dims:"22 × 14.5 in", src:"assets/plate-5.jpg"},
  {n:"05", title:"Winter Mediterranean", medium:MED, year:2025, dims:"30 × 22 in",   src:"assets/plate-6.jpg"},
  {n:"06", title:"Trace",                medium:MED, year:2025, dims:"30 × 22 in",   src:"assets/plate-2.jpg"}
];
document.getElementById("plates").innerHTML = PLATES.map((p,i) => {
  const inner = p.src
    ? '<img src="' + p.src + '" alt="' + p.title + ' — ' + p.medium.toLowerCase() + ', ' +
      p.dims + ', ' + p.year + '" loading="lazy">'
    : '<span class="plate__empty">Plate ' + (i+1) + '</span>';
  const open = p.src ? ' tabindex="0" role="button" aria-label="View ' + p.title + ' full size"' : '';
  return '<div class="plate"><figure><div class="plate__frame' + (p.src ? '' : ' empty') + '"' +
    open + '>' + inner + '</div><figcaption><span class="pn">' + (p.n || "") + '</span>' +
    '<span class="t">' + p.title + '</span><span class="m">' +
    p.medium + '<br>' + p.dims + ' · ' + p.year +
    '</span></figcaption></figure></div>';
}).join("");

/* ══════════════════════════════════════════════════════════════
   4a · RESOLUTION — the same sheet of paper, read at two scales.
        The detail crop is cut from the original photograph, so
        close range stays sharp instead of turning to mush.
   ══════════════════════════════════════════════════════════════ */
(function resolution(){
  const cv = document.getElementById("zoomcv");
  if (!cv) return;
  const cx = cv.getContext("2d");
  const sl = document.getElementById("zoomsl"), cap = document.getElementById("zoomcap");
  const RECT = {x:0.08, y:0.55, w:0.37995, h:0.38};   // detail's place on the full sheet

  const full = new Image(), det = new Image();
  let ready = 0, z = 1;
  full.onload = det.onload = () => { if (++ready === 2){ if (size()) frame(); reveal(); } };
  full.src = PLATES[0].src;      // Tidal Memory
  det.src  = "assets/detail-1.jpg";

  function size(){
    const w = cv.parentElement.clientWidth - 2;
    if (w <= 0) return false;
    cv.width  = Math.max(1, Math.round(w * devicePixelRatio));
    cv.height = Math.round(cv.width * full.height / full.width);
    cv.style.height = Math.round(w * full.height / full.width) + "px";
    return true;
  }
  function frame(){
    const W = cv.width, H = cv.height;
    const rx = 0 + (RECT.x - 0) * z, ry = 0 + (RECT.y - 0) * z;
    const rw = 1 + (RECT.w - 1) * z, rh = 1 + (RECT.h - 1) * z;
    cx.clearRect(0,0,W,H);
    cx.imageSmoothingQuality = "high";
    cx.drawImage(full, rx*full.width, ry*full.height, rw*full.width, rh*full.height, 0,0,W,H);
    if (z > 0.45){
      const a = Math.min(1, (z - 0.45) / 0.33);
      cx.globalAlpha = a;
      cx.drawImage(det, (RECT.x-rx)/rw*W, (RECT.y-ry)/rh*H, RECT.w/rw*W, RECT.h/rh*H);
      cx.globalAlpha = 1;
    }
    const p = PLATES[0];
    if (z > 0.72){ cap.className = "zoomcap"; cap.textContent = "Charcoal, up close. Nothing here is anything yet."; }
    else if (z > 0.34){ cap.className = "zoomcap"; cap.textContent = "Something is starting to organise."; }
    else { cap.className = "zoomcap resolved"; cap.textContent = p.title + ", " + p.year + " — " + p.dims; }
  }
  function set(v){ z = Math.max(0, Math.min(1, v)); sl.value = Math.round(z*1000); frame(); }

  sl.addEventListener("input", () => { z = +sl.value/1000; frame(); });
  // dragging across the drawing also works, because that is the obvious thing to try
  let drag = false, sx = 0, sz = 0;
  cv.addEventListener("pointerdown", e => { drag = true; sx = e.clientX; sz = z;
    cv.setPointerCapture(e.pointerId); });
  cv.addEventListener("pointermove", e => { if (!drag) return;
    set(sz - (e.clientX - sx) / cv.clientWidth * 1.4); });
  cv.addEventListener("pointerup",   () => { drag = false; });
  cv.addEventListener("pointercancel", () => { drag = false; });
  window.addEventListener("resize", () => { if (ready === 2 && size()) frame(); });
  window.addEventListener("viewchange", () => { if (ready === 2 && size()) frame(); });

  function reveal(){
    if (reduced.matches){ set(0.12); return; }
    new IntersectionObserver((es,obs) => es.forEach(e => {
      if (!e.isIntersecting) return;
      obs.disconnect();
      const t0 = performance.now(), dur = 2600;
      (function step(now){
        const p = Math.min(1, (now - t0) / dur);
        set(1 - (1 - Math.pow(1 - p, 3)) * 0.88);
        if (p < 1) requestAnimationFrame(step);
      })(t0);
    }), {threshold:0.4}).observe(cv);
  }
})();

/* ══════════════════════════════════════════════════════════════
   4b · LIGHTBOX — the drawings at size, which is how drawings work
   ══════════════════════════════════════════════════════════════ */
(function lightbox(){
  const lb = document.createElement("div");
  lb.className = "lb";
  lb.setAttribute("role", "dialog");
  lb.setAttribute("aria-modal", "true");
  lb.setAttribute("aria-label", "Drawing viewer");
  lb.innerHTML =
    '<span class="lb__n"></span>' +
    '<button class="lb__x" aria-label="Close viewer">✕</button>' +
    '<button class="lb__prev" aria-label="Previous drawing">←</button>' +
    '<button class="lb__next" aria-label="Next drawing">→</button>' +
    '<img alt=""><div class="lb__cap"></div>';
  document.body.appendChild(lb);

  const im = lb.querySelector("img"), cap = lb.querySelector(".lb__cap"),
        num = lb.querySelector(".lb__n");
  let cur = 0, opener = null;

  function paint(){
    const p = PLATES[cur];
    im.src = p.src;
    im.alt = p.title + " — " + p.medium.toLowerCase() + ", " + p.dims + ", " + p.year;
    cap.innerHTML = '<span class="t">' + p.title + '</span><span class="m">' +
      p.medium + " · " + p.dims + " · " + p.year + "</span>";
    num.textContent = p.n + " / 06";
  }
  function open(i, from){
    cur = i; opener = from || null; paint();
    lb.classList.add("open");
    document.body.style.overflow = "hidden";
    lb.querySelector(".lb__x").focus();
  }
  function close(){
    lb.classList.remove("open");
    document.body.style.overflow = "";
    if (opener) opener.focus();
  }
  const step = d => { cur = (cur + d + PLATES.length) % PLATES.length; paint(); };

  document.getElementById("plates").addEventListener("click", e => {
    const fr = e.target.closest(".plate__frame");
    if (!fr || !fr.querySelector("img")) return;
    open([...document.querySelectorAll("#plates .plate__frame")].indexOf(fr), fr);
  });
  document.getElementById("plates").addEventListener("keydown", e => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const fr = e.target.closest(".plate__frame"); if (!fr) return;
    e.preventDefault();
    open([...document.querySelectorAll("#plates .plate__frame")].indexOf(fr), fr);
  });

  lb.querySelector(".lb__x").addEventListener("click", close);
  lb.querySelector(".lb__prev").addEventListener("click", e => { e.stopPropagation(); step(-1); });
  lb.querySelector(".lb__next").addEventListener("click", e => { e.stopPropagation(); step(1); });
  lb.addEventListener("click", e => { if (e.target === lb || e.target === im) close(); });
  document.addEventListener("keydown", e => {
    if (!lb.classList.contains("open")) return;
    if (e.key === "Escape") close();
    else if (e.key === "ArrowLeft") step(-1);
    else if (e.key === "ArrowRight") step(1);
  });
})();

/* ══════════════════════════════════════════════════════════════
   5 · VIEW SWITCH
   ══════════════════════════════════════════════════════════════ */
const tabs = {
  work:{btn:document.getElementById("tab-work"), panel:document.getElementById("view-work")},
  art: {btn:document.getElementById("tab-art"),  panel:document.getElementById("view-art")}
};
const railnav = document.getElementById("railnav");
function show(name, push){
  Object.keys(tabs).forEach(k => {
    const on = k === name;
    tabs[k].btn.setAttribute("aria-selected", on ? "true" : "false");
    tabs[k].panel.hidden = !on;
  });
  railnav.style.display = name === "work" ? "" : "none";
  if (push) history.replaceState(null, "", name === "art" ? "#drawings" : "#top");
  window.scrollTo(0,0);
  running = name === "work";
  if (running){ start(); resize(); }
  window.dispatchEvent(new Event("viewchange"));
}
tabs.work.btn.addEventListener("click", () => show("work", true));
tabs.art .btn.addEventListener("click", () => show("art",  true));

/* ══════════════════════════════════════════════════════════════
   6 · SCROLL REVEALS + COUNT-UP
   ══════════════════════════════════════════════════════════════ */
const io = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return;
  e.target.classList.add("in");
  io.unobserve(e.target);
  if (e.target.id === "work") drawChart(true);
}), {threshold:0.12, rootMargin:"0px 0px -8% 0px"});
document.querySelectorAll(".rv").forEach(n => io.observe(n));

const cio = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return;
  cio.unobserve(e.target);
  const n = e.target, target = parseFloat(n.dataset.count),
        dp = +(n.dataset.dp || 0), suf = n.dataset.suffix || "",
        sign = n.dataset.sign === "1";
  const fmt = v => (sign && v > 0 ? "+" : "") +
    (dp ? v.toFixed(dp) : Math.round(v).toLocaleString("en-US")) + suf;
  if (reduced.matches){ n.textContent = fmt(target); return; }
  const t0 = performance.now(), dur = 1100;
  (function step(t){
    const p = Math.min(1, (t - t0) / dur), e2 = 1 - Math.pow(1 - p, 3);
    n.textContent = fmt(target * e2);
    if (p < 1) requestAnimationFrame(step);
  })(t0);
}), {threshold:0.5});
document.querySelectorAll("[data-count]").forEach(n => cio.observe(n));

/* rail nav current-section highlight */
const links = [...railnav.querySelectorAll("a")];
/* one indicator, slid into place — transform only, so it stays on the compositor */
const navDot = document.createElement("span");
navDot.className = "railnav__dot";
navDot.setAttribute("aria-hidden", "true");
railnav.appendChild(navDot);

function moveDot(){
  const cur = links.find(a => a.getAttribute("data-cur") === "1");
  if (!cur || !cur.offsetHeight){ navDot.classList.remove("on"); return; }
  navDot.style.transform =
    "translateY(" + (cur.offsetTop + cur.offsetHeight / 2 - 0.5) + "px)";
  navDot.classList.add("on");
}

const sio = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return;
  links.forEach(a => a.removeAttribute("data-cur"));
  const cur = links.find(a => a.getAttribute("href") === "#" + e.target.id);
  if (cur) cur.setAttribute("data-cur","1");
  moveDot();
}), {rootMargin:"-45% 0px -50% 0px"});

window.addEventListener("resize", moveDot);
window.addEventListener("viewchange", () => setTimeout(moveDot, 0));
["work","more","experience","about","education","toolkit","contact"]
  .forEach(id => { const n = document.getElementById(id); if (n) sio.observe(n); });

/* ══════════════════════════════════════════════════════════════
   7 · HERO — charcoal that follows the hand

   Rebuilt. The old version walked a 190x110 pixel buffer in JS and scaled it
   about seven times up, which is what destroyed the grain, and it lived inside
   a canvas clipped to the text column, so the smudge was sliced off on a
   straight vertical line beside the E of Ela and the K of Kumuk.

   Now three surfaces are composited each frame:

     mask  soft elliptical blobs along the recent path of the cursor, stretched
           along the direction of travel so a sweep reads as one stroke instead
           of a row of dots. Drawn as radial gradients — the GPU does this, no
           per-pixel loop.
     tex   the charcoal itself: ink-coloured tooth built once per resize at the
           real pixel size of the canvas. Two frequencies — "Drift" downsampled
           for the broad tonal masses, tileable value noise for the grain that
           has to stay sharp. Only the low frequency is ever upscaled, which is
           the whole fix.
     edge  a falloff painted in so the smudge fades out before the edge of the
           sheet rather than being cut by it.

   The hero rests as clean paper: with nothing on the trail the canvas clears
   and the loop stops.
   ══════════════════════════════════════════════════════════════ */
const cv = document.getElementById("smudge"), ctx = cv.getContext("2d");
const hero = document.querySelector(".hero");
const off  = document.createElement("canvas"), octx = off.getContext("2d");
const tex  = document.createElement("canvas"), tctx = tex.getContext("2d");
const edge = document.createElement("canvas"), ectx = edge.getContext("2d");

/* The mark is laid into a buffer that persists between frames and is lifted a
   little each frame, rather than redrawn from a list of live points. Charcoal
   does not vanish the instant the hand leaves; it sits and is slowly rubbed
   out. It is also cheaper - the cost of a frame no longer grows with how long
   the stroke is. */
const mask = document.createElement("canvas"), mctx = mask.getContext("2d");
const FADE = 0.030;         // fraction of the mark lifted per frame (~4s to gone)
let VW = 0, VH = 0, S = 1;  // canvas size in CSS px, and its backing-store scale
let CAP = 0.3;              // --smudge-max: how black the charcoal is allowed to get
let NOISE = null, LOW = null;
let charge = 0;             // roughly how much mark is left, so the loop knows to stop
let running = true, last = 0, rafId = null;

function inkColor(){
  const v = css("--smudge-rgb").split(",");
  return [+v[0]||0, +v[1]||0, +v[2]||0];
}

/* ---------- what the hand has done since the last frame ---------- */
let pending = [], hover = false, lastX = -1, lastY = -1;

hero.addEventListener("pointermove", e => {
  const r = hero.getBoundingClientRect();
  const x = e.clientX - r.left, y = e.clientY - r.top;
  const dx = lastX < 0 ? 0 : x - lastX, dy = lastY < 0 ? 0 : y - lastY;
  lastX = x; lastY = y;
  hover = e.pointerType === "mouse";
  /* a pointermove can jump 200px. Step along the gap so a fast sweep lays a
     continuous stroke rather than a dotted line. */
  const n = Math.max(1, Math.min(8, Math.round(Math.hypot(dx, dy) / 22)));
  for (let i = 1; i <= n; i++)
    pending.push({x: x - dx*(1 - i/n), y: y - dy*(1 - i/n), dx: dx, dy: dy});
  if (pending.length > 24) pending.splice(0, pending.length - 24);
  start();
}, {passive:true});

const away = () => { hover = false; lastX = lastY = -1; };
hero.addEventListener("pointerleave",  away);
hero.addEventListener("pointercancel", away);
hero.addEventListener("pointerup",     away);

/* ---------- the two textures ---------- */

/* Tileable value noise: every term is an integer multiple of a full turn in
   both axes, so the 256px tile repeats without a seam. The sines give the
   organic mid frequencies, a cheap integer hash gives the finest tooth. */
function buildNoise(){
  const N = 192, c = document.createElement("canvas");
  c.width = c.height = N;
  const x2 = c.getContext("2d"), id = x2.createImageData(N, N), d = id.data;
  const rgb = inkColor();

  const hash = (x, y, s) => {
    let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(s, 1442695041)) >>> 0;
    h = (h ^ (h >>> 13)) >>> 0;
    h = Math.imul(h, 1274126177) >>> 0;
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  };
  const sm = t => t * t * (3 - 2 * t);
  /* one octave of value noise on a P x P lattice. P divides N and the lattice
     wraps, so the tile has no seam. */
  function oct(x, y, P, seed){
    const g = N / P;
    const cx = Math.floor(x / g), cy = Math.floor(y / g);
    const fx = sm(x / g - cx), fy = sm(y / g - cy);
    const x0 = cx % P, x1 = (cx + 1) % P, y0 = cy % P, y1 = (cy + 1) % P;
    const a = hash(x0, y0, seed), b = hash(x1, y0, seed);
    const e = hash(x0, y1, seed), f = hash(x1, y1, seed);
    const t = a + (b - a) * fx;
    return t + ((e + (f - e) * fx) - t) * fy;
  }

  /* Sums of sines gave this a woven, moire look — regular enough to read as a
     texture map rather than paper. Value noise across six octaves, finest cell
     two pixels, is irregular the way a sheet's tooth actually is. */
  const OCT = [[6,0.14,1], [12,0.19,2], [24,0.23,3], [48,0.25,4], [96,0.19,5]];
  const f32 = new Float32Array(N * N);
  let lo = 1, hi = 0;
  for (let y = 0; y < N; y++){
    for (let x = 0; x < N; x++){
      let n = 0;
      for (let k = 0; k < OCT.length; k++) n += oct(x, y, OCT[k][0], OCT[k][2]) * OCT[k][1];
      f32[y*N + x] = n;
      if (n < lo) lo = n;
      if (n > hi) hi = n;
    }
  }
  const span = Math.max(1e-3, hi - lo);
  for (let i = 0; i < N*N; i++){
    /* the contrast window is what puts holes in it: charcoal sits on the high
       points of the sheet and misses the pits, and a deposit with no paper
       showing through is an airbrush, not a stick. */
    let a = ((f32[i] - lo) / span - 0.24) / 0.56;
    a = a < 0 ? 0 : a > 1 ? 1 : a;
    a = Math.pow(a, 0.78);
    const k = i * 4;
    d[k] = rgb[0]; d[k+1] = rgb[1]; d[k+2] = rgb[2];
    d[k+3] = (0.10 + a * 0.90) * 255;
  }
  x2.putImageData(id, 0, 0);
  return c;
}

/* "Drift" reduced to alpha only — the broad masses of the drawing, nothing
   else. This is the one surface that gets upscaled, and it is the one that
   can afford to be: it carries no detail worth losing. */
function buildLow(im){
  const w = 190, h = 110, c = document.createElement("canvas");
  c.width = w; c.height = h;
  const x2 = c.getContext("2d", {willReadFrequently:true});
  x2.drawImage(im, 0, 0, w, h);
  let px; try { px = x2.getImageData(0, 0, w, h); } catch(e){ return null; }
  const d = px.data, f = new Float32Array(w*h);
  let lo = 1, hi = 0;
  for (let i = 0; i < w*h; i++){
    // luminance, inverted: charcoal is dark on paper, we want pigment high
    const l = (d[i*4]*0.299 + d[i*4+1]*0.587 + d[i*4+2]*0.114) / 255;
    const v = 1 - l;
    f[i] = v; if (v < lo) lo = v; if (v > hi) hi = v;
  }
  const span = Math.max(1e-3, hi - lo);
  for (let i = 0; i < w*h; i++){
    const v = (f[i] - lo) / span;
    d[i*4] = d[i*4+1] = d[i*4+2] = 0;
    d[i*4+3] = (0.52 + v * 0.48) * 255;
  }
  x2.putImageData(px, 0, 0);
  return c;
}

function buildTex(){
  if (!VW || !VH) return;
  if (!NOISE) NOISE = buildNoise();
  /* the tooth is the paper, so it holds still under a mark that now persists */
  const w = Math.ceil(VW), h = Math.ceil(VH);
  tex.width = w; tex.height = h;
  tctx.setTransform(1,0,0,1,0,0);
  tctx.globalCompositeOperation = "source-over";
  tctx.fillStyle = tctx.createPattern(NOISE, "repeat");
  tctx.fillRect(0, 0, w, h);
  if (LOW){
    tctx.globalCompositeOperation = "destination-in";
    tctx.drawImage(LOW, 0, 0, w, h);
  }
  if (edge.width > 1){
    /* the falloff at the edge of the sheet is baked in here rather than
       composited every frame — it never changes between resizes */
    tctx.globalCompositeOperation = "destination-in";
    tctx.drawImage(edge, 0, 0, w, h);
  }
  tctx.globalCompositeOperation = "source-over";
  CAP = parseFloat(css("--smudge-max")) || 0.3;
}

/* The sheet has edges. Fade into them instead of letting the clip cut. */
function buildEdge(){
  const w = Math.max(1, Math.ceil(VW)), h = Math.max(1, Math.ceil(VH));
  edge.width = w; edge.height = h;
  ectx.setTransform(1,0,0,1,0,0);
  ectx.globalCompositeOperation = "source-over";
  ectx.fillStyle = "#000";
  ectx.fillRect(0, 0, w, h);
  ectx.globalCompositeOperation = "destination-out";
  const fx = Math.min(72, w * 0.09), fy = Math.min(64, h * 0.14);
  [[0,0,fx,0], [w,0,w-fx,0], [0,0,0,fy], [0,h,0,h-fy]].forEach(([x0,y0,x1,y1]) => {
    const g = ectx.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0, "rgba(0,0,0,1)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ectx.fillStyle = g;
    ectx.fillRect(0, 0, w, h);
  });
  ectx.globalCompositeOperation = "source-over";
}

/* ---------- the frame ---------- */
function blob(c, p, R, a){
  const sp = Math.min(1, Math.hypot(p.dx, p.dy) / 70);   // how fast the hand moved
  c.save();
  c.translate(p.x, p.y);
  if (sp > 0.02) c.rotate(Math.atan2(p.dy, p.dx));
  c.scale(1 + sp * 0.8, 1 / (1 + sp * 0.28));            // a sweep smears
  const g = c.createRadialGradient(0, 0, 0, 0, 0, R);
  g.addColorStop(0,    "rgba(0,0,0," + a.toFixed(3) + ")");
  g.addColorStop(0.28, "rgba(0,0,0," + (a * 0.66).toFixed(3) + ")");
  g.addColorStop(0.62, "rgba(0,0,0," + (a * 0.22).toFixed(3) + ")");
  g.addColorStop(1,    "rgba(0,0,0,0)");
  c.fillStyle = g;
  c.beginPath(); c.arc(0, 0, R, 0, 6.283185); c.fill();
  c.restore();
}

/* the stick, not the whole hero: a mark you can place, not a cloud you sit in */
const brush = () => Math.max(96, Math.min(210, VW * 0.115));

/* lay down whatever the hand did this frame */
function stamp(){
  const R = brush();
  mctx.globalCompositeOperation = "source-over";
  if (pending.length){
    for (let i = 0; i < pending.length; i++) blob(mctx, pending[i], R, 0.50);
    pending.length = 0;
    charge = 1;
  } else if (hover && lastX >= 0){
    /* a resting hand keeps pressing, but settles rather than going black */
    blob(mctx, {x:lastX, y:lastY, dx:0, dy:0}, R, 0.20);
    charge = 1;
  }
}

/* and rub a little of the whole thing away */
function lift(){
  mctx.globalCompositeOperation = "destination-out";
  mctx.fillStyle = "rgba(0,0,0," + FADE + ")";
  mctx.fillRect(0, 0, VW, VH);
  mctx.globalCompositeOperation = "source-over";
  charge *= 1 - FADE;
}

function render(){
  if (!VW || !VH) return;
  ctx.clearRect(0, 0, VW, VH);
  if (charge <= 0.004) return;                // the hero rests as clean paper

  octx.globalCompositeOperation = "source-over";
  octx.clearRect(0, 0, VW, VH);
  octx.drawImage(mask, 0, 0, VW, VH);              // the shape that was drawn
  /* squared. A linear falloff is an airbrush; charcoal has a core that is
     nearly solid and an edge that breaks up fast, and squaring the alpha is
     what the first version of this effect did to get there. */
  octx.globalCompositeOperation = "source-in";
  octx.drawImage(mask, 0, 0, VW, VH);
  octx.drawImage(tex, 0, 0, VW, VH);          // tooth, and the sheet's edge, in one
  octx.globalCompositeOperation = "source-over";

  ctx.globalAlpha = CAP;
  ctx.drawImage(off, 0, 0, VW, VH);
  ctx.globalAlpha = 1;
}

function resize(){
  const r = cv.getBoundingClientRect();
  if (!r.width || !r.height) return;
  VW = r.width; VH = r.height;
  /* 1x on purpose: the grain is authored in CSS pixels, so a larger backing
     store interpolates the same tile at 2.25x the fill rate and looks no
     sharper. Six full-canvas composites a frame have to stay cheap. */
  S = 1;
  const w = Math.max(1, Math.round(VW * S)), h = Math.max(1, Math.round(VH * S));
  cv.width = w;   cv.height = h;   ctx.setTransform(S, 0, 0, S, 0, 0);
  off.width = w;  off.height = h;  octx.setTransform(S, 0, 0, S, 0, 0);
  mask.width = w; mask.height = h; mctx.setTransform(S, 0, 0, S, 0, 0);
  charge = 0;                     // resizing the buffer wipes the mark with it
  buildEdge(); buildTex(); render();
}

function tick(now){
  rafId = null;
  if (!running || reduced.matches || document.hidden) return;
  if (now - last >= 32){
    last = now;
    stamp(); lift(); render();
    if (charge <= 0.004){                     // nothing left to draw — stop the loop
      mctx.clearRect(0, 0, VW, VH);
      return;
    }
  }
  rafId = requestAnimationFrame(tick);
}
function start(){
  if (rafId !== null || !running || reduced.matches || document.hidden) return;
  last = 0; rafId = requestAnimationFrame(tick);
}

(function loadPlate(){
  const im = new Image();
  im.crossOrigin = "anonymous";
  im.decoding = "async";
  im.onload = () => { LOW = buildLow(im); buildTex(); render(); };
  im.src = PLATES[2].src;   // "Drift"
})();

/* the ink colour flips with the theme, so the tooth has to be rebuilt */
function retheme(){ NOISE = null; buildTex(); render(); }
window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", retheme);
new MutationObserver(retheme)
  .observe(document.documentElement, {attributes:true, attributeFilter:["data-theme"]});

window.addEventListener("resize", () => { resize(); drawChart(false); });
document.addEventListener("visibilitychange", () => { if (!document.hidden) start(); });
reduced.addEventListener("change", () => { render(); start(); });
function repaint(){ setTimeout(() => { render(); drawChart(false); drawScatter(false); drawCoef(); buildTable(); }, 40); }
window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", repaint);
new MutationObserver(repaint)
  .observe(document.documentElement, {attributes:true, attributeFilter:["data-theme"]});

document.fonts && document.fonts.ready.then(resize);
resize(); start();
drawChart(false); drawScatter(false); drawCoef(); buildTable();

/* animate each chart once, the first time it is actually seen */
new IntersectionObserver((es,obs) => es.forEach(e => {
  if (!e.isIntersecting) return;
  obs.unobserve(e.target);
  (e.target.id === "scatterwrap" ? drawScatter : drawChart)(true);
}), {threshold:0.25}).observe(document.getElementById("scatterwrap"));
if (location.hash === "#drawings") show("art", false);


/* ══════════════════════════════════════════════════════════════
   8 · CRASH MAP — no basemap. The state is drawn out of the
       crashes themselves. Payload is fetched only when seen.
   ══════════════════════════════════════════════════════════════ */
(function crashmap(){
  const cv = document.getElementById("crashmap");
  if (!cv) return;
  const ctx = cv.getContext("2d");
  const hint = document.getElementById("maphint");
  const wrap = document.getElementById("mapwrap");
  let D = null;                              // {bbox, n, xy:Uint16Array, cls:Uint8Array}
  const show = {0:true, 1:true, 2:true};     // mv / ped / bike
  let ksiOnly = false;

  const COL = [null, "--s2", "--s3"];        // ped, bike take the categorical hues
  const AR  = () => {                        // correct for longitude compression at 42°N
    const [lo0, la0, lo1, la1] = D.bbox;
    return ((lo1 - lo0) * Math.cos((la0 + la1) / 2 * Math.PI / 180)) / (la1 - la0);
  };

  function size(){
    const w = wrap.clientWidth;
    if (!w || !D) return false;
    cv.width  = Math.round(w * Math.min(2, devicePixelRatio));
    cv.height = Math.round(cv.width / AR());
    cv.style.height = Math.round(w / AR()) + "px";
    return true;
  }

  function draw(){
    if (!D) return;
    const W = cv.width, H = cv.height;
    ctx.clearRect(0, 0, W, H);
    const ink = css("--smudge-rgb");
    const cols = [null, css("--s2"), css("--s3")];

    // motor vehicle first, faint — these are what draw the roads
    if (show[0]){
      ctx.fillStyle = "rgba(" + ink + ",0.30)";
      for (let i = 0; i < D.n; i++){
        const c = D.cls[i];
        if ((c & 3) !== 0) continue;
        if (ksiOnly && !(c & 4)) continue;
        ctx.fillRect(D.xy[i*2] / 65535 * W, D.xy[i*2+1] / 65535 * H, 1, 1);
      }
    }
    // vulnerable users on top, in colour, slightly larger so they survive the density
    for (let m = 1; m <= 2; m++){
      if (!show[m]) continue;
      ctx.fillStyle = cols[m];
      for (let i = 0; i < D.n; i++){
        const c = D.cls[i];
        if ((c & 3) !== m) continue;
        if (ksiOnly && !(c & 4)) continue;
        const x = D.xy[i*2] / 65535 * W, y = D.xy[i*2+1] / 65535 * H;
        ctx.globalAlpha = (c & 4) ? 1 : 0.62;
        ctx.fillRect(x, y, (c & 4) ? 2.5 : 1.6, (c & 4) ? 2.5 : 1.6);
      }
      ctx.globalAlpha = 1;
    }
  }

  function b64(s){
    const bin = atob(s), out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }

  let loading = false;
  function load(){
    if (D || loading) return;
    loading = true;
    fetch("assets/crashes-2025.json")
      .then(r => r.json())
      .then(j => {
        const raw = b64(j.xy);
        D = {bbox:j.bbox, n:j.n, xy:new Uint16Array(raw.buffer, raw.byteOffset, j.n*2),
             cls:b64(j.cls)};
        hint.classList.add("gone");
        if (size()) draw();
      })
      .catch(() => { hint.textContent = "map data could not be loaded"; });
  }

  document.getElementById("maplegend").innerHTML =
    "<span><i style='background:rgba(" + "128,128,136" + ",.6)'></i>Motor vehicle</span>" +
    "<span><i style='background:var(--s2)'></i>Pedestrian</span>" +
    "<span><i style='background:var(--s3)'></i>Bicyclist</span>" +
    "<span style='color:var(--muted)'>· larger marks are killed or seriously injured</span>";

  [["mp-mv",0],["mp-ped",1],["mp-bike",2]].forEach(([id,m]) => {
    const b = document.getElementById(id);
    b.addEventListener("click", () => {
      show[m] = !show[m];
      b.setAttribute("aria-pressed", show[m] ? "true" : "false");
      draw();
    });
  });
  const bk = document.getElementById("mp-ksi");
  bk.addEventListener("click", () => {
    ksiOnly = !ksiOnly;
    bk.setAttribute("aria-pressed", ksiOnly ? "true" : "false");
    draw();
  });

  window.addEventListener("resize", () => { if (D && size()) draw(); });
  window.addEventListener("viewchange", () => { if (D && size()) draw(); });
  new MutationObserver(() => setTimeout(draw, 40))
    .observe(document.documentElement, {attributes:true, attributeFilter:["data-theme"]});
  window.matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", () => setTimeout(draw, 40));

  new IntersectionObserver((es, obs) => es.forEach(e => {
    if (!e.isIntersecting) return;
    obs.disconnect();
    load();
  }), {rootMargin:"200px"}).observe(wrap);
})();

/* ── paper parallax ──────────────────────────────────────────────
   The grain drifts a few pixels against the cursor, which is what keeps
   the digital sections feeling like the same sheet as the drawings. Only
   a custom property changes; the overlay is moved with transform, so
   nothing repaints. rAF is used here as a throttle, not a loop — it is
   scheduled only when a new pointer position has arrived.              */
(function paperParallax(){
  if (reduced.matches) return;
  const root = document.documentElement;
  let px = 0, py = 0, queued = false;
  function apply(){
    queued = false;
    root.style.setProperty("--gx", px.toFixed(1) + "px");
    root.style.setProperty("--gy", py.toFixed(1) + "px");
  }
  window.addEventListener("pointermove", e => {
    if (e.pointerType !== "mouse") return;
    px = (e.clientX / innerWidth  - 0.5) * -10;   // ±5px, below conscious notice
    py = (e.clientY / innerHeight - 0.5) * -10;
    if (!queued){ queued = true; requestAnimationFrame(apply); }
  }, {passive:true});
  reduced.addEventListener("change", () => {
    if (reduced.matches){
      root.style.setProperty("--gx", "0px");
      root.style.setProperty("--gy", "0px");
    }
  });
})();

/* ══════════════════════════════════════════════════════════════
   10 · WORK — track filter

   She is aiming at six job titles and the work splits cleanly between them, so
   the reader can cut the section down to the one they are hiring for. The
   tracks were already declared on every piece in data-tracks; this is the
   control that reads them. Additive: with JS off the bar stays hidden and both
   sections are exactly what they were.
   ══════════════════════════════════════════════════════════════ */
(function workFilter(){
  const bar = document.getElementById("workbar");
  if (!bar) return;
  const pieces = [...document.querySelectorAll("[data-tracks]")];
  if (!pieces.length) return;

  const TRACKS = [["all","All"], ["ai","AI systems"], ["ds","Data science"],
                  ["analytics","Analytics"], ["consulting","Consulting"]];
  const has = (n,t) => t === "all" ||
    (" " + n.dataset.tracks + " ").indexOf(" " + t + " ") > -1;

  const tracksEl = document.getElementById("tracks");
  const count    = document.getElementById("workcount");
  const more     = document.getElementById("more");
  const minis    = document.querySelector(".minis");

  tracksEl.innerHTML = TRACKS.map(([k,label],i) =>
    '<button type="button" data-track="' + k + '" aria-pressed="' + (i === 0) + '">' +
    label + "</button>").join("");

  function apply(track){
    let n = 0;
    pieces.forEach(el => {
      const on = has(el, track);
      el.hidden = !on;
      /* a piece the filter brings back must not sit at opacity 0 waiting for a
         scroll that already happened */
      if (on){ n++; el.classList.add("in"); }
    });
    /* an empty container is worse than no container: drop the wrapper, and the
       whole More work section, when the filter leaves them with nothing */
    const liveMinis = minis && [...minis.children].some(c => !c.hidden);
    if (minis) minis.hidden = !liveMinis;
    if (more)  more.hidden  = !(liveMinis || [...more.querySelectorAll(".cs")].some(c => !c.hidden));
    /* the first surviving case study should not carry a rule above it */
    document.querySelectorAll("#work .cs, #more .cs").forEach(c => c.classList.remove("is-top"));
    ["work","more"].forEach(id => {
      const sec = document.getElementById(id);
      if (!sec) return;
      const first = [...sec.querySelectorAll(".cs")].find(c => !c.hidden);
      if (first) first.classList.add("is-top");
    });
    count.textContent = n + (n === 1 ? " piece" : " pieces");
  }

  tracksEl.addEventListener("click", e => {
    const b = e.target.closest("button[data-track]");
    if (!b) return;
    [...tracksEl.children].forEach(x => x.setAttribute("aria-pressed", x === b));
    apply(b.dataset.track);
  });

  apply("all");
  bar.hidden = false;

  /* a piece linked to directly — from an application email, or a DM */
  const h = location.hash.slice(1);
  if (h && pieces.some(el => el.id === h))
    setTimeout(() => document.getElementById(h).scrollIntoView(), 0);

  /* ---------- charts that scroll sideways get an edge, not a crop ---------- */
  const wraps = [...document.querySelectorAll(".chartwrap")];
  function overflow(){
    wraps.forEach(w => {
      if (w.scrollWidth > w.clientWidth + 4) w.dataset.of = "1";
      else delete w.dataset.of;
    });
  }
  overflow();
  window.addEventListener("resize", overflow);
  window.addEventListener("viewchange", () => setTimeout(overflow, 60));
  document.fonts && document.fonts.ready.then(overflow);
})();
