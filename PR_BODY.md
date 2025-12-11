# Normalize line endings, clean workspace, and improve repo hygiene

## Summary
This PR introduces repository hygiene updates without modifying any functional logic. 
The goal is to standardize line endings (LF), remove Windows newline pollution, add 
.gitignore cleanup rules, and prepare the repo for stable future development.

## Changes
- Normalized all line endings to LF (UNIX format)
- Updated Git config:
  - core.autocrlf = false
  - core.eol = lf
- Added .gitignore rules for:
  - *.bak
  - *.bak.autofix
  - *.bak.wsfix
  - dist/
  - node_modules/
- Removed inconsistent CRLF/LF combinations
- Cleaned workspace after auto-repair scripts (BOM removal, syntax fixes)
- No functional changes to TypeScript/React code

## Verification
- Application builds successfully (`npm start`)
- No runtime errors related to this commit
- Only formatting/line-ending normalization applied
