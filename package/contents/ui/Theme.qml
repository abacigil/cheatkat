import QtQuick

// Catppuccin palette (https://github.com/catppuccin/catppuccin).
// Used as a non-singleton component: instantiate once in main.qml and
// reference colors as `root.theme.mauve`, etc.
QtObject {
    id: theme

    property string flavor: "mocha"

    readonly property var palettes: ({
        "mocha": {
            base:      "#1e1e2e",
            mantle:    "#181825",
            crust:     "#11111b",
            surface0:  "#313244",
            surface1:  "#45475a",
            surface2:  "#585b70",
            text:      "#cdd6f4",
            subtext:   "#a6adc8",
            overlay:   "#6c7086",
            mauve:     "#cba6f7",
            pink:      "#f5c2e7",
            red:       "#f38ba8",
            peach:     "#fab387",
            yellow:    "#f9e2af",
            green:     "#a6e3a1",
            teal:      "#94e2d5",
            sky:       "#89dceb",
            blue:      "#89b4fa",
            lavender:  "#b4befe"
        },
        "macchiato": {
            base:      "#24273a",
            mantle:    "#1e2030",
            crust:     "#181926",
            surface0:  "#363a4f",
            surface1:  "#494d64",
            surface2:  "#5b6078",
            text:      "#cad3f5",
            subtext:   "#b8c0e0",
            overlay:   "#7f849c",
            mauve:     "#c6a0f6",
            pink:      "#f5bde6",
            red:       "#ed8796",
            peach:     "#f5a97f",
            yellow:    "#eed49f",
            green:     "#a6da95",
            teal:      "#8bd5ca",
            sky:       "#91d7e3",
            blue:      "#8aadf4",
            lavender:  "#b7bdf8"
        },
        "frappe": {
            base:      "#303446",
            mantle:    "#292c3c",
            crust:     "#232634",
            surface0:  "#414559",
            surface1:  "#51576d",
            surface2:  "#626880",
            text:      "#c6d0f5",
            subtext:   "#b5bfe2",
            overlay:   "#838ba7",
            mauve:     "#ca9ee6",
            pink:      "#f4b8e4",
            red:       "#e78284",
            peach:     "#ef9f76",
            yellow:    "#e5c890",
            green:     "#a6d189",
            teal:      "#81c8be",
            sky:       "#99d1db",
            blue:      "#8caaee",
            lavender:  "#babbf1"
        },
        "latte": {
            base:      "#eff1f5",
            mantle:    "#e6e9ef",
            crust:     "#dce0e8",
            surface0:  "#ccd0da",
            surface1:  "#bcc0cc",
            surface2:  "#acb0be",
            text:      "#4c4f69",
            subtext:   "#5c5f77",
            overlay:   "#7c7f93",
            mauve:     "#8839ef",
            pink:      "#ea76cb",
            red:       "#d20f39",
            peach:     "#fe640b",
            yellow:    "#df8e1d",
            green:     "#40a02b",
            teal:      "#179299",
            sky:       "#04a5e5",
            blue:      "#1e66f5",
            lavender:  "#7287fd"
        }
    })

    readonly property var p: palettes[flavor] || palettes["mocha"]

    readonly property color base:     p.base
    readonly property color mantle:   p.mantle
    readonly property color crust:    p.crust
    readonly property color surface0: p.surface0
    readonly property color surface1: p.surface1
    readonly property color surface2: p.surface2
    readonly property color text:     p.text
    readonly property color subtext:  p.subtext
    readonly property color overlay:  p.overlay
    readonly property color mauve:    p.mauve
    readonly property color pink:     p.pink
    readonly property color red:      p.red
    readonly property color peach:    p.peach
    readonly property color yellow:   p.yellow
    readonly property color green:    p.green
    readonly property color teal:     p.teal
    readonly property color sky:      p.sky
    readonly property color blue:     p.blue
    readonly property color lavender: p.lavender
}
