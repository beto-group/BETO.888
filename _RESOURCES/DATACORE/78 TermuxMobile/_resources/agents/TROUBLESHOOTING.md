## Connection Issues

### "Terminal is visible but I cannot type"
- **Cause**: `ttyd` is read-only by default.
- **Fix**: Use the `-W` flag when starting `ttyd`. Command: `ttyd -W -p 7681 bash`.

### "Keyboard doesn't appear on mobile"
- **Cause**: Iframes sometimes lose focus on mobile.
- **Fix**: Tap the green "⌨️ Keyboard" button in the top right to force focus on the terminal.
- **Cause**: `ttyd` is not running in Termux.
- **Fix**: Open Termux and run `ttyd -p 7681 bash`.

### "Mixed Content Error"
- **Cause**: If Obsidian is running over HTTPS and `ttyd` is HTTP.
- **Fix**: Most mobile environments are local, but ensure `ttyd` is started with appropriate flags if HTTPS is required.

## Terminal Display Issues

### "Terminal is too small"
- **Cause**: Terminal dimensions not matching the container.
- **Fix**: Use `ttyd`'s resize integration or ensure the iframe has `width: 100%` and `height: 100%`.

## Syntax Errors

### "Unexpected token 'export'"
- **Cause**: Datacore's `dc.require` evaluates files as scripts and does not support ES6 `export` statements.
- **Fix**: Replace `export function Component() { ... }` with `function Component() { ... }` and add `return { Component };` at the end of the file.
