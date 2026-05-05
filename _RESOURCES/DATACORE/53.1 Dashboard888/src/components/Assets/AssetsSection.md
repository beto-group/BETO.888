# AssetsSection

```jsx
const CURRENT_FILE = dc.resolvePath("AssetsSection.md");
const DASH_ROOT = CURRENT_FILE.split('/').slice(0, -4).join('/');
const { AssetsLibrary } = await dc.require(
    dc.headerLink(`${DASH_ROOT}/_resources/components/AssetsLibrary/ASSETS LIBRARY.md`, "AssetsLibrary")
);
const { LoadingScreen } = await dc.require(dc.headerLink(dc.resolvePath("src/components/Shared/HeroComponents.md"), "HeroComponents"));

function AssetsSection(props) {
    const { OverlayLogo } = props;
    return (
        <div style={{ height: "60vh" }}>
            <AssetsLibrary {...props} OverlayLogo={OverlayLogo} LoadingScreen={LoadingScreen} />
        </div>
    );
}

return { AssetsSection };
```
