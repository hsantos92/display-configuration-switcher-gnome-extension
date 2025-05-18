/* 
config.js
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

import GLib from 'gi://GLib';

export const ConfigIndex = Object.freeze(
    {
        "NAME": 0,
        "HASH": 1,
        "LOGICAL_MONITORS": 2,
        "PROPERTIES": 3,
        "PHYSICAL_DISPLAYS": 4
    }
)

export function updateConfigHash(config) {
    // Use GVariant string representation for generating hash
    const tempVariant = new GLib.Variant('(a(iiduba(ssa{sv}))a{sv}a(ssss))', [
        config[ConfigIndex.LOGICAL_MONITORS],
        config[ConfigIndex.PROPERTIES],
        config[ConfigIndex.PHYSICAL_DISPLAYS]
    ]);
    config[ConfigIndex.HASH] = (new GLib.String(tempVariant.print(false))).hash();
}