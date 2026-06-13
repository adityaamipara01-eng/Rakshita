const fs = require('fs');
const path = require('path');

const mapJsPath = path.join(__dirname, '..', 'js', 'map.js');
console.log('Reading from:', mapJsPath);

const content = fs.readFileSync(mapJsPath, 'utf8');

// We want to extract the POLICE_STATIONS array. Since it is defined as a constant inside a closure, we can evaluate it or parse it.
const match = content.match(/const POLICE_STATIONS = \s*\[([\s\S]*?)\];/);
if (!match) {
  console.error('Could not find POLICE_STATIONS array in map.js');
  process.exit(1);
}

const arrayStr = '[' + match[1] + ']';
let stations;
try {
  stations = eval(arrayStr);
} catch (e) {
  console.error('Failed to parse POLICE_STATIONS array:', e);
  process.exit(1);
}

console.log('Total stations found:', stations.length);

const stateCounts = {};
stations.forEach(st => {
  stateCounts[st.state] = (stateCounts[st.state] || 0) + 1;
});

console.log('Stations by State:');
console.log(JSON.stringify(stateCounts, null, 2));
