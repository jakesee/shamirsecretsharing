## JavaScript & HTML Separation Rule

- Do not place JavaScript logic or scripts directly in `index.html`.
- All JS logic must be placed in external files (e.g., `js/index.js`, `js/unittest.js`).
- When creating dynamic HTML elements in JS, use class or id attributes for styling and selection, but do not set inline styles in JS. All styling must be handled in external CSS files.
