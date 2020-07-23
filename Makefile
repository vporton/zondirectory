#!/usr/bin/make -f

.PHONY: all ui ui-quick compile-smartweave browserify compile

all: ui

ui: ui-quick compile
	make out/ui/artifacts/SmartWeave.js \
	  out/ui/artifacts/Files.abi
	cp -f eth/data/mainnet.addresses eth/data/rinkeby.addresses out/ui/artifacts/

ui-quick:
	-rm -rf out/ui
	mkdir -p out/ui
	find ui -name "*.js" -o -name "*.css" -o -name "*.json" -o -name "*.abi" -o -name "*.png" | \
	  xargs cp --parents -t out/
	find ui \( -name "*.html" -a \! -name template.html \) | \
	  while read REPLY; do \
	    xsltproc --stringparam input ../$$REPLY -o out/$$REPLY lib/format.xslt ui/template.html; \
	  done

compile:
	cd eth && npx buidler compile

out/js/SmartWeave/index.js:
	-npx typescript --outDir out/js/SmartWeave --project libs/SmartWeave/tsconfig.json
	# npx typescript --outDir out/js/SmartWeave libs/SmartWeave/src/*.ts

out/artifacts/SmartWeave.js: out/js/SmartWeave/index.js
	# npx browserify -o ui/artifacts/SmartWeave.js out/js/SmartWeave/index.js
	npx browserify -o $@ -r ./out/js/SmartWeave/index.js:smartweave

out/ui/artifacts/%: out/artifacts/%
	mkdir -p out/ui/artifacts
	cp $< $@