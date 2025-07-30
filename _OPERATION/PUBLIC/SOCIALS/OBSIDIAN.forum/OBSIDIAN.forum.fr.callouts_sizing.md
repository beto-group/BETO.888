---
permalink: obsidian.forum.fr.callouts_sizing
---

###### NAVIGATE - BACK. : [[OBSIDIAN.forum]]
---

### Use case or problem

When adding a callout block with a title that’s wider than the available space, the text currently overflows or gets truncated. Although there are workarounds using custom CSS (e.g., `clamp()` for fluid font sizes), it often doesn’t perfectly “shrink to fit,” and can lead to unreadable or clipped titles. Users who frequently embed longer headings or URLs would benefit from a built-in solution that gracefully scales or truncates callout titles.

### Proposed solution

Introduce a built-in setting for callouts to automatically adjust (i.e., shrink or truncate) titles when space is limited. For example:

1. **Auto-Fit Title**: Dynamically measure the callout title area and reduce the font size until the entire string fits on one line—or until a configurable minimum size is reached.
2. **Ellipsis Option**: If the title still doesn’t fit, add an ellipsis (`…`) to indicate truncated content.
3. **Multi-Line or Scroll Toggle**: Optionally allow multi-line wrapping or horizontal scrolling for cases when users prefer to see the full, unshrunk text.

This would save time and effort for those who don’t want to rely on custom CSS or JavaScript hacks.

### Current workaround (optional)

- Using CSS `clamp()` with `white-space: nowrap;`, `overflow: hidden;`, and `text-overflow: ellipsis;` to create a fluid font size. However, it often can’t shrink text enough in extremely narrow spaces.
- Allowing text to wrap (`white-space: normal;`), but that can disrupt designs expecting a single-line title.
- JavaScript-based libraries like FitText, though that’s external to Obsidian’s native functionality.

### Related feature requests (optional)

- [Example: “Auto-scaling text in callouts”]
- [Example: “Built-in text clipping/truncation in callout blocks”]

_(Links are illustrative; please replace with any relevant threads if you find them.)_