(function (global) {
  "use strict";

  const MTR_LINES = [
    { code: "TWL",  en: "Tsuen Wan Line",       zh: "荃灣綫",   color: "#E2231A" },
    { code: "KTL",  en: "Kwun Tong Line",       zh: "觀塘綫",   color: "#00843D" },
    { code: "ISL",  en: "Island Line",          zh: "港島綫",   color: "#0075C2" },
    { code: "EAL",  en: "East Rail Line",       zh: "東鐵綫",   color: "#5EB7E8" },
    { code: "TML",  en: "Tuen Ma Line",         zh: "屯馬綫",   color: "#923F1F" },
    { code: "SIL",  en: "South Island Line",    zh: "南港島綫", color: "#BBBC42" },
    { code: "TCL",  en: "Tung Chung Line",      zh: "東涌綫",   color: "#F38B00" },
    { code: "AEL",  en: "Airport Express",      zh: "機場快綫", color: "#00847F" }
  ];

  const RAW = [
    ["AEL","HOK","Hong Kong","香港",22.2839,114.1576],
    ["AEL","KOW","Kowloon","九龍",22.3020,114.1620],
    ["AEL","TSY","Tsing Yi","青衣",22.3500,114.1040],
    ["AEL","AIR","Airport","機場",22.3140,113.9150],
    ["AEL","AWE","AsiaWorld-Expo","亞洲國際博覽館",22.3140,113.9350],

    ["TCL","HOK","Hong Kong","香港",22.2839,114.1576],
    ["TCL","KOW","Kowloon","九龍",22.3020,114.1620],
    ["TCL","OLY","Olympic","奧運",22.3180,114.1620],
    ["TCL","NAC","Nam Cheong","南昌",22.3280,114.1540],
    ["TCL","LAK","Lai King","荔景",22.3470,114.1370],
    ["TCL","TSY","Tsing Yi","青衣",22.3500,114.1040],
    ["TCL","SUN","Sunny Bay","欣澳",22.3120,113.9900],
    ["TCL","TUC","Tung Chung","東涌",22.2880,113.9440],

    ["TWL","CEN","Central","中環",22.2819,114.1570],
    ["TWL","ADM","Admiralty","金鐘",22.2794,114.1648],
    ["TWL","TST","Tsim Sha Tsui","尖沙咀",22.2930,114.1730],
    ["TWL","JOR","Jordan","佐敦",22.3060,114.1720],
    ["TWL","YMT","Yau Ma Tei","油麻地",22.3140,114.1700],
    ["TWL","MOK","Mong Kok","旺角",22.3205,114.1680],
    ["TWL","PRE","Prince Edward","太子",22.3240,114.1640],
    ["TWL","SSP","Sham Shui Po","深水埗",22.3300,114.1630],
    ["TWL","CSW","Cheung Sha Wan","長沙灣",22.3330,114.1590],
    ["TWL","LCK","Lai Chi Kok","荔枝角",22.3360,114.1460],
    ["TWL","MEF","Mei Foo","美孚",22.3420,114.1400],
    ["TWL","LAK","Lai King","荔景",22.3470,114.1370],
    ["TWL","KWH","Kwai Hing","葵興",22.3550,114.1320],
    ["TWL","KWF","Kwai Fong","葵芳",22.3610,114.1290],
    ["TWL","TWH","Tai Wo Hau","大窩口",22.3640,114.1210],
    ["TWL","TSW","Tsuen Wan","荃灣",22.3690,114.1180],

    ["KTL","WHA","Whampoa","黃埔",22.3050,114.1860],
    ["KTL","YMT","Yau Ma Tei","油麻地",22.3140,114.1700],
    ["KTL","MOK","Mong Kok","旺角",22.3205,114.1680],
    ["KTL","PRE","Prince Edward","太子",22.3240,114.1640],
    ["KTL","SKM","Shek Kip Mei","石硤尾",22.3320,114.1680],
    ["KTL","KOT","Kowloon Tong","九龍塘",22.3360,114.1740],
    ["KTL","KOB","Kowloon Bay","九龍灣",22.3390,114.1830],
    ["KTL","KWT","Kwun Tong","觀塘",22.3130,114.2260],
    ["KTL","WTS","Wong Tai Sin","黃大仙",22.3340,114.1960],
    ["KTL","DIH","Diamond Hill","鑽石山",22.3360,114.2050],
    ["KTL","CHH","Choi Hung","彩虹",22.3330,114.2130],
    ["KTL","TIK","Tiu Keng Leng","調景嶺",22.3050,114.2500],
    ["KTL","YAT","Yau Tong","油塘",22.3020,114.2360],

    ["ISL","KET","Kennedy Town","堅尼地城",22.2830,114.1320],
    ["ISL","HKU","HKU","香港大學",22.2830,114.1390],
    ["ISL","SYP","Sai Ying Pun","西營盤",22.2860,114.1450],
    ["ISL","SHW","Sheung Wan","上環",22.2870,114.1510],
    ["ISL","CEN","Central","中環",22.2819,114.1570],
    ["ISL","ADM","Admiralty","金鐘",22.2794,114.1648],
    ["ISL","WAC","Wan Chai","灣仔",22.2760,114.1750],
    ["ISL","CAB","Causeway Bay","銅鑼灣",22.2810,114.1860],
    ["ISL","TIH","Tin Hau","天后",22.2820,114.1940],
    ["ISL","FOH","Fortress Hill","炮台山",22.2840,114.2010],
    ["ISL","NOP","North Point","北角",22.2850,114.2070],
    ["ISL","QUB","Quarry Bay","鰂魚涌",22.2830,114.2160],
    ["ISL","TAK","Tai Koo","太古",22.2840,114.2260],
    ["ISL","SWH","Sai Wan Ho","西灣河",22.2800,114.2330],
    ["ISL","CHW","Chai Wan","柴灣",22.2660,114.2400],

    ["EAL","ADM","Admiralty","金鐘",22.2794,114.1648],
    ["EAL","EXC","Exhibition Centre","會展",22.2820,114.1730],
    ["EAL","HUH","Hung Hom","紅磡",22.2990,114.1820],
    ["EAL","KOT","Kowloon Tong","九龍塘",22.3360,114.1740],
    ["EAL","TAW","Tai Wai","大圍",22.3720,114.1850],
    ["EAL","FOT","Fo Tan","火炭",22.3900,114.1900],
    ["EAL","UNI","University","大學",22.4180,114.2070],
    ["EAL","SHT","Sha Tin","沙田",22.3850,114.1880],
    ["EAL","LOW","Lo Wu","羅湖",22.5280,114.1130],
    ["EAL","LMC","Lok Ma Chau","落馬洲",22.5210,114.0700],

    ["TML","WKS","Wu Kai Sha","烏溪沙",22.3250,114.2600],
    ["TML","MOS","Ma On Shan","馬鞍山",22.3210,114.2380],
    ["TML","TSH","Tai Shui Hang","大水坑",22.3240,114.2500],
    ["TML","CIO","City One","第一城",22.3270,114.2410],
    ["TML","SHM","Shek Mun","石門",22.3300,114.2330],
    ["TML","HOM","Ho Man Tin","何文田",22.3060,114.1770],
    ["TML","HUH","Hung Hom","紅磡",22.2990,114.1820],
    ["TML","TWW","Tsuen Wan West","荃灣西",22.3710,114.1150],
    ["TML","TIS","Tin Shui Wai","天水圍",22.4610,114.0100],
    ["TML","SIH","Siu Hong","兆康",22.4170,113.9820],
    ["TML","TUM","Tuen Mun","屯門",22.3910,113.9740],

    ["SIL","ADM","Admiralty","金鐘",22.2794,114.1648],
    ["SIL","OCP","Ocean Park","海洋公園",22.2450,114.1690],
    ["SIL","WCH","Wong Chuk Hang","黃竹坑",22.2460,114.1620],
    ["SIL","SOH","South Horizons","海怡半島",22.2390,114.1510]
  ];

  const STATIONS = RAW.map(r => ({ line: r[0], code: r[1], en: r[2], zh: r[3], lat: r[4], lng: r[5] }));
  const NAME_BY_CODE = {};
  STATIONS.forEach(s => { NAME_BY_CODE[s.code] = { en: s.en, zh: s.zh }; });

  function lineByCode(code) { return MTR_LINES.find(l => l.code === code); }
  function stationName(code) { return NAME_BY_CODE[code] || { en: code, zh: code }; }

  function parseMtrSchedule(resp) {
    const out = [];
    if (!resp || !resp.data) return out;
    Object.keys(resp.data).forEach(key => {
      const node = resp.data[key];
      if (!node) return;
      ["UP", "DOWN"].forEach(dir => {
        const arr = node[dir];
        if (!Array.isArray(arr)) return;
        arr.forEach(e => {
          if (e.valid === "N" || e.valid === "false") return;
          let text, cls;
          const tt = (e.ttnt !== undefined && e.ttnt !== null && e.ttnt !== "") ? parseInt(e.ttnt, 10) : NaN;
          if (!isNaN(tt)) {
            if (tt <= 0) { text = global.I18N ? global.I18N.t("due") : "Due"; cls = "eta-due"; }
            else { text = tt + " " + (global.I18N ? global.I18N.t("min") : "min"); cls = tt <= 1 ? "eta-due" : "eta-soon"; }
          } else {
            text = e.time ? (e.time.split(" ")[1] || e.time) : (global.I18N ? global.I18N.t("no_data") : "—");
            cls = "eta-none";
          }
          out.push({
            isMtr: true,
            route: dir === "UP" ? "↑" : "↓",
            dest: e.dest ? stationName(e.dest) : null,
            platform: e.plat,
            text: text,
            cls: cls
          });
        });
      });
    });
    return out;
  }

  global.MTR = { MTR_LINES, STATIONS, lineByCode, stationName, parseMtrSchedule };
})(window);
