#!/usr/bin/make -f

.PHONY: all compile-smartweave

all: compile-smartweave

compile-smartweave:
	-npx typescript --outDir ui/js/SmartWeave --project libs/SmartWeave/tsconfig.json
	# npx typescript --outDir ui/js/SmartWeave libs/SmartWeave/src/*.ts
