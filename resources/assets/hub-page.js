/* MapMaker resource pages: Hub page builder v2.1 (a teacher page per lesson that holds the answers; no answers, status,
   months or known-issue notes on the lesson page; lessons grouped by unit; standards in the hero; a Vera link and the
   AI prompt in a frame card with a copy button on each lesson page, with an Ask Vera button on the Lessons page; one
   Share to Google Classroom button, in the hero).
   Turns lesson files into ArcGIS Hub page layouts: sections of markdown cards that hold plain HTML
   and one <style> block, with no scripts, so the pages work inside Hub. Runs in the browser
   (window.MMRHub, for the Hub preview) and in Node (for the bundle the publishing notebook reads). */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory(require("./lesson-core.js"));
  else root.MMRHub = factory(root.MMR);
})(typeof self !== "undefined" ? self : this, function (MMR) {
  "use strict";
  var VERSION = "2.6";
  var esc = MMR.esc;
  var NEW_TAB = '<span class="mml-sr"> (opens in a new tab)</span>';
  var VERA_HEIGHT = 640;   // room for the lesson note, the conversation, the message box and the privacy note
  var PROMPT_HEIGHT = 300; // the prompt page: two buttons and a scrolling text box

  /* Tags and attributes the pages use. The checker rejects anything else, so a lesson file can't
     put something into the Hub that Hub's own HTML cleaner might strip or mangle. "id" is only for
     section anchors, written the way Esri's Hub article 000039921 shows: an empty <a id="..."></a>
     above the heading, with a lower-case, hyphenated id. <img> is only for the Google Classroom icon; Esri's
     ArcGIS HTML sanitizer keeps img with src, alt, width and height. */
  var ALLOWED = {
    tags: ["style", "div", "p", "span", "a", "h1", "h2", "h3", "h4", "ul", "ol", "li", "strong", "em", "code", "br",
      "table", "thead", "tbody", "tr", "th", "td", "img"],
    attrs: ["class", "href", "target", "rel", "lang", "scope", "id", "src", "alt", "width", "height"]
  };
  var ANCHOR_ID = /^[a-z0-9]+(-[a-z0-9]+)*$/;
  var MAX_FRAMES = 2;   // Esri's Hub help: no more than two iframe cards on a page, for phones

  /* Colours are Esri's Calcite design system tokens: brand #007AC2, brand-hover #00619B, brand-press #004874,
     text #141414 / #4A4A4A, border #D4D4D4, and tints of the status colours. Links use #00619B, which keeps
     4.5:1 contrast on the grey hero as well as on white. */
  var CSS = [
    '.mml{font-family:"Avenir Next",Avenir,"Segoe UI",Helvetica,Arial,sans-serif;color:#141414;font-size:17px;line-height:1.6;max-width:72rem;margin:0 auto;padding:6px 0}',
    ".mml a{color:#00619B;text-decoration:underline;text-underline-offset:.18em}",
    ".mml a:hover{color:#004874}",
    ".mml a:focus-visible{outline:3px solid #007AC2;outline-offset:2px}",
    ".mml h1{font-size:2.4rem;line-height:1.15;font-weight:700;margin:.15em 0 .3em;color:#141414}",
    ".mml h2{display:inline-block;font-size:1.6rem;line-height:1.2;font-weight:700;margin:0 0 .6em;padding-bottom:.25em;border-bottom:3px solid #007AC2;color:#141414}",
    ".mml h3{font-size:1.15rem;line-height:1.3;font-weight:700;margin:1em 0 .35em;color:#141414}",
    ".mml p{margin:0 0 .7em}",
    ".mml ul,.mml ol{margin:0 0 .8em;padding-left:1.3em}",
    ".mml li{margin:0 0 .3em}",
    ".mml code{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:.88em}",
    ".mml-sr{position:absolute!important;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}",
    // Section anchors: the gap above keeps a heading clear of a site header that stays at the top of the screen.
    ".mml .mml-anchor{display:block;height:0;scroll-margin-top:96px}",
    ".mml-hero{background:#F3F3F3;border-top:4px solid #007AC2;border-radius:4px;padding:26px 24px 18px}",
    ".mml-crumbs{font-size:.95rem;color:#4A4A4A}",
    ".mml-summary{font-size:1.15rem;max-width:46rem}",
    ".mml .mml-facts{list-style:none;padding:0;margin:.4em 0 1em;display:flex;flex-wrap:wrap;gap:.4em 1.8em}",
    ".mml-facts li{display:flex;flex-direction:column;margin:0}",
    ".mml-k{display:block;font-size:.75rem;text-transform:uppercase;letter-spacing:.07em;color:#4A4A4A;font-weight:700}",
    ".mml-v{font-weight:600}",
    ".mml-actions{display:flex;flex-wrap:wrap;gap:.6em;margin:.3em 0 .9em}",
    ".mml .mml-btn{display:inline-block;font-weight:600;line-height:1.25;padding:.65em 1em;border-radius:4px;border:2px solid #007AC2;background:#fff;color:#00619B;text-decoration:none!important}",
    ".mml .mml-btn:hover{background:#E8F2F9;color:#004874}",
    ".mml .mml-primary{background:#007AC2;border-color:#007AC2;color:#fff}",
    ".mml .mml-primary:hover{background:#00619B;border-color:#00619B;color:#fff}",
    ".mml-chip{display:inline-block;font-size:.8rem;font-weight:600;padding:.1em .6em;border-radius:999px;border:1px solid #D4D4D4;background:#fff}",
    ".mml-notice{background:#FDF2E6;border:1px solid #F2C48D;border-left:8px solid #C97A00;border-radius:4px;padding:.8em 1.1em;margin:0 0 1em;color:#141414}",
    ".mml .mml-std{list-style:none;padding:0;margin:0;display:inline}",
    ".mml .mml-std li{display:inline;margin:0}",
    ".mml .mml-std li+li::before{content:\" · \";color:#4A4A4A}",
    ".mml .mml-unit{display:block;font-size:1.65rem;line-height:1.2;font-weight:800;color:#004874;margin:1.6em 0 .6em;padding:0 0 .3em .6em;border:0;border-left:8px solid #007AC2;border-bottom:2px solid #D4D4D4}",
    ".mml .mml-unit:first-child{margin-top:.4em}",
    ".mml-ans{border:1px solid #D4D4D4;border-radius:4px;padding:.85em 1.1em .5em;margin:0 0 .9em}",
    ".mml-ans h3{margin:0 0 .4em}",
    ".mml-ans .mml-k{margin-top:.5em}",
    ".mml-ok{background:#E8F4EA;color:#1F6B2B;border-color:#AED6B5}",
    ".mml-open{background:#FBEAE8;color:#A3261B;border-color:#F1B9B3}",
    ".mml-muted{color:#4A4A4A}",
    ".mml-prose{max-width:46rem}",
    ".mml-tablewrap{border:1px solid #D4D4D4;border-radius:4px;margin:0 0 1em}",
    ".mml table{border-collapse:collapse;width:100%;font-size:.96rem;margin:0}",
    ".mml th,.mml td{text-align:left;vertical-align:top;padding:.6em .8em;border-bottom:1px solid #D4D4D4;overflow-wrap:break-word;color:#141414}",
    ".mml th code{white-space:nowrap}",
    ".mml-ph{display:none}",
    ".mml thead th{font-size:.78rem;text-transform:uppercase;letter-spacing:.05em;color:#4A4A4A;background:#F3F3F3}",
    ".mml tr:last-child th,.mml tr:last-child td{border-bottom:0}",
    ".mml-cq{border:1px solid #D4D4D4;border-left:8px solid #007AC2;border-radius:4px;padding:1em 1.2em;margin:0 0 1em;background:#fff}",
    ".mml-cq .mml-q{font-size:1.3rem;font-weight:700;line-height:1.35;margin:.2em 0 0}",
    ".mml .mml-qs{list-style:none;padding:0;margin:0 0 1em;counter-reset:mmlq}",
    ".mml-qs>li{counter-increment:mmlq;position:relative;border:1px solid #D4D4D4;border-radius:4px;padding:.85em 1.1em .5em 3.4em;margin:0 0 .9em}",
    ".mml-qs>li::before{content:counter(mmlq);position:absolute;left:.9em;top:.85em;width:1.9em;height:1.9em;line-height:1.9em;text-align:center;border-radius:50%;background:#007AC2;color:#fff;font-weight:700}",
    ".mml-qs h3{margin:.1em 0 .3em}",
    ".mml-tools{font-size:.95rem}",
    ".mml-sheet{border:1px solid #D4D4D4;border-radius:4px;padding:1.2em 1.4em .6em;max-width:46rem;box-shadow:0 1px 3px rgba(0,0,0,.06);background:#fff}",
    ".mml-sheet ol{padding-left:1.4em}",
    ".mml-sheet h4{font-size:1.05rem;line-height:1.3;font-weight:700;margin:1em 0 .3em;color:#141414}",
    ".mml-sheet .mml-tip{background:#F3F3F3;border-radius:4px;padding:.5em .75em}",
    ".mml-blank{display:inline-block;min-width:6em;border-bottom:1px solid #4A4A4A}",
    ".mml .mml-words{list-style:none;padding:0;display:flex;flex-wrap:wrap;gap:.45em}",
    ".mml-words li{border:1px solid #D4D4D4;border-radius:4px;padding:.1em .6em;font-weight:600;margin:0}",
    ".mml .mml-cards{list-style:none;padding:0;margin:0 0 1em;display:flex;flex-wrap:wrap;gap:1em}",
    ".mml-cards>li{flex:1 1 15rem;min-width:0;margin:0}",
    ".mml .mml-cards a{display:block;height:100%;border:1px solid #D4D4D4;border-top:4px solid #007AC2;border-radius:4px;padding:.9em 1em;text-decoration:none!important;color:#141414}",
    ".mml .mml-cards a:hover{box-shadow:0 4px 14px rgba(0,0,0,.12)}",
    ".mml-card-title{display:block;font-weight:700;font-size:1.05rem;color:#00619B;text-decoration:underline}",
    ".mml-card-text{display:block;color:#4A4A4A;font-size:.95rem}",
    ".mml .mml-lessons{list-style:none;padding:0;margin:0 0 1.4em;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1em}",
    ".mml-lessons>li{position:relative;height:17.5rem;overflow:hidden;border:1px solid #D4D4D4;border-top:4px solid #007AC2;border-radius:4px;padding:.9em 1.1em 2.6em;margin:0;background:#fff;transition:transform .2s ease,box-shadow .2s ease,border-top-width .2s ease}",
    ".mml-lessons>li:hover,.mml-lessons>li:focus-within{transform:translateY(-4px);box-shadow:0 8px 22px rgba(0,0,0,.14);border-top-width:8px}",
    ".mml-lessons>li:hover h3 a,.mml-lessons>li:focus-within h3 a{color:#004874}",
    ".mml .mml-lessons h3{display:block;border:0;font-size:1.3rem;line-height:1.25;font-weight:800;margin:.1em 0 .35em;padding:0}",
    ".mml .mml-lessons h3 a{text-decoration:none}",
    ".mml .mml-lessons h3 a:hover,.mml .mml-lessons h3 a:focus-visible{text-decoration:underline}",
    ".mml-lessons .mml-sum{display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden}",
    ".mml-lessons .mml-tn{position:absolute;left:1.1em;right:1.1em;bottom:.8em;margin:0}",
    "@media (max-width:900px){.mml .mml-lessons{grid-template-columns:repeat(2,minmax(0,1fr))}}",
    "@media (max-width:640px){.mml .mml-lessons{grid-template-columns:1fr}.mml-lessons>li{height:auto;padding-bottom:2.6em}}",
    "@media (prefers-reduced-motion:reduce){.mml-lessons>li{transition:none}.mml-lessons>li:hover{transform:none}}",
    ".mml-foot{background:#004874;color:#fff;border-radius:4px;padding:20px 24px 16px;font-size:.92rem}",
    ".mml.mml-foot p{color:#fff}",
    ".mml.mml-foot a{color:#fff}",
    ".mml.mml-foot h2{display:block;color:#fff;font-size:1.05rem;border:0;padding:0;margin:0 0 .5em}",
    ".mml-foot .mml-tablewrap{border-color:#3D6F92;max-width:32rem}",
    ".mml.mml-foot table,.mml.mml-foot tr,.mml.mml-foot th,.mml.mml-foot td{background:#004874!important;color:#fff!important}",
    ".mml.mml-foot th,.mml.mml-foot td{border-bottom:1px solid #3D6F92;padding:.3em .6em}",
    ".mml.mml-foot thead th{background:#003A5D!important;color:#fff!important}",
    "@media (max-width:640px){.mml h1{font-size:1.9rem}.mml-hero{padding:20px 16px 14px}.mml .mml-qs>li{padding-left:3em}.mml-foot{padding:16px}.mml table,.mml tbody,.mml tr,.mml th,.mml td{display:block;width:auto}.mml thead{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)}.mml tr{border-bottom:1px solid #D4D4D4;padding:.45em 0}.mml tr:last-child{border-bottom:0}.mml th,.mml td{border:0;padding:.2em .8em}.mml-ph{display:inline;font-weight:700}}",
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

  /* Share to Google Classroom. Google's branding guidelines: the approved wording, the official icon on the
     left at 32-96 px and unaltered, Roboto Bold, and a 20% black shade on the icon on hover. Roboto Bold is
     served with the lesson files (SIL Open Font License); if Hub drops the @font-face rule, Arial Bold shows. */
  function classroomCss(site) {
    var c = site.classroom || {};
    if (!c.icon) return "";
    var px = Math.max(32, Math.min(96, parseInt(c.iconSize, 10) || 32));
    return (c.font ? '@font-face{font-family:"MML Roboto";font-style:normal;font-weight:700;font-display:swap;src:url(' + c.font + ') format("woff2")}' : "") +
      '.mml .mml-gc{display:inline-flex;align-items:center;gap:.5em;padding:.3em 1em .3em .45em;font-family:"MML Roboto",Roboto,Arial,sans-serif;font-weight:700}' +
      ".mml .mml-gc img{display:block;flex:none;width:" + px + "px;height:" + px + "px;border:0;margin:0}" +
      ".mml .mml-gc:hover img{filter:brightness(.8)}";
  }
  /* Google asks for this attribution wherever its marks are used. Shown only on pages that carry the button. */
  function classroomNotice(site, lesson) {
    var c = site.classroom || {};
    if (!MMR.classroomShareUrl(site, MMR.mapmakerUrl(site, lesson.map.webmapId))) return "";
    return '<p class="mml-muted">' + esc(c.notice || "Google Classroom is a trademark of Google LLC.") + " Use of this trademark is subject to " +
      ext(c.permissionsUrl || "https://www.google.com/permissions/", "Google Brand Permissions") + ".</p>";
  }
  function classroomButton(site, mapUrl) {
    var c = site.classroom || {}, share = MMR.classroomShareUrl(site, mapUrl);
    if (!share) return "";
    var px = Math.max(32, Math.min(96, parseInt(c.iconSize, 10) || 32));
    return ext(share, '<img src="' + esc(c.icon) + '" alt="" width="' + px + '" height="' + px + '">' + esc(c.label || "Share to Google Classroom"), "mml-btn mml-gc");
  }

  function hashId(s) {
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    return ("c" + h.toString(36) + "00000000").slice(0, 9);
  }
  /* Hub layout pieces. A text card holds HTML; an embed card ("iframe-card", the card Hub's help calls the
     Iframe card) shows another page, here Vera's chat page. Its title is the frame's accessible name. */
  function mdCard(id, markdown) {
    return { component: { name: "markdown-card", settings: { cardId: hashId(id), schemaVersion: 2.1, markdown: protect(markdown) } }, width: 12 };
  }
  function frameCard(id, src, height, title) {
    return { component: { name: "iframe-card", settings: { cardId: hashId(id), src: src, height: String(height), scrollable: true,
      shareable: false, mobileShareable: false, shareableOnHover: false, mobileShareableOnHover: false, title: title } }, width: 12 };
  }
  function section(cards) {
    return {
      containment: "fixed", isFooter: false,
      style: { background: { isFile: false, isUrl: true, state: "", display: {}, transparency: 0, position: { x: "center", y: "center" }, color: "transparent" }, rowLayout: "box" },
      rows: cards.map(function (c) { return { cards: [c] }; }),
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
  /* An in-page anchor. Ids start with the page's slug, because Hub can scroll to a same-named id when a
     link moves between pages (Esri bug BUG-000178430; the workaround is ids unique across pages). */
  function anchorId(slug, name) { return slug + "-" + name; }
  function anchor(slug, name) { return '<a class="mml-anchor" id="' + anchorId(slug, name) + '"></a>'; }
  function jump(slug, name, label) { return '<a class="mml-btn" href="#' + anchorId(slug, name) + '">' + label + "</a>"; }

  /* WCAG 2 contrast ratio between two #RRGGBB (or #RGB) colours. */
  function luminance(hex) {
    var h = String(hex).replace("#", "");
    if (h.length === 3) h = h.replace(/(.)/g, "$1$1");
    return [0, 2, 4].map(function (i) {
      var c = parseInt(h.substr(i, 2), 16) / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    }).reduce(function (sum, c, i) { return sum + c * [0.2126, 0.7152, 0.0722][i]; }, 0);
  }
  function contrast(a, b) {
    var x = luminance(a), y = luminance(b);
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
  }
  /* The site colours for the publishing notebook: site.json hubDemo.theme without its note. */
  function siteTheme(site) {
    var th = hubHome(site).theme, out = {};
    if (!th) return null;
    Object.keys(th).forEach(function (k) { if (k !== "about") out[k] = th[k]; });
    return out;
  }

  function langName(site, lang) { return (site.languageNames && site.languageNames[lang]) || lang; }
  /* Inside a phrase, Spanish (and most languages) write the language name in lower case: "Hoja del estudiante (español)". */
  function langInPhrase(site, lang) { var n = langName(site, lang); return lang === "en" ? n : n.toLowerCase(); }
  function hubHome(site) { return site.hubDemo || {}; }
  function lessonsPath(site) { return "/pages/" + (hubHome(site).lessonsSlug || "lessons"); }

  function teacherSlug(lesson) { return lesson.id + "-teacher"; }
  function standardsList(site, lesson) {
    return '<ul class="mml-std">' + MMR.sortStandards(site, lesson.standards).map(function (st) {
      return "<li><code>" + esc(st.code) + "</code></li>";
    }).join("") + "</ul>";
  }
  function standardsTable(site, lesson) {
    var rows = MMR.sortStandards(site, lesson.standards).map(function (st) {
      return ["<code>" + esc(st.code) + "</code>", esc(MMR.standardLabel(site, MMR.standardPrefix(st.code))), t(st.text)];
    });
    return table("Standards", ["Code", "Framework", "Standard"], rows, true) +
      '<p class="mml-muted">National frameworks first, then state examples. For your own state\'s standards, ask Vera or use the prompt under Make your own questions.</p>';
  }
  function factsList(site, lesson) {
    var facts = [["Grade", esc(lesson.grade)], ["Time", esc(lesson.time)], ["Topic", esc(lesson.unit) + ((lesson.alsoFits || []).length ? ' <span class="mml-muted">(also fits: ' + lesson.alsoFits.map(esc).join("; ") + ")</span>" : "")],
      ["Student login", esc(lesson.studentLogin)], ["Standards", standardsList(site, lesson)]];
    return '<ul class="mml-facts">' + facts.map(function (f) {
      return '<li><span class="mml-k">' + f[0] + '</span><span class="mml-v">' + f[1] + "</span></li>";
    }).join("") + "</ul>";
  }
  function toolLinks(site, tools) {
    return (tools || []).map(function (k) {
      var tl = site.tools[k];
      return '<a href="' + esc(MMR.hubUrl(site, "/pages/" + tl.howTo)) + '" target="_blank" rel="noopener">' + esc(tl.label) +
        '<span class="mml-sr">, how-to video: ' + esc(tl.howToTitle) + " (opens in a new tab)</span></a>";
    }).join(" · ");
  }

  /* The extra sections a lesson's studentSupport adds to the sheet (two-page sheet), as on the Word file. */
  function supportTop(site, lesson, lang) {
    var S = lesson.studentSupport, T = site.sheetText[lang];
    if (!S) return "";
    return (S.beforeYouStart ? "<h4>" + esc(T.beforeYouStart) + "</h4><p>" + t(S.beforeYouStart[lang]) + "</p>" : "") +
      (S.readingTheMap ? "<h4>" + esc(T.readingTheMap) + "</h4><p>" + t(S.readingTheMap[lang]) + "</p>" : "") +
      (S.tips || []).map(function (k) { return '<p class="mml-tip"><strong>' + esc(T.tip) + "</strong> " + esc(T.tips[k]) + "</p>"; }).join("") +
      "<h4>" + esc(T.questions) + "</h4>";
  }
  function sheetPreview(site, lesson, lang) {
    var T = site.sheetText[lang], S = lesson.studentSupport;
    var title = lang === "en" ? lesson.title : (lesson.sheetTitle && lesson.sheetTitle[lang]) || lesson.title;
    function blanks(s) { return esc(MMR.plain(s)).replace(/_{3,}/g, '<span class="mml-blank"> </span>'); }
    return '<div class="mml-sheet" lang="' + lang + '"><h3>' + esc(title) + '</h3><p class="mml-muted">' + esc(T.subtitle) + "</p>" +
      "<p>" + esc(T.name) + ' <span class="mml-blank"> </span> ' + esc(T.date) + ' <span class="mml-blank"> </span></p>' +
      "<p><strong>" + esc(T.bigQuestion) + "</strong> " + t(lesson.inquiry.compellingQuestion[lang]) + "</p>" +
      "<p><em>" + esc(T.openMap + " " + lesson.title) + "</em></p>" + supportTop(site, lesson, lang) + "<ol>" +
      lesson.inquiry.questions.map(function (q) {
        return "<li><strong>" + t(q.title[lang]) + "</strong> " + t(q.student[lang]) + (q.fill ? " " + blanks(q.fill[lang]) : "") + "</li>";
      }).join("") + "</ol><p><strong>" + esc(T.yourAnswer) + "</strong> " + t(lesson.inquiry.final.student[lang]) + "</p>" +
      (S && S.reflection ? "<h4>" + esc(T.lookingBack) + "</h4><p>" + t(S.reflection[lang]) + "</p>" : "") + "</div>";
  }

  function versionsTable(site, lesson) {
    var rows = [["MapMaker resource pages", site.app.version]];
    Object.keys(site.app.parts).forEach(function (k) { rows.push([k, site.app.parts[k]]); });
    if (lesson) rows.push(["This lesson's content", lesson.contentVersion]);
    return table("Versions", ["Part", "Version"], rows.map(function (r) { return [esc(r[0]), esc(r[1])]; }), true);
  }
  function footer(site, lesson) {
    var repo = (hubHome(site).repoUrl || "").replace(/\/+$/, "");
    return '<div class="mml mml-foot"><h2>About this page</h2>' +

      "<p>" + t(site.licence || (lesson && lesson.licence) || "") + (lesson ? " Map data: credited to each source under About this map." : "") + "</p>" +
      (lesson ? classroomNotice(site, lesson) : "") +
      "<p>This page is built from " + (lesson ? "one lesson file" : "the lesson files") + (repo ? ": " + ext(repo + (lesson ? "/blob/main/resources/lessons/" + lesson.id + ".json" : "/tree/main/resources/lessons"), lesson ? "<code>" + esc(lesson.id) + ".json</code>" : "resources/lessons") : "") +
      ". Edit the file, not this page; the page is rebuilt from it.</p>" + versionsTable(site, lesson) + "</div>";
  }

  /* ---------------- Lesson page ---------------- */
  function lessonPage(site, lesson) {
    var slug = lesson.id, S = [], n = 0;
    var langs = Object.keys(lesson.languages);
    var mm = MMR.mapmakerUrl(site, lesson.map.webmapId);
    function add(html) { S.push(section([mdCard(slug + ":" + n, html)])); n++; }

    // Hero: what the lesson is, its standards, and the four things a teacher does with it.
    var gc = classroomButton(site, mm);
    add("<style>" + CSS + classroomCss(site) + "</style>" + '<div class="mml mml-hero"><p class="mml-crumbs"><a href="' + lessonsPath(site) + '">Lessons</a> › ' + esc(lesson.course) + " › " + esc(lesson.unit) + "</p>" +
      "<h1>" + esc(lesson.title) + '</h1><p class="mml-summary">' + t(lesson.summary) + "</p>" + factsList(site, lesson) +
      '<p class="mml-actions">' + ext(mm, "Open in MapMaker", "mml-btn mml-primary") + " " + (gc ? gc + " " : "") +
      jump(slug, "student-activity", "Student sheet") + " " + jump(slug, "teacher-notes", "Teacher notes") + "</p></div>");

    // About this map (the team's known-issues notes stay in the lesson file and the lab mock-up, not here)
    add('<div class="mml"><h2>About this map</h2><p class="mml-prose">Each layer names its source, so you can check where the information comes from.</p>' +
      table("Map layers and sources", ["Layer", "What it shows", "Source"], lesson.map.layers.map(function (l) {
        return [esc(l.name) + (l.offAtStart ? ' <span class="mml-muted">(off when the map opens)</span>' : ""), t(l.shows), t(l.source)];
      }), true) +
      "<p><strong>Bookmarks:</strong> " + ((lesson.map.bookmarks || []).length ? lesson.map.bookmarks.map(esc).join("; ") : "none") + ".</p></div>");

    // Inquiry (no answers here; they are on the teacher page)
    var inq = lesson.inquiry;
    add('<div class="mml"><h2>Inquiry</h2><div class="mml-cq"><span class="mml-k">Compelling question</span><p class="mml-q">' + t(inq.compellingQuestion.en) + "</p></div>" +
      '<p class="mml-prose">Pick the questions that suit your class. Each one is answered from the map, lists the MapMaker tools it uses, and links to how-to videos. Answers and what to accept are linked under Teacher notes.</p><ol class="mml-qs">' +
      inq.questions.map(function (q) {
        return "<li><h3>" + t(q.title.en) + "</h3><p>" + t(q.task) + '</p><p class="mml-tools"><span class="mml-muted">Tools:</span> ' + toolLinks(site, q.tools) + "</p></li>";
      }).join("") + "</ol><h3>Answering the compelling question</h3><p class=\"mml-prose\">" + t(inq.final.teacher) + "</p>" +
      ((inq.final.tools || []).length ? '<p class="mml-tools"><span class="mml-muted">Tools:</span> ' + toolLinks(site, inq.final.tools) + "</p>" : "") + "</div>");

    // Standards
    add('<div class="mml">' + anchor(slug, "standards") + "<h2>Standards</h2>" + standardsTable(site, lesson) + "</div>");

    // Student activity (the one place with the Classroom button, next to the sheet it goes with)
    add('<div class="mml">' + anchor(slug, "student-activity") + '<h2>Student activity</h2><p class="mml-prose">This is what students see on the Word sheet. Download it to edit it, print it, or open it in Google Docs. Students need no account or login.</p>' +
      '<p class="mml-actions">' + langs.map(function (l) {
        return '<a class="mml-btn" href="' + sheetPlaceholder(lesson.id, l) + '"' + (l !== "en" ? ' lang="' + l + '"' : "") + ">Download Word (" + esc(langName(site, l)) + ")</a>";
      }).join(" ") + "</p>" +
      (gc ? '<p class="mml-muted">The Share to Google Classroom button at the top of the page shares the MapMaker map with a class. It doesn’t include the Word sheet, which can be attached in Classroom.</p>' : "") +
      sheetPreview(site, lesson, "en") +
      langs.filter(function (l) { return l !== "en" && lesson.languages[l].note; }).map(function (l) {
        return '<p class="mml-muted">' + esc(langName(site, l)) + ": " + esc(lesson.languages[l].note) + "</p>";
      }).join("") + "</div>");

    // Teacher notes: a full teacher guide (objectives, skills, ways to run it, before class, discussion, misunderstandings,
    // key words, further reading); only the answers sit on the answer page.
    var tn = lesson.teacherNotes, teach = site.teaching || {};
    function ul(items, cls) { return "<ul" + (cls ? ' class="' + cls + '"' : "") + ">" + items.map(function (x) { return "<li>" + t(x) + "</li>"; }).join("") + "</ul>"; }
    add('<div class="mml">' + anchor(slug, "teacher-notes") + '<h2>Teacher notes</h2>' +
      '<p class="mml-prose"><strong>Subjects:</strong> ' + (lesson.subjects || []).map(esc).join(", ") + ". <strong>Grade:</strong> " + esc(lesson.grade) + ". <strong>Time:</strong> " + esc(lesson.time) + ".</p>" +
      "<h3>Learning objectives</h3><p>Students will:</p>" + ul(lesson.objectives || []) +
      "<h3>Map skills</h3>" + ul(MMR.skills(site, lesson), "mml-words") +
      "<h3>Ways to run this lesson</h3>" + ul(MMR.instructionalModels(site, lesson), "mml-words") +
      (teach.materials ? '<h3>Materials</h3><p class="mml-prose">' + esc(teach.materials) + "</p>" : "") +
      '<h3>Before class</h3><p class="mml-prose">' + t(tn.beforeClass) + "</p>" + ((teach.prep || []).length ? ul(teach.prep) : "") +
      ((lesson.discussion || []).length ? "<h3>Discussion questions</h3><ol>" + lesson.discussion.map(function (q) { return "<li>" + t(q) + "</li>"; }).join("") + "</ol>" : "") +
      (tn.misconceptions && tn.misconceptions.length ? "<h3>Common misunderstandings</h3><ul>" + tn.misconceptions.map(function (m) {
        return "<li><strong>“" + t(m.claim) + "”</strong> " + t(m.response) + "</li>";
      }).join("") + "</ul>" : "") +
      '<h3>Key words</h3><ul class="mml-words">' + tn.keyWords.map(function (k) { return "<li>" + esc(k) + "</li>"; }).join("") + "</ul>" +
      ((lesson.resources || []).length ? "<h3>Further reading</h3><ul>" + lesson.resources.map(function (r) {
        return "<li>" + ext(r.url, esc(r.title)) + (r.source ? ' <span class="mml-muted">(' + esc(r.source) + ")</span>" : "") + "</li>";
      }).join("") + "</ul>" : "") +
      '<h3>Answers</h3><p class="mml-prose">Where to find each answer on the map and what to accept are kept off this page, so it can be shared with students: <a href="/pages/' + esc(teacherSlug(lesson)) + '">answer notes</a> (web page) or <a href="' + sheetPlaceholder(lesson.id, "teacher") + '">Download Word (teacher notes)</a>.</p></div>');

    // How-to videos
    add('<div class="mml"><h2>How-to videos</h2><p class="mml-prose">Short videos on the MapMaker Educator Support Hub for the tools this lesson uses.</p><ul class="mml-cards">' +
      MMR.howToLinks(site, lesson).map(function (h) {
        return '<li><a href="' + esc(h.url) + '" target="_blank" rel="noopener"><span class="mml-card-title">' + esc(h.title) + '</span><span class="mml-card-text">For: ' + esc(h.covers.join(", ")) + "</span>" + NEW_TAB + "</a></li>";
      }).join("") + "</ul></div>");

    // Make your own questions: a link to Vera with the lesson pre-filled, and the prompt for the teacher's own AI tool
    // in a frame card (prompt.html on GitHub Pages, which has a copy button), so the page stays short.
    var vUrl = MMR.veraUrl(site, lesson), ai = site.aiPrompt || {}, pUrl = MMR.promptUrl(site, lesson);
    var own = [mdCard(slug + ":" + n + ":intro", '<div class="mml"><h2>Make your own questions</h2>' +
      (vUrl ? '<h3>Ask Vera</h3><p class="mml-prose">Vera, the Support Hub’s AI assistant, has this lesson’s map, bookmarks, layers and questions, but not the answers. Open her with this lesson already named, then ask for easier or harder questions, a short quiz, questions for your own state’s standards, or questions in another language.</p>' +
        '<p class="mml-actions">' + ext(vUrl, "Ask Vera about this lesson", "mml-btn") + "</p>" : "") +
      "<h3>" + esc(ai.label || "Prompt for your own AI") + '</h3><p class="mml-prose">If your school uses a different AI tool, copy the prompt below and paste it in, then add what you want. It lists this map’s layers, pop-ups and bookmarks and tells the tool not to invent any, so its questions stay answerable in MapMaker.</p></div>')];
    if (pUrl) own.push(frameCard(slug + ":" + n + ":prompt", pUrl, PROMPT_HEIGHT, (ai.label || "Prompt for your own AI") + ": " + lesson.title));
    own.push(mdCard(slug + ":" + n, '<div class="mml"><p class="mml-prose mml-muted">' + (pUrl ? "" : "The prompt page isn’t set up (aiPrompt.pageUrl in site.json). ") + 'Questions from Vera or another AI tool aren’t reviewed like this lesson. Each one should be answerable from the map; if one isn’t, please tell us using Report a problem.</p></div>'));
    S.push(section(own)); n++;

    // Report a problem
    add('<div class="mml"><h2>Report a problem</h2><p class="mml-prose">Found a mistake on the map, in the questions or on the student sheet? Tell the MapMaker team. We check every report and fix the map or the lesson.</p>' +
      '<p class="mml-actions">' + ext(MMR.hubUrl(site, site.hub.feedbackPath), "Report a problem", "mml-btn") + "</p></div>");

    add(footer(site, lesson));
    return { slug: slug, kind: "lesson", lessonId: lesson.id, title: lesson.title, summary: MMR.plain(lesson.summary),
      tags: ["MapMaker", "Lesson", lesson.course, "Grade " + lesson.grade, lesson.unit], contentVersion: lesson.contentVersion,
      layout: { sections: S } };
  }

  /* ---------------- Teacher page: the answers, kept off the lesson page ---------------- */
  function answerBlock(site, q, i) {
    var a = q.answer || {}, body = "";
    if (a.where) body += '<p><span class="mml-k">Where to find it on the map</span>' + t(a.where) + "</p>";
    if (a.accept) body += '<p><span class="mml-k">Accept answers that</span>' + t(a.accept) + "</p>";
    if (a.table) body += '<span class="mml-k">Answer key</span>' + table(a.table.caption || "Answer table", a.table.columns, a.table.rows.map(function (r) { return r.map(t); }), true);
    if (a.text) body += '<p><span class="mml-k">Notes</span>' + t(a.text) + "</p>";
    return '<div class="mml-ans"><h3>' + (i + 1) + ". " + t(q.title.en) + '</h3><p class="mml-muted">' + t(q.task) + "</p>" + body + "</div>";
  }
  function teacherPage(site, lesson) {
    var slug = teacherSlug(lesson), S = [], n = 0, inq = lesson.inquiry, tn = lesson.teacherNotes;
    var mm = MMR.mapmakerUrl(site, lesson.map.webmapId);
    function add(html) { S.push(section([mdCard(slug + ":" + n, html)])); n++; }
    add("<style>" + CSS + "</style>" + '<div class="mml mml-hero"><p class="mml-crumbs"><a href="' + lessonsPath(site) + '">Lessons</a> › <a href="/pages/' + esc(lesson.id) + '">' + esc(lesson.title) + "</a></p>" +
      "<h1>Answer notes: " + esc(lesson.title) + '</h1><div class="mml-notice"><strong>For teachers.</strong> This page holds the answers and what to accept. With students, share the lesson page or the map, not this page.</div>' +
      factsList(site, lesson) +
      '<p class="mml-actions">' + ext(mm, "Open in MapMaker", "mml-btn mml-primary") + ' <a class="mml-btn" href="/pages/' + esc(lesson.id) + '">Lesson page</a> <a class="mml-btn" href="' + sheetPlaceholder(lesson.id, "teacher") + '">Download Word (teacher notes)</a></p></div>');
    add('<div class="mml"><h2>Answer notes</h2><div class="mml-cq"><span class="mml-k">Compelling question</span><p class="mml-q">' + t(inq.compellingQuestion.en) + "</p></div>" +
      inq.questions.map(function (q, i) { return answerBlock(site, q, i); }).join("") +
      '<h3>Answering the compelling question</h3><p class="mml-prose">' + t(inq.final.teacher) + "</p></div>");
    add('<div class="mml"><h2>Standards</h2>' + standardsTable(site, lesson) + "</div>");
    add(footer(site, Object.assign({}, lesson, { kindOfPage: "teacher" })));
    return { slug: slug, kind: "teacher", lessonId: lesson.id, title: "Answer notes: " + lesson.title, summary: "Where to find each answer on the map and what to accept, for the MapMaker lesson " + MMR.plain(lesson.title) + ". For teachers.",
      tags: ["MapMaker", "Teacher notes", lesson.course, "Grade " + lesson.grade, lesson.unit], contentVersion: lesson.contentVersion,
      layout: { sections: S } };
  }

  /* ---------------- Lessons (catalogue) page: grouped by unit, in the order the course is taught ---------------- */
  function cataloguePage(site, lessons) {
    var H = hubHome(site), slug = H.lessonsSlug || "lessons", S = [], n = 0;
    function add(html) { S.push(section([mdCard(slug + ":" + n, html)])); n++; }
    var sorted = lessons.slice().sort(function (a, b) {
      return a.course.localeCompare(b.course) || MMR.unitIndex(site, a) - MMR.unitIndex(site, b) || a.title.localeCompare(b.title);
    });
    var courses = sorted.map(function (l) { return l.course; }).filter(function (v, i, a) { return a.indexOf(v) === i; });
    add("<style>" + CSS + "</style>" + '<div class="mml mml-hero"><h1>' + esc(H.lessonsTitle || "Lessons") + '</h1><p class="mml-summary">' + esc(H.lessonsIntro || "") + "</p>" +
      '<p><span class="mml-muted">' + sorted.length + " lesson" + (sorted.length === 1 ? "" : "s") + " · " + esc(courses.join(", ")) + " · no account or login needed</span></p></div>");
    var body = "";
    courses.forEach(function (course) {
      var units = MMR.unitList(site, course), inCourse = sorted.filter(function (l) { return l.course === course; });
      if (courses.length > 1) body += "<h2>" + esc(course) + "</h2>";
      var groups = units.filter(function (u) { return inCourse.some(function (l) { return l.unit === u; }); });
      groups.forEach(function (u) {
        body += '<h2 class="mml-unit">' + esc(u) + '</h2><ul class="mml-lessons">' + inCourse.filter(function (l) { return l.unit === u; }).map(function (l) {
          return '<li><h3><a href="/pages/' + esc(l.id) + '">' + esc(l.title) + "</a></h3>" +
            '<p class="mml-muted">Grade ' + esc(l.grade) + " · " + esc(l.time) + ((l.alsoFits || []).length ? " · also fits: " + l.alsoFits.map(esc).join("; ") : "") + '</p><p class="mml-sum">' + t(l.summary) + '</p><p class="mml-muted mml-tn">For teachers: <a href="/pages/' + esc(teacherSlug(l)) + '">notes and answers</a></p></li>';
        }).join("") + "</ul>";
      });
      var other = inCourse.filter(function (l) { return units.indexOf(l.unit) < 0; });
      if (other.length) body += '<h2 class="mml-unit">Other</h2><ul class="mml-lessons">' + other.map(function (l) {
        return '<li><h3><a href="/pages/' + esc(l.id) + '">' + esc(l.title) + '</a></h3><p class="mml-sum">' + t(l.summary) + "</p></li>";
      }).join("") + "</ul>";
    });
    add('<div class="mml">' + body + "</div>");
    add('<div class="mml"><h2>In every lesson</h2><ul class="mml-prose"><li>A MapMaker map that opens straight from the page, with each layer’s source listed. No account or login is needed.</li>' +
      "<li>An inquiry with a compelling question and questions you can pick from, each answered from the map.</li><li>A Word student sheet in English and Spanish that you can edit, print or open in Google Docs.</li>" +
      "<li>A separate teacher page, and a Word file, with where to find each answer on the map, what to accept, common misunderstandings, key words and standards.</li><li>Links to how-to videos, a link to Vera, and a prompt for your own AI tool.</li></ul></div>");
    // Vera: one link, not an embed. Her home is the Support Hub; each lesson page links to her with the lesson pre-filled.
    var V = site.vera || {};
    if (V.url) add('<div class="mml"><h2>Make your own questions</h2><p class="mml-prose">Vera, the Support Hub’s AI assistant, has every lesson’s map, bookmarks, layers and questions, but not the answers. Name a lesson and ask for easier or harder questions, a short quiz, questions for your own state’s standards or questions in another language. Each lesson page also has a prompt you can paste into another AI tool.</p>' +
      '<p class="mml-actions">' + ext(V.url, "Ask Vera", "mml-btn") + '</p><p class="mml-prose mml-muted">Vera’s questions aren’t reviewed like these lessons. Each one should be answerable from the map; if one isn’t, please tell us using Report a problem on the lesson page.</p></div>');
    add(footer(site, null));
    return { slug: slug, kind: "catalogue", title: H.lessonsTitle || "Lessons", summary: H.lessonsIntro || "", tags: ["MapMaker", "Lessons"], layout: { sections: S } };
  }

  /* ---------------- Word items and the bundle ---------------- */
  function sheets(site, lessons, distUrl, fileName, teacherFileName) {
    var out = [];
    lessons.forEach(function (l) {
      var tfn = teacherFileName(l);
      out.push({ key: l.id + ":teacher", keyword: "mmlSheet-" + l.id + "-teacher", lessonId: l.id, lang: "en", kind: "teacher",
        title: l.title + ": Teacher notes (English)",
        snippet: ("Teacher notes for the MapMaker lesson " + l.title + ": where to find each answer on the map, what to accept, common misunderstandings, key words and standards. For teachers.").slice(0, 250),
        description: "<p>Teacher notes for the MapMaker lesson <strong>" + esc(l.title) + "</strong> (" + esc(l.course) + ", grade " + esc(l.grade) + "): where to find each answer on the map, what to accept, common misunderstandings, key words and standards. For teachers; share the lesson page or the map with students, not this file.</p>" +
          "<p>Lesson content version " + esc(l.contentVersion) + ". Map: <a href=\"" + esc(MMR.mapmakerUrl(site, l.map.webmapId)) + "\">open in MapMaker</a>.</p><p>" + esc(MMR.plain(l.licence)) + "</p>",
        tags: ["MapMaker", "Teacher notes", l.course, "English"],
        fileName: tfn, url: distUrl.replace(/\/+$/, "") + "/sheets/" + tfn, contentVersion: l.contentVersion });
      Object.keys(l.languages).forEach(function (lang) {
        var T = site.sheetText[lang], title = lang === "en" ? l.title : (l.sheetTitle && l.sheetTitle[lang]) || l.title;
        var fn = fileName(l, lang);
        out.push({ key: l.id + ":" + lang, keyword: "mmlSheet-" + l.id + "-" + lang, lessonId: l.id, lang: lang,
          title: title + ": " + T.subtitle + " (" + langInPhrase(site, lang) + ")",
          snippet: (T.subtitle + " for the MapMaker lesson " + l.title + ". Word document you can edit, print or open in Google Docs.").slice(0, 250),
          description: "<p>" + esc(T.subtitle) + " for the MapMaker lesson <strong>" + esc(l.title) + "</strong> (" + esc(l.course) + ", grade " + esc(l.grade) + ").</p>" +
            "<p>Lesson content version " + esc(l.contentVersion) + ". Map: <a href=\"" + esc(MMR.mapmakerUrl(site, l.map.webmapId)) + "\">open in MapMaker</a>.</p>" +
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
      hub: { siteId: H.siteId, url: H.url, lessonsSlug: H.lessonsSlug || "lessons", theme: siteTheme(site) },
      pages: [cataloguePage(site, lessons)].concat(lessons.map(function (l) { return lessonPage(site, l); })).concat(lessons.map(function (l) { return teacherPage(site, l); })),
      sheets: sheets(site, lessons, dist, opts.sheetFileName || function (l, lang) { return l.id + "-student-sheet-" + lang + ".docx"; },
        opts.teacherFileName || function (l) { return l.id + "-teacher-notes-en.docx"; }),
      vera: { fileName: MMR.veraFileName(), url: dist.replace(/\/+$/, "") + "/" + MMR.veraFileName() }
    };
  }

  /* The checker for Hub pages: text cards on one line with only allowed tags, attributes and placeholders,
     the <style> block only in the very first card, embed cards over https with a title (at most two a page),
     ids only on empty anchors, and every in-page link pointing at an anchor on the same page. */
  function pageIds(page) {
    var ids = [];
    page.layout.sections.forEach(function (sec) {
      sec.rows.forEach(function (row) {
        row.cards.forEach(function (card) {
          var md = card.component && card.component.settings && card.component.settings.markdown;
          if (md) (md.match(/\sid="[^"]*"/g) || []).forEach(function (a) { ids.push(a.replace(/^\sid="|"$/g, "")); });
        });
      });
    });
    return ids;
  }
  function checkPage(page, sheetKeys) {
    var errs = [], first = true, ids = pageIds(page), frames = 0;
    page.layout.sections.forEach(function (sec, i) {
      sec.rows.forEach(function (row, r) {
        row.cards.forEach(function (card) {
          var where = page.slug + " section " + (i + 1) + " row " + (r + 1), name = card.component && card.component.name;
          if (name === "iframe-card") {
            var fs = card.component.settings || {};
            frames++;
            if (!/^https:\/\/[^\s"<>]+$/i.test(fs.src || "")) errs.push(where + ": embed card should show an https page, not " + fs.src + ".");
            if (!String(fs.title || "").trim()) errs.push(where + ": embed card needs a title, which screen readers announce for the frame.");
            if (!(parseInt(fs.height, 10) > 0)) errs.push(where + ": embed card needs a height.");
            first = false;
            return;
          }
          if (name !== "markdown-card") { errs.push(where + ": unexpected card type " + name + "."); return; }
          var md = card.component.settings.markdown;
          if (/\n/.test(md)) errs.push(where + ": card text has a line break.");
          if (!first && /<style/i.test(md)) errs.push(where + ": only the first card may hold the <style> block.");
          first = false;
          var body = md.replace(/<style>[\s\S]*?<\/style>/i, "");
          (body.match(/<\/?([a-zA-Z0-9]+)([^>]*)>/g) || []).forEach(function (tag) {
            var m = /^<\/?([a-zA-Z0-9]+)([^>]*)>$/.exec(tag);
            var tname = m[1].toLowerCase();
            if (ALLOWED.tags.indexOf(tname) < 0) errs.push(where + ": tag <" + tname + "> isn't on the allowed list.");
            var rest = m[2].replace(/([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*"([^"]*)"/g, function (_, an, av) {
              if (ALLOWED.attrs.indexOf(an.toLowerCase()) < 0) errs.push(where + ": attribute " + an + " on <" + tname + "> isn't on the allowed list.");
              if ((an.toLowerCase() === "src" || an.toLowerCase() === "width" || an.toLowerCase() === "height" || an.toLowerCase() === "alt") && tname !== "img")
                errs.push(where + ": attribute " + an + " belongs only on <img>.");
              if (an.toLowerCase() === "src" && !/^https:\/\/[^\s"<>]+$/i.test(av)) errs.push(where + ": image " + av + " should be an https address.");
              if (an.toLowerCase() === "id") {
                if (tname !== "a") errs.push(where + ": id belongs on an empty <a> anchor, not <" + tname + ">.");
                if (!ANCHOR_ID.test(av)) errs.push(where + ": anchor id " + av + " should be lower-case words joined by hyphens.");
                if (ids.indexOf(av) !== ids.lastIndexOf(av)) errs.push(where + ": anchor id " + av + " is used twice on this page.");
              }
              return "";
            });
            if (/[^\s\/]/.test(rest)) errs.push(where + ": unquoted or odd attribute text on <" + tname + ">: " + rest.trim());
            if (tname === "img" && tag.charAt(1) !== "/") {
              if (!/\salt="/.test(tag)) errs.push(where + ": <img> needs alt text (alt=\"\" if the picture is decoration).");
              if (!/\swidth="\d+"/.test(tag) || !/\sheight="\d+"/.test(tag)) errs.push(where + ": <img> needs a width and height, so the page doesn't jump as it loads.");
            }
          });
          (md.match(/\{\{[^}]*\}\}/g) || []).forEach(function (ph) {
            var k = /^\{\{SHEET:(.+)\}\}$/.exec(ph);
            if (!k || sheetKeys.indexOf(k[1]) < 0) errs.push(where + ": unknown placeholder " + ph + ".");
          });
          (md.match(/<a [^>]*\sid="[^"]*"[^>]*>(.*?)<\/a>/g) || []).forEach(function (a) {
            if (!/^<a class="mml-anchor" id="[^"]*"><\/a>$/.test(a)) errs.push(where + ": an anchor should be an empty <a class=\"mml-anchor\" id=\"...\"></a>: " + a);
          });
          (md.match(/href="([^"]*)"/g) || []).forEach(function (h) {
            var u = h.slice(6, -1);
            if (u.charAt(0) === "#") {
              if (ids.indexOf(u.slice(1)) < 0) errs.push(where + ": link " + u + " has no matching anchor on this page.");
            } else if (!/^(https:\/\/|\/pages\/|\{\{SHEET:)/.test(u)) errs.push(where + ": link " + u + " should be https://, /pages/, #anchor or a sheet placeholder.");
          });
        });
      });
    });
    if (frames > MAX_FRAMES) errs.push(page.slug + ": " + frames + " embed cards; Hub's help advises no more than " + MAX_FRAMES + " on a page.");
    return errs;
  }

  /* Checks across the whole bundle: every page, anchor ids unique across pages (BUG-000178430), and the site
     colours readable (WCAG AA, 4.5:1 for text). */
  function checkBundle(b) {
    var keys = b.sheets.map(function (s) { return s.key; }), errs = [], seen = {};
    b.pages.forEach(function (p) {
      errs = errs.concat(checkPage(p, keys));
      pageIds(p).forEach(function (id) {
        if (seen[id] && seen[id] !== p.slug) errs.push(p.slug + ": anchor id " + id + " is also used on " + seen[id] + ".");
        seen[id] = p.slug;
      });
    });
    var th = b.hub && b.hub.theme, HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
    if (th) {
      [["header", "text", "background"], ["globalNav", "text", "background"], ["button", "text", "background"]].forEach(function (k) {
        var part = th[k[0]];
        if (!part) return;
        if (!HEX.test(part[k[1]] || "") || !HEX.test(part[k[2]] || "")) { errs.push("site colours: " + k[0] + " needs #RRGGBB text and background."); return; }
        var c = contrast(part[k[1]], part[k[2]]);
        if (c < 4.5) errs.push("site colours: " + k[0] + " text " + part[k[1]] + " on " + part[k[2]] + " is " + c.toFixed(2) + ":1; it needs 4.5:1.");
      });
      if (th.body && th.body.link) {
        var bg = th.body.background || "#FFFFFF";
        if (!HEX.test(th.body.link) || !HEX.test(bg)) errs.push("site colours: body link and background need #RRGGBB.");
        else if (contrast(th.body.link, bg) < 4.5) errs.push("site colours: links " + th.body.link + " on " + bg + " are " + contrast(th.body.link, bg).toFixed(2) + ":1; they need 4.5:1.");
      }
    }
    return errs;
  }

  return { VERSION: VERSION, CSS: CSS, ALLOWED: ALLOWED, lessonPage: lessonPage, teacherPage: teacherPage, cataloguePage: cataloguePage, bundle: bundle, teacherSlug: teacherSlug,
    checkPage: checkPage, checkBundle: checkBundle, contrast: contrast,
    sheetPlaceholder: sheetPlaceholder, protect: protect };
});
