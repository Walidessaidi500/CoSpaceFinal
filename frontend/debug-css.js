const fs = require('fs');
const postcss = require('postcss');
const tailwindcss = require('@tailwindcss/postcss');

console.log('Reading styles.css...');
const css = fs.readFileSync('src/styles.css', 'utf8');

console.log('Processing with PostCSS...');
postcss([
    tailwindcss()
])
    .process(css, { from: 'src/styles.css', to: 'src/output.css' })
    .then(result => {
        console.log('CSS compiled successfully!');
        fs.writeFileSync('src/output.css', result.css);
        console.log('Output written to src/output.css');
        console.log('First 500 chars:', result.css.substring(0, 500));
    })
    .catch(error => {
        console.error('Error compiling CSS:', error);
    });
