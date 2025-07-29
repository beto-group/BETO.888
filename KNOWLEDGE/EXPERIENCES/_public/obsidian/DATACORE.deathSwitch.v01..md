

dont run it as a  -datacoretsx

```jsx
const DEBUG_MODE = true; // Set to false to disable debugging

const COLUMNS = [
    { id: "Name", title: "Page Name", value: (page) => page?.$name ?? 'Untitled' },
    { id: "path", title: "File Path", value: (page) => page?.$path ?? 'Unknown' },
    { id: "extension", title: "Extension", value: (page) => page?.$extension ?? 'Unknown' },
    { id: "size", title: "File Size", value: (page) => page?.$size ?? 'Unknown' },
];

const groupings = {
    render: (key, rows) => <h3>Group: {key} ({rows.length} items)</h3>
};

function View() {
    let pages = [];

    try {
        // Attempt to get pages using useQuery; fall back to empty array if an error occurs
        pages = dc.useQuery('@page');
        if (!pages || pages === null) {
            throw new Error("Query returned null or undefined");
        }
        if (DEBUG_MODE) {
            console.log('Query successful. Pages retrieved:', pages);
        }
    } catch (e) {
        console.error('Query failed:', e);
        pages = []; // Fallback to an empty array if the query fails
    }

    // Transform pages into a usable format if the returned structure is complex
    if (Array.isArray(pages)) {
        pages = pages.filter(page => page !== null && typeof page === 'object');
    } else {
        pages = []; // If pages is not an array, reset to empty
    }

    // Check if pages is not an array or is empty
    if (pages.length === 0) {
        if (DEBUG_MODE) {
            console.warn('No pages available to display.');
        }
        return <div>No data available</div>;
    }

    // Map pages to ensure all expected fields are present
    const processedPages = pages.map(page => ({
        Name: page?.$name ?? 'Untitled',
        path: page?.$path ?? 'Unknown',
        extension: page?.$extension ?? 'Unknown',
        size: page?.$size ?? 'Unknown'
    }));

    if (DEBUG_MODE) {
        console.log('Processed Pages:', processedPages);
    }

    return (
        <div>
            <dc.VanillaTable 
                columns={COLUMNS} 
                rows={processedPages} 
                groupings={groupings} 
                paging={10} 
                scrollOnPaging={true} 
            />
        </div>
    );
}

try {
    const viewComponent = View();
    if (viewComponent) {
        const container = document.getElementById('app') || document.body;
        ReactDOM.render(viewComponent, container);
    }
} catch (e) {
    console.error('An unexpected error occurred while rendering the View:', e);
    if (DEBUG_MODE) {
        console.error('Rendering fallback UI due to error');
    }
    document.body.innerHTML = '<div>An unexpected error occurred. Please try again later.</div>';
}

```