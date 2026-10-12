/* MapMaker resource pages: Word student sheet builder v1.1.
   Builds one language's sheet from a lesson file. Works in the browser (pass window.docx)
   and in Node (pass require("docx")), so the downloaded file and the file uploaded to
   ArcGIS Online always match the page. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory(require("./lesson-core.js"));
  else root.MMRSheet = factory(root.MMR);
})(typeof self !== "undefined" ? self : this, function (MMR) {
  "use strict";
  var VERSION = "1.1";
  /* Sheets with more question text than this get tighter writing lines, so every sheet stays on one page. */
  var LONG_SHEET_CHARS = 1040;
  var FONT = "Arial";
  var LANG_TAG = { en: "en-US", es: "es-US" };

  function fileName(lesson, lang) { return lesson.id + "-student-sheet-" + lang + ".docx"; }

  function build(docx, site, lesson, lang) {
    var D = docx, T = site.sheetText[lang] || site.sheetText.en, tag = LANG_TAG[lang] || lang;
    var L = { language: { value: tag } };
    function run(text, extra) { return new D.TextRun(Object.assign({ text: MMR.plain(text) }, L, extra || {})); }
    var textChars = lesson.inquiry.questions.reduce(function (n, q) {
      return n + MMR.plain(q.title[lang]).length + MMR.plain(q.student[lang]).length + (q.fill ? MMR.plain(q.fill[lang]).length : 0);
    }, MMR.plain(lesson.inquiry.final.student[lang]).length + MMR.plain(lesson.inquiry.compellingQuestion[lang]).length);
    var lineGap = textChars > LONG_SHEET_CHARS ? 120 : 170;
    function lines(n) {
      var out = [];
      for (var i = 0; i < n; i++) out.push(new D.Paragraph({ spacing: { before: lineGap },
        border: { bottom: { style: D.BorderStyle.SINGLE, size: 4, color: i % 2 ? "8A949E" : "8A949F", space: 1 } },
        children: [run("")] }));
      return out;
    }
    var title = lang === "en" ? lesson.title : (lesson.sheetTitle && lesson.sheetTitle[lang]) || lesson.title;
    var kids = [
      new D.Paragraph({ heading: D.HeadingLevel.HEADING_1, children: [run(title)] }),
      new D.Paragraph({ style: "Subtle", children: [run(T.subtitle)] }),
      new D.Paragraph({ spacing: { before: 200, after: 200 }, tabStops: [{ type: D.TabStopType.LEFT, position: 5200 }],
        children: [run(T.name + ": ____________________________"), run("\t" + T.date + ": ______________")] }),
      new D.Paragraph({ shading: { type: D.ShadingType.CLEAR, fill: "E5EDF5" }, spacing: { after: 120 },
        children: [run(T.bigQuestion + " ", { bold: true }), run(lesson.inquiry.compellingQuestion[lang])] }),
      new D.Paragraph({ spacing: { after: 160 }, children: [run(T.openMap + " ", { italics: true }),
        new D.ExternalHyperlink({ link: MMR.mapmakerUrl(site, lesson.map.webmapId),
          children: [run(lesson.title, { italics: true, color: "0A4FA8", underline: { type: D.UnderlineType.SINGLE } })] })] })
    ];
    lesson.inquiry.questions.forEach(function (q) {
      kids.push(new D.Paragraph({ numbering: { reference: "qs", level: 0 }, spacing: { before: 160 },
        children: [run(q.title[lang] + " ", { bold: true }), run(q.student[lang])] }));
      if (q.fill) kids.push(new D.Paragraph({ indent: { left: 360 }, spacing: { before: 120 }, children: [run(q.fill[lang])] }));
      kids.push.apply(kids, lines(2));
    });
    kids.push(new D.Paragraph({ spacing: { before: 320 }, children: [run(T.yourAnswer + " ", { bold: true }), run(lesson.inquiry.final.student[lang])] }));
    kids.push.apply(kids, lines(3));

    var credits = "Map data: " + lesson.map.layers.map(function (l) { return MMR.plain(l.source).replace(/ \(https:[^)]*\)/g, ""); })
      .filter(function (v, i, a) { return a.indexOf(v) === i; }).join("; ") + ".";
    var status = lesson.languages && lesson.languages[lang] && lesson.languages[lang].status === "draft" ? " Draft translation." : "";
    return new D.Document({
      creator: "MapMaker resource pages", title: lesson.title + " (" + T.subtitle + ")",
      description: "Student sheet, version " + lesson.contentVersion,
      styles: {
        default: { document: { run: { font: FONT, size: 24 }, paragraph: { spacing: { line: 300 } } } },
        paragraphStyles: [
          { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
            run: { font: FONT, size: 36, bold: true, color: "1F1F1F" }, paragraph: { spacing: { after: 60 }, outlineLevel: 0 } },
          { id: "Subtle", name: "Subtle", basedOn: "Normal", run: { font: FONT, size: 20, color: "555555" } },
          { id: "Credits", name: "Credits", basedOn: "Normal", run: { font: FONT, size: 16, color: "555555" }, paragraph: { spacing: { line: 240 } } }
        ]
      },
      numbering: { config: [{ reference: "qs", levels: [{ level: 0, format: D.LevelFormat.DECIMAL, text: "%1.",
        alignment: D.AlignmentType.LEFT, style: { paragraph: { indent: { left: 360, hanging: 360 } } } }] }] },
      sections: [{
        properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1080, bottom: 1080, left: 1080, right: 1080, footer: 500 } } },
        footers: { default: new D.Footer({ children: [new D.Paragraph({ style: "Credits",
          children: [run(lesson.title + ", version " + lesson.contentVersion + "." + status + " " + credits)] })] }) },
        children: kids
      }]
    });
  }

  return { VERSION: VERSION, build: build, fileName: fileName };
});
