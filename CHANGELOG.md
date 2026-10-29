# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
- A project `.npmrc` pins the registry to registry.npmjs.org: installs, the lock file and `npm publish` no longer depend on the developer's own npm config (no token in it; npm never packs it) ([#109](https://github.com/AsheTM/npm-vuegc/issues/109)).

## [2.0.0] - 2026-10-25

**Vue 3.** Breaking changes: Vue 3 projects only, `css` and `<script setup>` by default. For Vue 2, use vuegc 1 (`npm install -g vuegc@1`); in a Vue 3 project, `--options --style scss` gives the 1.x output.

### Added
- `--ts` generates a TypeScript component: `<script setup lang="ts">` with type-based `defineProps<{ title?: unknown }>()` and `defineEmits<{ "update:modelValue": [...args: unknown[]] }>()`, or `defineComponent()` with `--options`. Library: `vuegc({ ts: true })` ([#104](https://github.com/AsheTM/npm-vuegc/issues/104)).
- `--emits update,close` declares the component events: `const emit = defineEmits([...])` in `<script setup>`, `emits: [...]` with `--options`; names like `update:modelValue` accepted, duplicates removed, `--no-script` rejected. Library: `vuegc({ emits: [...] })` ([#102](https://github.com/AsheTM/npm-vuegc/issues/102)).

### Changed
- **BREAKING**: `vuegc` 2 targets **Vue 3** projects: `src/main.js` or `src/main.ts` creating the app with `createApp` / `createSSRApp`, and `src/App.vue`. A Vue 2 project (`new Vue`) is refused with a pointer to `vuegc@1`, which keeps generating Vue 2 components (`1.x` branch) ([#96](https://github.com/AsheTM/npm-vuegc/issues/96)).
- **BREAKING**: the default style is `css` (was `scss`), which works without installing `sass`; `--style scss` gives the 1.x output ([#98](https://github.com/AsheTM/npm-vuegc/issues/98)).
- **BREAKING**: the script is `<script setup>` (Composition API): empty, or `const props = defineProps({ … })` with `--props`; the component name comes from the file name. `--options` (library: `optionsApi: true`) gives the Options API, same as 1.x ([#100](https://github.com/AsheTM/npm-vuegc/issues/100)).
- README and package description for Vue 3: versions table, examples from the real output, and **Migrating from 1.x** (`--options --style scss` in a Vue 3 project produces exactly the vuegc 1.4 output) ([#106](https://github.com/AsheTM/npm-vuegc/issues/106)).

## [1.4.0] - 2026-10-25

### Added
- TypeScript types for the library (`vuegc.d.ts`, `"types"` in `package.json`): `vuegc(options)`, `errorHandler(err)`, `VuegcOptions`, `VuegcError`, `VuegcStyle`, with JSDoc and defaults; checked by type tests ([#93](https://github.com/AsheTM/npm-vuegc/issues/93)).
- `--module` generates CSS modules instead of a scoped style: `<style module>`, a `.root` class used through `:class="$style.root"` (plain CSS rules prefixed by `.root` to stay local); `--no-style` is rejected. Library: `vuegc({ cssModule: true })` ([#91](https://github.com/AsheTM/npm-vuegc/issues/91)).
- `--style less` and `--style sass` (indented syntax: no braces, no semicolons) are supported ([#89](https://github.com/AsheTM/npm-vuegc/issues/89)).
- `--props title,items` declares the props (`title: null`, any type in Vue 2); names must be valid JavaScript names, duplicates are removed, and `--no-script` is rejected. Library: `vuegc({ props: ["title", "items"] })` ([#83](https://github.com/AsheTM/npm-vuegc/issues/83)).
- `--no-template`, `--no-script` and `--no-style` leave a section out; at least one must remain. Library: `vuegc({ noTemplate, noScript, noStyle })` ([#81](https://github.com/AsheTM/npm-vuegc/issues/81)).
- `--dry-run` prints where the component would be written and its content, and writes nothing (no file, no folder); it runs the same checks as a real run, so it predicts its result. Library: `vuegc({ dryRun: true })` ([#79](https://github.com/AsheTM/npm-vuegc/issues/79)).

### Changed
- Tests: timeout raised from 5 s to 20 s (`vitest.config.mjs`), so the CLI tests no longer fail on a busy machine ([#86](https://github.com/AsheTM/npm-vuegc/issues/86)).

## [1.3.1] - 2026-10-25

### Changed
- Internal cleanup: unused `view` service removed, CLI dispatch simplified to `if (help) … else vuegc(…)`; no behavior change. Generating views belongs to [`@ashetm/vueg`](https://github.com/AsheTM/npm-vueg) ([#74](https://github.com/AsheTM/npm-vuegc/issues/74)).

### Fixed
- Generated component formatting: consistent 4-space indentation (`<script>` and `<style>` content at column 0), no tabs, no trailing spaces, and LF line endings whatever the OS; same CSS rules and selectors. Output locked with Vitest snapshots ([#75](https://github.com/AsheTM/npm-vuegc/issues/75)).

## [1.3.0] - 2026-10-25

### Added
- `--force` overwrites an existing component on purpose and says so; without it, the "Component already exists" message now suggests `--force`. Library: `vuegc({ force: true })` ([#69](https://github.com/AsheTM/npm-vuegc/issues/69)).
- `--blank` generates an empty `<div></div>` template and an empty `<style>`, without the demo content; the script skeleton is kept. Library: `vuegc({ blank: true })` ([#67](https://github.com/AsheTM/npm-vuegc/issues/67)).
- `--path <folder>` writes the component in a folder inside `src/` (created if missing), e.g. `--path components/ui`; `..` and absolute paths are rejected. Library: `vuegc({ path })` ([#65](https://github.com/AsheTM/npm-vuegc/issues/65)).
- `vuegc` can be used as a library: `require("vuegc").vuegc({ name, style, scoped, cwd })` generates a component and returns its path; `errorHandler` is exported too. Requiring `vuegc` no longer runs the CLI ([#55](https://github.com/AsheTM/npm-vuegc/issues/55)).

### Changed
- `String.prototype.toCapitalize` replaced by a plain function: `vuegc` no longer modifies a built-in type ([#55](https://github.com/AsheTM/npm-vuegc/issues/55)).
- Tests moved from `node:test` to [Vitest](https://vitest.dev), with new library tests for `vuegc()` and `errorHandler()`; `npm run test:watch` re-runs them on every change ([#63](https://github.com/AsheTM/npm-vuegc/issues/63)).

### Fixed
- README showed an outdated generated component (`Helloworld`, invalid `data()` / `methods()`): rewritten with install, flags table, real generated output (default and `--blank`), library usage and versions ([#71](https://github.com/AsheTM/npm-vuegc/issues/71)).

## [1.2.1] - 2026-10-25

### Added
- Automated tests of the CLI with Node's built-in test runner (`node:test`), run with `npm test` ([#57](https://github.com/AsheTM/npm-vuegc/issues/57)).

### Removed
- Unused `jest` and `chai` dev dependencies ([#58](https://github.com/AsheTM/npm-vuegc/issues/58)).

### Security
- Removing `jest@24` drops the 68 vulnerabilities `npm audit` reported in the development dependencies: `npm audit` now reports 0.

## [1.2.0] - 2026-10-24

### Added
- `-h` alias for `--help`.
- Unsupported `--style` values are rejected with a clear message ([#14](https://github.com/AsheTM/npm-vuegc/issues/14)).
- An existing component is never overwritten: the command fails with "Component already exists" ([#19](https://github.com/AsheTM/npm-vuegc/issues/19)).
- MIT `LICENSE` file ([#48](https://github.com/AsheTM/npm-vuegc/issues/48)).

### Changed
- The CLI exits with code `1` on failure, so scripts and CI can detect it ([#20](https://github.com/AsheTM/npm-vuegc/issues/20)).
- Error messages for a missing Vue project or an existing component now also work on macOS and Linux ([#18](https://github.com/AsheTM/npm-vuegc/issues/18)).

### Fixed
- `--help` and `--scoped` were never detected ([#7](https://github.com/AsheTM/npm-vuegc/issues/7)).
- A flag passed as last argument (`vuegc --help`, `--scoped`) was ignored ([#8](https://github.com/AsheTM/npm-vuegc/issues/8)).
- `--scoped false` was ignored, the style was always `scoped` ([#12](https://github.com/AsheTM/npm-vuegc/issues/12)).
- Component name was lowercased: `HelloWorld` became `Helloworld` ([#15](https://github.com/AsheTM/npm-vuegc/issues/15)).
- `--name Hello.vue` produced a component named `Hello.vue` ([#16](https://github.com/AsheTM/npm-vuegc/issues/16)).
- Generated script was invalid Vue 2: `data()` now returns an object and `methods` is an object ([#17](https://github.com/AsheTM/npm-vuegc/issues/17)).
- Help and README documented `css` as the default style instead of `scss` ([#13](https://github.com/AsheTM/npm-vuegc/issues/13)).
- npm page now links to the right repository, homepage and issues ([#24](https://github.com/AsheTM/npm-vuegc/issues/24)).

### Removed
- Unused `fs`, `path` and `optimist` dependencies: `handlebars` is the only runtime dependency ([#22](https://github.com/AsheTM/npm-vuegc/issues/22)).
- Unfinished `viu` command and service templates, moved to their own package [`@ashetm/vueg`](https://github.com/AsheTM/npm-vueg) ([#52](https://github.com/AsheTM/npm-vuegc/issues/52)).

### Security
- Bump `handlebars` from `^4.2.0` to `^4.7.10` to fix critical vulnerabilities (prototype pollution, JavaScript injection).
- Removing `optimist` drops the vulnerable `minimist` it pulled: `npm audit` reports 0 vulnerabilities for runtime dependencies.

## [1.1.0] - 2019-09-07

### Added
- Component generated from a Handlebars template (`Template.vue.sample`).
- Check that the command is run at the root of a Vue project (`src/main.js` and `src/App.vue`).
- Clear error messages for missing required flags and invalid project root.
- `--help` flag, also shown when no argument is given.

### Changed
- Components are generated directly in `src/`.

### Removed
- `--path` option (components were previously generated in `src/component/` by default).

## [1.0.2] - 2019-08-29

### Fixed
- Indentation of the `span` and `a` rules in the generated `scss` and `stylus` styles.

## [1.0.1] - 2019-08-29

### Added
- Boolean flags can optionally take an explicit value (`--scoped true|false`).
- List of supported styles: `css`, `scss`, `stylus`.

### Changed
- Code reorganized.

## [1.0.0] - 2019-08-28

### Added
- First release: `vuegc --name <Component>` generates a `.vue` component with template, script and style sections.
- `--style` option to choose the CSS pre-processor (default `scss`).
- `--scoped` option for the `<style>` tag.
- `--path` option for the output folder inside `src/` (default `./component/`).

[Unreleased]: https://github.com/AsheTM/npm-vuegc/compare/v2.0.0...develop
[2.0.0]: https://github.com/AsheTM/npm-vuegc/compare/v1.4.0...v2.0.0
[1.4.0]: https://github.com/AsheTM/npm-vuegc/compare/v1.3.1...v1.4.0
[1.3.1]: https://github.com/AsheTM/npm-vuegc/compare/v1.3.0...v1.3.1
[1.3.0]: https://github.com/AsheTM/npm-vuegc/compare/v1.2.1...v1.3.0
[1.2.1]: https://github.com/AsheTM/npm-vuegc/compare/v1.2.0...v1.2.1
[1.2.0]: https://github.com/AsheTM/npm-vuegc/compare/29064af...v1.2.0
[1.1.0]: https://github.com/AsheTM/npm-vuegc/compare/05d2aae...29064af
[1.0.2]: https://github.com/AsheTM/npm-vuegc/compare/eddae3e...05d2aae
[1.0.1]: https://github.com/AsheTM/npm-vuegc/compare/9b16c97...eddae3e
[1.0.0]: https://github.com/AsheTM/npm-vuegc/commit/9b16c97
