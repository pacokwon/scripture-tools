import esbuild from "esbuild";
import process from "process";

const prod = (process.argv[2] === "production");

const context = await esbuild.context({
    entryPoints: ["src/main.ts"],
    outfile: "main.js",
    bundle: true,
    platform: "node",
    format: "cjs",
    target: "es2022",
    treeShaking: true,
});

if (prod) {
    await context.rebuild();
    process.exit(0);
} else {
    await context.watch();
}
