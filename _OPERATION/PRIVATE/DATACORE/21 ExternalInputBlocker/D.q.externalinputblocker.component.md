

# ViewComponent

```jsx
const { useEffect, useRef, useState } = dc;

function BasicView() {
  const viewRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);
  let originalCommands = null;
  let originalExecuteCommand = null;
  let originalExecute = null;

  const handleKeyDown = (event) => {
    if (!isFocused) return; // Only block when focused

    // Allow Command + W (or Ctrl + W)
    if ((event.metaKey || event.ctrlKey) && event.key === 'w') {
      console.log('BasicView: Allowing Command + W');
      return;
    }

    // Block command-related shortcuts
    if (event.metaKey || event.ctrlKey || event.altKey) {
      console.log('BasicView: Blocking modifier key event', event.key);
      event.stopPropagation();
      event.preventDefault();
      if (viewRef.current) {
        viewRef.current.focus();
      }
      return;
    }

    // Block other key events outside the component
    if (viewRef.current && !viewRef.current.contains(event.target)) {
      console.log('BasicView: Blocking key event', event.key);
      event.stopPropagation();
      event.preventDefault();
      viewRef.current.focus();
    }
  };

  const handleFocus = () => {
    if (!dc.app || !dc.app.commands) {
      console.warn('BasicView: dc.app or dc.app.commands unavailable');
      return;
    }
    setIsFocused(true);
    console.log('BasicView: Component focused, applying blocking');

    // Store original command state
    originalCommands = dc.app.commands.commands || {};
    originalExecuteCommand = dc.app.commands.executeCommandById;
    originalExecute = dc.app.commands.execute;

    // Disable commands
    dc.app.commands.commands = {};
    console.log('BasicView: Commands registry cleared', dc.app.commands.commands);

    // Override executeCommandById
    dc.app.commands.executeCommandById = (commandId) => {
      if (commandId === 'workspace:close') {
        console.log('BasicView: Allowing command: workspace:close');
        return originalExecuteCommand.call(dc.app.commands, commandId);
      }
      console.log('BasicView: Blocking command:', commandId);
      return false;
    };

    // Override execute
    dc.app.commands.execute = (command) => {
      if (command && command.id === 'workspace:close') {
        console.log('BasicView: Allowing command via execute: workspace:close');
        return originalExecute.call(dc.app.commands, command);
      }
      console.log('BasicView: Blocking command via execute:', command?.id);
      return false;
    };

    // Add keydown listener
    document.addEventListener('keydown', handleKeyDown, { capture: true });
  };

  const handleBlur = () => {
    setIsFocused(false);
    console.log('BasicView: Component blurred, removing blocking');

    // Restore commands
    if (dc.app && dc.app.commands) {
      dc.app.commands.commands = originalCommands || {};
      dc.app.commands.executeCommandById = originalExecuteCommand;
      dc.app.commands.execute = originalExecute;
      console.log('BasicView: Commands restored');
    }

    // Remove keydown listener
    document.removeEventListener('keydown', handleKeyDown, { capture: true });
  };

  useEffect(() => {
    // Validate dc.app
    if (!dc.app) {
      console.warn('BasicView: dc.app is not available');
      return;
    }
    if (!dc.app.commands) {
      console.warn('BasicView: dc.app.commands is undefined', dc.app);
      return;
    }
    console.log('BasicView: Using dc.app', dc.app);

    // Add focus/blur listeners
    viewRef.current?.addEventListener('focus', handleFocus);
    viewRef.current?.addEventListener('blur', handleBlur);

    // Cleanup
    return () => {
      viewRef.current?.removeEventListener('focus', handleFocus);
      viewRef.current?.removeEventListener('blur', handleBlur);
      if (isFocused && dc.app && dc.app.commands) {
        dc.app.commands.commands = originalCommands || {};
        dc.app.commands.executeCommandById = originalExecuteCommand;
        dc.app.commands.execute = originalExecute;
        document.removeEventListener('keydown', handleKeyDown, { capture: true });
        console.log('BasicView: Cleanup - Commands restored');
      }
    };
  }, []);

  return (
    <div
      ref={viewRef}
      tabIndex={0}
      style={{
        height: '66vh',
        padding: '10px',
        border: `2px solid ${isFocused ? '#00ff00' : 'white'}`,
        borderRadius: '8px',
        backgroundColor: isFocused ? 'rgba(0, 255, 0, 0.1)' : 'transparent',
        boxShadow: isFocused ? '0 0 10px #00ff00' : 'none',
        outline: 'none',
        transition: 'all 0.3s ease',
      }}
    >
      <h2>TITLE</h2>
      {isFocused && (
        <div style={{ color: '#00ff00', fontSize: '12px', marginTop: '5px' }}>
          Active Scene
        </div>
      )}
    </div>
  );
}

return { BasicView };
```