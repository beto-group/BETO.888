
### Tab: Iframe Player

- **Description**: A smart iframe player that can take a URL from a common social media platform (like YouTube, Instagram, TikTok) and display it correctly formatted and scaled within a responsive container.

- **Does**:

    - Takes a standard URL as input (e.g., a YouTube "watch" link).
    - Automatically transforms the URL into the correct embed format required by the platform.
    - Uses a predefined set of "guidelines" to apply specific scaling, positioning, and container size corrections for each platform (e.g., making a vertical TikTok video fit correctly).
    - Dynamically resizes the container and the embedded content while maintaining the correct aspect ratio and formatting.

- **Can’t**:
   
    - Automatically detect and apply guidelines for websites that are not in its predefined list.
    - Play content from websites that block embedding via iframes.
    - Control video playback (play, pause, volume) from outside the iframe.
    - **Note:** The component is marked as a work-in-progress, with plans to improve its functionality.


![iframe_player.webp](/_RESOURCES/IMAGES/iframe_player.webp)




### Components

###### [Iframe Player Viewer](D.q.iframeplayer.viewer.md)

###### [Iframe Player Component](D.q.iframeplayer.component.md)
