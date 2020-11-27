#!/usr/bin/make -f

.PHONY: all ui ui-quick compile-smartweave browserify compile

all: ui

ui: ui-quick compile
	make out/ui/artifacts/SmartWeave.js out/ui/artifacts/mewconnect.js \
	  out/ui/artifacts/Files.abi out/ui/artifacts/MainPST.abi out/ui/artifacts/BlogTemplates.abi
	cp -f eth/data/matic.addresses eth/data/poa-sokol.addresses out/ui/artifacts/

ui-quick:
	-rm -rf out/ui
	mkdir -p out/ui
	find ui -name "*.js" -o -name "*.css" -o -name "*.json" -o -name "*.abi" -o -name "*.png" -o -name "*.jpg" -o -name .htaccess -o \
	  -name "*.eot" -o -name "*.svg" -o -name "*.ttf" -o -name "*.woff" -o -name "*.woff2" | \
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
	npx browserify -o $@ -r ./$<:smartweave

out/artifacts/mewconnect.js: node_modules/@myetherwallet/mewconnect-web-client/dist/index.js
	npx browserify -o $@ -r ./$<:mewconnect

out/ui/artifacts/%: out/artifacts/%
	mkdir -p out/ui/artifacts
	cp $< $@