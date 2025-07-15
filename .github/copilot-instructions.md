# JavaScript Guidelines
- JavaScript files should be placed in the js folder.
- Use ES6+ syntax for modern JavaScript features.
- Use `const` and `let` for variable declarations instead of `var`.
- Use arrow functions for anonymous functions.
- Use template literals for string interpolation.
- Use classes for object-oriented programming.
- DO NOT use ES6 `import` or `export` statements. All code must run locally without a webserver and without modules. Use ES6+ syntax, but expose shared functions/objects via the `window` object if needed.

# CSS Guidelines
- CSS scripts should be placed in the css folder
- CSS scripts should support responsive design principles.
- Use media queries to ensure the design adapts to different screen sizes.
- Use a mobile-first approach when writing CSS.
- Use semantic HTML elements to enhance accessibility and SEO.
- Avoid using deprecated HTML elements and attributes.
- CSS scripts should support Microsoft Edge, Google Chrome, Mozilla Firefox, and Safari.
- CSS should be written in a modular and reusable way.
- CSS should use class selectors instead of IDs whenever possible.
- Use BEM (Block Element Modifier) methodology for naming classes to ensure clarity and maintainability.
- Avoid using inline styles; all styles should be defined in external stylesheets.

# App UI Design Guidelines
- The app should have a clean and modern design.
- Use a consistent color palette throughout the app.
- Ensure that the app is user-friendly and intuitive.
- Use clear and concise labels for buttons and inputs.
- Ensure that the app is accessible to users with disabilities.
- Use ARIA roles and attributes to enhance accessibility.
- Ensure that the app is responsive and works well on different devices.
- Use high-contrast colors for text and important elements to improve readability.
- Use ASCII icons and emoticons to enhance the user interface, but ensure they are optimized for performance.
- Do not use javascript alerts.
- For error messages, use inline error messages next to the relevant input fields instead of pop-up alerts.
- Use a consistent layout and spacing throughout the app.

# Shamir Secret Sharing Implementation Guidelines
- Refer [shamir secret sharing.html](prompt/shamir secret sharing.md) for the implementation of Shamir's Secret Sharing algorithm.
