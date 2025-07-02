

## ENIGMAS
----

### Interval Repetition Plugin

#### Plugin Overview

- **Functionality**:
    - Implements logic of interval repetitions.
    - Simplifies marking notes for review.

#### Settings

- **Tag**:
    - Use the tag ⏳ to mark notes for review.

#### Example Note

- **Structure**:
    
    - Tag the note with ⏳.
    - Mark it the first time you review it by pressing "hard".
- **Review Process**:
    
    - Use the command palette to start the review process.

#### Interface

- **Review Status**:
    - See the number of notes waiting for review and flashcards to repeat in the lower right corner of Obsidian.
    - Click on this field to start the review process.

#### Recommendation

- **Implement Interval Repetition**:
    - Introduce interval repetition in your system to retain important information and enhance knowledge retention.
    - Remembering well is crucial for knowing and applying what you have learned.

-----

FLASHCARDS

### Interval Repetition

#### What for?

- **Forgetting Curve**:
    
    - If you do not repeat the information, you will likely not remember it for long or remember it poorly.
    - Too little useful information in memory hinders creativity and the ability to apply knowledge effectively.
- **Anki**:
    
    - Advanced repetition program.
    - Difficult to learn but highly effective for rigorous study (e.g., medical students, tough exams).
    - Integration with Obsidian exists but is complex.
- **Simpler Solution**:
    
    - Use the Spaced Repetition plugin in Obsidian for easier implementation.

#### A slight deviation about mathematics

- **Latex Support**:
    - Obsidian supports formulas written in Latex.
    - Useful resources for learning Latex are available.
    - Recommended plugin: Quick Latex for Obsidian.

#### Implementation

- **Flash Cards**:
    - Two main cases:
        1. Term and explanation in one line.
        2. Term in one line, explanation in multiple lines.
    - Assume flash card logic (term shown, explanation hidden).

#### Single-line Flash Card

- **Structure**:
    
    - Term followed by an explanation.
    - Tag used to identify flash cards.
- **Card Appearance**:
    
    - Term displayed, explanation hidden.
    - Evaluate your answer and press:
        - Hard
        - Good
        - Easy

#### Multi-line Flash Card

- **Structure**:
    
    - Multi-line explanation should not have blank lines.
    - Add a long separator between text and graphics.
- **Card Appearance**:
    
    - Term displayed.
    - Explanation revealed on the "back" side.

#### Settings

- **Tag for Notes**:
    
    - Use 🃏 tag to search for notes.
    - Separator for single-line cards: average dash "–".
    - Separator for multi-line cards: long dash "—".
- **Essence of Settings**:
    
    - Plugin looks for notes with the 🃏 tag.
    - Converts them into flash cards using term and definition logic.

#### Flash Cards Usage

- **Teams**:
    
    - Start working on all flashcards.
    - Interface to work on flashcards from the current note.
- **Common Interface**:
    
    - Shows progress and allows verification of card display accuracy.

#### Visuals

- The uploaded images show examples of settings and card display in the spaced repetition plugin within Obsidian.


-----