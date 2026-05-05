# BoxLayout

```jsx
const { useState, useEffect } = dc;

function BoxLayout(props) {
    const { 
        title, 
        description, 
        cover, 
        getMediaResourcePath,
        children 
    } = props;
    
    const [coverUrl, setCoverUrl] = useState(null);

    useEffect(() => {
        if (cover && getMediaResourcePath) {
            getMediaResourcePath(cover).then(setCoverUrl);
        }
    }, [cover]);

    return (
        <div className="layout-box" style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>

            {/* Content Area */}
            <div className="layout-content" style={{ flex: 1 }}>
                {children}
            </div>
        </div>
    );
}

return { BoxLayout };
```
