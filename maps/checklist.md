# Web map checklist

What a lesson's web map and its layers should meet before teachers use it. `maps/audit.py` reads each public map without signing in and lists what to check; everything it finds is checked by hand, against the live map and the sources, before anything changes. Fixes are made by whoever owns the item.

## 1. Facts and sources
- Every feature, attribute and pop-up fact a lesson uses is checked against a named source, and the item credits name the sources the data actually came from.
- Nothing on a historical map that didn't exist at its date (for example West Virginia on an 1850 map), and no features from later periods unless the layer says so.
- No duplicate features (a pop-up showing "1 of 2" for one place).
- Names spelled as the sources spell them, and no placeholder titles such as "Point".
- No Britannica, CARTO or Google Earth Engine content, and no content or services from US-embargoed countries.

## 2. Items and sharing
- The web map and every layer are shared with Everyone, and no layer asks students to sign in (subscriber or premium content does).
- Each item has a title, summary, description, tags, credits and terms of use, and the web map's thumbnail is its picture from `resources/assets/screenshots`.
- The owner of each item is known, so it's clear who can fix it.

## 3. Opening view
- The map opens on what the lesson's first question needs, with layers on and off as the lesson file says (`offAtStart`).
- Every layer that is on at the start draws at the opening scale, or the lesson says to zoom in.
- Bookmark names match the lesson's steps.

## 4. Layers and legend
- Layer names match the lesson's wording exactly, are short, and don't start with "Copy of".
- Legend labels match what the symbols show (for example a victory symbol labelled with the right side).
- Where a question depends on telling categories apart, they differ by more than colour: shape, pattern or a label as well ([WCAG 2.1 1.4.1 Use of Color](https://www.w3.org/TR/WCAG21/#use-of-color), Level A).
- Symbols and lines students must find stand out from the basemap at 3:1 or more ([1.4.11 Non-text Contrast](https://www.w3.org/TR/WCAG21/#non-text-contrast)); map labels are readable against it, with a halo where needed ([1.4.3 Contrast](https://www.w3.org/TR/WCAG21/#contrast-minimum), 4.5:1 for text).
- Category colours stay distinguishable with common colour-vision deficiencies (no red against green alone).

WCAG 2.1 AA is the level the US Department of Justice's ADA Title II rule sets for state and local government web content, including public schools; the compliance dates are April 26, 2027 (entities of 50,000 people or more) and April 26, 2028 (smaller ones) after the April 2026 extension.

## 5. Pop-ups
- Every layer students click has a pop-up, and layers with nothing to show have pop-ups turned off.
- The pop-up title names the feature; fields have readable labels, not field names or codes; no text is cut off; dates fit the period.
- Images load and have alt text.
- Wording a grade 8 student can read.

## 6. Drawing
- Each layer draws in a few seconds at the opening view on a school Chromebook (simplified geometry, sensible scale ranges).
