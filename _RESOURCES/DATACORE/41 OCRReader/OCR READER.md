---
author: beto.group
name.official: OCR Reader
price: "0"
category:
  - utility
tags:
  - text-extraction
  - ocr
  - image-processing
  - tesseract-js
  - offline
  - productivity
  - clipboard
  - cdn
desc: A client-side OCR tool that extracts text from vault images, uploads, or clipboard content using Tesseract.js, featuring offline caching.
status: stable
complexity: intermediate
ext.dependencies:
  - tesseract-js
id: 41
resources:
  - ocrreader.clip.webm
  - ocr_reader.webp
longDesc: A comprehensive and user-friendly Optical Character Recognition (OCR) tool that runs directly inside Obsidian. It allows users to extract text from various image sources—including files from their vault, uploaded images, or pasted clipboard content—using the Tesseract.js library. The entire process is managed through a clean, modern, and immersive full-pane interface.
does: '[  {    "title": "Multi-Source Image Input",    "children": [      {        "title": "Vault Integration",        "content": "Provides a dropdown menu to select any image file (.png, .jpg, .webp, etc.) directly from the Obsidian vault."      },      {        "title": "File Upload & Drag-and-Drop",        "content": "Features a dedicated drop zone where users can drag and drop an image from their computer or click to open a file picker."      },      {        "title": "Clipboard Pasting",        "content": "The drop zone also accepts images pasted directly from the clipboard (Ctrl/Cmd + V)."      }    ]  },  {    "title": "Live Image Preview",    "content": "Immediately displays a preview of the selected, uploaded, or pasted image so the user can confirm their selection before processing."  },  {    "title": "Powerful OCR Processing",    "children": [      {        "content": "Integrates the Tesseract.js library to perform high-quality text recognition directly in the browser."      },      {        "content": "Displays a live progress bar during the OCR process, providing real-time feedback on the extraction status."      }    ]  },  {    "title": "Dynamic Dependency Loading & Caching",    "children": [      {        "content": "Intelligently checks if the Tesseract.js library is available and, if not, dynamically loads it from a CDN."      },      {        "content": "Once downloaded, the script is saved to a local cache (.datacore/script_cache) within the vault, enabling full offline functionality and faster loads on subsequent uses."      }    ]  },  {    "title": "Interactive Results Display",    "children": [      {        "content": "Renders the extracted text in a large, readable text area."      },      {        "content": "Includes a one-click \"Copy to Clipboard\" button to easily transfer the extracted text for use in other notes or applications."      }    ]  },  {    "title": "Immersive Full-Tab UI",    "children": [      {        "content": "Designed to run by default in a \"Full-Tab Mode\" that takes over the entire Obsidian view pane."      },      {        "content": "Features a polished, dark-themed interface with purple accents, clear section-based workflow, and helpful status indicators."      }    ]  }]'
cant: '[  {    "title": "Process PDFs or Other Document Types",    "content": "It is specifically designed for image files and cannot perform OCR on PDF documents, Word files, or other non-image formats."  },  {    "title": "Recognize Handwriting with High Accuracy",    "content": "Tesseract.js is primarily optimized for printed text. While it may have some success with neat handwriting, its accuracy will be significantly lower compared to typed or printed characters."  },  {    "title": "Edit or Modify the Source Image",    "content": "The tool is for text extraction only; it does not include any image editing capabilities like cropping or rotating."  },  {    "title": "Function Offline on First Run",    "content": "It requires an active internet connection the very first time it runs to download and cache the Tesseract.js library and its associated language data. All subsequent uses are fully offline-capable."  }]'
disclaimer: '[  {    "content": "This component is a proof-of-concept designed to showcase the integration of a complex, client-side machine learning library (Tesseract.js) within Datacore. The accuracy of the OCR process can vary significantly depending on the quality, language, and font of the source image. It serves as a powerful example of what is possible rather than a finished, production-ready tool."  }]'
version.obsidian: 1.4.11
version: 2.0.5
---



### Tab: OCR Reader

- **Description**: A comprehensive and user-friendly Optical Character Recognition (OCR) tool that runs directly inside Obsidian. It allows users to extract text from various image sources—including files from their vault, uploaded images, or pasted clipboard content—using the Tesseract.js library. The entire process is managed through a clean, modern, and immersive full-pane interface.

- **Does**:
   
    - **Multi-Source Image Input**:    
        - **Vault Integration**: Provides a dropdown menu to select any image file (.png, .jpg, .webp, etc.) directly from the Obsidian vault.
        - **File Upload & Drag-and-Drop**: Features a dedicated drop zone where users can drag and drop an image from their computer or click to open a file picker.
        - **Clipboard Pasting**: The drop zone also accepts images pasted directly from the clipboard (Ctrl/Cmd + V).
    - **Live Image Preview**: Immediately displays a preview of the selected, uploaded, or pasted image so the user can confirm their selection before processing.
    - **Powerful OCR Processing**:
        - Integrates the **Tesseract.js** library to perform high-quality text recognition directly in the browser.
        - Displays a live progress bar during the OCR process, providing real-time feedback on the extraction status.
    - **Dynamic Dependency Loading & Caching**:
        - Intelligently checks if the Tesseract.js library is available and, if not, dynamically loads it from a CDN.
        - Once downloaded, the script is **saved to a local cache** (.datacore/script_cache) within the vault, enabling **full offline functionality** and faster loads on subsequent uses.
    - **Interactive Results Display**:
        - Renders the extracted text in a large, readable text area.
        - Includes a one-click "Copy to Clipboard" button to easily transfer the extracted text for use in other notes or applications.
    - **Immersive Full-Tab UI**:
        - Designed to run by default in a "Full-Tab Mode" that takes over the entire Obsidian view pane.
        - Features a polished, dark-themed interface with purple accents, clear section-based workflow, and helpful status indicators.

- **Can’t**:
   
    - **Process PDFs or Other Document Types**: It is specifically designed for image files and cannot perform OCR on PDF documents, Word files, or other non-image formats.    
    - **Recognize Handwriting with High Accuracy**: Tesseract.js is primarily optimized for printed text. While it may have some success with neat handwriting, its accuracy will be significantly lower compared to typed or printed characters.
    - **Edit or Modify the Source Image**: The tool is for text extraction only; it does not include any image editing capabilities like cropping or rotating.
    - **Function Offline on First Run**: It requires an active internet connection **the very first time it runs** to download and cache the Tesseract.js library and its associated language data. All subsequent uses are fully offline-capable.

- **Disclaimer**:
   
    - This component is a proof-of-concept designed to showcase the integration of a complex, client-side machine learning library (Tesseract.js) within Datacore. The accuracy of the OCR process can vary significantly depending on the quality, language, and font of the source image. It serves as a powerful example of what is possible rather than a finished, production-ready tool.


-----

![ocrreader.clip.webm](_resources/videos/ocrreader.clip.webm)


![alt text](_resources/images/ocr_reader.webp)



### Components

###### [OCR Reader Viewer](D.q.ocrreader.viewer.md)

###### [OCR Reader Component](D.q.ocrreader.component.md)

