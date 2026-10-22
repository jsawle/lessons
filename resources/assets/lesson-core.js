/* Lesson resource pages: shared logic for the page, the Word builder, the AI assistant's knowledge file, the AI prompt and the checker.
   Runs in the browser (window.MMR) and in Node (require). No dependencies.
   Settings come from two files: site.json (shared wording, units, tools, rubric) and <name>-lessons.json (the Atlas app,
   Hub, assistant, licence and product names for one set of lessons), merged by mergeSite. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.MMR = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var VERSION = { renderer: "3.3", format: "1.8", checker: "1.8", knowledge: "1.5", prompt: "1.1" };
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

  /* ---------------- Settings: site.json plus <name>-lessons.json ---------------- */
  var NAME = /^[a-z0-9]+(-[a-z0-9]+)*$/;
  function isObj(v) { return !!v && typeof v === "object" && !Array.isArray(v); }
  /* Objects merge key by key; anything else (text, numbers, lists) in the lessons file replaces the shared value. */
  function merge(a, b) {
    var out = {};
    Object.keys(a || {}).forEach(function (k) { out[k] = a[k]; });
    Object.keys(b || {}).forEach(function (k) { out[k] = isObj(out[k]) && isObj(b[k]) ? merge(out[k], b[k]) : b[k]; });
    return out;
  }
  /* Puts the product names in place of {app}, {appFull} and so on. Unknown names in braces are left as they are,
     so the checker can report them. Returns a copy; the inputs are not changed. */
  function fill(v, names) {
    if (typeof v === "string") return v.replace(/\{([A-Za-z][A-Za-z0-9]*)\}/g, function (m, k) { return Object.prototype.hasOwnProperty.call(names, k) ? names[k] : m; });
    if (Array.isArray(v)) return v.map(function (x) { return fill(x, names); });
    if (isObj(v)) { var o = {}; Object.keys(v).forEach(function (k) { o[k] = fill(v[k], names); }); return o; }
    return v;
  }
  function defaultLessons(base) { return ((base && base.lessonSettings) || {}).default || "mapmaker"; }
  function lessonsFileName(name) { return name + "-lessons.json"; }
  function mergeSite(base, lessons, name) {
    var m = merge(base, lessons), names = isObj(m.names) ? m.names : {};
    var out = fill(m, names);
    out.names = names;
    out.lessonSettings = merge(out.lessonSettings || {}, { current: name || defaultLessons(base) });
    return out;
  }
  /* For the pages: loads site.json and the lessons file named by ?lessons=<name> (or the default) and merges them. */
  function loadSite(getJSON, search) {
    return getJSON("site.json").then(function (base) {
      var asked = typeof URLSearchParams === "function" ? new URLSearchParams(search || "").get("lessons") : null;
      var name = asked || defaultLessons(base);
      if (!NAME.test(name)) throw new Error("?lessons= should be lower-case words joined by hyphens.");
      return getJSON(lessonsFileName(name)).then(function (lessons) { return mergeSite(base, lessons, name); });
    });
  }
  /* Names in braces that no settings file filled in (a typo, or a name the lessons file doesn't give). */
  function unfilled(site) {
    var out = [];
    (function walk(v, path) {
      if (typeof v === "string") (v.match(/\{[A-Za-z][A-Za-z0-9]*\}/g) || []).forEach(function (m) { out.push(path + ": " + m); });
      else if (Array.isArray(v)) v.forEach(function (x, i) { walk(x, path + "[" + i + "]"); });
      else if (isObj(v)) Object.keys(v).forEach(function (k) { if (k !== "names") walk(v[k], path ? path + "." + k : k); });
    })(site, "");
    return out;
  }
  function names(site) { return (site && site.names) || {}; }
  function appName(site) { return names(site).app || "the map app"; }
  /* "A MapMaker map", "An Atlas map". */
  function aOrAn(word) { return /^[aeiou]/i.test(String(word || "")) ? "An " + word : "A " + word; }
  /* The licence statement: a lesson's own licence when it has one (it differs), otherwise the lessons settings'. */
  function licence(site, lesson) { return (lesson && lesson.licence) || (site && site.licence) || ""; }
  function assistant(site) { var a = site && site.assistant; return a && a.name ? a : null; }

  function atlasUrl(site, webmapId) {
    var mm = (site && site.atlas) || {};
    if (!HEX32.test(mm.appId || "")) return null;
    var base = String(mm.portalUrl || "https://www.arcgis.com").replace(/\/+$/, "");
    var q = "appid=" + encodeURIComponent(mm.appId);
    if (HEX32.test(webmapId || "")) q += "&webmap=" + encodeURIComponent(webmapId);
    return base + "/apps/instant/atlas/index.html?" + q;
  }

  /* The picture of the map shown on the lesson page: map.image, an https URL with alt text. A screenshot of the
     map as it opens is best; preview: true marks a stand-in such as the web map item's thumbnail. */
  function mapImage(site, lesson) {
    var img = (lesson.map && lesson.map.image) || null;
    if (!img || !/^https:\/\//.test(img.url || "")) return null;
    return { url: img.url, alt: img.alt || ("The " + lesson.title + " map in " + appName(site)), width: img.width || (img.preview ? 600 : 1200), height: img.height || (img.preview ? 400 : 675), own: !img.preview };
  }

  /* Google's script-free Share to Classroom link. It carries only the address to share (the one parameter
     Google documents for this form), so it shares the lesson's map. Null if the button is switched off. */
  function classroomShareUrl(site, url) {
    var c = (site && site.classroom) || {};
    if (!/^https:\/\//.test(c.shareUrl || "") || !/^https:\/\//.test(c.icon || "") || !/^https:\/\//.test(url || "")) return null;
    return c.shareUrl + "?url=" + encodeURIComponent(url);
  }

  function hubUrl(site, path) {
    return String(site.hub.url).replace(/\/+$/, "") + path;
  }
  /* Report-a-problem link that names the lesson, so a report says which lesson it is about. */
  function feedbackUrl(site, lesson) {
    var base = hubUrl(site, site.hub.feedbackPath), key = site.hub.feedbackQuery || "lesson";
    return lesson ? base + (base.indexOf("?") < 0 ? "?" : "&") + encodeURIComponent(key) + "=" + encodeURIComponent(lesson.id) : base;
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

  /* Map skills a lesson practises, derived from the tools its questions use (site.json tools[].skill). */
  function skills(site, lesson) {
    var out = [], seen = {};
    var qs = ((lesson.inquiry && lesson.inquiry.questions) || []).concat([{ tools: (lesson.inquiry && lesson.inquiry.final && lesson.inquiry.final.tools) || [] }]);
    qs.forEach(function (q) {
      (q.tools || []).forEach(function (k) {
        var t = site.tools[k], label = t && (t.skill || t.label);
        if (label && !seen[label]) { seen[label] = true; out.push(label); }
      });
    });
    return out;
  }
  function instructionalModels(site, lesson) {
    return (lesson.instructionalModels && lesson.instructionalModels.length) ? lesson.instructionalModels : (((site.teaching || {}).instructionalModels) || []);
  }

  /* The AI assistant's link for a lesson: opens its chat page with the lesson named in the message box. */
  function assistantUrl(site, lesson) {
    var a = assistant(site);
    if (!a || !a.url) return null;
    return a.url + "?lesson=" + encodeURIComponent(lesson.id) + "&title=" + encodeURIComponent(lesson.title);
  }

  /* The prompt page for a lesson (prompt.html on GitHub Pages), which the Hub page embeds in a frame card. */
  function promptUrl(site, lesson) {
    var u = ((site && site.aiPrompt) || {}).pageUrl;
    if (!/^https:\/\//.test(u || "")) return null;
    var ls = (site && site.lessonSettings) || {};
    return u + "?id=" + encodeURIComponent(lesson.id) + (ls.current && ls.current !== ls.default ? "&lessons=" + encodeURIComponent(ls.current) : "");
  }
  /* The ordered unit list for a course (site.json units), and a lesson's place in it. */
  function unitList(site, course) {
    var u = (site && site.units) || {};
    return Array.isArray(u[course]) ? u[course] : [];
  }
  function unitIndex(site, lesson) {
    var i = unitList(site, lesson.course).indexOf(lesson.unit);
    return i < 0 ? 999 : i;
  }
  /* Standards sorted by framework: national frameworks first (site.json standardsOrder), then states. */
  function standardPrefix(code) { return String(code || "").split(/[\s.]/)[0].toUpperCase(); }
  function sortStandards(site, standards) {
    var order = ((site && site.standardsOrder) || {}).prefixes || [];
    return (standards || []).slice().sort(function (a, b) {
      var pa = standardPrefix(a.code), pb = standardPrefix(b.code), ia = order.indexOf(pa), ib = order.indexOf(pb);
      if (ia < 0) ia = order.length; if (ib < 0) ib = order.length;
      return ia - ib || pa.localeCompare(pb) || String(a.code).localeCompare(String(b.code));
    });
  }
  function standardLabel(site, prefix) {
    var l = ((site && site.standardsOrder) || {}).labels || {};
    return l[prefix] || prefix;
  }

  /* One lesson's entry in the AI assistant's knowledge file (and the AI prompt). Built from the lesson file, so it never
     needs editing. Markdown links, because Vera's other knowledge files use them and Vera repeats links as written. */
  function lessonEntry(site, lesson) {
    function md(text) { return String(text).replace(/\s+/g, " ").trim(); }
    var L = [];
    L.push("### " + lesson.title);
    L.push("**Lesson ID:** " + lesson.id);
    L.push("**Subject:** " + lesson.subject + ". **Course:** " + lesson.course + ". **Grade:** " + lesson.grade + ". **Unit:** " + lesson.unit + ". **Time:** " + lesson.time + ".");
    L.push("**" + appName(site) + " map:** [Open " + lesson.title + " in " + appName(site) + "](" + atlasUrl(site, lesson.map.webmapId) + ")");
    L.push("**Description:** " + md(lesson.summary));
    if (lesson.subjects && lesson.subjects.length) L.push("**Subjects:** " + lesson.subjects.join(", ") + ".");
    if (lesson.objectives && lesson.objectives.length) {
      L.push("**Learning objectives (students will):**");
      lesson.objectives.forEach(function (o) { L.push("- " + md(o)); });
    }
    L.push("**Bookmarks in this map:** " + ((lesson.map.bookmarks || []).length ? lesson.map.bookmarks.join("; ") : "none") + ".");
    L.push("**Layers in this map (exact name: what students see; source):**");
    lesson.map.layers.forEach(function (l) {
      L.push("- " + l.name + (l.offAtStart ? " (off when the map opens)" : "") + ": " + md(l.shows).replace(/\.$/, "") + "; source: " + md(l.source) + ".");
    });
    var sup = lesson.studentSupport || {};
    if (sup.beforeYouStart) L.push("**What students read before they start:** " + md(sup.beforeYouStart.en));
    if (sup.readingTheMap) L.push("**How the student sheet explains the map's symbols:** " + md(sup.readingTheMap.en));
    L.push("**Compelling question:** " + md(lesson.inquiry.compellingQuestion.en));
    L.push("**Questions already in this lesson:**");
    lesson.inquiry.questions.forEach(function (q, i) {
      L.push((i + 1) + ". " + md(q.title.en) + " On the map: " + (q.steps || []).map(function (st) { return md(st.en); }).join(" ") + " Answer: " + md(q.ask.en) + (q.fill ? " " + md(q.fill.en) : ""));
    });
    if (sup.reflection) L.push("**Closing reflection already in this lesson:** " + md(sup.reflection.en));
    L.push("**Answers:** not in this file. The answers are on the lesson's teacher page, for teachers only; do not give answers to the questions above, and do not write student material that contains them.");
    L.push("**Key words:** " + lesson.teacherNotes.keyWords.join(", ") + ".");
    L.push("**Standards:** " + lesson.standards.map(function (s) { return s.code; }).join("; ") + ".");
    L.push("**How-to pages for the tools this lesson uses:** " + howToLinks(site, lesson).map(function (h) {
      return "[" + h.title + "](" + h.url + ")"; }).join("; ") + ".");
    L.push("**Languages:** student sheets in " + Object.keys(lesson.languages).map(function (k) { return (site.languageNamesInEnglish && site.languageNamesInEnglish[k]) || k; }).join(" and ") + ".");
    L.push("**Lesson content version:** " + lesson.contentVersion + ", updated " + lesson.updated + ".");
    return L.join("\n");
  }

  /* The prompt a teacher can paste into their own AI tool: the rules from site.json, then the lesson's
     entry (map, layers, pop-ups, bookmarks, questions; no answers), as plain text. */
  function aiPrompt(site, lesson) {
    var rules = ((site && site.aiPrompt) || {}).rules || [];
    var entry = lessonEntry(site, lesson).split("\n").map(function (line) {
      return plain(line.replace(/^###\s*/, "Lesson: ").replace(/\*\*/g, ""));
    });
    return rules.concat(["", "--- The lesson ---", ""]).concat(entry).join("\n");
  }

  /* The whole knowledge file for the AI assistant: a short header, then one entry per lesson. CRLF, like Vera's other files. */
  function assistantFile(site, lessons, builtOn) {
    var a = assistant(site) || {};
    var head = [
      "# " + (a.knowledgeTitle || "Lessons (questions, layers and sources)"),
      "Built " + builtOn + " from the lesson files by the " + (names(site).pages || "lesson resource pages") + ", " + (a.name || "assistant") + " knowledge builder " + VERSION.knowledge + ". Do not edit by hand; edit the lesson files and rebuild.",
      "",
      "How to use this file: each lesson below has its own " + appName(site) + " map. When a teacher names one of these lessons (by title or lesson ID) and asks for new or different questions, base every question only on the bookmarks, layers and pop-up content listed for that lesson, and use bookmark and layer names exactly as written. If a request needs information that lesson's map does not show, say so plainly instead of inventing it. Use only the links listed for that lesson. The answers to the lessons' questions are not in this file: do not give them, and do not write student material that contains them.",
      ""
    ];
    return head.concat(lessons.map(function (l) { return lessonEntry(site, l) + "\n"; })).join("\n").replace(/\r?\n/g, "\r\n");
  }

  /* The knowledge file's name, or null when these lessons have no AI assistant. */
  function assistantFileName(site) { var a = assistant(site); return a ? (a.knowledgeFile || "assistant_lessons.txt") : null; }

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
    need(lesson.planMonth === undefined, "planMonth is no longer used (format 1.3): lessons are arranged by unit. Remove it.");
    need(lesson.keyFacts === undefined, "keyFacts is no longer used (format 1.3): put facts in the answer notes. Remove it.");
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
    var units = unitList(site, lesson.course);
    need(units.length > 0, "site.json has no units list for the course \"" + lesson.course + "\".");
    if (units.length) need(units.indexOf(lesson.unit) >= 0, "unit \"" + lesson.unit + "\" isn't in site.json units for " + lesson.course + ". Use one of: " + units.join("; ") + ".");
    if (lesson.alsoFits !== undefined) {
      need(Array.isArray(lesson.alsoFits), "alsoFits should be a list of units.");
      (Array.isArray(lesson.alsoFits) ? lesson.alsoFits : []).forEach(function (u) {
        need(units.indexOf(u) >= 0 && u !== lesson.unit, "alsoFits: \"" + u + "\" should be another unit from site.json units for " + lesson.course + ".");
      });
    }
    var map = lesson.map || {};
    need(HEX32.test(map.webmapId || ""), "map.webmapId should be a 32-character item ID.");
    need(Array.isArray(map.layers) && map.layers.length > 0, "map.layers needs at least one layer.");
    if (map.image !== undefined) need(map.image && /^https:\/\//.test(map.image.url || "") && str(map.image.alt), "map.image needs an https url and alt text describing what the picture shows.");
    if (map.bookmarks !== undefined) need(Array.isArray(map.bookmarks) && map.bookmarks.every(str),
      "map.bookmarks should be a list of bookmark names, exactly as in the map.");
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
      need(q.student === undefined, w + ": student is replaced by steps and ask (format 1.6).");
      need(Array.isArray(q.steps) && q.steps.length >= 2 && q.steps.length <= 5, w + ": steps needs 2 to 5 actions on the map.");
      (Array.isArray(q.steps) ? q.steps : []).forEach(function (st, j) {
        lang(st, w + " step " + (j + 1), langs);
        langs.forEach(function (lg) { if (st && str(st[lg])) need(st[lg].indexOf("?") < 0, w + " step " + (j + 1) + " (" + lg + "): steps are actions, not questions; put questions in ask."); });
      });
      lang(q.ask, w + " ask (the questions to answer)", langs);
      if (q.fill) lang(q.fill, w + " fill-in line", langs);
      if (q.lines !== undefined) need(Number.isInteger(q.lines) && q.lines >= 1 && q.lines <= 8, w + ": lines (writing lines on the sheet) should be a whole number from 1 to 8.");
      need(str(q.task), w + ": task (the teacher-facing version) is missing.");
      need(Array.isArray(q.tools) && q.tools.length > 0, w + ": list the map tools it uses.");
      (q.tools || []).forEach(function (t) { need(!!site.tools[t], w + ": unknown tool \"" + t + "\". Known tools: " + Object.keys(site.tools).join(", ") + "."); });
      var a = q.answer || {};
      need(str(a.where) || str(a.accept) || str(a.text) || (a.table && a.table.rows), w + ": answer notes need at least one of where (where on the map to find it), accept (what to accept), text or table.");
      need(str(a.where) || str(a.accept), w + ": answer notes should say where on the map the answer is found (where) or what to accept (accept), not only the answer itself.");
      if (q.answer && q.answer.table) {
        var cols = (q.answer.table.columns || []).length;
        (q.answer.table.rows || []).forEach(function (r, j) { need(r.length === cols, w + ": answer table row " + (j + 1) + " should have " + cols + " cells."); });
      }
    });
    var cores = (inq.questions || []).filter(function (q) { return q.core === true; }).length;
    need(cores === 1, "Exactly one question should have core: true (the one to use if there is only time for one); found " + cores + ".");
    (inq.questions || []).forEach(function (q, i) {
      var w = "Question " + (i + 1);
      need(Number.isInteger(q.minutes) && q.minutes >= 5 && q.minutes <= 30, w + ": minutes should be a whole number from 5 to 30.");
      need(Array.isArray(q.frontOfClass) && q.frontOfClass.length >= 2 && q.frontOfClass.every(str), w + ": frontOfClass needs at least two steps.");
    });
    var diff = lesson.differentiation || {};
    need(str(diff.support) && str(diff.stretch), "differentiation needs support and stretch, one line each.");
    var fin = inq.final || {};
    need(str(fin.teacher), "inquiry.final.teacher is missing.");
    lang(fin.student, "inquiry.final.student", langs);
    (fin.tools || []).forEach(function (t) { need(!!site.tools[t], "inquiry.final: unknown tool \"" + t + "\"."); });
    if (lesson.studentSupport !== undefined) {
      var sup = lesson.studentSupport || {};
      need(typeof sup === "object" && !Array.isArray(sup), "studentSupport should be an object.");
      need(sup.beforeYouStart || sup.readingTheMap || (sup.tips || []).length || sup.reflection,
        "studentSupport is empty: give at least one of beforeYouStart, readingTheMap, tips or reflection.");
      if (sup.beforeYouStart) lang(sup.beforeYouStart, "studentSupport.beforeYouStart", langs);
      if (sup.readingTheMap) lang(sup.readingTheMap, "studentSupport.readingTheMap", langs);
      if (sup.reflection) lang(sup.reflection, "studentSupport.reflection", langs);
      if (sup.tips !== undefined) need(Array.isArray(sup.tips), "studentSupport.tips should be a list, such as [\"popups\"].");
      (Array.isArray(sup.tips) ? sup.tips : []).forEach(function (k) {
        langs.forEach(function (lg) {
          var T = (site.sheetText || {})[lg] || {};
          need(T.tips && str(T.tips[k]), "studentSupport.tips: no \"" + k + "\" tip in site.json sheetText." + lg + ".tips.");
        });
      });
      langs.forEach(function (lg) {
        var T = (site.sheetText || {})[lg] || {};
        ["beforeYouStart", "readingTheMap", "questions", "lookingBack", "tip"].forEach(function (k) {
          need(str(T[k]), "site.json sheetText." + lg + "." + k + " is missing (the two-page sheet's wording).");
        });
      });
    }
    var tn = lesson.teacherNotes || {};
    need(str(tn.beforeClass), "teacherNotes.beforeClass is missing.");
    need(Array.isArray(tn.keyWords) && tn.keyWords.length > 0, "teacherNotes.keyWords needs at least one word.");
    (tn.misconceptions || []).forEach(function (m, i) { need(str(m.claim) && str(m.response), "teacherNotes.misconceptions[" + (i + 1) + "] needs claim and response."); });
    need(Array.isArray(lesson.standards) && lesson.standards.length > 0, "standards needs at least one standard.");
    (lesson.standards || []).forEach(function (s, i) {
      need(str(s.code) && str(s.text), "standards[" + (i + 1) + "] needs code and text.");
      need(/^[A-Z][A-Z0-9]*[\s.]/.test(s.code || ""), "standards[" + (i + 1) + "]: code should start with the framework, such as C3, TX or FL, then a space.");
    });
    // Format 1.8: the licence lives in the lessons settings file. A lesson sets its own only when it differs.
    if (lesson.licence !== undefined) need(str(lesson.licence), "licence, if given, should be the lesson's own licence statement (leave it out to use the lessons settings).");
    need(str(licence(site, lesson)), "No licence: set licence in the lessons settings file.");
    need(Array.isArray(lesson.subjects) && lesson.subjects.length > 0 && lesson.subjects.every(str), "subjects needs at least one subject.");
    need(Array.isArray(lesson.objectives) && lesson.objectives.length >= 3 && lesson.objectives.length <= 5 && lesson.objectives.every(str), "objectives needs 3 to 5 lines (Students will…).");
    need(Array.isArray(lesson.discussion) && lesson.discussion.length >= 2 && lesson.discussion.length <= 4 && lesson.discussion.every(str), "discussion needs 2 to 4 debrief questions.");
    if (lesson.instructionalModels !== undefined) need(Array.isArray(lesson.instructionalModels) && lesson.instructionalModels.every(str), "instructionalModels should be a list of short phrases.");
    (lesson.resources || []).forEach(function (r, i) { need(r && str(r.title) && /^https:\/\//.test(r.url || ""), "resources[" + (i + 1) + "] needs a title and an https:// url."); });
    // Format 1.7: assessment of the answer to the compelling question (teacher-facing, English): what counts as map
    // evidence in this lesson, and a model answer at the top level of the shared rubric in site.json.
    var asm = lesson.assessment;
    need(asm && typeof asm === "object", "assessment is missing (format 1.7: evidence and exemplar).");
    if (asm) {
      need(str(asm.evidence) && asm.evidence.length >= 60 && asm.evidence.length <= 400, "assessment.evidence should be one or two sentences (60 to 400 characters) naming the layers, features, dates or numbers a strong answer uses.");
      need(str(asm.exemplar) && asm.exemplar.length >= 400 && asm.exemplar.length <= 1400, "assessment.exemplar should be a model answer of about 80 to 200 words (400 to 1400 characters).");
      need(!/\?/.test(asm.exemplar || ""), "assessment.exemplar should answer, not ask: no question marks.");
    }
    var links = JSON.stringify(lesson).match(/\]\(([^)]+)\)/g) || [];
    links.forEach(function (m) { need(/^\]\(https:\/\//.test(m), "Links must start with https:// (found " + m.slice(2, -1) + ")."); });
    return errs;
  }

  return { VERSION: VERSION, esc: esc, inline: inline, plain: plain, atlasUrl: atlasUrl, mapImage: mapImage, classroomShareUrl: classroomShareUrl, hubUrl: hubUrl, feedbackUrl: feedbackUrl,
    mergeSite: mergeSite, loadSite: loadSite, defaultLessons: defaultLessons, lessonsFileName: lessonsFileName, unfilled: unfilled,
    names: names, appName: appName, aOrAn: aOrAn, licence: licence, assistant: assistant,
    howToLinks: howToLinks, assistantUrl: assistantUrl, lessonEntry: lessonEntry, assistantFile: assistantFile, assistantFileName: assistantFileName, aiPrompt: aiPrompt, promptUrl: promptUrl,
    unitList: unitList, unitIndex: unitIndex, skills: skills, instructionalModels: instructionalModels, sortStandards: sortStandards, standardPrefix: standardPrefix, standardLabel: standardLabel, check: check };
});
