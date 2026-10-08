const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../dialog.js'), 'utf8')
    .replace(/^import .*;?\s*$/gm, '').replace('export const NameDialog', 'const NameDialog');
for (const modern of [true, false]) {
    test(`dialog initializes with ${modern ? 'GNOME 51' : 'legacy'} orientation API`, () => {
        class BoxLayout {
            constructor() { this.children = []; if (modern) this.orientation = 0; else this.vertical = false; }
            add_child(child) { this.children.push(child); }
        }
        const context = vm.createContext({
            Clutter: {Orientation: {VERTICAL: 1}, KEY_Escape: 9},
            GObject: {registerClass: cls => cls},
            St: {BoxLayout, Label: class {}, Entry: class {
                constructor() { this.clutter_text = {connect() {}}; }
            }},
            ModalDialog: {ModalDialog: class {
                _init() { this.contentLayout = {add_child: box => {this.box = box;}}; }
                setButtons(buttons) { this.buttons = buttons; }
                connect() {}
            }},
        });
        vm.runInContext(source + '\nglobalThis.Dialog = NameDialog;', context);
        const dialog = new context.Dialog();
        dialog._init();
        assert.equal(modern ? dialog.box.orientation : dialog.box.vertical, modern ? 1 : true);
        assert.equal(dialog.box.children.length, 2);
        assert.equal(dialog.buttons.length, 2);
        assert.equal(dialog.isValid(), false);
    });
}
