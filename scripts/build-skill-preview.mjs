import { mkdir, readFile, writeFile } from "node:fs/promises";
import vm from "node:vm";
import ts from "typescript";

// Use the app's own descriptions and prices; the resulting HTML needs no server.
async function sourceModule(file, dependencies = {}) {
  const source = await readFile(new URL(file, import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {};
  vm.runInNewContext(compiled, {
    exports,
    require: (id) => {
      if (!(id in dependencies)) throw new Error(`Unexpected dependency: ${id}`);
      return dependencies[id];
    },
  });
  return exports;
}
const methods = await sourceModule("../src/lib/methods.ts");
const { CHARACTERS } = await sourceModule("../src/lib/characters.ts");
const economy = await sourceModule("../src/lib/skill-economy.ts", { "./methods": methods });
async function asset(path) {
  const bytes = await readFile(new URL("../public/" + path, import.meta.url));
  return `data:image/${path.endsWith(".png") ? "png" : "webp"};base64,${bytes.toString("base64")}`;
}
const skills = await Promise.all(Object.entries(methods.STUDY_METHODS).map(async ([id, method]) => {
  const owner = methods.methodOwner(id);
  return {
    id, ...method, cost: economy.skillPrice(id),
    owner: owner.kind === "signature" ? CHARACTERS[owner.code].name : null,
    art: await asset(`skills/${id}.webp`),
  };
}));
const icons = Object.fromEntries(await Promise.all(["heart", "lock-1", "lock-2", "lock-3", "lock-open"].map(async id => [id, await asset(`skills/${id}.webp`)])));
const payload = JSON.stringify({ skills, icons, logo: await asset("brand/studycrew-logo.webp") }).replaceAll("<", "\\u003c");
const template = await readFile(new URL("../art/skills/preview.template.html", import.meta.url), "utf8");
const output = new URL("../ref/skillbook-preview.html", import.meta.url);
await mkdir(new URL("../ref/", import.meta.url), { recursive: true });
await writeFile(output, template.replace("/*__PREVIEW_DATA__*/", payload));
console.log(`Created ref/skillbook-preview.html (${skills.length} skills, all images embedded)`);
