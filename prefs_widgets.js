/* 
pref_widgets.js
Copyright (C) 2024 Christophe Van den Abbeele

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

import Adw from 'gi://Adw';
import Gdk from 'gi://Gdk';
import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk';

export class PrefsWidgets {
    /**
     * Row widget class for displaying and editing configuration in the preferences window
     * 
     * @type {?function}
     */
    static #ConfigRow = null;
    /**
     * Drag widget class to display when dragging a ConfigRow
     * 
     * @type {?function}
     */
    static #ConfigRowDragWidget = null;
    /**
     * Dialog class for modifying a keyboard shortcut
     * 
     * @type {?function}
     */
    static #ShortcutDialog = null;
    /**
     * Dialog for modifying a keyboard shortcut
     * 
     * @type {?ShortcutDialog}
     */
    static #shortcutDialog = null;
    /**
     * Row widget class for displaying and modifying keyboard shortcut
     * 
     * @type {?function} 
     */
    static #ShortcutRow = null;

    static initialize() {
        this.#ConfigRowDragWidget = GObject.registerClass({
            GTypeName: 'ConfigRowDragWidget',
            Template: 'resource:///org/gnome/Shell/Extensions/display-configuration-switcher/ui/config_row_drag_widget.ui',
            Children: ['entryRow'],
        }, class ConfigRowDragWidget extends Gtk.ListBox {
            constructor(text, title) {
                super();
                this.entryRow.text = text;
                this.entryRow.title = title;
            }           
        });

        this.#ConfigRow = GObject.registerClass({
            GTypeName: 'ConfigRow',
            Signals: {
                'remove-clicked': {},
            },
            Template: 'resource:///org/gnome/Shell/Extensions/display-configuration-switcher/ui/config_row.ui',
            Children: ['infoLabel'],
        }, class ConfigRow extends Adw.EntryRow {
            constructor(props) {
                super(props);
                this.show_apply_button = true;
            }

            setupDragAndDrop(list, index) {
                const dropController = new Gtk.DropControllerMotion();
                const dragSource = new Gtk.DragSource({
                    actions: Gdk.DragAction.MOVE,
                });
                this.add_controller(dragSource);
                this.add_controller(dropController);
    
                let dragX;
                let dragY;
    
                dragSource.connect("prepare", (_source, x, y) => {
                    dragX = x;
                    dragY = y;
    
                    const value = new GObject.Value();
                    value.init(GObject.TYPE_INT);
                    value.set_int(index);
    
                    return Gdk.ContentProvider.new_for_value(value);
                });
    
                dragSource.connect("drag-begin", (_source, drag) => {
                    const dragWidget = PrefsWidgets.createConfigRowDragWidget(this.text, this.title);
    
                    dragWidget.set_size_request(this.get_width(), this.get_height());
                    dragWidget.drag_highlight_row(dragWidget.entryRow);
    
                    const icon = Gtk.DragIcon.get_for_drag(drag);
                    icon.child = dragWidget;
    
                    drag.set_hotspot(dragX, dragY);
                });
    
                dropController.connect("enter", () => {
                    list.drag_highlight_row(this);
                });
    
                dropController.connect("leave", () => {
                    list.drag_unhighlight_row();
                });
            }

            _onRemoveButtonClicked() {
                this.emit('remove-clicked');
            }
        });

        this.#ShortcutDialog = GObject.registerClass({
            GTypeName: 'ShortcutDialog',
            Template: 'resource:///org/gnome/Shell/Extensions/display-configuration-switcher/ui/shortcut_dialog.ui',
            Children: ['shortcutLabel'],
        }, class ShortcutDialog extends Adw.AlertDialog {
            constructor() {
                super();

                this.#setupEventController();
            }

            #setupEventController() {
                const eventController = new Gtk.EventControllerKey();
                eventController.connect('key-pressed', this.#onKeyPressed.bind(this));

                this.add_controller(eventController);
            }

            #onKeyPressed(eventController, key, _, mod) {
                const event = eventController.get_current_event();
                const keyval = event.get_keyval();

                if (event.is_modifier()) { return false; }
                
                const accelerator = Gtk.accelerator_name(key, mod);
                this.shortcutLabel.set_accelerator(accelerator);
            }
        });

        this.#ShortcutRow = GObject.registerClass({
            GTypeName: 'ShortcutRow',
            Signals: {
                'edit-clicked': {},
            },
            Template: 'resource:///org/gnome/Shell/Extensions/display-configuration-switcher/ui/shortcut_row.ui',
            Children: ['shortcutLabel'],
        }, class ShortcutRow extends Adw.ActionRow {

            /**
             * Key for the shortcut setting
             * 
             * @type {string}
             */
            #key = "";
            /**
             * Gio.Settings object associated with the extension
             * 
             * @type {Settings|null}
             */
            #settings = null;
            /**
             * Handler id for response signal of the ShortcutDialog 
             * 
             * @type {Number|null}
             */
            #shortcutDialogResponseHandlerID = null;

            constructor(title, key, settings) {
                super();
                this.title = title;

                this.#key = key;
                this.#settings = settings;

                this.#loadAcceleratorSetting();
            }

            _onEditButtonClicked() {                
                const shortcutDialog = PrefsWidgets.getShortcutDialog();
                
                shortcutDialog.shortcutLabel.set_accelerator(this.shortcutLabel.accelerator);

                this.#shortcutDialogResponseHandlerID = shortcutDialog.connect(
                    'response',
                    this.#onShortcutDialogResponse.bind(this)
                );
                shortcutDialog.present(this);
            }

            #onShortcutDialogResponse(_, response) {
                const shortcutDialog = PrefsWidgets.getShortcutDialog();

                if (response === "confirm") {
                    const originalAccelerator = this.shortcutLabel.accelerator
                    const newAccelerator = shortcutDialog.shortcutLabel.get_accelerator();
                    if (newAccelerator !== originalAccelerator) {
                        this.shortcutLabel.accelerator = newAccelerator;
                        this.#saveAcceleratorSetting();
                    }
                }
                shortcutDialog.disconnect(this.#shortcutDialogResponseHandlerID);
            }
            
            #loadAcceleratorSetting() {
                const accelerator_setting = this.#settings.get_strv(this.#key);
                const accelerator = accelerator_setting.length > 0 ? accelerator_setting[0] : '';
                this.shortcutLabel.accelerator = accelerator;
            }

            #saveAcceleratorSetting() {
                const accelerator = this.shortcutLabel.accelerator;
                this.#settings.set_strv(
                    this.#key,
                    [ accelerator ]
                );
            }
        });
    }

    static clear() {
        this.#ConfigRow = null;
        this.#ConfigRowDragWidget = null;
        this.#ShortcutDialog = null;
        this.#ShortcutRow = null;

        this.#shortcutDialog = null;
    }

    static getShortcutDialog() {
        if (this.#shortcutDialog === null) {
            this.#shortcutDialog = new this.#ShortcutDialog();
        }
        return this.#shortcutDialog;
    }

    static createConfigRow(props) {
        return new this.#ConfigRow(props);
    }

    static createConfigRowDragWidget(text, title) {
        return new this.#ConfigRowDragWidget(text, title);
    }

    static createShortcutRow(title, key, settings) {
        return new this.#ShortcutRow(title, key, settings);
    }
}