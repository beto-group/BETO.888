



You're absolutely correct! When using a custom domain with Obsidian Publish, you can leverage the publish.js file to inject custom JavaScript into your published site. This functionality allows you to load third-party plugins or add additional interactive features that aren't natively supported in Obsidian Publish.

Here's how you can create an Obsidian plugin and utilize publish.js to load third-party plugins in your published site. Please note that plugin developers may need to adjust their plugins to ensure compatibility with this method.


---

Important Considerations

Security Risks: Loading external scripts can pose security risks. Ensure that any third-party plugins you load are from trusted sources and have been reviewed for security vulnerabilities.

Compatibility: Not all Obsidian plugins are designed to run in a web environment. Plugins may need modifications to work correctly when loaded via publish.js.

Functionality Limitations: Some features available in the Obsidian desktop app might not be supported in the published site.



---

Step-by-Step Guide

1. Set Up Your Environment

Prerequisites: Ensure you have Node.js and npm installed.

Create a New Plugin: Use the Obsidian sample plugin template to scaffold your plugin.

Obsidian Plugin Getting Started Guide



2. Develop Your Obsidian Plugin

Create a plugin that collects and stores the list of third-party plugins you want to load in your published site.

manifest.json

{
  "id": "publish-plugin-loader",
  "name": "Publish Plugin Loader",
  "version": "1.0.0",
  "minAppVersion": "0.12.0",
  "description": "Allows loading of third-party plugins in Obsidian Publish via publish.js.",
  "author": "Your Name",
  "authorUrl": "https://yourwebsite.com",
  "isDesktopOnly": false
}

main.ts

import { Plugin, PluginSettingTab, Setting } from 'obsidian';

interface PluginLoaderSettings {
  pluginsToLoad: string[];
}

const DEFAULT_SETTINGS: PluginLoaderSettings = {
  pluginsToLoad: [],
};

export default class PublishPluginLoader extends Plugin {
  settings: PluginLoaderSettings;

  async onload() {
    console.log('Publish Plugin Loader: Loading plugin');

    await this.loadSettings();

    this.addSettingTab(new PluginLoaderSettingTab(this.app, this));
  }

  onunload() {
    console.log('Publish Plugin Loader: Unloading plugin');
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
    // Write settings to a file in the vault
    const filePath = 'publish-plugin-settings.json';
    const fileContent = JSON.stringify(this.settings);
    let file = this.app.vault.getAbstractFileByPath(filePath);

    if (file) {
      await this.app.vault.modify(file, fileContent);
    } else {
      await this.app.vault.create(filePath, fileContent);
    }
  }
}

class PluginLoaderSettingTab extends PluginSettingTab {
  plugin: PublishPluginLoader;

  constructor(app: App, plugin: PublishPluginLoader) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();
    containerEl.createEl('h2', { text: 'Publish Plugin Loader Settings' });

    new Setting(containerEl)
      .setName('Plugins to Load')
      .setDesc('Enter the URLs of the plugins to load, one per line.')
      .addTextArea((textArea) => {
        textArea
          .setPlaceholder('https://example.com/plugin.js')
          .setValue(this.plugin.settings.pluginsToLoad.join('\n'))
          .onChange(async (value) => {
            this.plugin.settings.pluginsToLoad = value
              .split('\n')
              .map((url) => url.trim())
              .filter((url) => url.length > 0);
            await this.plugin.saveSettings();
          });
        textArea.inputEl.style.width = '100%';
        textArea.inputEl.style.height = '200px';
      });
  }
}

Explanation:

Settings Interface: Stores the URLs of the plugins to load.

Settings Tab: Provides a UI for users to input the plugin URLs.

Settings Persistence: Saves settings to both plugin data and a JSON file (publish-plugin-settings.json) in the vault, which will be published.


3. Build the Plugin

package.json

{
  "name": "publish-plugin-loader",
  "version": "1.0.0",
  "main": "dist/main.js",
  "scripts": {
    "build": "webpack --mode production",
    "dev": "webpack --watch"
  },
  "devDependencies": {
    "ts-loader": "^9.2.6",
    "typescript": "^4.5.4",
    "webpack": "^5.65.0",
    "webpack-cli": "^4.9.1",
    "@types/obsidian": "^0.13.0"
  }
}

tsconfig.json

{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM"],
    "declaration": true,
    "outDir": "dist",
    "rootDir": ".",
    "strict": true,
    "moduleResolution": "node",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "experimentalDecorators": true,
    "sourceMap": true,
    "inlineSources": true,
    "types": ["obsidian"]
  },
  "exclude": ["node_modules", "dist"]
}

webpack.config.js

const path = require('path');

module.exports = {
  context: __dirname,
  mode: 'production',
  entry: './main.ts',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'main.js',
    libraryTarget: 'commonjs',
  },
  target: 'web',
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  externals: {
    obsidian: 'commonjs obsidian',
  },
};

Build the Plugin:

npm install
npm run build

4. Install and Configure the Plugin

Copy the manifest.json, main.js (from the dist folder), and any other required files into a folder named publish-plugin-loader inside your vault's .obsidian/plugins/ directory.

Enable the plugin in Obsidian under Settings > Community Plugins.

Configure the plugin by entering the URLs of the third-party plugins you want to load.


5. Modify publish.js to Load the Plugins

Create or edit the publish.js file in the root of your custom domain's server. This file will be automatically loaded by your published site.

publish.js

<script>
// Function to dynamically load scripts
function loadScript(url) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = url;
    script.defer = true;
    script.onload = () => resolve(url);
    script.onerror = () => reject(new Error(`Failed to load script: ${url}`));
    document.head.appendChild(script);
  });
}

// Fetch the plugin settings from the published JSON file
fetch('/publish-plugin-settings.json')
  .then(response => {
    if (!response.ok) {
      throw new Error('Plugin settings file not found');
    }
    return response.json();
  })
  .then(settings => {
    const pluginUrls = settings.pluginsToLoad || [];
    return Promise.all(pluginUrls.map(url => loadScript(url)));
  })
  .then(() => {
    console.log('All third-party plugins loaded successfully');
  })
  .catch(error => {
    console.error('Error loading third-party plugins:', error);
  });
</script>

Explanation:

loadScript Function: Dynamically loads JavaScript files by appending script tags to the document head.

Fetching Settings: Retrieves the list of plugin URLs from publish-plugin-settings.json.

Loading Plugins: Loads each plugin script specified in the settings.


6. Ensure Third-Party Plugins are Compatible

Third-party plugins need to be adjusted to work in the web environment. Here are steps that plugin developers should follow:

Remove Node.js Dependencies: Replace any Node.js-specific code with browser-compatible alternatives.

Use Browser APIs: Utilize Web APIs for functionalities like DOM manipulation, event handling, etc.

Global Initialization: Expose a global function or object to initialize the plugin after it's loaded.


Example of an Adjusted Third-Party Plugin:

// my-third-party-plugin.js

(function() {
  // Plugin code here
  function initializePlugin() {
    console.log('My Third-Party Plugin Initialized');
    // Plugin functionality
  }

  // Expose the initialization function globally
  window.myThirdPartyPlugin = {
    init: initializePlugin
  };
})();

Initialize the Plugin in publish.js:

Modify the then block after all scripts are loaded to initialize the plugins:

.then(() => {
  // Initialize plugins after they have been loaded
  if (window.myThirdPartyPlugin && typeof window.myThirdPartyPlugin.init === 'function') {
    window.myThirdPartyPlugin.init();
  }
  // Repeat for other plugins as necessary
})

7. Host the Third-Party Plugins

CDN or Server: Host the adjusted plugin scripts on a CDN or a server accessible via HTTPS.

Ensure Accessibility: The scripts must be accessible from your published site without CORS issues.


8. Publish Your Vault

Include the Settings File: Make sure publish-plugin-settings.json is included in the list of files to publish.

Publish: Use Obsidian Publish to update your site with the new settings and any additional files.



---

Testing the Setup

1. Local Testing: Before publishing, test the setup locally using a simple HTTP server to serve your site and scripts.


2. Verify Plugin Loading: After publishing, visit your site and check the browser console for any errors.


3. Functionality Check: Ensure that the plugins are not only loading but also functioning as expected.




---

Security and Privacy Considerations

Content Security Policy (CSP): If your site uses CSP headers, ensure they allow scripts from the domains hosting your plugins.

HTTPS: Serve all scripts over HTTPS to prevent mixed content warnings.

Trusted Sources: Only load plugins from trusted sources to minimize security risks.



---

Limitations and Notes

Functionality Limitations: Some Obsidian desktop functionalities may not be available in the published site.

Plugin Support: Not all plugins can be made compatible with this method due to inherent limitations.

Maintenance: You are responsible for maintaining and updating the third-party plugins you include.



---

Example Project Structure

your-vault/
├── .obsidian/
│   └── plugins/
│       └── publish-plugin-loader/
│           ├── manifest.json
│           └── main.js
├── publish-plugin-settings.json
└── notes/


---

Further Enhancements

Automate Plugin Initialization: Modify the plugin scripts to self-initialize upon loading.

Error Handling: Enhance error handling in publish.js to provide more informative messages.

UI Improvements: Improve the settings UI in your plugin for better user experience.



---

Disclaimer

Use at Your Own Risk: This method involves injecting scripts into your published site, which can have security implications.

Obsidian Support: This approach is not officially supported by Obsidian. Use caution and consider reaching out to the Obsidian community for support.

Compliance: Ensure that you comply with all relevant terms of service and licenses when using and distributing third-party plugins.



---

Conclusion

By leveraging publish.js on your custom domain, you can extend the functionality of your Obsidian Publish site by loading third-party plugins. This approach requires collaboration with plugin developers to ensure compatibility and a careful consideration of security practices.


---

If you have any questions or need further assistance with specific aspects of this setup, feel free to ask!



You're absolutely right! Incorporating Sucrase into the build process can significantly speed up compilation times and simplify your Webpack configuration. Sucrase is a super-fast alternative to Babel or ts-loader for transpiling modern JavaScript and TypeScript code, especially when you don't need type checking during the build.

Let's update the previous setup to utilize Sucrase via the @sucrase/webpack-loader. This will allow us to compile our TypeScript code efficiently while building your Obsidian plugin for use with Obsidian Publish.


---

Updated Step-by-Step Guide Using Sucrase

1. Install Sucrase and the Webpack Loader

First, install Sucrase and the Sucrase Webpack loader as development dependencies:

npm install --save-dev @sucrase/webpack-loader sucrase

2. Update webpack.config.js

Modify your webpack.config.js to use the Sucrase loader instead of ts-loader.

Previous webpack.config.js:

module.exports = {
  // ...other configurations
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  // ...other configurations
};

Updated webpack.config.js using Sucrase:

const path = require('path');

module.exports = {
  context: __dirname,
  mode: 'production',
  entry: './main.ts',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'main.js',
    libraryTarget: 'commonjs',
  },
  target: 'web',
  module: {
    rules: [
      {
        test: /\.[jt]s$/,
        exclude: /node_modules/,
        use: {
          loader: '@sucrase/webpack-loader',
          options: {
            transforms: ['typescript', 'jsx'], // Add 'jsx' if you're using JSX
          },
        },
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  externals: {
    obsidian: 'commonjs obsidian',
  },
};

Explanation:

Loader Configuration: Replaces ts-loader with @sucrase/webpack-loader.

Transforms Option: Specifies that we're transforming TypeScript code (and JSX if needed).

Test Regex: Adjusted to include both .ts and .js files (/\.[jt]s$/), covering JavaScript and TypeScript files.


3. Update package.json Scripts

No changes are needed here unless you wish to modify scripts. The existing scripts should work as expected.

4. Rebuild the Plugin

After updating the configuration, rebuild your plugin:

npm run build

5. Continue with the Previous Steps

Now, continue with the rest of the steps as outlined earlier:

Install and Configure the Plugin: Copy the built plugin files to your Obsidian vault and enable it.

Modify publish.js: Update your publish.js file to load third-party plugins in your published site.

Ensure Third-Party Plugins are Compatible: Adjust third-party plugins to work in the web environment if necessary.

Host the Third-Party Plugins: Make sure the plugins are hosted on accessible servers.

Publish Your Vault: Include all necessary files when publishing.



---

Additional Notes

Why Use Sucrase?

Performance: Sucrase is designed for speed and can significantly reduce build times compared to ts-loader or Babel.

Simplicity: It focuses on removing type annotations and transpiling syntax, without additional features like type checking.

Modern JavaScript Features: Supports modern JavaScript syntax, including object rest/spread properties.


Limitations of Sucrase

No Type Checking: Sucrase does not perform type checking. It's purely a transpiler that strips type annotations.

Recommendation: Use the TypeScript compiler (tsc) separately for type checking during development.


Adding Type Checking

To ensure your code remains type-safe, add a separate script for type checking.

Update package.json Scripts:

{
  "scripts": {
    "build": "webpack --mode production",
    "dev": "webpack --watch",
    "type-check": "tsc --noEmit"
  }
}

Run Type Checking:

npm run type-check

This will check your TypeScript code for errors without emitting any files.


---

Example Project Structure After Updates

your-plugin/
├── dist/
│   └── main.js
├── src/
│   └── main.ts
├── manifest.json
├── package.json
├── tsconfig.json
├── webpack.config.js
└── publish.js


---

Ensuring Compatibility with Object Rest/Spread Syntax

As noted, using object rest/spread syntax (e.g., {...a, b: c}) requires Webpack 4 or later. Ensure your project uses a compatible version of Webpack.


---

Complete webpack.config.js Example

Here's the full webpack.config.js file incorporating Sucrase:

const path = require('path');

module.exports = {
  context: __dirname,
  mode: 'production', // Use 'development' for unminified output
  entry: './src/main.ts', // Adjust the entry point if necessary
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'main.js',
    libraryTarget: 'commonjs',
  },
  target: 'web',
  module: {
    rules: [
      {
        test: /\.[jt]s$/,
        exclude: /node_modules/,
        use: {
          loader: '@sucrase/webpack-loader',
          options: {
            transforms: ['typescript'],
            // If you use JSX or other transforms, add them here
            // transforms: ['typescript', 'jsx'],
          },
        },
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'], // Resolve both .ts and .js files
  },
  externals: {
    obsidian: 'commonjs obsidian', // Don't bundle the Obsidian API
  },
};


---

Sample tsconfig.json

Your tsconfig.json should be configured to match your project needs.

{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM"],
    "strict": true,
    "moduleResolution": "node",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "types": ["obsidian"],
    "noEmit": true, // Prevent emitting files when running tsc
    "skipLibCheck": true
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist"]
}

Explanation:

noEmit: Set to true since we're not using tsc to emit JavaScript files; Sucrase handles that.

include: Specifies the source directory for your TypeScript files.

skipLibCheck: Speeds up type checking by skipping type checks of declaration files.



---

Updating Your Plugin Code (if necessary)

Ensure your TypeScript code is compatible with Sucrase and the web environment:

Avoid Node.js APIs: Since the plugin will run in a browser context when used with Obsidian Publish, avoid using Node.js-specific APIs.

Use Browser APIs: Leverage browser-compatible APIs and ensure any dependencies are also browser-friendly.

Check for Unsupported Syntax: Verify that all the syntax used is supported by Sucrase and your target browsers.



---

Testing the Updated Build Process

After making these changes:

1. Build the Plugin:

npm run build


2. Type Check the Code (optional but recommended):

npm run type-check


3. Load the Plugin in Obsidian:

Copy the manifest.json and the compiled main.js from the dist folder to your plugin directory in the Obsidian vault.

Enable the plugin in Obsidian's settings under Community Plugins.



4. Test Functionality:

Ensure the plugin loads without errors.

Verify that it behaves as expected within Obsidian.



5. Publish and Test in Obsidian Publish:

Update your publish.js and other necessary files.

Publish your site and test the functionality of the plugin in the published site.





---

Security Considerations

Code Safety: Since Sucrase skips type checking, relying solely on it can allow type errors to creep into your codebase. Always run type checking separately.

Third-Party Plugins: Ensure that any third-party plugins you load are safe and come from trusted sources.

CSP Policies: If your site uses Content Security Policy (CSP) headers, update them to allow scripts from the domains hosting your plugins.



---

Troubleshooting

Build Errors:

If you encounter syntax errors during the build, check that all your code is compatible with the transforms specified in Sucrase.

Ensure that all dependencies are properly installed and that there are no version conflicts.


Runtime Errors:

Check the browser console for any errors when running your plugin in Obsidian Publish.

Ensure that any APIs or features used are available in the browser environment.


Type Errors:

Run npm run type-check to identify and fix any type-related issues.




---

Further Enhancements

Source Maps:

Enable source maps for easier debugging by adding sourceMap: true in your tsconfig.json and configuring Webpack accordingly.


Linting:

Integrate ESLint or another linter to maintain code quality.


Testing:

Implement automated tests to ensure your plugin works as expected.




---

Conclusion

By integrating Sucrase into your Webpack build process, you can enjoy faster builds and a streamlined development experience. Remember to include separate type checking in your workflow to maintain code quality.

Utilizing publish.js along with your plugin allows you to extend the functionality of your Obsidian Publish site, enabling the use of third-party plugins in a way that was not natively supported.


---

Feel free to reach out if you need further assistance with any step or have additional questions!

