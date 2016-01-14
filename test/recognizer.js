var speech = new Speech().load({ name: /Kyoko/i, lang: /ja/i });
var recognizer = new Speech().createRecognizer();
var voiceCommandMap = {
    "clear":    _clearBuffer,
    "stop":     _stopRecognition,
    "クリア":   _clearBuffer,
    "ストップ": _stopRecognition,
    "終了":     _stopRecognition,
    "しゅうりょう": _stopRecognition,
};

function _startRecognition() {
    console.info("start");
    if (speech.ready) { speech.say("お話しください"); }

    recognizer.start(function(event) {
        switch (event.type) {
        case "result":
            if (this.ended) {
                console.log("ok: ", this.result.join(","));
                _processVoiceCommand(this.result[this.result.length - 1].trim(), voiceCommandMap);
                alert(this.result.join(","));
            } else {
                console.log("...", this.buffer.join(","));
            }
            break;
        }
    });
}

function _processVoiceCommand(command, voiceCommandMap) {
    for (var keyword in voiceCommandMap) {
        if (keyword === command) {
            var fn = voiceCommandMap[keyword];
            if (fn) {
                fn();
            }
        }
    }
}
function _stopRecognition() {
    if (speech.ready) { speech.say("音声認識を終了しました"); }
    recognizer.stop();
    console.info("stopped");
}
function _clearBuffer() {
    if (speech.ready) { speech.say("バッファをクリアしました"); }
    recognizer.clear();
    console.info("buffer cleared");
}

