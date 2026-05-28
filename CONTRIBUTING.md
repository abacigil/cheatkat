# Contributing to cheatkat

Thanks for your interest. This file covers the dev loop, the testing harness, and the most common contribution shape: adding a new tool tab.

## Dev loop

After cloning:

```bash
./install.sh
```

That installs the plasmoid into `~/.local/share/plasma/plasmoids/`. Plasma caches QML aggressively, so after every change, refresh plasmashell:

```bash
./install.sh
kquitapp6 plasmashell ; sleep 1 ; kstart plasmashell &
```

If `kquitapp6` doesn't fully exit the old process, fall back to `pkill -9 plasmashell` and then `kstart plasmashell &`. Right-click your desktop → **Add Widgets** → search "cheatkat".

### Where to look first

| Want to change…                              | Edit…                                                  |
| -------------------------------------------- | ------------------------------------------------------- |
| Bundled shortcuts for an existing tool       | `package/contents/code/<tool>.js` — `DEFAULTS` array    |
| Parser behavior for an existing tool         | same file — `parseConfig()` / `normalizeKeys()`         |
| Search synonyms                              | `package/contents/code/shortcuts.js` — `SYNONYMS`       |
| Terminal-window styling                      | `package/contents/ui/FullRepresentation.qml`            |
| Catppuccin palette                           | `package/contents/ui/Theme.qml`                         |
| Tab strip                                    | `package/contents/ui/TabStrip.qml`                      |
| Settings dialog                              | `package/contents/ui/configGeneral.qml` + `config/main.xml` |

## Running tests

```bash
node tests/run.js
```

The harness loads each QML JS module (`.pragma library` directives stripped), runs the `*.test.js` files next to it, and exits non-zero on any failure. Tests cover:

- `parser.test.js` — kitty + vim default normalization, `parseConfig` against fixtures (`tests/fixtures/`), idempotence of vim's normalizer, `<Plug>` / lua-heredoc skipping, `<Nop>` / `:unmap` behavior
- `search.test.js` — synonym expansion, `filterGroups` across multi-tool data, empty/whitespace queries

Please add tests when you add a tool module or extend the parser. Fixtures live in `tests/fixtures/`.

## Adding a new tool

A "tool" is a JS module exporting a common shape. Drop a new file at `package/contents/code/<tool>.js`:

```js
.pragma library

var id          = "fish"
var displayName = "fish"
var prompt      = "fish --help"
var configPaths = ["~/.config/fish/config.fish"]

var CATEGORY_ORDER = ["movement", "editing", "history", "misc"]

var DEFAULTS = [
    { category: "movement", keys: "ctrl+a", action: "beginning of line" },
    // ...
]

// Canonicalize a key sequence for this tool. Must be idempotent on its
// own output. See vim.js for the reference implementation.
function normalizeKeys(raw) { /* ... */ }

// Pick a category for a user-defined binding from its action text.
function categorize(actionToken) { /* ... */ }

// Convert the parser's raw action string into the display form.
function humanize(action) { /* ... */ }

// Parse the tool's config file body and return:
//   { shortcuts: [{keys, action, actionToken}], disabledKeys: {<key>: true} }
function parseConfig(text) { /* ... */ }
```

Then register it in `package/contents/ui/main.qml`:

```qml
import "../code/fish.js" as Fish

// add to the tools: [...] array, after Vim
{
    id: Fish.id,
    displayName: Fish.displayName,
    prompt: Fish.prompt,
    module: Fish,
    configPaths: function () { return [Plasmoid.configuration.fishConfPath] }
}
```

Add a matching `<entry>` to `package/contents/config/main.xml` for the config path, and expose a field for it in `package/contents/ui/configGeneral.qml` if appropriate.

Write tests:

- A fixture at `tests/fixtures/<tool>rc`
- A `tests/<tool>.test.js` covering the parser, normalizer, and at least one user-override case

## Code style notes

These aren't enforced by tooling, just conventions worth following:

- **QML**: don't use Kirigami.Units for spacing inside the terminal window — the widget keeps its own gridUnit to preserve terminal proportions across themes. Use Kirigami in `configGeneral.qml` (that's the settings page and should follow system styling).
- **JS modules** (under `package/contents/code/`): keep them framework-free. They're loaded by the test harness with `.pragma library` stripped — no QML types, no `Qt.*` globals.
- **Comments**: explain *why*, not *what*. Most code is straightforward; reserve comments for surprising decisions (e.g. why `normalizeKeys` must be idempotent, why ex-commands are one token).

## PR checklist

- [ ] `node tests/run.js` passes
- [ ] If you added a tool, also added a fixture + test file
- [ ] If you changed parser behavior, added a regression test for the case that motivated it
- [ ] Updated README's "Supported tools" table if applicable
- [ ] Commits have informative messages (squash before merging if needed)

## Reporting bugs

When opening an issue, include:

- Plasma version (`plasmashell --version`)
- Qt version (`qtdiag | head -3` if available)
- The relevant section of your kitty.conf / vimrc (sanitize as needed)
- A screenshot if it's visual
