const terminalHistory = document.getElementById('terminal-history');
const terminalInput = document.getElementById('terminal-input');
const terminalPrompt = document.getElementById('terminal-prompt');

const storageKey = 'terminal-escape-override-code';

function createOverrideCode() {
	try {
		const savedCode = localStorage.getItem(storageKey);
		if (savedCode) return savedCode;

		const newCode = String(Math.floor(Math.random() * 1000000)).padStart(6, '0');
		localStorage.setItem(storageKey, newCode);
		return newCode;
	} catch {
		return String(Math.floor(Math.random() * 1000000)).padStart(6, '0');
	}
}

const overrideCode = createOverrideCode();

const state = {
	unlocked: false,
	cwd: '/home',
	directories: ['/', '/home', '/home/archive', '/etc', '/var', '/var/log'],
	files: {
		'/home/readme.txt': 'SYSTEM MEMO:\nThe override passcode was split into two fragments.\nThe first fragment was moved to the archive folder. Recovery notes are in /etc.',
		'/home/archive/.hidden_log.bak': 'FRAGMENT 1: "break"\nHint: Search /var/log/auth.log for OVERRIDE_FRAGMENT.',
		'/etc/sys_config.cfg': 'RECOVERY NOTES:\nCombine fragment 1, then fragment 2.\nUse grep to search the audit log.',
		'/var/log/auth.log': `03:14:08 AUTH guest login failed\n03:14:11 OVERRIDE_FRAGMENT=0ut_${overrideCode}\n03:14:13 AUTH session closed`,
	}
};

function resolvePath(path) {
	if (path === '~') path = '/home';
	if (path.startsWith('~/')) path = `/home/${path.slice(2)}`;

	const segments = path.startsWith('/') ? [] : state.cwd.split('/').filter(Boolean);
	for (const segment of path.split('/')) {
		if (!segment || segment === '.') continue;
		if (segment === '..') {
			segments.pop();
		} else {
			segments.push(segment);
		}
	}

	return `/${segments.join('/')}`;
}

function updatePrompt() {
	const displayPath = state.cwd === '/home'
		? '~'
		: state.cwd.startsWith('/home/')
			? `~${state.cwd.slice('/home'.length)}`
			: state.cwd;
	terminalPrompt.textContent = `system@lockdown:${displayPath}$`;
}

function parentPath(path) {
	const parent = path.slice(0, path.lastIndexOf('/'));
	return parent || '/';
}

function baseName(path) {
	return path.slice(path.lastIndexOf('/') + 1);
}

document.addEventListener('click', () => terminalInput.focus());

terminalInput.addEventListener('keydown', function(event) {
	if (event.key === 'Enter') {
		const rawInput = this.value;
		const cleanedInput = rawInput.trim();

		if (cleanedInput.length > 0) {
			executeCommand(cleanedInput);
		}

		this.value = '';
	}
});

function writeToTerminal(text, className = '') {
	const entry = document.createElement('div');
	entry.classList.add('log-entry');
	if (className) entry.classList.add(className);
	entry.textContent = text;
	terminalHistory.appendChild(entry);
	terminalHistory.scrollTop = terminalHistory.scrollHeight;
}

function executeCommand(inputLine) {
	writeToTerminal(`${terminalPrompt.textContent} ${inputLine}`, 'command-echo');

	const parts = inputLine.trim().split(/\s+/);
	const command = parts[0].toLowerCase();
	const argument = parts.slice(1).join(' ');

	if (state.unlocked) {
		writeToTerminal("Looks like you already got through. Core access is open.", 'success-text');
		return;
	}

	switch(command) {
		case 'help':
			writeToTerminal(
				"Available commands:\n" +
				"  ls [-a] [path]      - list contents\n" +
				"  cd [directory]      - move around\n" +
				"  pwd                 - show current directory\n" +
				"  cat [file]          - read a file\n" +
				"  grep [text] [file]  - search a file\n" +
				"  override [key]      - try the override key\n" +
				"  clear               - clear the terminal"
			);
			break;

		case 'ls':
			{
				const options = parts.slice(1).filter(part => part.startsWith('-'));
				const targetArgument = parts.slice(1).find(part => !part.startsWith('-')) || '.';
				const targetPath = resolvePath(targetArgument);
				if (!state.directories.includes(targetPath)) {
					writeToTerminal(`ls: ${targetArgument}: No such directory`, 'error-text');
					break;
				}

				const entries = state.directories
					.filter(directory => directory !== targetPath && parentPath(directory) === targetPath)
					.map(directory => `${baseName(directory)}/`);
				const files = Object.keys(state.files)
					.filter(file => parentPath(file) === targetPath)
					.filter(file => options.includes('-a') || !baseName(file).startsWith('.'))
					.map(baseName);
				const listing = [...entries, ...files];
				writeToTerminal(listing.length ? listing.join('    ') : 'Directory is empty.');
				if (!options.includes('-a')) {
					writeToTerminal("Hidden files are not shown (try ls -a).", 'error-text');
				}
			}
			break;

		case 'cd': {
			const targetPath = resolvePath(argument || '~');
			if (!state.directories.includes(targetPath)) {
				const message = state.files[targetPath]
					? `cd: ${argument}: Not a directory`
					: `cd: ${argument || '~'}: No such directory`;
				writeToTerminal(message, 'error-text');
				break;
			}
			state.cwd = targetPath;
			updatePrompt();
			break;
		}

		case 'pwd':
			writeToTerminal(state.cwd);
			break;

		case 'cat':
			if (!argument) {
				writeToTerminal("Usage: cat [filename]", 'error-text');
			} else if (state.files[resolvePath(argument)]) {
				writeToTerminal(state.files[resolvePath(argument)]);
			} else {
				writeToTerminal(`cat: ${argument}: No such file or directory`, 'error-text');
			}
			break;

		case 'grep': {
			const grepParts = argument.split(/\s+/);
			if (!argument || grepParts.length < 2) {
				writeToTerminal("Usage: grep [text] [file]", 'error-text');
				break;
			}

			const fileArgument = grepParts.pop();
			const searchText = grepParts.join(' ');
			const filePath = resolvePath(fileArgument);
			if (!state.files[filePath]) {
				writeToTerminal(`grep: ${fileArgument}: No such file or directory`, 'error-text');
				break;
			}

			const matches = state.files[filePath].split('\n').filter(line => line.includes(searchText));
			if (matches.length) {
				writeToTerminal(matches.join('\n'));
			} else {
				writeToTerminal(`grep: no matches found in ${fileArgument}`, 'error-text');
			}
			break;
		}

		case 'clear':
			terminalHistory.innerHTML = '';
			break;

		case 'override':
			if (!argument) {
				writeToTerminal("Usage: override [passcode_key]", 'error-text');
			} else if (argument === `break0ut_${overrideCode}`) {
				state.unlocked = true;
				writeToTerminal("\n[!!!] Key accepted. Lockout bypassed. [!!!]\n", 'success-text');
				writeToTerminal("==================================================", 'success-text');
				writeToTerminal("Access granted. Firewall breached. You are out.", 'success-text');
				writeToTerminal("==================================================", 'success-text');
			} else {
				writeToTerminal("Nope. That key doesn't match the lock.", 'error-text');
			}
			break;

		default:
			writeToTerminal(`bash: ${command}: command not found`, 'error-text');
	}
}
