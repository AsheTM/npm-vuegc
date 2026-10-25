import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        // CLI tests spawn a real Node process: on a busy machine they can exceed the 5 s default
        testTimeout: 20000,
        // Type tests (*.test-d.ts) are checked by TypeScript alongside the runtime tests
        typecheck: {
            enabled: true,
            include: ["test/**/*.test-d.ts"],
            tsconfig: "./tsconfig.json",
        },
    },
});
