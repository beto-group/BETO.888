/**
 * View factory that loads dependencies and returns the component
 */
async function View({ folderPath }) {
  const { useState } = dc;
  
  // Load all dependencies
  const { findNearestAncestorWithClass, findDirectChildByClass } = await dc.require(folderPath + '/src/utils/domUtils.jsx');
  const { STYLES } = await dc.require(folderPath + '/src/styles/styles.jsx');
  const { BasicComponent } = await dc.require(folderPath + '/src/components/BasicComponent.jsx');

  function ViewComponent() {
    const [key, setKey] = useState(0);

    const handleCodeReload = () => {
      setKey((prev) => prev + 1);
      if (dc.app.workspace.activeLeaf?.rebuildView) {
        dc.app.workspace.activeLeaf.rebuildView();
      }
    };

    return (
      <BasicComponent 
        key={key} 
        onCodeReloadRequest={handleCodeReload} 
        domUtils={{ findNearestAncestorWithClass, findDirectChildByClass }}
        styles={STYLES}
      />
    );
  }
  
  return <ViewComponent />;
}

return { View };