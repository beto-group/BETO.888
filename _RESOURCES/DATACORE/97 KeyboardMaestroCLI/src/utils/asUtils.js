/**
 * asUtils.js
 * AppleScript generation + execution engine for Keyboard Maestro
 * Runs scripts via osascript through child_process
 */

function runAppleScript(script) {
    return new Promise((resolve) => {
        let spawn;
        try { spawn = require('child_process').spawn; }
        catch (e) { return resolve({ success: false, error: 'child_process unavailable' }); }

        const child = spawn('osascript', ['-e', script], { stdio: ['pipe', 'pipe', 'pipe'] });
        let stdout = '', stderr = '';
        child.stdout.on('data', (d) => { stdout += d.toString(); });
        child.stderr.on('data', (d) => { stderr += d.toString(); });
        child.on('close', (code) => {
            const output = stdout.trim() || stderr.trim();
            if (code === 0) resolve({ success: true, output });
            else resolve({ success: false, error: output || `Exit code ${code}` });
        });
        child.on('error', (err) => resolve({ success: false, error: err.message }));
    });
}

async function listMacroGroups() {
    const script = `
tell application "Keyboard Maestro"
    set output to ""
    repeat with g in macro groups
        set output to output & name of g & "\n"
    end repeat
    return output
end tell`;
    const result = await runAppleScript(script);
    if (result.success) {
        return result.output.split('\n').map(s => s.trim()).filter(Boolean);
    }
    return [];
}

async function listMacros() {
    const script = `
tell application "Keyboard Maestro"
    set output to ""
    repeat with m in macros
        set output to output & name of m & "\n"
    end repeat
    return output
end tell`;
    const result = await runAppleScript(script);
    if (result.success) {
        return result.output.split('\n').map(s => s.trim()).filter(Boolean);
    }
    return [];
}

async function listMacrosByGroup() {
    const script = `
tell application "Keyboard Maestro"
    set output to ""
    repeat with g in macro groups
        set output to output & "GROUP:" & name of g & "|ENABLED:" & enabled of g & "\n"
        repeat with m in macros of g
            set output to output & "MACRO:" & name of m & "|ENABLED:" & enabled of m & "\n"
        end repeat
    end repeat
    return output
end tell`;
    const result = await runAppleScript(script);
    if (!result.success) return [];

    const lines = result.output.split('\n').map(s => s.trim()).filter(Boolean);
    const groups = [];
    let current = null;
    for (const line of lines) {
        if (line.startsWith('GROUP:')) {
            if (current) groups.push(current);
            const parts = line.slice(6).split('|ENABLED:');
            current = { group: parts[0], enabled: parts[1] === 'true', macros: [] };
        } else if (line.startsWith('MACRO:') && current) {
            const parts = line.slice(6).split('|ENABLED:');
            current.macros.push({
                name: parts[0],
                enabled: parts[1] === 'true'
            });
        }
    }
    if (current) groups.push(current);
    return groups;
}

async function setMacroEnabled(macroName, enabled) {
    const script = `tell application "Keyboard Maestro" to set enabled of macro "${macroName}" to ${enabled}`;
    return runAppleScript(script);
}

async function getMacroEnabled(macroName) {
    const script = `tell application "Keyboard Maestro" to return enabled of macro "${macroName}"`;
    const result = await runAppleScript(script);
    return result.success && result.output === 'true';
}

async function setGroupEnabled(groupName, enabled) {
    const script = `tell application "Keyboard Maestro" to set enabled of macro group "${groupName}" to ${enabled}`;
    return runAppleScript(script);
}

async function deleteMacro(macroName) {
    const script = `tell application "Keyboard Maestro" to delete macro "${macroName}"`;
    return runAppleScript(script);
}

const KM_KEYS = { 'a': 0, 's': 1, 'd': 2, 'f': 3, 'h': 4, 'g': 5, 'z': 6, 'x': 7, 'c': 8, 'v': 9, 'b': 11, 'q': 12, 'w': 13, 'e': 14, 'r': 15, 'y': 16, 't': 17, '1': 18, '2': 19, '3': 20, '4': 21, '6': 22, '5': 23, '9': 25, '7': 26, '8': 28, '0': 29, 'k': 40, 'l': 37 };

function buildCreateMacroScript({ macroName, groupName, trigger, action, enabled = true }) {
    const escapeXML = (s) => (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const escapeAS = (s) => (s || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"');

    // Trigger XML
    let triggerXML = '';
    if (trigger.type === 'hotkey') {
        let mods = 0;
        if (trigger.cmd) mods += 256;
        if (trigger.shift) mods += 512;
        if (trigger.opt) mods += 2048;
        if (trigger.ctrl) mods += 4096;
        const keyCode = KM_KEYS[(trigger.key || 'k').toLowerCase()] || 40;
        triggerXML = `<dict><key>FireType</key><string>Pressed</string><key>KeyCode</key><integer>${keyCode}</integer><key>MacroTriggerType</key><string>HotKey</string><key>Modifiers</key><integer>${mods}</integer></dict>`;
    } else if (trigger.type === 'url') {
        triggerXML = `<dict><key>MacroTriggerType</key><string>URL</string><key>URL</key><string>${escapeXML(trigger.scheme || 'myapp')}://</string></dict>`;
    }

    // Action XML
    let actionXML = '';
    if (action.type === 'shell') {
        actionXML = `<dict><key>ActionType</key><string>ExecuteShellScript</string><key>MacroActionType</key><string>ExecuteShellScript</string><key>Text</key><string>${escapeXML(action.script)}</string><key>TimeOutAbortsMacro</key><true/><key>TrimResults</key><true/><key>UseText</key><true/></dict>`;
    } else if (action.type === 'applescript') {
        actionXML = `<dict><key>ActionType</key><string>ExecuteAppleScript</string><key>MacroActionType</key><string>ExecuteAppleScript</string><key>Text</key><string>${escapeXML(action.script)}</string><key>TimeOutAbortsMacro</key><true/><key>TrimResults</key><true/><key>UseText</key><true/></dict>`;
    } else if (action.type === 'keystroke') {
        actionXML = `<dict><key>ActionType</key><string>TypeKeystroke</string><key>MacroActionType</key><string>TypeKeystroke</string><key>KeyCode</key><integer>0</integer><key>Modifiers</key><integer>0</integer><key>Text</key><string>${escapeXML(action.keystroke)}</string></dict>`;
    } else if (action.type === 'notification') {
        actionXML = `<dict><key>ActionType</key><string>DisplayNotification</string><key>MacroActionType</key><string>DisplayNotification</string><key>Title</key><string>${escapeXML(macroName)}</string><key>Text</key><string>${escapeXML(action.message)}</string></dict>`;
    } else if (action.type === 'openfile') {
        actionXML = `<dict><key>ActionType</key><string>OpenFile</string><key>MacroActionType</key><string>OpenFile</string><key>File</key><string>${escapeXML(action.filePath)}</string></dict>`;
    }

    const fullXML = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<array>
	<dict>
		<key>Macros</key>
		<array>
			<dict>
				<key>Actions</key>
				<array>${actionXML}</array>
				<key>Enabled</key>
				<${enabled ? 'true' : 'false'}/>
				<key>Name</key>
				<string>${escapeXML(macroName)}</string>
				<key>Triggers</key>
				<array>${triggerXML}</array>
			</dict>
		</array>
		<key>Name</key>
		<string>${escapeXML(groupName)}</string>
	</dict>
</array>
</plist>`;

    return fullXML;
}

async function createMacro(config) {
    const xml = buildCreateMacroScript(config);
    console.log("[AS] Creating macro with XML:", xml);

    // Write the XML to a temp .kmmacros file
    const tmpPath = '/tmp/km_datacore_macro.kmmacros';
    try {
        const fs = require('fs');
        fs.writeFileSync(tmpPath, xml, 'utf8');
    } catch (e) {
        return { success: false, error: 'Failed to write temp file: ' + e.message };
    }

    // Open it with Keyboard Maestro via AppleScript
    const script = `tell application "Keyboard Maestro" to open POSIX file "${tmpPath}"`;
    return runAppleScript(script);
}

return { runAppleScript, listMacroGroups, listMacros, listMacrosByGroup, setMacroEnabled, getMacroEnabled, setGroupEnabled, deleteMacro, createMacro, buildCreateMacroScript };
