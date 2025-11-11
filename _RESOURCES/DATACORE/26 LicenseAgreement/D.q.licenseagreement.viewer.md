

- [ ] CLICK HERE




```datacorejsx
////////////////////////////////////////////////////
///             Viewer Entry Point               ///
////////////////////////////////////////////////////
const { LicenseAgreement } = await dc.require(
  dc.headerLink(dc.resolvePath("D.q.licenseagreement.component.md"), "ViewComponent")
);

// Configuration object with all props
const config = {
  targetFileName: "TERMS OF SERVICE.example.approval.md",
  debug: true  // Set to false in production - enables debug bypass button
};

return <LicenseAgreement config={config} />;

```
