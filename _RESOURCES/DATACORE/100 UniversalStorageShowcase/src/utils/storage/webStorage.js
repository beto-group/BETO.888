const webStorage = {
    local: {
        set: (key, value) => {
            localStorage.setItem(key, value);
            return { success: true, message: "LocalStorage Set" };
        },
        get: (key) => {
            const val = localStorage.getItem(key);
            return { success: true, content: val, message: val ? "LocalStorage Get Success" : "Key not found" };
        }
    },
    cookies: {
        set: (name, value) => {
            try {
                // Simplified cookie set
                document.cookie = `${name}=${encodeURIComponent(value)}; path=/; SameSite=Lax`;

                // Immediate verification check
                if (!document.cookie.includes(name)) {
                    console.warn("Cookie was set but is not appearing in document.cookie. This is often due to file:// protocol restrictions in Obsidian/Electron.");
                    return { success: false, message: "Cookie blocked by browser (Protocol Error)" };
                }
                return { success: true, message: "Cookie Baked Successfully" };
            } catch (e) {
                return { success: false, message: `Cookie Error: ${e.message}` };
            }
        },
        get: (name) => {
            try {
                const cookies = document.cookie.split(';');
                for (let i = 0; i < cookies.length; i++) {
                    const c = cookies[i].trim();
                    if (c.startsWith(name + '=')) {
                        return { success: true, content: decodeURIComponent(c.substring(name.length + 1)), message: "Cookie Found" };
                    }
                }
                if (document.cookie === "") {
                    return { success: false, message: "Cookies disabled or not supported on this protocol (file://)" };
                }
                return { success: false, message: "Cookie not found" };
            } catch (e) {
                return { success: false, message: `Cookie Error: ${e.message}` };
            }
        }
    },
    rest: async (endpoint = 'http://localhost:27124') => {
        try {
            const response = await fetch(endpoint);
            const text = await response.text();
            return { success: true, content: text, message: `REST API Status: ${response.status}` };
        } catch (e) {
            return { success: false, message: `REST Error: ${e.message}` };
        }
    }
};

return { webStorage };
