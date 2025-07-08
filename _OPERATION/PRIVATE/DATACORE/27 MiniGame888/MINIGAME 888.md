
### Tab: MiniGame888

- **Description**: A complete, interactive mini-game where the player sorts 3D "Enigma" cards into their correct categories. It uses a dynamic system of draggable pop-up windows (PIPs) for all UI elements, culminating in a score-based message and a link to claim an NFT.

- **Does**:
   
    - Renders a 3D scene of scattered, clickable cards using Babylon.js.
    - When a card is clicked, it opens in a dedicated "Enigma" viewer window.
    - The core gameplay involves dragging the Enigma window and dropping it onto the correct category window (Health, Wealth, or Experience).
    - Provides immediate feedback on whether the categorization was a success or failure.
    - Tracks the player's progress and total attempts, which determines the final outcome.
    - When all cards are sorted, it displays a unique, congratulatory message based on the player's final score (total attempts).
    - Includes a final "Claim Your NFT & Exit" button that links to an external Crossmint page.
    - Features a background music player and a loading screen for a complete game-like experience.

- **Can’t**:
   
    - Use dynamic data; all card definitions, categories, and final messages are hardcoded in the component's source files.
    - Save game progress; if the view is reloaded, the game resets.
    - Directly interact with a crypto wallet; the "Claim NFT" button simply opens a webpage.
    - Be customized by the user (the layout of the UI windows is fixed).


<iframe allowfullscreen src="https://www.youtube.com/embed/TSVHwDIE8Dg" width="100%" height="555" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" ></iframe>



![[minigame888.webp]]



### Components 

###### [[D.q.minigame888.viewer|Minigame 888 Viewer]]

###### [[D.q.minigame888.component|Minigame 888 Component]]




