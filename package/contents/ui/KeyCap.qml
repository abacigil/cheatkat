import QtQuick

// A single "key" rendered as a styled chip. Used to display modifier and
// key tokens inside ShortcutRow.
Rectangle {
    id: cap

    property string text: ""
    property var theme: null
    property string fontFamily: "monospace"
    property int    fontSize: 11
    property bool   modifier: false

    implicitWidth: label.implicitWidth + 12
    implicitHeight: label.implicitHeight + 6
    radius: 4

    color: modifier ? theme.surface0 : theme.surface1
    border.color: modifier ? theme.surface2 : theme.overlay
    border.width: 1

    Text {
        id: label
        anchors.centerIn: parent
        text: prettify(cap.text)
        font.family: cap.fontFamily
        font.pixelSize: cap.fontSize
        font.bold: !cap.modifier
        color: cap.modifier ? theme.subtext : theme.text
        renderType: Text.NativeRendering
    }

    function prettify(t) {
        if (!t) return ""
        switch (t.toLowerCase()) {
            case "ctrl":       return "Ctrl"
            case "shift":      return "Shift"
            case "alt":        return "Alt"
            case "meta":       return "Meta"
            case "enter":      return "↵"
            case "escape":     return "Esc"
            case "backspace":  return "⌫"
            case "delete":     return "Del"
            case "tab":        return "Tab"
            case "space":      return "Space"
            case "up":         return "↑"
            case "down":       return "↓"
            case "left":       return "←"
            case "right":      return "→"
            case "home":       return "Home"
            case "end":        return "End"
            case "page_up":    return "PgUp"
            case "page_down":  return "PgDn"
            case "minus":      return "−"
            case "equal":      return "="
            case "underscore": return "_"
            default:
                if (t.length === 1) return t.toUpperCase()
                if (/^f\d+$/i.test(t)) return t.toUpperCase()
                return t
        }
    }
}
