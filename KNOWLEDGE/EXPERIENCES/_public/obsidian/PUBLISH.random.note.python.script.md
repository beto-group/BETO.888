---
permalink: publish.random.note.python.script
---

```python
import os
import re
import json
import yaml  # Ensure you have PyYAML installed: pip install pyyaml

def extract_frontmatter(file_content, file_path):
    """
    Extract YAML frontmatter from a Markdown file.
    Frontmatter should be between two '---' lines. If templating markers (e.g., {{...}})
    cause parsing errors, they are removed and parsing is retried.
    """
    fm_pattern = re.compile(r'^---\s*\n(.*?)\n---\s*\n', re.DOTALL)
    match = fm_pattern.match(file_content)
    if match:
        fm_content = match.group(1)
        try:
            frontmatter = yaml.safe_load(fm_content)
            return frontmatter if isinstance(frontmatter, dict) else {}
        except yaml.YAMLError:
            sanitized = re.sub(r'{{.*?}}', '', fm_content)
            try:
                frontmatter = yaml.safe_load(sanitized)
                return frontmatter if isinstance(frontmatter, dict) else {}
            except yaml.YAMLError as e2:
                print(f"Error parsing YAML in file '{file_path}' after sanitization: {e2}")
                return {}
    return {}

def scan_directory(directory, permalink_exclude_regex, exclude_paths, include_paths):
    """
    Walk through the directory tree, process Markdown files, and extract permalinks.
    - Exclude files if their full path contains any substring in exclude_paths.
    - Only process files whose path contains at least one include substring (if provided).
    - Skip files whose permalink matches the exclusion regex.
    """
    included_permalinks = []
    excluded_permalinks = []

    try:
        permalink_exclude_pattern = re.compile(permalink_exclude_regex)
    except re.error as e:
        print(f"Invalid regex pattern '{permalink_exclude_regex}': {e}")
        return included_permalinks, excluded_permalinks

    for root, dirs, files in os.walk(directory):
        if include_paths:
            dirs[:] = [d for d in dirs if any(inc in os.path.join(root, d) for inc in include_paths)]
        dirs[:] = [d for d in dirs if not any(excl in os.path.join(root, d) for excl in exclude_paths)]
        
        for file in files:
            file_path = os.path.join(root, file)
            if include_paths and not any(inc in file_path for inc in include_paths):
                continue
            if any(excl in file_path for excl in exclude_paths):
                continue
            if not file.endswith(".md"):
                continue
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
            except Exception as e:
                print(f"Error reading file '{file_path}': {e}")
                continue
            frontmatter = extract_frontmatter(content, file_path)
            permalink = frontmatter.get('permalink')
            if not permalink:
                continue
            if permalink_exclude_pattern.search(permalink):
                excluded_permalinks.append(permalink)
            else:
                included_permalinks.append(permalink)
    return included_permalinks, excluded_permalinks

def main():
    # Enter multiple directory paths separated by commas (e.g., "folder1, folder2")
    directories_input = input("Enter the directory paths to scan (separated by commas): ").strip()
    directories = [d.strip() for d in directories_input.split(',') if d.strip()]

    default_regex = r'.*\.(namzu|sud|enigmas)$'
    regex_input = input(f"Enter regex pattern to exclude permalinks (default: {default_regex}): ").strip()
    permalink_exclude_regex = regex_input if regex_input else default_regex

    exclude_input = input("Enter comma-separated paths (substrings) to exclude from scanning (e.g., drafts,private): ").strip()
    exclude_paths = [part.strip() for part in exclude_input.split(',') if part.strip()]

    include_input = input("Enter comma-separated paths (substrings) to include in scanning (if empty, include all): ").strip()
    include_paths = [part.strip() for part in include_input.split(',') if part.strip()]

    all_included = []
    all_excluded = []
    for directory in directories:
        included, excluded = scan_directory(directory, permalink_exclude_regex, exclude_paths, include_paths)
        all_included.extend(included)
        all_excluded.extend(excluded)

    all_included = list(set(all_included))
    all_excluded = list(set(all_excluded))

    output_data = {
        "included": all_included,
        "excluded": all_excluded
    }
    
    output_filename = "random_note_permalinks.json"
    with open(output_filename, 'w', encoding='utf-8') as json_file:
        json.dump(output_data, json_file, indent=4)
    
    print(f"JSON file '{output_filename}' created successfully.")

if __name__ == '__main__':
    main()

```