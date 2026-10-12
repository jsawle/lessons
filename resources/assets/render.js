/* MapMaker resource pages (lab): page renderer v1.2. Draws a lesson page or the catalogue from JSON files. */
(function () {
  "use strict";
  var MMR = window.MMR, esc = MMR.esc, inline = MMR.inline;
  var $ = function (id) { return document.getElementById(id); };

  function getJSON(url) {
    return fetch(url, { cache: "no-cache" }).then(function (r) {
      if (!r.ok) throw new Error(url + " could not be loaded (" + r.status + ").");
      return r.text();
    }).then(function (t) {
      try { return JSON.parse(t); }
      catch (e) { throw new Error(url + " is not valid JSON: " + e.message); }
    });
  }

  function header(site) {
    var hub = site.hub;
    $("site-header").innerHTML = '<div class="wrap"><a class="name" href="' + esc(hub.url) + '">' + esc(hub.name) + '</a>' +
      '<nav aria-label="Support Hub"><ul>' + hub.nav.map(function (n) {
        return '<li><a href="' + esc(MMR.hubUrl(site, n.path)) + '">' + esc(n.label) + '</a></li>';
      }).join("") + '</ul></nav></div>';
  }

  function showProblems(list, title) {
    if (!list.length) return;
    $("problems").innerHTML = '<div class="problems" role="alert"><div class="wrap"><strong>' + esc(title) + '</strong><ul>' +
      list.map(function (p) { return "<li>" + esc(p) + "</li>"; }).join("") + "</ul></div></div>";
  }

  function versionsTable(site, lesson) {
    var rows = [["App", site.app.version]];
    Object.keys(site.app.parts).forEach(function (k) { rows.push([k, site.app.parts[k]]); });
    if (lesson) rows.push(["This lesson's content", lesson.contentVersion + " (" + lesson.status + ")"]);
    return '<div class="table-wrap" style="border-color:#333"><table><caption class="sr-only">Versions</caption><thead><tr><th scope="col">Part</th><th scope="col">Version</th></tr></thead><tbody>' +
      rows.map(function (r) { return '<tr><th scope="row">' + esc(r[0]) + "</th><td>" + esc(r[1]) + "</td></tr>"; }).join("") + "</tbody></table></div>";
  }

  /* ---------------- Lesson page ---------------- */
  function renderLesson(site, lesson) {
    document.title = lesson.title + " – " + site.hub.name + " (lab)";
    var hubLink = $("hub-link");
    if (hubLink) hubLink.href = "hub-preview.html?page=" + encodeURIComponent(lesson.id);
    var mmUrl = MMR.mapmakerUrl(site, lesson.map.webmapId);
    var langs = Object.keys(lesson.languages);
    var courseUrl = site.hub.coursePaths[lesson.course] ? MMR.hubUrl(site, site.hub.coursePaths[lesson.course]) : null;
    var subjectUrl = site.hub.subjectPaths[lesson.subject] ? MMR.hubUrl(site, site.hub.subjectPaths[lesson.subject]) : null;
    var howTo = MMR.howToLinks(site, lesson);
    var draft = lesson.status === "draft";
    var mapIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z"/><path d="M9 4v14M15 6v14"/></svg>';
    var newTab = '<span class="sr-only"> (opens in a new tab)</span>';
    var h = [];

    h.push('<div class="hero"><div class="wrap">');
    h.push('<nav class="crumbs" aria-label="Breadcrumb"><ol><li><a href="' + esc(MMR.hubUrl(site, "/pages/lessons")) + '">Lessons</a></li>' +
      (subjectUrl ? '<li><a href="' + esc(subjectUrl) + '">' + esc(lesson.subject) + "</a></li>" : "<li>" + esc(lesson.subject) + "</li>") +
      (courseUrl ? '<li><a href="' + esc(courseUrl) + '">' + esc(lesson.course) + "</a></li>" : "<li>" + esc(lesson.course) + "</li>") + "</ol></nav>");
    h.push('<h1 id="lesson-title">' + esc(lesson.title) + "</h1>");
    h.push('<p class="summary">' + inline(lesson.summary) + "</p>");
    h.push('<dl class="facts"><div><dt>Grade</dt><dd>' + esc(lesson.grade) + "</dd></div><div><dt>Time</dt><dd>" + esc(lesson.time) +
      "</dd></div><div><dt>Unit</dt><dd>" + esc(lesson.unit) + "</dd></div><div><dt>Student login</dt><dd>" + esc(lesson.studentLogin) + "</dd></div></dl>");
    h.push('<div class="actions"><a class="btn primary" href="' + esc(mmUrl) + '" target="_blank" rel="noopener">' + mapIcon + "Open in MapMaker" + newTab + "</a>" +
      '<a class="btn" href="#student-activity">Student activity</a><a class="btn" href="#teacher-notes">Teacher notes</a></div>');
    h.push("</div></div>");

    h.push('<div class="wrap"><div class="cards">' +
      card(mmUrl, "MapMaker map", "Open the map students use, with its layers and bookmarks.", true) +
      card("#student-activity", "Student activity", "Questions to work through on the map. Word download in " + langs.map(function (l) { return site.languageNames[l]; }).join(" and ") + ".") +
      card("#teacher-notes", "Teacher notes", "Answers, common misunderstandings and key words.") +
      card("#how-to", "How-to videos", "Short videos for the MapMaker tools this lesson uses.") +
      "</div></div>");

    h.push('<div class="wrap layout"><nav class="toc" aria-labelledby="toc-h"><h2 id="toc-h">On this page</h2><ol>' +
      [["about", "About this map"], ["inquiry", "Inquiry"], ["student-activity", "Student activity"], ["teacher-notes", "Teacher notes"],
       ["standards", "Standards"], ["how-to", "How-to videos"], ["vera", "Questions with Vera"], ["report", "Report a problem"]]
        .map(function (t) { return '<li><a href="#' + t[0] + '">' + t[1] + "</a></li>"; }).join("") + '</ol></nav><div class="content">');

    // About this map
    h.push('<section id="about" aria-labelledby="about-h"><h2 id="about-h">About this map</h2>');
    h.push('<p class="prose">Each layer names its source, so you can check where the information comes from.</p>');
    h.push('<div class="table-wrap" tabindex="0" role="region" aria-label="Map layers and sources"><table><caption class="sr-only">Map layers and sources</caption><thead><tr><th scope="col">Layer</th><th scope="col">What it shows</th><th scope="col">Source</th></tr></thead><tbody>' +
      lesson.map.layers.map(function (l) {
        return '<tr><th scope="row">' + esc(l.name) + (l.offAtStart ? ' <span class="muted">(off at start)</span>' : "") + "</th><td>" + inline(l.shows) + "</td><td>" + inline(l.source) + "</td></tr>";
      }).join("") + "</tbody></table></div>");
    var issues = lesson.knownIssues || [];
    h.push('<div class="issues"><h3>Known issues</h3>' + (issues.length ? "<ul>" + issues.map(function (k) {
      return '<li><span class="chip ' + esc(k.status) + '">' + (k.status === "fixed" ? "Fixed " : "Open ") + esc(k.date) + "</span> <strong>" + esc(k.where) + ":</strong> " + inline(k.note) + "</li>";
    }).join("") + "</ul>" : "<p>No known issues.</p>") + "</div>");
    h.push("<p>" + (lesson.reviewed ? '<span class="chip reviewed">Reviewed by ' + esc(lesson.reviewed.by) + ", " + esc(lesson.reviewed.date) + "</span>"
      : '<span class="chip draft">Not yet reviewed</span>') + ' <span class="muted">Content version ' + esc(lesson.contentVersion) + ", updated " + esc(lesson.updated) + ".</span></p>");
    h.push("</section>");

    // Inquiry
    var inq = lesson.inquiry;
    h.push('<section id="inquiry" aria-labelledby="inquiry-h"><h2 id="inquiry-h">Inquiry</h2>');
    h.push('<div class="cq"><span class="label">Compelling question</span><p class="q">' + inline(inq.compellingQuestion.en) + "</p></div>");
    h.push('<p class="prose">Pick the questions that suit your class. The tags show which MapMaker tools each one uses, and link to how-to videos.</p>');
    h.push('<ol class="sq">' + inq.questions.map(function (q) {
      return "<li><h3>" + inline(q.title.en) + "</h3><p>" + inline(q.task) + "</p>" + toolTags(site, q.tools) + "</li>";
    }).join("") + "</ol>");
    h.push('<div class="prose"><h3>Answering the compelling question</h3><p>' + inline(inq.final.teacher) + "</p>" + toolTags(site, inq.final.tools) + "</div>");
    h.push("</section>");

    // Student activity
    h.push('<section id="student-activity" aria-labelledby="sa-h"><h2 id="sa-h">Student activity</h2>');
    h.push('<p class="prose">This is what students see on the Word sheet. Download it to edit it, print it, or open it in Google Docs.</p>');
    h.push('<div class="sheet-tools">' + (langs.length > 1 ? '<div class="toggle" role="group" aria-label="Sheet language">' + langs.map(function (l, i) {
      return '<button type="button" data-lang="' + l + '" aria-pressed="' + (i === 0) + '">' + esc(site.languageNames[l]) + "</button>";
    }).join("") + "</div>" : "") + langs.map(function (l) {
      return '<button type="button" class="btn" data-download="' + l + '">Download Word (' + esc(site.languageNames[l]) + ")</button>";
    }).join("") + '<p class="status-msg" id="dl-status" role="status" aria-live="polite"></p></div>');
    langs.forEach(function (l, i) { h.push(sheetPreview(site, lesson, l, i > 0)); });
    h.push("</section>");

    // Teacher notes
    var tn = lesson.teacherNotes;
    h.push('<section id="teacher-notes" aria-labelledby="tn-h"><h2 id="tn-h">Teacher notes</h2>');
    h.push('<div class="prose"><h3>Before class</h3><p>' + inline(tn.beforeClass) + "</p></div>");
    h.push('<h3>Answer notes</h3><dl class="answers">' + inq.questions.map(function (q, i) {
      var a = q.answer, body = "";
      if (a.table) body += '<div class="table-wrap" tabindex="0" role="region" aria-label="' + esc(a.table.caption || "Answer table") + '"><table><caption class="sr-only">' + esc(a.table.caption || "") + "</caption><thead><tr>" +
        a.table.columns.map(function (c) { return '<th scope="col">' + esc(c) + "</th>"; }).join("") + "</tr></thead><tbody>" +
        a.table.rows.map(function (r) { return "<tr>" + r.map(function (c, j) { return j === 0 ? '<th scope="row">' + inline(c) + "</th>" : "<td>" + inline(c) + "</td>"; }).join("") + "</tr>"; }).join("") + "</tbody></table></div>";
      if (a.text) body += "<p>" + inline(a.text) + "</p>";
      return "<div><dt>" + (i + 1) + ". " + inline(q.title.en) + "</dt><dd>" + body + "</dd></div>";
    }).join("") + "</dl>");
    if (tn.misconceptions && tn.misconceptions.length) h.push('<h3>Common misunderstandings</h3><ul class="plain">' + tn.misconceptions.map(function (m) {
      return "<li><strong>“" + inline(m.claim) + "”</strong> " + inline(m.response) + "</li>";
    }).join("") + "</ul>");
    h.push('<h3>Key words</h3><ul class="vocab">' + tn.keyWords.map(function (k) { return "<li>" + esc(k) + "</li>"; }).join("") + "</ul>");
    h.push("</section>");

    // Standards
    h.push('<section id="standards" aria-labelledby="std-h"><h2 id="std-h">Standards</h2><div class="table-wrap" tabindex="0" role="region" aria-label="Standards table"><table><caption class="sr-only">Standards this lesson supports</caption><thead><tr><th scope="col">Code</th><th scope="col">Standard</th></tr></thead><tbody>' +
      lesson.standards.map(function (s) { return '<tr><th scope="row" style="white-space:nowrap"><code>' + esc(s.code) + "</code></th><td>" + inline(s.text) + "</td></tr>"; }).join("") +
      "</tbody></table></div>" + (lesson.planMonth ? '<p class="muted">In the ' + esc(lesson.course) + " map plan, this lesson sits in " + esc(lesson.planMonth) + ".</p>" : "") + "</section>");

    // How-to
    h.push('<section id="how-to" aria-labelledby="ht-h"><h2 id="ht-h">How-to videos</h2><p class="prose">Videos on the Support Hub for the tools this lesson uses.</p><div class="howto">' +
      howTo.map(function (x) {
        return '<a class="card" href="' + esc(x.url) + '" target="_blank" rel="noopener"><h3>' + esc(x.title) + newTab + "</h3><p>For: " + esc(x.covers.join(", ")) + "</p></a>";
      }).join("") + "</div></section>");

    // Vera
    var vUrl = MMR.veraUrl(site, lesson);
    if (vUrl) h.push('<section id="vera" aria-labelledby="vera-h"><h2 id="vera-h">Make your own questions with Vera</h2>' +
      '<div class="prose"><p>Vera, the Support Hub\u2019s AI assistant, has this lesson\u2019s map, bookmarks, layers and sources. You can ask it for easier or harder questions, a short quiz, questions for your own state\u2019s standards, or questions in another language.</p>' +
      '<p>Vera\u2019s questions aren\u2019t reviewed like this lesson. Each one should be answerable from the map; if one isn\u2019t, please tell us using Report a problem.</p></div>' +
      '<p><a class="btn primary" href="' + esc(vUrl) + '" target="_blank" rel="noopener">Open Vera with this lesson' + newTab + "</a></p>" +
      '<p class="muted">Vera opens with this lesson named in the message box, ready for you to add what you need before sending. In this mock-up the button opens a lab copy of Vera\u2019s chat page.</p></section>');

    // Report a problem
    h.push('<section id="report" aria-labelledby="rp-h"><h2 id="rp-h">Report a problem</h2><p class="prose">Found a mistake on the map, in the answers or on the student sheet? Tell the MapMaker team. Confirmed problems are listed under Known issues until they’re fixed.</p>' +
      '<p><a class="btn" href="' + esc(MMR.hubUrl(site, site.hub.feedbackPath)) + '" target="_blank" rel="noopener">Report a problem' + newTab + "</a></p>" +
      '<p class="muted">In this mock-up the button opens the Support Hub’s Feedback page. On the Hub version, a Survey123 card on this page would send the lesson’s name with the report.</p></section>');

    h.push("</div></div>");
    $("main").innerHTML = h.join("");

    $("foot").innerHTML = '<div class="wrap"><p>' + inline(lesson.licence) + " Map data: credited to each source in About this map.</p>" +
      '<h2 style="font-size:1rem">About this page</h2>' + versionsTable(site, lesson) +
      "<p>Lesson file: <code>resources/lessons/" + esc(lesson.id) + ".json</code></p></div>";

    wireLesson(site, lesson);
  }

  function card(href, title, text, external) {
    return '<a class="card" href="' + esc(href) + '"' + (external ? ' target="_blank" rel="noopener"' : "") + "><h2>" + esc(title) +
      (external ? '<span class="sr-only"> (opens in a new tab)</span>' : "") + "</h2><p>" + esc(text) + "</p></a>";
  }

  function toolTags(site, tools) {
    return '<ul class="tools" aria-label="MapMaker tools used">' + (tools || []).map(function (k) {
      var t = site.tools[k];
      return '<li><a href="' + esc(MMR.hubUrl(site, "/pages/" + t.howTo)) + '" target="_blank" rel="noopener" title="How-to: ' + esc(t.howToTitle) + '">' + esc(t.label) +
        '<span class="sr-only">, how-to video: ' + esc(t.howToTitle) + ' (opens in a new tab)</span></a></li>';
    }).join("") + "</ul>";
  }

  function sheetPreview(site, lesson, lang, hidden) {
    var T = site.sheetText[lang], blank = function (s) { return esc(MMR.plain(s)).replace(/_{3,}/g, '<span class="blank">&nbsp;</span>'); };
    var title = lang === "en" ? lesson.title : (lesson.sheetTitle && lesson.sheetTitle[lang]) || lesson.title;
    var note = lesson.languages[lang] && lesson.languages[lang].note;
    return '<article class="sheet" id="sheet-' + lang + '" lang="' + lang + '" aria-label="' + esc(T.subtitle + ", " + site.languageNames[lang]) + '"' + (hidden ? " hidden" : "") + ">" +
      "<h3>" + esc(title) + "</h3><p>" + esc(T.name) + ' <span class="blank">&nbsp;</span> &nbsp; ' + esc(T.date) + ' <span class="blank">&nbsp;</span></p>' +
      "<p><strong>" + esc(T.bigQuestion) + "</strong> " + inline(lesson.inquiry.compellingQuestion[lang]) + "</p>" +
      "<p><em>" + esc(T.openMap + " " + lesson.title) + "</em></p><ol>" +
      lesson.inquiry.questions.map(function (q) {
        return "<li><strong>" + inline(q.title[lang]) + "</strong> " + inline(q.student[lang]) + (q.fill ? " " + blank(q.fill[lang]) : "") + "</li>";
      }).join("") + "</ol><p><strong>" + esc(T.yourAnswer) + "</strong> " + inline(lesson.inquiry.final.student[lang]) + "</p>" +
      (note ? '<p class="muted" lang="en">' + esc(note) + "</p>" : "") + "</article>";
  }

  var docxLoading = null;
  function loadDocx() {
    if (window.docx) return Promise.resolve(window.docx);
    if (!docxLoading) docxLoading = new Promise(function (res, rej) {
      var s = document.createElement("script"); s.src = "vendor/docx/docx.iife.js";
      s.onload = function () { window.docx ? res(window.docx) : rej(new Error("Word library didn't load.")); };
      s.onerror = function () { rej(new Error("Word library didn't load.")); };
      document.head.appendChild(s);
    });
    return docxLoading;
  }

  function wireLesson(site, lesson) {
    document.querySelectorAll(".toggle [data-lang]").forEach(function (b) {
      b.addEventListener("click", function () {
        var lang = b.getAttribute("data-lang");
        document.querySelectorAll(".toggle [data-lang]").forEach(function (o) { o.setAttribute("aria-pressed", String(o === b)); });
        document.querySelectorAll("article.sheet").forEach(function (a) { a.hidden = a.id !== "sheet-" + lang; });
      });
    });
    var st = $("dl-status");
    document.querySelectorAll("[data-download]").forEach(function (b) {
      b.addEventListener("click", function () {
        var lang = b.getAttribute("data-download");
        b.disabled = true; st.textContent = "Making the Word file…";
        loadDocx().then(function (D) {
          return D.Packer.toBlob(window.MMRSheet.build(D, site, lesson, lang));
        }).then(function (blob) {
          var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = window.MMRSheet.fileName(lesson, lang);
          document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
          st.textContent = "Downloaded " + a.download + ".";
        }).catch(function (e) { st.textContent = "The Word file couldn't be made: " + e.message; })
          .then(function () { b.disabled = false; });
      });
    });
  }

  /* ---------------- Catalogue ---------------- */
  var MONTHS = ["August", "September", "October", "November", "December", "January", "February", "March", "April", "May", "June", "July"];
  function renderCatalogue(site, lessons, ready) {
    lessons = lessons.slice().sort(function (a, b) {
      var ma = MONTHS.indexOf(a.planMonth), mb = MONTHS.indexOf(b.planMonth);
      return (ma < 0 ? 99 : ma) - (mb < 0 ? 99 : mb) || a.title.localeCompare(b.title);
    });
    var courses = lessons.map(function (l) { return l.course; }).filter(function (v, i, a) { return a.indexOf(v) === i; });
    var h = ['<div class="hero"><div class="wrap"><h1>Lessons</h1><p class="summary">Each lesson below is drawn from one file in <code>resources/lessons</code>. Add or edit a file, and its page, Word sheets and entry in Vera\u2019s knowledge file update together.</p></div></div>'];
    h.push('<div class="wrap" style="padding-block:1.5rem 4rem;display:grid;gap:1rem">');
    if (courses.length > 1) h.push('<p><label for="course">Course </label><select id="course"><option value="">All courses</option>' +
      courses.map(function (c) { return "<option>" + esc(c) + "</option>"; }).join("") + "</select></p>");
    h.push('<div class="cards" id="list" style="padding-top:0">' + lessons.map(function (l) {
      return '<div class="card" data-course="' + esc(l.course) + '"><p class="muted" style="font-size:.8rem;text-transform:uppercase;letter-spacing:.07em;font-weight:700">' + esc(l.planMonth || "") + "</p>" +
        '<h2><a href="lesson.html?id=' + encodeURIComponent(l.id) + '">' + esc(l.title) + "</a></h2><p>" +
        esc(l.course + " · Grade " + l.grade + " · " + l.unit) + '</p><p><span class="chip ' + esc(l.status) + '">' + esc(l.status === "draft" ? "Draft" : l.status === "reviewed" ? "Reviewed" : "Published") + "</span>" +
        ' <a href="hub-preview.html?page=' + encodeURIComponent(l.id) + '">Hub version</a></p></div>';
    }).join("") + "</div>");
    h.push('<p><a href="hub-preview.html?page=' + encodeURIComponent((site.hubDemo && site.hubDemo.lessonsSlug) || "lessons") + '">See these lessons as Hub pages (preview)</a></p>');
    h.push('<section class="team" aria-labelledby="team-h"><h2 id="team-h">For the MapMaker team</h2><p class="prose">Vera\u2019s knowledge file is made from every lesson file that passes the checker (' + ready.length + " of " + lessons.length + '). Upload it in Copilot Studio under Knowledge, wait for it to finish indexing, then delete the old copy.</p>' +
      '<div class="sheet-tools"><button type="button" class="btn" id="vera-file">Download Vera knowledge file</button><p class="status-msg" id="vera-status" role="status" aria-live="polite"></p></div></section>');
    h.push("</div>");
    $("main").innerHTML = h.join("");
    $("vera-file").addEventListener("click", function () {
      var blob = new Blob([MMR.veraFile(site, ready, new Date().toISOString().slice(0, 10))], { type: "text/plain;charset=utf-8" });
      var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = MMR.veraFileName();
      document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
      $("vera-status").textContent = "Downloaded " + a.download + " with " + ready.length + " lesson" + (ready.length === 1 ? "" : "s") + ".";
    });
    $("foot").innerHTML = '<div class="wrap"><h2 style="font-size:1rem">About these pages</h2>' + versionsTable(site, null) + "</div>";
    var sel = $("course");
    if (sel) sel.addEventListener("change", function () {
      document.querySelectorAll("#list .card").forEach(function (c) { c.hidden = !!sel.value && c.getAttribute("data-course") !== sel.value; });
    });
  }

  /* ---------------- Start ---------------- */
  var isCatalogue = document.body.getAttribute("data-page") === "catalogue";
  getJSON("site.json").then(function (site) {
    header(site);
    if (isCatalogue) {
      return getJSON("lessons/index.json").then(function (idx) {
        return Promise.all(idx.lessons.map(function (id) { return getJSON("lessons/" + id + ".json").catch(function (e) { return { _error: e.message, id: id }; }); }));
      }).then(function (all) {
        var bad = all.filter(function (l) { return l._error; }).map(function (l) { return l._error; }), ready = [];
        all.filter(function (l) { return !l._error; }).forEach(function (l) {
          var p = MMR.check(site, l, l.id + ".json");
          p.forEach(function (x) { bad.push(l.id + ": " + x); });
          if (!p.length) ready.push(l);
        });
        showProblems(bad, "The checker found problems in these lesson files:");
        renderCatalogue(site, all.filter(function (l) { return !l._error; }), ready);
      });
    }
    var id = new URLSearchParams(location.search).get("id") || "";
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(id)) {
      $("main").innerHTML = '<div class="wrap" style="padding-block:2rem;display:grid;gap:.75rem"><h1>No lesson chosen</h1><p><a href="./">See all lessons</a></p></div>';
      return;
    }
    return getJSON("lessons/" + id + ".json").then(function (lesson) {
      var problems = MMR.check(site, lesson, id + ".json");
      showProblems(problems, "The checker found problems in this lesson file. Fix them before publishing:");
      try { renderLesson(site, lesson); }
      catch (e) { $("main").innerHTML = '<p class="wrap" style="padding-block:2rem">This lesson file can’t be shown yet. See the problems listed above.</p>'; }
    });
  }).catch(function (e) {
    $("main").innerHTML = '<div class="wrap" style="padding-block:2rem;display:grid;gap:.75rem"><h1>This page couldn’t load</h1><p>' + esc(e.message) +
      '</p><p><a href="./">See all lessons</a></p></div>';
  });
})();
