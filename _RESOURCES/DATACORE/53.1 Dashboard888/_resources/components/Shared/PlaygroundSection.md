# PlaygroundSection

```jsx
function PlaygroundSection(props) {
    const { DatacorePlayground } = props;
    return (
        <div style={{ width: '100%', height: '100%' }}>
            <DatacorePlayground initialFilePath={props.playgroundFilePath} />
        </div>
    );
}

return { PlaygroundSection };
```
