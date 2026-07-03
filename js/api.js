(function (global) {
  "use strict";

  async function fetchJSON(url, opts) {
    opts = opts || {};
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), opts.timeout || 15000);
    try {
      const res = await fetch(url, { signal: ctrl.signal, headers: { "Accept": "application/json" } });
      if (!res.ok) throw new Error("HTTP " + res.status + " @ " + url);
      return await res.json();
    } finally {
      clearTimeout(timer);
    }
  }

  const KMB = {
    stops: () => fetchJSON("https://data.etabus.gov.hk/v1/transport/kmb/stop"),
    routes: () => fetchJSON("https://data.etabus.gov.hk/v1/transport/kmb/route"),
    routeStops: (route, dir, serviceType) =>
      fetchJSON("https://data.etabus.gov.hk/v1/transport/kmb/route-stop/" + route + "/" + dir + "/" + serviceType),
    stopEta: (stopId) => fetchJSON("https://data.etabus.gov.hk/v1/transport/kmb/stop-eta/" + stopId),
    eta: (stopId, route, serviceType) =>
      fetchJSON("https://data.etabus.gov.hk/v1/transport/kmb/eta/" + stopId + "/" + route + "/" + serviceType)
  };

  const CTB = {
    routeStops: (route, dir) =>
      fetchJSON("https://rt.data.gov.hk/v1/transport/citybus-nwfb/route-stop/CTB/" + route + "/" + dir),
    stop: (stopId) => fetchJSON("https://rt.data.gov.hk/v1/transport/citybus-nwfb/stop/" + stopId),
    eta: (stopId, route) =>
      fetchJSON("https://rt.data.gov.hk/v1/transport/citybus-nwfb/eta/CTB/" + stopId + "/" + route)
  };

  const GMB = {
    routesAll: () => fetchJSON("https://data.etagmb.gov.hk/route"),
    routeDetail: (region, route) =>
      fetchJSON("https://data.etagmb.gov.hk/route/" + region + "/" + route),
    routeStops: (routeId, routeSeq) =>
      fetchJSON("https://data.etagmb.gov.hk/route-stop/" + routeId + "/" + routeSeq),
    stop: (stopId) => fetchJSON("https://data.etagmb.gov.hk/stop/" + stopId),
    eta: (routeId, routeSeq, stopSeq) =>
      fetchJSON("https://data.etagmb.gov.hk/eta/route-stop/" + routeId + "/" + routeSeq + "/" + stopSeq)
  };

  const MTR = {
    schedule: (line, sta) =>
      fetchJSON("https://rt.data.gov.hk/v1/transport/mtr/getSchedule.php?line=" + encodeURIComponent(line) + "&sta=" + encodeURIComponent(sta))
  };

  function etaMinutes(iso) {
    if (!iso) return null;
    const d = new Date(iso);
    if (isNaN(d.getTime())) return null;
    return Math.round((d.getTime() - Date.now()) / 60000);
  }

  function formatEta(iso) {
    const t = global.I18N.t;
    const m = etaMinutes(iso);
    if (m === null) return { text: t("no_data"), cls: "eta-none" };
    if (m <= 0) return { text: t("due"), cls: "eta-due" };
    return { text: m + " " + t("min"), cls: m <= 1 ? "eta-due" : "eta-soon" };
  }

  function formatMin(min) {
    const t = global.I18N.t;
    if (min === null || min === undefined || min === "") return { text: t("no_data"), cls: "eta-none" };
    const mm = parseInt(min, 10);
    if (isNaN(mm)) return { text: t("no_data"), cls: "eta-none" };
    if (mm <= 0) return { text: t("due"), cls: "eta-due" };
    return { text: mm + " " + t("min"), cls: mm <= 1 ? "eta-due" : "eta-soon" };
  }

  global.API = { KMB, CTB, GMB, MTR, fetchJSON, etaMinutes, formatEta, formatMin };
})(window);
