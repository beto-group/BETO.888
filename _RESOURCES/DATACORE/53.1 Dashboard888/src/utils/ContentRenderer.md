
# ContentRenderer

```jsx
const { getMediaResourcePath } = await dc.require(dc.headerLink(dc.resolvePath("src/utils/MediaResolver.md"), "MediaResolver"));

const ContentRenderer = {
    /**
     * Asynchronously converts a markdown string to an HTML string.
     * Handles standard markdown and resolves Obsidian-style `![[image.png]]` links.
     * @param {string} markdown - The raw markdown content.
     * @returns {Promise<string>} A promise that resolves to the rendered HTML string.
     */
    async renderMarkdown(markdown) {
        if (!markdown) return "";

        // --- Step 0: Strip YAML frontmatter ---
        let html = markdown.replace(/^---[\s\S]*?---\n*/, "");

        // --- Step 1: Handle block-level elements first ---
        // Code blocks ```...```
        html = html.replace(
            /```([\s\S]*?)```/g,
            (match, code) => `<pre><code>${code.trim()}</code></pre>`
        );
        // Headers (e.g., ### Title)
        html = html.replace(/^###### (.*$)/gim, "<h6>$1</h6>");
        html = html.replace(/^##### (.*$)/gim, "<h5>$1</h5>");
        html = html.replace(/^#### (.*$)/gim, "<h4>$1</h4>");
        html = html.replace(/^### (.*$)/gim, "<h3>$1</h3>");
        html = html.replace(/^## (.*$)/gim, "<h2>$1</h2>");
        html = html.replace(/^# (.*$)/gim, "<h1>$1</h1>");
        // Blockquotes > text
        html = html.replace(/^> (.*$)/gim, "<blockquote>$1</blockquote>");
        // Horizontal Rule
        html = html.replace(/^-{3,}/gim, "<hr/>");
        // Lists (unordered and ordered)
        html = html.replace(/^(\s*)- (.*)/gm, (match, indent, content) => {
            const level = Math.floor(indent.length / 2);
            return `<li data-level="${level}">${content}</li>`;
        });
        html = html.replace(/^(\s*)\d+\. (.*)/gm, (match, indent, content) => {
            const level = Math.floor(indent.length / 2);
            return `<li data-level="${level}">${content}</li>`;
        });
        html = ContentRenderer.nestLists(html);

        // --- Step 2: Handle inline elements ---
        // Bold and Italic combinations
        html = html.replace(/\*\*\*(.*?)\*\*\*/gim, "<strong><em>$1</em></strong>");
        html = html.replace(/\*\*(.*?)\*\*/gim, "<strong>$1</strong>");
        html = html.replace(/\*(.*?)\*/gim, "<em>$1</em>");
        // Links [text](url)
        html = html.replace(
            /\[([^\]]+)\]\(([^)]+)\)/gim,
            '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
        );
        // Inline code `code`
        html = html.replace(/`([^`]+)`/g, "<code>$1</code>");

        // --- Step 3: Asynchronously handle Obsidian image embeds ---
        const imageRegex = /!\[\[([^\]]+)\]\]/g;
        const matches = [...html.matchAll(imageRegex)];
        for (const match of matches) {
            const fullSyntax = match[0];
            const imagePath = match[1];
            const resolvedSrc = await getMediaResourcePath(imagePath);
            if (resolvedSrc) {
                const imgTag = `<img src="${resolvedSrc}" alt="${imagePath}" class="markdown-embed" />`;
                html = html.replace(fullSyntax, imgTag);
            }
        }

        // --- Step 4: Wrap remaining lines in <p> tags ---
        // Avoid wrapping elements that are already block-level
        return html
            .split("\n")
            .map((line) => {
                if (line.trim() === "") return "";
                if (line.match(/<(h[1-6]|ul|li|blockquote|hr|pre|img)/)) return line;
                return `<p>${line}</p>`;
            })
            .join("");
    },
    nestLists: function(html) {
        const lines = html.split('\n');
        const result = [];
        const stack = [];
        // First pass: collect all levels to find minimum
        const levels = [];
        for (const line of lines) {
            if (line.includes('<li data-level=')) {
                const match = line.match(/data-level="(\d+)"/);
                if (match) {
                    levels.push(parseInt(match[1]));
                }
            }
        }
        const minLevel = levels.length > 0 ? Math.min(...levels) : 0;
        // Second pass: adjust levels relative to minLevel
        for (const line of lines) {
            if (line.includes('<li data-level=')) {
                const match = line.match(/data-level="(\d+)"/);
                if (match) {
                    const originalLevel = parseInt(match[1]);
                    const adjustedLevel = originalLevel - minLevel;
                    const level = adjustedLevel;
                    while (stack.length > level) {
                        result.push('</ul>');
                        stack.pop();
                    }
                    while (stack.length < level) {
                        result.push('<ul>');
                        stack.push(level);
                    }
                    result.push(line.replace(/ data-level="\d+"/, ''));
                } else {
                    result.push(line);
                }
            } else {
                while (stack.length > 0) {
                    result.push('</ul>');
                    stack.pop();
                }
                result.push(line);
            }
        }
        while (stack.length > 0) {
            result.push('</ul>');
            stack.pop();
        }
        let nestedHtml = result.join('\n');
        // Fix nesting: move <ul> inside <li>
        function fixNesting(html) {
            let result = html;
            let changed = true;
            while (changed) {
                changed = false;
                result = result.replace(/(<li[^>]*>)(.*?)<\/li>\n(<ul>.*?<\/ul>)/s, (match, liStart, content, ul) => {
                    changed = true;
                    return `${liStart}${content}\n${ul}</li>`;
                });
            }
            return result;
        }
        return fixNesting(nestedHtml);
    },
};

return { ContentRenderer };
```
