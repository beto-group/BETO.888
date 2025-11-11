


```datacorejsx
/**
 * 
 * 1. MOBILE MODE (PiP only, no main UI):
 *    <MusicPlayer mode="mobile" />
 *    - Shows only the floating PiP player
 *    - Perfect for mobile/tablet use
 *    - Includes expandable search/queue/favorites
 * 
 * 2. DESKTOP MODE (Full player):
 *    <MusicPlayer mode="desktop" />
 *    - Shows full desktop player UI
 *    - Includes PiP option via button
 * 
 * 3. DEFAULT MODE (Auto-detect):
 *    <MusicPlayer />
 *    - Same as desktop mode
 */

const { MusicPlayer } = await dc.require(dc.headerLink(dc.resolvePath("D.q.musicplayer.component"), "ViewComponent"));

return <MusicPlayer mode="default" />;
```

































