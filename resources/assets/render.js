/* Lesson resource pages (lab): page renderer v3.5 (teacher view with the answers, no answers on the lesson view; lessons grouped by unit;
   standards in the hero; an AI assistant link and a copyable AI prompt). Draws a lesson page, its teacher page (?view=teacher) or the catalogue
   from JSON files. Settings: site.json merged with the lessons settings file (?lessons=<name>, or the default in site.json). */
(function () {
  "use strict";
  var MMR = window.MMR, esc = MMR.esc, inline = MMR.inline;
  var $ = function (id) { return document.getElementById(id); };
  /* Links between the lab pages keep ?lessons=<name>, so the whole visit uses the same lessons settings. */
  var LS = (function () { var v = new URLSearchParams(location.search).get("lessons"); return v && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(v) ? v : ""; })();
  function keep(href) { return LS ? href + (href.indexOf("?") < 0 ? "?" : "&") + "lessons=" + encodeURIComponent(LS) : href; }

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
      '<nav aria-label="' + esc(MMR.names(site).hubShort || hub.name) + '"><ul>' + hub.nav.map(function (n) {
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
    if (lesson) rows.push(["This lesson's content", lesson.contentVersion]);
    return '<div class="table-wrap" style="border-color:#333"><table><caption class="sr-only">Versions</caption><thead><tr><th scope="col">Part</th><th scope="col">Version</th></tr></thead><tbody>' +
      rows.map(function (r) { return '<tr><th scope="row">' + esc(r[0]) + "</th><td>" + esc(r[1]) + "</td></tr>"; }).join("") + "</tbody></table></div>";
  }

  /* ---------------- Lesson page ---------------- */
  function standardsTable(site, lesson) {
    return '<div class="table-wrap" tabindex="0" role="region" aria-label="Standards table"><table><caption class="sr-only">Standards this lesson supports</caption><thead><tr><th scope="col">Code</th><th scope="col">Framework</th><th scope="col">Standard</th></tr></thead><tbody>' +
      MMR.sortStandards(site, lesson.standards).map(function (st) { return '<tr><th scope="row" style="white-space:nowrap"><code>' + esc(st.code) + "</code></th><td>" + esc(MMR.standardLabel(site, MMR.standardPrefix(st.code))) + "</td><td>" + inline(st.text) + "</td></tr>"; }).join("") +
      '</tbody></table></div><p class="muted">National frameworks first, then state examples. For your own state’s standards, ' + (MMR.assistant(site) ? "ask " + esc(MMR.assistant(site).name) + " or " : "") + 'use the prompt under Make your own questions.</p>';
  }
  function facts(site, lesson) {
    return '<dl class="facts"><div><dt>Grade</dt><dd>' + esc(lesson.grade) + "</dd></div><div><dt>Time</dt><dd>" + esc(lesson.time) +
      "</dd></div><div><dt>Topic</dt><dd>" + esc(lesson.unit) + ((lesson.alsoFits || []).length ? ' <span class="muted">(also fits: ' + lesson.alsoFits.map(esc).join("; ") + ")</span>" : "") +
      "</dd></div><div><dt>Student login</dt><dd>" + esc(lesson.studentLogin) + "</dd></div><div><dt>Standards</dt><dd>" +
      MMR.sortStandards(site, lesson.standards).map(function (st) { return "<code>" + esc(st.code) + "</code>"; }).join(" · ") + "</dd></div></dl>";
  }
  function renderLesson(site, lesson, view) {
    var teacherView = view === "teacher";
    document.title = (teacherView ? "Teacher notes: " : "") + lesson.title + " – " + site.hub.name + " (lab)";
    var hubLink = $("hub-link");
    if (hubLink) hubLink.href = keep("hub-preview.html?page=" + encodeURIComponent(lesson.id + (teacherView ? "-teacher" : "")));
    var mmUrl = MMR.atlasUrl(site, lesson.map.webmapId), N = MMR.names(site), app = N.app;
    // Share to Google Classroom shares the map, never a page. Left out if switched off. One button, in Student activity.
    var gcShare = MMR.classroomShareUrl(site, mmUrl), gcSet = site.classroom || {};
    var gc = gcShare ? '<a class="btn gc" href="' + esc(gcShare) + '" target="_blank" rel="noopener"><img src="' + esc(gcSet.icon) + '" alt="" width="32" height="32">' +
      esc(gcSet.label || "Share to Google Classroom") + '<span class="sr-only"> (opens in a new tab)</span></a>' : "";
    var langs = Object.keys(lesson.languages);
    var courseUrl = site.hub.coursePaths[lesson.course] ? MMR.hubUrl(site, site.hub.coursePaths[lesson.course]) : null;
    var subjectUrl = site.hub.subjectPaths[lesson.subject] ? MMR.hubUrl(site, site.hub.subjectPaths[lesson.subject]) : null;
    var howTo = MMR.howToLinks(site, lesson);
    var mapIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z"/><path d="M9 4v14M15 6v14"/></svg>';
    var newTab = '<span class="sr-only"> (opens in a new tab)</span>';
    var teacherHref = keep("lesson.html?id=" + encodeURIComponent(lesson.id) + "&view=teacher"), lessonHref = keep("lesson.html?id=" + encodeURIComponent(lesson.id));
    var inq = lesson.inquiry, tn = lesson.teacherNotes;
    var h = [];

    h.push('<div class="hero"><div class="wrap">');
    h.push('<nav class="crumbs" aria-label="Breadcrumb"><ol><li><a href="' + esc(MMR.hubUrl(site, "/pages/lessons")) + '">Lessons</a></li>' +
      (subjectUrl ? '<li><a href="' + esc(subjectUrl) + '">' + esc(lesson.subject) + "</a></li>" : "<li>" + esc(lesson.subject) + "</li>") +
      (courseUrl ? '<li><a href="' + esc(courseUrl) + '">' + esc(lesson.course) + "</a></li>" : "<li>" + esc(lesson.course) + "</li>") +
      (teacherView ? '<li><a href="' + lessonHref + '">' + esc(lesson.title) + "</a></li>" : "<li>" + esc(lesson.unit) + "</li>") + "</ol></nav>");
    h.push('<h1 id="lesson-title">' + (teacherView ? "Answer notes: " : "") + esc(lesson.title) + "</h1>");
    var pic = MMR.mapImage(site, lesson);
    if (teacherView) h.push('<p class="notice"><strong>For teachers.</strong> This page holds the answers and what to accept. With students, share the lesson page or the map, not this page.</p>');
    else h.push('<div class="herogrid"><div><p class="summary">' + inline(lesson.summary) + "</p></div>" + (pic ? '<a class="pic" href="' + esc(mmUrl) + '" target="_blank" rel="noopener"><span class="sr-only">' + esc(N.openInApp) + ': </span><img src="' + esc(pic.url) + '" alt="' + esc(pic.alt) + '" width="' + pic.width + '" height="' + pic.height + '"><span class="muted">' + (pic.own ? "The map as it opens." : "Map preview; open it" + esc(N.inApp) + " to explore.") + newTab + "</span></a>" : "") + "</div>");
    h.push(facts(site, lesson));
    if (teacherView) {
      h.push('<div class="actions"><a class="btn primary" href="' + esc(mmUrl) + '" target="_blank" rel="noopener">' + mapIcon + esc(N.openInApp) + newTab + "</a>" +
        '<a class="btn" href="' + lessonHref + '">Lesson page</a><button type="button" class="btn" data-download="teacher">Download Word (teacher notes)</button></div><p class="status-msg" id="dl-status" role="status" aria-live="polite"></p>');
    } else {
    }
    h.push("</div></div>");

    if (teacherView) {
      h.push('<div class="wrap layout"><nav class="toc" aria-labelledby="toc-h"><h2 id="toc-h">On this page</h2><ol>' +
        [["before", "Before class"], ["answers", "Answer notes"], ["misunderstandings", "Common misunderstandings"], ["words", "Key words"], ["standards", "Standards"]]
          .map(function (t) { return '<li><a href="#' + t[0] + '">' + t[1] + "</a></li>"; }).join("") + '</ol></nav><div class="content">');
      h.push('<section id="before" aria-labelledby="bc-h"><h2 id="bc-h">Before class</h2><div class="prose"><p>' + inline(tn.beforeClass) + "</p></div></section>");
      h.push('<section id="answers" aria-labelledby="an-h"><h2 id="an-h">Answer notes</h2><div class="cq"><span class="label">Compelling question</span><p class="q">' + inline(inq.compellingQuestion.en) + "</p></div>" +
        '<dl class="answers">' + inq.questions.map(function (q, i) {
          var a = q.answer || {}, body = '<p class="muted">' + inline(q.task) + "</p>";
          if (a.where) body += "<p><strong>Where to find it on the map:</strong> " + inline(a.where) + "</p>";
          if (a.accept) body += "<p><strong>Accept answers that:</strong> " + inline(a.accept) + "</p>";
          if (a.table) body += '<p><strong>Answer key:</strong> ' + esc(a.table.caption || "") + '</p><div class="table-wrap" tabindex="0" role="region" aria-label="' + esc(a.table.caption || "Answer table") + '"><table><caption class="sr-only">' + esc(a.table.caption || "") + "</caption><thead><tr>" +
            a.table.columns.map(function (c) { return '<th scope="col">' + esc(c) + "</th>"; }).join("") + "</tr></thead><tbody>" +
            a.table.rows.map(function (r) { return "<tr>" + r.map(function (c, j) { return j === 0 ? '<th scope="row">' + inline(c) + "</th>" : "<td>" + inline(c) + "</td>"; }).join("") + "</tr>"; }).join("") + "</tbody></table></div>";
          if (a.text) body += "<p><strong>Notes:</strong> " + inline(a.text) + "</p>";
          return "<div><dt>" + (i + 1) + ". " + inline(q.title.en) + "</dt><dd>" + body + "</dd></div>";
        }).join("") + "</dl>" +
        '<div class="prose"><h3>Answering the compelling question</h3><p>' + inline(inq.final.teacher) + "</p></div></section>");
      if (lesson.assessment && site.rubric && site.rubric.criteria) {
        var R = site.rubric;
        h.push('<section id="assess" aria-labelledby="as-h"><h2 id="as-h">Assessing the answer</h2><p class="prose">One way to assess the answer to the compelling question: the rubric every lesson shares (four criteria, four levels), with this lesson’s own line on what counts as map evidence, and a model answer at the top level. Use it as it is, adapt it, or use your own.</p>' +
          '<p class="prose"><strong>Map evidence in this lesson:</strong> ' + inline(lesson.assessment.evidence) + "</p>" +
          '<div class="tablewrap"><table><caption>Rubric</caption><thead><tr><th scope="col">Criterion</th>' + R.levels.map(function (l) { return '<th scope="col">' + esc(l) + "</th>"; }).join("") + "</tr></thead><tbody>" +
          R.criteria.map(function (c) { return '<tr><th scope="row">' + esc(c.name) + "</th>" + c.descriptors.map(function (d) { return "<td>" + inline(d) + "</td>"; }).join("") + "</tr>"; }).join("") + "</tbody></table></div>" +
          '<h3>A model answer (level 4)</h3><div class="prose exemplar">' + inline(lesson.assessment.exemplar).split(/\n\n+/).map(function (x) { return "<p>" + x + "</p>"; }).join("") + "</div></section>");
      }
      h.push('<section id="misunderstandings" aria-labelledby="mu-h"><h2 id="mu-h">Common misunderstandings</h2>' + (tn.misconceptions && tn.misconceptions.length ? '<ul class="plain">' + tn.misconceptions.map(function (m) {
        return "<li><strong>“" + inline(m.claim) + "”</strong> " + inline(m.response) + "</li>";
      }).join("") + "</ul>" : "<p>None listed.</p>") + "</section>");
      h.push('<section id="words" aria-labelledby="kw-h"><h2 id="kw-h">Key words</h2><ul class="vocab">' + tn.keyWords.map(function (k) { return "<li>" + esc(k) + "</li>"; }).join("") + "</ul></section>");
      h.push('<section id="standards" aria-labelledby="std-h"><h2 id="std-h">Standards</h2>' + standardsTable(site, lesson) + "</section>");
      h.push("</div></div>");
      $("main").innerHTML = h.join("");
      $("foot").innerHTML = '<div class="wrap"><p>' + inline(MMR.licence(site, lesson)) + '</p><h2 style="font-size:1rem">About this page</h2>' + versionsTable(site, lesson) +
        "<p>Lesson file: <code>resources/lessons/" + esc(lesson.id) + ".json</code></p></div>";
      wireLesson(site, lesson);
      return;
    }

    h.push('<div class="wrap"><div class="cards">' +
      card(mmUrl, app ? app + " map" : "The map", "Open the map students use, with its layers and bookmarks. No login needed.", true) +
      card("#student-activity", "Student activity", "Questions to work through on the map. Word download in " + langs.map(function (l) { return site.languageNames[l]; }).join(" and ") + ".") +

      card("#how-to", "How-to videos", "Short videos for the " + N.appTools + " this lesson uses.") +
      "</div></div>");

    h.push('<div class="wrap layout"><nav class="toc" aria-labelledby="toc-h"><h2 id="toc-h">On this page</h2><ol>' +
      [["inquiry", "Inquiry"], ["standards", "Standards"], ["student-activity", "Student activity"], ["teacher-notes", "Teacher notes"], ["about", "About this map"],
       ["how-to", "How-to videos"], ["own", "Make your own questions"], ["report", "Report a problem"]]
        .map(function (t) { return '<li><a href="#' + t[0] + '">' + t[1] + "</a></li>"; }).join("") + '</ol></nav><div class="content">');

    // Inquiry
    h.push('<section id="inquiry" aria-labelledby="inquiry-h"><h2 id="inquiry-h">Inquiry</h2>');
    h.push('<div class="cq"><span class="label">Compelling question</span><p class="q">' + inline(inq.compellingQuestion.en) + "</p></div>");
    h.push('<p class="prose">Pick the questions that suit your class. Each one is answered from the map and lists the ' + esc(N.appTools) + ' it uses. Answers and what to accept are linked under Teacher notes.</p>');
    h.push('<ol class="sq">' + inq.questions.map(function (q) {
      return "<li><h3>" + inline(q.title.en) + (q.core ? ' <span class="chip core">If you only do one</span>' : "") + (q.minutes ? ' <span class="chip">About ' + q.minutes + " minutes</span>" : "") + "</h3><p>" + inline(q.task) + "</p>" +
        ((q.frontOfClass || []).length ? '<p class="label">From the front</p><ol class="steps">' + q.frontOfClass.map(function (st) { return "<li>" + inline(st) + "</li>"; }).join("") + "</ol>" : "") + toolTags(site, q.tools) + "</li>";
    }).join("") + "</ol>");
    h.push('<div class="prose"><h3>Answering the compelling question</h3><p>' + inline(inq.final.teacher) + "</p>" + toolTags(site, inq.final.tools) + "</div>");
    h.push("</section>");

    // Standards
    h.push('<section id="standards" aria-labelledby="std-h"><h2 id="std-h">Standards</h2>' + standardsTable(site, lesson) + "</section>");

    // Student activity
    h.push('<section id="student-activity" aria-labelledby="sa-h"><h2 id="sa-h">Student activity</h2>');
    h.push('<p class="prose">This is what students see on the Word sheet. To edit it, download it and upload it to Google Drive (it opens in Google Docs) or open it in Word. Students need no account or login.</p>');
    h.push('<div class="sheet-tools">' + (langs.length > 1 ? '<div class="toggle" role="group" aria-label="Sheet language">' + langs.map(function (l, i) {
      return '<button type="button" data-lang="' + l + '" aria-pressed="' + (i === 0) + '">' + esc(site.languageNames[l]) + "</button>";
    }).join("") + "</div>" : "") + langs.map(function (l) {
      return '<button type="button" class="btn" data-download="' + l + '">Download Word (' + esc(site.languageNames[l]) + ")</button>";
    }).join("") + '<p class="status-msg" id="dl-status" role="status" aria-live="polite"></p></div>');
    if (gc) h.push('<p class="muted">The Share to Google Classroom button at the top of the page shares the ' + esc(N.appMap) + ' with a class, not the sheet. To assign the sheet, attach your Drive copy in Classroom and choose Make a copy for each student.</p>');
    langs.forEach(function (l, i) { h.push(sheetPreview(site, lesson, l, i > 0)); });
    h.push("</section>");

    // Teacher notes (everything except the answers, which are on the teacher view)
    var teach = site.teaching || {};
    h.push('<section id="teacher-notes" aria-labelledby="tn-h"><h2 id="tn-h">Teacher notes</h2>' +
      '<div class="prose"><p><strong>Subjects:</strong> ' + (lesson.subjects || []).map(esc).join(", ") + ". <strong>Grade:</strong> " + esc(lesson.grade) + ". <strong>Time:</strong> " + esc(lesson.time) + "</p>" +
      "<h3>Learning objectives</h3><p>Students will:</p><ul>" + (lesson.objectives || []).map(function (o) { return "<li>" + inline(o) + "</li>"; }).join("") + "</ul></div>" +
      '<h3>Map skills</h3><ul class="vocab">' + MMR.skills(site, lesson).map(function (k) { return "<li>" + esc(k) + "</li>"; }).join("") + "</ul>" +
      '<h3>Ways to run this lesson</h3><ul class="vocab">' + MMR.instructionalModels(site, lesson).map(function (k) { return "<li>" + esc(k) + "</li>"; }).join("") + "</ul>" +
      (teach.materials ? '<div class="prose"><h3>Materials</h3><p>' + esc(teach.materials) + "</p></div>" : "") +
      '<div class="prose"><h3>Before class</h3><p><strong>About this map:</strong> ' + inline(tn.beforeClass) + "</p>" + ((teach.prep || []).length ? "<ul>" + teach.prep.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>" : "") + "</div>" +
      ((lesson.discussion || []).length ? '<div class="prose"><h3>Discussion questions</h3><ol>' + lesson.discussion.map(function (q) { return "<li>" + inline(q) + "</li>"; }).join("") + "</ol></div>" : "") +
      (lesson.differentiation ? '<div class="prose"><h3>Support and stretch</h3><ul><li><strong>Support:</strong> ' + inline(lesson.differentiation.support) + "</li><li><strong>Stretch:</strong> " + inline(lesson.differentiation.stretch) + "</li></ul></div>" : "") +
      (tn.misconceptions && tn.misconceptions.length ? '<h3>Common misunderstandings</h3><ul class="plain">' + tn.misconceptions.map(function (m) {
        return "<li><strong>\u201c" + inline(m.claim) + "\u201d</strong> " + inline(m.response) + "</li>";
      }).join("") + "</ul>" : "") +
      '<h3>Key words</h3><ul class="vocab">' + tn.keyWords.map(function (k) { return "<li>" + esc(k) + "</li>"; }).join("") + "</ul>" +
      ((lesson.resources || []).length ? '<div class="prose"><h3>Further reading</h3><ul>' + lesson.resources.map(function (r) { return '<li><a href="' + esc(r.url) + '" target="_blank" rel="noopener">' + esc(r.title) + newTab + "</a>" + (r.source ? ' <span class="muted">(' + esc(r.source) + ")</span>" : "") + "</li>"; }).join("") + "</ul></div>" : "") +
      '<div class="prose"><h3>Answers</h3><p>Where to find each answer on the map and what to accept are kept off this page, so it can be shared with students: <a href="' + teacherHref + '">answer notes</a> (web page) or <button type="button" class="btn" data-download="teacher">Download Word (teacher notes)</button></p></div></section>');

    // About this map: an overview of the whole map (map.about), then each layer and its source; after the teacher notes.
    h.push('<section id="about" aria-labelledby="about-h"><h2 id="about-h">About this map</h2>' + (lesson.map.about ? '<p class="prose">' + inline(lesson.map.about) + "</p>" : ""));
    h.push('<p class="prose">Each layer names its source, so you can check where the information comes from.</p>');
    h.push('<div class="table-wrap" tabindex="0" role="region" aria-label="Map layers and sources"><table><caption class="sr-only">Map layers and sources</caption><thead><tr><th scope="col">Layer</th><th scope="col">What it shows</th><th scope="col">Source</th></tr></thead><tbody>' +
      lesson.map.layers.map(function (l) {
        return '<tr><th scope="row">' + esc(l.name) + (l.offAtStart ? ' <span class="muted">(off at start)</span>' : "") + "</th><td>" + inline(l.shows) + "</td><td>" + inline(l.source) + "</td></tr>";
      }).join("") + "</tbody></table></div>");
    h.push("<p><strong>Bookmarks:</strong> " + ((lesson.map.bookmarks || []).length ? lesson.map.bookmarks.map(esc).join("; ") : "none") + ".</p>");
    var issues = lesson.knownIssues || [];
    h.push('<div class="issues"><h3>Things to know about this map</h3>' + (issues.length ? "<ul>" + issues.map(function (k) {
      return '<li><span class="chip ' + esc(k.status) + '">' + (k.status === "fixed" ? "Fixed " : "Open ") + esc(k.date) + "</span> <strong>" + esc(k.where) + ":</strong> " + inline(k.note) + "</li>";
    }).join("") + "</ul>" : "<p>Nothing to report.</p>") + "</div>");
    h.push("</section>");


    // How-to
    h.push('<section id="how-to" aria-labelledby="ht-h"><h2 id="ht-h">How-to videos</h2><p class="prose">Videos on the ' + esc(N.hubShort || site.hub.name) + ' for the tools this lesson uses.</p><div class="howto">' +
      howTo.map(function (x) {
        return '<a class="card" href="' + esc(x.url) + '" target="_blank" rel="noopener"><h3>' + esc(x.title) + newTab + "</h3><p>For: " + esc(x.covers.join(", ")) + "</p></a>";
      }).join("") + "</div></section>");

    // Make your own questions: an AI assistant link (if any) and a copyable prompt for the teacher's own AI tool
    var A = MMR.assistant(site), vUrl = MMR.assistantUrl(site, lesson), ai = site.aiPrompt || {};
    h.push('<section id="own" aria-labelledby="own-h"><h2 id="own-h">Make your own questions</h2>' +
      (vUrl ? "<h3>Ask " + esc(A.name) + '</h3><div class="prose"><p>' + esc(A.about || A.name) + ", has this lesson’s map, bookmarks, layers and questions, but not the answers. Open " + esc(A.object || "it") + " with this lesson already named, then ask for easier or harder questions, a short quiz, questions for your own state’s standards, or questions in another language.</p></div>" +
        '<p><a class="btn" href="' + esc(vUrl) + '" target="_blank" rel="noopener">Ask ' + esc(A.name) + " about this lesson" + newTab + "</a></p>" : "") +
      "<h3>" + esc(ai.label || "Prompt for your own AI") + '</h3><div class="prose"><p>If your school uses a different AI tool, copy the prompt and paste it in, then add what you want. It lists this map’s layers, pop-ups and bookmarks and tells the tool not to invent any, so its questions stay answerable ' + (app ? "in " + esc(app) : "on the map") + ".</p></div>" +
      '<div class="sheet-tools"><button type="button" class="btn" id="copy-prompt">Copy the prompt</button><p class="status-msg" id="copy-status" role="status" aria-live="polite"></p></div>' +
      '<pre class="prompt" id="prompt-text" tabindex="0" aria-label="Prompt for your own AI">' + esc(MMR.aiPrompt(site, lesson)) + "</pre>" +
      '<p class="muted">Questions from ' + (vUrl ? esc(A.name) + " or another AI tool" : "an AI tool") + ' aren’t reviewed like this lesson. Each one should be answerable from the map; if one isn’t, please tell us using Report a problem.</p></section>');

    // Report a problem
    h.push('<section id="report" aria-labelledby="rp-h"><h2 id="rp-h">Report a problem</h2><p class="prose">Found a mistake on the map, in the questions or on the student sheet? Tell ' + esc(N.team || "us") + '. Confirmed problems are listed under Things to know about this map until they’re fixed.</p>' +
      '<p><a class="btn" href="' + esc(MMR.feedbackUrl(site, lesson)) + '" target="_blank" rel="noopener">Report a problem' + newTab + "</a></p>" +
      '<p class="muted">In this mock-up the button opens the ' + esc(N.hubShort || site.hub.name) + '’s Feedback page. On the Hub version, a Survey123 card on this page would send the lesson’s name with the report.</p></section>');

    h.push("</div></div>");
    $("main").innerHTML = h.join("");

    $("foot").innerHTML = '<div class="wrap"><p>' + inline(MMR.licence(site, lesson)) + " Map data: credited to each source in About this map.</p>" +
      (gc ? "<p>" + esc(gcSet.notice || "Google Classroom is a trademark of Google LLC.") + ' Use of this trademark is subject to <a href="' +
        esc(gcSet.permissionsUrl || "https://www.google.com/permissions/") + '" target="_blank" rel="noopener">Google Brand Permissions<span class="sr-only"> (opens in a new tab)</span></a>.</p>' : "") +
      '<h2 style="font-size:1rem">About this page</h2>' + versionsTable(site, lesson) +
      "<p>Lesson file: <code>resources/lessons/" + esc(lesson.id) + ".json</code></p></div>";

    wireLesson(site, lesson);
  }

  function card(href, title, text, external) {
    return '<a class="card" href="' + esc(href) + '"' + (external ? ' target="_blank" rel="noopener"' : "") + "><h2>" + esc(title) +
      (external ? '<span class="sr-only"> (opens in a new tab)</span>' : "") + "</h2><p>" + esc(text) + "</p></a>";
  }

  function toolTags(site, tools) {
    return '<ul class="tools" aria-label="' + esc(MMR.appName(site) || "Map") + ' tools used">' + (tools || []).map(function (k) {
      var t = site.tools[k];
      return '<li><a href="' + esc(MMR.hubUrl(site, "/pages/" + t.howTo)) + '" target="_blank" rel="noopener" title="How-to: ' + esc(t.howToTitle) + '">' + esc(t.label) +
        '<span class="sr-only">, how-to video: ' + esc(t.howToTitle) + ' (opens in a new tab)</span></a></li>';
    }).join("") + "</ul>";
  }

  /* The extra sections a lesson's studentSupport adds to the sheet (two-page sheet), as on the Word file. */
  function supportTop(site, lesson, lang) {
    var S = lesson.studentSupport, T = site.sheetText[lang];
    if (!S) return "";
    return (S.beforeYouStart ? "<h4>" + esc(T.beforeYouStart) + "</h4><p>" + inline(S.beforeYouStart[lang]) + "</p>" : "") +
      (S.readingTheMap ? "<h4>" + esc(T.readingTheMap) + "</h4><p>" + inline(S.readingTheMap[lang]) + "</p>" : "") +
      (S.tips || []).map(function (k) { return '<p class="tip"><strong>' + esc(T.tip) + "</strong> " + esc(T.tips[k]) + "</p>"; }).join("") +
      "<h4>" + esc(T.questions) + "</h4>";
  }
  function sheetPreview(site, lesson, lang, hidden) {
    var S = lesson.studentSupport, T = site.sheetText[lang], blank = function (s) { return esc(MMR.plain(s)).replace(/_{3,}/g, '<span class="blank">&nbsp;</span>'); };
    var title = lang === "en" ? lesson.title : (lesson.sheetTitle && lesson.sheetTitle[lang]) || lesson.title;
    var note = lesson.languages[lang] && lesson.languages[lang].note;
    return '<article class="sheet" id="sheet-' + lang + '" lang="' + lang + '" aria-label="' + esc(T.subtitle + ", " + site.languageNames[lang]) + '"' + (hidden ? " hidden" : "") + ">" +
      "<h3>" + esc(title) + "</h3><p>" + esc(T.name) + ' <span class="blank">&nbsp;</span> &nbsp; ' + esc(T.date) + ' <span class="blank">&nbsp;</span></p>' +
      "<p><strong>" + esc(T.bigQuestion) + "</strong> " + inline(lesson.inquiry.compellingQuestion[lang]) + "</p>" +
      "<p><em>" + esc(T.openMap + " " + lesson.title) + "</em></p>" + supportTop(site, lesson, lang) + "<ol>" +
      lesson.inquiry.questions.map(function (q) {
        return "<li><strong>" + inline(q.title[lang]) + '</strong><p class="sheetlabel">' + esc(T.onTheMap || "On the map:") + '</p><ol class="sheetsteps">' + (q.steps || []).map(function (st) { return "<li>" + inline(st[lang]) + "</li>"; }).join("") + "</ol>" +
          '<p><span class="sheetlabel">' + esc(T.answer || "Answer:") + "</span> " + inline(q.ask[lang]) + (q.fill ? " " + blank(q.fill[lang]) : "") + "</p></li>";
      }).join("") + "</ol><p><strong>" + esc(T.yourAnswer) + "</strong> " + inline(lesson.inquiry.final.student[lang]) + "</p>" +
      (S && S.reflection ? "<h4>" + esc(T.lookingBack) + "</h4><p>" + inline(S.reflection[lang]) + "</p>" : "") +
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
          return D.Packer.toBlob(lang === "teacher" ? window.MMRSheet.buildTeacher(D, site, lesson) : window.MMRSheet.build(D, site, lesson, lang));
        }).then(function (blob) {
          var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = lang === "teacher" ? window.MMRSheet.teacherFileName(lesson) : window.MMRSheet.fileName(lesson, lang);
          document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
          st.textContent = "Downloaded " + a.download + ".";
        }).catch(function (e) { st.textContent = "The Word file couldn't be made: " + e.message; })
          .then(function () { b.disabled = false; });
      });
    });
    var cp = $("copy-prompt");
    if (cp) cp.addEventListener("click", function () {
      var text = $("prompt-text").textContent, st2 = $("copy-status");
      (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject(new Error("no clipboard")))
        .then(function () { st2.textContent = "Copied. Paste it into your AI tool, then add what you want."; })
        .catch(function () { st2.textContent = "Couldn\u2019t copy automatically: select the text in the box and copy it."; });
    });
  }

  /* ---------------- Catalogue: grouped by unit, in the order the course is taught ---------------- */
  function renderCatalogue(site, lessons, ready) {
    lessons = lessons.slice().sort(function (a, b) {
      return a.course.localeCompare(b.course) || MMR.unitIndex(site, a) - MMR.unitIndex(site, b) || a.title.localeCompare(b.title);
    });
    var courses = lessons.map(function (l) { return l.course; }).filter(function (v, i, a) { return a.indexOf(v) === i; });
    var A = MMR.assistant(site), N = MMR.names(site), kf = MMR.assistantFileName(site);
    document.title = "Lessons – " + site.app.name;
    var h = ['<div class="hero"><div class="wrap"><h1>Lessons</h1><p class="summary">Lessons by topic, in the order most courses teach them. Each one is drawn from one file in <code>resources/lessons</code>: its page, teacher page, Word files, ' + (A ? esc(A.name) + " entry " : "") + 'and AI prompt update together. No account or login is needed.</p></div></div>'];
    h.push('<div class="wrap" style="padding-block:1.5rem 4rem;display:grid;gap:1rem">');
    if (courses.length > 1) h.push('<p><label for="course">Course </label><select id="course"><option value="">All courses</option>' +
      courses.map(function (c) { return "<option>" + esc(c) + "</option>"; }).join("") + "</select></p>");
    h.push('<div id="list">');
    courses.forEach(function (course) {
      var units = MMR.unitList(site, course), inCourse = lessons.filter(function (l) { return l.course === course; });
      var groups = units.filter(function (u) { return inCourse.some(function (l) { return l.unit === u; }); });
      var other = inCourse.filter(function (l) { return units.indexOf(l.unit) < 0; });
      if (other.length) groups.push("Other");
      groups.forEach(function (u) {
        var these = u === "Other" ? other : inCourse.filter(function (l) { return l.unit === u; });
        h.push('<section class="unit" data-course="' + esc(course) + '"><h2>' + esc(u) + (courses.length > 1 ? ' <span class="muted">(' + esc(course) + ")</span>" : "") + '</h2><div class="cards cards-3" style="padding-top:0">' + these.map(function (l) {
          return '<div class="card lesson-card"><h3><a href="' + esc(keep("lesson.html?id=" + encodeURIComponent(l.id))) + '">' + esc(l.title) + "</a></h3><p>" +
            esc("Grade " + l.grade + " · " + l.time) + ((l.alsoFits || []).length ? " · also fits: " + esc(l.alsoFits.join("; ")) : "") + "</p><p>" + inline(l.summary) + "</p>" +
            '<p><a href="' + esc(keep("hub-preview.html?page=" + encodeURIComponent(l.id))) + '">Hub version</a></p></div>';
        }).join("") + "</div></section>");
      });
    });
    h.push("</div>");
    h.push('<p><a href="' + esc(keep("hub-preview.html?page=" + encodeURIComponent((site.hubDemo && site.hubDemo.lessonsSlug) || "lessons"))) + '">See these lessons as Hub pages (preview)</a></p>');
    if (A && kf) h.push('<section class="team" aria-labelledby="team-h"><h2 id="team-h">For ' + esc(N.team || "the team") + '</h2><p class="prose">' + esc(A.name) + '’s knowledge file is made from every lesson file that passes the checker (' + ready.length + " of " + lessons.length + '). It holds the questions, layers and bookmarks but not the answers. ' + esc(A.uploadNote || "") + '</p>' +
      '<div class="sheet-tools"><button type="button" class="btn" id="vera-file">Download ' + esc(A.name) + ' knowledge file</button><p class="status-msg" id="vera-status" role="status" aria-live="polite"></p></div></section>');
    h.push("</div>");
    $("main").innerHTML = h.join("");
    if ($("vera-file")) $("vera-file").addEventListener("click", function () {
      var blob = new Blob([MMR.assistantFile(site, ready, new Date().toISOString().slice(0, 10))], { type: "text/plain;charset=utf-8" });
      var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = kf;
      document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
      $("vera-status").textContent = "Downloaded " + a.download + " with " + ready.length + " lesson" + (ready.length === 1 ? "" : "s") + ".";
    });
    $("foot").innerHTML = '<div class="wrap"><h2 style="font-size:1rem">About these pages</h2>' + versionsTable(site, null) + "</div>";
    var sel = $("course");
    if (sel) sel.addEventListener("change", function () {
      document.querySelectorAll("#list .unit").forEach(function (c) { c.hidden = !!sel.value && c.getAttribute("data-course") !== sel.value; });
    });
  }

  /* ---------------- Start ---------------- */
  var isCatalogue = document.body.getAttribute("data-page") === "catalogue";
  MMR.loadSite(getJSON, location.search).then(function (site) {
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
    var params = new URLSearchParams(location.search), id = params.get("id") || "", view = params.get("view") || "";
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(id)) {
      $("main").innerHTML = '<div class="wrap" style="padding-block:2rem;display:grid;gap:.75rem"><h1>No lesson chosen</h1><p><a href="' + esc(keep("./")) + '">See all lessons</a></p></div>';
      return;
    }
    return getJSON("lessons/" + id + ".json").then(function (lesson) {
      var problems = MMR.check(site, lesson, id + ".json");
      showProblems(problems, "The checker found problems in this lesson file. Fix them before publishing:");
      try { renderLesson(site, lesson, view); }
      catch (e) { $("main").innerHTML = '<p class="wrap" style="padding-block:2rem">This lesson file can’t be shown yet. See the problems listed above.</p>'; }
    });
  }).catch(function (e) {
    $("main").innerHTML = '<div class="wrap" style="padding-block:2rem;display:grid;gap:.75rem"><h1>This page couldn’t load</h1><p>' + esc(e.message) +
      '</p><p><a href="' + esc(keep("./")) + '">See all lessons</a></p></div>';
  });
})();
