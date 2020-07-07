#!/usr/bin/make -f

.PHONY: all ui ui-quick compile-smartweave browserify

all: ui

ui: out/ui/artifacts/SmartWeave.js ui-quick

ui-quick:
	-rm -rf out/ui
	mkdir -p out/ui
	find ui -name "*.html" -o -name "*.js" -o -name "*.css" -o -name "*.json" -o -name "*.abi" | \
	  xargs cp --parents -t out/

out/js/SmartWeave/index.js:
	-npx typescript --outDir out/js/SmartWeave --project libs/SmartWeave/tsconfig.json
	# npx typescript --outDir out/js/SmartWeave libs/SmartWeave/src/*.ts

out/ui/artifacts/SmartWeave.js: out/js/SmartWeave/index.js
	# npx browserify -o ui/artifacts/SmartWeave.js out/js/SmartWeave/index.js
	npx browserify -o $@ -r ./out/js/SmartWeave/index.js:smartweave
