#!/usr/bin/node

const fs = require('fs');

function main() {
    const network = process.argv[2];
    if(!network) return;
    const data = JSON.parse(fs.readFileSync(`../data/${network}.addresses`));
    const tmpl = fs.readFileSync('subgraph.yaml.tmpl', 'utf8');
    const yaml = tmpl.replace('@network@', network).replace('@Files@', data.Files).replace('@FilesBlock@', data.FilesBlock);
    fs.writeFileSync('subgraph.yaml', yaml);
}

main();