(function moduleExporter(name, closure) {
"use strict";

var entity = GLOBAL["WebModule"]["exports"](name, closure);

if (typeof module !== "undefined") {
    module["exports"] = entity;
}
return entity;

})("Speech", function moduleClosure(global) {
"use strict";

// --- dependency modules ----------------------------------
// --- define / local variables ----------------------------
var VERIFY  = global["WebModule"]["verify"]  || false;
var VERBOSE = global["WebModule"]["verbose"] || false;

// --- class / interfaces ----------------------------------
function Speech() {
    this._voices = [];      // [voice, ...]
    this._voice  = null;    // SpeechSynthesisVoiceObject - { voiceURI, name, lang, localService, default }
    this._rate   = 1.0;     // 0.1 - 10.0
    this._pitch  = 1.0;     // 0.0 - 2.0
    this._volume = 0.5;     // 0.0 - 1.0
    this._ready  = false;   // voice loaded.
}

Speech["synthesis"]   = { "ready": !!_getSpeechSynthesisUtteranceObject() };
Speech["recognition"] = { "ready": !!_getSpeechRecognitionObject() };
Speech["repository"]  = "https://github.com/uupaa/Speech.js";
Speech["prototype"] = Object.create(Speech, {
    "constructor":  { "value": Speech       }, // new Speech():Speech
    // ---  speech synthesis ---
    "say":          { "value": Speech_say   }, // Speech#say(text:String):void
    "load":         { "value": Speech_load  }, // Speech#load(condition:Object = {}, callback:Function = null):Speech
    "query":        { "value": Speech_query }, // Speech#query(condition:Object = {}):VoiceObjectArray
    "ready":        { "get": function()  { return this._ready;      } },
    "voices":       { "get": function()  { return this._voices;     } },
    "voice":        { "set": function(v) { return this._voice = v;  },
                      "get": function()  { return this._voice;      } },
    "rate":         { "set": function(v) { return this._rate = v;   },
                      "get": function()  { return this._rate;       } },
    "pitch":        { "set": function(v) { return this._pitch = v;  },
                      "get": function()  { return this._pitch;      } },
    "volume":       { "set": function(v) { return this._volume = v; },
                      "get": function()  { return this._volume;     } },
    // ---  speech recognition ---
    "createRecognizer":
                    { "value": Speech_createRecognizer }, // Speech#createRecognizer():SpeechRecognizer
});

function SpeechRecognizer() {
    var SpeechRecognition = _getSpeechRecognitionObject();

    this._recognition = new SpeechRecognition();
    this._recognition["continuous"]     = true;
    this._recognition["interimResults"] = true;

    this._state      = 0; // { 0: wait, 1: start, 2: ended, 3: error }
    this._result     = [];
    this._buffer     = [];
    this._confidence = "";
}
SpeechRecognizer["prototype"] = Object.create(SpeechRecognizer, {
    "constructor":  { "value": SpeechRecognizer       }, // new SpeechRecognizer():SpeechRecognizer
    "start":        { "value": SpeechRecognizer_start }, // SpeechRecognizer#start(callback:Function):this
    "stop":         { "value": SpeechRecognizer_stop  }, // SpeechRecognizer#stop():void
    "clear":        { "value": SpeechRecognizer_clear }, // SpeechRecognizer#clear():void
    "ended":        { "get": function()  { return this._state === 2; } },
    "error":        { "get": function()  { return this._state === 3; } },
    "buffer":       { "get": function()  { return this._buffer;     } },
    "result":       { "get": function()  { return this._result;     } },
    "confidence":   { "get": function()  { return this._confidence; } },
});

// --- implements ------------------------------------------
function Speech_load(condition,  // @arg VoiceQueryCondition = {} - { name, lang }
                     callback) { // @arg Function = null - callback():void
                                 // @ret this
                                 // @desc load voices
    var that = this;

    if ("onvoiceschanged" in speechSynthesis) {
        global["speechSynthesis"].addEventListener("voiceschanged", _handleVoiceschanged); // chrome
    }
    this._voices = Array.from(global["speechSynthesis"]["getVoices"]());
    if (this._voices.length) {
        _handleVoiceschanged();
    }
    return this;

    function _handleVoiceschanged() {
        if (!that._voices.length) {
            that._voices = Array.from(global["speechSynthesis"]["getVoices"]());
        }
        that._voice = that["query"](condition)[0] || null;
        if (that._voice) {
            that._ready = true;
        }
        if (callback) {
            callback();
        }
        _gc();
    }

    function _gc() {
        if ("onvoiceschanged" in speechSynthesis) {
            global["speechSynthesis"].removeEventListener("voiceschanged", _handleVoiceschanged);
        }
        condition = null;
        callback = null;
    }
}

function Speech_say(text,       // @arg String - speech text
                    callback) { // @arg Function - callback(event:Event):void
    callback = callback || function(event) {
        if (VERBOSE) { console.log(event.type); }
    };
    var utterance = new SpeechSynthesisUtterance();

    utterance["voice"]      = this._voice;
    utterance["rate"]       = this._rate;
    utterance["pitch"]      = this._pitch;
    utterance["volume"]     = this._volume;
    utterance["text"]       = text;
    utterance["onboundary"] = callback;
    utterance["onstart"]    = callback;
    utterance["onmark"]     = callback;
    utterance["onend"]      = callback;
    utterance["onerror"]    = callback;
    utterance["onpause"]    = callback;
    utterance["onresume"]   = callback;

    global["speechSynthesis"]["speak"](utterance);
}

function Speech_query(condition) { // @arg Object = {} - { name, lang }
                                   // @condition.name RegExp = null - /bells/i
                                   // @condition.lang RegExp = null - /en/, /ja/
                                   // @ret VoiceObjectArray - [voice, ...]
                                   // @desc query voices
    condition = condition || {};
    var name  = condition["name"] || null;
    var lang  = condition["lang"] || null;
    var result = this._voices.filter(function(voice) {
        if (name && name.test(voice.name) ||
            lang && lang.test(voice.lang)) {
            return true;
        }
        return false;
    });

    return result.length ? result : [ this._voices[0] ];
}

function Speech_createRecognizer() { // @ret SpeechRecognition
    return new SpeechRecognizer();
}

function SpeechRecognizer_start(callback) { // @arg Function - callback(event:Event):void
    var that = this;
    var recognition = this._recognition;


    recognition["onaudiostart"]  = function() { callback.call(this, event); };
    recognition["onsoundstart"]  = function() { callback.call(this, event); };
    recognition["onspeechstart"] = function() { callback.call(this, event); };
    recognition["onspeechend"]   = function() { callback.call(this, event); };
    recognition["onsoundend"]    = function() { callback.call(this, event); };
    recognition["onaudioend"]    = function() { callback.call(this, event); };
  //recognition["onresult"]      = function() { callback.call(this, event); };
    recognition["onnomatch"]     = function() { callback.call(this, event); };
    recognition["onerror"]       = function() { callback.call(this, event); };
    recognition["onstart"]       = function() { callback.call(this, event); };
    recognition["onend"]         = function() { callback.call(this, event); };

    recognition["onresult"] = function(event) {
        var resultIndex = event["resultIndex"];
        var results     = event["results"];

        for (var i = resultIndex; i < results["length"]; ++i) {
            if (results[i]["isFinal"]) {
                that._buffer = [];
                that._state = 2; // ended
                that._result.push( results[i][0]["transcript"] );
                that._confidence = results[i][0]["confidence"];
            } else {
                that._state = 1; // start
                that._buffer.push( results[i][0]["transcript"] );
                that._confidence = "";
            }
        }
        callback.call(that, event);
    };
    this["stop"]();
    recognition["start"]();
}

function SpeechRecognizer_stop() {
    if (this._state > 1) {
        this._recognition.stop();
        this._state = 0;
    }
}

function SpeechRecognizer_clear() {
    this._result     = [];
    this._buffer     = [];
    this._confidence = "";
}

function _getSpeechSynthesisUtteranceObject() {
    return global["SpeechSynthesisUtterance"];
}

function _getSpeechRecognitionObject() {
    return global["SpeechRecognition"] ||
           global["webkitSpeechRecognition"];
}

return Speech; // return entity

});

