
### Tab: Music Builder

- **Description**: An interactive music synthesizer and sequencer built using the Tone.js library. It presents a playable synth pad alongside a complex, algorithmically generated drum and bass backtrack.

- **Does**:
   
    - Dynamically loads multiple JavaScript libraries from a CDN, including Tone.js and its associated UI components.
    - Generates a complex, multi-layered musical backtrack using synthesizers (kick, bass) and audio samples (hi-hats, snare).
    - Employs probabilistic sequencing, so the drum and bass parts have slight variations each time they loop.
    - Provides an interactive XY-pad that allows the user to play a lead synth over the backtrack by moving the mouse or a finger.
    - Includes a (currently non-functional) slide-out "drawer" menu intended to control the volume and effects for each instrument.

- **Can’t**:
   
    - Save or export the generated music. The sequence is the same on every load.
    - Change the key, tempo, or instruments without editing the component's code.
    - Modify the individual instrument parameters via the UI, as the "drawer" menu is broken.
    - Function offline, as it is entirely dependent on CDN-hosted libraries and audio samples.


![music_builder.webp](/_RESOURCES/IMAGES/music_builder.webp)



### Components

###### [Music Builder Viewer](D.q.musicbuilder.viewer.md)

###### [Music Builder Component](D.q.musicbuilder.component.md)


