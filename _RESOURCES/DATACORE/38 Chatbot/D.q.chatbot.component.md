






# ViewComponent

```jsx
const { useState, useEffect } = dc;

function TelegramBotSender() {
  const [messageContent, setMessageContent] = useState("");
  const [status, setStatus] = useState("Ready to send message to Telegram.");

  // !!! IMPORTANT: THIS URL IS STILL THE SOURCE OF net::ERR_NAME_NOT_RESOLVED !!!
  // This format (e.g., .cloudflare-748.workers.dev) is often a temporary preview URL
  // that may not be stable or reliably resolvable.
  // Using your worker's official production URL (e.g., .your-subdomain.workers.dev) is highly recommended.
  const WORKER_BASE_URL = "https:/your-installation-setup-😜.cloudflare-748.workers.dev"; // <--- NO TRAILING SLASH HERE

  /**
   * Handles sending messages to Telegram.
   */
  const handleSendMessage = async () => {
    if (!messageContent.trim()) {
      setStatus("Error: Message content cannot be empty.");
      return;
    }
    setStatus("Sending message to Telegram (no direct response expected)..."); // Update status message

    try {
      const response = await fetch(`${WORKER_BASE_URL}/send-telegram`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: messageContent }),
        mode: "no-cors" // <--- ADDED: This bypasses CORS preflight check, but makes response opaque
      });

      // --- CRITICAL: Due to 'mode: "no-cors"', you CANNOT read the response body. ---
      // The `response` object here will be "opaque".
      // response.ok will always be true.
      // response.status will always be 0.
      // response.json() or response.text() will throw an error.

      // We can only check if the fetch operation itself didn't error out.
      // Since it cannot read the response, we assume success IF the fetch didn't throw.
      // The status will be updated here.
      setStatus(`✅ Message sent (Worker response not readable due to no-cors). Check Telegram!`);
      setMessageContent(""); // Clear the textarea, as the message should have been sent

    } catch (error) {
      // This catch block will almost certainly still be hit because
      // you cannot call .json() or .text() on an opaque response.
      console.error("Fetch Error with no-cors:", error);
      setStatus("❌ Worker response not readable (due to no-cors mode). Check Telegram bot directly.");
    }
  };

  return (
    <div
      style={{
        width: "100%", padding: "15px", border: "2px solid #555",
        borderRadius: "8px", display: "flex", flexDirection: "column",
        gap: "15px", backgroundColor: "#222", color: "#eee",
        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
        maxHeight: "90vh", overflowY: "auto",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      }}
    >
      <h2 style={{ marginBottom: '10px', color: '#7CC', textAlign: 'center', fontSize: '1.8em' }}>
        💬 Telegram Bot Interface 💬
      </h2>
      
      <p style={{ fontSize: '0.9em', color: '#bbb', textAlign: 'center', minHeight: '1.2em' }}>
        Status: {status}
      </p>

      {/* Message Sender Section */}
      <div style={{ border: '1px solid #444', borderRadius: '5px', padding: '10px', backgroundColor: '#2b2b2b' }}>
        <h3 style={{ marginTop: '0', color: '#DAB', fontSize: '1.4em' }}>Send a Message</h3>
        <textarea
          value={messageContent}
          onChange={(e) => setMessageContent(e.target.value)}
          rows="5"
          placeholder="Type your message to send to Telegram..."
          style={{
            width: 'calc(100% - 20px)', padding: '10px', backgroundColor: '#333',
            border: '1px solid #555', borderRadius: '4px', color: '#eee',
            fontSize: '1em', resize: 'vertical', outline: 'none', fontFamily: 'inherit',
          }}
        ></textarea>

        <button
          onClick={handleSendMessage}
          style={{
            backgroundColor: '#0088CC', color: 'white', border: 'none',
            padding: '12px 20px', borderRadius: '5px', cursor: 'pointer',
            fontSize: '1.1em', fontWeight: 'bold', transition: 'background-color 0.2s ease',
            alignSelf: 'center', minWidth: '180px', marginTop: '15px', display: 'block',
            marginLeft: 'auto', marginRight: 'auto',
          }}
        >
          Send to Telegram
        </button>
      </div>
    </div>
  );
};

return { BasicView: TelegramBotSender };
```


