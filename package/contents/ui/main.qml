import QtQuick
import QtQuick.Layouts
import QtCore
import org.kde.plasma.plasmoid 2.0
import org.kde.plasma.core as PlasmaCore
import org.kde.plasma.plasma5support as P5Support
import "../code/shortcuts.js" as Shortcuts
import "../code/kitty.js" as Kitty
import "../code/vim.js" as Vim

PlasmoidItem {
    id: root

    Plasmoid.icon: Qt.resolvedUrl("../icons/cheatkat.svg")

    // --- Config-bound properties ---
    readonly property string flavor:          Plasmoid.configuration.flavor
    readonly property string fontFamily:      Plasmoid.configuration.fontFamily
    readonly property int    fontSize:        Plasmoid.configuration.fontSize
    readonly property string activeTool:      Plasmoid.configuration.activeTool
    readonly property bool   parseUserConf:   Plasmoid.configuration.parseUserConf
    readonly property string kittyConfPath:   Plasmoid.configuration.kittyConfPath
    readonly property string vimConfPaths:    Plasmoid.configuration.vimConfPaths
    readonly property bool   vimScanPlugins:  Plasmoid.configuration.vimScanPlugins
    readonly property string vimPluginDirs:   Plasmoid.configuration.vimPluginDirs
    readonly property bool   showTitleBar:    Plasmoid.configuration.showTitleBar
    readonly property bool   blinkCursor:     Plasmoid.configuration.blinkCursor

    // --- Theme ---
    property Theme theme: Theme { flavor: root.flavor }

    // --- Tool registry ---
    readonly property var tools: [
        {
            id: "all",
            displayName: "all",
            prompt: "cheatkat --all",
            module: null,
            configPaths: function () { return [] }
        },
        {
            id: Kitty.id,
            displayName: Kitty.displayName,
            prompt: Kitty.prompt,
            module: Kitty,
            configPaths: function () { return [kittyConfPath] }
        },
        {
            id: Vim.id,
            displayName: Vim.displayName,
            prompt: Vim.prompt,
            module: Vim,
            configPaths: function () { return splitPaths(vimConfPaths) }
        }
    ]

    // --- Data model ---
    property var groupsByTool: ({})

    // --- Layout sizing ---
    readonly property int gridUnit: 18
    preferredRepresentation: fullRepresentation
    Plasmoid.backgroundHints: PlasmaCore.Types.NoBackground
    Layout.preferredWidth:  gridUnit * 24
    Layout.preferredHeight: gridUnit * 28
    Layout.minimumWidth:    gridUnit * 18
    Layout.minimumHeight:   gridUnit * 16

    fullRepresentation: FullRepresentation {
        theme:         root.theme
        gridUnit:      root.gridUnit
        tools:         root.tools
        groupsByTool:  root.groupsByTool
        activeToolId:  root.activeTool
        onActiveToolIdRequested: function (id) {
            Plasmoid.configuration.activeTool = id
        }
    }

    compactRepresentation: CompactRepresentation {
        theme: root.theme
    }

    // --- File reading ---
    //
    // Qt 6 blocks XHR from reading file:// URLs, so we shell out via Plasma's
    // executable engine. Each subprocess invocation encodes a "tool" id and a
    // "kind" tag in the source string so onNewData can route the response.
    //
    // Kinds:
    //   - config        — the primary user config; probes paths sequentially,
    //                     first non-empty stdout wins (probeByTool tracks state)
    //   - plugins-vim   — vimscript plugin file scan, results merged additively
    //   - plugins-lua   — lua plugin file scan, results merged additively
    property var probeByTool: ({})

    P5Support.DataSource {
        id: catSource
        engine: "executable"
        connectedSources: []

        onNewData: function (sourceName, data) {
            disconnectSource(sourceName)
            var match = sourceName.match(/#\s*tool=(\S+)\s+kind=(\S+)/)
            if (!match) return
            var toolId = match[1]
            var kind   = match[2]
            var stdout = (data["stdout"] || "").toString()

            if (kind === "config") {
                var state = root.probeByTool[toolId]
                if (!state) return   // superseded by a newer reload
                if (stdout.length > 0) {
                    root.handleToolText(toolId, stdout)
                    delete root.probeByTool[toolId]
                    return
                }
                state.index++
                root.advanceProbe(toolId)
                return
            }

            if (kind === "plugins-vim" || kind === "plugins-lua") {
                var tool = root.findTool(toolId)
                if (!tool) return
                var parsed = (kind === "plugins-vim")
                    ? tool.module.parseConfig(stdout)
                    : tool.module.parseLuaConfig(stdout)
                root.appendPluginShortcuts(toolId, parsed)
                return
            }
        }

        function runConfig(toolId, path) {
            var safe = "'" + String(path).replace(/'/g, "'\\''") + "'"
            connectSource("cat -- " + safe + " # tool=" + toolId + " kind=config")
        }

        function runPluginVim(toolId, dirs) {
            // Find map lines in plugin/*.vim and after/plugin/*.vim across all
            // candidate plugin roots. Pre-grep before parsing so we don't ship
            // megabytes of vimscript to a JS regex parser.
            var dirArgs = dirs.map(function (d) {
                return "'" + d.replace(/'/g, "'\\''") + "'"
            }).join(" ")
            var cmd = "find " + dirArgs + " -type f \\( -path '*/plugin/*.vim' -o -path '*/after/plugin/*.vim' \\) 2>/dev/null"
                    + " | xargs -r grep -hE '^[[:space:]]*[nvxiscot]?(nore)?map\\b' 2>/dev/null"
                    + " | head -n 5000"
                    + " # tool=" + toolId + " kind=plugins-vim"
            connectSource(cmd)
        }

        function runPluginLua(toolId, dirs) {
            var dirArgs = dirs.map(function (d) {
                return "'" + d.replace(/'/g, "'\\''") + "'"
            }).join(" ")
            var cmd = "find " + dirArgs + " -type f -name '*.lua' \\( -path '*/plugin/*' -o -path '*/lua/*' \\) 2>/dev/null"
                    + " | xargs -r grep -hE 'vim\\.(keymap\\.set|api\\.nvim_set_keymap)' 2>/dev/null"
                    + " | head -n 5000"
                    + " # tool=" + toolId + " kind=plugins-lua"
            connectSource(cmd)
        }
    }

    function advanceProbe(toolId) {
        var state = probeByTool[toolId]
        if (!state) return
        if (state.index >= state.paths.length) {
            delete probeByTool[toolId]
            return
        }
        catSource.runConfig(toolId, expand(state.paths[state.index]))
    }

    // --- Helpers ---
    function splitPaths(csv) {
        if (!csv) return []
        return String(csv).split(",").map(function (p) { return p.trim() })
                          .filter(function (p) { return p.length > 0 })
    }

    function expand(p) {
        if (!p) return p
        if (p.indexOf("~") !== 0) return p
        var homeUrl = StandardPaths.writableLocation(StandardPaths.HomeLocation).toString()
        return homeUrl.replace(/^file:\/\//, "") + p.substring(1)
    }

    function buildDefaultGroups(tool) {
        var merged = Shortcuts.mergeWithDefaults(
            tool.module.DEFAULTS, null,
            tool.module.normalizeKeys,
            tool.module.categorize,
            tool.module.humanize
        )
        return Shortcuts.groupByCategory(merged, tool.module.CATEGORY_ORDER)
    }

    function setToolGroups(toolId, groups) {
        var copy = {}
        for (var k in root.groupsByTool) copy[k] = root.groupsByTool[k]
        copy[toolId] = groups
        root.groupsByTool = copy
    }

    function handleToolText(toolId, text) {
        var tool = findTool(toolId)
        if (!tool) return
        var parsed = text ? tool.module.parseConfig(text) : null
        var merged = Shortcuts.mergeWithDefaults(
            tool.module.DEFAULTS, parsed,
            tool.module.normalizeKeys,
            tool.module.categorize,
            tool.module.humanize
        )
        var grouped = Shortcuts.groupByCategory(merged, tool.module.CATEGORY_ORDER)
        setToolGroups(toolId, grouped)
    }

    // Append plugin-scanned shortcuts on top of the tool's existing groups.
    // User and default keys win — plugin entries with a duplicate key are
    // dropped so the tab doesn't show conflicting actions for the same key.
    function appendPluginShortcuts(toolId, parsed) {
        var tool = findTool(toolId)
        if (!tool || !parsed || !parsed.shortcuts || parsed.shortcuts.length === 0) return

        var existing = groupsByTool[toolId] || []
        var seenKeys = {}
        var flatList = []
        for (var g = 0; g < existing.length; g++) {
            var group = existing[g]
            for (var i = 0; i < group.items.length; i++) {
                var item = group.items[i]
                seenKeys[item.keys] = true
                flatList.push({
                    category: group.name,
                    keys: item.keys,
                    action: item.action,
                    source: item.source,
                    aliases: item.aliases
                })
            }
        }

        for (var p = 0; p < parsed.shortcuts.length; p++) {
            var s = parsed.shortcuts[p]
            if (seenKeys[s.keys]) continue
            seenKeys[s.keys] = true
            flatList.push({
                category: s.category || tool.module.categorize(s.actionToken || s.action),
                keys: s.keys,
                action: tool.module.humanize(s.action),
                source: "plugin"
            })
        }

        setToolGroups(toolId, Shortcuts.groupByCategory(flatList, tool.module.CATEGORY_ORDER))
    }

    function findTool(id) {
        for (var i = 0; i < tools.length; i++) {
            if (tools[i].id === id) return tools[i]
        }
        return null
    }

    function reloadTool(tool) {
        if (!tool || !tool.module) return
        setToolGroups(tool.id, buildDefaultGroups(tool))
        if (!parseUserConf) return

        var paths = tool.configPaths()
        if (paths && paths.length > 0) {
            probeByTool[tool.id] = { paths: paths, index: 0 }
            advanceProbe(tool.id)
        }

        // vim-only: scan plugin directories if enabled. Plugin results are
        // merged on top of whatever the user/default merge produces.
        if (tool.id === "vim" && vimScanPlugins) {
            var dirs = splitPaths(vimPluginDirs).map(expand)
            if (dirs.length > 0) {
                catSource.runPluginVim(tool.id, dirs)
                catSource.runPluginLua(tool.id, dirs)
            }
        }
    }

    function reloadAll() {
        for (var i = 0; i < tools.length; i++) reloadTool(tools[i])
    }

    Component.onCompleted: reloadAll()
    onParseUserConfChanged: reloadAll()
    onKittyConfPathChanged: reloadTool(findTool("kitty"))
    onVimConfPathsChanged:  reloadTool(findTool("vim"))
    onVimScanPluginsChanged: reloadTool(findTool("vim"))
    onVimPluginDirsChanged:  reloadTool(findTool("vim"))
}
