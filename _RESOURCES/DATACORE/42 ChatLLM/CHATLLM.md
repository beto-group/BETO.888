

### Tab: Multi-Provider AI Chat

- **Description**: A comprehensive, multi-modal, and multi-provider AI chat interface designed to run within your vault. It features a persistent chat history, a detailed settings panel for managing various LLM providers, and support for text, image, and YouTube video inputs.
    
- **Does**:
    - **Multi-Provider Support**: Connects to a wide range of AI services, including Google Gemini, OpenAI, Anthropic, Groq, OpenRouter, Cerebrium, and a local Ollama instance.
    - **Persistent State**: Saves all chat conversations, provider settings, and API keys securely within the local vault, allowing you to pick up where you left off.
    - **Multi-Modal Input**: Accepts text, uploaded image files (for vision-capable models), and YouTube video URLs (for Gemini).
    - **Advanced Chat Interaction**:        
        - Allows users to edit a previous prompt and re-run the conversation from that point.
        - Provides a button to re-generate the last AI response.
    - **Rich UI & UX**:
        - Features a responsive three-panel layout (History, Chat, Settings).
        - Renders AI responses as formatted Markdown, with automatic "Copy" buttons on code blocks.
        - Displays previews for attached images before sending.
        - Provides clear loading and error state indicators.
    - **Deep Configuration**:        
        - A dedicated settings panel to manage each provider's API key, base URL, and specific parameters (e.g., temperature, grounding, context window).
        - Includes a "Fetch Models" feature to automatically populate the list of available models from the selected provider.
        - Allows for manual addition and removal of models.

- **Can’t**:
    - **Provide API Keys**: The component is an interface only; users **must** supply their own API keys for cloud-based services.
    - **Stream Responses**: It waits for the full response from the API before displaying it; it does not show text token-by-token as it's being generated.
    - **Export Chats to Markdown**: While chats are saved as JSON, there is no built-in function to export a conversation as a formatted .md file.
    - **Use Voice Input/Output**: The interface is limited to text and visual media; it does not support microphone input or text-to-speech output.
    - **Manage Provider Accounts**: It does not handle billing, usage tracking (beyond the last turn's token count), or account creation for any of the AI services.
        


![alt text](/_RESOURCES/IMAGES/chat_llm.webp)


###### [Chat LLM Viewer](D.q.chatllm.viewer.md)

###### [Chat LLM Component](D.q.chatllm.component.md)

