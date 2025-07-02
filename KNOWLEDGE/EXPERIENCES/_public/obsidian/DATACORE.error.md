




How to handle all error occurs
	just provide this to llm and it will know what to do ;)





### **ErrorType 1: `SyntaxError: Cannot use import statement outside a module`.    - i believe this is wrong way to explain wip

#### **Cause:**

This error occurs because the environment you are using doesn’t support ES6 `import`/`export` syntax out-of-the-box, but rather requires using CommonJS (`require`) or an alternative method. In your case, you are restricted to using `dc`-provided components, and external imports or modules are not supported directly.

---

#### **Steps to Fix the Error (within `dc` environment):**

1. **Avoid using `import` statements**:
    
    - Do not attempt to import external libraries or hooks like `useState` from Preact or React.
    - All functionalities should be handled within the `dc` ecosystem. Use `dc` components, hooks, and utilities.
    
    **Example**:
    ```jsx
    // Instead of importing Preact hooks 
    // import { useState } from 'preact/hooks'; // ❌  
    // Use dc's state management 
    const [state, setState] = dc.useState(); // ✅`
	```



1. **Ensure all required features are built-in to `dc`**:
    
    - If you need to manage state, use `dc.useState`.
    - If you need to query data, use `dc.useQuery`.
    - If you're working with tables or UI components, use `dc`'s built-in table components like `dc.VanillaTable`.
3. **Rebuild Components with `dc` utilities**:
    
    - Any component or functionality should rely solely on `dc`. If something external is needed, check if there’s an equivalent in `dc`, and use that.

---

#### **Helper Prompt for Debugging This Error in Future**

```
1. Check for any `import` statements in the code. If found, remove them.  
2. Use `dc`-provided utilities and hooks instead of relying on external imports (e.g., use `dc.useState` instead of importing `useState`). 

3. Ensure all data fetching, state management, and UI components use the `dc` ecosystem. 4. Ensure no external dependencies are being brought into the environment that only supports `dc` components.``

By ensuring that your code exclusively uses `dc` components and avoids external imports, this error will be resolved.
```
