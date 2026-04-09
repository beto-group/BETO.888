---
tags: datacore-component
---

# ViewComponent

```jsx
const { useState } = dc;

function InnerView({ folderPath }) {
    return (
        <div style={{ 
            padding: '20px', 
            background: 'rgba(0, 255, 0, 0.1)', 
            border: '1px solid #0f0', 
            borderRadius: '8px', 
            textAlign: 'center',
            color: '#cfc'
        }}>
            <h3>🚀 Inner Component Loaded!</h3>
            <p>I am a .component.md file rendered inside RemotionClone.</p>
            <div style={{ fontSize: '10px', marginTop: '10px', opacity: 0.7 }}>
                Path: {folderPath || 'Unknown'}
            </div>
        </div>
    );
}

return { ViewComponent: InnerView };
```
