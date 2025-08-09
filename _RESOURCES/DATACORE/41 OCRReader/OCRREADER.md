


### Tab: OCR Reader

- **Description**: A user interface for performing Optical Character Recognition (OCR) on images. This component acts as a frontend for the "Text Extractor" Obsidian plugin, allowing users to select an image from their vault or upload a new one, and then extract its text content.

- **Does**:
    - Integrates directly with the "Text Extractor" community plugin's API to perform OCR.
    - Allows users to select an image source: either from a dropdown list of all compatible images within the vault or by uploading a custom file from their computer.
    - Displays a preview of the selected image before processing.
    - Can be configured to automatically load and preview a specific image from the vault upon opening.
    - Initiates the OCR process with a single button click and shows a loading state.
    - Presents the extracted text in a scrollable `<pre>` block for easy reading and review.
    - Includes a "Copy Text" button to quickly copy the entire OCR result to the clipboard.        
    - Provides clear feedback, showing an error if the "Text Extractor" plugin is missing or if the extraction fails.
- **Can’t**:
    - Function without the "Text Extractor" Obsidian community plugin being installed and enabled. It has no built-in OCR engine.
    - Configure OCR settings (like language); this must be done in the Text Extractor plugin's own settings panel.        
    - Process multiple images in a batch or from a folder.
    - Edit the extracted text directly within the component's interface.
    - Automatically save the extracted text to a file; it only offers a copy-to-clipboard function.
    - Permanently save uploaded images; they are stored in a temporary directory for processing.


![alt text](/_RESOURCES/IMAGES/ocr_reader.webp)



###### [OCR Reader Viewer](D.q.ocrreader.viewer.md)

###### [OCR Reader Component]([D.q.ocrreader.component.md)

