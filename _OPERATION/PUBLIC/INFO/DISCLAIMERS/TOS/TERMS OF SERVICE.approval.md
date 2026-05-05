- [ ] By checking this box, I confirm that I have read, understood, and agree to be bound by the BETO.GROUP Terms of Service and Privacy Policy.





```datacorejsx
////////////////////////////////////////////////////
///             Viewer Entry Point               ///
////////////////////////////////////////////////////
const { LicenseAgreement } = await dc.require(dc.headerLink(dc.resolvePath("D.q.licenseagreement.component.md"), "ViewComponent"));
return <LicenseAgreement />;

```