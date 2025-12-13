# CHANGELOG — Automatic fixes & build improvements

## Summary
- Removed BOM from config & source files.
- Fixed invalid JSX patterns (e.g. "(?? []).map" corrected).
- Removed stray JSX causing TSX parse errors.
- Created src/main.cjs & updated package.json.main.
- Restored build scripts in package.json.
- Fixed .ico issues for electron-builder.
- Build succeeded (vite + electron-builder).

## 2025-12-13 — Tooling fixes & packaging improvements
- Removed UTF-8 BOM from `package.json` which caused PostCSS parse errors.
- Converted `src/main.js` to ESM to match `type: "module"` in `package.json`.
- Added ESLint configuration (`.eslintrc.cjs`, `.eslintignore`) and `lint`/`lint:fix` scripts.
- Added devDependencies for tooling (Vite, TypeScript, electron, ESLint plugins) and fixed JSON issues.
- Added a simple `manualChunks` rule in `vite.config.ts` to split vendor bundles and reduce main chunk size.
- Ensured `vite build` completes and created Windows installers via `electron-builder` (artifacts: `dist/YansApp Setup 1.0.0.exe`, `dist/YansApp 1.0.0.msi`).
- Added `SIGNING_INSTRUCTIONS.md` with local and CI signing guidance for EXE/MSI installers.

Files changed/added:
- `package.json` (BOM removed, scripts & devDependencies updated)
- `src/main.js` (converted to ESM)
- `vite.config.ts` (manualChunks)
- `.eslintrc.cjs`, `.eslintignore` (new)
- `SIGNING_INSTRUCTIONS.md` (new)

Next steps:
- Optionally add `eslint-plugin-react` and `eslint-plugin-react-hooks` for stricter React linting.
- Consider lowering TypeScript to a version supported by `@typescript-eslint` or upgrade linters when available.
