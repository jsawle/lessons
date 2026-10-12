/* MapMaker resource pages: Hub page builder v1.0.
   Turns lesson files into ArcGIS Hub page layouts: sections of markdown cards that hold plain HTML
   and one <style> block, with no scripts, so the pages work inside Hub. Runs in the browser
   (window.MMRHub, for the Hub preview) and in Node (for the bundle the publishing notebook reads). */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory(require("./lesson-core.js"));
  else root.MMRHub = factory(root.MMR);
})(typeof self !== "undefined" ? self : this, function (MMR) {
  "use strict";
  var VERSION = "1.0";
  var esc = MMR.esc;
  var MONTHS = ["August", "September", "October", "November", "December", "January", "February", "March", "April", "May", "June", "July"];
  var NEW_TAB = '<span class="mml-sr"> (opens in a new tab)</span>';

  /* Tags and attributes the pages use. The checker rejects anything else, so a lesson file can't
     put something into the Hub that Hub's own HTML cleaner might strip or mangle. */
  var ALLOWED = {
    tags: ["style", "div", "p", "span", "a", "h1", "h2", "h3", "ul", "ol", "li", "strong", "em", "code", "br",
      "table", "thead", "tbody", "tr", "th", "td"],
    attrs: ["class", "href", "target", "rel", "lang", "scope"]
  };

  var CSS = [
    '.mml{font-family:"Avenir Next",Avenir,"Segoe UI",Helvetica,Arial,sans-serif;color:#111;font-size:17px;line-height:1.6;max-width:72rem;margin:0 auto;padding:6px 0}',
    ".mml a{color:#0a4fa8;text-decoration:underline;text-underline-offset:.18em}",
    ".mml a:focus-visible{outline:3px solid #0b5fff;outline-offset:2px}",
    ".mml h1{font-size:2.4rem;line-height:1.15;font-weight:800;margin:.15em 0 .3em;color:#111}",
    ".mml h2{display:inline-block;font-size:1.6rem;line-height:1.2;font-weight:800;margin:0 0 .6em;padding-bottom:.25em;border-bottom:3px solid #FFCC00;color:#111}",
    ".mml h3{font-size:1.15rem;line-height:1.3;font-weight:800;margin:1em 0 .35em;color:#111}",
    ".mml p{margin:0 0 .7em}",
    ".mml ul,.mml ol{margin:0 0 .8em;padding-left:1.3em}",
    ".mml li{margin:0 0 .3em}",
    ".mml code{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:.88em}",
    ".mml-sr{position:absolute!important;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}",
    ".mml-hero{background:#f4f4f2;border-bottom:3px solid #FFCC00;border-radius:8px;padding:26px 24px 18px}",
    ".mml-crumbs{font-size:.95rem;color:#4a4a4a}",
    ".mml-summary{font-size:1.15rem;max-width:46rem}",
    ".mml .mml-facts{list-style:none;padding:0;margin:.4em 0 1em;display:flex;flex-wrap:wrap;gap:.4em 1.8em}",
    ".mml-facts li{display:flex;flex-direction:column;margin:0}",
    ".mml-k{display:block;font-size:.75rem;text-transform:uppercase;letter-spacing:.07em;color:#4a4a4a;font-weight:700}",
    ".mml-v{font-weight:600}",
    ".mml-actions{display:flex;flex-wrap:wrap;gap:.6em;margin:.3em 0 .9em}",
    ".mml .mml-btn{display:inline-block;font-weight:700;line-height:1.25;padding:.65em 1em;border-radius:6px;border:2px solid #000;background:#fff;color:#000;text-decoration:none}",
    ".mml .mml-btn:hover{background:#f4f4f2}",
    ".mml .mml-primary{background:#FFCC00;border-color:#FFCC00}",
    ".mml .mml-primary:hover{background:#ffd633}",
    ".mml-chip{display:inline-block;font-size:.8rem;font-weight:700;padding:.1em .6em;border-radius:999px;border:1px solid #d6d6d0;background:#fff}",
    ".mml-draft{background:#fff6dc;color:#4a3a06;border-color:#e8d38a}",
    ".mml-ok{background:#e6f4ea;color:#11602a;border-color:#b7dcc2}",
    ".mml-open{background:#fde8e8;color:#8a1c1c;border-color:#f2c1c1}",
    ".mml-muted{color:#4a4a4a}",
    ".mml-prose{max-width:46rem}",
    ".mml-tablewrap{border:1px solid #d6d6d0;border-radius:8px;margin:0 0 1em}",
    ".mml table{border-collapse:collapse;width:100%;font-size:.96rem;margin:0}",
    ".mml th,.mml td{text-align:left;vertical-align:top;padding:.6em .8em;border-bottom:1px solid #d6d6d0;overflow-wrap:break-word}",
    ".mml th code{white-space:nowrap}",
    ".mml-ph{display:none}",
    ".mml thead th{font-size:.78rem;text-transform:uppercase;letter-spacing:.05em;color:#4a4a4a;background:#f4f4f2}",
    ".mml tr:last-child th,.mml tr:last-child td{border-bottom:0}",
    ".mml-cq{border:2px solid #000;border-left:10px solid #FFCC00;border-radius:8px;padding:1em 1.2em;margin:0 0 1em}",
    ".mml-cq .mml-q{font-size:1.3rem;font-weight:700;line-height:1.35;margin:.2em 0 0}",
    ".mml .mml-qs{list-style:none;padding:0;margin:0 0 1em;counter-reset:mmlq}",
    ".mml-qs>li{counter-increment:mmlq;position:relative;border:1px solid #d6d6d0;border-radius:8px;padding:.85em 1.1em .5em 3.4em;margin:0 0 .9em}",
    ".mml-qs>li::before{content:counter(mmlq);position:absolute;left:.9em;top:.85em;width:1.9em;height:1.9em;line-height:1.9em;text-align:center;border-radius:50%;background:#FFCC00;font-weight:800}",
    ".mml-qs h3{margin:.1em 0 .3em}",
    ".mml-tools{font-size:.95rem}",
    ".mml-sheet{border:1px solid #d6d6d0;border-radius:8px;padding:1.2em 1.4em .6em;max-width:46rem;box-shadow:0 1px 3px rgba(0,0,0,.06);background:#fff}",
    ".mml-sheet ol{padding-left:1.4em}",
    ".mml-blank{display:inline-block;min-width:6em;border-bottom:1px solid #4a4a4a}",
    ".mml .mml-words{list-style:none;padding:0;display:flex;flex-wrap:wrap;gap:.45em}",
    ".mml-words li{border:1px solid #d6d6d0;border-radius:4px;padding:.1em .6em;font-weight:600;margin:0}",
    ".mml .mml-cards{list-style:none;padding:0;margin:0 0 1em;display:flex;flex-wrap:wrap;gap:1em}",
    ".mml-cards>li{flex:1 1 15rem;min-width:0;margin:0}",
    ".mml .mml-cards a{display:block;height:100%;border:1px solid #d6d6d0;border-top:6px solid #FFCC00;border-radius:8px;padding:.9em 1em;text-decoration:none;color:#111}",
    ".mml .mml-cards a:hover{box-shadow:0 4px 14px rgba(0,0,0,.12)}",
    ".mml-card-title{display:block;font-weight:800;font-size:1.05rem;color:#0a4fa8;text-decoration:underline}",
    ".mml-card-text{display:block;color:#4a4a4a;font-size:.95rem}",
    ".mml .mml-lessons{list-style:none;padding:0;margin:0 0 1em;display:flex;flex-wrap:wrap;gap:1em}",
    ".mml-lessons>li{flex:1 1 18rem;min-width:0;border:1px solid #d6d6d0;border-top:6px solid #FFCC00;border-radius:8px;padding:.9em 1.1em .4em;margin:0}",
    ".mml .mml-lessons h2{display:block;border:0;font-size:1.25rem;margin:.1em 0 .3em;padding:0}",
    ".mml-month{font-size:.78rem;text-transform:uppercase;letter-spacing:.07em;font-weight:700;color:#4a4a4a;margin:0}",
    ".mml-foot{background:#111;color:#fff;border-top:3px solid #FFCC00;border-radius:8px;padding:20px 24px 16px;font-size:.92rem}",
    ".mml.mml-foot a{color:#FFCC00}",
    ".mml.mml-foot h2{display:block;color:#fff;font-size:1.05rem;border:0;padding:0;margin:0 0 .5em}",
    ".mml-foot .mml-tablewrap{border-color:#333;max-width:32rem}",
    ".mml-foot th,.mml-foot td{border-bottom:1px solid #333;padding:.3em .6em;color:#fff}",
    ".mml-foot thead th{background:#222;color:#ddd}",
    ".mml-credit{display:flex;justify-content:flex-end;margin:12px 0 0}",
    ".mml-credit span{background:#000;color:#fff;border-top:3px solid #FFCC00;padding:6px 10px;font-size:12px;line-height:1.35;border-radius:4px}",
    "@media (max-width:640px){.mml h1{font-size:1.9rem}.mml-hero{padding:20px 16px 14px}.mml .mml-qs>li{padding-left:3em}.mml-foot{padding:16px}.mml table,.mml tbody,.mml tr,.mml th,.mml td{display:block;width:auto}.mml thead{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)}.mml tr{border-bottom:1px solid #d6d6d0;padding:.45em 0}.mml tr:last-child{border-bottom:0}.mml th,.mml td{border:0;padding:.2em .8em}.mml-ph{display:inline;font-weight:700}}",
    "@media print{.mml-actions,.mml-foot{display:none}}"
  ].join("");

  /* Hub runs card text through Markdown. Keeping each card on one line, and turning _ and * in
     text into character references, stops Markdown from rewriting the HTML. */
  function protect(html) {
    var m = /^(<style>[\s\S]*?<\/style>)?([\s\S]*)$/.exec(String(html));
    return (m[1] || "") + m[2].split(/(<[^>]+>)/).map(function (part, i) {
      return i % 2 ? part : part.replace(/_/g, "&#95;").replace(/\*/g, "&#42;");
    }).join("").replace(/\s*\n\s*/g, " ");
  }
  function t(text) { return MMR.inline(text).replace(/<span class="sr-only">/g, '<span class="mml-sr">'); }
  function ext(href, label, cls) {
    return '<a' + (cls ? ' class="' + cls + '"' : "") + ' href="' + esc(href) + '" target="_blank" rel="noopener">' + label + NEW_TAB + "</a>";
  }
  function sheetPlaceholder(lessonId, lang) { return "{{SHEET:" + lessonId + ":" + lang + "}}"; }

  function hashId(s) {
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    return ("c" + h.toString(36) + "00000000").slice(0, 9);
  }
  function section(slug, n, markdown) {
    return {
      containment: "fixed", isFooter: false,
      style: { background: { isFile: false, isUrl: true, state: "", display: {}, transparency: 0, position: { x: "center", y: "center" }, color: "transparent" }, rowLayout: "box" },
      rows: [{ cards: [{ component: { name: "markdown-card", settings: { cardId: hashId(slug + ":" + n), schemaVersion: 2.1, markdown: protect(markdown) } }, width: 12 }] }],
      visibility: { access: "default", groups: [] }
    };
  }
  /* On phones the table turns into stacked rows, so each cell after the first carries its column name,
     shown only on small screens. */
  function table(caption, columns, rows, rowHeaders) {
    return '<div class="mml-tablewrap"><table><thead><tr>' + columns.map(function (c) { return '<th scope="col">' + esc(c) + "</th>"; }).join("") +
      "</tr></thead><tbody>" + rows.map(function (r) {
        return "<tr>" + r.map(function (c, j) {
          if (j === 0 && rowHeaders) return '<th scope="row">' + c + "</th>";
          return '<td><span class="mml-ph">' + esc(columns[j]) + ": </span>" + c + "</td>";
        }).join("") + "</tr>";
      }).join("") + "</tbody></table></div>";
  }
  function langName(site, lang) { return (site.languageNames && site.languageNames[lang]) || lang; }
  /* Inside a phrase, Spanish (and most languages) write the language name in lower case: "Hoja del estudiante (español)". */
  function langInPhrase(site, lang) { var n = langName(site, lang); return lang === "en" ? n : n.toLowerCase(); }
  function hubHome(site) { return site.hubDemo || {}; }
  function lessonsPath(site) { return "/pages/" + (hubHome(site).lessonsSlug || "lessons"); }

  function statusChip(lesson) {
    if (lesson.status === "draft") return '<span class="mml-chip mml-draft">Draft: not yet reviewed</span>';
    return '<span class="mml-chip mml-ok">' + (lesson.status === "published" ? "Published" : "Reviewed") +
      (lesson.reviewed ? " by " + esc(lesson.reviewed.by) + ", " + esc(lesson.reviewed.date) : "") + "</span>";
  }
  function toolLinks(site, tools) {
    return (tools || []).map(function (k) {
      var tl = site.tools[k];
      return '<a href="' + esc(MMR.hubUrl(site, "/pages/" + tl.howTo)) + '" target="_blank" rel="noopener">' + esc(tl.label) +
        '<span class="mml-sr">, how-to video: ' + esc(tl.howToTitle) + " (opens in a new tab)</span></a>";
    }).join(" · ");
  }

  function sheetPreview(site, lesson, lang) {
    var T = site.sheetText[lang];
    var title = lang === "en" ? lesson.title : (lesson.sheetTitle && lesson.sheetTitle[lang]) || lesson.title;
    function blanks(s) { return esc(MMR.plain(s)).replace(/_{3,}/g, '<span class="mml-blank"> </span>'); }
    return '<div class="mml-sheet" lang="' + lang + '"><h3>' + esc(title) + '</h3><p class="mml-muted">' + esc(T.subtitle) + "</p>" +
      "<p>" + esc(T.name) + ' <span class="mml-blank"> </span> ' + esc(T.date) + ' <span class="mml-blank"> </span></p>' +
      "<p><strong>" + esc(T.bigQuestion) + "</strong> " + t(lesson.inquiry.compellingQuestion[lang]) + "</p>" +
      "<p><em>" + esc(T.openMap + " " + lesson.title) + "</em></p><ol>" +
      lesson.inquiry.questions.map(function (q) {
        return "<li><strong>" + t(q.title[lang]) + "</strong> " + t(q.student[lang]) + (q.fill ? " " + blanks(q.fill[lang]) : "") + "</li>";
      }).join("") + "</ol><p><strong>" + esc(T.yourAnswer) + "</strong> " + t(lesson.inquiry.final.student[lang]) + "</p></div>";
  }

  function versionsTable(site, lesson) {
    var rows = [["MapMaker resource pages", site.app.version]];
    Object.keys(site.app.parts).forEach(function (k) { rows.push([k, site.app.parts[k]]); });
    if (lesson) rows.push(["This lesson's content", lesson.contentVersion + " (" + lesson.status + ")"]);
    return table("Versions", ["Part", "Version"], rows.map(function (r) { return [esc(r[0]), esc(r[1])]; }), true);
  }
  function footer(site, lesson) {
    var repo = (hubHome(site).repoUrl || "").replace(/\/+$/, "");
    return '<div class="mml mml-foot"><h2>About this page</h2>' +
      (lesson ? "<p>" + t(lesson.licence) + " Map data: credited to each source under About this map.</p>" : "") +
      "<p>This page is built from " + (lesson ? "one lesson file" : "the lesson files") + (repo ? ": " + ext(repo + (lesson ? "/blob/main/resources/lessons/" + lesson.id + ".json" : "/tree/main/resources/lessons"), lesson ? "<code>" + esc(lesson.id) + ".json</code>" : "resources/lessons") : "") +
      ". Edit the file, not this page; the page is rebuilt from it.</p>" + versionsTable(site, lesson) +
      '<div class="mml-credit"><span>Created by Jason Sawle</span></div></div>';
  }

  /* ---------------- Lesson page ---------------- */
  function lessonPage(site, lesson) {
    var slug = lesson.id, S = [], n = 0;
    var langs = Object.keys(lesson.languages);
    var mm = MMR.mapmakerUrl(site, lesson.map.webmapId);
    function add(html) { S.push(section(slug, n++, html)); }

    // Hero
    add("<style>" + CSS + "</style>" + '<div class="mml mml-hero"><p class="mml-crumbs"><a href="' + lessonsPath(site) + '">Lessons</a> › ' + esc(lesson.course) + "</p>" +
      "<h1>" + esc(lesson.title) + '</h1><p class="mml-summary">' + t(lesson.summary) + "</p>" +
      '<ul class="mml-facts">' + [["Grade", lesson.grade], ["Time", lesson.time], ["Unit", lesson.unit], ["Student login", lesson.studentLogin]].map(function (f) {
        return '<li><span class="mml-k">' + f[0] + '</span><span class="mml-v">' + esc(f[1]) + "</span></li>";
      }).join("") + "</ul>" +
      '<p class="mml-actions">' + ext(mm, "Open in MapMaker", "mml-btn mml-primary") + langs.map(function (l) {
        var T = site.sheetText[l];
        return ' <a class="mml-btn" href="' + sheetPlaceholder(lesson.id, l) + '"' + (l !== "en" ? ' lang="' + l + '"' : "") + ">" + esc(T.subtitle) + " (Word, " + esc(langInPhrase(site, l)) + ")</a>";
      }).join("") + "</p>" +
      "<p>" + statusChip(lesson) + ' <span class="mml-muted">Content version ' + esc(lesson.contentVersion) + ", updated " + esc(lesson.updated) + ".</span></p></div>");

    // About this map
    var issues = lesson.knownIssues || [];
    add('<div class="mml"><h2>About this map</h2><p class="mml-prose">Each layer names its source, so you can check where the information comes from.</p>' +
      table("Map layers and sources", ["Layer", "What it shows", "Source"], lesson.map.layers.map(function (l) {
        return [esc(l.name) + (l.offAtStart ? ' <span class="mml-muted">(off when the map opens)</span>' : ""), t(l.shows), t(l.source)];
      }), true) +
      "<p><strong>Bookmarks:</strong> " + ((lesson.map.bookmarks || []).length ? lesson.map.bookmarks.map(esc).join("; ") : "none") + ".</p>" +
      "<h3>Known issues</h3>" + (issues.length ? "<ul>" + issues.map(function (k) {
        return '<li><span class="mml-chip ' + (k.status === "fixed" ? "mml-ok" : "mml-open") + '">' + (k.status === "fixed" ? "Fixed " : "Open ") + esc(k.date) + "</span> <strong>" + esc(k.where) + ":</strong> " + t(k.note) + "</li>";
      }).join("") + "</ul>" : "<p>No known issues.</p>") + "</div>");

    // Inquiry
    var inq = lesson.inquiry;
    add('<div class="mml"><h2>Inquiry</h2><div class="mml-cq"><span class="mml-k">Compelling question</span><p class="mml-q">' + t(inq.compellingQuestion.en) + "</p></div>" +
      '<p class="mml-prose">Pick the questions that suit your class. Each one lists the MapMaker tools it uses, linked to how-to videos.</p><ol class="mml-qs">' +
      inq.questions.map(function (q) {
        return "<li><h3>" + t(q.title.en) + "</h3><p>" + t(q.task) + '</p><p class="mml-tools"><span class="mml-muted">Tools:</span> ' + toolLinks(site, q.tools) + "</p></li>";
      }).join("") + "</ol><h3>Answering the compelling question</h3><p class=\"mml-prose\">" + t(inq.final.teacher) + "</p>" +
      ((inq.final.tools || []).length ? '<p class="mml-tools"><span class="mml-muted">Tools:</span> ' + toolLinks(site, inq.final.tools) + "</p>" : "") + "</div>");

    // Student activity
    add('<div class="mml"><h2>Student activity</h2><p class="mml-prose">This is what students see on the Word sheet. Download it to edit it, print it, or open it in Google Docs.</p>' +
      '<p class="mml-actions">' + langs.map(function (l) {
        return '<a class="mml-btn" href="' + sheetPlaceholder(lesson.id, l) + '"' + (l !== "en" ? ' lang="' + l + '"' : "") + ">Download Word (" + esc(langName(site, l)) + ")</a>";
      }).join(" ") + "</p>" + sheetPreview(site, lesson, "en") +
      langs.filter(function (l) { return l !== "en" && lesson.languages[l].note; }).map(function (l) {
        return '<p class="mml-muted">' + esc(langName(site, l)) + ": " + esc(lesson.languages[l].note) + "</p>";
      }).join("") + "</div>");

    // Teacher notes
    var tn = lesson.teacherNotes;
    add('<div class="mml"><h2>Teacher notes</h2><h3>Before class</h3><p class="mml-prose">' + t(tn.beforeClass) + "</p><h3>Answer notes</h3>" +
      inq.questions.map(function (q, i) {
        var a = q.answer, body = "";
        if (a.table) body += table(a.table.caption || "Answer table", a.table.columns, a.table.rows.map(function (r) { return r.map(t); }), true);
        if (a.text) body += '<p class="mml-prose">' + t(a.text) + "</p>";
        return "<p><strong>" + (i + 1) + ". " + t(q.title.en) + "</strong></p>" + body;
      }).join("") +
      (tn.misconceptions && tn.misconceptions.length ? "<h3>Common misunderstandings</h3><ul>" + tn.misconceptions.map(function (m) {
        return "<li><strong>“" + t(m.claim) + "”</strong> " + t(m.response) + "</li>";
      }).join("") + "</ul>" : "") +
      '<h3>Key words</h3><ul class="mml-words">' + tn.keyWords.map(function (k) { return "<li>" + esc(k) + "</li>"; }).join("") + "</ul></div>");

    // Standards
    add('<div class="mml"><h2>Standards</h2>' + table("Standards", ["Code", "Standard"], lesson.standards.map(function (s) {
      return ["<code>" + esc(s.code) + "</code>", t(s.text)];
    }), true) + (lesson.status === "draft" ? '<p class="mml-muted">Draft list, to be checked against each state\'s current standards.</p>' : "") +
      (lesson.planMonth ? '<p class="mml-muted">In the ' + esc(lesson.course) + " map plan, this lesson sits in " + esc(lesson.planMonth) + ".</p>" : "") + "</div>");

    // How-to videos
    add('<div class="mml"><h2>How-to videos</h2><p class="mml-prose">Short videos on the MapMaker Educator Support Hub for the tools this lesson uses.</p><ul class="mml-cards">' +
      MMR.howToLinks(site, lesson).map(function (h) {
        return '<li><a href="' + esc(h.url) + '" target="_blank" rel="noopener"><span class="mml-card-title">' + esc(h.title) + '</span><span class="mml-card-text">For: ' + esc(h.covers.join(", ")) + "</span>" + NEW_TAB + "</a></li>";
      }).join("") + "</ul></div>");

    // Vera
    var vUrl = MMR.veraUrl(site, lesson);
    if (vUrl) add('<div class="mml"><h2>Make your own questions with Vera</h2><p class="mml-prose">Vera, the Support Hub’s AI assistant, has this lesson’s map, bookmarks, layers and sources. You can ask it for easier or harder questions, a short quiz, questions for your own state’s standards, or questions in another language.</p>' +
      '<p class="mml-prose">Vera’s questions aren’t reviewed like this lesson. Each one should be answerable from the map; if one isn’t, please tell us using Report a problem.</p>' +
      '<p class="mml-actions">' + ext(vUrl, "Open Vera with this lesson", "mml-btn mml-primary") + "</p></div>");

    // Report a problem
    add('<div class="mml"><h2>Report a problem</h2><p class="mml-prose">Found a mistake on the map, in the answers or on the student sheet? Tell the MapMaker team. Confirmed problems are listed under Known issues until they’re fixed.</p>' +
      '<p class="mml-actions">' + ext(MMR.hubUrl(site, site.hub.feedbackPath), "Report a problem", "mml-btn") + "</p></div>");

    add(footer(site, lesson));
    return { slug: slug, kind: "lesson", lessonId: lesson.id, title: lesson.title, summary: MMR.plain(lesson.summary),
      tags: ["MapMaker", "Lesson", lesson.course, "Grade " + lesson.grade], contentVersion: lesson.contentVersion,
      layout: { sections: S } };
  }

  /* ---------------- Lessons (catalogue) page ---------------- */
  function monthIndex(m) { var i = MONTHS.indexOf(m); return i < 0 ? 99 : i; }
  function cataloguePage(site, lessons) {
    var H = hubHome(site), slug = H.lessonsSlug || "lessons", S = [], n = 0;
    function add(html) { S.push(section(slug, n++, html)); }
    var sorted = lessons.slice().sort(function (a, b) { return monthIndex(a.planMonth) - monthIndex(b.planMonth) || a.title.localeCompare(b.title); });
    var courses = sorted.map(function (l) { return l.course; }).filter(function (v, i, a) { return a.indexOf(v) === i; });
    add("<style>" + CSS + "</style>" + '<div class="mml mml-hero"><h1>' + esc(H.lessonsTitle || "Lessons") + '</h1><p class="mml-summary">' + esc(H.lessonsIntro || "") + "</p>" +
      "<p>" + (sorted.some(function (l) { return l.status === "draft"; }) ? '<span class="mml-chip mml-draft">Drafts: not yet reviewed</span> ' : "") +
      '<span class="mml-muted">' + sorted.length + " lesson" + (sorted.length === 1 ? "" : "s") + " · " + esc(courses.join(", ")) + "</span></p></div>");
    add('<div class="mml"><ul class="mml-lessons">' + sorted.map(function (l) {
      return '<li><p class="mml-month">' + esc(l.planMonth || "") + '</p><h2><a href="/pages/' + esc(l.id) + '">' + esc(l.title) + "</a></h2>" +
        '<p class="mml-muted">' + esc(l.course + " · Grade " + l.grade + " · " + l.unit) + "</p><p>" + t(l.summary) + "</p><p>" + statusChip(l) + "</p></li>";
    }).join("") + "</ul></div>");
    add('<div class="mml"><h2>In every lesson</h2><ul class="mml-prose"><li>A MapMaker map that opens straight from the page, with each layer’s source listed.</li>' +
      "<li>An inquiry with a compelling question and questions you can pick from.</li><li>A Word student sheet in English and Spanish that you can edit, print or open in Google Docs.</li>" +
      "<li>Teacher notes with answers, common misunderstandings, key words and standards.</li><li>Links to how-to videos, and to Vera for making your own questions.</li></ul></div>");
    add(footer(site, null));
    return { slug: slug, kind: "catalogue", title: H.lessonsTitle || "Lessons", summary: H.lessonsIntro || "", tags: ["MapMaker", "Lessons"], layout: { sections: S } };
  }

  /* ---------------- Word items and the bundle ---------------- */
  function sheets(site, lessons, distUrl, fileName) {
    var out = [];
    lessons.forEach(function (l) {
      Object.keys(l.languages).forEach(function (lang) {
        var T = site.sheetText[lang], title = lang === "en" ? l.title : (l.sheetTitle && l.sheetTitle[lang]) || l.title;
        var fn = fileName(l, lang);
        out.push({ key: l.id + ":" + lang, keyword: "mmlSheet-" + l.id + "-" + lang, lessonId: l.id, lang: lang,
          title: title + ": " + T.subtitle + " (" + langInPhrase(site, lang) + ")",
          snippet: (T.subtitle + " for the MapMaker lesson " + l.title + ". Word document you can edit, print or open in Google Docs.").slice(0, 250),
          description: "<p>" + esc(T.subtitle) + " for the MapMaker lesson <strong>" + esc(l.title) + "</strong> (" + esc(l.course) + ", grade " + esc(l.grade) + ").</p>" +
            "<p>Lesson content version " + esc(l.contentVersion) + " (" + esc(l.status) + (l.languages[lang].status === "draft" ? ", draft translation" : "") + "). Map: <a href=\"" + esc(MMR.mapmakerUrl(site, l.map.webmapId)) + "\">open in MapMaker</a>.</p>" +
            "<p>" + esc(MMR.plain(l.licence)) + "</p>",
          tags: ["MapMaker", "Student sheet", l.course, langName(site, lang)],
          fileName: fn, url: distUrl.replace(/\/+$/, "") + "/sheets/" + fn, contentVersion: l.contentVersion });
      });
    });
    return out;
  }

  function builtOn(lessons) { return lessons.map(function (l) { return l.updated; }).sort().slice(-1)[0] || ""; }

  function bundle(site, lessons, opts) {
    opts = opts || {};
    var H = hubHome(site), dist = H.distUrl || "";
    return {
      format: "mml-hub-bundle/1",
      builtOn: builtOn(lessons),
      app: { name: site.app.name, version: site.app.version, parts: site.app.parts },
      hub: { siteId: H.siteId, url: H.url, lessonsSlug: H.lessonsSlug || "lessons" },
      pages: [cataloguePage(site, lessons)].concat(lessons.map(function (l) { return lessonPage(site, l); })),
      sheets: sheets(site, lessons, dist, opts.sheetFileName || function (l, lang) { return l.id + "-student-sheet-" + lang + ".docx"; }),
      vera: { fileName: MMR.veraFileName(), url: dist.replace(/\/+$/, "") + "/" + MMR.veraFileName() }
    };
  }

  /* The checker for Hub pages: one line per card, only allowed tags and attributes, known placeholders. */
  function checkPage(page, sheetKeys) {
    var errs = [];
    page.layout.sections.forEach(function (sec, i) {
      var md = sec.rows[0].cards[0].component.settings.markdown, where = page.slug + " section " + (i + 1);
      if (/\n/.test(md)) errs.push(where + ": card text has a line break.");
      if (i > 0 && /<style/i.test(md)) errs.push(where + ": only the first card may hold the <style> block.");
      var body = md.replace(/<style>[\s\S]*?<\/style>/i, "");
      (body.match(/<\/?([a-zA-Z0-9]+)([^>]*)>/g) || []).forEach(function (tag) {
        var m = /^<\/?([a-zA-Z0-9]+)([^>]*)>$/.exec(tag);
        var name = m[1].toLowerCase();
        if (ALLOWED.tags.indexOf(name) < 0) errs.push(where + ": tag <" + name + "> isn't on the allowed list.");
        var rest = m[2].replace(/([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*"[^"]*"/g, function (_, an) {
          if (ALLOWED.attrs.indexOf(an.toLowerCase()) < 0) errs.push(where + ": attribute " + an + " on <" + name + "> isn't on the allowed list.");
          return "";
        });
        if (/[^\s\/]/.test(rest)) errs.push(where + ": unquoted or odd attribute text on <" + name + ">: " + rest.trim());
      });
      (md.match(/\{\{[^}]*\}\}/g) || []).forEach(function (ph) {
        var k = /^\{\{SHEET:(.+)\}\}$/.exec(ph);
        if (!k || sheetKeys.indexOf(k[1]) < 0) errs.push(where + ": unknown placeholder " + ph + ".");
      });
      (md.match(/href="([^"]*)"/g) || []).forEach(function (h) {
        var u = h.slice(6, -1);
        if (!/^(https:\/\/|\/pages\/|\{\{SHEET:)/.test(u)) errs.push(where + ": link " + u + " should be https://, /pages/ or a sheet placeholder.");
      });
    });
    return errs;
  }

  return { VERSION: VERSION, CSS: CSS, ALLOWED: ALLOWED, lessonPage: lessonPage, cataloguePage: cataloguePage, bundle: bundle,
    checkPage: checkPage, sheetPlaceholder: sheetPlaceholder, protect: protect };
});
