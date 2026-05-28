import QtQuick
import QtQuick.Layouts
import org.kde.plasma.plasmoid 2.0

// Shown when the widget is docked in a panel. Renders a tiny terminal
// prompt; clicking it expands to the full cheatsheet.
Item {
    id: compact
    property var theme: null

    Layout.minimumWidth:  height
    Layout.minimumHeight: 22

    Rectangle {
        id: box
        anchors.fill: parent
        anchors.margins: 2
        radius: Math.min(width, height) * 0.2
        color: theme ? theme.base : "#1e1e2e"
        border.color: theme ? theme.mauve : "#cba6f7"
        border.width: 1
    }

    Text {
        anchors.centerIn: parent
        text: ">_"
        color: theme ? theme.green : "#a6e3a1"
        font.family: "monospace"
        font.bold: true
        font.pixelSize: Math.max(10, Math.floor(parent.height * 0.5))
    }

    MouseArea {
        anchors.fill: parent
        onClicked: Plasmoid.expanded = !Plasmoid.expanded
        cursorShape: Qt.PointingHandCursor
    }
}
