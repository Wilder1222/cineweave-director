import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { validatePayload } from "../scripts/validate-output.mjs";
import { validateProjectionIntegrity } from "../scripts/validate-prompt-projection.mjs";

const contractRoot = new URL("../skills/cineweave-director/resources/contracts/", import.meta.url);
const schemaPath = fileURLToPath(new URL("schemas/prompt-projection-plan.schema.json", contractRoot));
const fixture = JSON.parse(await readFile(new URL("examples/prompt-projection-plan.json", contractRoot), "utf8"));

test("PromptProjectionPlan keeps the existing complete baseline and single variable experiment", async () => {
  const result = await validatePayload(schemaPath, structuredClone(fixture));
  assert.equal(result.valid, true, result.errors.join("\n"));
});

for (const [label, mutate, diagnostic] of [
  ["copy text must come from its declared body and parameter tail", (p) => { p.renderedPrompt.copyText = "一个完全不同的人站在沙漠中。"; }, /copyText/],
  ["parameter rendering must preserve its structured value", (p) => { p.parameterTokens[1].rendered = "--ar 1:1"; }, /parameterTokens\[1\].rendered/],
  ["parameter ids cannot be duplicated", (p) => { p.parameterTokens[1].parameterId = p.parameterTokens[0].parameterId; }, /parameterId/],
  ["rendered reference placeholders must belong to a binding", (p) => { p.renderedPrompt.referencePlaceholders = ["REF_UNDECLARED_ASSET"]; }, /referencePlaceholders/],
  ["the rendered body must equal the declared adapted body", (p) => { p.renderedPrompt.body += "另一句话。"; }, /renderedPrompt.body/],
  ["parameter tail must come from ordered tokens", (p) => { p.renderedPrompt.parameterTail += " --w 10"; }, /parameterTail/],
  ["parameter order must be unique", (p) => { p.parameterTokens[1].order = p.parameterTokens[0].order; }, /order/],
  ["known flag parameters cannot serialize false", (p) => { p.parameterTokens[2].value = false; }, /parameterTokens\[2\].value/],
  ["known flag parameters cannot serialize null", (p) => { p.parameterTokens[2].value = null; }, /parameterTokens\[2\].value/],
  ["known flags cannot serialize a number", (p) => { p.parameterTokens[2].value = 1; }, /parameterTokens\[2\].value/],
  ["a known singleton parameter cannot be repeated", (p) => { p.parameterTokens.push({ ...p.parameterTokens[1], parameterId: "parameter.second-ratio", order: 6 }); p.renderedPrompt.parameterTail += " --ar 16:9"; setBody(p, p.promptBody); }, /name/],
  ["the copy separator must be one ASCII space", (p) => { p.renderedPrompt.copyText = `${p.promptBody}\u00a0${p.renderedPrompt.parameterTail}`; }, /copyText/],
  ["reference bindings cannot duplicate ids", (p) => { p.referenceBindings.push({ ...p.referenceBindings[0], surfaceSlot: "web.style_reference.2", externalLocatorPlaceholder: "REF_STYLE_SECOND" }); p.renderedPrompt.referencePlaceholders.push("REF_STYLE_SECOND"); }, /bindingId/],
  ["reference bindings cannot duplicate placeholders", (p) => { p.referenceBindings.push({ ...p.referenceBindings[0], bindingId: "binding.style.second", surfaceSlot: "web.style_reference.2" }); }, /externalLocatorPlaceholder/],
  ["rendered placeholder list cannot repeat a binding", (p) => { p.renderedPrompt.referencePlaceholders.push(p.renderedPrompt.referencePlaceholders[0]); }, /referencePlaceholders/],
  ["a declared binding must have a rendered placeholder", (p) => { p.renderedPrompt.referencePlaceholders = []; }, /referencePlaceholders/],
  ["reference-looking text cannot name an undeclared input", (p) => { setBody(p, "角色看向 REF_UNKNOWN_INPUT。"); }, /REF_UNKNOWN_INPUT/],
  ["a returned profile code must be present", (p) => { p.profileBindings = [profileBinding("returned_exact")]; }, /resolvedCode/],
  ["a pending profile cannot claim a returned code", (p) => { p.profileBindings = [{ ...profileBinding("pending_external_submission"), resolvedCode: "CODE123" }]; }, /resolvedCode/],
  ["a profile with no applicable code cannot claim one", (p) => { p.profileBindings = [{ ...profileBinding("not_applicable"), resolvedCode: "CODE123" }]; }, /resolvedCode/],
  ["the experiment baseline id must resolve", (p) => { p.experimentPlan.baselineVariantId = "variant.missing"; }, /baselineVariantId/],
  ["experiment ids must be unique", (p) => { p.experimentPlan.variants[1].variantId = p.experimentPlan.variants[0].variantId; }, /variantId/],
  ["exactly one experiment baseline must exist", (p) => { p.experimentPlan.variants[1].role = "baseline"; p.experimentPlan.variants[1].changedVariable = null; }, /baseline/],
  ["a baseline cannot declare a changed variable", (p) => { p.experimentPlan.variants[0].changedVariable = "风格化"; }, /changedVariable/],
  ["a test must name its changed variable", (p) => { p.experimentPlan.variants[1].changedVariable = null; }, /changedVariable/],
  ["a test cannot name a blank variable", (p) => { p.experimentPlan.variants[1].changedVariable = "   "; }, /changedVariable/],
  ["private local paths cannot enter adapted copy", (p) => { setBody(p, "使用 C:\\Users\\ww\\private\\portrait.png 的人物。"); }, /private locator/],
  ["signed locators cannot enter adapted copy", (p) => { setBody(p, "使用 https://assets.example/portrait.png?X-Amz-Signature=secret 的人物。"); }, /private locator/],
]) {
  test(`PromptProjectionPlan rejects ${label}`, async () => {
    const payload = structuredClone(fixture);
    mutate(payload);
    const result = await validatePayload(schemaPath, payload);
    assert.equal(result.valid, false, "Previously accepted an inconsistent projection");
    assert.match(result.errors.join("\n"), diagnostic);
  });
}

function setBody(payload, body) {
  payload.promptBody = body;
  payload.renderedPrompt.body = body;
  payload.renderedPrompt.copyText = payload.renderedPrompt.parameterTail ? `${body} ${payload.renderedPrompt.parameterTail}` : body;
  payload.experimentPlan.variants[0].renderedPrompt = payload.renderedPrompt.copyText;
}

function profileBinding(resolvedCodeState) {
  return { bindingId: "binding.profile.test", bindingType: "style_code", providerHandle: "PROFILE123", resolvedCodeState, purpose: "记录精确账号风格码。" };
}

test("PromptProjectionPlan preserves Chinese punctuation and Unicode code points", async () => {
  const payload = structuredClone(fixture);
  const body = "她说：“你拿走吧”；招牌写着 cafe\u0301，身旁是 café。";
  setBody(payload, body);
  const before = structuredClone(payload);
  const result = await validatePayload(schemaPath, payload);
  assert.equal(result.valid, true, result.errors.join("\n"));
  assert.deepEqual(payload, before);
  assert.equal(payload.renderedPrompt.body, body);
});

test("PromptProjectionPlan needs no trailing separator when there are no parameters", async () => {
  const payload = structuredClone(fixture);
  payload.parameterTokens = [];
  payload.renderedPrompt.parameterTail = "";
  setBody(payload, "女子保持右手握伞，等待对方触到弯柄。");
  const result = await validatePayload(schemaPath, payload);
  assert.equal(result.valid, true, result.errors.join("\n"));
});

test("PromptProjectionPlan sorts tokens by order without changing input array order", async () => {
  const payload = structuredClone(fixture);
  payload.parameterTokens.reverse();
  const before = structuredClone(payload);
  const result = await validatePayload(schemaPath, payload);
  assert.equal(result.valid, true, result.errors.join("\n"));
  assert.deepEqual(payload, before);
});

test("PromptProjectionPlan accepts a multi-value Midjourney string in one documented style reference token", async () => {
  const payload = structuredClone(fixture);
  payload.parameterTokens.push({ parameterId: "parameter.style-codes", order: 6, name: "--sref", value: "123456 654321", rendered: "--sref 123456 654321", source: "human_choice", rationale: "多个风格码由一个参数承载。" });
  payload.renderedPrompt.parameterTail += " --sref 123456 654321";
  setBody(payload, payload.promptBody);
  const result = await validatePayload(schemaPath, payload);
  assert.equal(result.valid, true, result.errors.join("\n"));
});

test("PromptProjectionPlan keeps unknown dialect repetition unverified without guessing its syntax", async () => {
  const payload = structuredClone(fixture);
  payload.dialect.dialectId = "unknown-test-dialect";
  payload.parameterTokens = [
    { ...payload.parameterTokens[0], name: "--multi", value: false, rendered: "--multi off" },
    { ...payload.parameterTokens[1], name: "--multi", value: null, rendered: "--multi unset" },
  ];
  payload.renderedPrompt.parameterTail = "--multi off --multi unset";
  setBody(payload, payload.promptBody);
  const result = await validatePayload(schemaPath, payload);
  assert.equal(result.valid, true, result.errors.join("\n"));
  assert.match(result.unverified.join("\n"), /dialect.*unknown-test-dialect|unknown-test-dialect.*dialect/);
});

test("PromptProjectionPlan reports free-text single variable effect claims as unverified", async () => {
  const result = await validatePayload(schemaPath, structuredClone(fixture));
  assert.equal(result.valid, true, result.errors.join("\n"));
  assert.match(result.unverified.join("\n"), /experimentPlan.*single.variable|single.variable.*experimentPlan/);
});

test("PromptProjectionPlan permits ordinary public URLs in visible-result prose", async () => {
  const payload = structuredClone(fixture);
  setBody(payload, "墙上标牌显示 https://example.org/exhibition，女子从标牌旁走过。");
  const result = await validatePayload(schemaPath, payload);
  assert.equal(result.valid, true, result.errors.join("\n"));
});

test("PromptProjectionPlan permits a returned exact profile code", async () => {
  const payload = structuredClone(fixture);
  payload.profileBindings = [{ ...profileBinding("returned_exact"), resolvedCode: "CODE123" }];
  const result = await validatePayload(schemaPath, payload);
  assert.equal(result.valid, true, result.errors.join("\n"));
});

test("PromptProjectionPlan treats repeated opaque reference categories as unverified cardinality", async () => {
  const payload = structuredClone(fixture);
  payload.referenceBindings.push({ ...payload.referenceBindings[0], bindingId: "binding.style.second", externalLocatorPlaceholder: "REF_STYLE_SECOND" });
  payload.renderedPrompt.referencePlaceholders.push("REF_STYLE_SECOND");
  const result = await validatePayload(schemaPath, payload);
  assert.equal(result.valid, true, result.errors.join("\n"));
  assert.match(result.unverified.join("\n"), /surfaceSlot.*cardinality/);
});

test("the standalone projection check accepts deeply frozen input and only returns diagnostics", () => {
  const payload = structuredClone(fixture);
  payload.parameterTokens.reverse();
  const before = JSON.stringify(payload);
  function freeze(value) {
    if (value && typeof value === "object") {
      Object.values(value).forEach(freeze);
      Object.freeze(value);
    }
  }
  freeze(payload);
  const result = validateProjectionIntegrity(payload);
  assert.deepEqual(Object.keys(result).sort(), ["errors", "unverified"]);
  assert.deepEqual(result.errors, []);
  assert.ok(result.unverified.every((entry) => typeof entry === "string"));
  assert.equal(JSON.stringify(payload), before);
});

for (const providerHandle of ["HTTPS://private.example/a", "FILE:/private", "C:\\Users\\ww\\portrait.png", "profile?id=123", "profile#123"]) {
  test(`the standalone projection check guards provider handle ${providerHandle}`, () => {
    const payload = structuredClone(fixture);
    payload.profileBindings = [{ ...profileBinding("not_applicable"), providerHandle }];
    assert.match(validateProjectionIntegrity(payload).errors.join("\n"), /providerHandle/);
  });
}

test("unknown parameter names in a known dialect do not acquire guessed rendering or repetition rules", async () => {
  const payload = structuredClone(fixture);
  payload.parameterTokens = [
    { ...payload.parameterTokens[0], name: "--future-multi", value: "first", rendered: "--future-multi first" },
    { ...payload.parameterTokens[1], name: "--future-multi", value: "second", rendered: "--future-multi second" },
  ];
  payload.renderedPrompt.parameterTail = "--future-multi first --future-multi second";
  setBody(payload, payload.promptBody);
  const result = await validatePayload(schemaPath, payload);
  assert.equal(result.valid, true, result.errors.join("\n"));
  assert.match(result.unverified.join("\n"), /future-multi/);
});

for (const value of ["16:9 --seed 99", "16:9\t--future-shift 99"]) {
  test(`a recognized parameter value cannot embed another flag in ${JSON.stringify(value)}`, async () => {
    const payload = structuredClone(fixture);
    payload.parameterTokens[1].value = value;
    payload.parameterTokens[1].rendered = `--ar ${value}`;
    payload.renderedPrompt.parameterTail = payload.parameterTokens.map((token) => token.rendered).join(" ");
    setBody(payload, payload.promptBody);
    const result = await validatePayload(schemaPath, payload);
    assert.equal(result.valid, false, "An extra control was hidden inside one declared parameter value");
    assert.match(result.errors.join("\n"), /parameterTokens\[1\].value.*parameter delimiter/);
  });
}

for (const variantIndex of [0, 1]) {
  test(`experiment variant ${variantIndex} cannot use an undeclared reference placeholder`, async () => {
    const payload = structuredClone(fixture);
    payload.experimentPlan.variants[variantIndex].renderedPrompt += " REF_UNDECLARED_ASSET";
    const result = await validatePayload(schemaPath, payload);
    assert.equal(result.valid, false, "An experiment copy named an undeclared reference input");
    assert.match(result.errors.join("\n"), new RegExp(`experimentPlan\\.variants\\[${variantIndex}\\]\\.renderedPrompt.*REF_UNDECLARED_ASSET`));
  });
}

test("plain multi-value exclusions remain one legitimate parameter string", async () => {
  const payload = structuredClone(fixture);
  payload.parameterTokens.push({ parameterId: "parameter.exclusions", order: 6, name: "--no", value: "lettering watermark", rendered: "--no lettering watermark", source: "human_choice", rationale: "只排除命名元素。" });
  payload.renderedPrompt.parameterTail += " --no lettering watermark";
  setBody(payload, payload.promptBody);
  const result = await validatePayload(schemaPath, payload);
  assert.equal(result.valid, true, result.errors.join("\n"));
});

for (const locator of ["file:/Users/ww/private/portrait.png", "file:relative/private/portrait.png", "FILE:relative/private/portrait.png"]) {
  for (const location of ["copy", "variant", "provider-code"]) {
    test(`file URI scheme cannot enter adapter ${location}: ${locator}`, async () => {
      const payload = structuredClone(fixture);
      if (location === "copy") setBody(payload, `读取 ${locator}。`);
      if (location === "variant") payload.experimentPlan.variants[1].renderedPrompt = `读取 ${locator}。`;
      if (location === "provider-code") payload.profileBindings = [{ ...profileBinding("returned_exact"), resolvedCode: locator }];
      const result = await validatePayload(schemaPath, payload);
      assert.equal(result.valid, false, "An unrecognized file URI form entered adapter copy or a provider code");
      assert.match(result.errors.join("\n"), /private locator/);
    });
  }
}
