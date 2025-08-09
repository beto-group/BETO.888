
### Tab: Receipt Tracker & Dashboard

- **Description**: An advanced, two-part system for automating receipt processing and financial analysis. The "Processor" view uses OCR and AI to extract structured data from receipt images, while the "Dashboard" view provides a rich, interactive visualization of all processed financial data with charts and filterable stats.
    
- **Does**:
    - **Automated Processing**:
        - Scans a user-specified folder for receipt images (.png, .jpg, etc.).    
        - Uses the "Text Extractor" plugin to perform OCR on each image.
        - Sends the OCR text to the Groq API (Llama3) to intelligently extract key financial data into a structured JSON format.
        - Saves the extracted data and a link to the original image into a new, organized Markdown file for each receipt.
    - **Interactive Processor UI**:
        - Displays a list of all receipts in the target folder, with icons indicating their processing status (processed, failed, or unprocessed).
        - Features an interactive layout where users can expand/focus on the file list, the processing panel, or the summary view.
        - Allows for manual editing and correction of the extracted JSON data via a modal window.
        - Provides a "Process All" button for batch processing of all unprocessed receipts in the folder.
    - **Financial Dashboard**:
        - Aggregates data from all processed receipts into a single analytical view.
        - Displays key metrics like total spending, receipt count, and average spend in dynamic stat cards.
        - Renders D3.js charts to visualize monthly spending trends and spending by merchant.
        - Supports filtering data by time period (e.g., This Year, Last 30 Days) and by currency.
        - Automatically fetches exchange rates to convert and display aggregated totals in a single base currency.
    - **Robust API Management**:
        - Manages a list of multiple Groq API keys.
        - Automatically cycles through the available keys if one fails due to rate limits, improving processing resilience.

- **Can’t**:    
    - Function without the "Text Extractor" Obsidian community plugin being installed and enabled.
    - Perform AI data extraction without at least one valid Groq API key.
    - Capture images directly from a camera; it only processes existing image files in the vault.
    - Automatically categorize spending into buckets like "Food," "Travel," or "Utilities." - can find `/Receipts/_Processed` to edit through
    - Edit the raw OCR text output, though the final extracted JSON can be corrected.
    - Function in the "All Currencies" dashboard view if the required exchange rates are unavailable from the frankfurter.app API.
    - Generate a single, consolidated report file (e.g., a CSV or PDF summary).
        

<iframe allowfullscreen src="https://www.youtube.com/embed/20FY51LTV9Y" width="100%" height="555" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" ></iframe>  

![alt text](/_RESOURCES/IMAGES/receipt_tracker.webp)


###### [Receipt Tracker Viewer](D.q.receipttracker.viewer.md)

###### [Receipt Tracker Component](D.q.receipttracker.component.md)