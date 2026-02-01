const fs = require('fs');
const path = require('path');

const packagePath = path.join(process.cwd(), 'node_modules', 'estree-walker', 'package.json');

if (!fs.existsSync(packagePath)) {
	process.exit(0);
}

const raw = fs.readFileSync(packagePath, 'utf8');
const pkg = JSON.parse(raw);

if (!pkg.exports || !pkg.exports['.']) {
	process.exit(0);
}

const entry = pkg.exports['.'];
if (entry.require) {
	process.exit(0);
}

entry.require = entry.import || entry.default || './src/index.js';

const updated = JSON.stringify(pkg, null, 2) + '\n';
fs.writeFileSync(packagePath, updated);
