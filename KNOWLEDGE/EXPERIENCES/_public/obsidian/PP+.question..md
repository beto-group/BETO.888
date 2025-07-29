



Question
how to use sucrase webpack to create an obsidian plugin that allow us to use third party plug-in inside obsidian publish

This 
https://github.com/alangpierce/sucrase/tree/main/integrations/webpack-loader

To create an Obsidian plugin that allows third-party plugins to be deployed in Obsidian Publish, follow these steps:

1. **Set Up Your Environment**: Use the Obsidian sample plugin template to create your project[](https://docs.obsidian.md/Plugins/Getting+started/Build+a+plugin)[](https://forum.obsidian.md/t/generate-an-obsidian-plugin-project-quickly/49082).
2. **Configure Webpack and Sucrase**: Set up Webpack to bundle your plugin, and use Sucrase for fast JavaScript and TypeScript compilation.
3. **Develop Your Plugin**: Write the plugin code to facilitate loading third-party plugins. Ensure your `manifest.json` is correctly configured[](https://www.reddit.com/r/ObsidianMD/comments/tpodka/how_can_i_manually_install_plugins/)[](https://docs.obsidian.md/Plugins/Releasing/Submit+your+plugin).
4. **Testing**: Test the plugin locally in a separate vault to avoid data loss[](https://docs.obsidian.md/Plugins/Getting+started/Build+a+plugin).
5. **Submit for Review**: Once complete, submit your plugin to the Obsidian community plugins list for review[](https://docs.obsidian.md/Plugins/Releasing/Submit+your+plugin).




