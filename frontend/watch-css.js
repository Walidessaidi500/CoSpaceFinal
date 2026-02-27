const fs = require('fs');
const postcss = require('postcss');
const tailwindcss = require('@tailwindcss/postcss');

let isCompiling = false;

async function compile() {
    if (isCompiling) return;
    isCompiling = true;
    console.log('Compiling CSS...');
    try {
        const css = fs.readFileSync('src/styles.css', 'utf8');
        const result = await postcss([tailwindcss()]).process(css, { from: 'src/styles.css', to: 'src/output.css' });
        fs.writeFileSync('src/output.css', result.css);
        console.log('CSS updated at ' + new Date().toLocaleTimeString());
    } catch (err) {
        console.error('Compilation error:', err);
    } finally {
        isCompiling = false;
    }
}

// Initial compile
compile();

// Watch src folder
let debounceTimer;
fs.watch('src', { recursive: true }, (eventType, filename) => {
    if (filename && filename.includes('output.css')) return; // Ignore output file

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        compile();
    }, 100);
});

console.log('Watching for changes in src/...');
