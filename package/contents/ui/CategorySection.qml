import QtQuick
import QtQuick.Layouts

// A collapsible category of shortcuts. Header looks like:
//   ▸ tabs (7)
// Click the header to toggle.
Item {
    id: section

    property var theme: null
    property string fontFamily: "monospace"
    property int    fontSize: 11
    property string title: ""
    property var    items: []
    property bool   expanded: true

    implicitWidth: column.implicitWidth
    implicitHeight: column.implicitHeight

    Column {
        id: column
        width: section.width
        spacing: 2

        // Header
        Item {
            width: parent.width
            height: headerRow.implicitHeight + 6

            Rectangle {
                anchors.fill: parent
                anchors.leftMargin: -4
                anchors.rightMargin: -4
                radius: 4
                color: headerHover.hovered ? theme.surface0 : "transparent"
                opacity: 0.6
                Behavior on color { ColorAnimation { duration: 100 } }
            }

            HoverHandler { id: headerHover; cursorShape: Qt.PointingHandCursor }
            TapHandler { onTapped: section.expanded = !section.expanded }

            RowLayout {
                id: headerRow
                anchors.verticalCenter: parent.verticalCenter
                anchors.left: parent.left
                anchors.right: parent.right
                spacing: 6

                Text {
                    text: section.expanded ? "▾" : "▸"
                    font.family: section.fontFamily
                    font.pixelSize: section.fontSize
                    color: theme.mauve
                    Layout.preferredWidth: 12
                    Behavior on rotation { NumberAnimation { duration: 120 } }
                }

                Text {
                    text: section.title
                    font.family: section.fontFamily
                    font.pixelSize: section.fontSize
                    font.bold: true
                    color: theme.mauve
                }

                Text {
                    text: "(" + section.items.length + ")"
                    font.family: section.fontFamily
                    font.pixelSize: section.fontSize - 1
                    color: theme.overlay
                }

                Item { Layout.fillWidth: true }
            }
        }

        // Body — animated reveal
        Item {
            id: body
            width: parent.width
            clip: true
            height: section.expanded ? bodyColumn.implicitHeight + 4 : 0
            opacity: section.expanded ? 1 : 0
            Behavior on height  { NumberAnimation { duration: 180; easing.type: Easing.InOutQuad } }
            Behavior on opacity { NumberAnimation { duration: 140 } }

            Column {
                id: bodyColumn
                width: parent.width
                spacing: 0

                Repeater {
                    model: section.items
                    delegate: ShortcutRow {
                        width: bodyColumn.width
                        theme: section.theme
                        fontFamily: section.fontFamily
                        fontSize: section.fontSize
                        keys: modelData.keys
                        action: modelData.action
                        source: modelData.source
                    }
                }
            }
        }
    }
}
