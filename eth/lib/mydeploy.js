"strict";

const fs = require('fs');

function readJson(filename) {
    try {
        const buffer = fs.readFileSync(filename);
        return JSON.parse(buffer);
    }
    catch(e) {
        return {};
    }
}

function updateAddress(name, address, network) {
    try {
        fs.mkdirSync('data');
    }
    catch(e) { }

    const filename1 = 'config/' + network + '.addresses';
    const filename2 = 'data/' + network + '.addresses';

    let data1 = readJson(filename1);
    let data2 = readJson(filename2);

    for(let key in data2) data1[key] = data2[key];
    data1[name] = address;

    fs.writeFileSync(filename2, JSON.stringify(data1, null, 2));

    // let js = "";
    // for(let key in data1)
    //     js += "const address" + key + " = '" + data1[key] + "';\n";
    // fs.mkdirSync('../out/artifacts', { recursive: true });
    // fs.writeFileSync('../out/artifacts/addresses.js', js);
}

module.exports = { updateAddress };
