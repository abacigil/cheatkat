#!/usr/bin/env node
// Tiny test runner for the QML script modules.
//
// The modules under package/contents/code/ are QML JavaScript libraries —
// they use `.pragma library` and `.import ... as Ns` directives which Node
// can't parse directly. `loadModule(path)` strips those directives and
// evaluates the script into a namespace object that mirrors the QML import.

const fs   = require("fs")
const path = require("path")

const CODE_DIR = path.join(__dirname, "..", "package", "contents", "code")

function loadModule(name) {
    const src = fs.readFileSync(path.join(CODE_DIR, name), "utf8")
                  .replace(/^\.(pragma|import).*$/gm, "")
    const ns = {}
    const wrapped = src + "\nObject.assign(__ns, { " +
        // Collect every top-level `function NAME(` and `var NAME =` as exports
        [...src.matchAll(/\nfunction\s+([A-Za-z_]\w*)\s*\(/g)].map(m => m[1])
        .concat([...src.matchAll(/\nvar\s+([A-Za-z_]\w*)\s*=/g)].map(m => m[1]))
        .filter((v, i, a) => a.indexOf(v) === i)
        .map(n => `${n}: typeof ${n} !== "undefined" ? ${n} : undefined`)
        .join(", ") +
        " })"
    new Function("__ns", wrapped)(ns)
    return ns
}

let passes = 0, failures = 0
const failureLog = []

function eq(a, b, msg) {
    const ok = JSON.stringify(a) === JSON.stringify(b)
    if (ok) { passes++; return }
    failures++
    failureLog.push({ msg, a, b })
}

function truthy(v, msg) {
    if (v) { passes++; return }
    failures++
    failureLog.push({ msg, a: v, b: "(truthy)" })
}

function describe(name, fn) {
    console.log(`\n${name}`)
    fn({ eq, truthy })
}

function summary() {
    console.log(`\n${passes} passed, ${failures} failed`)
    if (failures > 0) {
        for (const f of failureLog) {
            console.log(`\n  FAIL: ${f.msg}`)
            console.log(`    got:      ${JSON.stringify(f.a)}`)
            console.log(`    expected: ${JSON.stringify(f.b)}`)
        }
        process.exit(1)
    }
}

// Export *before* loading test files — otherwise they re-require this module
// while it's mid-execution and see an empty object.
module.exports = { loadModule, describe, eq, truthy, summary }

if (require.main === module) {
    const here = __dirname
    for (const f of fs.readdirSync(here).filter(n => n.endsWith(".test.js"))) {
        require(path.join(here, f))
    }
    summary()
}
