# Display Configuration Switcher (GNOME Extension)

<div>
    <img style="margin: 0px auto 0px; display: block;" src="./data/icon/com.gitlab.knokelmaat.display-configuration-switcher.svg" width="256" height="256"/>
</div>

## Description
Quickly change the display configuration from the system menu.

## Startup behavior
This fork preserves GNOME's current display layout when enabled, at login, and
when monitors change. Saved profiles are applied only when selected from the
menu or through the toggle/keyboard shortcuts. The upstream automatic restore
of the last profile has been removed to avoid login flicker and unexpected
orientation or scaling changes.

Existing saved profiles remain available. This fork uses the same extension UUID
as upstream, so installing it replaces the upstream copy. Updates from GNOME
Extensions may replace this fork.

Upstream: https://gitlab.com/knokelmaat/display-configuration-switcher-gnome-extension

## Validation
Run `node --test tests/startup.test.cjs` and `bash build.sh -b`.

## Installation
To build and install the extension, run:
```bash
bash build.sh -bi
```

It is also possible to add `-l` to immediately logout the GNOME session after this:
```bash
bash build.sh -bil
```

## Support
If you have any problems or requests, please add them to the issue tracker of this repository.

## Contributing
Any and all contributions are welcome! I am not a javascript programmer, so suggestions on style and practices are also welcome.

## Authors and acknowledgment
Christophe Van den Abbeele

## License
GPLv3

## Project status
Alive and kicking.
