
### Tab: MusicPlayer

- **Description**: A fully-featured music streaming client that aggregates search results from multiple public APIs (like Audius and Jamendo) and provides a unified player interface, a playlist, a favorites list, and a detachable picture-in-picture (PiP) mode.

- **Does**:

    - Simultaneously searches multiple configured music APIs for a given query.
    - Displays aggregated search results with source tags (e.g., Audius, Jamendo).
    - Allows users to add tracks to a persistent queue, which is managed in the main player.
    - Features a "like" system that saves favorite tracks to a local JSON file in the vault for persistence between sessions.
    - Provides a complete player UI with play/pause, next/previous, volume control, and a custom, interactive progress bar.
    - Includes a detachable Picture-in-Picture (PiP) window that offers full playback controls in a compact, floating overlay.

- **Can’t**:

    - Search disabled providers like YouTube or Napster.
    - Download songs locally; it only streams them from their respective sources.
    - Import local audio files from the vault into the playlist.
    - Create or manage multiple user-defined playlists.


<iframe allowfullscreen src="https://www.youtube.com/embed/KS_PlZXM7uo" width="100%" height="555" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" ></iframe>


![[music_player.webp]]




### Components

###### [[D.q.musicplayer.viewer|Music Player Viewer]]

###### [[D.q.musicplayer.component|Music Player Component]]