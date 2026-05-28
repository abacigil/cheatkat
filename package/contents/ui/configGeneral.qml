import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import org.kde.kirigami as Kirigami
import org.kde.kcmutils as KCM

// Plasma 6.5+ expects widget config pages to live inside a KCM container so
// the dialog's "Reset to defaults" plumbing and the `title` property have a
// home. A bare Kirigami.FormLayout used to render anyway in earlier 6.x but
// now fails to attach with:
//   QML FormLayout: Created graphical object was not placed in the graphics scene.
KCM.SimpleKCM {
    id: kcm

    // These cfg_<name> properties are auto-bound by Plasma's config system
    // to the matching <entry> in main.xml.
    property string cfg_flavor:         "mocha"
    property alias  cfg_fontFamily:     fontFamilyField.text
    property alias  cfg_fontSize:       fontSizeSpin.value
    property alias  cfg_parseUserConf:  parseUserConfBox.checked
    property alias  cfg_kittyConfPath:  kittyPathField.text
    property string cfg_vimConfPaths:   "~/.vimrc,~/.config/nvim/init.vim"
    property alias  cfg_vimScanPlugins: pluginScanBox.checked
    property string cfg_vimPluginDirs:  "~/.vim/plugged,~/.vim/pack,~/.local/share/nvim/site/pack,~/.local/share/nvim/lazy"

    Kirigami.FormLayout {
        id: form

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
                    if (model[i].value === kcm.cfg_flavor) {
                        currentIndex = i
                        return
                    }
                }
            }
            Component.onCompleted: syncFromConfig()
            onCurrentValueChanged: if (currentValue) kcm.cfg_flavor = currentValue
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
            text: kcm.cfg_vimConfPaths
            placeholderText: "~/.vimrc,~/.config/nvim/init.vim"
            enabled: parseUserConfBox.checked
            Layout.fillWidth: true
            Layout.minimumWidth: 320
            onTextChanged: kcm.cfg_vimConfPaths = text
        }

        Label {
            text: i18n("Comma-separated. First file that exists wins.")
            font.italic: true
            opacity: 0.7
            Layout.fillWidth: true
        }

        Item {
            Kirigami.FormData.isSection: true
            Kirigami.FormData.label: i18n("vim plugin keymaps")
        }

        CheckBox {
            id: pluginScanBox
            Kirigami.FormData.label: i18n("Scan plugins:")
            text: i18n("Include keymaps from installed vim/neovim plugins")
            enabled: parseUserConfBox.checked
        }

        TextField {
            id: vimPluginDirsField
            Kirigami.FormData.label: i18n("Plugin roots:")
            text: kcm.cfg_vimPluginDirs
            placeholderText: "~/.vim/plugged,~/.vim/pack,~/.local/share/nvim/site/pack,~/.local/share/nvim/lazy"
            enabled: parseUserConfBox.checked && pluginScanBox.checked
            Layout.fillWidth: true
            Layout.minimumWidth: 320
            onTextChanged: kcm.cfg_vimPluginDirs = text
        }

        Label {
            text: i18n("Walks plugin/*.vim, after/plugin/*.vim, and *.lua files. " +
                       "Lua coverage is best-effort (vim.keymap.set / nvim_set_keymap " +
                       "patterns); lazy.nvim spec and which-key are not yet supported.")
            font.italic: true
            opacity: 0.7
            wrapMode: Text.Wrap
            Layout.fillWidth: true
            Layout.maximumWidth: 380
        }

    }
}
