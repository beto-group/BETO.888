


```datacorejsx
////////////////////////////////////////////////////
///             Viewer Entry Point               ///
////////////////////////////////////////////////////
const whichCanvasToLoad = "AnimatedCardExample"; // This could come from a file property, a user setting, etc.

const { InfiniteCanvas } = await dc.require(dc.headerLink("_OPERATION/PRIVATE/DATACORE/23 Canvas/D.q.canvas.component.v2.md", "ViewComponent"));
return <InfiniteCanvas saveState={whichCanvasToLoad} />;

```



need to lock canvas before interaction with datacore components


#### Example of views




_OPERATION/PRIVATE/DATACORE/34 AnimatedCard/D.q.animatedcard.component.md
ViewComponent
WorldView

_OPERATION/PRIVATE/DATACORE/9 ContentViewer888/D.q.contentviewer888.viewer.md
ViewComponent
ContentExplorer


_OPERATION/PRIVATE/DATACORE/8 FitnessExplorer/D.q.fitnessexplorer.viewer.md
ViewComponent
ContentExplorer


_OPERATION/PRIVATE/DATACORE/12 LottieExperiment/D.q.lottieexperiment.component.md
ViewComponent
View

_OPERATION/PRIVATE/DATACORE/22 World888/D.q.world888.component.md
ViewComponent
WorldView

_OPERATION/PRIVATE/DATACORE/24 MapGlobe/D.q.mapglobe.component.md
ViewComponent
View

_OPERATION/PUBLIC/DATACORE/1 DATACORE.flexilis/D.q.datacore.flexilis.component.md
ViewComponent
View