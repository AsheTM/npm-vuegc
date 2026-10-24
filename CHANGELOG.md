# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- `viu` command (work in progress): new CLI entry point with sub-commands (`viu component`), currently help only.
- Help messages moved to `services/` (`viu-help.js`, `viu-component-help.js`).
- `-h` alias for `--help`.
- Service and test templates in `template/`.

### Changed
- Component template moved from `Template.vue.sample` to `template/Template.vue.sample`.

### Fixed
- `vuegc` crashing on startup because the help module `./services/vue-help` didn't exist ([#3](https://github.com/AsheTM/npm-vuegc/issues/3)).

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

[Unreleased]: https://github.com/AsheTM/npm-vuegc/compare/29064af...develop
[1.1.0]: https://github.com/AsheTM/npm-vuegc/compare/05d2aae...29064af
[1.0.2]: https://github.com/AsheTM/npm-vuegc/compare/eddae3e...05d2aae
[1.0.1]: https://github.com/AsheTM/npm-vuegc/compare/9b16c97...eddae3e
[1.0.0]: https://github.com/AsheTM/npm-vuegc/commit/9b16c97
