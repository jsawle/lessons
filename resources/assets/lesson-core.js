/* MapMaker resource pages: shared logic for the page, the Word builder and the checker.
   Runs in the browser (window.MMR) and in Node (require). No dependencies. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.MMR = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var VERSION = { renderer: "1.0", format: "1.0", checker: "1.0" };
  var HEX32 = /^[0-9a-f]{32}$/i;
  var DATE = /^\d{4}-\d{2}-\d{2}$/;

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  /* Text fields allow two marks only: **bold** and [link text](https://address).
     Everything else is shown as typed, so a lesson file can never inject HTML. */
  function inline(text) {
    var out = esc(text);
    out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    out = out.replace(/\[([^\]]+)\]\((https:\/\/[^\s)]+)\)/g, function (_, t, u) {
      return '<a href="' + u + '" target="_blank" rel="noopener">' + t + '<span class="sr-only"> (opens in a new tab)</span></a>';
    });
    return out;
  }
  function plain(text) {
    return String(text == null ? "" : text)
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/\[([^\]]+)\]\((https:\/\/[^\s)]+)\)/g, "$1 ($2)");
  }

  function mapmakerUrl(site, webmapId) {
    var mm = (site && site.mapmaker) || {};
    if (!HEX32.test(mm.appId || "")) return null;
    var base = String(mm.portalUrl || "https://www.arcgis.com").replace(/\/+$/, "");
    var q = "appid=" + encodeURIComponent(mm.appId);
    if (HEX32.test(webmapId || "")) q += "&webmap=" + encodeURIComponent(webmapId);
    return base + "/apps/instant/atlas/index.html?" + q;
  }

  function hubUrl(site, path) {
    return String(site.hub.url).replace(/\/+$/, "") + path;
  }

  /* The How To pages a lesson needs, worked out from the tools its questions use. */
  function howToLinks(site, lesson) {
    var seen = {}, out = [];
    var qs = (lesson.inquiry && lesson.inquiry.questions) || [];
    var tools = [];
    qs.forEach(function (q) { tools = tools.concat(q.tools || []); });
    tools = tools.concat((lesson.inquiry && lesson.inquiry.final && lesson.inquiry.final.tools) || []);
    tools.forEach(function (key) {
      var t = site.tools[key];
      if (!t || seen[t.howTo]) return;
      seen[t.howTo] = true;
      var used = tools.filter(function (k) { return site.tools[k] && site.tools[k].howTo === t.howTo; })
        .map(function (k) { return site.tools[k].label; })
        .filter(function (v, i, a) { return a.indexOf(v) === i; });
      out.push({ title: t.howToTitle, url: hubUrl(site, "/pages/" + t.howTo), covers: used });
    });
    return out;
  }

  /* The summary teachers can paste into an AI tool. Built from the lesson file, so it never needs editing. */
  function aiSummary(site, lesson) {
    var L = [];
    L.push("MAP: " + lesson.title + " (National Geographic MapMaker)");
    L.push("MAP LINK: " + mapmakerUrl(site, lesson.map.webmapId));
    L.push("PURPOSE: " + plain(lesson.summary));
    L.push("AUDIENCE: Grade " + lesson.grade + " " + lesson.course + ".");
    L.push("");
    L.push("LAYERS AND SOURCES");
    lesson.map.layers.forEach(function (l) { L.push("- " + l.name + ": " + plain(l.source) + "."); });
    if (lesson.keyFacts && lesson.keyFacts.length) {
      L.push(""); L.push("KEY FACTS");
      lesson.keyFacts.forEach(function (f) { L.push("- " + plain(f)); });
    }
    L.push(""); L.push("COMPELLING QUESTION"); L.push(plain(lesson.inquiry.compellingQuestion.en));
    L.push(""); L.push("STUDENT QUESTIONS");
    lesson.inquiry.questions.forEach(function (q, i) {
      L.push((i + 1) + ". " + plain(q.title.en) + " " + plain(q.student.en) + (q.fill ? " " + plain(q.fill.en) : ""));
    });
    L.push("");
    L.push("KEY WORDS: " + lesson.teacherNotes.keyWords.join(", ") + ".");
    L.push("STANDARDS: " + lesson.standards.map(function (s) { return s.code; }).join("; ") + ".");
    L.push("Use only these facts. Do not add places, dates or numbers that are not listed here.");
    return L.join("\n");
  }

  /* One checker for the page and for the command line. Returns plain-English problems. */
  function check(site, lesson, fileName) {
    var errs = [];
    function need(cond, msg) { if (!cond) errs.push(msg); }
    function str(v) { return typeof v === "string" && v.trim().length > 0; }
    function lang(obj, where, langs) {
      if (!obj || typeof obj !== "object") { errs.push(where + " is missing."); return; }
      langs.forEach(function (lg) { need(str(obj[lg]), where + " has no " + lg + " text."); });
    }
    if (!lesson || typeof lesson !== "object") return ["The file isn't a lesson (it should be one JSON object)."];
    var langs = Object.keys(lesson.languages || { en: {} });
    need(lesson.formatVersion === VERSION.format, "formatVersion should be \"" + VERSION.format + "\".");
    need(/^[a-z0-9]+(-[a-z0-9]+)*$/.test(lesson.id || ""), "id should be lower case words joined by hyphens.");
    if (fileName) need(fileName === lesson.id + ".json", "The file name should be " + lesson.id + ".json.");
    need(/^\d+\.\d+\.\d+$/.test(lesson.contentVersion || ""), "contentVersion should look like 1.0.0.");
    need(["draft", "reviewed", "published"].indexOf(lesson.status) >= 0, "status should be draft, reviewed or published.");
    need(DATE.test(lesson.updated || ""), "updated should be a date like 2026-10-12.");
    if (lesson.status !== "draft") need(lesson.reviewed && str(lesson.reviewed.by) && DATE.test(lesson.reviewed.date || ""),
      "A reviewed or published lesson needs reviewed.by and reviewed.date.");
    ["title", "summary", "subject", "course", "unit", "grade", "time", "studentLogin"].forEach(function (k) {
      need(str(lesson[k]), k + " is missing.");
    });
    need(langs.indexOf("en") >= 0, "languages must include en.");
    var map = lesson.map || {};
    need(HEX32.test(map.webmapId || ""), "map.webmapId should be a 32-character item ID.");
    need(Array.isArray(map.layers) && map.layers.length > 0, "map.layers needs at least one layer.");
    (map.layers || []).forEach(function (l, i) {
      need(str(l.name) && str(l.shows) && str(l.source), "map.layers[" + (i + 1) + "] needs name, shows and source.");
    });
    (lesson.knownIssues || []).forEach(function (k, i) {
      need(str(k.where) && str(k.note), "knownIssues[" + (i + 1) + "] needs where and note.");
      need(["open", "fixed"].indexOf(k.status) >= 0, "knownIssues[" + (i + 1) + "].status should be open or fixed.");
      need(DATE.test(k.date || ""), "knownIssues[" + (i + 1) + "].date should be a date.");
    });
    var inq = lesson.inquiry || {};
    lang(inq.compellingQuestion, "inquiry.compellingQuestion", langs);
    need(Array.isArray(inq.questions) && inq.questions.length > 0, "inquiry.questions needs at least one question.");
    var ids = {};
    (inq.questions || []).forEach(function (q, i) {
      var w = "Question " + (i + 1);
      need(/^q\d+$/.test(q.id || ""), w + ": id should be q1, q2 and so on.");
      need(!ids[q.id], w + ": id " + q.id + " is used twice."); ids[q.id] = true;
      lang(q.title, w + " title", langs);
      lang(q.student, w + " student text", langs);
      if (q.fill) lang(q.fill, w + " fill-in line", langs);
      need(str(q.task), w + ": task (the teacher-facing version) is missing.");
      need(Array.isArray(q.tools) && q.tools.length > 0, w + ": list the MapMaker tools it uses.");
      (q.tools || []).forEach(function (t) { need(!!site.tools[t], w + ": unknown tool \"" + t + "\". Known tools: " + Object.keys(site.tools).join(", ") + "."); });
      need(q.answer && (str(q.answer.text) || (q.answer.table && q.answer.table.rows)), w + ": answer notes are missing.");
      if (q.answer && q.answer.table) {
        var cols = (q.answer.table.columns || []).length;
        (q.answer.table.rows || []).forEach(function (r, j) { need(r.length === cols, w + ": answer table row " + (j + 1) + " should have " + cols + " cells."); });
      }
    });
    var fin = inq.final || {};
    need(str(fin.teacher), "inquiry.final.teacher is missing.");
    lang(fin.student, "inquiry.final.student", langs);
    (fin.tools || []).forEach(function (t) { need(!!site.tools[t], "inquiry.final: unknown tool \"" + t + "\"."); });
    var tn = lesson.teacherNotes || {};
    need(str(tn.beforeClass), "teacherNotes.beforeClass is missing.");
    need(Array.isArray(tn.keyWords) && tn.keyWords.length > 0, "teacherNotes.keyWords needs at least one word.");
    (tn.misconceptions || []).forEach(function (m, i) { need(str(m.claim) && str(m.response), "teacherNotes.misconceptions[" + (i + 1) + "] needs claim and response."); });
    need(Array.isArray(lesson.standards) && lesson.standards.length > 0, "standards needs at least one standard.");
    (lesson.standards || []).forEach(function (s, i) { need(str(s.code) && str(s.text), "standards[" + (i + 1) + "] needs code and text."); });
    need(str(lesson.licence), "licence is missing.");
    var links = JSON.stringify(lesson).match(/\]\(([^)]+)\)/g) || [];
    links.forEach(function (m) { need(/^\]\(https:\/\//.test(m), "Links must start with https:// (found " + m.slice(2, -1) + ")."); });
    return errs;
  }

  return { VERSION: VERSION, esc: esc, inline: inline, plain: plain, mapmakerUrl: mapmakerUrl, hubUrl: hubUrl,
    howToLinks: howToLinks, aiSummary: aiSummary, check: check };
});
