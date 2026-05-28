import QtQuick
import QtQuick.Layouts

// Terminal-style tab strip, modeled after kitty's powerline tabs. Sits below
// the title bar. Emits `tabSelected(id)` when a tab is clicked.
Item {
    id: strip

    property var theme: null
    property string fontFamily: "monospace"
    property int    fontSize: 11
    property var    tools: []
    property string activeId: ""

    signal tabSelected(string id)

    implicitHeight: 28

    Rectangle {
        anchors.fill: parent
        color: theme.crust
    }

    Row {
        anchors.fill: parent
        anchors.leftMargin: 8
        spacing: 0

        Repeater {
            model: strip.tools

            delegate: Item {
                id: tab
                readonly property bool isActive: modelData.id === strip.activeId

                width: label.implicitWidth + 32
                height: strip.height

                // Powerline-shaped background: rounded top corners + a slanted right edge.
                // The "slant" is rendered as an offset rectangle behind the next tab.
                Rectangle {
                    id: bg
                    anchors.fill: parent
                    anchors.bottomMargin: tab.isActive ? -1 : 0  // pull active flush with body
                    radius: 6
                    color: tab.isActive
                        ? theme.mauve
                        : (hover.hovered ? theme.surface0 : "transparent")
                    Behavior on color { ColorAnimation { duration: 100 } }

                    // Square off the bottom so it merges into the body
                    Rectangle {
                        anchors.left: parent.left
                        anchors.right: parent.right
                        anchors.bottom: parent.bottom
                        height: parent.height / 2
                        color: parent.color
                    }
                }

                Row {
                    anchors.centerIn: parent
                    spacing: 6

                    // Active-indicator dot — turns into a hollow circle on hover for inactive tabs
                    Rectangle {
                        width: 6; height: 6; radius: 3
                        anchors.verticalCenter: parent.verticalCenter
                        color: tab.isActive ? theme.crust
                                            : (hover.hovered ? theme.subtext : "transparent")
                        border.color: hover.hovered && !tab.isActive ? theme.subtext : "transparent"
                        border.width: 1
                    }

                    Text {
                        id: label
                        text: modelData.displayName
                        font.family: strip.fontFamily
                        font.pixelSize: strip.fontSize
                        font.bold: tab.isActive
                        color: tab.isActive ? theme.crust : theme.subtext
                        renderType: Text.NativeRendering
                    }
                }

                HoverHandler {
                    id: hover
                    cursorShape: Qt.PointingHandCursor
                }
                TapHandler {
                    onTapped: if (!tab.isActive) strip.tabSelected(modelData.id)
                }
            }
        }
    }

    // Thin underline that follows the active tab — purely decorative
    Rectangle {
        anchors.left: parent.left
        anchors.right: parent.right
        anchors.bottom: parent.bottom
        height: 1
        color: theme.surface1
    }
}
