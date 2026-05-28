import QtQuick
import QtQuick.Layouts
import QtQuick.Controls as Controls
import org.kde.plasma.plasmoid 2.0
import "../code/shortcuts.js" as Shortcuts

// Terminal-styled cheatsheet view, hosting a tab strip per tool.
//
// Data flows down via properties; clicks on the tab strip bubble up through
// activeToolIdRequested(id) so the parent owns config persistence.
Item {
    id: full

    property var theme: null
    property int gridUnit: 18
    property var tools: []           // [{id, displayName, prompt, module, ...}]
    property var groupsByTool: ({})  // toolId -> [{name, items}, ...]
    property string activeToolId: ""

    signal activeToolIdRequested(string id)

    readonly property string fontFamily:   Plasmoid.configuration.fontFamily
    readonly property int    fontSize:     Plasmoid.configuration.fontSize
    readonly property bool   blinkCursor:  Plasmoid.configuration.blinkCursor
    readonly property bool   showTitleBar: Plasmoid.configuration.showTitleBar

    readonly property var activeTool: {
        for (var i = 0; i < tools.length; i++) {
            if (tools[i].id === activeToolId) return tools[i]
        }
        return tools.length > 0 ? tools[0] : null
    }

    readonly property var activeGroups: {
        if (!activeTool) return []
        if (activeTool.id === "all") return buildAllGroups()
        return groupsByTool[activeTool.id] || []
    }

    // Aggregate every real tool's groups into one flat list, prefixing each
    // category name with the source tool so kitty's "windows" doesn't
    // collide visually with vim's "windows".
    function buildAllGroups() {
        var out = []
        for (var i = 0; i < tools.length; i++) {
            var t = tools[i]
            if (!t || t.id === "all" || !t.module) continue
            var gs = groupsByTool[t.id] || []
            for (var j = 0; j < gs.length; j++) {
                out.push({
                    name: t.displayName + " · " + gs[j].name,
                    items: gs[j].items
                })
            }
        }
        return out
    }

    property string searchQuery: ""
    property bool   searchVisible: false

    implicitWidth:  gridUnit * 24
    implicitHeight: gridUnit * 28

    // --- Window background ---
    Rectangle {
        id: window
        anchors.fill: parent
        radius: 10
        color: theme.base
        border.color: theme.surface1
        border.width: 1
        Rectangle {
            anchors.fill: parent
            anchors.margins: 1
            radius: 9
            color: "transparent"
            border.color: Qt.rgba(1, 1, 1, 0.03)
            border.width: 1
        }
    }

    // --- Title bar ---
    Item {
        id: titleBar
        visible: full.showTitleBar
        anchors.top: parent.top
        anchors.left: parent.left
        anchors.right: parent.right
        height: visible ? 30 : 0

        Rectangle {
            anchors.fill: parent
            color: theme.crust
            radius: 10
            Rectangle {
                anchors.left: parent.left
                anchors.right: parent.right
                anchors.bottom: parent.bottom
                height: parent.height / 2
                color: parent.color
            }
        }

        Row {
            anchors.left: parent.left
            anchors.leftMargin: 10
            anchors.verticalCenter: parent.verticalCenter
            spacing: 7
            Repeater {
                model: [theme.red, theme.yellow, theme.green]
                Rectangle { width: 12; height: 12; radius: 6; color: modelData }
            }
        }

        Text {
            anchors.centerIn: parent
            text: "~/cheatkat"
            color: theme.subtext
            font.family: full.fontFamily
            font.pixelSize: full.fontSize - 1
            renderType: Text.NativeRendering
        }

        Controls.AbstractButton {
            id: searchButton
            anchors.right: parent.right
            anchors.rightMargin: 10
            anchors.verticalCenter: parent.verticalCenter
            width: 22; height: 22
            hoverEnabled: true
            onClicked: {
                full.searchVisible = !full.searchVisible
                if (full.searchVisible) searchField.forceActiveFocus()
                else full.searchQuery = ""
            }
            background: Rectangle {
                anchors.fill: parent
                radius: 4
                color: searchButton.hovered ? theme.surface0 : "transparent"
            }
            contentItem: Text {
                anchors.centerIn: parent
                text: full.searchVisible ? "×" : "⌕"
                color: theme.subtext
                font.family: full.fontFamily
                font.pixelSize: full.fontSize + 2
                horizontalAlignment: Text.AlignHCenter
                verticalAlignment: Text.AlignVCenter
            }
        }
    }

    // --- Tab strip ---
    TabStrip {
        id: tabStrip
        anchors.top: titleBar.bottom
        anchors.left: parent.left
        anchors.right: parent.right
        theme:      full.theme
        fontFamily: full.fontFamily
        fontSize:   full.fontSize
        tools:      full.tools
        activeId:   full.activeToolId
        onTabSelected: function (id) { full.activeToolIdRequested(id) }
    }

    // --- Search bar ---
    Item {
        id: searchBar
        anchors.top: tabStrip.bottom
        anchors.left: parent.left
        anchors.right: parent.right
        clip: true
        height: full.searchVisible ? 36 : 0
        Behavior on height { NumberAnimation { duration: 160; easing.type: Easing.InOutQuad } }

        Rectangle { anchors.fill: parent; color: theme.mantle }

        Row {
            anchors.fill: parent
            anchors.margins: 6
            spacing: 6
            Text {
                text: "/"
                anchors.verticalCenter: parent.verticalCenter
                color: theme.peach
                font.family: full.fontFamily
                font.pixelSize: full.fontSize
                font.bold: true
            }
            Controls.TextField {
                id: searchField
                width: parent.width - 30
                anchors.verticalCenter: parent.verticalCenter
                placeholderText: "filter " + (full.activeTool ? full.activeTool.displayName : "")
                                 + " shortcuts"
                color: theme.text
                placeholderTextColor: theme.overlay
                font.family: full.fontFamily
                font.pixelSize: full.fontSize
                onTextChanged: full.searchQuery = text
                background: Rectangle { color: "transparent" }
                selectByMouse: true
            }
        }
    }

    // --- Body ---
    Flickable {
        id: scrollArea
        anchors.top: searchBar.bottom
        anchors.left: parent.left
        anchors.right: parent.right
        anchors.bottom: parent.bottom
        anchors.leftMargin: 14
        anchors.rightMargin: 14
        anchors.topMargin: 8
        anchors.bottomMargin: 8
        contentWidth: width
        contentHeight: bodyColumn.implicitHeight
        clip: true
        boundsBehavior: Flickable.StopAtBounds
        Controls.ScrollIndicator.vertical: Controls.ScrollIndicator { }

        Column {
            id: bodyColumn
            width: scrollArea.width
            spacing: 4

            // Per-tool opening prompt
            Row {
                spacing: 6
                Text {
                    text: "$"
                    color: theme.green
                    font.family: full.fontFamily
                    font.pixelSize: full.fontSize
                    font.bold: true
                }
                Text {
                    text: full.activeTool ? full.activeTool.prompt : ""
                    color: theme.text
                    font.family: full.fontFamily
                    font.pixelSize: full.fontSize
                }
            }

            Item { width: 1; height: 6 }

            Repeater {
                id: groupsRepeater
                model: Shortcuts.filterGroups(full.activeGroups, full.searchQuery)

                delegate: CategorySection {
                    width: bodyColumn.width
                    theme: full.theme
                    fontFamily: full.fontFamily
                    fontSize: full.fontSize
                    title: modelData.name
                    items: modelData.items
                    expanded: true
                }
            }

            Text {
                visible: groupsRepeater.count === 0
                text: full.searchQuery
                    ? "no matches for \"" + full.searchQuery + "\""
                    : "no shortcuts loaded — check the config path"
                color: theme.overlay
                font.family: full.fontFamily
                font.pixelSize: full.fontSize
                font.italic: true
            }

            Item { width: 1; height: 4 }

            // Trailing prompt with blinking cursor
            Row {
                spacing: 4
                Text {
                    text: "$"
                    color: theme.green
                    font.family: full.fontFamily
                    font.pixelSize: full.fontSize
                    font.bold: true
                }
                Rectangle {
                    id: cursor
                    width: full.fontSize * 0.55
                    height: full.fontSize + 2
                    color: theme.pink
                    anchors.verticalCenter: parent.verticalCenter
                    SequentialAnimation on opacity {
                        running: full.blinkCursor
                        loops: Animation.Infinite
                        NumberAnimation { to: 0; duration: 500 }
                        NumberAnimation { to: 1; duration: 500 }
                    }
                }
            }

            Item { width: 1; height: 8 }
        }
    }
}
