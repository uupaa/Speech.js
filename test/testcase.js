var ModuleTestSpeech = (function(global) {

var test = new Test(["Speech"], { // Add the ModuleName to be tested here (if necessary).
        disable:    false, // disable all tests.
        browser:    true,  // enable browser test.
        worker:     false,  // enable worker test.
        node:       false,  // enable node test.
        nw:         true,  // enable nw.js test.
        el:         true,  // enable electron (render process) test.
        button:     true,  // show button.
        both:       false,  // test the primary and secondary modules.
        ignoreError:false, // ignore error.
        callback:   function() {
        },
        errorback:  function(error) {
            console.error(error.message);
        }
    });

if (IN_BROWSER || IN_NW || IN_EL) {
    test.add([
        testSpeech_query_voices,
        testSpeech_event_handler,
        testSpeech_say_japanese,
      //testSpeech_recognition,
    ]);
}
if (IN_BROWSER || IN_NW || IN_EL) {
    test.add([
    ]);
}
if (IN_WORKER) {
    test.add([
    ]);
}
if (IN_NODE) {
    test.add([
    ]);
}

// --- test cases ------------------------------------------
function testSpeech_query_voices(test, pass, miss) {

    if (!Speech.synthesis.ready) {
        test.done(miss());
    } else {
        var speech = new Speech();

        speech.load(null, function() {
            speech.voices.forEach(function(voice) {
                console.log(voice.name, voice.lang);
            });
            test.done(pass());
        });
    }
}

function testSpeech_event_handler(test, pass, miss) {

    if (!Speech.synthesis.ready) {
        test.done(miss());
    } else {
        var speech = new Speech();

        speech.load({ lang: /en-us/i }, function() {
            console.log(speech.voice.name);
            speech.say("I'll the event handling.", function(event) {
                console.log(event.type);
            });
            test.done(pass());
        });
    }
}

function testSpeech_say_japanese(test, pass, miss) {

    if (!Speech.synthesis.ready) {
        test.done(miss());
    } else {
        var speech = new Speech();

        speech.load({ name: /Kyoko/i, lang: /ja/i }, function() {
            console.log(speech.voice.name);
            speech.say("こんにちは こんにちは", function(event) {
                console.log(event.type);
            });
            test.done(pass());
        });
    }
}

function testSpeech_recognition(test, pass, miss) {

    if (!Speech.recognition.ready) {
        test.done(miss());
    } else {
        test.done(pass());

        var recognizer = new Speech().createRecognizer();

        recognizer.start(function(event) {
            switch (event.type) {
            case "result":
                if (this.ended) {
                    console.log("ok: ", this.result.join(","));
                    if (/クリア/.test(this.result)) {
                        recognizer.clear();
                        console.info("cleared");
                    }
                } else {
                    console.log("...", this.buffer.join(","));
                }
                break;
            }
        });
    }
}

return test.run();

})(GLOBAL);

