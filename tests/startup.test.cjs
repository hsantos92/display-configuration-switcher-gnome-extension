const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

// Execute the real menu controller with Shell UI and DisplayConfig stand-ins.
const source = fs.readFileSync(process.env.EXTENSION_SOURCE || path.join(__dirname, '../extension.js'), 'utf8')
    .replace(/^import .*;?\s*$/gm, '')
    .replace('export default class', 'class');
function fixture(ready) {
    const applied = [];
    const callbacks = {};
    const profile = ['Saved', 1, ['saved layout'], {}, [['DP-1', 'vendor', 'model', 'serial']]];
    class Item {
        constructor(label) { this.label = {get_clutter_text: () => ({set_line_wrap() {}})}; this.title = label; }
        connect(event, callback) { this[event] = callback; }
        setOrnament() {}
    }
    class Switcher {
        connect(event, callback) { callbacks[event] = callback; }
        hasState() { return ready; }
        getPhysicalDisplayInfo() { return ready ? [{id: profile[4][0]}] : null; }
        getMonitorsConfig() { return ready ? ['Current', 2, [], {}, profile[4]] : null; }
        applyMonitorsConfig(...args) { applied.push(args); }
    }
    const context = vm.createContext({
        GObject: {registerClass: cls => cls},
        QuickSettings: {QuickMenuToggle: class {
            _init() { this.menu = {items: [], setHeader() {}, removeAll() {this.items = [];}, addMenuItem(item) {this.items.push(item);}}; }
            connect() {}
        }},
        PopupMenu: {PopupMenuItem: Item, PopupImageMenuItem: Item, PopupSeparatorMenuItem: Item, Ornament: {CHECK: 1}},
        DisplayConfigSwitcher: Switcher, NameDialog: class {}, Extension: class {},
        Main: {wm: {removeKeybinding() {}}},
        ConfigIndex: {NAME: 0, HASH: 1, LOGICAL_MONITORS: 2, PROPERTIES: 3, PHYSICAL_DISPLAYS: 4},
        updateConfigHash() {}, _: value => value,
    });
    vm.runInContext(source + '\nglobalThis.Controller = DisplayConfigQuickMenuToggle;', context);
    const controller = new context.Controller();
    controller._init({getSettings: () => ({
        get_uint: () => 0, connect: () => 1, get_boolean: () => false,
        get_value: () => ({deepUnpack: () => [profile]}), set_uint() {},
    })});
    return {controller, applied, profile, stateChanged() { ready = true; callbacks['state-changed'](); }};
}
for (const ready of [true, false]) {
    test(`startup preserves current layout (DisplayConfig ready: ${ready})`, () => {
        const f = fixture(ready);
        assert.equal(f.applied.length, 0);
        f.stateChanged();
        f.stateChanged();
        f.controller._onConfigsChanged();
        assert.equal(f.applied.length, 0, 'state and settings changes must only refresh the menu');
    });
}
test('explicit menu selection still applies the saved profile', () => {
    const f = fixture(true);
    f.controller.menu.items.find(item => item.title === 'Saved').activate();
    assert.deepEqual(f.applied, [[f.profile[2], f.profile[3]]]);
});
test('toggle and both shortcut directions still apply profiles', () => {
    const f = fixture(true);
    f.controller._onClicked();
    f.controller._cycleConfig(true);
    f.controller._cycleConfig(false);
    assert.equal(f.applied.length, 3);
});
