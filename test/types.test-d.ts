// Type tests: checked by TypeScript (vitest --typecheck), never executed.
// They fail if vuegc.d.ts stops accepting valid calls or starts accepting invalid ones.
import { describe, it, expectTypeOf } from "vitest";
import { vuegc, errorHandler, type VuegcOptions, type VuegcError, type VuegcStyle } from "../vuegc.js";

describe("vuegc.d.ts", () => {
    it("vuegc() takes the options and returns the path", () => {
        expectTypeOf(vuegc).parameter(0).toEqualTypeOf<VuegcOptions>();
        expectTypeOf(vuegc).returns.toEqualTypeOf<string>();
    });

    it("accepts every option", () => {
        vuegc({
            name: "Card",
            style: "sass",
            scoped: false,
            path: "components/ui",
            blank: true,
            force: true,
            dryRun: true,
            noTemplate: false,
            noScript: false,
            noStyle: false,
            props: ["title", "items"],
            cssModule: true,
            cwd: "/project",
        });
    });

    it("only requires name", () => {
        vuegc({ name: "Card" });
        // @ts-expect-error: name is required
        vuegc({});
    });

    it("rejects invalid options", () => {
        // @ts-expect-error: unsupported pre-processor
        vuegc({ name: "Card", style: "tailwind" });
        // @ts-expect-error: props is a list of names, not a string
        vuegc({ name: "Card", props: "title,items" });
        // @ts-expect-error: typo, the option is dryRun
        vuegc({ name: "Card", dryrun: true });
        // @ts-expect-error: the library option is cssModule (module is a Node.js variable)
        vuegc({ name: "Card", module: true });
    });

    it("lists the 5 supported styles", () => {
        expectTypeOf<VuegcStyle>().toEqualTypeOf<"css" | "scss" | "sass" | "less" | "stylus">();
    });

    it("errorHandler() takes a thrown error and never returns", () => {
        expectTypeOf(errorHandler).parameter(0).toEqualTypeOf<VuegcError>();
        expectTypeOf(errorHandler).returns.toBeNever();
    });
});
