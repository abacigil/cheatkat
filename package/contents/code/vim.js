.pragma library

// Tool module: vim / neovim.
//
// `keys` strings here use the same canonical lowercase + "+" form the kitty
// module uses, except that vim's native multi-key sequences are joined with
// a space (e.g. "ctrl+w v", "g g") so they stay readable as keycap chains.

var id          = "vim"
var displayName = "vim"
var prompt      = "vim --cheatsheet"
var configPaths = ["~/.vimrc", "~/.config/nvim/init.vim"]

var CATEGORY_ORDER = [
    "motion", "editing", "visual", "windows",
    "buffers & tabs", "search & replace", "plugins", "misc"
]

var DEFAULTS = [
    // motion
    { category: "motion", keys: "h",        action: "cursor left" },
    { category: "motion", keys: "j",        action: "cursor down" },
    { category: "motion", keys: "k",        action: "cursor up" },
    { category: "motion", keys: "l",        action: "cursor right" },
    { category: "motion", keys: "w",        action: "next word start" },
    { category: "motion", keys: "b",        action: "previous word start" },
    { category: "motion", keys: "e",        action: "word end" },
    { category: "motion", keys: "0",        action: "line start" },
    { category: "motion", keys: "$",        action: "line end" },
    { category: "motion", keys: "^",        action: "first non-blank" },
    { category: "motion", keys: "g g",      action: "top of file" },
    { category: "motion", keys: "shift+g",  action: "bottom of file" },
    { category: "motion", keys: "ctrl+d",   action: "half page down" },
    { category: "motion", keys: "ctrl+u",   action: "half page up" },
    { category: "motion", keys: "ctrl+f",   action: "page down" },
    { category: "motion", keys: "ctrl+b",   action: "page up" },
    { category: "motion", keys: "%",        action: "matching bracket" },
    { category: "motion", keys: "{",        action: "previous paragraph" },
    { category: "motion", keys: "}",        action: "next paragraph" },

    // editing
    { category: "editing", keys: "i",        action: "insert before cursor" },
    { category: "editing", keys: "a",        action: "insert after cursor" },
    { category: "editing", keys: "shift+i",  action: "insert at line start" },
    { category: "editing", keys: "shift+a",  action: "insert at line end" },
    { category: "editing", keys: "o",        action: "new line below" },
    { category: "editing", keys: "shift+o",  action: "new line above" },
    { category: "editing", keys: "x",        action: "delete char" },
    { category: "editing", keys: "d d",      action: "delete line" },
    { category: "editing", keys: "c c",      action: "change line" },
    { category: "editing", keys: "y y",      action: "yank line" },
    { category: "editing", keys: "p",        action: "paste after cursor" },
    { category: "editing", keys: "shift+p",  action: "paste before cursor" },
    { category: "editing", keys: "u",        action: "undo" },
    { category: "editing", keys: "ctrl+r",   action: "redo" },
    { category: "editing", keys: ".",        action: "repeat last change" },
    { category: "editing", keys: "r",        action: "replace single char" },
    { category: "editing", keys: ">",        action: "indent" },
    { category: "editing", keys: "<",        action: "dedent" },

    // visual mode
    { category: "visual", keys: "v",       action: "character visual" },
    { category: "visual", keys: "shift+v", action: "line visual" },
    { category: "visual", keys: "ctrl+v",  action: "block visual" },
    { category: "visual", keys: "g v",     action: "reselect last selection" },
    { category: "visual", keys: "=",       action: "auto-indent selection" },

    // windows (split management)
    { category: "windows", keys: "ctrl+w s", action: "horizontal split" },
    { category: "windows", keys: "ctrl+w v", action: "vertical split" },
    { category: "windows", keys: "ctrl+w h", action: "focus left window" },
    { category: "windows", keys: "ctrl+w j", action: "focus below window" },
    { category: "windows", keys: "ctrl+w k", action: "focus above window" },
    { category: "windows", keys: "ctrl+w l", action: "focus right window" },
    { category: "windows", keys: "ctrl+w c", action: "close window" },
    { category: "windows", keys: "ctrl+w o", action: "only this window" },
    { category: "windows", keys: "ctrl+w =", action: "equalize sizes" },
    { category: "windows", keys: "ctrl+w r", action: "rotate windows" },

    // buffers & tabs
    { category: "buffers & tabs", keys: ":bn",     action: "next buffer" },
    { category: "buffers & tabs", keys: ":bp",     action: "previous buffer" },
    { category: "buffers & tabs", keys: ":bd",     action: "delete buffer" },
    { category: "buffers & tabs", keys: ":ls",     action: "list buffers" },
    { category: "buffers & tabs", keys: "g t",     action: "next tab" },
    { category: "buffers & tabs", keys: "g shift+t", action: "previous tab" },
    { category: "buffers & tabs", keys: ":tabnew", action: "new tab" },
    { category: "buffers & tabs", keys: ":tabc",   action: "close tab" },

    // search & replace
    { category: "search & replace", keys: "/",            action: "search forward" },
    { category: "search & replace", keys: "?",            action: "search backward" },
    { category: "search & replace", keys: "n",            action: "next match" },
    { category: "search & replace", keys: "shift+n",      action: "previous match" },
    { category: "search & replace", keys: "*",            action: "search word under cursor" },
    { category: "search & replace", keys: ":%s/old/new/g", action: "replace all in file" },
    { category: "search & replace", keys: ":noh",         action: "clear search highlight" },

    // misc
    { category: "misc", keys: ":w",       action: "write file" },
    { category: "misc", keys: ":q",       action: "quit window" },
    { category: "misc", keys: ":wq",      action: "write + quit" },
    { category: "misc", keys: "shift+z shift+z", action: "write + quit shortcut" },
    { category: "misc", keys: ":q!",      action: "force quit (discard changes)" },
    { category: "misc", keys: ":e",       action: "open file" },
    { category: "misc", keys: "ctrl+g",   action: "show cursor position" },
    { category: "misc", keys: ":help",    action: "open help" }
]

// Normalize a vim key sequence (LHS of `nnoremap <C-p> ...`) into the
// canonical "ctrl+p" form used everywhere else. Distinct key presses are
// joined with a space; modifier chords use "+" inside a single token.
//
// The function is idempotent: feeding canonical output back in produces the
// same string. This matters because mergeWithDefaults runs the canonical
// strings from DEFAULTS through this function too.
//
// Examples:
//   "<C-p>"              -> "ctrl+p"
//   "<S-Tab>"            -> "shift+tab"
//   "<leader>fa"         -> "<leader> f a"   (leader kept as a chord token)
//   "gqq"                -> "g q q"
//   "<C-w>v"             -> "ctrl+w v"
//   "ctrl+w v"           -> "ctrl+w v"       (already canonical)
//   "shift+z shift+z"    -> "shift+z shift+z"
function normalizeKeys(raw) {
    if (!raw) return ""
    var s = String(raw).trim()
    // Whitespace splits distinct key presses. Each chunk is then either:
    //   - a canonical chord (contains '+', all preceding parts are mod names)
    //   - a vim-syntax fragment containing <...> and/or bare characters
    var chunks = s.split(/\s+/).filter(function (c) { return c.length > 0 })
    var tokens = []
    for (var i = 0; i < chunks.length; i++) {
        var chunk = chunks[i]
        if (isCanonicalChord(chunk)) {
            tokens.push(canonicalizeChord(chunk))
        } else {
            var sub = tokenizeFragment(chunk)
            for (var j = 0; j < sub.length; j++) tokens.push(sub[j])
        }
    }
    return tokens.join(" ")
}

function isCanonicalChord(chunk) {
    if (chunk.indexOf("+") === -1) return false
    var parts = chunk.toLowerCase().split("+")
    if (parts.length < 2) return false
    var validMods = { ctrl: 1, shift: 1, alt: 1, meta: 1 }
    // All parts before the last must be recognized modifier names.
    for (var i = 0; i < parts.length - 1; i++) {
        if (!validMods.hasOwnProperty(parts[i])) return false
    }
    return parts[parts.length - 1].length > 0
}

function canonicalizeChord(chunk) {
    var parts = chunk.toLowerCase().split("+")
    var key = parts[parts.length - 1]
    var mods = parts.slice(0, -1)
    var modOrder = { ctrl: 0, alt: 1, shift: 2, meta: 3 }
    mods.sort(function (a, b) { return modOrder[a] - modOrder[b] })
    return mods.concat([key]).join("+")
}

function tokenizeFragment(s) {
    // Ex commands (`:w`, `:%s/old/new/g`) and search commands (`/foo`, `?bar`)
    // are mentally one unit even though they're typed character by character.
    // Treat the whole chunk as a single token so we render one keycap, not
    // a strip of one-character chips.
    var first = s.charAt(0)
    if (first === ":" || first === "/" || first === "?") {
        return [s.toLowerCase()]
    }

    var tokens = []
    var i = 0
    while (i < s.length) {
        var ch = s[i]
        if (ch === "<") {
            var end = s.indexOf(">", i)
            if (end === -1) { tokens.push(ch); i++ }
            else {
                tokens.push(normalizeAngle(s.substring(i, end + 1)))
                i = end + 1
            }
        } else if (/[A-Z]/.test(ch)) {
            tokens.push("shift+" + ch.toLowerCase())
            i++
        } else {
            tokens.push(ch.toLowerCase())
            i++
        }
    }
    return tokens
}

// Convert "<C-p>", "<S-Tab>", "<A-x>", "<M-x>", "<leader>", "<CR>", etc.
// into a canonical token. Modifier chords use "+" inside a single token;
// distinct keystrokes stay space-separated.
function normalizeAngle(token) {
    var inner = token.replace(/^</, "").replace(/>$/, "")
    var lower = inner.toLowerCase()

    var specials = {
        "cr":        "enter",
        "return":    "enter",
        "esc":       "escape",
        "bs":        "backspace",
        "tab":       "tab",
        "space":     "space",
        "up":        "up",
        "down":      "down",
        "left":      "left",
        "right":     "right",
        "home":      "home",
        "end":       "end",
        "pageup":    "page_up",
        "pagedown":  "page_down",
        "del":       "delete",
        "insert":    "insert",
        "nl":        "newline",
        "leader":    "<leader>",
        "localleader": "<localleader>",
        "nop":       "<nop>"
    }
    if (specials.hasOwnProperty(lower)) return specials[lower]

    // Modifier chord: <C-x>, <S-Tab>, <A-x>, <M-x>, and combos like <C-S-x>.
    if (/^[csam](-[csam])*-./i.test(inner)) {
        var parts = inner.split("-")
        var key = parts.pop()
        var modMap = { c: "ctrl", s: "shift", a: "alt", m: "alt" }
        var mods = []
        for (var i = 0; i < parts.length; i++) {
            var m = modMap[parts[i].toLowerCase()]
            if (m && mods.indexOf(m) === -1) mods.push(m)
        }
        var keyToken = (specials[key.toLowerCase()] || key.toLowerCase())
        var modOrder = { ctrl: 0, alt: 1, shift: 2, meta: 3 }
        mods.sort(function (a, b) { return modOrder[a] - modOrder[b] })
        return mods.concat([keyToken]).join("+")
    }

    // Function keys: F1..F12
    if (/^f\d+$/i.test(inner)) return inner.toLowerCase()

    // Anything else (unknown <Tag>) — keep as-is, lowercased
    return "<" + lower + ">"
}

// Pick a category for a user-defined mapping by sniffing the right-hand side.
function categorize(action) {
    if (!action) return "misc"
    var a = String(action).toLowerCase()
    if (a === "plug")                           return "plugins"
    if (/^:?(w$|wq|sav|write)/.test(a))         return "misc"
    if (/^:?(q!?$|quit)/.test(a))               return "misc"
    if (/(buffer|tabnew|tabnext|tabprev|tabc|\bbn\b|\bbp\b|\bbd\b)/.test(a)) return "buffers & tabs"
    if (/(split|vsplit|wincmd|<c-w>|focus)/.test(a)) return "windows"
    if (/(search|substitute|^:?s\/|^:%s|nohl|noh)/.test(a)) return "search & replace"
    if (/(yank|paste|delete|change|undo|redo|insert|append|indent)/.test(a)) return "editing"
    if (/(visual|select)/.test(a)) return "visual"
    return "misc"
}

function humanize(action) {
    if (!action) return ""
    // Preserve the RHS pretty literally — it's already what the user typed.
    // Just unescape common Vim notation for readability.
    return String(action)
        .replace(/<CR>/g, "↵")
        .replace(/<Esc>/g, "Esc")
        .replace(/<Tab>/g, "Tab")
        .replace(/<Space>/g, "Space")
        .replace(/\s+/g, " ")
        .trim()
}

// Parse a vim/neovim config (vimrc-style). Handles common mapping commands:
//   :map / :noremap / :nmap / :nnoremap / :vmap / :vnoremap / :imap / :inoremap
//   :xmap, :xnoremap, :smap, :snoremap, :omap, :onoremap, :tmap, :tnoremap, :cmap, :cnoremap
//   :unmap / :nunmap / etc.  (treated as disable)
//
// Mapping args like <silent>, <buffer>, <expr>, <unique>, <nowait>, <special>
// are stripped from the lhs.
//
// <Plug> mappings are kept (the LHS is a real keypress) and routed to the
// "plugins" category, with the plug name as the action label.
//
// Skipped:
//   - lines whose RHS starts with <SID>... (plumbing, not a keypress)
//   - bare `<Nop>` RHS — recorded as a disabled key
//   - lua heredocs (`lua << EOF ... EOF`)
function parseConfig(text) {
    var shortcuts = []
    var disabledKeys = {}

    var lines = String(text || "").split(/\r?\n/)
    var inLuaBlock = false

    var pending = ""
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i]

        // Line continuation: a leading "\" continues the previous line in vimscript
        if (/^\s*\\/.test(line) && pending) {
            pending += " " + line.replace(/^\s*\\/, "").replace(/^\s+/, "")
            continue
        }
        if (pending) {
            processLine(pending)
            pending = ""
        }
        pending = line

        // Detect heredoc blocks like `lua << EOF`
        if (!inLuaBlock && /^\s*(lua|python|ruby|perl|js|node)\s*<<\s*(\S+)/i.test(line)) {
            inLuaBlock = true
            pending = ""
            continue
        }
        if (inLuaBlock) {
            if (/^\s*EOF\s*$/.test(line)) inLuaBlock = false
            pending = ""
            continue
        }
    }
    if (pending) processLine(pending)

    function processLine(rawLine) {
        var trimmed = rawLine.replace(/^\s+|\s+$/g, "")
        if (!trimmed) return
        if (trimmed.charAt(0) === '"') return       // vimscript comment
        if (/^\s*set\b/i.test(trimmed)) return      // option, not a mapping

        // Unmap forms — record disabled keys
        var unmapMatch = trimmed.match(
            /^\s*(?::?)(n|v|x|s|o|i|c|t|l)?un(map|abbreviate)!?\s+(.+)$/i
        )
        if (unmapMatch) {
            var lhsParts = stripMapArgs(unmapMatch[3].trim())
            disabledKeys[normalizeKeys(lhsParts.lhs)] = true
            return
        }

        // Generic map form: optional mode prefix, then map/noremap, optional !,
        // optional args, then LHS and RHS.
        var mapMatch = trimmed.match(
            /^\s*(?::?)([nvxsoictl]?)((?:nore)?map)!?\s+(.+)$/i
        )
        if (!mapMatch) return

        var rest = mapMatch[3]
        var parsedArgs = stripMapArgs(rest)
        if (!parsedArgs.lhs || !parsedArgs.rhs) return

        var rhs = parsedArgs.rhs.trim()

        // Skip LHS-side <Plug>/<SID> mappings — those are plugin-internal
        // endpoint *definitions*, not keypresses anyone types. They show up
        // when scanning plugin/*.vim files; the plugin uses them as named
        // handles for users to bind their own keys to.
        if (/^<plug>/i.test(parsedArgs.lhs)) return
        if (/^<sid>/i.test(parsedArgs.lhs)) return

        if (/^<SID>/.test(rhs)) return
        if (rhs === "<Nop>" || rhs === "<nop>") {
            disabledKeys[normalizeKeys(parsedArgs.lhs)] = true
            return
        }

        var normKeys = normalizeKeys(parsedArgs.lhs)
        if (!normKeys) return

        // `<Plug>(coc-definition)` style mappings: the RHS is an abstract
        // plugin endpoint, but the LHS *is* a real keypress the user types.
        // Surface the plug-name as the action, route to the "plugins"
        // category, and (when the plug name has a recognizable prefix)
        // attach a `pluginName` so the UI can show which plugin owns it.
        var plugMatch = rhs.match(/^<Plug>\(?([^)\s]+?)\)?\s*$/i)
        if (plugMatch) {
            var plugAction = plugMatch[1].trim()
            shortcuts.push({
                keys: normKeys,
                action: plugAction,
                actionToken: "plug",
                category: "plugins",
                pluginName: pluginNameFromPlug(plugAction)
            })
            return
        }

        var firstToken = rhs.split(/[\s<]/)[0]

        // If the RHS calls a known plugin Ex command (`:Files`, `:Git blame`,
        // `:VimwikiIndex`...), attach the owning plugin name and searchable
        // aliases so the binding is discoverable by plugin name in search.
        var attribution = commandAttribution(rhs)

        shortcuts.push({
            keys: normKeys,
            action: rhs,
            actionToken: firstToken,
            pluginName: attribution ? attribution.pluginName : null,
            aliases: attribution ? attribution.aliases : null
        })
    }

    return { shortcuts: shortcuts, disabledKeys: disabledKeys }
}

// Best-effort regex-based Lua parser for neovim keymap calls.
//
// Recognized patterns (single-line only — we don't do real Lua tokenization):
//   vim.keymap.set("n", "<C-p>", "...")
//   vim.keymap.set("n", "<C-p>", "...", { desc = "..." })
//   vim.keymap.set({"n", "v"}, "<C-p>", "...", ...)
//   vim.api.nvim_set_keymap("n", "<C-p>", "...", {})
//
// Explicitly NOT recognized (would need real parsing):
//   - lazy.nvim spec `keys = { { "key", "rhs" }, ... }`
//   - which-key.nvim `wk.register({...})`
//   - keymap calls split across multiple lines
//   - bindings whose lhs/rhs are variables instead of literals
//
// Returns the same shape as parseConfig.
function parseLuaConfig(text) {
    var shortcuts = []
    var disabledKeys = {}

    var lines = String(text || "").split(/\r?\n/)
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i]
        if (!line) continue

        var stripped = line.replace(/^\s+/, "").replace(/--.*$/, "")
        if (!stripped) continue

        // Capture either signature into shared groups.
        var m = stripped.match(
            // vim.keymap.set( <mode-expr>, "<key>", <rhs>, [opts] )
            /vim\.keymap\.set\s*\(\s*((?:"[^"]*"|'[^']*'|\{[^}]*\}))\s*,\s*("[^"]*"|'[^']*')\s*,\s*(.+?)(?:,\s*(\{[^}]*\}))?\s*\)/
        )
        if (!m) {
            m = stripped.match(
                // vim.api.nvim_set_keymap( "<mode>", "<key>", "<rhs>", [opts] )
                /vim\.api\.nvim_set_keymap\s*\(\s*("[^"]*"|'[^']*')\s*,\s*("[^"]*"|'[^']*')\s*,\s*("[^"]*"|'[^']*')\s*,\s*(\{[^}]*\})\s*\)/
            )
        }
        if (!m) continue

        var keysLit = stripQuotes(m[2])
        var rhsLit  = stripQuotes(m[3])
        var opts    = m[4] || ""

        if (!keysLit) continue

        var normKeys = normalizeKeys(keysLit)
        if (!normKeys) continue

        // If RHS is a function/table call instead of a quoted string, label it
        // explicitly so users know it's not directly inspectable.
        if (m[3].charAt(0) !== '"' && m[3].charAt(0) !== "'") {
            rhsLit = "<lua function>"
        }

        var descMatch = opts.match(/\bdesc\s*=\s*("[^"]*"|'[^']*')/)
        var actionText = descMatch ? stripQuotes(descMatch[1]) : rhsLit

        shortcuts.push({
            keys: normKeys,
            action: actionText,
            actionToken: actionText.split(/[\s<]/)[0],
            source: "user"
        })
    }

    return { shortcuts: shortcuts, disabledKeys: disabledKeys }
}

function stripQuotes(s) {
    if (!s) return ""
    s = String(s)
    var q = s.charAt(0)
    if ((q === '"' || q === "'") && s.charAt(s.length - 1) === q) {
        return s.substring(1, s.length - 1)
    }
    return s
}

// Pull a plugin name out of a `<Plug>` action label when there's a clear
// prefix delimiter. Returns null when the plug name isn't decomposable
// (e.g. "Dsurround" — vim-surround uses single-letter action prefixes that
// we can't reliably split without per-plugin knowledge).
//
//   "coc-definition"  -> "coc"
//   "fzf-files"       -> "fzf"
//   "fugitive:"       -> "fugitive"
//   "Dsurround"       -> null
function pluginNameFromPlug(plugAction) {
    if (!plugAction) return null
    var hyphen = plugAction.indexOf("-")
    if (hyphen > 0) return plugAction.substring(0, hyphen).toLowerCase()
    var colon = plugAction.indexOf(":")
    if (colon > 0) return plugAction.substring(0, colon).toLowerCase()
    return null
}

// Curated dictionary of vim Ex commands shipped by the major plugins, mapping
// each command name (case-sensitive — plugin commands conventionally start
// with an uppercase letter) to its owning plugin and a list of searchable
// aliases. When the user has a binding like `nnoremap <leader>f :Files<CR>`,
// we use this dict to attribute the binding to the fzf plugin and make it
// findable via search for "fzf", "fuzzy", "ripgrep", etc.
//
// Keep this list focused on the *most common* plugins. The widget is
// open-source — community contributions can grow it; this isn't meant to
// be exhaustive.
var KNOWN_COMMANDS = {
    // fzf / fzf.vim
    "Files":        { plugin: "fzf",      aliases: ["fzf", "fuzzy", "find"] },
    "GFiles":       { plugin: "fzf",      aliases: ["fzf", "git"] },
    "Buffers":      { plugin: "fzf",      aliases: ["fzf"] },
    "Lines":        { plugin: "fzf",      aliases: ["fzf"] },
    "BLines":       { plugin: "fzf",      aliases: ["fzf"] },
    "Marks":        { plugin: "fzf",      aliases: ["fzf"] },
    "History":      { plugin: "fzf",      aliases: ["fzf"] },
    "Helptags":     { plugin: "fzf",      aliases: ["fzf", "help"] },
    "Commands":     { plugin: "fzf",      aliases: ["fzf"] },
    "Snippets":     { plugin: "fzf",      aliases: ["fzf"] },
    "Commits":      { plugin: "fzf",      aliases: ["fzf", "git"] },
    "BCommits":     { plugin: "fzf",      aliases: ["fzf", "git"] },
    "Colors":       { plugin: "fzf",      aliases: ["fzf"] },
    "Filetypes":    { plugin: "fzf",      aliases: ["fzf"] },
    "Tags":         { plugin: "fzf",      aliases: ["fzf"] },
    "BTags":        { plugin: "fzf",      aliases: ["fzf"] },
    "Ag":           { plugin: "fzf",      aliases: ["fzf", "grep"] },
    "Rg":           { plugin: "fzf",      aliases: ["fzf", "grep", "ripgrep"] },
    "Locate":       { plugin: "fzf",      aliases: ["fzf"] },

    // vim-fugitive (and the leading-G alias spectrum)
    "G":            { plugin: "fugitive", aliases: ["git"] },
    "Git":          { plugin: "fugitive", aliases: ["git"] },
    "Gstatus":      { plugin: "fugitive", aliases: ["git"] },
    "Gblame":       { plugin: "fugitive", aliases: ["git", "blame"] },
    "Gdiff":        { plugin: "fugitive", aliases: ["git", "diff"] },
    "Gdiffsplit":   { plugin: "fugitive", aliases: ["git", "diff"] },
    "Gvdiffsplit":  { plugin: "fugitive", aliases: ["git", "diff"] },
    "Glog":         { plugin: "fugitive", aliases: ["git", "log"] },
    "Gcommit":      { plugin: "fugitive", aliases: ["git", "commit"] },
    "Gwrite":       { plugin: "fugitive", aliases: ["git", "stage"] },
    "Gread":        { plugin: "fugitive", aliases: ["git"] },

    // gitgutter
    "GitGutter":              { plugin: "gitgutter", aliases: ["git", "hunk"] },
    "GitGutterPreviewHunk":   { plugin: "gitgutter", aliases: ["git", "hunk"] },
    "GitGutterStageHunk":     { plugin: "gitgutter", aliases: ["git", "hunk", "stage"] },
    "GitGutterUndoHunk":      { plugin: "gitgutter", aliases: ["git", "hunk"] },
    "GitGutterNextHunk":      { plugin: "gitgutter", aliases: ["git", "hunk"] },
    "GitGutterPrevHunk":      { plugin: "gitgutter", aliases: ["git", "hunk"] },

    // nerdtree
    "NERDTree":         { plugin: "nerdtree", aliases: ["tree", "file-explorer", "sidebar"] },
    "NERDTreeToggle":   { plugin: "nerdtree", aliases: ["tree", "file-explorer", "sidebar"] },
    "NERDTreeFocus":    { plugin: "nerdtree", aliases: ["tree"] },
    "NERDTreeFind":     { plugin: "nerdtree", aliases: ["tree"] },
    "NERDTreeCWD":      { plugin: "nerdtree", aliases: ["tree"] },

    // vimwiki
    "VimwikiIndex":               { plugin: "vimwiki", aliases: ["wiki", "notes"] },
    "VimwikiTabIndex":            { plugin: "vimwiki", aliases: ["wiki", "notes"] },
    "VimwikiUISelect":            { plugin: "vimwiki", aliases: ["wiki"] },
    "VimwikiDiaryIndex":          { plugin: "vimwiki", aliases: ["wiki", "diary", "notes"] },
    "VimwikiDiaryGenerateLinks":  { plugin: "vimwiki", aliases: ["wiki", "diary"] },
    "VimwikiMakeDiaryNote":       { plugin: "vimwiki", aliases: ["wiki", "diary", "notes"] },
    "VimwikiTabMakeDiaryNote":    { plugin: "vimwiki", aliases: ["wiki", "diary"] },
    "VimwikiMakeYesterdayDiaryNote": { plugin: "vimwiki", aliases: ["wiki", "diary"] },
    "VimwikiMakeTomorrowDiaryNote":  { plugin: "vimwiki", aliases: ["wiki", "diary"] },
    "VimwikiBacklinks":           { plugin: "vimwiki", aliases: ["wiki", "links"] },
    "VimwikiTOC":                 { plugin: "vimwiki", aliases: ["wiki"] },
    "VimwikiSearch":              { plugin: "vimwiki", aliases: ["wiki", "search"] },
    "VimwikiSearchTags":          { plugin: "vimwiki", aliases: ["wiki", "tags"] },
    "VimwikiGoto":                { plugin: "vimwiki", aliases: ["wiki", "jump"] },
    "VimwikiTable":               { plugin: "vimwiki", aliases: ["wiki", "table"] },
    "VimwikiSplitLink":           { plugin: "vimwiki", aliases: ["wiki", "links"] },
    "VimwikiVSplitLink":          { plugin: "vimwiki", aliases: ["wiki", "links"] },
    "VimwikiGoBackLink":          { plugin: "vimwiki", aliases: ["wiki", "links"] },

    // CoC
    "CocList":          { plugin: "coc", aliases: ["lsp"] },
    "CocCommand":       { plugin: "coc", aliases: ["lsp"] },
    "CocAction":        { plugin: "coc", aliases: ["lsp"] },
    "CocActionAsync":   { plugin: "coc", aliases: ["lsp"] },
    "CocRestart":       { plugin: "coc", aliases: ["lsp"] },
    "CocInfo":          { plugin: "coc", aliases: ["lsp"] },
    "CocConfig":        { plugin: "coc", aliases: ["lsp"] },

    // vim-commentary
    "Commentary":   { plugin: "commentary", aliases: ["comment"] },

    // goyo / limelight
    "Goyo":            { plugin: "goyo",      aliases: ["focus", "zen"] },
    "Limelight":       { plugin: "limelight", aliases: ["focus", "dim"] },
    "LimelightToggle": { plugin: "limelight", aliases: ["focus", "dim"] },

    // table-mode
    "TableModeToggle": { plugin: "table-mode", aliases: ["table"] },
    "Tableize":        { plugin: "table-mode", aliases: ["table"] }
}

// Inspect the RHS of a user mapping and return { pluginName, aliases } if it
// invokes a known Ex command. Returns null otherwise. The first ":Command"
// token is what we look up — `<leader>g :Rg<CR>` resolves to fzf via "Rg".
function commandAttribution(rhs) {
    if (!rhs) return null
    var match = String(rhs).match(/:([A-Z]\w*)/)
    if (!match) return null
    var entry = KNOWN_COMMANDS[match[1]]
    return entry ? { pluginName: entry.plugin, aliases: entry.aliases } : null
}

// Strip `<silent>`, `<buffer>`, `<expr>`, `<unique>`, `<nowait>`, `<special>`
// from the start of a map argument string. Returns { lhs, rhs }.
function stripMapArgs(s) {
    var argPattern = /^\s*<(silent|buffer|expr|unique|nowait|special|script)>\s*/i
    var stripped = s
    while (argPattern.test(stripped)) {
        stripped = stripped.replace(argPattern, "")
    }
    // LHS is the first whitespace-delimited token; RHS is the rest.
    var idx = stripped.search(/\s/)
    if (idx === -1) return { lhs: stripped, rhs: "" }
    return {
        lhs: stripped.substring(0, idx),
        rhs: stripped.substring(idx).replace(/^\s+/, "")
    }
}
