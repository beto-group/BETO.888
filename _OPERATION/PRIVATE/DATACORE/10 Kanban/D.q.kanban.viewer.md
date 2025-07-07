



```datacorejsx
const { View } = await dc.require(dc.headerLink("_OPERATION/PRIVATE/DATACORE/10 Kanban/D.q.kanban.component.md", "viewer"));

// Define the initial settings override with customized properties
const initialSettingsOverride = {
  filesAsColumns: ["EXPERIENCES.enigmas."],
};

// Render the View component with the custom initial settings
return <View initialSettingsOverride={initialSettingsOverride} />;
```







