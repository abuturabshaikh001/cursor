# Todo App (Vanilla JS)

A minimal, accessible Todo application built with plain HTML, CSS, and JavaScript. It stores your todos in your browser via localStorage.

## Features

- Add, edit (double-click or Edit), toggle, delete todos
- Filter by All / Active / Completed
- Toggle all and Clear completed
- Persists between sessions (localStorage)
- Light/Dark theme toggle (persists)
- Keyboard friendly: Enter to add/commit edit, Esc to cancel edit

## Getting Started

Open `index.html` in your browser.

On a dev server (recommended for live reload), you can use any static server, e.g.:

```bash
npx http-server -c-1 .
```

Then visit the printed URL.

## Project Structure

```
todo-app/
  index.html    # Markup and app shell
  styles.css    # Responsive, accessible styles
  app.js        # App logic with localStorage persistence
  README.md     # This file
```

## Accessibility Notes

- Inputs and controls are labeled and have clear focus styles
- List uses semantic `ul > li`; editing uses `contenteditable` with keyboard support
- Regions use `aria-live` where helpful; filters use stateful button styles

## License

MIT
