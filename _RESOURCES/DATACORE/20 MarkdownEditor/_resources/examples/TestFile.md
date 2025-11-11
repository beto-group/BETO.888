




# Markdown Syntax Showcase 🎨

Welcome to the **Markdown Editor** test file! This document demonstrates various markdown features.

---

## Headings

# H1 - Main Title
## H2 - Section Header
### H3 - Subsection
#### H4 - Minor Section
##### H5 - Small Header
###### H6 - Smallest Header

---

## Text Formatting

**Bold text** is created with double asterisks.
*Italic text* is created with single asterisks.
***Bold and italic*** combines both.
~~Strikethrough~~ uses double tildes.
==Highlighted text== (Obsidian feature)

---

## Lists

### Unordered Lists
- First item
- Second item
  - Nested item
  - Another nested item
- Third item

### Ordered Lists
1. First step
2. Second step
   1. Sub-step A
   2. Sub-step B
3. Third step

### Task Lists (Obsidian)
- [x] Completed task
- [ ] Pending task
- [ ] Another pending task

---

## Links & References

[External Link](https://obsidian.md)
[Link with title](https://obsidian.md "Obsidian Knowledge Base")

### Obsidian Internal Links
[[TestFile]] - Link to this file (click to reload!)
[[TestFile|Click here to reload this document]] - Link with custom text


### Wikilinks & Embeds

**Image Embed (Obsidian style):**
![[markdown_editor_1.webp]]


**PDF Embed:**
![[the-unsuccessful-self-treatment-of-a-case-of-writers-block.pdf]]

**Standard Markdown Image:**
![Markdown Editor](markdown_editor_2.webp)

---

## Raw HTML Support

You can use raw HTML in your markdown:

<p style="color: #4a9eff; font-weight: bold;">Hello World with inline styles!</p>

<div style="padding: 12px; background-color: rgba(139, 92, 246, 0.2); border-radius: 6px; margin: 10px 0;">
  <strong>Custom HTML Block</strong>
  <p>This is a custom HTML div with styling.</p>
</div>

<details>
  <summary>Click to expand</summary>
  <p>Hidden content revealed!</p>
</details>

---

## Code

### Inline Code
Use `const variable = "value"` for inline code.

### Code Blocks

```javascript
// JavaScript example
function greet(name) {
  console.log(`Hello, ${name}!`);
  return true;
}

greet("World");
```

```python
# Python example
def calculate_sum(a, b):
    """Calculate the sum of two numbers"""
    return a + b

result = calculate_sum(5, 3)
print(f"Result: {result}")
```

---

## Blockquotes

> This is a simple blockquote.
> It can span multiple lines.

> Nested quotes work too!
>> This is nested deeper.
>>> And even deeper!

---

## Tables

| Feature | Support | Notes |
|---------|---------|-------|
| Headers | ✅ | H1-H6 |
| Lists | ✅ | Ordered & Unordered |
| Code | ✅ | Inline & Blocks |
| Tables | ✅ | Full support |
| Obsidian | ⚡ | Wikilinks & more |

---

## Horizontal Rules

Use three dashes, asterisks, or underscores:

---
***
___

## Callouts (Obsidian Feature)

> [!NOTE]
> This is a note callout with important information.

> [!WARNING]
> Be careful with this feature!

> [!TIP]
> Here's a helpful tip for you.

> [!IMPORTANT]
> Pay attention to this critical information.

---

## Math (with LaTeX)

Inline math: $E = mc^2$

Block math:
$$
\int_{a}^{b} f(x) \, dx = F(b) - F(a)
$$

---

## Footnotes

Here's a sentence with a footnote[^1].

Another footnote reference[^2].

[^1]: This is the first footnote.
[^2]: This is the second footnote with more details.

---

## Tags (Obsidian)

#markdown #obsidian #documentation #testing

---

## Emoji Support

🎉 🚀 💡 ✨ 🔥 💯 👍 ❤️ 🎨 📝

---

## Special Characters

You can escape special characters: \* \_ \[ \] \( \)

HTML entities: &copy; &trade; &reg;

---

## Combinations

You can **combine _multiple_ ~~formatting~~ `options`** in ==one line==!

- [x] **Bold** task item
- [ ] *Italic* pending task with [[link_example]]
- [ ] Task with `code` and #tag


---

## Summary

This file demonstrates:
1. ✅ Standard Markdown syntax
2. ✅ Obsidian-specific features
3. ✅ Code highlighting
4. ✅ Tables and formatting
5. ✅ Special characters and emoji

**Happy editing!** 🎉





