---
permalink: license_guide
---

Welcome! This guide helps you understand the licensing for BETO.GROUP software Releases (the Obsidian vaults we provide). Our goal is to be flexible, encourage open-source, and support our community.

**Understanding this guide is key to using our Releases correctly, especially if you create your own projects ("Derivative Works") based on them.**

**Always refer to our full Terms of Service (ToS) for the complete legal agreement. This guide simplifies concepts from Section 1 of the ToS.**

---

## 1. Our Core Licensing Model: You Have Choices!

When you get a BETO.GROUP Release, you have two main ways its license works for you:

**Path A: The Standard Path (MIT First, then GPLv3)**

- **First 6 Months (MIT License):** For the first six (6) calendar months from its official "Date of Availability," the Release is under the very permissive **MIT License**.
    
    - **What MIT lets you do:** Freely use, copy, modify, and distribute the Release or your modifications, even in commercial projects. You just need to include our original MIT copyright and permission notices.
        
- **After 6 Months (GPLv3 License):** After the 6-month MIT window, this specific Release automatically transitions to the **GNU General Public License v3 (GPLv3)**.
    
    - **What GPLv3 requires (it's "copyleft"):** If you modify a GPLv3 Release and distribute it, your entire modified version must also be licensed under GPLv3, and you must make the source code of your changes available.
        

**Path B: Elective GPLv3 from Start (Your Choice)**

- **Your Option:** For any BETO.GROUP Release, you can choose to treat it as being licensed to you under the **GPLv3 License immediately** from when you get it.
    
- **How to Choose:** This is your internal decision. If you decide this, you don't need to tell us. However, all your obligations under GPLv3 for that Release start right away.
    
- **No MIT Window:** If you choose this path for a Release, there's no 6-month MIT window for it. It's GPLv3 for you from day one.
    

---

## 2. Building Your Own Projects (Derivative Works)

This is where understanding the licenses is most important! "Your Derivative Works" are new projects or customized vaults you create that use parts of one or more BETO.GROUP Releases.

**A. The "MIT Continuance Condition" (Keeping Your Project MIT-Compatible)**

If you want Your Derivative Work (based on BETO.GROUP components you got under **Path A: Standard Path MIT First**) to remain MIT-compatible (or under another permissive license you choose for your additions), you must meet this condition:

- **The Condition:** Your Derivative Work must demonstrably include or be based on substantial components from at least one **"Current MIT Release."**
    
    - **What's a "Current MIT Release"?** It's a BETO.GROUP Release that:
        
        1. You obtained under its **Standard Path** (MIT first).
            
        2. Is still within its own 6-month Initial MIT Window.
            
        3. You have not elected to treat as GPLv3 from the start.
            
- **Why this matters:** If you meet this condition, all BETO.GROUP code in Your Derivative Work that was originally from a Standard Path MIT Release is treated as remaining under the MIT License within your project, even if its original 6-month window has passed. This is a special permission from BETO.GROUP.
    
- **If Not Met:** If Your Derivative Work no longer contains a "Current MIT Release," then any BETO.GROUP components from Releases whose MIT windows have expired will fully be governed by GPLv3. This likely means Your Entire Derivative Work must then comply with GPLv3 if you distribute it.
    
- **See Full Details:** Section 1.4 of our Terms of Service has the complete explanation. **A summary for quick reference:** "To keep your derivative works (based on our Standard Path MIT components) MIT-compatible, you must actively integrate a Current MIT Release from BETO.GROUP. See Section 1.4 of our ToS for full details."
    

**B. When Your Derivative Work Becomes GPLv3**

Your Derivative Work must be licensed under GPLv3 if:

- It contains any BETO.GROUP Release component that has transitioned to GPLv3 (because its 6-month MIT window under the Standard Path expired and you didn't meet the MIT Continuance Condition for it within your project).
    
- It contains any BETO.GROUP Release component that you elected to treat as GPLv3 from the start (Path B).
    
- You're just modifying and distributing a single BETO.GROUP Release that is already under GPLv3 (either by transition or your election).
    

---

## 3. How to State the License of YOUR Derivative Work

It's good practice and often required by licenses to state the license of your work. Here are suggested texts you can adapt and include directly in your project (e.g., in a README file, an "About" section, or a dedicated [[888/PROJECTS/888/_OPERATION/PUBLIC/LICENSE]] note within your derivative work):

**If Your Derivative Work is MIT-Compatible (e.g., under the MIT License, thanks to the MIT Continuance Condition):**

```MIT License
## License

This project/derivative work is licensed under the MIT License.
Copyright (c) [Year] [Your Name/Your Entity Name]

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

---

**Regarding BETO.GROUP Components:**
This project incorporates components from BETO.GROUP Release(s). These BETO.GROUP components are:
- Used under the MIT License, in accordance with BETO.GROUP's Terms of Service, including the MIT Continuance Condition (Section 1.4), as this project actively integrates a "Current MIT Release" from BETO.GROUP.
  *(OR, if all BETO.GROUP components are still within their initial 6-month MIT window):*
- Used under the MIT License, as they are currently within their Initial MIT Window as defined in BETO.GROUP's Terms of Service.

The original MIT license terms applicable to BETO.GROUP components (which are identical to the MIT License text above) are also included within those original Releases and should be preserved where encountered.
```

(You would then include the standard MIT License text in your LICENSE.md file or directly).

**If Your Derivative Work MUST Be Under GPLv3:**

```GPLv3
## License

This project/derivative work is licensed under the GNU General Public License v3.0.
Copyright (c) [Year] [Your Name/Your Entity Name]

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details.

A copy of the GNU General Public License should accompany this program;
if not, please see <https://www.gnu.org/licenses/> for the full license text.
(See accompanying file `COPYING` or `LICENSE-GPLv3.txt` for the full license text if included).

---
**Regarding BETO.GROUP Components:**
This project incorporates and/or is derived from BETO.GROUP Release(s) which are subject to the GPLv3. As such, this entire derivative work is also licensed under the GPLv3.
```


**Important:**

- These are suggestions. Adapt them to accurately reflect your project.
    
- Always include the actual license text (MIT or GPLv3) as required.
    
- If you add your own original work to a derivative, you choose the compatible license for your additions. If the base requires GPLv3, your additions will also be covered by GPLv3 when distributed as part of the whole.
    

---

## 4. Where to Find Official Licensing Information

BETO.GROUP is committed to providing clear information:

**(a) Release Dates & Embedded Info:**

- Each Release's official "Date of Availability" (start of its MIT Window for the Standard Path) is found:
    
    - On the official download page or its accompanying documentation.
        
    - Within the [[CHANGE LOG]] file inside each Release.
        
- This [[LICENSE GUIDE]] and the [[FAQ.enigma]] note are included inside each Release to help you.
    

**(b) Website Resources:**

- Our Website has a dedicated **[[LICENSE GUIDE|Licensing Guide]] page and/or [[FAQ.classic|FAQ]] section**.
    
- These provide further explanations, clarify your rights and responsibilities, and include a **reference table listing BETO.GROUP Releases with their MIT License periods and GPLv3 transition dates** (for the Standard Path).
    
- **Please consult these resources regularly!**
    

---

## 5. Your Key Responsibilities - A Quick Summary

- **Understand Your Choice:** For each Release, decide if you're using the Standard Path (MIT first) or electing GPLv3 from the start.
    
- **Track MIT Windows:** If using the Standard Path, be aware of the 6-month MIT window for each Release.
    
- **Meet MIT Continuance:** If aiming for an MIT-compatible derivative work using Standard Path components, ensure you meet the MIT Continuance Condition.
    
- **Comply with GPLv3:** If any part of your project is GPLv3 (by transition or election), your whole distributed project likely needs to be GPLv3.
    
- **Consult the ToS:** This guide is a summary. The full Terms of Service are the definitive legal document.
    

---

## 6. Important Disclaimer

This License Guide is for informational purposes only and does not constitute legal advice. While we strive for clarity, your specific situation may require consultation with a legal professional familiar with open-source licensing, especially if you have complex distribution plans for Derivative Works.

BETO.GROUP provides this licensing model at its discretion. Any changes will be made according to Section 11 (Modification of Terms) of the [[TERMS OF SERVICE|ToS]] and will apply prospectively.

---

**Thank you for being part of the BETO.GROUP community!**  
If you have questions after reading this guide, the [[FAQ.enigma]], and the [[TERMS OF SERVICE|ToS]], feel free to reach out via our community channels or contact information provided in the ToS.

---