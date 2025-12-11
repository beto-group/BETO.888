
### Devlog: 111% Energy & The Marketplace Pivot

**The Shift**
Since we knew what had to be done following a showcase to colleagues in a completely different tech sector, the feedback received was **"Marketplace."** So, we put 111% of our energy towards this. Last month’s finalization of component isolation was actually the first step in this master plan, and this month was about creating the infrastructure to achieve it.

**The Learning Curve (K8s & AI)**
Prior to this, we had zero knowledge of Kubernetes. We discovered every pitfall imaginable. But we learned a crucial lesson: with AI, you must understand the *implications* of what each piece of the puzzle should strive for, rather than worrying too much about the structure itself. We failed the first time by prioritizing "Nice to Have" features, but in round two, we focused strictly on the skeleton. Now, we have a muscle-ready MVP.

**The Grind (IIWII)**
We won’t lie, the schedule has been ridiculous. 12-24 hour days. It’s borderline unhealthy, but when we have a goal and a timeframe, we get it done no matter what. We still need better structure overall, but the outcome is well worth the time commitment. *It is what it is (iiwii).* Currently operating out of a hostel, where the other guests are getting worried and confused by schedule. Gotta keep people on their toes. 🃏

**The Tech Stack (Security First)**
This month, we deployed the full solution:
* **Infrastructure:** A complete K8s setup with automated backup solutions, solid basic scaling, and load balancing.
* **The "Datacore" Admin Portal:** A creative security solution where the infrastructure isn't reliably available through a browser—it’s accessible *only* through Obsidian via the plugin. While we know it's not perfect, relying on the plugin account plus extra security layers to even access the portal significantly reduces the threat vector.
* **Beto.group Landing Page Redesign:** We redesigned the landing page to better reflect our architecture, resolving the memory leaks and crashes the community reported in the Mind Forge and Devlog sections.
* **Custom Email Hosting**: Since AWS has very strict standard to follow and haven't gone approved yet we needed to pivot approach and have come up with a more sustainable and profitable approach for our operations.

**Marketplace Status**
The marketplace is live. It currently shows all the components we have developed over the past year. While anyone can already upload their own components, we are finalizing the upload experience as it isn't up to standard yet. We are also establishing a quick and secure workflow to test, validate, and approve each component. We honestly need more discussion within the Datacore community to determine the best step forward here. Payment gateways for paid components are **Coming Soon**.

**The Future?**
We would rather create it than talk about it and ruin the surprise, but... expect the unexpected. We have a 3-4 month plan to bring this to a whole new level, completely destroying the collective perspective of what is truly possible within the Obsidian Community ;) . We shall keep posting update on the BETO.888 essentially turning it into a demo vault over a complete library since we now have the marketplace. Possibly keeping only the latest builds and fundamental building block to make vault work. Idk yet keep you all posted.

As well, on a side note that with the addition of the Obsidian Plugin, we can bring a new way to interact with everyone, promoting engagement and rewarding users through their accounts (much work is required to flesh this out to ensure API security— like always WIP hehe).

Take care you all 🫡
b.