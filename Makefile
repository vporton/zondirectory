#!/usr/bin/make -f

.PHONY: all ui ui-quick compile-smartweave browserify

all: ui

ui: browserify ui-quick

ui-quick:
	mkdir -p out/ui
	find ui -name "*.html" -o -name "*.js" -o -name "*.css" -o -name "*.json" -o -name "*.abi" | \
	  xargs cp --parents -t out/

compile-smartweave:
	-npx typescript --outDir out/js/SmartWeave --project libs/SmartWeave/tsconfig.json
	# npx typescript --outDir out/js/SmartWeave libs/SmartWeave/src/*.ts

browserify: compile-smartweave
	# npx browserify -o ui/artifacts/SmartWeave.js out/js/SmartWeave/index.js
	npx browserify -o out/ui/artifacts/SmartWeave.js -r ./out/js/SmartWeave/index.js:smartweave
