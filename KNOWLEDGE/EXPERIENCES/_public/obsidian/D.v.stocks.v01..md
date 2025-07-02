




```datacorejsx
// Retrieve View from setup file
const { View } = await dc.require(dc.headerLink("component.vSTOCK.md", "viewer"));

const initialSettingsOverride = {
  vaultName: "YourActualVaultName", // **IMPORTANT:** Replace with your actual vault name :wip
  stockSymbol: "AAPL", // Predefine the stock symbol here
  tiingoApiToken: "ba52ec9f06d234ce904c48fa7424ad2d6a815794", // Replace with your actual Tiingo API token
  viewHeight: "600px",
  placeholders: {
    headerTitle: "Stock Viewer",
  },
};

return <View initialSettingsOverride={initialSettingsOverride} />;
```
