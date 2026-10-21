/* MapMaker resource pages: Word builder v1.3 (student sheets and teacher notes).
   Builds one language's student sheet, or the teacher notes, from a lesson file. Works in the browser
   (pass window.docx) and in Node (pass require("docx")), so the downloaded file and the file uploaded
   to ArcGIS Online always match the page.
   1.3: no underscore runs (Name and Date use an underlined tab, blanks are underlined spaces), the map
   address printed under the link for students on paper, 9 pt minimum text, the document language set
   once as the default, one definition of each heading style, a pause after each question title,
   Spanish chrome strings from site.json, no draft markings, and the teacher notes document. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory(require("./lesson-core.js"));
  else root.MMRSheet = factory(root.MMR);
})(typeof self !== "undefined" ? self : this, function (MMR) {
  "use strict";
  var VERSION = "1.5";
  /* Sheets with more question text than this get tighter writing lines, so every sheet stays on one page. */
  var LONG_SHEET_CHARS = 1040;
  /* The same for two-page sheets (lessons with studentSupport), counting the extra sections too. */
  var LONG_TWO_PAGE_CHARS = 2200;
  var FONT = "Arial";
  var LANG_TAG = { en: "en-US", es: "es-US" };
  var PAGE = { width: 12240, height: 15840 };   // US Letter
  var TEXT_WIDTH = 12240 - 2 * 1080;            // between the 0.75 in side margins

  function fileName(lesson, lang) { return lesson.id + "-student-sheet-" + lang + ".docx"; }
  function teacherFileName(lesson) { return lesson.id + "-teacher-notes-en.docx"; }

  /* A question title reads as its own sentence when spoken: add a pause unless it already ends one. */
  function titleWithPause(text) {
    var t = MMR.plain(text).trim();
    return /[.?!:]$/.test(t) ? t + " " : t + ". ";
  }

  /* Shared document settings: default font, size, language and the heading styles, defined once each. */
  function docStyles(tag) {
    return {
      default: {
        document: { run: { font: FONT, size: 24, language: { value: tag } }, paragraph: { spacing: { line: 300 } } },
        heading1: { run: { font: FONT, size: 36, bold: true, color: "1F1F1F" }, paragraph: { spacing: { after: 60 }, outlineLevel: 0 } },
        heading2: { run: { font: FONT, size: 28, bold: true, color: "1F1F1F" }, paragraph: { spacing: { before: 180, after: 40 }, keepNext: true, outlineLevel: 1 } },
        heading3: { run: { font: FONT, size: 24, bold: true, color: "1F1F1F" }, paragraph: { spacing: { before: 140, after: 40 }, keepNext: true, outlineLevel: 2 } }
      },
      paragraphStyles: [
        { id: "Subtle", name: "Subtle", basedOn: "Normal", run: { font: FONT, size: 22, color: "555555" } },
        { id: "Credits", name: "Credits", basedOn: "Normal", run: { font: FONT, size: 18, color: "555555" }, paragraph: { spacing: { line: 240 } } }
      ]
    };
  }

  function build(docx, site, lesson, lang) {
    var D = docx, T = site.sheetText[lang] || site.sheetText.en, tag = LANG_TAG[lang] || lang;
    function run(text, extra) { return new D.TextRun(Object.assign({ text: MMR.plain(text) }, extra || {})); }
    /* A blank to write in: underlined non-breaking spaces, which a screen reader passes over instead of
       reading "underscore" for each character. Replaces runs of ___ in a fill-in line. */
    function withBlanks(text) {
      var parts = MMR.plain(text).split(/_{3,}/), out = [];
      parts.forEach(function (p, i) {
        if (p) out.push(run(p));
        if (i < parts.length - 1) out.push(new D.TextRun({ text: " ".repeat(14), underline: { type: D.UnderlineType.SINGLE } }));
      });
      return out;
    }
    var textChars = lesson.inquiry.questions.reduce(function (n, q) {
      return n + MMR.plain(q.title[lang]).length + MMR.plain(q.student[lang]).length + (q.fill ? MMR.plain(q.fill[lang]).length : 0);
    }, MMR.plain(lesson.inquiry.final.student[lang]).length + MMR.plain(lesson.inquiry.compellingQuestion[lang]).length);
    /* A lesson with studentSupport (Before you start, Reading the map, tips, a closing reflection) gets a two-page
       sheet with section headings and more room to write; the rest keep the one-page sheet. */
    var S = lesson.studentSupport || null;
    if (S) textChars += ["beforeYouStart", "readingTheMap", "reflection"].reduce(function (n, k) { return n + (S[k] ? MMR.plain(S[k][lang]).length : 0); }, 0) +
      (S.tips || []).reduce(function (n, k) { return n + String((T.tips || {})[k] || "").length; }, 0);
    var credits = (T.mapData || "Map data:") + " " + lesson.map.layers.map(function (l) { return MMR.plain(l.source).replace(/ \(https:[^)]*\)/g, ""); })
      .filter(function (v, i, a) { return a.indexOf(v) === i; }).join("; ") + ".";
    if (S) textChars += credits.length / 2;   // the credits are set smaller
    /* Writing lines stay about 7 mm apart, which a 13-year-old can write on. A long two-page sheet keeps the line
       height and gives each question one line fewer instead, so the sheet still ends on page two. */
    var longTwo = !!S && textChars > LONG_TWO_PAGE_CHARS, veryLong = !!S && textChars > LONG_TWO_PAGE_CHARS + 600, extraLong = !!S && textChars > LONG_TWO_PAGE_CHARS + 900;
    var lineGap = S ? (extraLong ? 90 : veryLong ? 100 : longTwo ? 130 : 150) : (textChars > LONG_SHEET_CHARS ? 120 : 170);
    var lineHeight = veryLong ? 240 : longTwo ? 260 : 300;
    function nLines(n) { return longTwo ? Math.max(2, n - 1) : n; }
    function h2(text) { return new D.Paragraph({ heading: D.HeadingLevel.HEADING_2, children: [run(text)] }); }
    function lines(n) {
      var out = [];
      // On a two-page sheet, a question's writing lines stay on the same page as the question.
      for (var i = 0; i < n; i++) out.push(new D.Paragraph({ spacing: { before: lineGap, line: lineHeight }, keepNext: !!S && i < n - 1,
        border: { bottom: { style: D.BorderStyle.SINGLE, size: 4, color: i % 2 ? "8A949E" : "8A949F", space: 1 } },
        children: [run("")] }));
      return out;
    }
    var title = lang === "en" ? lesson.title : (lesson.sheetTitle && lesson.sheetTitle[lang]) || lesson.title;
    var mapUrl = MMR.mapmakerUrl(site, lesson.map.webmapId);
    var kids = [
      new D.Paragraph({ heading: D.HeadingLevel.HEADING_1, children: [run(title)] }),
      new D.Paragraph({ style: "Subtle", children: [run(T.subtitle)] }),
      // Name and Date: the line to write on is an underlined tab, not a run of underscores.
      new D.Paragraph({ spacing: { before: S ? 120 : 200, after: S ? 120 : 200 },
        tabStops: [{ type: D.TabStopType.LEFT, position: 5000, leader: D.LeaderType.UNDERSCORE }, { type: D.TabStopType.LEFT, position: 5600 }, { type: D.TabStopType.LEFT, position: 9400, leader: D.LeaderType.UNDERSCORE }],
        children: [run(T.name + ":"), run("\t\t" + T.date + ":"), run("\t")] }),
      new D.Paragraph({ shading: { type: D.ShadingType.CLEAR, fill: "E5EDF5" }, spacing: { after: 120 },
        children: [run(T.bigQuestion + " ", { bold: true }), run(lesson.inquiry.compellingQuestion[lang])] }),
      new D.Paragraph({ spacing: { after: 40 }, children: [run(T.openMap + " ", { italics: true }),
        new D.ExternalHyperlink({ link: mapUrl,
          children: [run(title, { italics: true, color: "0A4FA8", underline: { type: D.UnderlineType.SINGLE } })] })] }),
      // The address in print, for students working from paper.
      new D.Paragraph({ style: "Credits", spacing: { after: 160 }, children: [run((T.sheetUrl || "Map address:") + " " + mapUrl)] })
    ];
    if (S) {
      if (S.beforeYouStart) kids.push(h2(T.beforeYouStart), new D.Paragraph({ spacing: { after: 80 }, children: [run(S.beforeYouStart[lang])] }));
      if (S.readingTheMap) kids.push(h2(T.readingTheMap), new D.Paragraph({ spacing: { after: 80 }, children: [run(S.readingTheMap[lang])] }));
      (S.tips || []).forEach(function (k) {
        kids.push(new D.Paragraph({ shading: { type: D.ShadingType.CLEAR, fill: "F3F3F3" }, spacing: { before: 60, after: 120 },
          children: [run(T.tip + " ", { bold: true }), run(T.tips[k])] }));
      });
      kids.push(h2(T.questions));
    }
    lesson.inquiry.questions.forEach(function (q) {
      kids.push(new D.Paragraph({ numbering: { reference: "qs", level: 0 }, spacing: { before: 160 }, keepNext: !!S,
        children: [run(titleWithPause(q.title[lang]), { bold: true }), run(q.student[lang])] }));
      if (q.fill) kids.push(new D.Paragraph({ indent: { left: 360 }, spacing: { before: 120 }, keepNext: !!S, children: withBlanks(q.fill[lang]) }));
      kids.push.apply(kids, lines(nLines(q.lines || (S ? 3 : 2))));
    });
    kids.push(new D.Paragraph({ spacing: { before: 320 }, keepNext: !!S, children: [run(T.yourAnswer + " ", { bold: true }), run(lesson.inquiry.final.student[lang])] }));
    kids.push.apply(kids, lines(S ? nLines(4) : 3));
    if (S && S.reflection) {
      kids.push(h2(T.lookingBack), new D.Paragraph({ keepNext: true, children: [run(S.reflection[lang])] }));
      kids.push.apply(kids, lines(extraLong ? 1 : 2));
    }

    if (S) kids.push(new D.Paragraph({ style: "Credits", spacing: { before: 120 }, children: [run(credits)] }));
    return new D.Document({
      creator: "MapMaker resource pages", title: title + " (" + T.subtitle + ")",
      description: T.subtitle + ", " + lesson.contentVersion,
      styles: docStyles(tag),
      numbering: { config: [{ reference: "qs", levels: [{ level: 0, format: D.LevelFormat.DECIMAL, text: "%1.",
        alignment: D.AlignmentType.LEFT, style: { paragraph: { indent: { left: 360, hanging: 360 } } } }] }] },
      sections: [{
        // Two-page sheets have a one-line footer, so their top and bottom margins can be a little smaller (0.625 in).
        properties: { page: { size: PAGE, margin: { top: S ? 900 : 1080, bottom: S ? 900 : 1080, left: 1080, right: 1080, footer: 500 } } },
        // A two-page sheet carries the map credits once, at the end, and a one-line footer on each page.
        footers: { default: new D.Footer({ children: [new D.Paragraph({ style: "Credits",
          children: [run(title + ", " + lesson.contentVersion + "." + (S ? "" : " " + credits))] })] }) },
        children: kids
      }]
    });
  }

  /* ---------------- Teacher notes (English): the answers, kept out of the student materials ---------------- */
  function buildTeacher(docx, site, lesson) {
    var D = docx, T = site.sheetText.en, inq = lesson.inquiry, tn = lesson.teacherNotes, teach = site.teaching || {};
    function run(text, extra) { return new D.TextRun(Object.assign({ text: MMR.plain(text) }, extra || {})); }
    function p(text, extra) { return new D.Paragraph(Object.assign({ spacing: { after: 100 }, children: [run(text)] }, extra || {})); }
    function labelled(label, text) {
      return new D.Paragraph({ spacing: { after: 100 }, indent: { left: 360 }, children: [run(label + " ", { bold: true }), run(text)] });
    }
    function h2(text) { return new D.Paragraph({ heading: D.HeadingLevel.HEADING_2, children: [run(text)] }); }
    function h3(text) { return new D.Paragraph({ heading: D.HeadingLevel.HEADING_3, children: [run(text)] }); }
    var border = { style: D.BorderStyle.SINGLE, size: 4, color: "BFBFBF" };
    function table(columns, rows) {
      var n = columns.length, w = Math.floor(TEXT_WIDTH / n), widths = columns.map(function (_, i) { return i === n - 1 ? TEXT_WIDTH - w * (n - 1) : w; });
      function cell(text, i, head) {
        return new D.TableCell({ width: { size: widths[i], type: D.WidthType.DXA }, borders: { top: border, bottom: border, left: border, right: border },
          shading: head ? { type: D.ShadingType.CLEAR, fill: "E7EDF3", color: "auto" } : undefined, margins: { top: 60, bottom: 60, left: 90, right: 90 },
          children: [new D.Paragraph({ children: [run(text, { bold: head, size: 20 })] })] });
      }
      return new D.Table({ width: { size: TEXT_WIDTH, type: D.WidthType.DXA }, columnWidths: widths,
        rows: [new D.TableRow({ tableHeader: true, children: columns.map(function (c, i) { return cell(c, i, true); }) })]
          .concat(rows.map(function (r) { return new D.TableRow({ children: r.map(function (c, i) { return cell(c, i, false); }) }); })) });
    }
    var mapUrl = MMR.mapmakerUrl(site, lesson.map.webmapId);
    var stds = MMR.sortStandards(site, lesson.standards);
    var kids = [
      new D.Paragraph({ heading: D.HeadingLevel.HEADING_1, children: [run("Teacher notes: " + lesson.title)] }),
      new D.Paragraph({ style: "Subtle", children: [run(lesson.course + " · Grade " + lesson.grade + " · " + lesson.unit + " · " + lesson.time)] }),
      new D.Paragraph({ shading: { type: D.ShadingType.CLEAR, fill: "FDF2E6" }, spacing: { before: 120, after: 160 },
        children: [run("For teachers. ", { bold: true }), run("This document holds the answers and what to accept. With students, share the lesson page or the map, not this file.")] }),
      new D.Paragraph({ spacing: { after: 40 }, children: [run("Map: ", { italics: true }),
        new D.ExternalHyperlink({ link: mapUrl, children: [run(lesson.title, { color: "0A4FA8", underline: { type: D.UnderlineType.SINGLE } })] })] }),
      new D.Paragraph({ style: "Credits", spacing: { after: 120 }, children: [run((T.sheetUrl || "Map address:") + " " + mapUrl)] }),
      p("Subjects: " + (lesson.subjects || []).join(", ") + ". Standards: " + stds.map(function (s) { return s.code; }).join(" · ")),
      h2("Learning objectives"), p("Students will:")
    ];
    (lesson.objectives || []).forEach(function (o) { kids.push(new D.Paragraph({ numbering: { reference: "b", level: 0 }, spacing: { after: 60 }, children: [run(o)] })); });
    kids.push(h2("Map skills"), p(MMR.skills(site, lesson).join(", ") + "."));
    kids.push(h2("Ways to run this lesson"), p(MMR.instructionalModels(site, lesson).join(" · ")));
    kids.push(h2("Before class"), new D.Paragraph({ spacing: { after: 100 }, children: [run("About this map: ", { bold: true }), run(tn.beforeClass)] }));
    if (teach.materials) kids.push(p(teach.materials, { style: "Subtle" }));
    if ((lesson.discussion || []).length) { kids.push(h2("Discussion questions")); lesson.discussion.forEach(function (q, j) { kids.push(new D.Paragraph({ indent: { left: 540, hanging: 360 }, spacing: { after: 60 }, children: [run((j + 1) + ".\t" + MMR.plain(q))] })); }); }
    if (lesson.differentiation) {
      kids.push(h2("Support and stretch"));
      kids.push(new D.Paragraph({ spacing: { after: 60 }, children: [run("Support: ", { bold: true }), run(lesson.differentiation.support)] }));
      kids.push(new D.Paragraph({ spacing: { after: 100 }, children: [run("Stretch: ", { bold: true }), run(lesson.differentiation.stretch)] }));
    }
    if ((lesson.resources || []).length) {
      kids.push(h2("Further reading"));
      lesson.resources.forEach(function (r) { kids.push(new D.Paragraph({ numbering: { reference: "b", level: 0 }, spacing: { after: 60 }, children: [new D.ExternalHyperlink({ link: r.url, children: [run(r.title, { color: "0A4FA8", underline: { type: D.UnderlineType.SINGLE } })] }), run(r.source ? " (" + r.source + ")" : "")] })); });
    }
    kids.push(h2("Answer notes"),
      new D.Paragraph({ shading: { type: D.ShadingType.CLEAR, fill: "E5EDF5" }, spacing: { after: 120 },
        children: [run(T.bigQuestion + " ", { bold: true }), run(inq.compellingQuestion.en)] }));
    inq.questions.forEach(function (q, i) {
      var a = q.answer || {};
      kids.push(h3((i + 1) + ". " + MMR.plain(q.title.en) + (q.core ? " (if you only do one)" : "") + (q.minutes ? ", about " + q.minutes + " minutes" : "")));
      kids.push(p(q.task, { style: "Subtle" }));
      if ((q.frontOfClass || []).length) {
        kids.push(labelled("From the front:", ""));
        q.frontOfClass.forEach(function (st, j) { kids.push(new D.Paragraph({ indent: { left: 900, hanging: 360 }, spacing: { after: 40 }, children: [run((j + 1) + ".\t" + MMR.plain(st))] })); });
      }
      if (a.where) kids.push(labelled(T.whereToFind || "Where to find it on the map:", a.where));
      if (a.accept) kids.push(labelled(T.accept || "Accept answers that:", a.accept));
      if (a.table) {
        kids.push(labelled(T.key || "Answer key:", a.table.caption || ""));
        kids.push(table(a.table.columns, a.table.rows.map(function (r) { return r.map(MMR.plain); })));
        kids.push(new D.Paragraph({ spacing: { after: 100 }, children: [run("")] }));
      }
      if (a.text) kids.push(labelled("Notes:", a.text));
    });
    kids.push(h3("Answering the compelling question"), p(inq.final.teacher));
    if (tn.misconceptions && tn.misconceptions.length) {
      kids.push(h2("Common misunderstandings"));
      tn.misconceptions.forEach(function (m) {
        kids.push(new D.Paragraph({ numbering: { reference: "b", level: 0 }, spacing: { after: 80 }, children: [run("“" + MMR.plain(m.claim) + "” ", { bold: true }), run(m.response)] }));
      });
    }
    kids.push(h2("Key words"), p(tn.keyWords.join(", ")));
    kids.push(h2("Standards"), table(["Code", "Framework", "Standard"], stds.map(function (s) {
      return [s.code, MMR.standardLabel(site, MMR.standardPrefix(s.code)), MMR.plain(s.text)];
    })));
    var credits = (T.mapData || "Map data:") + " " + lesson.map.layers.map(function (l) { return MMR.plain(l.source).replace(/ \(https:[^)]*\)/g, ""); })
      .filter(function (v, i, a) { return a.indexOf(v) === i; }).join("; ") + ".";
    kids.push(new D.Paragraph({ style: "Credits", spacing: { before: 360 }, children: [run(credits)] }));
    kids.push(new D.Paragraph({ style: "Credits", spacing: { before: 120 }, children: [run(site.licence || lesson.licence || "")] }));
    return new D.Document({
      creator: "MapMaker resource pages", title: "Teacher notes: " + lesson.title,
      description: "Teacher notes, " + lesson.contentVersion,
      styles: docStyles(LANG_TAG.en),
      numbering: { config: [{ reference: "b", levels: [{ level: 0, format: D.LevelFormat.BULLET, text: "•",
        alignment: D.AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 270 } } } }] }] },
      sections: [{
        properties: { page: { size: PAGE, margin: { top: 1080, bottom: 1080, left: 1080, right: 1080, footer: 500 } } },
        footers: { default: new D.Footer({ children: [new D.Paragraph({ style: "Credits",
          children: [run("Teacher notes: " + lesson.title + ", " + lesson.contentVersion + ". For teachers.")] })] }) },
        children: kids
      }]
    });
  }

  return { VERSION: VERSION, build: build, buildTeacher: buildTeacher, fileName: fileName, teacherFileName: teacherFileName };
});
