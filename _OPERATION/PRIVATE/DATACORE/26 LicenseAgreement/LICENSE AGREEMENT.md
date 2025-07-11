
### Tab: LicenseAgreement

- **Description**: A modal-like component that presents a "Terms of Service" agreement which the user must accept by completing a series of checklist tasks. It blocks all other application functionality until the terms are accepted.

- **Does**:
   
    - Displays an iframe with an external "Terms of Service" webpage.
    - Fetches a list of tasks from a specific local markdown file (TERMS OF SERVICE.approval.md).
    - Requires the user to check off all tasks in the list to enable the "Proceed" button.
    - Once the user proceeds, the view disappears, restoring normal application access.
    - Aggressively blocks user input and application commands (like hotkeys and the command palette) while active to ensure the agreement is addressed.
    - If a task is unchecked after the agreement was initially satisfied, the modal will reappear, forcing re-agreement.

- **Can’t**:

    - Load its tasks or iframe content from a dynamic source; they are hardcoded.
    - Be dismissed or bypassed without completing all the required tasks.
    - Remember its "completed" state between page reloads; it re-evaluates the task file every time it loads.


![license_agreement.webp](/_RESOURCES/IMAGES/license_agreement.webp)




### Components

###### [License Agreement Viewer](D.q.licenseagreement.viewer.md)

###### [License Agreement Component](D.q.licenseagreement.component.md)
