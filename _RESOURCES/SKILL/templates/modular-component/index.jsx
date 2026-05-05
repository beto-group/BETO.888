// ─────────────────────────────────────────────────────────────
// 🚀 BOOTSTRAPPER TEMPLATE
// ─────────────────────────────────────────────────────────────

async function View(props) {
    const { dc, folderPath } = props;
    const base = folderPath + "/src";
    
    try {
        const [styles, app] = await Promise.all([
            dc.require(`${base}/core/Styles.js`),
            dc.require(`${base}/App.jsx`)
        ]);

        return <app.App dc={dc} styles={styles} />;

    } catch (e) {
        console.error("Bootstrap failed:", e);
        return <div>Error loading modules.</div>;
    }
}

return { View };
