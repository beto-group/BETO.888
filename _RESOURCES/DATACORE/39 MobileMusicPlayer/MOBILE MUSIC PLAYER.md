
### Tab: Mobile Music Player

- **Description**: A comprehensive music player system designed for mobile use, accessed via a persistent floating action button (FAB). The player itself operates in a draggable Picture-in-Picture (PiP) window, allowing music to continue playing in the background even when the main player UI is hidden. A pulsing indicator provides a visual cue when music is active.
    
- **Does**:
    
    - Presents a floating action button (FAB) in the bottom-right corner, which expands to show a radial menu of secondary action buttons.
    - Launches a draggable Picture-in-Picture (PiP) window for the music player when the music icon is tapped.
    - Allows music to continue playing in the background even if the PiP window is closed.
    - Displays a subtle, pulsing music note indicator near the main button when music is playing but the PiP window is hidden.
    - Searches for tracks across multiple online sources (like Audius and Jamendo).
    - Manages a playback queue; users can add tracks from search results or favorites.
    - Features a "Favorites" or "Liked Songs" system that persists liked tracks to a JSON file within the vault.
    - Provides standard playback controls: play/pause, next/prev, volume, and a seekable progress bar.
    - Includes advanced controls for shuffle and three loop modes (none, loop all, loop one).
    - The PiP window can be expanded to reveal a full tabbed interface for Search, Queue, and Favorites management.

- **Can’t**:    
    - Search or stream from YouTube, as the integrated Piped/Invidious providers are not functional in this component version.
    - Play local audio files from the user's device or vault; it is a streaming-only player.
    - Save or manage multiple distinct playlists; it only maintains a single active queue and a "Favorites" list.        
    - Manually reorder tracks within the queue via drag-and-drop.
    - Remember the position or size of the PiP window between sessions.
    - Display album art or any metadata beyond the track title and artist.


<iframe allowfullscreen src="https://www.youtube.com/embed/qWqNwzMVmCc" width="100%" height="555" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" ></iframe>  

![alt text](/_RESOURCES/IMAGES/mobile_music_player.webp)



###### [Mobile Music Player Viewer](D.q.mobilemusicplayer.viewer.md)

###### [Mobile Music Player Component](D.q.mobilemusicplayer.component.md)
