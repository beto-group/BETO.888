




## GitSuite

```jsx
const { useEffect, useRef, useState, useMemo } = dc;

// --- Node.js Imports ---
const { spawn } = require('child_process');
const os = require('os');
const fs = require('fs');

// --- Custom UI Components (Replaces Obsidian/Datacore UI) ---

// A generic, self-contained Modal class
class CustomModal {
    constructor() {
        this.overlayEl = null;
    }

    open(contentRenderer) {
        if (this.overlayEl) return; // Modal is already open

        // Create overlay
        this.overlayEl = document.createElement('div');
        this.overlayEl.style.position = 'fixed';
        this.overlayEl.style.top = '0';
        this.overlayEl.style.left = '0';
        this.overlayEl.style.width = '100%';
        this.overlayEl.style.height = '100%';
        this.overlayEl.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
        this.overlayEl.style.display = 'flex';
        this.overlayEl.style.alignItems = 'center';
        this.overlayEl.style.justifyContent = 'center';
        this.overlayEl.style.zIndex = '1000';

        // Create modal content container
        const contentEl = document.createElement('div');
        contentEl.style.backgroundColor = '#1e1e1e';
        contentEl.style.color = '#e0e0e0';
        contentEl.style.padding = '24px';
        contentEl.style.borderRadius = '8px';
        contentEl.style.border = '1px solid #333';
        contentEl.style.minWidth = '400px';
        contentEl.style.maxWidth = '90vw';
        contentEl.style.boxShadow = '0 5px 15px rgba(0,0,0,0.3)';

        // Close modal when clicking on the overlay, but not the content
        this.overlayEl.addEventListener('click', (e) => {
            if (e.target === this.overlayEl) {
                this.close();
            }
        });

        // Pass the content container and a close function to the renderer
        if (typeof contentRenderer === 'function') {
            contentRenderer(contentEl, this.close.bind(this));
        }

        this.overlayEl.appendChild(contentEl);
        document.body.appendChild(this.overlayEl);
    }

    close() {
        if (this.overlayEl) {
            document.body.removeChild(this.overlayEl);
            this.overlayEl = null;
        }
    }
}

// --- Core Execution Logic (Self-contained and stable) ---
function getUserShell() {
    if (os.platform() === 'win32') return 'powershell.exe';
    const preferredShell = process.env.SHELL;
    if (preferredShell && fs.existsSync(preferredShell)) return preferredShell;
    return '/bin/sh';
}

function executeShellCommand(commandString, workingDir) {
    return new Promise((resolve, reject) => {
        const userShell = getUserShell();
        const child = spawn(userShell, ['-l', '-c', commandString], { cwd: workingDir });
        let stdout = '', stderr = '';
        child.stdout.on('data', (data) => { stdout += data.toString(); });
        child.stderr.on('data', (data) => { stderr += data.toString(); });
        child.on('close', (code) => {
            if (code !== 0) reject(new Error(stderr || `Command failed with exit code ${code}: ${commandString}`));
            else resolve(stdout);
        });
        child.on('error', (err) => reject(new Error(`Failed to spawn shell '${userShell}': ${err.message}`)));
    });
}

class NewBranchModal {
    constructor(onSubmit) { this.onSubmit = onSubmit; this.branchName = ''; }
    open() {
        new CustomModal().open((contentEl, close) => {
            const header = contentEl.createEl('h2', { text: 'Create New Branch' });
            header.style.marginTop = '0';

            const textInput = contentEl.createEl('input');
            Object.assign(textInput.style, STYLES.input, { marginBottom: '10px' });
            textInput.placeholder = 'Enter new branch name...';
            textInput.oninput = (e) => this.branchName = e.target.value;

            const createButton = contentEl.createEl('button', { text: 'Create' });
            Object.assign(createButton.style, STYLES.button);
            createButton.onclick = () => { if (this.branchName.trim()) { this.onSubmit(this.branchName.trim()); close(); } };

            textInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); createButton.click(); } });
        });
    }
}

class MergeModal {
    constructor(branches, currentBranch, onSubmit) {
        this.branches = branches.filter(b => b !== currentBranch);
        this.onSubmit = onSubmit;
        this.selectedBranch = this.branches[0] || '';
    }
    open() {
        new CustomModal().open((contentEl, close) => {
            const header = contentEl.createEl('h2', { text: 'Merge Branch' });
            header.style.marginTop = '0';
            contentEl.createEl('p', { text: `Select a branch to merge into the current branch:` });

            const dropdown = contentEl.createEl('select');
            Object.assign(dropdown.style, STYLES.input, { marginBottom: '10px', padding: '8px' });

            if (this.branches.length === 0) {
                dropdown.createEl('option', { text: 'No other branches to merge' });
            } else {
                this.branches.forEach(branch => dropdown.createEl('option', { text: branch, value: branch }));
            }
            dropdown.onchange = (e) => this.selectedBranch = e.target.value;

            const mergeButton = contentEl.createEl('button', { text: 'Merge' });
            Object.assign(mergeButton.style, STYLES.button);
            mergeButton.onclick = () => { if (this.selectedBranch) { this.onSubmit(this.selectedBranch); close(); } };

            if (this.branches.length === 0) mergeButton.disabled = true;
        });
    }
}

class HelpModal {
    open() {
        new CustomModal().open((contentEl, close) => {
            const header = contentEl.createEl('h2', { text: 'Connecting a Remote Repository' });
            header.style.marginTop = '0';
            contentEl.createEl('p', { text: 'To push and pull changes, your local repository needs to connect to a remote one hosted on a service like GitHub, GitLab, or Bitbucket.' });
            contentEl.createEl('p', { text: 'The standard workflow is:' });
            const list = contentEl.createEl('ol');
            list.style.paddingLeft = '20px';
            list.createEl('li', { text: 'Create a new, empty repository on your preferred hosting platform.' });
            list.createEl('li', { text: 'Copy the HTTPS or SSH URL they provide.' });
            list.createEl('li', { text: 'Paste that URL into the "Remote URL" field and click "Set Remote".' });

            const subHeader = contentEl.createEl('h4', { text: 'Create a new repository on:' });
            subHeader.style.marginTop = '20px';

            const linkContainer = contentEl.createDiv({ attr: { style: 'display: flex; flex-direction: column; gap: 10px; margin-top: 10px;' } });
            const linkStyle = 'color: #c084fc; text-decoration: none;';
            linkContainer.createEl('a', { text: 'GitHub', href: 'https://github.com/new', attr: { target: '_blank', rel: 'noopener noreferrer', style: linkStyle } });
            linkContainer.createEl('a', { text: 'GitLab', href: 'https://gitlab.com/projects/new', attr: { target: '_blank', rel: 'noopener noreferrer', style: linkStyle } });
            linkContainer.createEl('a', { text: 'Bitbucket', href: 'https://bitbucket.org/repo/create', attr: { target: '_blank', rel: 'noopener noreferrer', style: linkStyle } });

            contentEl.createEl('p', {
                text: 'You can also use any other Git hosting platform of your choice. Just paste its repository URL.',
                attr: { style: 'margin-top: 20px; font-size: 12px; color: #888888;' }
            });
        });
    }
}

function useGitRepository(initialRepoPath) {
    const [repoPath, setRepoPath] = useState(initialRepoPath || dc.app.vault.adapter.basePath);
    const [remoteUrl, setRemoteUrl] = useState('');
    const [ahead, setAhead] = useState(0);
    const [behind, setBehind] = useState(0);
    const [history, setHistory] = useState([]);
    const [isRepo, setIsRepo] = useState(false);
    const [status, setStatus] = useState({ staged: [], changes: [] });
    const [currentBranch, setCurrentBranch] = useState('...');
    const [branches, setBranches] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    const [gitSystemStatus, setGitSystemStatus] = useState('checking');
    const [gitUserName, setGitUserName] = useState('');
    const [gitUserEmail, setGitUserEmail] = useState('');

    const git = {
        version: () => executeShellCommand('git --version', dc.app.vault.adapter.basePath),
        getConfig: (key) => executeShellCommand(`git config --global ${key}`, dc.app.vault.adapter.basePath),
        setConfig: (key, value) => executeShellCommand(`git config --global ${key} "${value}"`, dc.app.vault.adapter.basePath),
        check: (path) => executeShellCommand('git rev-parse --is-inside-work-tree', path),
        status: (path) => executeShellCommand('git status --porcelain -u', path),
        branch: (path) => executeShellCommand('git symbolic-ref --short HEAD', path),
        allBranches: (path) => executeShellCommand('git branch --all', path),
        init: (path) => executeShellCommand('git init -b main', path),
        clone: (parentPath, url, directoryName) => executeShellCommand(`git clone "${url}" "${directoryName}"`, parentPath),
        add: (path, filePath) => executeShellCommand(`git add "${filePath}"`, path),
        addAll: (path) => executeShellCommand('git add .', path),
        reset: (path, filePath) => executeShellCommand(`git reset HEAD -- "${filePath}"`, path),
        commit: (path, message) => executeShellCommand(`git commit -m "${message.replace(/"/g, '\\"')}"`, path),
        checkout: (path, branchName, isNew = false) => executeShellCommand(`git checkout ${isNew ? '-b' : ''} "${branchName}"`, path),
        discard: (path, filePath) => executeShellCommand(`git checkout -- "${filePath}"`, path),
        pull: (path, branch) => executeShellCommand(`git pull origin "${branch}"`, path),
        push: (path, branch) => executeShellCommand(`git push --set-upstream origin ${branch}`, path),
        getRemote: (path) => executeShellCommand('git remote get-url origin', path),
        addOrUpdateRemote: (path, url) => executeShellCommand(`(git remote set-url origin "${url}" || git remote add origin "${url}")`, path),
        fetch: (path) => executeShellCommand('git fetch --prune', path),
        getAheadBehind: (path, branch) => executeShellCommand(`git rev-list --left-right --count origin/${branch}...${branch}`, path),
        merge: (path, sourceBranch) => executeShellCommand(`git merge "${sourceBranch}"`, path),
        log: (path) => executeShellCommand('git log --all --pretty=format:"%H<||>%P<||>%an<||>%ar<||>%d<||>%s<##>" -n 100', path),
        getLocalCommitCount: (path) => executeShellCommand('git rev-list --count HEAD --not --remotes', path),
    };

    const checkGitSystem = async () => {
        setGitSystemStatus('checking');
        try {
            await git.version();
            const [nameResult, emailResult] = await Promise.allSettled([
                git.getConfig('user.name'),
                git.getConfig('user.email')
            ]);
            const name = (nameResult.status === 'fulfilled' && nameResult.value.trim()) || '';
            const email = (emailResult.status === 'fulfilled' && emailResult.value.trim()) || '';
            setGitUserName(name);
            setGitUserEmail(email);
            if (name && email) {
                setGitSystemStatus('ready');
            } else {
                setGitSystemStatus('not_configured');
            }
        } catch (versionErr) {
            setGitSystemStatus('not_found');
        }
    };

    const refreshState = async (path = repoPath) => {
        // The path object from the adapter has a join method
        const adapterPath = dc.app.vault.adapter.path;

        // The CORRECT check: Does a '.git' folder exist *directly* in this path?
        const repoExists = fs.existsSync(adapterPath.join(path, '.git'));
        setIsRepo(repoExists);


        if (repoExists) {
            try {
                await git.fetch(path).catch(() => { });
                const [statusOutput, branchOutputRaw, allBranchesOutput, remoteOutput, logOutput] = await Promise.all([
                    git.status(path),
                    git.branch(path).catch(() => ""),
                    git.allBranches(path),
                    git.getRemote(path).catch(() => ""),
                    git.log(path).catch(() => "")
                ]);

                let currentBranchName = branchOutputRaw.trim();
                const commits = logOutput.trim().split('<##>').filter(Boolean).map(line => {
                    const [hash, parents, author, date, refs, message] = line.trim().split('<||>');
                    return { hash, parents: parents.split(' ').filter(Boolean), author, date, refs: refs.trim(), message };
                });
                setHistory(commits);

                if (!currentBranchName && commits.length === 0) {
                    currentBranchName = 'main';
                }
                setCurrentBranch(currentBranchName || '...');

                setRemoteUrl(remoteOutput.trim());
                if (remoteOutput.trim() && currentBranchName) {
                    try {
                        const aheadBehindOutput = await git.getAheadBehind(path, currentBranchName);
                        const [behindCount, aheadCount] = aheadBehindOutput.trim().split('\t').map(Number);
                        setAhead(aheadCount || 0);
                        setBehind(behindCount || 0);
                    } catch (e) {
                        try {
                            const localCommits = await git.getLocalCommitCount(path);
                            setAhead(parseInt(localCommits.trim(), 10) || 0);
                        } catch (localErr) { setAhead(0); }
                        setBehind(0);
                    }
                } else {
                    setAhead(0);
                    setBehind(0);
                }

                const staged = [], changes = [];
                statusOutput.split('\n').filter(Boolean).forEach(line => {
                    const code = line.substring(0, 2), filePath = line.substring(3);
                    if (code === '??') changes.push({ path: filePath, status: 'U' });
                    else {
                        if (code[0].trim()) staged.push({ path: filePath, status: code[0].trim() });
                        if (code[1].trim()) changes.push({ path: filePath, status: code[1].trim() });
                    }
                });
                setStatus({ staged, changes });

                const parsedBranches = allBranchesOutput.split('\n')
                    .filter(Boolean)
                    .map(b => b.replace(/^\*?\s*/, '').trim())
                    .filter(b => !b.includes('->'))
                    .map(b => b.replace('remotes/origin/', ''))
                    .filter((v, i, a) => a.indexOf(v) === i)
                    .sort();
                if (currentBranchName && currentBranchName !== '...' && !parsedBranches.includes(currentBranchName)) {
                    parsedBranches.unshift(currentBranchName);
                    parsedBranches.sort();
                }
                setBranches(parsedBranches);

            } catch (e) {
                setError(`Failed to refresh Git status: ${e.message}`);
            }
        } else {
            setCurrentBranch('...');
            setBranches([]);
            setStatus({ staged: [], changes: [] });
            setHistory([]);
            setAhead(0);
            setBehind(0);
            setRemoteUrl('');
        }
    };

    const runAction = async (action, isWriteOperation = false) => {
        setIsProcessing(true);
        if (isWriteOperation) setIsSaving(true);
        setError('');
        try {
            await action();
            await new Promise(res => setTimeout(res, 200));
            await refreshState();
        }
        catch (err) { setError(err.message); }
        finally {
            if (isWriteOperation) setIsSaving(false);
            setIsProcessing(false);
        }
    };

    const handleMerge = async (sourceBranch) => {
        if (status.staged.length > 0 || status.changes.length > 0) {
            setError("You have uncommitted changes. Please commit or stash them before merging to avoid losing work.");
            return;
        }
        await runAction(() => git.merge(repoPath, sourceBranch), true);
    };

    const handlePush = async () => {
        if (behind > 0) {
            setError("Your branch is behind the remote. Please Pull first to avoid conflicts.");
            return;
        }
        await runAction(() => git.push(repoPath, currentBranch), true);
    };

    const cloneRepo = (url, targetDirectory) => runAction(async () => {
        const parentDir = dc.app.vault.adapter.basePath;
        const newRepoPath = dc.app.vault.adapter.path.join(parentDir, targetDirectory);
        if (fs.existsSync(newRepoPath)) {
            throw new Error(`Directory '${targetDirectory}' already exists in the vault.`);
        }
        await git.clone(parentDir, url, targetDirectory);
        setRepoPath(newRepoPath);
    }, true);

    const setGitConfig = (name, email) => runAction(async () => {
        if (!name.trim() || !email.trim()) {
            throw new Error("Both name and email are required.");
        }
        await git.setConfig('user.name', name);
        await git.setConfig('user.email', email);
        await checkGitSystem();
    }, true);

    useEffect(() => {
        (async () => {
            await checkGitSystem();
        })();
    }, []);

    useEffect(() => {
        if (gitSystemStatus === 'ready') {
            (async () => {
                setIsLoading(true);
                await refreshState();
                setIsLoading(false);
            })();
        }
    }, [repoPath, gitSystemStatus]);

    return {
        repoPath, isRepo, status, currentBranch, branches, history, remoteUrl,
        ahead, behind, isLoading, isProcessing, isSaving, error, setRepoPath,
        gitSystemStatus, gitUserName, gitUserEmail,
        checkGitSystem, setGitConfig,
        refresh: () => runAction(() => refreshState(), false),
        init: () => runAction(() => git.init(repoPath), true),
        cloneRepo,
        stage: (filePath) => runAction(() => git.add(repoPath, filePath), true),
        stageAll: () => runAction(() => git.addAll(repoPath), true),
        unstage: (filePath) => runAction(() => git.reset(repoPath, filePath), true),
        discard: (filePath) => runAction(() => git.discard(repoPath, filePath), true),
        commit: (message) => runAction(() => git.commit(repoPath, message), true),
        pull: () => runAction(() => git.pull(repoPath, currentBranch), true),
        push: handlePush,
        merge: handleMerge,
        checkoutBranch: (branchName) => runAction(() => git.checkout(repoPath, branchName), true),
        createBranch: (branchName) => runAction(() => git.checkout(repoPath, branchName, true), true),
        setRemote: (url) => runAction(() => git.addOrUpdateRemote(repoPath, url), true),
    };
}


// =================================================================================
// --- UI COMPONENTS ---
// =================================================================================
const ICONS = {
    branch: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3v12" /><path d="M18 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" /><path d="M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" /><path d="M18 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" /><path d="M6 15h12" /></svg>,
    add: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>,
    remove: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>,
    delete: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>,
    pull: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>,
    push: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 6 12 1 17 6" /><line x1="12" y1="1" x2="12" y2="15" /></svg>,
    refresh: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></svg>,
    chevronDown: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>,
    chevronRight: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>,
    merge: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 18h-3a3 3 0 0 1-3-3V5" /><path d="M6 5v10a3 3 0 0 0 3 3h3" /><path d="m15 15-3-3 3-3" /></svg>,
    remote: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" /></svg>,
    help: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>,
};

const STYLES = {
    wrapper: { position: 'relative', backgroundColor: "#121212", color: "#e0e0e0", fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif", height: "100%", width: "100%", display: "flex", flexDirection: "column", boxSizing: "border-box" },
    mainArea: { padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', flex: 1, overflow: 'hidden' },
    input: { width: '100%', boxSizing: 'border-box', backgroundColor: '#1e1e1e', border: '1px solid #333333', borderRadius: '6px', padding: '10px 14px', color: '#e0e0e0', fontSize: '14px', '::placeholder': { color: '#6b6b6b' }, ':focus': { borderColor: '#9333ea', boxShadow: '0 0 0 2px rgba(147, 51, 234, 0.3)' } },
    button: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', backgroundColor: '#9333ea', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '10px 18px', cursor: 'pointer', fontSize: '14px', fontWeight: 500, transition: 'background-color 0.2s', ':hover': { backgroundColor: '#a855f7' }, ':disabled': { backgroundColor: '#2a2a2a', color: '#6b6b6b', cursor: 'not-allowed' } },
    buttonSecondary: { backgroundColor: '#1e1e1e', color: '#e0e0e0', border: '1px solid #333333', ':hover': { backgroundColor: '#2a2a2a' } },
    buttonIcon: { background: 'transparent', border: '1px solid #333333', color: '#9e9e9e', cursor: 'pointer', padding: '8px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', ':hover': { backgroundColor: '#2a2a2a', color: '#e0e0e0' } },
    branchSelect: { display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#1e1e1e', border: '1px solid #333333', borderRadius: '6px', padding: '8px 12px' },
    commitInput: { minHeight: '90px', resize: 'vertical' },
    historyContainer: { flex: 1, display: 'flex', flexDirection: 'column', gap: '0', overflow: 'hidden', backgroundColor: '#1e1e1e', borderRadius: '8px', border: '1px solid #333333' },
    historyHeader: { padding: '12px 16px', borderBottom: '1px solid #333333', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    historyHeaderTitle: { fontWeight: 500, fontSize: '16px' },
    historyContent: { flex: 1, overflowY: 'auto' },
    historyItem: { position: 'relative', display: 'flex', alignItems: 'center', padding: '16px 16px 16px 35px', borderBottom: '1px solid #333333', ':last-child': { borderBottom: 'none' } },
    historyGraphLine: { position: 'absolute', left: '16px', top: 0, bottom: 0, width: '2px', backgroundColor: '#333333' },
    historyGraphDot: { position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '10px', height: '10px', borderRadius: '50%', zIndex: 1 },
    historyDetails: { display: 'flex', flexDirection: 'column', gap: '6px' },
    historyMessage: { fontWeight: 500, color: '#e0e0e0', fontSize: '14px' },
    historyMeta: { fontSize: '12px', color: '#888888' },
    historyRefPillContainer: { display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' },
    historyRefPill: { padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' },
    historyRefPillHead: { backgroundColor: 'rgba(147, 51, 234, 0.2)', color: '#c084fc' },
    historyRefPillLocal: { backgroundColor: 'rgba(147, 51, 234, 0.2)', color: '#c084fc' },
    historyRefPillRemote: { backgroundColor: '#3a3a3a', color: '#b0b0b0' },
};

const FileListSection = ({ title, files, onStage, onStageAll, onUnstage, onDiscard, defaultOpen = true }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    const hasFiles = files && files.length > 0;

    const getStatusStyle = (status) => {
        const baseStyle = { fontWeight: 'bold', fontFamily: 'monospace', fontSize: '13px', flexShrink: 0, width: '16px', textAlign: 'center' };
        switch (status) {
            case 'M': return { ...baseStyle, color: '#e5c07b' };
            case 'U': return { ...baseStyle, color: '#98c379' };
            case 'D': return { ...baseStyle, color: '#e06c75' };
            case 'A': return { ...baseStyle, color: '#98c379' };
            case 'R': return { ...baseStyle, color: '#c678dd' };
            default: return { ...baseStyle, color: '#abb2bf' };
        }
    };

    return (
        <div style={{ border: '1px solid #333333', borderRadius: '8px', backgroundColor: '#1e1e1e' }}>
            <div style={{ ...STYLES.historyHeader, cursor: 'pointer' }} onClick={() => setIsOpen(!isOpen)}>
                <span style={{ ...STYLES.historyHeaderTitle, fontSize: '14px' }}>{title} ({files.length})</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    {onStageAll && hasFiles && (
                        <button style={{ ...STYLES.buttonIcon, border: 'none' }} title="Stage All" onClick={(e) => { e.stopPropagation(); onStageAll(); }}>
                            {ICONS.add}
                        </button>
                    )}
                    <span style={{ ...STYLES.buttonIcon, pointerEvents: 'none', border: 'none' }}>{isOpen ? ICONS.chevronDown : ICONS.chevronRight}</span>
                </div>
            </div>
            {isOpen && (
                <div>
                    {hasFiles ? (
                        files.map(file => (
                            <div key={file.path} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 16px', borderTop: '1px solid #333333' }}>
                                <span style={{ fontFamily: 'monospace', fontSize: '13px', color: '#b0b0b0', wordBreak: 'break-all' }}>{file.path}</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        {onStage && <button style={{ ...STYLES.buttonIcon, border: 'none' }} title="Stage" onClick={() => onStage(file.path)}>{ICONS.add}</button>}
                                        {onUnstage && <button style={{ ...STYLES.buttonIcon, border: 'none' }} title="Unstage" onClick={() => onUnstage(file.path)}>{ICONS.remove}</button>}
                                        {onDiscard && <button style={{ ...STYLES.buttonIcon, border: 'none' }} title="Discard Changes" onClick={() => onDiscard(file.path)}>{ICONS.delete}</button>}
                                    </div>
                                    <span style={getStatusStyle(file.status)}>{file.status}</span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div style={{ padding: '12px 16px', color: '#6b6b6b', fontSize: '13px', borderTop: '1px solid #333333' }}>No changes to display.</div>
                    )}
                </div>
            )}
        </div>
    );
};

const HistoryView = ({ history }) => {
    const [isOpen, setIsOpen] = useState(true);
    const branchColorMap = useRef(new Map());
    const MAIN_BRANCH_COLOR = '#9333ea';
    const ACCENT_COLORS = ['#f472b6', '#38bdf8', '#2dd4bf', '#fb923c', '#a78bfa', '#facc15'];

    const commitToBranchMap = useMemo(() => {
        const map = new Map();
        if (!history || history.length === 0) return map;
        const commitMap = new Map(history.map(c => [c.hash, c]));
        const branchHeads = [];
        for (const commit of history) {
            const refs = commit.refs.replace(/[()]/g, '').split(',').map(r => r.trim());
            for (const ref of refs) {
                if (!ref.startsWith('origin/') && ref !== 'HEAD' && !ref.startsWith('tag:')) {
                    let branchName = ref.startsWith('HEAD ->') ? ref.replace('HEAD ->', '').trim() : ref.trim();
                    if (branchName && !branchHeads.some(h => h.branchName === branchName)) {
                        branchHeads.push({ branchName, hash: commit.hash });
                    }
                }
            }
        }
        const headHashes = new Set(branchHeads.map(h => h.hash));
        branchHeads.sort((a, b) => {
            if (a.branchName === 'main' || a.branchName === 'master') return -1;
            if (b.branchName === 'main' || b.branchName === 'master') return 1;
            return 0;
        });
        for (const head of branchHeads) {
            const queue = [head.hash];
            const visited = new Set();
            while (queue.length > 0) {
                const currentHash = queue.shift();
                if (!currentHash || visited.has(currentHash)) continue;
                visited.add(currentHash);
                if (map.has(currentHash)) continue;
                if (headHashes.has(currentHash) && currentHash !== head.hash) {
                    continue;
                }
                map.set(currentHash, head.branchName);
                const commit = commitMap.get(currentHash);
                if (commit && commit.parents) {
                    for (const parentHash of commit.parents) {
                        queue.push(parentHash);
                    }
                }
            }
        }
        return map;
    }, [history]);

    const getBranchForCommit = (commit) => commitToBranchMap.get(commit.hash) || 'main';

    const getColorForBranch = (branchName) => {
        if (branchName === 'main' || branchName === 'master') return MAIN_BRANCH_COLOR;
        if (!branchColorMap.current.has(branchName)) {
            let hash = 0;
            for (let i = 0; i < branchName.length; i++) hash = branchName.charCodeAt(i) + ((hash << 5) - hash);
            const colorIndex = Math.abs(hash % ACCENT_COLORS.length);
            branchColorMap.current.set(branchName, ACCENT_COLORS[colorIndex]);
        }
        return branchColorMap.current.get(branchName);
    };

    const parseAndCategorizeRefs = (refsString) => {
        if (!refsString) return [];
        const allRefs = refsString.replace(/[()]/g, '').split(',').map(r => r.trim()).filter(Boolean);
        const headRefName = (allRefs.find(r => r.startsWith('HEAD ->')) || '').replace('HEAD -> ', '');
        return allRefs.filter(r => !r.startsWith('tag:') && r !== 'HEAD').map(ref => {
            let type = 'local';
            if (ref === headRefName) type = 'head';
            else if (ref.startsWith('origin/')) type = 'remote';
            return { name: ref, type };
        });
    };

    return (
        <div style={STYLES.historyContainer}>
            <div style={STYLES.historyHeader} onClick={() => setIsOpen(!isOpen)}>
                <span style={STYLES.historyHeaderTitle}>History</span>
                <span style={{ ...STYLES.buttonIcon, pointerEvents: 'none', border: 'none' }}>{isOpen ? ICONS.chevronDown : ICONS.chevronRight}</span>
            </div>
            {isOpen && (
                <div style={STYLES.historyContent}>
                    {history.map((commit) => {
                        const branchName = getBranchForCommit(commit);
                        const dotColor = getColorForBranch(branchName);
                        return (
                            <div key={commit.hash} style={STYLES.historyItem}>
                                <div style={STYLES.historyGraphLine}></div>
                                <div style={{ ...STYLES.historyGraphDot, backgroundColor: dotColor }}></div>
                                <div style={STYLES.historyDetails}>
                                    <div style={STYLES.historyRefPillContainer}>
                                        {parseAndCategorizeRefs(commit.refs).map(({ name, type }) => {
                                            let style = STYLES.historyRefPill;
                                            if (type === 'head') style = { ...style, ...STYLES.historyRefPillHead };
                                            else if (type === 'remote') style = { ...style, ...STYLES.historyRefPillRemote };
                                            else style = { ...style, ...STYLES.historyRefPillLocal };
                                            return (<span key={name} style={style}>{name}</span>);
                                        })}
                                    </div>
                                    <span style={STYLES.historyMessage}>{commit.message}</span>
                                    <span style={STYLES.historyMeta}>{commit.author} - {commit.date}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

const RepoView = ({ git, commitMessage, setCommitMessage }) => {
    const [remoteInput, setRemoteInput] = useState(git.remoteUrl);

    useEffect(() => {
        setRemoteInput(git.remoteUrl);
    }, [git.remoteUrl]);

    const handleBranchChange = (e) => {
        const selectedValue = e.target.value;
        if (selectedValue === "__CREATE_NEW_BRANCH__") {
            new NewBranchModal((name) => git.createBranch(name)).open();
            e.target.value = git.currentBranch;
        } else if (selectedValue !== git.currentBranch) {
            git.checkoutBranch(selectedValue);
        }
    };

    const openMergeModal = () => {
        new MergeModal(git.branches, git.currentBranch, (selectedBranch) => {
            git.merge(selectedBranch);
        }).open();
    };

    const isRemoteUnchanged = remoteInput === git.remoteUrl;

    const secondaryIconBtn = { ...STYLES.buttonIcon, ...STYLES.buttonSecondary, flex: 1, padding: '8px' };
    const primaryIconBtn = { ...STYLES.button, flex: 1, padding: '8px' };

    return (
        <div style={STYLES.mainArea}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                <div style={{ ...STYLES.branchSelect, padding: '0' }}>
                    <span style={{ paddingLeft: '12px' }}>{ICONS.branch}</span>
                    <select
                        value={git.currentBranch}
                        onChange={handleBranchChange}
                        disabled={git.isProcessing}
                        style={{ background: 'transparent', border: 'none', color: 'inherit', fontWeight: 500, cursor: 'pointer', outline: 'none', width: '100%', padding: '8px 12px' }}
                    >
                        {git.currentBranch && git.currentBranch !== '...' && !git.branches.includes(git.currentBranch) && (
                            <option key={git.currentBranch} value={git.currentBranch}>{git.currentBranch}</option>
                        )}
                        {git.branches.filter(b => !b.startsWith('remotes/')).map(branch => (<option key={branch} value={branch}>{branch}</option>))}
                        <option value="__CREATE_NEW_BRANCH__" style={{ fontStyle: 'italic', color: '#a0a0a0' }}>+ Create new branch...</option>
                    </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ padding: '8px', border: '1px solid #333333', borderRadius: '6px', backgroundColor: '#1e1e1e' }}>{ICONS.remote}</span>
                    <input type="text" value={remoteInput} onChange={(e) => setRemoteInput(e.target.value)} style={{ ...STYLES.input, flex: 1 }} placeholder="Enter any Git repository URL" disabled={git.isProcessing} />
                    <button style={{ ...STYLES.buttonIcon }} title="How to get a remote URL?" onClick={() => new HelpModal().open()}>
                        {ICONS.help}
                    </button>
                </div>
                <button style={STYLES.button} onClick={() => git.setRemote(remoteInput)} disabled={git.isProcessing || !remoteInput.trim() || isRemoteUnchanged}>
                    {git.remoteUrl ? 'Update Remote' : 'Set Remote'}
                </button>

                <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                    <button style={secondaryIconBtn} title="Merge Branch" onClick={openMergeModal} disabled={git.isProcessing}>{ICONS.merge}</button>
                    <button style={secondaryIconBtn} onClick={git.refresh} title="Refresh" disabled={git.isProcessing}>{ICONS.refresh}</button>
                    {git.isProcessing && <div style={{ border: '3px solid #333', borderTop: `3px solid ${STYLES.button.backgroundColor}`, borderRadius: '50%', width: '18px', height: '18px', animation: 'spin 1s linear infinite', alignSelf: 'center', marginLeft: 'auto' }}></div>}
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                    <button style={secondaryIconBtn} title={`Pull (${git.behind} behind)`} onClick={git.pull} disabled={git.isProcessing || !git.remoteUrl}>{ICONS.pull}</button>
                    <button style={primaryIconBtn} title={`Push (${git.ahead} ahead)`} onClick={git.push} disabled={git.isProcessing || git.ahead === 0 || !git.remoteUrl}>{ICONS.push}</button>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', flex: 1, overflowY: 'auto' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flexShrink: 0 }}>
                    <textarea style={{ ...STYLES.input, ...STYLES.commitInput }} placeholder="Commit message..." value={commitMessage} onChange={(e) => setCommitMessage(e.target.value)} disabled={git.isProcessing} />
                    <button style={{ ...STYLES.button, width: '100%' }} onClick={() => git.commit(commitMessage).then(() => setCommitMessage(''))} disabled={git.status.staged.length === 0 || !commitMessage.trim() || git.isProcessing}>Commit to {git.currentBranch}</button>
                </div>
                <FileListSection title="Staged Changes" files={git.status.staged} onUnstage={git.unstage} defaultOpen={true} />
                <FileListSection title="Changes" files={git.status.changes} onStage={git.stage} onStageAll={git.stageAll} onDiscard={git.discard} defaultOpen={true} />
            </div>

            <HistoryView history={git.history} />
        </div>
    );
};

const InitView = ({ git }) => (
    <div style={{ ...STYLES.mainArea, alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <h3 style={{ fontSize: '20px', fontWeight: 600 }}>Source Control</h3>
        <p style={{ color: '#888888', maxWidth: '400px' }}>This path is not a Git repository. Initialize one locally to start tracking changes, then connect it to a remote service like GitHub or GitLab.</p>
        <input type="text" value={git.repoPath} onChange={(e) => git.setRepoPath(e.target.value)} style={{ ...STYLES.input, maxWidth: '500px' }} disabled={git.isProcessing} />
        <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
            <button style={{ ...STYLES.button, ...STYLES.buttonSecondary }} onClick={git.refresh} disabled={git.isProcessing}>Use Path</button>
            <button style={STYLES.button} onClick={git.init} disabled={git.isProcessing}>Initialize Repository</button>
        </div>
    </div>
);

const GitSetupView = ({ git }) => {
    const [name, setName] = useState(git.gitUserName || '');
    const [email, setEmail] = useState(git.gitUserEmail || '');

    const getInstallInstructions = () => {
        const platform = os.platform();
        const codeStyle = { backgroundColor: '#2a2a2a', padding: '2px 6px', borderRadius: '4px', fontFamily: 'monospace' };
        switch (platform) {
            case 'win32':
                return (
                    <>
                        <p>Please install <a href="https://git-scm.com/download/win" target="_blank" rel="noopener noreferrer">Git for Windows</a>.</p>
                        <p>The official installer includes the Git Credential Manager to securely handle authentication with services like GitHub.</p>
                    </>
                );
            case 'darwin':
                return (
                    <>
                        <p>The easiest way to install Git on macOS is with the Xcode Command Line Tools.</p>
                        <p>1. Open the Terminal app (you can find it in Applications/Utilities).</p>
                        <p>2. Run the command: <code style={codeStyle}>xcode-select --install</code></p>
                        <p>Alternatively, if you use Homebrew, you can run: <code style={codeStyle}>brew install git</code></p>
                    </>
                );
            case 'linux':
                return (
                    <>
                        <p>Install Git using your distribution's package manager.</p>
                        <p>For Debian/Ubuntu, run: <code style={codeStyle}>sudo apt update && sudo apt install git</code></p>
                        <p>For Fedora/CentOS, run: <code style={codeStyle}>sudo dnf install git</code> or <code style={codeStyle}>sudo yum install git</code></p>
                    </>
                );
            default:
                return <p>Please install Git for your operating system from the <a href="https://git-scm.com/downloads" target="_blank" rel="noopener noreferrer">official website</a>.</p>;
        }
    };

    const renderContent = () => {
        if (git.gitSystemStatus === 'not_found') {
            return (
                <div style={{ width: '100%', maxWidth: '600px', textAlign: 'left' }}>
                    <h4 style={{ margin: 0, fontWeight: 500, fontSize: '18px', color: '#e06c75' }}>Git Installation Not Found</h4>
                    <div style={{ color: '#b0b0b0', marginTop: '16px', lineHeight: 1.6 }}>
                        {getInstallInstructions()}
                    </div>
                    <button style={{ ...STYLES.button, marginTop: '24px' }} onClick={git.checkGitSystem}>I've installed Git, check again</button>
                </div>
            );
        }

        if (git.gitSystemStatus === 'not_configured') {
            return (
                <div style={{ width: '100%', maxWidth: '500px', textAlign: 'left' }}>
                    <h4 style={{ margin: 0, fontWeight: 500, fontSize: '18px' }}>Configure Your Git Identity</h4>
                    <p style={{ color: '#888888', marginTop: '8px' }}>Please set your user name and email. This is required to identify you as the author of your commits.</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '24px' }}>
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} style={STYLES.input} placeholder="Your Name" />
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={STYLES.input} placeholder="your.email@example.com" />
                    </div>
                    <button
                        style={{ ...STYLES.button, marginTop: '24px', width: '100%' }}
                        onClick={() => git.setGitConfig(name, email)}
                        disabled={!name.trim() || !email.trim() || git.isProcessing}
                    >
                        Save Configuration
                    </button>
                </div>
            );
        }

        return <p>Checking Git installation...</p>;
    };

    return (
        <div style={{ ...STYLES.mainArea, alignItems: 'center', justifyContent: 'center' }}>
            {renderContent()}
        </div>
    );
};

function GitSourceControlView({ repoPath: initialRepoPath, onSaveStateChange, refreshTrigger }) {
    const git = useGitRepository(initialRepoPath);
    const [commitMessage, setCommitMessage] = useState('');

    useEffect(() => {
        if (typeof onSaveStateChange === 'function') {
            onSaveStateChange(git.isSaving);
        }
    }, [git.isSaving, onSaveStateChange]);

    useEffect(() => {
        const styleTagId = 'git-spinner-styles';
        if (!document.getElementById(styleTagId)) {
            const styleSheet = document.createElement("style"); styleSheet.id = styleTagId;
            styleSheet.innerText = `@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`;
            document.head.appendChild(styleSheet);
        }
    }, []);

    useEffect(() => {
        if (git.gitSystemStatus === 'ready' && !git.isLoading && !git.isProcessing) {
            git.refresh();
        }
    }, [refreshTrigger]);

    if (git.isLoading || git.gitSystemStatus === 'checking') {
        return <div style={STYLES.wrapper}><div style={{ ...STYLES.mainArea, alignItems: 'center', justifyContent: 'center' }}><div style={{ border: '3px solid #333', borderTop: `3px solid ${STYLES.button.backgroundColor}`, borderRadius: '50%', width: '24px', height: '24px', animation: 'spin 1s linear infinite' }}></div></div></div>;
    }

    return (
        <div style={STYLES.wrapper}>
            {git.gitSystemStatus !== 'ready'
                ? <GitSetupView git={git} />
                : git.isRepo
                    ? <RepoView git={git} commitMessage={commitMessage} setCommitMessage={setCommitMessage} />
                    : <InitView git={git} />
            }
            {git.error && <p style={{ color: '#e06c75', textAlign: 'center', position: 'absolute', bottom: '10px', left: '15px', right: '15px', background: 'rgba(224, 108, 117, 0.1)', padding: '10px', borderRadius: '6px', border: '1px solid #e06c75', zIndex: 20 }}>{git.error}</p>}
        </div>
    );
};

function MainView(props) {
    return <GitSourceControlView {...props} />;
}

return {
    GitSuite: MainView,
    useGit: useGitRepository
};
```









