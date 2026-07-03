(function (global) {
  "use strict";

  const dict = {
    en: {
      title: "HK Live Transit",
      subtitle: "Real-time arrivals · Hong Kong",
      tab_map: "Map",
      tab_nearme: "Near me",
      tab_search: "Search",
      tab_fav: "Favorites",
      select_stop: "Select a stop",
      loading_stops: "Loading stops…",
      zoom_hint: "Zoom in to see stops",
      nearby_stops: "Nearby stops",
      locate: "Locate me",
      search: "Search",
      search_hint: "Enter a route number, choose a direction, then pick a stop.",
      route_ph: "e.g. 968, 1A, 1",
      favorites: "Favorites",
      fav_hint: "Tap a card to refresh. Saved on this device.",
      data_src: "Data: DATA.GOV.HK (KMB · CTB · GMB · MTR)",
      basemap: "Basemap: geodata.gov.hk",
      due: "Due",
      min: "min",
      scheduled: "Scheduled",
      no_data: "No live data",
      refreshing: "Refreshing…",
      updated: "Updated",
      loading_eta: "Loading arrivals…",
      choose_dir: "Choose direction",
      choose_stop: "Choose a stop",
      outbound: "Outbound",
      inbound: "Inbound",
      to: "to",
      no_eta: "No arrivals right now",
      geo_denied: "Location permission denied.",
      geo_unavailable: "Location unavailable.",
      geo_error: "Could not get your location.",
      add_fav: "Add to favorites",
      remove_fav: "Remove",
      fav_added: "Added to favorites",
      fav_removed: "Removed",
      fav_empty: "No favorites yet. Add stops from Search or the Map.",
      search_empty: "Search a route to begin.",
      route_not_found: "Route not found. Check the number.",
      load_error: "Failed to load data. Check your connection.",
      retry: "Retry",
      stop: "Stop",
      platform: "Platform",
      route: "Route",
      dest: "Destination",
      direction: "Direction",
      mtr: "MTR",
      station: "Station",
      all_modes: "All",
      refresh: "Refresh",
      mtr_picker: "MTR lines",
      select_line: "Select a line",
      select_station: "Select a station",
      recent: "Recent",
      no_recent: "No recent searches yet",
      try: "Try",
      step1: "Route",
      step2: "Direction",
      step3: "Stop",
      legend: "Legend",
      kmb_label: "KMB / Long Win bus",
      ctb_label: "Citybus",
      gmb_label: "Green minibus",
      mtr_label: "MTR",
      next_arrivals: "Next arrivals",
      live: "Live",
      tap_hint: "Tap a pin for arrivals · 🚇 for MTR",
      back: "Back",
      more: "more",
      hide_pins: "Hide bus pins",
      show_pins: "Show bus pins",
      near_hint: "Tap “Locate me” to find nearby stops.",
      empty_board: "Pick a stop on the map, search a route, or use Nearby."
    },
    zh: {
      title: "香港實時到站",
      subtitle: "即時班次 · Hong Kong",
      tab_map: "地圖",
      tab_nearme: "附近",
      tab_search: "搜尋",
      tab_fav: "收藏",
      select_stop: "請選擇車站",
      loading_stops: "正在載入車站…",
      zoom_hint: "放大以查看車站",
      nearby_stops: "附近車站",
      locate: "定位",
      search: "搜尋",
      search_hint: "輸入路線編號，選擇方向，再揀車站。",
      route_ph: "例如 968、1A、1",
      favorites: "收藏",
      fav_hint: "撳卡片即可刷新。資料儲存於本機。",
      data_src: "資料來源：DATA.GOV.HK（九巴·城巴·小巴·港鐵）",
      basemap: "底圖：geodata.gov.hk",
      due: "即將到達",
      min: "分鐘",
      scheduled: "班次已定",
      no_data: "暫無即時資料",
      refreshing: "刷新中…",
      updated: "已更新",
      loading_eta: "正在載入班次…",
      choose_dir: "選擇方向",
      choose_stop: "選擇車站",
      outbound: "往",
      inbound: "往",
      to: "往",
      no_eta: "暫時沒有班次",
      geo_denied: "已拒絕位置權限。",
      geo_unavailable: "無法取得位置。",
      geo_error: "未能取得你的位置。",
      add_fav: "加入收藏",
      remove_fav: "移除",
      fav_added: "已加入收藏",
      fav_removed: "已移除",
      fav_empty: "尚未有收藏。可從搜尋或地圖加入車站。",
      search_empty: "搜尋路線以開始。",
      route_not_found: "找不到路線，請檢查編號。",
      load_error: "載入失敗，請檢查網絡連線。",
      retry: "重試",
      stop: "車站",
      platform: "月台",
      route: "路線",
      dest: "目的地",
      direction: "方向",
      mtr: "港鐵",
      station: "車站",
      all_modes: "全部",
      refresh: "刷新",
      mtr_picker: "港鐵路綫",
      select_line: "選擇路綫",
      select_station: "選擇車站",
      recent: "最近搜尋",
      no_recent: "暫無最近搜尋",
      try: "試試",
      step1: "路線",
      step2: "方向",
      step3: "車站",
      legend: "圖例",
      kmb_label: "九巴／龍運",
      ctb_label: "城巴",
      gmb_label: "綠色小巴",
      mtr_label: "港鐵",
      next_arrivals: "下班班次",
      live: "即時",
      tap_hint: "撳圖釘睇班次 · 🚇 睇港鐵",
      back: "返回",
      more: "個",
      hide_pins: "隱藏巴士圖釘",
      show_pins: "顯示巴士圖釘",
      near_hint: "撳「定位」尋找附近車站。",
      empty_board: "喺地圖揀車站、搜尋路線，或用附近。"
    }
  };

  let current = localStorage.getItem("hktransit_lang") || (navigator.language && navigator.language.toLowerCase().startsWith("zh") ? "zh" : "en");

  function t(key) {
    return (dict[current] && dict[current][key]) || dict.en[key] || key;
  }

  function lang() { return current; }

  function setLang(l) {
    current = l === "zh" ? "zh" : "en";
    localStorage.setItem("hktransit_lang", current);
    applyI18n();
  }

  function toggle() { setLang(current === "zh" ? "en" : "zh"); }

  function applyI18n() {
    document.documentElement.lang = current === "zh" ? "zh-Hant" : "en";
    document.querySelectorAll("[data-i18n]").forEach(el => {
      el.textContent = t(el.getAttribute("data-i18n"));
    });
    document.querySelectorAll("[data-i18n-ph]").forEach(el => {
      el.setAttribute("placeholder", t(el.getAttribute("data-i18n-ph")));
    });
    const lt = document.getElementById("langToggle");
    if (lt) lt.textContent = current === "zh" ? "EN" : "繁體";
  }

  global.I18N = { t, lang, setLang, toggle, applyI18n };
})(window);
