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

    // <Plug> RHS mappings are kept now (previously skipped). The LHS is a
    // real keypress; the action is synthesized from the <Plug> name.
    truthy(byKey["<leader> w"], "<Plug> map captured")
    eq(byKey["<leader> w"].action,   "easymotion-w", "Plug name extracted")
    eq(byKey["<leader> w"].category, "plugins",      "<Plug> routed to plugins category")

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
    eq(Vim.categorize("plug"),           "plugins",   "plug actionToken -> plugins")
})

describe("vim <Plug> mapping support", ({ eq, truthy }) => {
    const sample = [
        'nmap <silent> gd <Plug>(coc-definition)',
        'nmap <leader>rn <Plug>(coc-rename)',
        'nmap ds <Plug>Dsurround',
        'nmap <leader>f <Plug>fugitive:'
    ].join("\n")
    const parsed = Vim.parseConfig(sample)
    const byKey  = Object.fromEntries(parsed.shortcuts.map(s => [s.keys, s]))

    eq(parsed.shortcuts.length, 4,
       "all 4 <Plug> maps captured (previously all skipped)")
    eq(byKey["g d"].action,         "coc-definition", "paren-wrapped Plug name extracted")
    eq(byKey["g d"].category,       "plugins",        "routed to plugins category")
    eq(byKey["<leader> r n"].action, "coc-rename")
    eq(byKey["d s"].action,         "Dsurround",      "bare <Plug>Name (no parens) handled")
    eq(byKey["<leader> f"].action,  "fugitive:",      "trailing colon preserved")

    // pluginName attribution from the Plug action's prefix
    eq(byKey["g d"].pluginName,           "coc",      "coc-definition -> pluginName=coc")
    eq(byKey["<leader> r n"].pluginName,  "coc",      "hyphen prefix wins")
    eq(byKey["<leader> f"].pluginName,    "fugitive", "colon prefix wins when no hyphen")
    eq(byKey["d s"].pluginName ?? null,   null,
       "no decomposable prefix -> null (vim-surround style)")

    const sidParsed = Vim.parseConfig("nmap <leader>s <SID>foo")
    eq(sidParsed.shortcuts.length, 0, "<SID> RHS still skipped")
})

describe("vim Ex-command plugin attribution", ({ eq, truthy }) => {
    const sample = [
        'nnoremap <leader>f :Files<CR>',
        'nnoremap <leader>b :Buffers<CR>',
        'nnoremap <leader>g :Rg<CR>',
        'nnoremap <leader>gs :Git<CR>',
        'nnoremap <leader>gd :Gdiffsplit<CR>',
        'nnoremap <leader>e :NERDTreeToggle<CR>',
        'nnoremap <leader>ni :VimwikiIndex<CR>',
        'nnoremap <leader>w :w<CR>',           // built-in :w, no attribution
        'nnoremap <leader>x :SomeUnknownCommand<CR>'  // unknown, no attribution
    ].join("\n")

    const parsed = Vim.parseConfig(sample)
    const byKey  = Object.fromEntries(parsed.shortcuts.map(s => [s.keys, s]))

    eq(byKey["<leader> f"].pluginName, "fzf",      ":Files -> fzf")
    eq(byKey["<leader> b"].pluginName, "fzf",      ":Buffers -> fzf")
    eq(byKey["<leader> g"].pluginName, "fzf",      ":Rg -> fzf")
    eq(byKey["<leader> g s"].pluginName, "fugitive", ":Git -> fugitive")
    eq(byKey["<leader> g d"].pluginName, "fugitive", ":Gdiffsplit -> fugitive")
    eq(byKey["<leader> e"].pluginName, "nerdtree", ":NERDTreeToggle -> nerdtree")
    eq(byKey["<leader> n i"].pluginName, "vimwiki", ":VimwikiIndex -> vimwiki")

    truthy(byKey["<leader> g"].aliases.includes("ripgrep"),
        ":Rg picks up the 'ripgrep' alias so searching 'ripgrep' finds it")
    truthy(byKey["<leader> e"].aliases.includes("tree"),
        ":NERDTreeToggle aliased to 'tree'")

    eq(byKey["<leader> w"].pluginName ?? null, null,
        "built-in :w has no plugin attribution")
    eq(byKey["<leader> x"].pluginName ?? null, null,
        "unknown command has no plugin attribution")
})

describe("vim.parseLuaConfig", ({ eq, truthy }) => {
    const sample = [
        '-- comment',
        'vim.keymap.set("n", "<leader>ff", "<cmd>Telescope find_files<cr>", { desc = "Find files" })',
        'vim.keymap.set("n", "<C-s>", "<cmd>w<cr>")',
        'vim.keymap.set({"n", "v"}, "<leader>y", \'"+y\', { desc = "yank to clipboard" })',
        'vim.api.nvim_set_keymap("i", "jk", "<Esc>", { noremap = true })',
        'vim.keymap.set("n", "<leader>fn", function() require("telescope").find() end, { desc = "find with picker" })',
        'irrelevant.line()',
        'vim.keymap.set("n", "<C-x>", "<cmd>Bar<cr>") -- inline lua comment'
    ].join("\n")

    const parsed = Vim.parseLuaConfig(sample)
    const byKey  = Object.fromEntries(parsed.shortcuts.map(s => [s.keys, s]))

    truthy(byKey["<leader> f f"], "single-string mode keymap.set captured")
    eq(byKey["<leader> f f"].action, "Find files", "desc preferred over rhs")
    truthy(byKey["ctrl+s"],          "rhs used when no desc")
    eq(byKey["ctrl+s"].action,       "<cmd>w<cr>")
    truthy(byKey["<leader> y"],      "multi-mode {n,v} keymap.set captured")
    truthy(byKey["j k"],             "nvim_set_keymap captured")
    truthy(byKey["<leader> f n"],    "function rhs captured")
    eq(byKey["<leader> f n"].action, "<lua function>",
       "function references labeled distinctly")
    truthy(byKey["ctrl+x"],          "trailing comment doesn't break parse")
})
