.pragma library

// Tool module: kitty (https://sw.kovidgoyal.net/kitty/).
//
// Exports the canonical structure consumed by main.qml:
//   id, displayName, prompt, configPaths, DEFAULTS, CATEGORY_ORDER,
//   parseConfig(text), normalizeKeys(raw), categorize(token), humanize(action)

var id          = "kitty"
var displayName = "kitty"
var prompt      = "kitty --shortcuts"
var configPaths = ["~/.config/kitty/kitty.conf"]

var CATEGORY_ORDER = [
    "tabs", "windows", "scrolling", "copy & paste", "font size", "misc"
]

var DEFAULTS = [
    { category: "tabs", keys: "ctrl+shift+t",      action: "new tab" },
    { category: "tabs", keys: "ctrl+shift+q",      action: "close tab" },
    { category: "tabs", keys: "ctrl+shift+right",  action: "next tab" },
    { category: "tabs", keys: "ctrl+shift+left",   action: "previous tab" },
    { category: "tabs", keys: "ctrl+shift+.",      action: "move tab forward" },
    { category: "tabs", keys: "ctrl+shift+,",      action: "move tab backward" },
    { category: "tabs", keys: "ctrl+shift+alt+t",  action: "set tab title" },

    { category: "windows", keys: "ctrl+shift+enter", action: "new window" },
    { category: "windows", keys: "ctrl+shift+n",     action: "new os window" },
    { category: "windows", keys: "ctrl+shift+w",     action: "close window" },
    { category: "windows", keys: "ctrl+shift+]",     action: "next window" },
    { category: "windows", keys: "ctrl+shift+[",     action: "previous window" },
    { category: "windows", keys: "ctrl+shift+f7",    action: "move window forward" },
    { category: "windows", keys: "ctrl+shift+f8",    action: "swap with window" },
    { category: "windows", keys: "ctrl+shift+r",     action: "resize window" },
    { category: "windows", keys: "ctrl+shift+l",     action: "next layout" },

    { category: "scrolling", keys: "ctrl+shift+up",        action: "scroll line up" },
    { category: "scrolling", keys: "ctrl+shift+down",      action: "scroll line down" },
    { category: "scrolling", keys: "ctrl+shift+page_up",   action: "scroll page up" },
    { category: "scrolling", keys: "ctrl+shift+page_down", action: "scroll page down" },
    { category: "scrolling", keys: "ctrl+shift+home",      action: "scroll to top" },
    { category: "scrolling", keys: "ctrl+shift+end",       action: "scroll to bottom" },
    { category: "scrolling", keys: "ctrl+shift+z",         action: "scroll to previous prompt" },
    { category: "scrolling", keys: "ctrl+shift+x",         action: "scroll to next prompt" },
    { category: "scrolling", keys: "ctrl+shift+h",         action: "show scrollback in pager" },
    { category: "scrolling", keys: "ctrl+shift+g",         action: "show last command output" },

    { category: "copy & paste", keys: "ctrl+shift+c", action: "copy to clipboard" },
    { category: "copy & paste", keys: "ctrl+shift+v", action: "paste from clipboard" },
    { category: "copy & paste", keys: "ctrl+shift+s", action: "paste from selection" },
    { category: "copy & paste", keys: "ctrl+shift+o", action: "pass selection to program" },

    { category: "font size", keys: "ctrl+shift+=",         action: "increase font size" },
    { category: "font size", keys: "ctrl+shift+minus",     action: "decrease font size" },
    { category: "font size", keys: "ctrl+shift+backspace", action: "reset font size" },

    { category: "misc", keys: "ctrl+shift+e",      action: "open url" },
    { category: "misc", keys: "ctrl+shift+f5",     action: "reload kitty.conf" },
    { category: "misc", keys: "ctrl+shift+f2",     action: "edit kitty.conf" },
    { category: "misc", keys: "ctrl+shift+f11",    action: "toggle fullscreen" },
    { category: "misc", keys: "ctrl+shift+f10",    action: "toggle maximize" },
    { category: "misc", keys: "ctrl+shift+u",      action: "unicode input" },
    { category: "misc", keys: "ctrl+shift+/",      action: "search command output" },
    { category: "misc", keys: "ctrl+shift+escape", action: "kitty shell" },
    { category: "misc", keys: "ctrl+shift+delete", action: "clear screen + scrollback" }
]

// Normalize a kitty keybinding string into a canonical form so that
// "Ctrl+Shift+T", "shift+ctrl+t", and "kitty_mod+t" all match.
function normalizeKeys(raw, kittyMod) {
    if (!raw) return ""
    var s = String(raw).toLowerCase().trim()
    s = s.replace(/\s+/g, "+").replace(/\++/g, "+")
    if (kittyMod) s = s.replace(/\bkitty_mod\b/g, kittyMod)

    var parts = s.split("+").map(function (p) {
        switch (p) {
            case "control": return "ctrl"
            case "cmd":
            case "command":
            case "super":  return "meta"
            case "option": return "alt"
            case "return": return "enter"
            case "esc":    return "escape"
            case "del":    return "delete"
            case "ins":    return "insert"
            case "pgup":   return "page_up"
            case "pgdn":   return "page_down"
            case "-":      return "minus"
            case "_":      return "underscore"
            default:       return p
        }
    })
    var modOrder = { ctrl: 0, alt: 1, shift: 2, meta: 3 }
    var mods = [], rest = []
    parts.forEach(function (p) {
        if (modOrder.hasOwnProperty(p)) mods.push(p)
        else rest.push(p)
    })
    mods.sort(function (a, b) { return modOrder[a] - modOrder[b] })
    return mods.concat(rest).join("+")
}

function categorize(action) {
    if (!action) return "misc"
    var a = String(action).toLowerCase()
    if (/tab/.test(a)) return "tabs"
    if (/window|layout/.test(a)) return "windows"
    if (/scroll|show_scrollback|show_last_command/.test(a)) return "scrolling"
    if (/copy|paste|clipboard|selection/.test(a)) return "copy & paste"
    if (/font/.test(a)) return "font size"
    return "misc"
}

function humanize(action) {
    if (!action) return ""
    return String(action).replace(/_/g, " ").replace(/\s+/g, " ").trim()
}

// Parse a kitty.conf body. Handles:
//   kitty_mod ctrl+shift
//   map <keys> <action...>
//   map <keys> no_op
//   line continuation via trailing backslash
//   # comments
function parseConfig(text) {
    var kittyMod = "ctrl+shift"
    var rawMaps = []

    var lines = String(text || "").split(/\r?\n/)
    var pending = ""

    for (var i = 0; i < lines.length; i++) {
        var line = lines[i]
        if (pending) {
            line = pending + " " + line.replace(/^\s+/, "")
            pending = ""
        }
        if (/\\\s*$/.test(line)) {
            pending = line.replace(/\\\s*$/, "")
            continue
        }
        var trimmed = line.replace(/^\s+|\s+$/g, "")
        if (!trimmed || trimmed.charAt(0) === "#") continue

        var modMatch = trimmed.match(/^kitty_mod\s+(.+)$/i)
        if (modMatch) {
            kittyMod = modMatch[1].toLowerCase().trim()
            continue
        }
        var mapMatch = trimmed.match(/^map\s+(\S+)\s+(.+)$/i)
        if (mapMatch) {
            rawMaps.push({ keys: mapMatch[1], action: mapMatch[2].trim() })
        }
    }

    var shortcuts = []
    var disabledKeys = {}
    for (var j = 0; j < rawMaps.length; j++) {
        var m = rawMaps[j]
        var normKeys = normalizeKeys(m.keys, kittyMod)
        if (/^no_op\b/i.test(m.action)) {
            disabledKeys[normKeys] = true
            continue
        }
        var firstToken = m.action.split(/\s+/)[0]
        shortcuts.push({
            keys: normKeys,
            action: m.action,
            actionToken: firstToken
        })
    }

    return { shortcuts: shortcuts, disabledKeys: disabledKeys, kittyMod: kittyMod }
}
