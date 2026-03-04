# Termux Mobile Component - Planner

This document tracks best practices and planning for the Termux Mobile integration.

## Goal
To provide a seamless terminal experience within Obsidian Mobile using Termux.

## Best Practices
- **Mobile Check**: Always verify `dc.app.isMobile` before rendering mobile-only features.
- **Connection Health**: Provide clear feedback if `ttyd` is not reachable.
- **Port Management**: Default to `7681` as it's the standard for `ttyd`, but allow configuration.

## Roadmap
- [ ] Add support for multiple sessions.
- [ ] Implement quick-command buttons for common mobile tasks (e.g., `git pull`, `git push`).
- [ ] Better UI integration with Obsidian themes.
