(function () {
  var MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  var DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

  function parseYMD(s) {
    var p = s.split("-");
    return new Date(+p[0], +p[1] - 1, +p[2]);
  }
  function startOfToday() {
    var n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), n.getDate());
  }
  function fmtLong(d) {
    return DAYS[d.getDay()] + ", " + MONTHS[d.getMonth()] + " " + d.getDate() + ", " + d.getFullYear();
  }
  function fill(sel, val) {
    var nodes = document.querySelectorAll(sel);
    for (var i = 0; i < nodes.length; i++) nodes[i].textContent = val;
  }

  var el = document.getElementById("cd");
  if (!el) return;

  // Resolve the target date for this page.
  var target;
  if (el.dataset.offset !== undefined) {
    target = startOfToday();
    target.setDate(target.getDate() + parseInt(el.dataset.offset, 10));
  } else if (el.dataset.dates) {
    var list = el.dataset.dates.split(",").map(function (s) { return parseYMD(s.trim()); })
      .sort(function (a, b) { return a - b; });
    var t0 = startOfToday();
    target = null;
    for (var i = 0; i < list.length; i++) { if (list[i] >= t0) { target = list[i]; break; } }
    if (!target) target = list[list.length - 1];
  } else {
    return;
  }

  var today = startOfToday();
  var dayDiff = Math.round((target - today) / 86400000);
  var absDays = Math.abs(dayDiff);

  // Static / whole-unit fills (don't need a ticking clock)
  fill("[data-cd-days]", absDays.toLocaleString());
  fill("[data-cd-date]", fmtLong(target));
  fill("[data-cd-weekday]", DAYS[target.getDay()]);
  fill("[data-cd-weeks]", (absDays / 7).toFixed(1));
  fill("[data-cd-months]", (absDays / 30.44).toFixed(1));

  var daysUnit = document.querySelector("[data-cd-days-unit]");
  if (daysUnit) daysUnit.textContent = absDays === 1 ? "day" : "days";

  // Live clock down to the target (or up from it if past)
  var clock = document.getElementById("cd-clock");
  function tick() {
    var now = new Date();
    var ms = target - now;
    var past = ms < 0;
    var s = Math.floor(Math.abs(ms) / 1000);
    var d = Math.floor(s / 86400); s -= d * 86400;
    var h = Math.floor(s / 3600); s -= h * 3600;
    var m = Math.floor(s / 60); s -= m * 60;
    fill("[data-clk-d]", d);
    fill("[data-clk-h]", h);
    fill("[data-clk-m]", m);
    fill("[data-clk-s]", s);
    if (clock) clock.setAttribute("data-past", past ? "1" : "0");
  }
  if (clock) { tick(); setInterval(tick, 1000); }
})();
