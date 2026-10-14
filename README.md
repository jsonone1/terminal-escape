# breakoutoverride

this mini game is an interactive command line terminal. a browser based game with an objective to investigate and look through hidden directories and files to find a specific code to breakout successfully. 

---

## Game Features

*   **Dynamic Code Generation:** The escape code fragments utilize a unique localStorage dynamic generation logic, giving players a randomized passcode every time they clear their local storage.
*   **Linux CLI Emulation:** Features an authentic terminal experience supporting directory traversal, hidden files, text matching, and persistent system state variables.
*   **Persistent Prompt Environment:** Automatically transforms the active working path inline (e.g., matching standard Unix absolute paths and the home directory shortcut ~).

---

## Supported Terminal Commands

| Command | Usage | Description |
| :--- | :--- | :--- |
| help | help | Lists all available console commands. |
| ls | ls [-a] [path] | Lists directory contents. Use -a to reveal hidden entries. |
| cd | cd [directory] | Changes the current directory. Defaults to `~`. |
| pwd | pwd | Prints the absolute path of the current working directory. |
| cat | cat [file] | Reads and displays the text content inside a file. |
| grep | grep [text] [file] | Searches for lines matching a pattern within a target file. |
| override | override [key] | Submits the final reconstructed passcode to bypass the security wall. |
| clear | clear | Clears all prior system history from the logs window. |

---

