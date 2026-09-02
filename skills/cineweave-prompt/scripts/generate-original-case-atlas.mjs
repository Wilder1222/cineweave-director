#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

export const ATLAS_GENERATOR_VERSION = "1.0.0";

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function text(x, y, value, size, fill, anchor = "start", weight = 600) {
  return `  <text x="${x}" y="${y}" fill="${fill}" font-family="system-ui, sans-serif" font-size="${size}" font-weight="${weight}" text-anchor="${anchor}">${escapeXml(value)}</text>`;
}

const renderers = {
  portrait({ palette: p, exactText: t }) {
    return [
      `  <circle data-element="key-light" cx="890" cy="180" r="118" fill="${p[2]}" opacity="0.72"/>`,
      `  <path data-element="subject-silhouette" d="M475 735 C480 590 520 500 600 475 C540 430 530 335 575 275 C625 205 735 220 770 300 C805 382 760 447 710 478 C805 510 850 610 850 735 Z" fill="${p[1]}"/>`,
      `  <path data-element="gaze-line" d="M650 340 L885 245" fill="none" stroke="${p[4]}" stroke-width="8" stroke-dasharray="18 14"/>`,
      `  <circle cx="651" cy="338" r="13" fill="${p[4]}"/>`,
      text(72, 100, t[0], 46, p[4]),
      text(72, 150, t[1], 20, p[3], "start", 500)
    ].join("\n");
  },
  product({ palette: p, exactText: t }) {
    return [
      `  <ellipse data-element="contact-shadow" cx="610" cy="700" rx="250" ry="46" fill="${p[4]}" opacity="0.2"/>`,
      `  <rect data-element="support-plane" x="175" y="712" width="850" height="10" rx="5" fill="${p[3]}"/>`,
      `  <path data-element="product-body" d="M500 245 Q500 205 540 205 H680 Q720 205 720 245 V300 Q770 345 770 430 V630 Q770 690 710 690 H490 Q430 690 430 630 V430 Q430 345 480 300 Z" fill="${p[1]}" stroke="${p[4]}" stroke-width="8"/>`,
      `  <rect x="500" y="395" width="200" height="105" rx="18" fill="${p[0]}" stroke="${p[3]}" stroke-width="5"/>`,
      `  <path d="M492 320 C545 280 675 280 728 320" fill="none" stroke="${p[2]}" stroke-width="18"/>`,
      text(600, 455, t[0], 30, p[4], "middle", 700),
      text(600, 785, t[1], 22, p[4], "middle", 500)
    ].join("\n");
  },
  food({ palette: p, exactText: t }) {
    return [
      `  <ellipse data-element="plate" cx="600" cy="575" rx="350" ry="190" fill="${p[1]}" stroke="${p[4]}" stroke-width="8"/>`,
      `  <g data-element="food-components" fill="${p[2]}"><circle cx="490" cy="545" r="72"/><circle cx="620" cy="520" r="88"/><circle cx="735" cy="590" r="65"/><path d="M430 620 Q600 700 785 610 Q690 735 500 710 Z" fill="${p[3]}"/></g>`,
      `  <g data-element="steam" fill="none" stroke="${p[4]}" stroke-width="9" stroke-linecap="round" opacity="0.7"><path d="M510 390 C460 330 555 300 515 230"/><path d="M615 365 C565 300 670 275 625 190"/><path d="M720 400 C675 335 765 310 735 245"/></g>`,
      text(72, 100, t[0], 46, p[4]),
      text(72, 150, t[1], 20, p[3], "start", 500)
    ].join("\n");
  },
  architecture({ palette: p, exactText: t }) {
    return [
      `  <path data-element="massing" d="M210 690 V330 L435 210 L660 330 V690 Z M660 690 V285 L910 380 V690 Z" fill="${p[1]}" stroke="${p[4]}" stroke-width="8"/>`,
      `  <g data-element="bay-rhythm" fill="${p[0]}" stroke="${p[3]}" stroke-width="5"><rect x="285" y="405" width="90" height="150"/><rect x="465" y="365" width="90" height="190"/><rect x="710" y="410" width="70" height="145"/><rect x="820" y="450" width="55" height="105"/></g>`,
      `  <g data-element="scale-figure" fill="${p[2]}"><circle cx="965" cy="590" r="20"/><path d="M965 610 V690 M965 635 L930 665 M965 635 L995 670" stroke="${p[2]}" stroke-width="12" stroke-linecap="round"/></g>`,
      text(72, 100, t[0], 46, p[4]),
      text(72, 150, t[1], 20, p[3], "start", 500)
    ].join("\n");
  },
  editorial({ palette: p, exactText: t }) {
    return [
      `  <rect data-element="safe-area" x="55" y="55" width="1090" height="790" fill="none" stroke="${p[3]}" stroke-width="3" stroke-dasharray="16 12"/>`,
      `  <g data-element="editorial-grid" stroke="${p[3]}" stroke-width="2" opacity="0.45"><path d="M420 55 V845"/><path d="M790 55 V845"/><path d="M55 280 H1145"/></g>`,
      `  <path data-element="garment-silhouette" d="M590 225 Q600 175 650 175 Q700 175 710 225 L760 360 L690 405 L780 735 H520 L610 405 L540 360 Z" fill="${p[1]}" stroke="${p[4]}" stroke-width="8"/>`,
      text(90, 145, t[0], 58, p[4]),
      text(92, 220, t[1], 22, p[2], "start", 600),
      text(1080, 800, "01", 84, p[3], "end", 700)
    ].join("\n");
  },
  diagrams({ palette: p, exactText: t }) {
    return [
      `  <g data-element="edges" fill="none" stroke="${p[4]}" stroke-width="8"><path d="M330 430 H520"/><path d="M680 430 H870"/><path d="M500 415 L525 430 L500 445" fill="${p[4]}"/><path d="M850 415 L875 430 L850 445" fill="${p[4]}"/></g>`,
      `  <g data-element="nodes" stroke="${p[4]}" stroke-width="6"><rect x="120" y="340" width="210" height="180" rx="28" fill="${p[1]}"/><rect x="495" y="340" width="210" height="180" rx="28" fill="${p[2]}"/><rect x="870" y="340" width="210" height="180" rx="28" fill="${p[3]}"/></g>`,
      text(225, 450, t[0], 30, p[4], "middle", 700),
      text(600, 450, t[1], 30, p[4], "middle", 700),
      text(975, 450, t[2] || "APPROVED", 30, p[4], "middle", 700),
      `  <g data-element="legend">${text(600, 690, "LEFT TO RIGHT · THREE VERIFIED NODES", 20, p[4], "middle", 500).trim()}</g>`
    ].join("\n");
  },
  "exact-text"({ palette: p, exactText: t }) {
    return [
      `  <rect data-element="safe-area" x="95" y="95" width="1010" height="710" rx="24" fill="${p[1]}" stroke="${p[4]}" stroke-width="6"/>`,
      `  <g data-element="title-block">${text(600, 330, t[0], 74, p[4], "middle", 750).trim()}</g>`,
      `  <g data-element="subtitle-block">${text(600, 430, t[1], 34, p[2], "middle", 650).trim()}</g>`,
      `  <g data-element="literal-copy">${text(600, 535, t[2] || "Line 01 — A/B · 2026", 28, p[3], "middle", 500).trim()}</g>`,
      `  <path d="M260 610 H940" stroke="${p[3]}" stroke-width="3"/>`,
      text(600, 675, "UTF-8 · NFC · CODEPOINT CHECKED", 18, p[4], "middle", 500)
    ].join("\n");
  }
};

export function renderOriginalCaseSvg(casePayload) {
  const category = casePayload?.category;
  const spec = casePayload?.visualSpec;
  if (!renderers[category] || !spec || spec.width !== 1200 || spec.height !== 900) {
    throw new TypeError("A supported Original Case Atlas payload with a 1200x900 visualSpec is required");
  }
  if (!Array.isArray(spec.palette) || spec.palette.length !== 5 || !Array.isArray(spec.exactText) || spec.exactText.length < 2) {
    throw new TypeError("visualSpec palette and exactText are incomplete");
  }
  const body = renderers[category](spec);
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900" role="img" data-case-id="${escapeXml(casePayload.caseId)}">`,
    `  <title>${escapeXml(casePayload.title)}</title>`,
    `  <desc>Original deterministic ${escapeXml(category)} fixture; no external media or provider output.</desc>`,
    `  <rect width="1200" height="900" fill="${spec.palette[0]}"/>`,
    body,
    "</svg>",
    ""
  ].join("\n");
}

async function main(args) {
  if (args.length !== 2 || args[0] !== "--case") {
    throw new Error("Usage: node generate-original-case-atlas.mjs --case <case.json>");
  }
  const payload = JSON.parse(await readFile(args[1], "utf8"));
  process.stdout.write(renderOriginalCaseSvg(payload));
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  main(process.argv.slice(2)).catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
