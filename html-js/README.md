# HTML documentation scripts (TypeScript)

TypeScript sources here compile to plain global scripts under `src/main/resources/html/js/`. Those paths are embedded by `IndexPage.java` at documentation generation time.

## Commands

From this directory:

- `npm ci` — install dependencies
- `npm run build` — emit JavaScript into `src/main/resources/`
- `npm run check` — typecheck without writing files

From the repo root, `./gradlew build` runs `npm run build` automatically before `processResources`.

## Migrating a script file

1. Add `src/html/js/<path>/<name>.ts` mirroring the resource path (e.g. `src/html/js/stickytools.ts` → `html/js/stickytools.js`).
2. Remove the hand-written `src/main/resources/html/js/.../<name>.js` from version control once the `.ts` source exists.
3. Declare cross-script globals in `src/html/js/types/globals.d.ts`. Do not use `import`/`export` in script sources unless you change the runtime loading model.
4. Run `./gradlew build` or `npm run build`.

Worker-related scripts (`indexingworker.js`, `indexpagelogic.js`) are concatenated into a blob at runtime; emitted output must stay plain executable script text.

`constants.js` is not built here; the documentation mod supplies it on the classpath.
