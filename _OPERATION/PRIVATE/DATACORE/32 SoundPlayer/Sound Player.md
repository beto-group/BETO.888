
### Tab: SoundPlayer

- **Description**: A straightforward component that plays a single, hardcoded audio file from within the vault using the standard browser audio player.

- **Does**:
   
    - Uses a hardcoded path to a specific .wav file located in the vault's _RESOURCES folder.
    - Leverages Obsidian's vault adapter (getResourcePath) to create a playable URL for the local file.
    - Renders the default HTML5 `<audio> player`, providing standard browser controls for play/pause, volume, and timeline scrubbing.
    - Is set to autoPlay, so the audio begins playing as soon as the component loads.

- **Can’t**:
    
    - Play any audio file other than the one specified in its code.
    - Provide a way for the user to select or change the song.
    - Offer a customized UI for the player; it is entirely dependent on the browser's default audio controls.
    - Manage playlists or a queue of multiple audio files.



![[sound_player.webp]]



### Components


###### [[D.q.soundplayer.viewer|Sound Player Viewer]]

###### [[D.q.soundplayer.component|Sound Player Component]]

