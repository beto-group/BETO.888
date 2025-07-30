



# ViewComponent

```jsx
// Assuming this component receives Obsidian's `app` object as a prop
function BasicView() {
  // Define the vault-relative path to your song
  const songPath = "_RESOURCES/MUSIC/beto.minigame.soundtrack.wav";

  // Get the accessible URL for the audio file
  // This is the key step for Obsidian plugins
  const audioSrc = app.vault.adapter.getResourcePath(songPath);

  return (
    <div
      style={{
        height: "60vh", // 60vh || 100%
        width: "100%",
        padding: "10px",
        border: "2px solid white",
        borderRadius: "8px",
        display: "flex", // Added for better layout of title and audio
        flexDirection: "column", // Stack title and audio vertically
        alignItems: "center", // Center content horizontally
        justifyContent: "flex-start", // Align content to the top
      }}
    >
      <h2>TITLE</h2>
      {audioSrc ? (
        <audio
          src={audioSrc}
          controls // Shows default browser controls (play, pause, volume, timeline)
          autoPlay // Optional: if you want the song to play immediately
          // loop // Optional: if you want the song to loop
          style={{ marginTop: "20px", width: "80%" }} // Some basic styling for the player
        >
          Your browser does not support the audio element.
        </audio>
      ) : (
        <p style={{ color: "red" }}>
          Error: Could not load audio file. Check path: {songPath}
        </p>
      )}
      {/* You can add more content here */}
    </div>
  );
}

// This part remains the same if you're exporting it for use elsewhere
// For example, in your plugin's view or modal where you call ReactDOM.render
return { BasicView };
```