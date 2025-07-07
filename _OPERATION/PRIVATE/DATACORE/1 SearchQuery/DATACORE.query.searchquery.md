
Fun Fact cant retrieve images this way


```datacorejsx
function BasicFileSearch() {
  // Constant query: search for files with @page and name exactly "back"
  const queryString = '@page and $name = "beto.group.svg"';
  const files = dc.useQuery(queryString);

  return (
    <div>
      <h2>Search results for "back"</h2>
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

