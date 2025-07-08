
Fun Fact cant retrieve images this way

CASE SENSITIVE

![[search_query.webp]]




```datacorejsx
function BasicFileSearch() {
  const { useState } = dc;
  const [term, setTerm] = useState("beto.group.svg");
  const queryString = `@page and $name = "${term}"`;
  const files = dc.useQuery(queryString);

  return (
    <div>
      <input value={term} onChange={e => setTerm(e.target.value)} />
      <h2>Search results for "{term}"</h2>
      {files.length ? (
        <ul>
          {files.map(file => (
            <li key={file.$path}>{file.$name}</li>
          ))}
        </ul>
      ) : (
        <p>No files found.</p>
      )}
    </div>
  );
}

return BasicFileSearch;
```

