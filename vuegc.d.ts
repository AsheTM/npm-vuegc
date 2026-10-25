/**
 * Types of the vuegc library API: `const { vuegc, errorHandler } = require("vuegc")`.
 * Each option matches a CLI flag (`dryRun` → `--dry-run`, `cssModule` → `--module`, …).
 */

/** CSS pre-processors supported by `--style`. */
export type VuegcStyle = "css" | "scss" | "sass" | "less" | "stylus";

export interface VuegcOptions {
    /** Component name, with or without `.vue`. The first letter is capitalized for the component name. */
    name: string;
    /** CSS pre-processor of the `<style>` section. @default "css" */
    style?: VuegcStyle;
    /** `scoped` attribute on `<style>`. Ignored with `cssModule`. @default true */
    scoped?: boolean;
    /** Folder inside `src/`, created if missing. Must stay inside `src/`. @default "" (src/) */
    path?: string;
    /** Empty template and style, without the demo content. @default false */
    blank?: boolean;
    /** Overwrite the component if it already exists. @default false */
    force?: boolean;
    /** Print the component instead of writing it; same checks as a real run. @default false */
    dryRun?: boolean;
    /** Leave the `<template>` section out. At least one section must remain. @default false */
    noTemplate?: boolean;
    /** Leave the `<script>` section out. At least one section must remain. @default false */
    noScript?: boolean;
    /** Leave the `<style>` section out. At least one section must remain. @default false */
    noStyle?: boolean;
    /** Prop names, declared as `name: null` (any type). Must be valid JavaScript names. @default [] */
    props?: string[];
    /** CSS modules: `<style module>` and `:class="$style.root"`, instead of `scoped`. @default false */
    cssModule?: boolean;
    /** Root of the Vue project (the folder that contains `src/`). @default process.cwd() */
    cwd?: string;
}

/**
 * What `vuegc()` throws: a vuegc error (`errno`) or a Node.js file system error (`code`).
 *
 * | errno    | meaning                                         |
 * |----------|-------------------------------------------------|
 * | `0x0001` | `src/main.js` isn't a Vue project entry          |
 * | `0x0002` | `src/App.vue` isn't a Vue component              |
 * | `0x0003` | missing or invalid `name` (`flag: "name"`)       |
 * | `0x0004` | unsupported `style`                              |
 * | `0x0005` | `path` outside `src/`                            |
 * | `0x0006` | `noTemplate`, `noScript` and `noStyle` together  |
 * | `0x0007` | invalid prop name (`prop`)                       |
 * | `0x0008` | `props` with `noScript`                          |
 * | `0x0009` | `cssModule` with `noStyle`                       |
 *
 * `code`: `"EEXIST"` (component already exists, without `force`), `"ENOENT"` (not the root of a Vue project).
 */
export interface VuegcError {
    errno?: number;
    code?: string;
    exit?: boolean;
    flag?: string;
    style?: string;
    path?: string;
    prop?: string;
}

/**
 * Generate a Vue component in `<cwd>/src/<path>/`.
 * @returns Path of the generated component (also with `dryRun`, where nothing is written).
 * @throws {VuegcError} On invalid options, outside a Vue project, or if the component exists without `force`.
 */
export function vuegc(options: VuegcOptions): string;

/**
 * Print the same message as the CLI for an error thrown by `vuegc()`, then exit the process with code 1.
 */
export function errorHandler(err: VuegcError): never;
