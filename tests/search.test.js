const { loadModule, describe } = require("./run")

const S      = loadModule("shortcuts.js")
const Kitty  = loadModule("kitty.js")
const Vim    = loadModule("vim.js")

function buildAllGroups() {
    const kMerged = S.mergeWithDefaults(
        Kitty.DEFAULTS, null, Kitty.normalizeKeys, Kitty.categorize, Kitty.humanize)
    const vMerged = S.mergeWithDefaults(
        Vim.DEFAULTS, null, Vim.normalizeKeys, Vim.categorize, Vim.humanize)
    const kGroups = S.groupByCategory(kMerged, Kitty.CATEGORY_ORDER)
    const vGroups = S.groupByCategory(vMerged, Vim.CATEGORY_ORDER)
    const all = []
    kGroups.forEach(g => all.push({ name: "kitty · " + g.name, items: g.items }))
    vGroups.forEach(g => all.push({ name: "vim · "   + g.name, items: g.items }))
    return all
}

function findItem(grouped, predicate) {
    for (const g of grouped) {
        for (const item of g.items) {
            if (predicate(item, g)) return { item, group: g }
        }
    }
    return null
}

describe("expandQuery", ({ eq, truthy }) => {
    eq(S.expandQuery(""),         [],
       "empty query expands to no terms")
    eq(S.expandQuery("a"),        ["a"],
       "single-char query does not trigger synonym expansion")
    truthy(S.expandQuery("copy").includes("yank"),
       "copy expands to yank")
    truthy(S.expandQuery("yank").includes("copy"),
       "yank expands to copy (bidirectional)")
    truthy(S.expandQuery("save").includes("write"),
       "save expands to write")
    truthy(S.expandQuery("exit").includes("quit") && S.expandQuery("exit").includes("close"),
       "exit expands to quit AND close")
    truthy(S.expandQuery("backward").includes("previous"),
       "backward expands to previous")
})

describe("filterGroups + synonyms", ({ truthy }) => {
    const all = buildAllGroups()

    const copyHit = S.filterGroups(all, "copy")
    truthy(findItem(copyHit, i => i.action.includes("copy to clipboard")),
        "search 'copy' finds kitty's copy to clipboard")
    truthy(findItem(copyHit, i => i.action.includes("yank")),
        "search 'copy' also finds vim's yank line via synonym")

    const saveHit = S.filterGroups(all, "save")
    truthy(findItem(saveHit, i => i.action === "write file" && i.keys === ":w"),
        "search 'save' finds vim's :w write file")

    const exitHit = S.filterGroups(all, "exit")
    truthy(findItem(exitHit, i => i.action.includes("quit window")),
        "search 'exit' finds vim's quit window")
    truthy(findItem(exitHit, g => g.action.includes("close tab")),
        "search 'exit' finds kitty's close tab")

    const cutHit = S.filterGroups(all, "cut")
    truthy(findItem(cutHit, i => i.action === "delete line"),
        "search 'cut' finds vim's delete line via synonym")

    const findHit = S.filterGroups(all, "find")
    truthy(findItem(findHit, i => i.action === "search forward"),
        "search 'find' finds vim's search forward")
    truthy(findItem(findHit, i => i.action === "search command output"),
        "search 'find' finds kitty's search command output")
})

describe("filterGroups empty / no-op behavior", ({ eq, truthy }) => {
    const all = buildAllGroups()
    eq(S.filterGroups(all, "").length, all.length,
       "empty query returns full list")
    eq(S.filterGroups(all, "   ").length, all.length,
       "whitespace-only query returns full list")
    eq(S.filterGroups(all, "_nothing_will_ever_match_this_xyz").length, 0,
       "query that matches nothing returns empty list")
})
