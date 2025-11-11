



```datacorejsx
const componentPath = dc.resolvePath("D.q.imagerender.component");
const { View } = await dc.require(dc.headerLink(componentPath, "ViewComponent"));

// Specify the image/lottie filename to render
// Ex : "obsidian_lottie.json"
// Ex : "image_render.webp"
const fileName = "obsidian_lottie.json";

return <View fileName={fileName} />;

```
