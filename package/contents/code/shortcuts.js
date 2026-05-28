.pragma library

// Generic merge / group / filter helpers shared across all tool modules.
//
// Each tool module owns its own defaults dataset, key normalizer, parser, and
// category order. This file is intentionally tool-agnostic.

// Merge bundled defaults with parsed user overrides.
//   defaults: [{ category, keys, action }, ...]
//   parsedUser: { shortcuts: [{keys, action, actionToken}], disabledKeys: {...} }
//   normalizeFn: function (keysString) -> canonical string
//   categorize: function (actionToken) -> category name (for user maps)
//   humanize:   function (action)      -> display string for user maps
function mergeWithDefaults(defaults, parsedUser, normalizeFn, categorize, humanize) {
    var userShortcuts = parsedUser ? (parsedUser.shortcuts || []) : []
    var disabled      = parsedUser ? (parsedUser.disabledKeys || {}) : {}

    var userKeySet = {}
    for (var i = 0; i < userShortcuts.length; i++) {
        userKeySet[userShortcuts[i].keys] = userShortcuts[i]
    }

    var merged = []

    for (var d = 0; d < defaults.length; d++) {
        var def = defaults[d]
        var normDef = normalizeFn(def.keys)
        if (userKeySet.hasOwnProperty(normDef)) continue
        if (disabled.hasOwnProperty(normDef))   continue
        merged.push({
            category: def.category,
            keys: normDef,
            action: def.action,
            aliases: def.aliases || null,
            source: "default"
        })
    }

    for (var u = 0; u < userShortcuts.length; u++) {
        var s = userShortcuts[u]
        merged.push({
            // Parser can pre-assign a category (e.g. <Plug> -> "plugins");
            // otherwise sniff from the action text.
            category: s.category || categorize(s.actionToken || s.action),
            keys: s.keys,
            action: humanize(s.action),
            aliases: s.aliases || null,
            // Parsers (vimrc / plugin scanner / Lua) can pre-assign source
            // and plugin attribution.
            source: s.source || "user",
            pluginName: s.pluginName || null
        })
    }

    return merged
}

// Group a flat shortcut list by category. Categories listed in
// `categoryOrder` come first, in that order; unknown categories follow.
function groupByCategory(list, categoryOrder) {
    var groups = {}
    for (var i = 0; i < list.length; i++) {
        var item = list[i]
        var cat = item.category || "misc"
        if (!groups[cat]) groups[cat] = []
        groups[cat].push(item)
    }
    var ordered = []
    var seen = {}
    for (var k = 0; k < categoryOrder.length; k++) {
        var name = categoryOrder[k]
        if (groups[name]) {
            ordered.push({ name: name, items: groups[name] })
            seen[name] = true
        }
    }
    for (var other in groups) {
        if (!seen[other]) ordered.push({ name: other, items: groups[other] })
    }
    return ordered
}

// Bidirectional synonym groups used by the filter. If the query touches any
// term in a group, the filter also matches the other terms in that group.
// Tool jargon (yank, write) lives next to its everyday equivalent (copy, save).
var SYNONYMS = [
    ["copy", "yank"],
    ["cut", "delete"],
    ["save", "write"],
    ["exit", "quit", "close"],
    ["forward", "next"],
    ["back", "backward", "previous", "prev"],
    ["split", "pane"],
    ["file", "buffer"],
    ["search", "find"],
    ["replace", "substitute"],
    ["paste", "put"],
    ["clipboard", "register"],
    ["bottom", "end"],
    ["top", "beginning", "start"],
    ["fullscreen", "maximize"],
    ["zoom", "font size"],
    ["help", "manual", "docs"],
    ["select", "highlight", "visual"],
    ["scroll", "page"],
    ["indent", "tab"],
    ["jump", "go", "goto"],
    ["undo", "revert"]
]

// Expand a free-text query into the list of terms to actually match against.
// Returns at least the query itself (lowercased & trimmed); plus, if the
// query overlaps with any synonym group, the sibling terms in that group.
function expandQuery(query) {
    var q = String(query || "").toLowerCase().trim()
    if (!q) return []
    var terms = [q]

    // Only expand for queries of at least 2 chars — otherwise tiny inputs
    // like "a" or "n" pull in every synonym group that happens to contain
    // those letters.
    if (q.length < 2) return terms

    for (var i = 0; i < SYNONYMS.length; i++) {
        var group = SYNONYMS[i]
        var hit = false
        for (var j = 0; j < group.length; j++) {
            if (group[j].indexOf(q) !== -1 || q.indexOf(group[j]) !== -1) {
                hit = true
                break
            }
        }
        if (!hit) continue
        for (var k = 0; k < group.length; k++) {
            if (terms.indexOf(group[k]) === -1) terms.push(group[k])
        }
    }
    return terms
}

// Filter a grouped list by a free-text query. Matches keys, action text,
// per-entry aliases, or the category name. Empty query passes through.
// Synonym groups (see SYNONYMS) make e.g. "copy" surface vim's yank bindings.
function filterGroups(grouped, query) {
    var terms = expandQuery(query)
    if (terms.length === 0) return grouped

    function matches(item, groupName) {
        for (var t = 0; t < terms.length; t++) {
            var term = terms[t]
            if (item.keys.indexOf(term) !== -1) return true
            if (item.action.toLowerCase().indexOf(term) !== -1) return true
            if (groupName.toLowerCase().indexOf(term) !== -1) return true
            if (item.aliases) {
                for (var a = 0; a < item.aliases.length; a++) {
                    if (item.aliases[a].toLowerCase().indexOf(term) !== -1) return true
                }
            }
        }
        return false
    }

    var out = []
    for (var i = 0; i < grouped.length; i++) {
        var g = grouped[i]
        var matched = g.items.filter(function (item) { return matches(item, g.name) })
        if (matched.length > 0) out.push({ name: g.name, items: matched })
    }
    return out
}
