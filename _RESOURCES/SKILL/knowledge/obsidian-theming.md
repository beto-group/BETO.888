# Theme Development Best Practices

## CSS Organization
- Group related styles together (Editor, UI, Sidebar, etc.)
- Use comments to separate major sections
- Keep specificity low for easy customization

## Obsidian CSS Variables
Always prefer Obsidian's built-in CSS variables over hardcoded values:

```css
/* Good */
.theme-dark {
  --my-accent: var(--interactive-accent);
  background-color: var(--background-primary);
  color: var(--text-normal);
}

/* Avoid */
.theme-dark {
  background-color: #2d2d30;
  color: #cccccc;
}
```

## Responsive Design
```css
/* Mobile-first approach */
.my-component {
  width: 100%;
}

@media (min-width: 768px) {
  .my-component {
    width: 50%;
  }
}
```

## Dark/Light Mode Support
```css
/* Support both themes */
.theme-dark .my-element {
  background: var(--background-primary);
}

.theme-light .my-element {
  background: var(--background-secondary);
}
```# Theme Coding Conventions

## CSS/SCSS Guidelines

### Naming Conventions
- Use lowercase with hyphens for class names: `.my-component`
- Follow BEM methodology: `.block__element--modifier`
- Prefix custom classes: `.obsidian-my-theme-`

### Structure
```scss
// Variables at top
:root {
  --my-theme-primary: #007acc;
  --my-theme-secondary: #cccccc;
}

// Component styles
.obsidian-my-theme {
  &__header {
    background: var(--my-theme-primary);

    &--dark {
      background: darken(var(--my-theme-primary), 20%);
    }
  }

  &__content {
    color: var(--text-normal);
  }
}
```

### Best Practices
- Use SCSS nesting sparingly (max 3 levels)
- Always use Obsidian CSS variables when available
- Comment complex selectors and their purpose
- Group related styles together
- Test in both light and dark themes

### Performance
- Avoid universal selectors (`*`)
- Minimize CSS specificity
- Use efficient selectors (prefer classes over complex selectors)
- Keep CSS bundle size reasonable