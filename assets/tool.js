(function () {
  var MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  var DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  function parse(v) { var p = v.split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function fmt(d) { return DAYS[d.getDay()] + ", " + MONTHS[d.getMonth()] + " " + d.getDate() + ", " + d.getFullYear(); }
  function iso(d) {
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }

  // ---- Difference between two dates ----
  var d1 = document.getElementById("diff-from");
  var d2 = document.getElementById("diff-to");
  var diffOut = document.getElementById("diff-out");
  if (d1 && d2 && diffOut) {
    var today = new Date();
    d1.value = iso(today);
    var later = new Date(); later.setDate(later.getDate() + 30);
    d2.value = iso(later);
    function calcDiff() {
      if (!d1.value || !d2.value) { diffOut.textContent = ""; return; }
      var a = parse(d1.value), b = parse(d2.value);
      var days = Math.round((b - a) / 86400000);
      var abs = Math.abs(days);
      var weeks = (abs / 7).toFixed(1);
      diffOut.textContent = abs.toLocaleString() + (abs === 1 ? " day" : " days") +
        " (" + weeks + " weeks)" + (days < 0 ? " — second date is earlier" : "");
    }
    d1.addEventListener("change", calcDiff);
    d2.addEventListener("change", calcDiff);
    calcDiff();
  }

  // ---- Add / subtract days ----
  var base = document.getElementById("add-base");
  var amt = document.getElementById("add-amt");
  var dir = document.getElementById("add-dir");
  var addOut = document.getElementById("add-out");
  if (base && amt && dir && addOut) {
    base.value = iso(new Date());
    amt.value = 30;
    function calcAdd() {
      if (!base.value || amt.value === "") { addOut.textContent = ""; return; }
      var d = parse(base.value);
      var n = parseInt(amt.value, 10) * (dir.value === "before" ? -1 : 1);
      d.setDate(d.getDate() + n);
      addOut.textContent = fmt(d);
    }
    [base, amt, dir].forEach(function (n) { n.addEventListener("change", calcAdd); n.addEventListener("input", calcAdd); });
    calcAdd();
  }
})();
