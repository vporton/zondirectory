async function upload() {
    const arweave = Arweave.init({
        host: 'arweave.net',// Hostname or IP address for a Arweave host
        port: 443,          // Port
        protocol: 'https',  // Network protocol http or https
        timeout: 20000,     // Network request timeouts in milliseconds
        logging: false,     // Enable network request logging
    });
    let key = await arweave.wallets.generate();
    let transaction = await arweave.createTransaction({
        data: 'x' // FIXME: Upload the actual file.
    }, key);
    console.log(transaction.id); // the uploaded file
    await arweave.transactions.sign(transaction, key);
    const response = await arweave.transactions.post(transaction);
    console.log(response)
    if(response.status != 200) {
        alert("Failed ArWeave transaction.");
        return;
    }
}