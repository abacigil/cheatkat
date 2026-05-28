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
    "buffers & tabs", "search & replace", "misc"
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
// Skipped:
//   - lines whose RHS starts with <Plug>, <SID>, or contains uppercase-only
//     function refs that don't translate to actual keys
//   - Lua heredocs (`lua << EOF ... EOF`)
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
        // Skip plugin / SID maps — they aren't real keypresses you'd want shown
        if (/^<Plug>/i.test(rhs)) return
        if (/^<SID>/.test(rhs))   return
        if (rhs === "<Nop>" || rhs === "<nop>") {
            disabledKeys[normalizeKeys(parsedArgs.lhs)] = true
            return
        }

        var normKeys = normalizeKeys(parsedArgs.lhs)
        if (!normKeys) return

        // First "word" of the rhs is the action token used for categorization
        var firstToken = rhs.split(/[\s<]/)[0]
        shortcuts.push({
            keys: normKeys,
            action: rhs,
            actionToken: firstToken
        })
    }

    return { shortcuts: shortcuts, disabledKeys: disabledKeys }
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
