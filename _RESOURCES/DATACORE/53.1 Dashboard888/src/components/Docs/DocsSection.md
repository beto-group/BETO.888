# DocsSection

```jsx
const CURRENT_FILE = dc.resolvePath("DocsSection.md");
const DASH_ROOT = CURRENT_FILE.split('/').slice(0, -4).join('/');
const { IntegratedDevelopmentSuite_v18: IntegratedDevelopmentSuite, DocsDetailView, parseModuleFileContent } = await dc.require(
    dc.headerLink(`${DASH_ROOT}/src/IntegratedDevelopmentSuite.md`, "IntegratedDevelopmentSuite_v18")
);

function DocsSection({ isActive, openModal, OverlayLogo, localTheme }) {
    return <IntegratedDevelopmentSuite isActive={isActive} openModal={openModal} OverlayLogo={OverlayLogo} localTheme={localTheme} />;
}

return { DocsSection, DocsDetailView, parseModuleFileContent };
```
