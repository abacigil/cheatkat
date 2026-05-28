const fs = require("fs")
const path = require("path")
const { loadModule, describe } = require("./run")

const Kitty = loadModule("kitty.js")
const Vim   = loadModule("vim.js")

const kittyFixture = fs.readFileSync(path.join(__dirname, "fixtures/kitty.conf"), "utf8")
const vimFixture   = fs.readFileSync(path.join(__dirname, "fixtures/vimrc"),       "utf8")

describe("kitty.normalizeKeys", ({ eq }) => {
    eq(Kitty.normalizeKeys("Ctrl+Shift+T"),         "ctrl+shift+t",
       "lowercase + canonical order")
    eq(Kitty.normalizeKeys("shift+ctrl+t"),         "ctrl+shift+t",
       "modifier ordering normalized")
    eq(Kitty.normalizeKeys("kitty_mod+t", "ctrl+shift"), "ctrl+shift+t",
       "kitty_mod expanded against passed-in mod")
    eq(Kitty.normalizeKeys("Control+Return"),       "ctrl+enter",
       "synonym aliases (control/return)")
})

describe("kitty.parseConfig", ({ eq, truthy }) => {
    const parsed = Kitty.parseConfig(kittyFixture)
    eq(parsed.kittyMod, "ctrl+alt",
       "kitty_mod directive picked up")
    eq(parsed.shortcuts.length, 4,
       "user shortcuts parsed (no_op excluded, continuation joined, kitty_mod expanded)")
    truthy(parsed.disabledKeys["ctrl+shift+c"],
       "no_op recorded as disabled")
    eq(parsed.shortcuts.find(s => s.action.startsWith("send_text")).keys, "ctrl+alt+m",
       "backslash continuation joined into single map")
    eq(parsed.shortcuts.find(s => s.action === "new_tab").keys, "ctrl+alt+t",
       "kitty_mod token expanded in user binding")
})

describe("vim.normalizeKeys", ({ eq }) => {
    eq(Vim.normalizeKeys("<C-p>"),           "ctrl+p",
       "angle-bracket modifier")
    eq(Vim.normalizeKeys("<S-Tab>"),         "shift+tab",
       "named key inside angle bracket")
    eq(Vim.normalizeKeys("<C-S-Tab>"),       "ctrl+shift+tab",
       "multi-modifier chord")
    eq(Vim.normalizeKeys("Q"),               "shift+q",
       "uppercase ASCII -> explicit shift")
    eq(Vim.normalizeKeys("gqq"),             "g q q",
       "bare key sequence")
    eq(Vim.normalizeKeys("<C-w>v"),          "ctrl+w v",
       "chord then bare char")
    eq(Vim.normalizeKeys(":w"),              ":w",
       "ex-command preserved as single token")
    eq(Vim.normalizeKeys(":%s/old/new/g"),   ":%s/old/new/g",
       "ex-command with slashes preserved")
    // Idempotence — canonical output must survive a second pass.
    const samples = ["h", "g g", "shift+g", "ctrl+w v", "shift+z shift+z",
                     "ctrl+shift+t", ":wq", "/"]
    for (const s of samples) {
        eq(Vim.normalizeKeys(s), Vim.normalizeKeys(Vim.normalizeKeys(s)),
           `idempotent on canonical form: ${s}`)
    }
})

describe("vim.parseConfig", ({ eq, truthy }) => {
    const parsed = Vim.parseConfig(vimFixture)
    const byKey  = Object.fromEntries(parsed.shortcuts.map(s => [s.keys, s]))

    truthy(byKey["<leader> f"],   "<leader>f mapping captured")
    truthy(byKey["ctrl+p"],       "<silent><C-p> captured (silent arg stripped)")
    truthy(byKey["j j"],          "imap jj captured")
    truthy(byKey["ctrl+c"],       "vmap <C-c> captured")
    truthy(byKey["ctrl+shift+tab"], "<C-S-Tab> captured")
    truthy(byKey["shift+q"],      "bare uppercase LHS Q expanded to shift+q")

    // <Plug> mappings must be skipped
    truthy(!parsed.shortcuts.find(s => s.action.includes("<Plug>")),
       "<Plug> RHS skipped")

    // lua heredoc must NOT contribute a mapping
    truthy(!byKey["ctrl+h"],
       "lua heredoc body ignored")

    // <Nop> disables and :unmap should appear in disabledKeys
    truthy(parsed.disabledKeys["space"],
       "<Nop> recorded as disabled")
    truthy(parsed.disabledKeys["<leader> q"],
       ":nunmap <leader>q recorded as disabled")

    // Line continuation must produce one shortcut, not two
    const x = byKey["<leader> x"]
    truthy(x && x.action.includes("hello world"),
       "backslash continuation joined into single map RHS")
})

describe("vim.categorize", ({ eq }) => {
    eq(Vim.categorize("yank"),           "editing",   "yank -> editing")
    eq(Vim.categorize(":w"),             "misc",      ":w -> misc")
    eq(Vim.categorize(":tabnew"),        "buffers & tabs", "tabnew -> buffers")
    eq(Vim.categorize(":split"),         "windows",   "split -> windows")
    eq(Vim.categorize(":%s/foo/bar/"),   "search & replace", "substitute -> search & replace")
})
