#!/usr/bin/env bash
# Copy upstream settings without applying a display configuration.
set -euo pipefail
umask 077
source_path=/org/gnome/shell/extensions/display-configuration-switcher/
target_path=/org/gnome/shell/extensions/display-configuration-switcher-hsantos92/
if [[ -n "$(dconf dump "$target_path")" ]]; then
    echo 'Fork settings already exist; refusing to overwrite them.' >&2
    exit 1
fi
backup_dir="${XDG_STATE_HOME:-$HOME/.local/state}/display-configuration-switcher"
mkdir -p "$backup_dir"
backup_file=$(mktemp "$backup_dir/upstream-settings-XXXXXXXX.ini")
dconf dump "$source_path" > "$backup_file"
if [[ ! -s "$backup_file" ]]; then
    echo "No upstream settings found. Empty backup: $backup_file"
    exit 0
fi
dconf load "$target_path" < "$backup_file"
cmp "$backup_file" <(dconf dump "$target_path")
echo "Profiles and settings copied. Backup: $backup_file"
