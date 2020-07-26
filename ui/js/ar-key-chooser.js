(function( $ ) {

    function storeKeyToggle() {
        const count = (location.pathname.match(/\/\\/g) || []).length;
        if(count != 1) {
            alert("Cannot securely store data, because we are not in a server root folder!");
            event.preventDefault();
        }
    }
    
    $.fn.onUpdateKey = function(keyString) {
        if(!keyString) return;

        const key = JSON.parse(keyString); // TODO: error handling
        arweave.wallets.jwkToAddress(key).then(address => {
            if(this.addressWidget) this.addressWidget.remove();
            this.before(`<span><code>${address}</code> <input type="button" value="Remove"/></span> `);
            const addressWidget = this.prev();
            this.addressWidget = addressWidget;
            addressWidget.find('input').click(e => {
                if(!confirm("Remove the private key?")) return;
                
                localStorage.removeItem(this.options.storeName);
                addressWidget.remove();
                this.val('');
            });
        });
    }

    function onFileChange(widget) {
       const keyFileReader = new FileReader();
        keyFileReader.onload = (e) => {
            const keyString = e.target.result;
            widget.onUpdateKey(keyString);
        };
        keyFileReader.readAsText(widget[0].files[0]);    
    }

    $.fn.arKeyChooser = function(options) {
        this.options = options || {};
        this.addressWidget = null;
        this.shouldStoreCheckbox = null;

        this.change(event => onFileChange(this));

        if(options.storeName) {
            const cb = `<label><input type="checkbox" id="storeARKey"/> Store the key in browser storage</label>`;
            this.after(cb);
            this.shouldStoreCheckbox = this.next();
            this.shouldStoreCheckbox.click(storeKeyToggle);
            const keyString = localStorage.getItem(options.storeName);
            this.onUpdateKey(keyString);
        }

        return this; // needed?
    }

    $.fn.arKeyStore = function() {
        if(!this.shouldStoreCheckbox || !this.shouldStoreCheckbox.is(':checked')) return;

        if(this[0].files[0]) {
            const keyFileReader = new FileReader();
            keyFileReader.onload = (e) => {
                const keyString = e.target.result;
                localStorage.setItem(this.options.storeName, keyString);
            };
            keyFileReader.readAsText(widget[0].files[0]);
        }
    }

    $.fn.arKeyGet = function() {
        const widget = this;
        return new Promise((resolve) => {
            if(widget[0].files[0]) {
                const keyFileReader = new FileReader();
                keyFileReader.onload = (e) => {
                    const keyString = e.target.result;
                    const key = JSON.parse(keyString); // TODO: error handling
                    resolve(key);
                };
                keyFileReader.readAsText(widget[0].files[0]);
            } else {
                const keyString = localStorage.getItem(widget.options.storeName);
                const key = JSON.parse(keyString); // TODO: error handling
                resolve(key);
            }
        });
    }

}( jQuery ));