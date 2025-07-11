

## ENIGMAS
----


````
---
aliases:
- "inbox"
- "atom"
- "orphan"
tags: 📥
---

# 📥 inbox

```dataview
LIST
FROM #📥
WHERE file.link != [[inbox and pending and orphan notes]]
```

# ⚛ pending atomization

```dataview
LIST
FROM #⚛ 
```

# 💔 orphan

Здесь приводится **LIST** из *заметок*, которые ни с чем НЕ связаны:

```dataview
LIST
FROM 
	!"home" 
	AND 
	!"templates" 
	AND 
	!"periodic"
	AND
	!"projects"
WHERE
	length(file.inlinks) = 0 
	AND 
	length(file.outlinks) = 0 
	AND 
	length(file.tags) = 0
	AND
	file.link != [[excalibrain]]
```
````



