


```datacorejsx
const componentPath = dc.resolvePath("D.q.aquarium.component");
const { AquariumView } = await dc.require(dc.headerLink(componentPath, "ViewComponent"));

// Define your fish tasks
const fishes = [
  { name: 'Brush Teeth' },
  { name: 'Read' },
  { name: 'Exercise' },
  { name: 'Journal' },
  { name: 'Code' },
  { name: 'Vitamins' },
];

return <AquariumView fishes={fishes} />;
```
