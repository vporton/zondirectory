const zonDirectory_TEMPLATE = "transform.xslt";

function zonDirectory_replaceDOM(doc) {
    document.getElementsByTagName('html')[0].innerHTML =
        doc.getElementsByTagNameNS("http://www.w3.org/1999/xhtml", 'head')[0].outerHTML +
        doc.getElementsByTagNameNS("http://www.w3.org/1999/xhtml", 'body')[0].outerHTML;
}

function zonDirectory_template(jsBase, uid) {
    const xsltProcessor = new XSLTProcessor();
    fetch(jsBase + zonDirectory_TEMPLATE)
        .then(async response => {
            const parser = new DOMParser();
            let stylesheet = parser.parseFromString(await response.text(), 'text/xml');
            xsltProcessor.importStylesheet(stylesheet);
            const xmlSerializer = new XMLSerializer();
            const document2 = parser.parseFromString(xmlSerializer.serializeToString(document), 'text/xml');
            const htmlElement = document2.getElementsByTagNameNS("http://www.w3.org/1999/xhtml", 'html')[0];
            const resultDocument = xsltProcessor.transformToDocument(htmlElement);
            zonDirectory_replaceDOM(resultDocument);
        });
}