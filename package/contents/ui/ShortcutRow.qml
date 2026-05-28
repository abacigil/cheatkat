import QtQuick
import QtQuick.Layouts

// One line of the cheatsheet: keys (as keycaps) + action text.
//
// The `keys` string follows a two-level format:
//   - chord tokens are joined with "+":   ctrl+shift+t
//   - distinct keypresses are joined with a space:   ctrl+w v
//
// We render chord tokens with a literal "+" between them and add a visible
// gap between keypresses, so "ctrl+w v" reads as "[Ctrl]+[W]  [V]".
Item {
    id: row

    property var theme: null
    property string fontFamily: "monospace"
    property int    fontSize: 11
    property string keys: ""
    property string action: ""
    property string source: "default"

    function isModifier(token) {
        var t = (token || "").toLowerCase()
        return t === "ctrl" || t === "shift" || t === "alt" || t === "meta"
    }

    // Flatten the keys string into a render list:
    //   [{kind:"key",text,modifier}, {kind:"plus"}, ..., {kind:"gap"}, ...]
    readonly property var keyAtoms: {
        if (!keys) return []
        var atoms = []
        var presses = String(keys).split(" ")
        for (var p = 0; p < presses.length; p++) {
            if (p > 0) atoms.push({ kind: "gap" })
            var chord = presses[p].split("+")
            for (var c = 0; c < chord.length; c++) {
                if (c > 0) atoms.push({ kind: "plus" })
                var tok = chord[c]
                atoms.push({ kind: "key", text: tok, modifier: isModifier(tok) })
            }
        }
        return atoms
    }

    implicitHeight: layout.implicitHeight + 6
    implicitWidth:  layout.implicitWidth

    Rectangle {
        id: hoverBg
        anchors.fill: parent
        anchors.leftMargin: -6
        anchors.rightMargin: -6
        radius: 6
        color: hover.hovered ? theme.surface0 : "transparent"
        opacity: hover.hovered ? 0.5 : 0
        Behavior on opacity { NumberAnimation { duration: 120 } }
    }

    HoverHandler { id: hover; cursorShape: Qt.ArrowCursor }

    RowLayout {
        id: layout
        anchors.verticalCenter: parent.verticalCenter
        anchors.left: parent.left
        anchors.right: parent.right
        spacing: 4

        // Indent under the category bullet
        Item { Layout.preferredWidth: 14; Layout.preferredHeight: 1 }

        Row {
            id: keysRow
            spacing: 3
            Layout.alignment: Qt.AlignVCenter

            Repeater {
                model: row.keyAtoms
                delegate: Loader {
                    property var atom: modelData
                    sourceComponent: atom.kind === "key"  ? keyCmp
                                  : atom.kind === "plus" ? plusCmp
                                                          : gapCmp

                    Component {
                        id: keyCmp
                        KeyCap {
                            text: atom.text || ""
                            modifier: atom.modifier || false
                            theme: row.theme
                            fontFamily: row.fontFamily
                            fontSize: row.fontSize
                        }
                    }
                    Component {
                        id: plusCmp
                        Text {
                            text: "+"
                            color: row.theme.overlay
                            font.family: row.fontFamily
                            font.pixelSize: row.fontSize
                            verticalAlignment: Text.AlignVCenter
                        }
                    }
                    Component {
                        id: gapCmp
                        Item { width: 8; height: 1 }
                    }
                }
            }
        }

        Item { Layout.preferredWidth: 8; Layout.preferredHeight: 1 }

        Text {
            text: row.action
            font.family: row.fontFamily
            font.pixelSize: row.fontSize
            color: theme.text
            Layout.fillWidth: true
            elide: Text.ElideRight
            renderType: Text.NativeRendering
        }

        Rectangle {
            visible: row.source === "user"
            color: "transparent"
            border.color: theme.green
            border.width: 1
            radius: 4
            Layout.preferredHeight: userTag.implicitHeight + 4
            Layout.preferredWidth: userTag.implicitWidth + 10
            Text {
                id: userTag
                anchors.centerIn: parent
                text: "user"
                font.family: row.fontFamily
                font.pixelSize: row.fontSize - 2
                color: theme.green
            }
        }
    }
}
