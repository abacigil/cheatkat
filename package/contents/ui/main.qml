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
    readonly property string flavor:        Plasmoid.configuration.flavor
    readonly property string fontFamily:    Plasmoid.configuration.fontFamily
    readonly property int    fontSize:      Plasmoid.configuration.fontSize
    readonly property string activeTool:    Plasmoid.configuration.activeTool
    readonly property bool   parseUserConf: Plasmoid.configuration.parseUserConf
    readonly property string kittyConfPath: Plasmoid.configuration.kittyConfPath
    readonly property string vimConfPaths:  Plasmoid.configuration.vimConfPaths
    readonly property bool   showTitleBar:  Plasmoid.configuration.showTitleBar
    readonly property bool   blinkCursor:   Plasmoid.configuration.blinkCursor

    // --- Theme ---
    property Theme theme: Theme { flavor: root.flavor }

    // --- Tool registry ---
    // The first entry is a synthetic "all" view that aggregates every real
    // tool's groups. Real tool entries follow and own a JS module + config
    // paths. The order here drives the tab strip order.
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
    // groupsByTool["kitty"] = [{name, items}, ...]
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
    // Qt 6 blocks XHR from reading file:// URLs, so we shell out via
    // Plasma's executable engine. One DataSource is enough — we route
    // responses by tool id encoded into the source string.
    P5Support.DataSource {
        id: catSource
        engine: "executable"
        connectedSources: []

        onNewData: function (sourceName, data) {
            disconnectSource(sourceName)
            var stdout = (data["stdout"] || "").toString()
            // sourceName looks like:  "cat -- '/path' # tool=kitty"
            var match = sourceName.match(/#\s*tool=(\S+)/)
            if (match) handleToolText(match[1], stdout)
        }

        function load(toolId, path) {
            var safe = "'" + String(path).replace(/'/g, "'\\''") + "'"
            connectSource("cat -- " + safe + " # tool=" + toolId)
        }
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

    // Build groups from defaults only (used as a fallback if parsing is off
    // or the user's config file isn't readable).
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

    function findTool(id) {
        for (var i = 0; i < tools.length; i++) {
            if (tools[i].id === id) return tools[i]
        }
        return null
    }

    function reloadTool(tool) {
        if (!tool || !tool.module) return  // skip synthetic tools ("all")
        // Always seed with defaults so the tab isn't empty while cat runs.
        setToolGroups(tool.id, buildDefaultGroups(tool))
        if (!parseUserConf) return
        var paths = tool.configPaths()
        if (!paths || paths.length === 0) return
        // Try each candidate path; the executable engine returns empty stdout
        // for a missing file, and we keep the defaults in that case.
        for (var i = 0; i < paths.length; i++) {
            catSource.load(tool.id, expand(paths[i]))
        }
    }

    function reloadAll() {
        for (var i = 0; i < tools.length; i++) reloadTool(tools[i])
    }

    Component.onCompleted: reloadAll()
    onParseUserConfChanged: reloadAll()
    onKittyConfPathChanged: reloadTool(findTool("kitty"))
    onVimConfPathsChanged:  reloadTool(findTool("vim"))
}
