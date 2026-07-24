# CodeWeb

A browser-based code editor: write HTML, CSS, JavaScript, JSON, C++ and Lua,
run a live preview, and publish a demo project page.

## Files

- `index.html`, `style.css`, `app.js` — the CodeWeb editor itself. Host these
  three on GitHub Pages (or any static host) and the editor runs as-is.
- `examples/styled-landing.html` — a self-contained page with CSS written
  directly inside a `<style>` tag in the `<head>`, instead of a separate
  stylesheet.
- `examples/styled-dashboard.html` — a second self-contained example, a small
  stat-card layout, also styled entirely inline.

## Why two ways to add CSS

CodeWeb supports both:

1. **Separate files** — an `.html` file plus one or more `.css` files. This is
   the classic setup and keeps markup and styling apart.
2. **CSS inside the HTML** — write a `<style>` block straight into the
   `<head>` of the HTML file. Nothing else is required; the page is styled on
   its own. The default HTML template CodeWeb gives you when you click
   "Add file" now uses this approach out of the box.

Open either example in the editor and click **Run** to see it rendered.
