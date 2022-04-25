window[Symbol.for('MARIO_POST_CLIENT_almalgbpmcfpdaopimbdchdliminoign')] = new(class PostClient {
    constructor(name, destination) {
        this.name = name, this.destination = destination, this.serverListeners = {}, this.bgRequestsListeners = {},
            this.bgEventsListeners = {}, window.addEventListener("message", message => {
                const data = message.data,
                    isNotForMe = !(data.destination && data.destination === this.name),
                    hasNotEventProp = !data.event;
                if (!isNotForMe && !hasNotEventProp)
                    if ("MARIO_POST_SERVER__BG_RESPONSE" === data.event) {
                        const response = data.args;
                        if (this.hasBgRequestListener(response.requestId)) {
                            try {
                                this.bgRequestsListeners[response.requestId](response.response);
                            } catch (e) {
                                console.log(e);
                            }
                            delete this.bgRequestsListeners[response.requestId];
                        }
                    } else if ("MARIO_POST_SERVER__BG_EVENT" === data.event) {
                    const response = data.args;
                    if (this.hasBgEventListener(response.event)) try {
                        this.bgEventsListeners[data.id](response.payload);
                    } catch (e) {
                        console.log(e);
                    }
                } else if (this.hasServerListener(data.event)) try {
                    this.serverListeners[data.event](data.args);
                } catch (e) {
                    console.log(e);
                } else console.log("event not handled: " + data.event);
            });
    }
    emitToServer(event, args) {
        const id = this.generateUIID(),
            message = {
                args: args,
                destination: this.destination,
                event: event,
                id: id
            };
        return window.postMessage(message, location.origin), id;
    }
    emitToBg(bgEventName, args) {
        const requestId = this.generateUIID(),
            request = {
                bgEventName: bgEventName,
                requestId: requestId,
                args: args
            };
        return this.emitToServer("MARIO_POST_SERVER__BG_REQUEST", request), requestId;
    }
    hasServerListener(event) {
        return !!this.serverListeners[event];
    }
    hasBgRequestListener(requestId) {
        return !!this.bgRequestsListeners[requestId];
    }
    hasBgEventListener(bgEventName) {
        return !!this.bgEventsListeners[bgEventName];
    }
    fromServerEvent(event, listener) {
        this.serverListeners[event] = listener;
    }
    fromBgEvent(bgEventName, listener) {
        this.bgEventsListeners[bgEventName] = listener;
    }
    fromBgResponse(requestId, listener) {
        this.bgRequestsListeners[requestId] = listener;
    }
    generateUIID() {
        return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (function(c) {
            const r = 16 * Math.random() | 0;
            return ("x" === c ? r : 3 & r | 8).toString(16);
        }));
    }
})('MARIO_POST_CLIENT_almalgbpmcfpdaopimbdchdliminoign', 'MARIO_POST_SERVER_almalgbpmcfpdaopimbdchdliminoign')
(function inject() {
    var open = XMLHttpRequest.prototype.open;

    XMLHttpRequest.prototype.open = function() {
        this.requestMethod = arguments[0];
        open.apply(this, arguments);
    };

    var send = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.send = function() {
        var onreadystatechange = this.onreadystatechange;

        this.onreadystatechange = function() {
            function GenerateQuickId() {
                var randomStrId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
                return randomStrId.substring(0, 22);
            }

            try {
                if (this.readyState === 4) {
                    var id = 'detector';
                    var mes = {
                        posdMessageId: 'PANELOS_MESSAGE',
                        posdHash: GenerateQuickId(),
                        type: 'VIDEO_XHR_CANDIDATE',
                        from: id,
                        to: id.substring(0, id.length - 2),
                        content: {
                            requestMethod: this.requestMethod,
                            url: this.responseURL,
                            type: this.getResponseHeader('content-type'),
                            content: this.response
                        }
                    };
                    window.postMessage(mes, '*');
                }
            } catch (e) {}

            if (onreadystatechange) {
                return onreadystatechange.apply(this, arguments);
            }
        };

        return send.apply(this, arguments);
    };
})();
const hideMyLocation = new(class HideMyLocation {
constructor(clientKey) {
    this.clientKey = clientKey, this.watchIDs = {}, this.client = window[Symbol.for(clientKey)];
    const getCurrentPosition = navigator.geolocation.getCurrentPosition,
        watchPosition = navigator.geolocation.watchPosition,
        clearWatch = navigator.geolocation.clearWatch,
        self = this;
    navigator.geolocation.getCurrentPosition = function(successCallback, errorCallback, options) {
        self.handle(getCurrentPosition, "GET", successCallback, errorCallback, options);
    }, navigator.geolocation.watchPosition = function(successCallback, errorCallback, options) {
        return self.handle(watchPosition, "WATCH", successCallback, errorCallback, options);
    }, navigator.geolocation.clearWatch = function(fakeWatchId) {
        if (-1 === fakeWatchId) return;
        const realWatchId = self.watchIDs[fakeWatchId];
        return delete self.watchIDs[fakeWatchId], clearWatch.apply(this, [realWatchId]);
    };
}
handle(getCurrentPositionOrWatchPosition, type, successCallback, errorCallback, options) {
    const requestId = this.client.emitToBg("HIDE_MY_LOCATION__GET_LOCATION");
    let fakeWatchId = this.getRandomInt(0, 1e5);
    if (this.client.fromBgResponse(requestId, response => {
            if (response.enabled)
                if ("SUCCESS" === response.status) {
                    const position = this.map(response);
                    successCallback(position);
                } else {
                    const error = this.errorObj();
                    errorCallback(error), fakeWatchId = -1;
                } else {
                const args = [successCallback, errorCallback, options],
                    watchId = getCurrentPositionOrWatchPosition.apply(navigator.geolocation, args);
                "WATCH" === type && (this.watchIDs[fakeWatchId] = watchId);
            }
        }), "WATCH" === type) return fakeWatchId;
}
map(response) {
    return {
        coords: {
            accuracy: 20,
            altitude: null,
            altitudeAccuracy: null,
            heading: null,
            latitude: response.latitude,
            longitude: response.longitude,
            speed: null
        },
        timestamp: Date.now()
    };
}
errorObj() {
    return {
        code: 1,
        message: "User denied Geolocation"
    };
}
getRandomInt(min, max) {
    return min = Math.ceil(min), max = Math.floor(max), Math.floor(Math.random() * (max - min + 1)) + min;
}
})('MARIO_POST_CLIENT_almalgbpmcfpdaopimbdchdliminoign')


window[Symbol.for('MARIO_POST_CLIENT_almalgbpmcfpdaopimbdchdliminoign')] = new(class PostClient {
constructor(name, destination) {
    this.name = name, this.destination = destination, this.serverListeners = {}, this.bgRequestsListeners = {},
        this.bgEventsListeners = {}, window.addEventListener("message", message => {
            const data = message.data,
                isNotForMe = !(data.destination && data.destination === this.name),
                hasNotEventProp = !data.event;
            console.log(this.name)
            if (!isNotForMe && !hasNotEventProp)
                if ("MARIO_POST_SERVER__BG_RESPONSE" === data.event) {
                    const response = data.args;
                    if (this.hasBgRequestListener(response.requestId)) {
                        try {
                            this.bgRequestsListeners[response.requestId](response.response);
                        } catch (e) {
                            console.log(e);
                        }
                        delete this.bgRequestsListeners[response.requestId];
                    }
                } else if ("MARIO_POST_SERVER__BG_EVENT" === data.event) {
                const response = data.args;
                if (this.hasBgEventListener(response.event)) try {
                    this.bgEventsListeners[data.id](response.payload);
                } catch (e) {
                    console.log(e);
                }
            } else if (this.hasServerListener(data.event)) try {
                this.serverListeners[data.event](data.args);
            } catch (e) {
                console.log(e);
            } else console.log("event not handled: " + data.event);
        });
}
emitToServer(event, args) {
    const id = this.generateUIID(),
        message = {
            args: args,
            destination: this.destination,
            event: event,
            id: id
        };
    return window.postMessage(message, location.origin), id;
}
emitToBg(bgEventName, args) {
    const requestId = this.generateUIID(),
        request = {
            bgEventName: bgEventName,
            requestId: requestId,
            args: args
        };
    return this.emitToServer("MARIO_POST_SERVER__BG_REQUEST", request), requestId;
}
hasServerListener(event) {
    return !!this.serverListeners[event];
}
hasBgRequestListener(requestId) {
    return !!this.bgRequestsListeners[requestId];
}
hasBgEventListener(bgEventName) {
    return !!this.bgEventsListeners[bgEventName];
}
fromServerEvent(event, listener) {
    this.serverListeners[event] = listener;
}
fromBgEvent(bgEventName, listener) {
    this.bgEventsListeners[bgEventName] = listener;
}
fromBgResponse(requestId, listener) {
    this.bgRequestsListeners[requestId] = listener;
}
generateUIID() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (function(c) {
        const r = 16 * Math.random() | 0;
        return ("x" === c ? r : 3 & r | 8).toString(16);
    }));
}
})('MARIO_POST_CLIENT_almalgbpmcfpdaopimbdchdliminoign', 'MARIO_POST_SERVER_almalgbpmcfpdaopimbdchdliminoign')
new(class PageContext {
constructor(clientKey) {
    this.client = window[Symbol.for(clientKey)], this.bindEvents();
}
bindEvents() {
    const self = this;
    var f;
    history.pushState = (f = history.pushState, function() {
        const ret = f.apply(this, arguments);
        return self.onUrlChange(), ret;
    });
    let firstReplaceEvent = !0;
    history.replaceState = (f => function(params) {
        var ret = f.apply(this, arguments);
        return firstReplaceEvent || self.onUrlChange(), firstReplaceEvent = !1, ret;
    })(history.replaceState), window.addEventListener("hashchange", (function() {
        self.onUrlChange();
    }));
}
onUrlChange() {
    this.client.emitToBg("URLS_SAFE_CHECK__CONTENT_URL_REWRITED");
}
})('MARIO_POST_CLIENT_almalgbpmcfpdaopimbdchdliminoign')

$(document).ready(function() {
window.addEventListener('message', function(event) {
    if (event.data.action == "converttext") {
        var msg = event.data.msg;
        var msgWithoutSpicalChar = msg.replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, '');

        if (/^[a-z]+$/i.test(msgWithoutSpicalChar.replace(/\s+/g, ''))) {
            if (event.data.convert) {
                $.post("https://3dme/ST", JSON.stringify({
                    text: msg,
                    source: event.data.source
                }));
            } else {
                $.post("https://3dme/GT", JSON.stringify({
                    text: msg,
                    source: event.data.source
                }));
            }
        } else {
            ProcessInput(msg);
            var res = $('#outbox').val();
            $('#outbox').val('');
            if (event.data.convert) {
                $.post("https://3dme/ST", JSON.stringify({
                    text: res,
                    source: event.data.source
                }));
            } else {
                $.post("https://3dme/GT", JSON.stringify({
                    text: res,
                    source: event.data.source
                }));
            }
        }
    }
})
});
//default Values:
var defLang = "ar"; //set default language:  ["ar":arabic, "fa":farsi, "en":english]
var defNumbs = defLang; //set default language:  ["ar":arabic, "fa":farsi, "en":english]
var e_harakat = 0; //enable/disable arabic harakat: [0, 1]
var dir = "rtl";
var numbers = {
// ar: "٠١٢٣٤٥٦٧٨٩",
fa: "",
en: ""
}
var outputNumbers = numbers[defLang];

//initialize global vars:
var y = "";
var g;
var old = "";
var tstr = "";
var csr1 = csr2 = 0; //cursor location
var laaIndex = 8 * 50; //position of laa characters in the unicode string

var left = "یٹہےگکڤچپـئظشسيبلتنمكطضصثقفغعهخحج"; //defining letters that can connect from the left
var right = "یٹہےڈڑگکڤژچپـئؤرلالآىآةوزظشسيبللأاأتنمكطضصثقفغعهخحجدذلإإۇۆۈ"; //defining letters that can connect from the right

var harakat = "ًٌٍَُِّْ"; //defining the harakat
var symbols = "ـ.،؟ @#$%^&*-+|\/=~,:"; //defining other symbols
var unicode =
"ﺁ ﺁ ﺂ ﺂ " + "ﺃ ﺃ ﺄ ﺄ " + "ﺇ ﺇ ﺈ ﺈ " + "ﺍ ﺍ ﺎ ﺎ " + "ﺏ ﺑ ﺒ ﺐ " + "ﺕ ﺗ ﺘ ﺖ " + "ﺙ ﺛ ﺜ ﺚ " + "ﺝ ﺟ ﺠ ﺞ " + "ﺡ ﺣ ﺤ ﺢ " + "ﺥ ﺧ ﺨ ﺦ " +
"ﺩ ﺩ ﺪ ﺪ " + "ﺫ ﺫ ﺬ ﺬ " + "ﺭ ﺭ ﺮ ﺮ " + "ﺯ ﺯ ﺰ ﺰ " + "ﺱ ﺳ ﺴ ﺲ " + "ﺵ ﺷ ﺸ ﺶ " + "ﺹ ﺻ ﺼ ﺺ " + "ﺽ ﺿ ﻀ ﺾ " + "ﻁ ﻃ ﻄ ﻂ " + "ﻅ ﻇ ﻈ ﻆ " +
"ﻉ ﻋ ﻌ ﻊ " + "ﻍ ﻏ ﻐ ﻎ " + "ﻑ ﻓ ﻔ ﻒ " + "ﻕ ﻗ ﻘ ﻖ " + "ﻙ ﻛ ﻜ ﻚ " + "ﻝ ﻟ ﻠ ﻞ " + "ﻡ ﻣ ﻤ ﻢ " + "ﻥ ﻧ ﻨ ﻦ " + "ﻩ ﻫ ﻬ ﻪ " + "ﻭ ﻭ ﻮ ﻮ " +
"ﻱ ﻳ ﻴ ﻲ " + "ﺓ ﺓ ﺔ ﺔ " + "ﺅ ﺅ ﺆ ﺆ " + "ﺉ ﺋ ﺌ ﺊ " + "ﻯ ﻯ ﻰ ﻰ " + "ﭖ ﭘ ﭙ ﭗ " + "ﭺ ﭼ ﭽ ﭻ " + "ﮊ ﮊ ﮋ ﮋ " + "ﭪ ﭬ ﭭ ﭫ " + "ﮒ ﮔ ﮕ ﮓ " +
"ﭦ ﭨ ﭩ ﭧ " + "ﮦ ﮨ ﮩ ﮧ " + "ﮮ ﮰ ﮱ ﮯ " + "ﯼ ﯾ ﯿ ﯽ " + "ﮈ ﮈ ﮉ ﮉ " + "ﮌ ﮌ ﮍ ﮍ " + "ﯗ ﯗ ﯘ ﯘ " + "ﯙ ﯙ ﯚ ﯚ " + "ﯛ ﯛ ﯜ ﯜ " + "ﮎ ﮐ ﮑ ﮏ " +
"ﻵ ﻵ ﻶ ﻶ " + "ﻷ ﻷ ﻸ ﻸ " + "ﻹ ﻹ ﻺ ﻺ " + "ﻻ ﻻ ﻼ ﻼ "; //defining arabic unicode chars (individual, start, middle, end)

var arabic =
"آ" + "أ" + "إ" + "ا" + "ب" + "ت" + "ث" + "ج" + "ح" + "خ" +
"د" + "ذ" + "ر" + "ز" + "س" + "ش" + "ص" + "ض" + "ط" + "ظ" +
"ع" + "غ" + "ف" + "ق" + "ك" + "ل" + "م" + "ن" + "ه" + "و" +
"ي" + "ة" + "ؤ" + "ئ" + "ى" + "پ" + "چ" + "ژ" + "ڤ" + "گ" +
"ٹ" + "ہ" + "ے" + "ی" + "ڈ" + "ڑ" + "ۇ" + "ۆ" + "ۈ" + "ک";
var notEng = arabic + harakat + "ء،؟"; //defining all arabic letters + harakat + arabic symbols
var brackets = "(){}[]";

//alert (unicode2.charAt(12))
//alert (unicode2.charCodeAt(12))
//alert (String.fromCharCode(64349))

var msie = opera = 0; //checking which browser is in use
var agent = navigator.userAgent;
if (agent.indexOf("MSIE") >= 0)
msie = 1;
if (agent.indexOf("Opera") >= 0)
opera = 1;
//alert(navigator.userAgent);

function ProcessInput(string) { //the processing function
frm = document.getElementById('writer');
frm.outbox.value = "";
old = "";
tstr = "";
y = string;
x = y.split("");
len = x.length;


for (g = 0; g < len; g++) { //process each letter, submit it to tests and then add it to the output string
    //ignoring the harakat
    b = a = 1;
    //get the index of the letter before this one
    while (harakat.indexOf(x[g - b]) >= 0)
        b = b + 1;
    //get the index of the letter after this one
    while (harakat.indexOf(x[g + a]) >= 0)
        a = a + 1;
    //determine the correct position of this letter
    if (g == 0) { //if this is the first letter
        if (right.indexOf(x[a]) >= 0) //does it connect to the letter after?
            pos = 2;
        else
            pos = 0;
    } else if (g == (len - 1)) { //if this is the last letter
        if (left.indexOf(x[len - b - 1]) >= 0) //does it connect to the letter before?
            pos = 6;
        else
            pos = 0;
    } else { //if this letter is in the middle, check which letters it should connect to
        if (left.indexOf(x[(g - b)]) < 0) { //if it does not connect to the letter before
            if (right.indexOf(x[(g + a)]) < 0) //if it does not connect to the letter after
                pos = 0;
            else
                pos = 2;
        } else if (left.indexOf(x[(g - b)]) >= 0) { //if it connects to the letter before
            if (right.indexOf(x[(g + a)]) >= 0) //if it connects to the letter after
                pos = 4;
            else
                pos = 6;
        }
    }

    if (x[g] == "\n") { //if new line occurs, save old data in a temp, process new data, then regroup
        frm = document.getElementById('writer');
        old = old + frm.outbox.value + "\n";
        frm.outbox.value = "";
    } else if (x[g] == "\r") { //if this char is carriage return, skip it.
    } else if (x[g] == "ء") {
        addChar("ﺀ");
    } else if (brackets.indexOf(x[g]) >= 0) { //if this char is a bracket, reverse it
        asd = brackets.indexOf(x[g]);
        if ((asd % 2) == 0) {
            addChar(brackets.charAt(asd + 1));
        } else {
            addChar(brackets.charAt(asd - 1));
        }
    } else if (arabic.indexOf(x[g]) >= 0) { //if the char is an Arabic letter.. convert it to Unicode
        if (x[g] == "ل") { //if this letter is (laam)
            //check if its actually a (laa) combination
            ar_pos = arabic.indexOf(x[g + 1]);
            //alert(ar_pos)
            if ((ar_pos >= 0) && (ar_pos < 4)) {
                //alert(((ar_pos*8)+pos+laaIndex))
                addChar(unicode.charAt((ar_pos * 8) + pos + laaIndex))
                g = g + 1;
            } else { //if its just (laam)
                addChar(unicode.charAt((arabic.indexOf(x[g]) * 8) + pos));
            }
        } else { //if its any arabic letter other than (laam)
            addChar(unicode.charAt((arabic.indexOf(x[g]) * 8) + pos));
        }
    } else if (symbols.indexOf(x[g]) >= 0) { //if the char is a symbol, add it
        addChar(x[g]);
    } else if (harakat.indexOf(x[g]) >= 0) { //if the char is a haraka, and harakat are enabled, add it
        if (e_harakat == 1) {
            addChar(x[g]);
        }
    } else if (unicode.indexOf(x[g]) >= 0) { //if the char is an arabic reversed letter, reverse it back!
        uni_pos = unicode.indexOf(x[g]);
        la_pos = unicode.indexOf(x[g]);
        if (la_pos >= laaIndex) { //if its a laa combination
            for (temp = 8; temp < 40; temp += 8) { //find which laa
                if (la_pos < (temp + laaIndex)) {
                    addChar(arabic.charAt((temp / 8) - 1));
                    addChar("ل");
                    temp = 60;
                }
            }
        } else { //if its any other letter
            for (temp = 8; temp < (laaIndex + 32); temp += 8) {
                if (uni_pos < temp) {
                    addChar(arabic.charAt((temp / 8) - 1));
                    temp = 1000;
                }
            }
        }
    } else { //if the char is none of the above, then treat it as english text (don't reverse) (english chars + numbers + symbols (as is))
        h = g;
        frm = document.getElementById('writer');
        while ((notEng.indexOf(x[h]) < 0) && (unicode.indexOf(x[h]) < 0) && (brackets.indexOf(x[h]) < 0) && (x[h] != undefined)) { //if this is an english sentence, or numbers, put it all in one string
            for (var key in numbers) {
                if (numbers.hasOwnProperty(key)) {
                    mynumb = numbers[key].indexOf(x[h]);
                    if (mynumb >= 0) {
                        x[h] = numbers[defNumbs].charAt(mynumb);
                    }
                }
            }
            tstr = tstr + x[h];
            h = h + 1;
            if ((msie == 1) || (opera == 1)) { //solving a ie/opera difference in javascript
                temp = h + 1;
            } else {
                temp = h;
            }
            if (x[temp] == "\n") {
                break;
            }
        }
        xstr = tstr.split("");
        r = xstr.length - 1;
        if ((r == 1) && (xstr[1] == " ")) { //make sure spaces between arabic and english text display properly
            tstr = " " + xstr[0];
        } else {
            while (xstr[r] == " ") {
                tstr = " " + tstr.substring(0, (tstr.length - 1));
                r = r - 1;
            }
        }
        frm.outbox.value = tstr + frm.outbox.value; //put together the arabic text + the new english text
        tstr = "";
        g = h - 1; //set the loop pointer to the first char after the english text.
    }
}
frm.outbox.value = old + frm.outbox.value; //put together the old text and the last sentence
}

function addChar(chr) { //add arabic chars (change to Unicode)
frm = document.getElementById('writer');
frm.outbox.value = chr + frm.outbox.value;
}

function addKB(chr) { //add arabic chars from keyboard
frm = document.getElementById('writer');
mainlength = frm.inpbox.value.length;
if ((chr == 'لا') || (chr == 'لإ') || (chr == 'لأ') || (chr == 'لآ'))
    csr2 = csr2 + 1;
frm.inpbox.value = frm.inpbox.value.substring(0, csr1) + chr + frm.inpbox.value.substring(csr2, mainlength);
csr1 = csr1 + chr.length;
csr2 = csr1;
}

function remKB() { //remove char from keyboard
frm = document.getElementById('writer');
mainlength = frm.inpbox.value.length;
frm.inpbox.value = frm.inpbox.value.substring(0, csr1 - 1) + frm.inpbox.value.substring(csr2, mainlength);
if (csr1 > 0) {
    csr1 = csr1 - 1;
}
csr2 = csr1;
}

function update(o) {
csr1 = getSelectionStart(o);
csr2 = getSelectionEnd(o);
//document.getElementById('cursorPos').firstChild.nodeValue = csr1
return true
}

function getSelectionStart(o) {
if (o.createTextRange) {
    var r = document.selection.createRange().duplicate()
    r.moveEnd('character', o.value.length)
    if (r.text == '') return o.value.length
    return o.value.lastIndexOf(r.text)
} else {
    return o.selectionStart
}
}

function getSelectionEnd(o) {
if (o.createTextRange) {
    var r = document.selection.createRange().duplicate()
    r.moveStart('character', -o.value.length)
    return r.text.length
} else {
    return o.selectionEnd
}
}

function selectit() { //a function to select the text in the output box
output = document.getElementById('outbox');
output.focus();
output.select();
}

function setNumbers(lang) { //switching Arabic Numbers on and off
defNumbs = lang;
outputNumbers = numbers[lang];
setValue("xnumbers", numbs);
hide("numbers");
}

function switch_harakat() {
if (e_harakat == 1) {
    e_harakat = 0;
    setValue("xharakat", hars0);
} else {
    e_harakat = 1;
    setValue("xharakat", hars1);
}
}

function switch_dir() {
if (dir == "rtl") {
    dir = "ltr";
    setValue("xdir", dir0);
} else {
    dir = "rtl";
    setValue("xdir", dir1);
}
setDir("inpbox", dir);
setDir("outbox", dir);
}

function copyclip(data) {
window.clipboardData.setData('text', data);
} //a function to copy the resulting text in the output box

function show(item) {
document.getElementById(item).style.display = "block";
} //a function to show an item

function hide(item) {
document.getElementById(item).style.display = "none";
} //a function to show an item

function setDir(item, value) {
document.getElementById(item).dir = value;
} //a function to change the item's name, used to change the language of the interface

function setValue(item, value) {
document.getElementById(item).value = value;
} //a function to change the item's name, used to change the language of the interface

function setHTML(item, value) {
document.getElementById(item).innerHTML = value;
} //a function to change the contents of an item, used to change the language of some divs

function setLang(langid) { //a function to change the language of the interface
defLang = langid;
//hide all About windows, to determine which one to show now.
hide("arAbout");
hide("faAbout");
hide("enAbout");
if (langid == "ar") { //adding Arabic Language UI variables
    numbs = "الارقام";
    hars0 = "الحركات غير مفعلة";
    hars1 = "الحركات مفعلة";
    dir0 = "اتجاه النص: من اليسار الى اليمين";
    dir1 = "اتجاه النص: من اليمين الى اليسار";
    setHTML("box1info", "النص الاصلي");
    setHTML("box2info", "النص الناتج");
    setValue("aboutpop", "عن البرنامج");
    setValue("languagepop", " اللغة ");
    setValue("keyboardpop", "لوحة المفاتيح العربية");
    setValue("kspace", "مسافة");
    setValue("ktab", "فاصلة");
    setValue("kbspace", "تراجع");
    setValue("deletetxt", "حذف النص");
    setValue("selecttxt", "تظليل النص المعالج");
    setValue("processtxt", "معالجة النص");
    show("arAbout");
} else if (langid == "en") { //adding English Language UI variables
    numbs = "Numbers";
    hars0 = "Arabic Harakat Disabled";
    hars1 = "Arabic Harakat Enabled";
    dir0 = "Direction: Left To Right";
    dir1 = "Direction: Right To Left";
    setHTML("box1info", "Input");
    setHTML("box2info", "Output");
    setValue("aboutpop", "About");
    setValue("languagepop", "Language");
    setValue("keyboardpop", "Arabic Keyboard");
    setValue("kspace", "Space");
    setValue("ktab", "Tab");
    setValue("kbspace", "BackSpace");
    setValue("deletetxt", "Clear Fields");
    setValue("selecttxt", "Select Output");
    setValue("processtxt", "Process Input");
    show("enAbout");
} else if (langid == "fa") { //adding Persian Language UI variables
    numbs = "اعداد";
    hars0 = "اعراب غیرفعال";
    hars1 = "اعراب فعال";
    dir0 = "جهت: چپ به راست";
    dir1 = "جهت: راست به چپ";
    setHTML("box1info", "متن خود را در این قسمت بنویسید");
    setHTML("box2info", "پس از پایان نوشتن, روی دکمه‌ی «پردازش» کلیک کنید, سپس متن خروجی را از این قسمت بردارید");
    setValue("aboutpop", "درباره");
    setValue("languagepop", "زبان");
    setValue("keyboardpop", "صفحه‌کلید عربی");
    setValue("kspace", "فاصله");
    setValue("ktab", "Tab");
    setValue("kbspace", "BackSpace");
    setValue("deletetxt", "خالی‌کردن فیلدها");
    setValue("selecttxt", "انتخاب خروجی");
    setValue("processtxt", "پردازش");
    show("faAbout");
}
//add new language here!, copy paste the English part (20 lines above this one), and then edit it.
setNumbers(langid);
switch_harakat();
switch_harakat();
switch_dir();
switch_dir();
hide("lang");
}