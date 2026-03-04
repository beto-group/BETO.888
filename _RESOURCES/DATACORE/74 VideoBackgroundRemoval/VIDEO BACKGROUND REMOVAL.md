



### Tab: Video Background Removal

- **Description**: A specialized client-side video processing utility that removes black backgrounds from uploaded videos. It leverages HTML5 Canvas and offers two processing modes: a fast simple Luma Key, and a performance-intensive boundary-aware Flood Fill designed to preserve internal shadows inside bright outlines. It supports real-time preview scaling and exports the processed result directly to a transparent WebM file.

- **Does**:
   
    - **Background Keying modes**:    
        - **Boundary-Aware (Flood Fill)**: Uses a 4-point connectivity flood fill algorithm that stops at bright boundaries (white outlines), preserving internal dark areas and shadows.
        - **Simple Luma Key (Fast)**: A faster processing mode that removes all pixels below the black threshold, suitable for videos without internal dark details.
    - **Processing Controls**:
        - **Adjustable Thresholds**: Fine-tune the sensitivity for both the 'Black Threshold' (what counts as background) and the 'Boundary Threshold' (brightness to stop the flood fill).
        - **Preview Resolution Scaling**: Adjust the processing resolution from 10% to 100% to maximize performance during preview, while ensuring exports always process at 100% resolution.
    - **Input and Export**:
        - **Drag-and-Drop Local Files**: Easily load local video files into the processor using drag-and-drop or a file picker.
        - **WebM Transparent Export**: Records the canvas output and dynamically exports a processed transparent WebM video directly to the user's device.

- **Can’t**:
   
    - **Hardware Accelerated Rendering**: The boundary-aware flood fill algorithm is CPU-bound on the Canvas API, making it performance-intensive on very high-resolution videos.    
    - **Export as Transparent MP4**: Due to browser limitations with alpha channels in MP4 recording, it is strictly limited to exporting WebM files.
    - **Process Audio Channels**: The tool processes visual frames only. Playback and exports are muted, and original audio is not preserved in the exported WebM.


----

![video_background_removal_1.webp](_resources/images/video_background_removal_1.webp)


### Components

###### [Video Background Removal Viewer](D.q.videobackgroundremoval.viewer.md)
