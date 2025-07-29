

```jsx
// Function Component to Render the Facebook Video Embed without SDK
function View() {
  return (
    <dc.Stack
      style={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f0f0f0", // Optional: Adds a light background
        padding: "20px",
      }}
    >
      <iframe
        src="https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2Fshare%2Fr%2FvF7xNjeRDANb5Hpp%2F&show_text=false&width=500"
        title="Facebook Video Embed"
        width="500"
        height="280"
        style={{
          border: "none",
          borderRadius: "8px",
          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
        }}
        allowFullScreen
        allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
      ></iframe>
    </dc.Stack>
  );
}

// Return the View Component
return View;
```

