(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const ce = (tag, cls) => { const e = document.createElement(tag); if (cls) e.className = cls; return e; };
  const lang = () => I18N.lang();
  const pick = (en, zh) => { const l = lang(); if (l === "zh") return zh || en || ""; return en || zh || ""; };
  const T = (k) => I18N.t(k);

  const BASEMAP = "https://mapapi.geodata.gov.hk/gs/api/v1.0.0/xyz/basemap/wgs84/{z}/{x}/{y}.png";
  const HK_CENTER = [22.3193, 114.1694];
  const FAV_KEY = "hktransit_favs";
  const RECENT_KEY = "hktransit_recent";
  const CACHE_KEY = "hktransit_stops_cache_v1";
  const MODE_COLOR = { kmb: "#d63031", ctb: "#e17055", gmb: "#00b894", mtr: "#0984e3" };

  let map, stopLayer, mtrLayer, nearmeLayer;
  let allStops = [];
  let stopIndex = new Map();
  let routeMetaKmb = new Map();
  let loadedStops = false;
  let addedStopMarkers = new Map();
  let pinsVisible = true;
  let activeMtrLine = null;
  let currentContext = null;
  let refreshTimer = null;

  function toast(msg) { const t = $("toast"); t.textContent = msg; t.hidden = false; clearTimeout(t._timer); t._timer = setTimeout(() => { t.hidden = true; }, 2200); }
  function setLastUpdated() { $("lastUpdated").textContent = T("updated") + " " + new Date().toLocaleTimeString(); }
  function hideFirstHint() { const h = $("firstHint"); if (h) h.hidden = true; }

  function init() {
    I18N.applyI18n();
    setupMap();
    setupMapControls();
    setupMtrPicker();
    setupSearch();
    renderFavs();
    renderRecents();
    renderEmptyBoard();
    $("langToggle").addEventListener("click", () => { I18N.toggle(); rerenderAll(); });
    $("refreshBtn").addEventListener("click", () => refreshCurrent(true));
    $("boardFav").addEventListener("click", toggleCurrentFav);
    $("locateBtn").addEventListener("click", locateMe);
    refreshTimer = setInterval(() => { if (currentContext) renderCurrent(); }, 30000);
    setTimeout(hideFirstHint, 14000);
    window.addEventListener("resize", () => { if (map) map.invalidateSize(); });
  }

  function rerenderAll() {
    if (currentContext) renderCurrent(); else renderEmptyBoard();
    renderFavs();
    renderRecents();
    buildMtrLines();
    const pb = $("pinsBtn") && $("pinsBtn").querySelector("span");
    if (pb) pb.textContent = T(pinsVisible ? "hide_pins" : "show_pins");
  }

  function setupMap() {
    map = L.map("map", { zoomControl: true, attributionControl: true }).setView(HK_CENTER, 13);
    L.tileLayer(BASEMAP, { maxZoom: 19, attribution: "© LandsD / geodata.gov.hk" }).addTo(map);
    stopLayer = L.layerGroup().addTo(map);
    mtrLayer = L.layerGroup().addTo(map);
    nearmeLayer = L.layerGroup().addTo(map);
    map.on("moveend zoomend", updateMapMarkers);
    addMtrMarkers();
    ensureStopsLoaded().then(updateMapMarkers).catch(() => {});
    setTimeout(() => { if (map) map.invalidateSize(); }, 60);
  }
  function setupMapControls() {
    $("mtrBtn").addEventListener("click", openMtrSheet);
    $("legendBtn").addEventListener("click", () => { const l = $("mapLegend"); l.hidden = !l.hidden; });
    $("pinsBtn").addEventListener("click", togglePins);
    const fh = $("firstHintClose"); if (fh) fh.addEventListener("click", hideFirstHint);
  }
  function togglePins() {
    pinsVisible = !pinsVisible;
    if (pinsVisible) { stopLayer.addTo(map); updateMapMarkers(); }
    else { map.removeLayer(stopLayer); }
    const span = $("pinsBtn").querySelector("span"); span.textContent = T(pinsVisible ? "hide_pins" : "show_pins");
  }
  function addMtrMarkers() {
    MTR.STATIONS.forEach(s => {
      const ln = MTR.lineByCode(s.line);
      const color = ln ? ln.color : "#0984e3";
      const icon = L.divIcon({ html: '<span class="mtr-dot" style="background:' + color + '"></span>', className: "mtr-icon", iconSize: [14, 14] });
      const m = L.marker([s.lat, s.lng], { icon }).addTo(mtrLayer);
      m.bindTooltip(pick(s.en, s.zh) + " · " + (ln ? pick(ln.en, ln.zh) : s.line), { direction: "top" });
      m.on("click", () => openContext({ type: "mtr", line: s.line, sta: s.code, name: pick(s.en, s.zh) }));
    });
  }

  function openMtrSheet() { $("mtrSheet").hidden = false; buildMtrLines(); }
  function closeMtrSheet() { $("mtrSheet").hidden = true; }
  function setupMtrPicker() {
    $("mtrSheetClose").addEventListener("click", closeMtrSheet);
    $("mtrSheet").addEventListener("click", e => { if (e.target.id === "mtrSheet") closeMtrSheet(); });
    buildMtrLines();
  }
  function buildMtrLines() {
    const box = $("mtrLines"); if (!box) return;
    box.innerHTML = "";
    MTR.MTR_LINES.forEach(l => {
      const chip = ce("button", "line-chip"); chip.dataset.line = l.code; chip.dataset.color = l.color;
      chip.style.borderColor = l.color; chip.style.color = l.color;
      const dot = ce("span", "line-dot"); dot.style.background = l.color;
      chip.appendChild(dot); chip.appendChild(document.createTextNode(pick(l.en, l.zh)));
      chip.onclick = () => showMtrStations(l.code);
      box.appendChild(chip);
    });
    if (activeMtrLine) showMtrStations(activeMtrLine);
  }
  function showMtrStations(line) {
    activeMtrLine = line;
    document.querySelectorAll("#mtrLines .line-chip").forEach(c => {
      const on = c.dataset.line === line;
      c.classList.toggle("active", on);
      const col = c.dataset.color || "#0984e3";
      if (on) { c.style.background = col; c.style.color = "#fff"; c.querySelector(".line-dot").style.background = "#fff"; }
      else { c.style.background = ""; c.style.color = col; c.querySelector(".line-dot").style.background = col; }
    });
    const ln = MTR.lineByCode(line);
    const box = $("mtrStations"); box.innerHTML = "";
    const head = ce("div", "dir-head"); head.textContent = (ln ? pick(ln.en, ln.zh) : line) + " · " + T("select_station");
    box.appendChild(head);
    const wrap = ce("div", "stop-list");
    MTR.STATIONS.filter(s => s.line === line).forEach(s => {
      const item = ce("div", "stop-item");
      const name = ce("div", "stop-name"); name.textContent = pick(s.en, s.zh);
      const sub = ce("div", "stop-sub"); sub.textContent = s.code;
      item.appendChild(name); item.appendChild(sub);
      item.onclick = () => { closeMtrSheet(); openContext({ type: "mtr", line: s.line, sta: s.code, name: pick(s.en, s.zh) }); };
      wrap.appendChild(item);
    });
    box.appendChild(wrap);
  }

  async function ensureStopsLoaded() {
    if (loadedStops) return;
    if (loadStopsCache()) {
      loadedStops = true;
      $("mapLoading").hidden = true;
      refreshStopsInBackground();
      return;
    }
    $("mapLoading").hidden = false;
    const sp = API.KMB.stops();
    const rp = API.KMB.routes().catch(() => null);
    try {
      const r = await sp;
      (r.data || []).forEach(s => stopIndex.set("kmb:" + s.stop, { mode: "kmb", id: s.stop, lat: +s.lat, lng: +s.long, nameEn: s.name_en, nameZh: s.name_tc }));
      allStops = Array.from(stopIndex.values());
      loadedStops = true;
      $("mapLoading").hidden = true;
      if (map) updateMapMarkers();
      const rd = await rp;
      if (rd && rd.data) rd.data.forEach(rm => routeMetaKmb.set(rm.route + "|" + rm.bound + "|" + rm.service_type, rm));
      saveStopsCache(compactStops(r.data), rd && rd.data ? compactRoutes(rd.data) : null);
    } catch (e) {
      console.warn("KMB stops failed", e);
      $("mapLoading").hidden = true;
    }
  }

  let refreshing = false;
  function refreshStopsInBackground() {
    if (refreshing) return;
    refreshing = true;
    Promise.all([API.KMB.stops().catch(() => null), API.KMB.routes().catch(() => null)]).then(([s, r]) => {
      refreshing = false;
      if (!s || !s.data) return;
      const ni = new Map();
      s.data.forEach(x => ni.set("kmb:" + x.stop, { mode: "kmb", id: x.stop, lat: +x.lat, lng: +x.long, nameEn: x.name_en, nameZh: x.name_tc }));
      stopIndex = ni;
      allStops = Array.from(stopIndex.values());
      if (r && r.data) {
        const nm = new Map();
        r.data.forEach(rm => nm.set(rm.route + "|" + rm.bound + "|" + rm.service_type, rm));
        routeMetaKmb = nm;
      }
      saveStopsCache(compactStops(s.data), r && r.data ? compactRoutes(r.data) : null);
      if (stopLayer) stopLayer.clearLayers();
      addedStopMarkers.clear();
      if (map && pinsVisible) updateMapMarkers();
      if (currentContext && currentContext.mode === "kmb") renderCurrent();
    });
  }

  function loadStopsCache() {
    try {
      const c = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
      if (!c || !Array.isArray(c.stops) || !c.stops.length) return false;
      c.stops.forEach(s => stopIndex.set("kmb:" + s[0], { mode: "kmb", id: s[0], lat: s[1], lng: s[2], nameEn: s[3], nameZh: s[4] }));
      if (Array.isArray(c.routes)) c.routes.forEach(r => routeMetaKmb.set(r[0] + "|" + r[1] + "|" + r[2], { route: r[0], bound: r[1], service_type: r[2], dest_en: r[3], dest_tc: r[4] }));
      allStops = Array.from(stopIndex.values());
      return true;
    } catch (e) { return false; }
  }
  function saveStopsCache(stops, routes) {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), stops, routes })); } catch (e) { /* quota */ }
  }
  function compactStops(data) { return (data || []).map(s => [s.stop, +s.lat, +s.long, s.name_en, s.name_tc]); }
  function compactRoutes(data) { return (data || []).map(r => [r.route, r.bound, r.service_type, r.dest_en, r.dest_tc]); }

  function updateMapMarkers() {
    if (!map || !loadedStops || !pinsVisible) return;
    const b = map.getBounds();
    const inView = [];
    for (const s of allStops) if (b.contains(L.latLng(s.lat, s.lng))) inView.push(s);
    const hint = $("zoomHint");
    if (inView.length > 400) { hint.hidden = false; return; }
    hint.hidden = true;
    const inIds = new Set(inView.map(s => "kmb:" + s.id));
    for (const [key, m] of addedStopMarkers) if (!inIds.has(key)) { stopLayer.removeLayer(m); addedStopMarkers.delete(key); }
    for (const s of inView) {
      const key = "kmb:" + s.id;
      if (addedStopMarkers.has(key)) continue;
      const m = L.circleMarker([s.lat, s.lng], { radius: 5, color: MODE_COLOR.kmb, weight: 1, fillOpacity: 0.8 });
      m.bindTooltip(pick(s.nameEn, s.nameZh), { direction: "top" });
      m.on("click", () => openContext({ type: "stop", mode: "kmb", stopId: s.id, name: pick(s.nameEn, s.nameZh) }));
      m.addTo(stopLayer);
      addedStopMarkers.set(key, m);
    }
  }

  function renderEmptyBoard() {
    $("boardTitle").textContent = T("select_stop");
    const fav = $("boardFav"); fav.textContent = "☆"; fav.classList.remove("fav-on");
    const list = $("boardList"); list.innerHTML = '<div class="empty">' + T("empty_board") + '</div>';
  }

  function openContext(ctx) {
    hideFirstHint();
    currentContext = ctx;
    setBoardTitle(ctx);
    renderCurrent();
    const board = $("board"); if (board) board.scrollTo({ top: 0, behavior: "smooth" });
  }

  function setBoardTitle(ctx) {
    let title = T("select_stop");
    if (ctx.type === "stop") title = (ctx.routeLabel ? ctx.routeLabel + " · " : "") + (ctx.name || "");
    else if (ctx.type === "mtr") title = ctx.name || ctx.line;
    $("boardTitle").textContent = title;
    const fav = $("boardFav");
    const isFav = isFavorite(ctx);
    fav.textContent = isFav ? "★" : "☆";
    fav.classList.toggle("fav-on", isFav);
    fav.title = isFav ? T("remove_fav") : T("add_fav");
  }
  function toggleCurrentFav() {
    if (!currentContext) return;
    if (isFavorite(currentContext)) { removeFavorite(currentContext); toast(T("fav_removed")); }
    else { addFavorite(currentContext); toast(T("fav_added")); }
    setBoardTitle(currentContext);
    renderFavs();
  }

  function etaGroupCard(g) {
    const card = ce("div", "eta-card grouped");
    const left = ce("div", "eta-left");
    const route = ce("div", "eta-route"); route.textContent = g.route || "—";
    const meta = ce("div", "eta-meta");
    let dest = g.dest; if (dest && typeof dest === "object") dest = pick(dest.en, dest.zh);
    const parts = []; if (dest) parts.push(dest); if (g.platform) parts.push(T("platform") + " " + g.platform);
    meta.textContent = parts.join(" · ");
    left.appendChild(route); left.appendChild(meta);
    const pills = ce("div", "eta-pills");
    const shown = g.pills.slice(0, 4);
    shown.forEach(p => { const pl = ce("span", "pill " + p.cls); pl.textContent = p.text; pills.appendChild(pl); });
    if (g.pills.length > shown.length) { const more = ce("span", "pill more"); more.textContent = "+" + (g.pills.length - shown.length) + " " + T("more"); pills.appendChild(more); }
    card.appendChild(left); card.appendChild(pills);
    return card;
  }

  function renderEtasInto(cont, etas) {
    cont.innerHTML = "";
    if (!etas || etas.length === 0) { const e = ce("div", "empty"); e.textContent = T("no_eta"); cont.appendChild(e); setLastUpdated(); return; }
    const groups = new Map();
    etas.forEach(e => {
      const key = e.isMtr ? (e.route + "|" + (e.platform || "")) : (e.route || "_");
      if (!groups.has(key)) groups.set(key, { route: e.route, dest: e.dest, platform: e.platform, isMtr: e.isMtr, pills: [] });
      groups.get(key).pills.push({ text: e.text, cls: e.cls });
    });
    Array.from(groups.values()).forEach(g => cont.appendChild(etaGroupCard(g)));
    setLastUpdated();
  }

  function renderCurrent() {
    if (!currentContext) { renderEmptyBoard(); return; }
    const cont = $("boardList");
    cont.innerHTML = '<div class="empty">' + T("loading_eta") + '</div>';
    fetchEtas(currentContext).then(etas => renderEtasInto(cont, etas)).catch(e => { console.warn(e); cont.innerHTML = '<div class="empty">' + T("load_error") + '</div>'; });
  }

  async function fetchEtas(ctx) {
    if (ctx.type === "mtr") { const r = await API.MTR.schedule(ctx.line, ctx.sta); return MTR.parseMtrSchedule(r); }
    if (ctx.mode === "kmb") {
      const r = ctx.route && ctx.serviceType !== undefined ? await API.KMB.eta(ctx.stopId, ctx.route, ctx.serviceType) : await API.KMB.stopEta(ctx.stopId);
      return normalizeKmb(r.data || []);
    }
    if (ctx.mode === "ctb") { const r = await API.CTB.eta(ctx.stopId, ctx.route); return normalizeCtb(r.data || [], ctx.dest); }
    if (ctx.mode === "gmb") { const r = await API.GMB.eta(ctx.routeId, ctx.routeSeq, ctx.seq); return normalizeGmb(r, ctx); }
    return [];
  }

  function normalizeKmb(data) {
    return data.filter(x => x.eta).map(x => {
      const bound = x.dir === 1 ? "O" : "I";
      const meta = routeMetaKmb.get(x.route + "|" + bound + "|" + x.service_type);
      const f = API.formatEta(x.eta);
      return { route: x.route, dest: meta ? pick(meta.dest_en, meta.dest_tc) : "", text: f.text, cls: f.cls };
    });
  }
  function normalizeCtb(data, dest) {
    return data.filter(x => x.eta).map(x => { const f = API.formatEta(x.eta); return { route: x.route, dest: dest || "", text: f.text, cls: f.cls }; });
  }
  function normalizeGmb(resp, ctx) {
    const arr = (resp && resp.data && resp.data.eta) || [];
    return arr.map(x => { const f = API.formatMin(x.diff); return { route: ctx.routeLabel, dest: ctx.dest || "", text: f.text, cls: f.cls }; });
  }

  function refreshCurrent(showToast) { if (!currentContext) { if (showToast) toast(T("no_data")); return; } if (showToast) toast(T("refreshing")); renderCurrent(); }

  function locateMe() {
    if (!navigator.geolocation) { toast(T("geo_unavailable")); return; }
    $("nearmeList").innerHTML = '<div class="empty">' + T("loading_eta") + '</div>';
    navigator.geolocation.getCurrentPosition(pos => {
      const { latitude, longitude } = pos.coords;
      map.setView([latitude, longitude], 16);
      nearmeLayer.clearLayers();
      L.circleMarker([latitude, longitude], { radius: 8, color: "#0984e3", fillColor: "#0984e3", fillOpacity: 0.4 }).addTo(nearmeLayer);
      renderNearby(latitude, longitude);
    }, err => {
      toast(err.code === err.PERMISSION_DENIED ? T("geo_denied") : T("geo_error"));
      $("nearmeList").innerHTML = '<div class="empty">' + T("geo_error") + '</div>';
    }, { enableHighAccuracy: true, timeout: 10000 });
  }

  async function renderNearby(lat, lng) {
    await ensureStopsLoaded();
    const src = allStops.map(s => ({ mode: "kmb", id: s.id, lat: s.lat, lng: s.lng, nameEn: s.nameEn, nameZh: s.nameZh }))
      .concat(MTR.STATIONS.map(s => ({ mode: "mtr", id: s.code, lat: s.lat, lng: s.lng, nameEn: s.en, nameZh: s.zh, line: s.line, sta: s.code })));
    const near = src.map(s => ({ ...s, d: haversine(lat, lng, s.lat, s.lng) })).sort((a, b) => a.d - b.d).slice(0, 30);
    const list = $("nearmeList"); list.innerHTML = "";
    near.forEach(s => {
      L.circleMarker([s.lat, s.lng], { radius: 6, color: MODE_COLOR[s.mode], fillOpacity: 0.8 }).addTo(nearmeLayer);
      const item = ce("div", "stop-item");
      const name = ce("div", "stop-name"); name.textContent = pick(s.nameEn, s.nameZh);
      const sub = ce("div", "stop-sub"); sub.textContent = (s.mode === "mtr" ? T("mtr") : s.mode.toUpperCase()) + " · " + s.d.toFixed(1) + " km";
      item.appendChild(name); item.appendChild(sub);
      item.onclick = () => {
        if (s.mode === "mtr") openContext({ type: "mtr", line: s.line, sta: s.sta, name: pick(s.nameEn, s.nameZh) });
        else openContext({ type: "stop", mode: "kmb", stopId: s.id, name: pick(s.nameEn, s.nameZh) });
      };
      list.appendChild(item);
    });
    if (near.length === 0) list.innerHTML = '<div class="empty">' + T("no_data") + '</div>';
  }

  function haversine(la1, lo1, la2, lo2) {
    const R = 6371, toRad = (d) => d * Math.PI / 180;
    const dLat = toRad(la2 - la1), dLng = toRad(lo2 - lo1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(la1)) * Math.cos(toRad(la2)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(a));
  }

  function setStep(n) {
    const bar = $("stepBar"); if (!bar) return;
    bar.hidden = false;
    bar.querySelectorAll("li").forEach(li => { const s = +li.dataset.step; li.classList.toggle("active", s === n); li.classList.toggle("done", s < n); });
  }

  function setupSearch() {
    $("searchBtn").addEventListener("click", doSearch);
    $("routeInput").addEventListener("keydown", e => { if (e.key === "Enter") doSearch(); });
    document.querySelectorAll(".examples .chip").forEach(c => c.addEventListener("click", () => {
      $("searchMode").value = c.dataset.mode; $("routeInput").value = c.dataset.route; doSearch();
    }));
  }

  async function doSearch() {
    const mode = $("searchMode").value;
    const route = $("routeInput").value.trim();
    if (!route) return;
    setStep(2);
    $("searchStatus").textContent = T("loading_eta");
    $("routeStops").innerHTML = "";
    let ok = false;
    try {
      await ensureStopsLoaded();
      if (mode === "kmb") ok = await searchKmb(route);
      else if (mode === "ctb") ok = await searchCtb(route);
      else if (mode === "gmb") ok = await searchGmb(route);
    } catch (e) { console.warn(e); $("searchStatus").textContent = T("load_error"); }
    if (ok) addRecent(mode, route);
  }

  async function searchKmb(route) {
    const r = await API.KMB.routes();
    const matches = (r.data || []).filter(x => x.route === route);
    $("searchStatus").textContent = "";
    if (matches.length === 0) { $("searchStatus").textContent = T("route_not_found"); return false; }
    renderDirections(matches.map(m => ({ label: pick(m.orig_en + " → " + m.dest_en, m.orig_tc + " → " + m.dest_tc), action: () => pickKmbRoute(m) })));
    return true;
  }
  async function pickKmbRoute(m) {
    const dir = m.bound === "O" ? 1 : 2;
    const rs = await API.KMB.routeStops(m.route, dir, m.service_type);
    renderStopChoices((rs.data || []).map(s => {
      const stop = stopIndex.get("kmb:" + s.stop);
      const name = stop ? pick(stop.nameEn, stop.nameZh) : s.stop;
      return { name, sub: "KMB", onClick: () => openContext({ type: "stop", mode: "kmb", stopId: s.stop, route: m.route, serviceType: m.service_type, routeLabel: m.route, name, dest: pick(m.dest_en, m.dest_tc) }) };
    }));
  }

  async function ctbStopNames(ids) {
    const uniq = Array.from(new Set(ids)).slice(0, 80);
    const m = new Map();
    await Promise.all(uniq.map(id => API.CTB.stop(id).then(r => { const d = r.data; if (d) m.set(id, { en: d.name_en, zh: d.name_tc }); }).catch(() => {})));
    return m;
  }
  async function searchCtb(route) {
    const [ob, ib] = await Promise.all([API.CTB.routeStops(route, "outbound").catch(() => null), API.CTB.routeStops(route, "inbound").catch(() => null)]);
    const dirs = [];
    if (ob && Array.isArray(ob.data) && ob.data.length) dirs.push({ dir: "outbound", stops: ob.data });
    if (ib && Array.isArray(ib.data) && ib.data.length) dirs.push({ dir: "inbound", stops: ib.data });
    $("searchStatus").textContent = "";
    if (dirs.length === 0) { $("searchStatus").textContent = T("route_not_found"); return false; }
    const opts = [];
    for (const dd of dirs) {
      const ids = dd.stops.map(s => s.stop);
      const names = await ctbStopNames(ids);
      const first = names.get(ids[0]); const last = names.get(ids[ids.length - 1]);
      const label = (first ? pick(first.en, first.zh) : "?") + " → " + (last ? pick(last.en, last.zh) : "?");
      const dest = last ? pick(last.en, last.zh) : "";
      opts.push({ label, action: () => pickCtbDir(route, dd.stops, names, dest) });
    }
    renderDirections(opts);
    return true;
  }
  function pickCtbDir(route, stops, names, dest) {
    renderStopChoices(stops.map(s => { const n = names.get(s.stop); const name = n ? pick(n.en, n.zh) : s.stop; return { name, sub: "CTB", onClick: () => openContext({ type: "stop", mode: "ctb", stopId: s.stop, route, routeLabel: route, name, dest }) }; }));
  }

  async function searchGmb(route) {
    const r = await API.GMB.routesAll();
    const regions = r.data && r.data.routes ? r.data.routes : {};
    const hits = [];
    Object.keys(regions).forEach(reg => { if ((regions[reg] || []).indexOf(route) !== -1) hits.push(reg); });
    $("searchStatus").textContent = "";
    if (hits.length === 0) { $("searchStatus").textContent = T("route_not_found"); return false; }
    const details = await Promise.all(hits.map(reg => API.GMB.routeDetail(reg, route).catch(() => null)));
    const opts = [];
    details.forEach((d, idx) => {
      if (!d || !Array.isArray(d.data)) return;
      const reg = hits[idx];
      d.data.forEach(entry => {
        (entry.directions || []).forEach(dir => {
          const label = pick(dir.orig_en + " → " + dir.dest_en, dir.orig_tc + " → " + dir.dest_tc) + (entry.description_en && entry.description_en !== "Normal Departure" ? " (" + pick(entry.description_en, entry.description_tc) + ")" : "") + " (" + reg + ")";
          opts.push({ label, action: () => pickGmbRoute(entry, dir, reg) });
        });
      });
    });
    if (opts.length === 0) { $("searchStatus").textContent = T("route_not_found"); return false; }
    renderDirections(opts);
    return true;
  }
  async function pickGmbRoute(entry, dir, reg) {
    const rs = await API.GMB.routeStops(entry.route_id, dir.route_seq);
    const stops = (rs.data && rs.data.route_stops) || [];
    const dest = pick(dir.dest_en, dir.dest_tc);
    renderStopChoices(stops.map(s => ({ name: pick(s.name_en, s.name_tc), sub: "GMB · " + reg, onClick: () => openContext({ type: "stop", mode: "gmb", stopId: s.stop_id, routeId: entry.route_id, routeSeq: dir.route_seq, seq: s.stop_seq, routeLabel: entry.route_code || String(entry.route_id), name: pick(s.name_en, s.name_tc), dest }) })));
  }

  function renderDirections(dirs) {
    setStep(2);
    const box = $("routeStops"); box.innerHTML = "";
    const head = ce("div", "dir-head"); head.textContent = T("choose_dir"); box.appendChild(head);
    dirs.forEach(d => { const b = ce("button", "dir-btn"); b.textContent = d.label; b.onclick = d.action; box.appendChild(b); });
  }
  function renderStopChoices(items) {
    setStep(3);
    const box = $("routeStops"); box.innerHTML = "";
    const head = ce("div", "dir-head"); head.textContent = T("choose_stop"); box.appendChild(head);
    const wrap = ce("div", "stop-list");
    items.forEach(it => {
      const item = ce("div", "stop-item");
      const name = ce("div", "stop-name"); name.textContent = it.name;
      const sub = ce("div", "stop-sub"); sub.textContent = it.sub;
      item.appendChild(name); item.appendChild(sub);
      item.onclick = it.onClick;
      wrap.appendChild(item);
    });
    box.appendChild(wrap);
  }

  function getRecents() { try { return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]"); } catch (e) { return []; } }
  function saveRecents(a) { localStorage.setItem(RECENT_KEY, JSON.stringify(a)); }
  function addRecent(mode, route) {
    const a = getRecents().filter(r => !(r.mode === mode && r.route === route));
    a.unshift({ mode, route });
    saveRecents(a.slice(0, 8));
    renderRecents();
  }
  function renderRecents() {
    const row = $("recentRow"); const box = $("recentChips"); if (!row || !box) return;
    const a = getRecents();
    if (a.length === 0) { row.hidden = true; box.innerHTML = ""; return; }
    row.hidden = false; box.innerHTML = "";
    a.forEach(r => {
      const c = ce("button", "chip");
      c.textContent = (r.mode === "kmb" ? "" : r.mode.toUpperCase() + " ") + r.route;
      c.onclick = () => { $("searchMode").value = r.mode; $("routeInput").value = r.route; doSearch(); };
      box.appendChild(c);
    });
  }

  function getFavs() { try { return JSON.parse(localStorage.getItem(FAV_KEY) || "[]"); } catch (e) { return []; } }
  function saveFavs(a) { localStorage.setItem(FAV_KEY, JSON.stringify(a)); }
  function ctxKey(c) { return [c.type, c.mode || "", c.stopId || "", c.line || "", c.sta || "", c.route || "", c.routeId || "", c.routeSeq || "", c.seq || "", c.serviceType || ""].join("|"); }
  function isFavorite(c) { return getFavs().some(f => ctxKey(f) === ctxKey(c)); }
  function addFavorite(c) { const a = getFavs(); a.push(c); saveFavs(a); }
  function removeFavorite(c) { saveFavs(getFavs().filter(f => ctxKey(f) !== ctxKey(c))); }

  function renderFavs() {
    const box = $("favList"); if (!box) return; box.innerHTML = "";
    const favs = getFavs();
    if (favs.length === 0) { box.innerHTML = '<div class="empty">' + T("fav_empty") + '</div>'; return; }
    favs.forEach(f => {
      let label = f.routeLabel ? f.routeLabel + " · " : "";
      label += f.name || (f.line ? f.line : "");
      const card = ce("div", "fav-card");
      const top = ce("div", "fav-top");
      const badge = ce("span", "fav-badge"); badge.textContent = (f.mode || "mtr").toUpperCase(); badge.style.background = MODE_COLOR[f.mode || "mtr"] || "#0984e3";
      const nm = ce("div", "fav-name"); nm.textContent = label;
      const del = ce("button", "btn ghost small"); del.textContent = "✕"; del.onclick = e => { e.stopPropagation(); removeFavorite(f); toast(T("fav_removed")); renderFavs(); if (currentContext && ctxKey(currentContext) === ctxKey(f)) setBoardTitle(currentContext); };
      top.appendChild(badge); top.appendChild(nm); top.appendChild(del);
      card.appendChild(top);
      card.onclick = () => openContext(f);
      box.appendChild(card);
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
