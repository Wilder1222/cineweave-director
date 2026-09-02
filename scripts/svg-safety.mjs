const allowedElements = new Set(["svg", "title", "desc", "rect", "circle", "ellipse", "path", "g", "text"]);

const forbiddenPatterns = Object.freeze([
  [/<script\b/iu, "script"],
  [/<foreignObject\b/iu, "foreignObject"],
  [/<(?:animate|animateMotion|animateTransform|set)\b/iu, "animation element"],
  [/<(?:iframe|object|embed|use|image|audio|video|source|track)\b/iu, "resource-bearing element"],
  [/<style\b|\bstyle\s*=/iu, "style content"],
  [/\son[a-z][a-z0-9:._-]*\s*=/iu, "event handler"],
  [/\b(?:href|xlink:href)\s*=/iu, "href reference"],
  [/\burl\s*\(/iu, "CSS URL"],
  [/\bdata:/iu, "data URI"],
  [/<!\s*(?:DOCTYPE|ENTITY)\b/iu, "external entity declaration"],
  [/<\?/u, "XML processing instruction"],
  [/@import\b/iu, "CSS import"],
  [/\\/u, "escaped or backslash-obfuscated content"]
]);

export function inspectStaticSvg(source) {
  const text = String(source);
  const findings = [];
  for (const [pattern, label] of forbiddenPatterns) {
    if (pattern.test(text)) findings.push(label);
  }

  const withoutNamespace = text.replaceAll('xmlns="http://www.w3.org/2000/svg"', "");
  if (/(?:https?|file|ftp|javascript|vbscript):/iu.test(withoutNamespace)) findings.push("external URI scheme");

  for (const match of text.matchAll(/<\/?\s*([A-Za-z][A-Za-z0-9:._-]*)\b/gu)) {
    if (!allowedElements.has(match[1])) findings.push(`element not allowed: ${match[1]}`);
  }
  return [...new Set(findings)];
}
