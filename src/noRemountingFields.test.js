// A component declared inside another component is a new component type on every render of its parent, so
// React unmounts and remounts everything in it. A text/number field inside it loses the cursor after each
// typed character (the user has to click the box again). Declare such components at module level, or call
// them as plain functions ({Modal()}) instead of rendering <Modal />.
import fs from "fs";
import path from "path";
import { parse } from "@babel/parser";

const SRC = __dirname;

const sourceFiles = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((f) => {
    const p = path.join(dir, f.name);
    if (f.isDirectory()) return sourceFiles(p);
    return /\.(jsx?)$/.test(f.name) && !/\.test\./.test(f.name) ? [p] : [];
  });

const isComponentName = (n) => /^[A-Z]/.test(n);
const FN = /FunctionDeclaration|FunctionExpression|ArrowFunctionExpression/;

const remountingFieldComponents = (file) => {
  const src = fs.readFileSync(file, "utf8");
  const ast = parse(src, { sourceType: "module", plugins: ["jsx"] });
  const hits = [];
  const visit = (node, insideFunction) => {
    if (!node || typeof node.type !== "string") return;
    let name = null;
    let fn = null;
    if (node.type === "VariableDeclarator" && node.id.type === "Identifier" && node.init && FN.test(node.init.type)) {
      name = node.id.name;
      fn = node.init;
    } else if (node.type === "FunctionDeclaration" && node.id) {
      name = node.id.name;
      fn = node;
    }
    if (name && insideFunction && isComponentName(name)) {
      const body = src.slice(fn.start, fn.end);
      if (/<(input|textarea|select)\b/.test(body) && new RegExp(`<${name}[\\s/>]`).test(src)) {
        hits.push(`${path.relative(SRC, file)}: ${name} (line ${fn.loc.start.line})`);
      }
    }
    const inner = insideFunction || FN.test(node.type);
    for (const key of Object.keys(node)) {
      if (key === "loc") continue;
      const v = node[key];
      if (Array.isArray(v)) v.forEach((c) => visit(c, inner));
      else if (v && typeof v.type === "string") visit(v, inner);
    }
  };
  visit(ast.program, false);
  return hits;
};

test("no form field sits in a component that is re-created on every render", () => {
  const hits = sourceFiles(SRC).flatMap(remountingFieldComponents);
  expect(hits).toEqual([]);
});
