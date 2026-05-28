import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import org.kde.kirigami as Kirigami

Kirigami.FormLayout {
    id: form

    // These cfg_<name> properties are auto-bound by Plasma's config system
    // to the matching <entry> in main.xml.
    property string cfg_flavor:        "mocha"
    property alias  cfg_fontFamily:    fontFamilyField.text
    property alias  cfg_fontSize:      fontSizeSpin.value
    property alias  cfg_parseUserConf: parseUserConfBox.checked
    property alias  cfg_kittyConfPath: kittyPathField.text
    property string cfg_vimConfPaths:  "~/.vimrc,~/.config/nvim/init.vim"
    property alias  cfg_showTitleBar:  titleBarBox.checked
    property alias  cfg_blinkCursor:   blinkBox.checked

    ComboBox {
        id: flavorBox
        Kirigami.FormData.label: i18n("Theme:")
        textRole: "label"
        valueRole: "value"
        model: [
            { value: "mocha",     label: "Mocha (dark)" },
            { value: "macchiato", label: "Macchiato" },
            { value: "frappe",    label: "Frappé" },
            { value: "latte",     label: "Latte (light)" }
        ]
        function syncFromConfig() {
            for (var i = 0; i < count; i++) {
                if (model[i].value === form.cfg_flavor) {
                    currentIndex = i
                    return
                }
            }
        }
        Component.onCompleted: syncFromConfig()
        onCurrentValueChanged: if (currentValue) form.cfg_flavor = currentValue
    }

    TextField {
        id: fontFamilyField
        Kirigami.FormData.label: i18n("Font family:")
        placeholderText: "JetBrains Mono"
        Layout.fillWidth: true
    }

    SpinBox {
        id: fontSizeSpin
        Kirigami.FormData.label: i18n("Font size:")
        from: 8
        to: 24
    }

    Item {
        Kirigami.FormData.isSection: true
        Kirigami.FormData.label: i18n("Tool config sources")
    }

    CheckBox {
        id: parseUserConfBox
        Kirigami.FormData.label: i18n("Parse user configs:")
        text: i18n("Merge each tool's user config on top of bundled defaults")
    }

    TextField {
        id: kittyPathField
        Kirigami.FormData.label: i18n("kitty.conf:")
        placeholderText: "~/.config/kitty/kitty.conf"
        enabled: parseUserConfBox.checked
        Layout.fillWidth: true
        Layout.minimumWidth: 320
    }

    TextField {
        id: vimPathsField
        Kirigami.FormData.label: i18n("vim configs:")
        text: form.cfg_vimConfPaths
        placeholderText: "~/.vimrc,~/.config/nvim/init.vim"
        enabled: parseUserConfBox.checked
        Layout.fillWidth: true
        Layout.minimumWidth: 320
        onTextChanged: form.cfg_vimConfPaths = text
    }

    Label {
        text: i18n("Comma-separated. First file that exists wins.")
        font.italic: true
        opacity: 0.7
        Layout.fillWidth: true
    }

    Item {
        Kirigami.FormData.isSection: true
        Kirigami.FormData.label: i18n("Appearance")
    }

    CheckBox {
        id: titleBarBox
        Kirigami.FormData.label: i18n("Title bar:")
        text: i18n("Show terminal title bar with traffic lights")
    }

    CheckBox {
        id: blinkBox
        Kirigami.FormData.label: i18n("Cursor:")
        text: i18n("Blink the trailing prompt cursor")
    }
}
