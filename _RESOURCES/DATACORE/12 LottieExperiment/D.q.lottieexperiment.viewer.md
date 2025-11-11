
LOTTIE!! ;)

```datacorejsx
const componentPath = dc.resolvePath("D.q.lottieexperiment.component");
const { View } = await dc.require(dc.headerLink(componentPath, "ViewComponent"));

// Specify the Lottie filenames to render
const mainLottie = "obsidian_lottie.json";
const overlayLottie = "monkey_head.json";

return <View mainLottie={mainLottie} overlayLottie={overlayLottie} />;
```



