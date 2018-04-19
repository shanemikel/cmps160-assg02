MAIN    = driver proto ngon2d
JS_LIBS = shapes
JS_SRC  = $(MAIN:=.js) $(JS_LIBS:=.js)

.PHONY: all watch clean

all: $(MAIN:=.jsc)

$(MAIN:=.jsc): %: $(%:.jsc=.js) $(JS_LIBS:=.js)

watch:
	./watch.sh $(addprefix -f ,$(JS_SRC)) -- $(MAKE) -s all

clean:
	rm -f $(MAIN:=.jsc)

%.jsc: %.js
	cpp -P -undef -Wundef -std=c99 -nostdinc -Wtrigraphs -fdollars-in-identifiers \
            $< $@
