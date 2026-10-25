# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- `vuegc` can be used as a library: `require("vuegc").vuegc({ name, style, scoped, cwd })` generates a component and returns its path; `errorHandler` is exported too. Requiring `vuegc` no longer runs the CLI ([#55](https://github.com/AsheTM/npm-vuegc/issues/55)).

### Changed
- `String.prototype.toCapitalize` replaced by a plain function: `vuegc` no longer modifies a built-in type ([#55](https://github.com/AsheTM/npm-vuegc/issues/55)).
- Tests moved from `node:test` to [Vitest](https://vitest.dev), with new library tests for `vuegc()` and `errorHandler()`; `npm run test:watch` re-runs them on every change ([#63](https://github.com/AsheTM/npm-vuegc/issues/63)).

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

[Unreleased]: https://github.com/AsheTM/npm-vuegc/compare/v1.2.1...develop
[1.2.1]: https://github.com/AsheTM/npm-vuegc/compare/v1.2.0...v1.2.1
[1.2.0]: https://github.com/AsheTM/npm-vuegc/compare/29064af...v1.2.0
[1.1.0]: https://github.com/AsheTM/npm-vuegc/compare/05d2aae...29064af
[1.0.2]: https://github.com/AsheTM/npm-vuegc/compare/eddae3e...05d2aae
[1.0.1]: https://github.com/AsheTM/npm-vuegc/compare/9b16c97...eddae3e
[1.0.0]: https://github.com/AsheTM/npm-vuegc/commit/9b16c97
