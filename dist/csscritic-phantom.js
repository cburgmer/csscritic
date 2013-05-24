/*! PhantomJS regression runner for CSS critic - v0.1.0 - 2013-05-24
* http://www.github.com/cburgmer/csscritic
* Copyright (c) 2013 Christoph Burgmer, Copyright (c) 2012 ThoughtWorks, Inc.; Licensed MIT */
/* Integrated dependencies:
 * jsSHA.js (BSD License),
 * URI.js (MIT License/GPL v3),
 * cssParser.js (MPL 1.1/GPL 2.0/LGPL 2.1),
 * htmlparser.js,
 * imagediff.js (MIT License),
 * rasterizeHTML.js (MIT License) */

window.csscritic = (function (module) {
    module.util = {};

    module.util.getDataURIForImage = function (image) {
        var canvas = window.document.createElement("canvas"),
            context = canvas.getContext("2d");

        canvas.width = image.width;
        canvas.height = image.height;

        context.drawImage(image, 0, 0);

        return canvas.toDataURL("image/png");
    };

    module.util.getImageForUrl = function (url, successCallback, errorCallback) {
        var image = new window.Image();

        image.onload = function () {
            successCallback(image);
        };
        if (errorCallback) {
            image.onerror = errorCallback;
        }
        image.src = url;
    };

    module.util.getImageForBinaryContent = function (content, callback) {
        var image = new window.Image();

        image.onload = function () {
            callback(image);
        };
        image.onerror = function () {
            callback(null);
        };
        image.src = 'data:image/png;base64,' + btoa(content);
    };

    var getBinary = function (data) {
        var binaryContent = "";

        for (var i = 0; i < data.length; i++) {
            binaryContent += String.fromCharCode(data.charCodeAt(i) & 0xFF);
        }
        return binaryContent;
    };

    var getUncachableURL = function (url) {
        return url + "?_=" + Date.now();
    };

    module.util.ajax = function (url, successCallback, errorCallback) {
        var xhr = new XMLHttpRequest();

        xhr.onload = function () {
            if (xhr.status === 200 || xhr.status === 0) {
                successCallback(getBinary(xhr.response));
            } else {
                errorCallback();
            }
        };

        xhr.onerror = function () {
            errorCallback();
        };

        try {
            xhr.open('get', getUncachableURL(url), true);
            xhr.overrideMimeType('text/plain; charset=x-user-defined');
            xhr.send();
        } catch (e) {
            errorCallback();
        }
    };

    module.util.workAroundTransparencyIssueInFirefox = function (image, callback) {
        // Work around bug https://bugzilla.mozilla.org/show_bug.cgi?id=790468 where the content of a canvas
        //   drawn to another one will be slightly different if transparency is involved.
        // Here the reference image has been drawn to a canvas once (to serialize it to localStorage), while the
        //   image of the newly rendered page hasn't.  Solution: apply the same transformation to the second image, too.
        var dataUri;
        try {
            dataUri = module.util.getDataURIForImage(image);
        } catch (e) {
            // Fallback for Chrome & Safari
            callback(image);
            return;
        }

        module.util.getImageForUrl(dataUri, function (newImage) {
            callback(newImage);
        });
    };

    module.util.map = function (list, func, callback) {
        var completedCount = 0,
            results = [],
            i;

        if (list.length === 0) {
            callback(results);
        }

        var callForItem = function (idx) {
            function funcFinishCallback(result) {
                completedCount += 1;

                results[idx] = result;

                if (completedCount === list.length) {
                    callback(results);
                }
            }

            func(list[idx], funcFinishCallback);
        };

        for(i = 0; i < list.length; i++) {
            callForItem(i);
        }
    };

    module.util.queue = {};

    var jobQueue = [],
        busy = false;

    var nextInQueue = function () {
        var func;
        if (jobQueue.length > 0) {
            busy = true;
            func = jobQueue.shift();
            func(nextInQueue);
        } else {
            busy = false;
        }
    };

    module.util.queue.execute = function (func) {
        jobQueue.push(func);
        if (!busy) {
            nextInQueue();
        }
    };

    module.util.queue.clear = function () {
        jobQueue = [];
        busy = false;
    };

    return module;
}(window.csscritic || {}));

(function() {/*
 A JavaScript implementation of the SHA family of hashes, as defined in FIPS
 PUB 180-2 as well as the corresponding HMAC implementation as defined in
 FIPS PUB 198a

 Copyright Brian Turek 2008-2012
 Distributed under the BSD License
 See http://caligatio.github.com/jsSHA/ for more information

 Several functions taken from Paul Johnson
*/
function m(a){throw a;}var p=null;function r(a,b){var c=[],f=(1<<b)-1,d=a.length*b,e;for(e=0;e<d;e+=b)c[e>>>5]|=(a.charCodeAt(e/b)&f)<<32-b-e%32;return{value:c,binLen:d}}function u(a){var b=[],c=a.length,f,d;0!==c%2&&m("String of HEX type must be in byte increments");for(f=0;f<c;f+=2)d=parseInt(a.substr(f,2),16),isNaN(d)&&m("String of HEX type contains invalid characters"),b[f>>>3]|=d<<24-4*(f%8);return{value:b,binLen:4*c}}
function y(a){var b=[],c=0,f,d,e,j,k;-1===a.search(/^[a-zA-Z0-9=+\/]+$/)&&m("Invalid character in base-64 string");f=a.indexOf("=");a=a.replace(/\=/g,"");-1!==f&&f<a.length&&m("Invalid '=' found in base-64 string");for(d=0;d<a.length;d+=4){k=a.substr(d,4);for(e=j=0;e<k.length;e+=1)f="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".indexOf(k[e]),j|=f<<18-6*e;for(e=0;e<k.length-1;e+=1)b[c>>2]|=(j>>>16-8*e&255)<<24-8*(c%4),c+=1}return{value:b,binLen:8*c}}
function B(a,b){var c="",f=4*a.length,d,e;for(d=0;d<f;d+=1)e=a[d>>>2]>>>8*(3-d%4),c+="0123456789abcdef".charAt(e>>>4&15)+"0123456789abcdef".charAt(e&15);return b.outputUpper?c.toUpperCase():c}
function C(a,b){var c="",f=4*a.length,d,e,j;for(d=0;d<f;d+=3){j=(a[d>>>2]>>>8*(3-d%4)&255)<<16|(a[d+1>>>2]>>>8*(3-(d+1)%4)&255)<<8|a[d+2>>>2]>>>8*(3-(d+2)%4)&255;for(e=0;4>e;e+=1)c=8*d+6*e<=32*a.length?c+"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".charAt(j>>>6*(3-e)&63):c+b.b64Pad}return c}
function D(a){var b={outputUpper:!1,b64Pad:"="};try{a.hasOwnProperty("outputUpper")&&(b.outputUpper=a.outputUpper),a.hasOwnProperty("b64Pad")&&(b.b64Pad=a.b64Pad)}catch(c){}"boolean"!==typeof b.outputUpper&&m("Invalid outputUpper formatting option");"string"!==typeof b.b64Pad&&m("Invalid b64Pad formatting option");return b}function E(a,b){return a>>>b|a<<32-b}function F(a,b,c){return a&b^~a&c}function Q(a,b,c){return a&b^a&c^b&c}function R(a){return E(a,2)^E(a,13)^E(a,22)}
function S(a){return E(a,6)^E(a,11)^E(a,25)}function T(a){return E(a,7)^E(a,18)^a>>>3}function U(a){return E(a,17)^E(a,19)^a>>>10}function V(a,b){var c=(a&65535)+(b&65535);return((a>>>16)+(b>>>16)+(c>>>16)&65535)<<16|c&65535}function W(a,b,c,f){var d=(a&65535)+(b&65535)+(c&65535)+(f&65535);return((a>>>16)+(b>>>16)+(c>>>16)+(f>>>16)+(d>>>16)&65535)<<16|d&65535}
function X(a,b,c,f,d){var e=(a&65535)+(b&65535)+(c&65535)+(f&65535)+(d&65535);return((a>>>16)+(b>>>16)+(c>>>16)+(f>>>16)+(d>>>16)+(e>>>16)&65535)<<16|e&65535}
function Y(a,b,c){var f,d,e,j,k,i,x,z,G,g,H,s,h,l,q,n,v,w,o,I,J,K,L,M,N,O,t=[],P,A;"SHA-224"===c||"SHA-256"===c?(H=64,l=16,q=1,N=Number,n=V,v=W,w=X,o=T,I=U,J=R,K=S,M=Q,L=F,O=[1116352408,1899447441,3049323471,3921009573,961987163,1508970993,2453635748,2870763221,3624381080,310598401,607225278,1426881987,1925078388,2162078206,2614888103,3248222580,3835390401,4022224774,264347078,604807628,770255983,1249150122,1555081692,1996064986,2554220882,2821834349,2952996808,3210313671,3336571891,3584528711,113926993,
338241895,666307205,773529912,1294757372,1396182291,1695183700,1986661051,2177026350,2456956037,2730485921,2820302411,3259730800,3345764771,3516065817,3600352804,4094571909,275423344,430227734,506948616,659060556,883997877,958139571,1322822218,1537002063,1747873779,1955562222,2024104815,2227730452,2361852424,2428436474,2756734187,3204031479,3329325298],g="SHA-224"===c?[3238371032,914150663,812702999,4144912697,4290775857,1750603025,1694076839,3204075428]:[1779033703,3144134277,1013904242,2773480762,
1359893119,2600822924,528734635,1541459225]):m("Unexpected error in SHA-2 implementation");a[b>>>5]|=128<<24-b%32;a[(b+65>>>9<<4)+15]=b;P=a.length;for(s=0;s<P;s+=l){b=g[0];f=g[1];d=g[2];e=g[3];j=g[4];k=g[5];i=g[6];x=g[7];for(h=0;h<H;h+=1)t[h]=16>h?new N(a[h*q+s],a[h*q+s+1]):v(I(t[h-2]),t[h-7],o(t[h-15]),t[h-16]),z=w(x,K(j),L(j,k,i),O[h],t[h]),G=n(J(b),M(b,f,d)),x=i,i=k,k=j,j=n(e,z),e=d,d=f,f=b,b=n(z,G);g[0]=n(b,g[0]);g[1]=n(f,g[1]);g[2]=n(d,g[2]);g[3]=n(e,g[3]);g[4]=n(j,g[4]);g[5]=n(k,g[5]);g[6]=
n(i,g[6]);g[7]=n(x,g[7])}"SHA-224"===c?A=[g[0],g[1],g[2],g[3],g[4],g[5],g[6]]:"SHA-256"===c?A=g:m("Unexpected error in SHA-2 implementation");return A}
window.jsSHA=function(a,b,c){var f=p,d=p,e=0,j=[0],k=0,i=p,k="undefined"!==typeof c?c:8;8===k||16===k||m("charSize must be 8 or 16");"HEX"===b?(0!==a.length%2&&m("srcString of HEX type must be in byte increments"),i=u(a),e=i.binLen,j=i.value):"ASCII"===b||"TEXT"===b?(i=r(a,k),e=i.binLen,j=i.value):"B64"===b?(i=y(a),e=i.binLen,j=i.value):m("inputFormat must be HEX, TEXT, ASCII, or B64");this.getHash=function(a,b,c){var g=p,k=j.slice(),i="";switch(b){case "HEX":g=B;break;case "B64":g=C;break;default:m("format must be HEX or B64")}if("SHA-224"===
a){p===f&&(f=Y(k,e,a));i=g(f,D(c))}else if("SHA-256"===a){p===d&&(d=Y(k,e,a));i=g(d,D(c))}else m("Chosen SHA variant is not supported");return i};this.getHMAC=function(a,b,c,d,f){var i,h,l,q,n,v=[],w=[],o=p;switch(d){case "HEX":i=B;break;case "B64":i=C;break;default:m("outputFormat must be HEX or B64")}if("SHA-224"===c){l=64;n=224}else if("SHA-256"===c){l=64;n=256}else m("Chosen SHA variant is not supported");if("HEX"===b){o=u(a);q=o.binLen;h=o.value}else if("ASCII"===b||"TEXT"===b){o=r(a,k);q=o.binLen;
h=o.value}else if("B64"===b){o=y(a);q=o.binLen;h=o.value}else m("inputFormat must be HEX, TEXT, ASCII, or B64");a=l*8;b=l/4-1;if(l<q/8){h=Y(h,q,c);h[b]=h[b]&4294967040}else l>q/8&&(h[b]=h[b]&4294967040);for(l=0;l<=b;l=l+1){v[l]=h[l]^909522486;w[l]=h[l]^1549556828}c=Y(w.concat(Y(v.concat(j),a+e,c)),a+n,c);return i(c,D(f))}};})();

/*! rasterizeHTML.js - v0.4.1 - 2013-04-10
* http://www.github.com/cburgmer/rasterizeHTML.js
* Copyright (c) 2013 Christoph Burgmer;
/* Integrated dependencies:
 * URI.js (MIT License/GPL v3),
 * CSSOM.js (MIT License),
 * htmlparser.js */
var CSSOM={};CSSOM.CSSStyleDeclaration=function(){this.length=0,this.parentRule=null,this._importants={}},CSSOM.CSSStyleDeclaration.prototype={constructor:CSSOM.CSSStyleDeclaration,getPropertyValue:function(e){return this[e]||""},setProperty:function(e,t,n){if(this[e]){var r=Array.prototype.indexOf.call(this,e);r<0&&(this[this.length]=e,this.length++)}else this[this.length]=e,this.length++;this[e]=t,this._importants[e]=n},removeProperty:function(e){if(e in this){var t=Array.prototype.indexOf.call(this,e);if(t<0)return"";var n=this[e];return this[e]="",Array.prototype.splice.call(this,t,1),n}return""},getPropertyCSSValue:function(){},getPropertyPriority:function(e){return this._importants[e]||""},getPropertyShorthand:function(){},isPropertyImplicit:function(){},get cssText(){var e=[];for(var t=0,n=this.length;t<n;++t){var r=this[t],i=this.getPropertyValue(r),s=this.getPropertyPriority(r);s&&(s=" !"+s),e[t]=r+": "+i+s+";"}return e.join(" ")},set cssText(e){var t,n;for(t=this.length;t--;)n=this[t],this[n]="";Array.prototype.splice.call(this,0,this.length),this._importants={};var r=CSSOM.parse("#bogus{"+e+"}").cssRules[0].style,i=r.length;for(t=0;t<i;++t)n=r[t],this.setProperty(r[t],r.getPropertyValue(n),r.getPropertyPriority(n))}},CSSOM.CSSRule=function(){this.parentRule=null,this.parentStyleSheet=null},CSSOM.CSSRule.STYLE_RULE=1,CSSOM.CSSRule.IMPORT_RULE=3,CSSOM.CSSRule.MEDIA_RULE=4,CSSOM.CSSRule.FONT_FACE_RULE=5,CSSOM.CSSRule.PAGE_RULE=6,CSSOM.CSSRule.WEBKIT_KEYFRAMES_RULE=8,CSSOM.CSSRule.WEBKIT_KEYFRAME_RULE=9,CSSOM.CSSRule.prototype={constructor:CSSOM.CSSRule},CSSOM.CSSStyleRule=function(){CSSOM.CSSRule.call(this),this.selectorText="",this.style=new CSSOM.CSSStyleDeclaration,this.style.parentRule=this},CSSOM.CSSStyleRule.prototype=new CSSOM.CSSRule,CSSOM.CSSStyleRule.prototype.constructor=CSSOM.CSSStyleRule,CSSOM.CSSStyleRule.prototype.type=1,CSSOM.CSSStyleRule.prototype.__defineGetter__("cssText",function(){var e;return this.selectorText?e=this.selectorText+" {"+this.style.cssText+"}":e="",e}),CSSOM.CSSStyleRule.prototype.__defineSetter__("cssText",function(e){var t=CSSOM.CSSStyleRule.parse(e);this.style=t.style,this.selectorText=t.selectorText}),CSSOM.CSSStyleRule.parse=function(e){var t=0,n="selector",r,i=t,s="",o={selector:!0,value:!0},u=new CSSOM.CSSStyleRule,a,f,l,c="";for(var h;h=e.charAt(t);t++)switch(h){case" ":case"	":case"\r":case"\n":case"\f":if(o[n])switch(e.charAt(t-1)){case" ":case"	":case"\r":case"\n":case"\f":break;default:s+=" "}break;case'"':i=t+1,r=e.indexOf('"',i)+1;if(!r)throw'" is missing';s+=e.slice(t,r),t=r-1;break;case"'":i=t+1,r=e.indexOf("'",i)+1;if(!r)throw"' is missing";s+=e.slice(t,r),t=r-1;break;case"/":if(e.charAt(t+1)==="*"){t+=2,r=e.indexOf("*/",t);if(r===-1)throw new SyntaxError("Missing */");t=r+1}else s+=h;break;case"{":n==="selector"&&(u.selectorText=s.trim(),s="",n="name");break;case":":n==="name"?(f=s.trim(),s="",n="value"):s+=h;break;case"!":n==="value"&&e.indexOf("!important",t)===t?(c="important",t+="important".length):s+=h;break;case";":n==="value"?(u.style.setProperty(f,s.trim(),c),c="",s="",n="name"):s+=h;break;case"}":if(n==="value")u.style.setProperty(f,s.trim(),c),c="",s="";else{if(n==="name")break;s+=h}n="selector";break;default:s+=h}return u},CSSOM.MediaList=function(){this.length=0},CSSOM.MediaList.prototype={constructor:CSSOM.MediaList,get mediaText(){return Array.prototype.join.call(this,", ")},set mediaText(e){var t=e.split(","),n=this.length=t.length;for(var r=0;r<n;r++)this[r]=t[r].trim()},appendMedium:function(e){Array.prototype.indexOf.call(this,e)===-1&&(this[this.length]=e,this.length++)},deleteMedium:function(e){var t=Array.prototype.indexOf.call(this,e);t!==-1&&Array.prototype.splice.call(this,t,1)}},CSSOM.CSSMediaRule=function(){CSSOM.CSSRule.call(this),this.media=new CSSOM.MediaList,this.cssRules=[]},CSSOM.CSSMediaRule.prototype=new CSSOM.CSSRule,CSSOM.CSSMediaRule.prototype.constructor=CSSOM.CSSMediaRule,CSSOM.CSSMediaRule.prototype.type=4,CSSOM.CSSMediaRule.prototype.__defineGetter__("cssText",function(){var e=[];for(var t=0,n=this.cssRules.length;t<n;t++)e.push(this.cssRules[t].cssText);return"@media "+this.media.mediaText+" {"+e.join("")+"}"}),CSSOM.CSSImportRule=function(){CSSOM.CSSRule.call(this),this.href="",this.media=new CSSOM.MediaList,this.styleSheet=new CSSOM.CSSStyleSheet},CSSOM.CSSImportRule.prototype=new CSSOM.CSSRule,CSSOM.CSSImportRule.prototype.constructor=CSSOM.CSSImportRule,CSSOM.CSSImportRule.prototype.type=3,CSSOM.CSSImportRule.prototype.__defineGetter__("cssText",function(){var e=this.media.mediaText;return"@import url("+this.href+")"+(e?" "+e:"")+";"}),CSSOM.CSSImportRule.prototype.__defineSetter__("cssText",function(e){var t=0,n="",r="",i,s="";for(var o;o=e.charAt(t);t++)switch(o){case" ":case"	":case"\r":case"\n":case"\f":n==="after-import"?n="url":r+=o;break;case"@":!n&&e.indexOf("@import",t)===t&&(n="after-import",t+="import".length,r="");break;case"u":if(n==="url"&&e.indexOf("url(",t)===t){i=e.indexOf(")",t+1);if(i===-1)throw t+': ")" not found';t+="url(".length;var u=e.slice(t,i);u[0]===u[u.length-1]&&(u[0]==='"'||u[0]==="'")&&(u=u.slice(1,-1)),this.href=u,t=i,n="media"}break;case'"':if(n==="url"){i=e.indexOf('"',t+1);if(!i)throw t+": '\"' not found";this.href=e.slice(t+1,i),t=i,n="media"}break;case"'":if(n==="url"){i=e.indexOf("'",t+1);if(!i)throw t+': "\'" not found';this.href=e.slice(t+1,i),t=i,n="media"}break;case";":n==="media"&&r&&(this.media.mediaText=r.trim());break;default:n==="media"&&(r+=o)}}),CSSOM.CSSFontFaceRule=function(){CSSOM.CSSRule.call(this),this.style=new CSSOM.CSSStyleDeclaration,this.style.parentRule=this},CSSOM.CSSFontFaceRule.prototype=new CSSOM.CSSRule,CSSOM.CSSFontFaceRule.prototype.constructor=CSSOM.CSSFontFaceRule,CSSOM.CSSFontFaceRule.prototype.type=5,CSSOM.CSSFontFaceRule.prototype.__defineGetter__("cssText",function(){return"@font-face {"+this.style.cssText+"}"}),CSSOM.StyleSheet=function(){this.parentStyleSheet=null},CSSOM.CSSStyleSheet=function(){CSSOM.StyleSheet.call(this),this.cssRules=[]},CSSOM.CSSStyleSheet.prototype=new CSSOM.StyleSheet,CSSOM.CSSStyleSheet.prototype.constructor=CSSOM.CSSStyleSheet,CSSOM.CSSStyleSheet.prototype.insertRule=function(e,t){if(t<0||t>this.cssRules.length)throw new RangeError("INDEX_SIZE_ERR");var n=CSSOM.parse(e).cssRules[0];return this.cssRules.splice(t,0,n),t},CSSOM.CSSStyleSheet.prototype.deleteRule=function(e){if(e<0||e>=this.cssRules.length)throw new RangeError("INDEX_SIZE_ERR");this.cssRules.splice(e,1)},CSSOM.CSSStyleSheet.prototype.toString=function(){var e="",t=this.cssRules;for(var n=0;n<t.length;n++)e+=t[n].cssText+"\n";return e},CSSOM.CSSKeyframesRule=function(){CSSOM.CSSRule.call(this),this.name="",this.cssRules=[]},CSSOM.CSSKeyframesRule.prototype=new CSSOM.CSSRule,CSSOM.CSSKeyframesRule.prototype.constructor=CSSOM.CSSKeyframesRule,CSSOM.CSSKeyframesRule.prototype.type=8,CSSOM.CSSKeyframesRule.prototype.__defineGetter__("cssText",function(){var e=[];for(var t=0,n=this.cssRules.length;t<n;t++)e.push("  "+this.cssRules[t].cssText);return"@"+(this._vendorPrefix||"")+"keyframes "+this.name+" { \n"+e.join("\n")+"\n}"}),CSSOM.CSSKeyframeRule=function(){CSSOM.CSSRule.call(this),this.keyText="",this.style=new CSSOM.CSSStyleDeclaration,this.style.parentRule=this},CSSOM.CSSKeyframeRule.prototype=new CSSOM.CSSRule,CSSOM.CSSKeyframeRule.prototype.constructor=CSSOM.CSSKeyframeRule,CSSOM.CSSKeyframeRule.prototype.type=9,CSSOM.CSSKeyframeRule.prototype.__defineGetter__("cssText",function(){return this.keyText+" {"+this.style.cssText+"} "}),CSSOM.MatcherList=function(){this.length=0},CSSOM.MatcherList.prototype={constructor:CSSOM.MatcherList,get matcherText(){return Array.prototype.join.call(this,", ")},set matcherText(e){var t=e.split(","),n=this.length=t.length;for(var r=0;r<n;r++)this[r]=t[r].trim()},appendMatcher:function(e){Array.prototype.indexOf.call(this,e)===-1&&(this[this.length]=e,this.length++)},deleteMatcher:function(e){var t=Array.prototype.indexOf.call(this,e);t!==-1&&Array.prototype.splice.call(this,t,1)}},CSSOM.CSSDocumentRule=function(){CSSOM.CSSRule.call(this),this.matcher=new CSSOM.MatcherList,this.cssRules=[]},CSSOM.CSSDocumentRule.prototype=new CSSOM.CSSRule,CSSOM.CSSDocumentRule.prototype.constructor=CSSOM.CSSDocumentRule,CSSOM.CSSDocumentRule.prototype.type=10,CSSOM.CSSDocumentRule.prototype.__defineGetter__("cssText",function(){var e=[];for(var t=0,n=this.cssRules.length;t<n;t++)e.push(this.cssRules[t].cssText);return"@-moz-document "+this.matcher.matcherText+" {"+e.join("")+"}"}),CSSOM.CSSValue=function(){},CSSOM.CSSValue.prototype={constructor:CSSOM.CSSValue,set cssText(e){var t=this._getConstructorName();throw new Exception('DOMException: property "cssText" of "'+t+'" is readonly!')},get cssText(){var e=this._getConstructorName();throw new Exception('getter "cssText" of "'+e+'" is not implemented!')},_getConstructorName:function(){var e=this.constructor.toString(),t=e.match(/function\s([^\(]+)/),n=t[1];return n}},CSSOM.CSSValueExpression=function(t,n){this._token=t,this._idx=n},CSSOM.CSSValueExpression.prototype=new CSSOM.CSSValue,CSSOM.CSSValueExpression.prototype.constructor=CSSOM.CSSValueExpression,CSSOM.CSSValueExpression.prototype.parse=function(){var e=this._token,t=this._idx,n="",r="",i="",s,o=[];for(;;++t){n=e.charAt(t);if(n==""){i="css expression error: unfinished expression!";break}switch(n){case"(":o.push(n),r+=n;break;case")":o.pop(n),r+=n;break;case"/":(s=this._parseJSComment(e,t))?s.error?i="css expression error: unfinished comment in expression!":t=s.idx:(s=this._parseJSRexExp(e,t))?(t=s.idx,r+=s.text):r+=n;break;case"'":case'"':s=this._parseJSString(e,t,n),s?(t=s.idx,r+=s.text):r+=n;break;default:r+=n}if(i)break;if(o.length==0)break}var u;return i?u={error:i}:u={idx:t,expression:r},u},CSSOM.CSSValueExpression.prototype._parseJSComment=function(e,t){var n=e.charAt(t+1),r;if(n=="/"||n=="*"){var i=t,s,o;return n=="/"?o="\n":n=="*"&&(o="*/"),s=e.indexOf(o,i+1+1),s!==-1?(s=s+o.length-1,r=e.substring(t,s+1),{idx:s,text:r}):(error="css expression error: unfinished comment in expression!",{error:error})}return!1},CSSOM.CSSValueExpression.prototype._parseJSString=function(e,t,n){var r=this._findMatchedIdx(e,t,n),i;return r===-1?!1:(i=e.substring(t,r+n.length),{idx:r,text:i})},CSSOM.CSSValueExpression.prototype._parseJSRexExp=function(e,t){var n=e.substring(0,t).trimRight(),r=[/^$/,/\($/,/\[$/,/\!$/,/\+$/,/\-$/,/\*$/,/\/\s+/,/\%$/,/\=$/,/\>$/,/\<$/,/\&$/,/\|$/,/\^$/,/\~$/,/\?$/,/\,$/,/delete$/,/in$/,/instanceof$/,/new$/,/typeof$/,/void$/],i=r.some(function(e){return e.test(n)});if(!i)return!1;var s="/";return this._parseJSString(e,t,s)},CSSOM.CSSValueExpression.prototype._findMatchedIdx=function(e,t,n){var r=t,i,s=-1;for(;;){i=e.indexOf(n,r+1);if(i===-1){i=s;break}var o=e.substring(t+1,i),u=o.match(/\\+$/);if(!u||u[0]%2==0)break;r=i}var a=e.indexOf("\n",t+1);return a<i&&(i=s),i},CSSOM.parse=function(t){var n=0,r="before-selector",i,s="",o={selector:!0,value:!0,atRule:!0,"importRule-begin":!0,importRule:!0,atBlock:!0,"documentRule-begin":!0},u=new CSSOM.CSSStyleSheet,a=u,f,l,c,h,p="",d,v,m,g,y,b,w,E=/@(-(?:\w+-)+)?keyframes/g,S=function(e){var r=t.substring(0,n).split("\n"),i=r.length,s=r.pop().length+1,o=new Error(e+" (line "+i+", char "+s+")");throw o.line=i,o.char=s,o.styleSheet=u,o};for(var x;x=t.charAt(n);n++)switch(x){case" ":case"	":case"\r":case"\n":case"\f":o[r]&&(s+=x);break;case'"':i=n+1;do i=t.indexOf('"',i)+1,i||S('Unmatched "');while(t[i-2]==="\\");s+=t.slice(n,i),n=i-1;switch(r){case"before-value":r="value";break;case"importRule-begin":r="importRule"}break;case"'":i=n+1;do i=t.indexOf("'",i)+1,i||S("Unmatched '");while(t[i-2]==="\\");s+=t.slice(n,i),n=i-1;switch(r){case"before-value":r="value";break;case"importRule-begin":r="importRule"}break;case"/":t.charAt(n+1)==="*"?(n+=2,i=t.indexOf("*/",n),i===-1?S("Missing */"):n=i+1):s+=x,r==="importRule-begin"&&(s+=" ",r="importRule");break;case"@":if(t.indexOf("@-moz-document",n)===n){r="documentRule-begin",w=new CSSOM.CSSDocumentRule,w.__starts=n,n+="-moz-document".length,s="";break}if(t.indexOf("@media",n)===n){r="atBlock",v=new CSSOM.CSSMediaRule,v.__starts=n,n+="media".length,s="";break}if(t.indexOf("@import",n)===n){r="importRule-begin",n+="import".length,s+="@import";break}if(t.indexOf("@font-face",n)===n){r="fontFaceRule-begin",n+="font-face".length,g=new CSSOM.CSSFontFaceRule,g.__starts=n,s="";break}E.lastIndex=n;var T=E.exec(t);if(T&&T.index===n){r="keyframesRule-begin",y=new CSSOM.CSSKeyframesRule,y.__starts=n,y._vendorPrefix=T[1],n+=T[0].length-1,s="";break}r=="selector"&&(r="atRule"),s+=x;break;case"{":r==="selector"||r==="atRule"?(d.selectorText=s.trim(),d.style.__starts=n,s="",r="before-name"):r==="atBlock"?(v.media.mediaText=s.trim(),a=f=v,v.parentStyleSheet=u,s="",r="before-selector"):r==="fontFaceRule-begin"?(f&&(g.parentRule=f),g.parentStyleSheet=u,d=g,s="",r="before-name"):r==="keyframesRule-begin"?(y.name=s.trim(),f&&(y.parentRule=f),y.parentStyleSheet=u,a=f=y,s="",r="keyframeRule-begin"):r==="keyframeRule-begin"?(d=new CSSOM.CSSKeyframeRule,d.keyText=s.trim(),d.__starts=n,s="",r="before-name"):r==="documentRule-begin"&&(w.matcher.matcherText=s.trim(),f&&(w.parentRule=f),a=f=w,w.parentStyleSheet=u,s="",r="before-selector");break;case":":r==="name"?(c=s.trim(),s="",r="before-value"):s+=x;break;case"(":if(r==="value")if(s.trim()=="expression"){var N=(new CSSOM.CSSValueExpression(t,n)).parse();N.error?S(N.error):(s+=N.expression,n=N.idx)}else i=t.indexOf(")",n+1),i===-1&&S('Unmatched "("'),s+=t.slice(n,i+1),n=i;else s+=x;break;case"!":r==="value"&&t.indexOf("!important",n)===n?(p="important",n+="important".length):s+=x;break;case";":switch(r){case"value":d.style.setProperty(c,s.trim(),p),p="",s="",r="before-name";break;case"atRule":s="",r="before-selector";break;case"importRule":m=new CSSOM.CSSImportRule,m.parentStyleSheet=m.styleSheet.parentStyleSheet=u,m.cssText=s+x,u.cssRules.push(m),s="",r="before-selector";break;default:s+=x}break;case"}":switch(r){case"value":d.style.setProperty(c,s.trim(),p),p="";case"before-name":case"name":d.__ends=n+1,f&&(d.parentRule=f),d.parentStyleSheet=u,a.cssRules.push(d),s="",a.constructor===CSSOM.CSSKeyframesRule?r="keyframeRule-begin":r="before-selector";break;case"keyframeRule-begin":case"before-selector":case"selector":f||S("Unexpected }"),a.__ends=n+1,u.cssRules.push(a),a=u,f=null,s="",r="before-selector"}break;default:switch(r){case"before-selector":r="selector",d=new CSSOM.CSSStyleRule,d.__starts=n;break;case"before-name":r="name";break;case"before-value":r="value";break;case"importRule-begin":r="importRule"}s+=x}return u},CSSOM.clone=function e(t){var n=new CSSOM.CSSStyleSheet,r=t.cssRules;if(!r)return n;var i={1:CSSOM.CSSStyleRule,4:CSSOM.CSSMediaRule,8:CSSOM.CSSKeyframesRule,9:CSSOM.CSSKeyframeRule};for(var s=0,o=r.length;s<o;s++){var u=r[s],a=n.cssRules[s]=new i[u.type],f=u.style;if(f){var l=a.style=new CSSOM.CSSStyleDeclaration;for(var c=0,h=f.length;c<h;c++){var p=l[c]=f[c];l[p]=f[p],l._importants[p]=f.getPropertyPriority(p)}l.length=f.length}u.hasOwnProperty("keyText")&&(a.keyText=u.keyText),u.hasOwnProperty("selectorText")&&(a.selectorText=u.selectorText),u.hasOwnProperty("mediaText")&&(a.mediaText=u.mediaText),u.hasOwnProperty("cssRules")&&(a.cssRules=e(u).cssRules)}return n},function(){function l(e){var t={},n=e.split(",");for(var r=0;r<n.length;r++)t[n[r]]=!0;return t}var e=/^<([-A-Za-z0-9_]+)((?:\s+[-A-Za-z0-9_]+(?:\s*=\s*(?:(?:"[^"]*")|(?:'[^']*')|[^>\s]+))?)*)\s*(\/?)>/,t=/^<\/([-A-Za-z0-9_]+)[^>]*>/,n=/([-A-Za-z0-9_]+)(?:\s*=\s*(?:(?:"((?:\\.|[^"])*)")|(?:'((?:\\.|[^'])*)')|([^>\s]+)))?/g,r=l("area,base,basefont,br,col,frame,hr,img,input,isindex,link,meta,param,embed"),i=l("address,applet,blockquote,button,center,dd,del,dir,div,dl,dt,fieldset,form,frameset,hr,iframe,ins,isindex,li,map,menu,noframes,noscript,object,ol,p,pre,script,table,tbody,td,tfoot,th,thead,tr,ul"),s=l("a,abbr,acronym,applet,b,basefont,bdo,big,br,button,cite,code,del,dfn,em,font,i,iframe,img,input,ins,kbd,label,map,object,q,s,samp,script,select,small,span,strike,strong,sub,sup,textarea,tt,u,var"),o=l("colgroup,dd,dt,li,options,p,td,tfoot,th,thead,tr"),u=l("checked,compact,declare,defer,disabled,ismap,multiple,nohref,noresize,noshade,nowrap,readonly,selected"),a=l("script,style"),f=this.HTMLParser=function(f,l){function g(e,t,a,f){t=t.toLowerCase();if(i[t])while(d.last()&&s[d.last()])y("",d.last());o[t]&&d.last()==t&&y("",t),f=r[t]||!!f,f||d.push(t);if(l.start){var c=[];a.replace(n,function(e,t){var n=arguments[2]?arguments[2]:arguments[3]?arguments[3]:arguments[4]?arguments[4]:u[t]?t:"";c.push({name:t,value:n,escaped:n.replace(/(^|[^\\])"/g,'$1\\"')})}),l.start&&l.start(t,c,f)}}function y(e,t){if(!t)var n=0;else for(var n=d.length-1;n>=0;n--)if(d[n]==t)break;if(n>=0){for(var r=d.length-1;r>=n;r--)l.end&&l.end(d[r]);d.length=n}}var c,h,p,d=[],v=f;d.last=function(){return this[this.length-1]};while(f){h=!0;if(!d.last()||!a[d.last()]){f.indexOf("<!--")==0?(c=f.indexOf("-->"),c>=0&&(l.comment&&l.comment(f.substring(4,c)),f=f.substring(c+3),h=!1)):f.indexOf("</")==0?(p=f.match(t),p&&(f=f.substring(p[0].length),p[0].replace(t,y),h=!1)):f.indexOf("<")==0&&(p=f.match(e),p&&(f=f.substring(p[0].length),p[0].replace(e,g),h=!1));if(h){c=f.indexOf("<");var m=c<0?f:f.substring(0,c);f=c<0?"":f.substring(c),l.chars&&l.chars(m)}}else f=f.replace(new RegExp("^((?:.|\n)*?)</"+d.last()+"[^>]*>"),function(e,t){return t=t.replace(/<!--(.*?)-->/g,"$1").replace(/<!\[CDATA\[(.*?)]]>/g,"$1"),l.chars&&l.chars(t),""}),y("",d.last());if(f==v)throw"Parse Error: "+f;v=f}y()};this.HTMLtoXML=function(e){var t="";return f(e,{start:function(e,n,r){t+="<"+e;for(var i=0;i<n.length;i++)t+=" "+n[i].name+'="'+n[i].escaped+'"';t+=(r?"/":"")+">",a[e]&&(t+="<![CDATA[\n")},end:function(e){a[e]&&(t+="\n]]>"),t+="</"+e+">"},chars:function(e){t+=e},comment:function(e){t+="<!--"+e+"-->"}}),t},this.HTMLtoDOM=function(e,t){var n=l("html,head,body,title"),r={link:"head",base:"head"};t?t=t.ownerDocument||t.getOwnerDocument&&t.getOwnerDocument()||t:typeof DOMDocument!="undefined"?t=new DOMDocument:typeof document!="undefined"&&document.implementation&&document.implementation.createDocument?t=document.implementation.createDocument("","",null):typeof ActiveX!="undefined"&&(t=new ActiveXObject("Msxml.DOMDocument"));var i=[],s=t.documentElement||t.getDocumentElement&&t.getDocumentElement();!s&&t.createElement&&function(){var e=t.createElement("html"),n=t.createElement("head");n.appendChild(t.createElement("title")),e.appendChild(n),e.appendChild(t.createElement("body")),t.appendChild(e)}();if(t.getElementsByTagName)for(var o in n)n[o]=t.getElementsByTagName(o)[0];var u=n.body;return f(e,{start:function(e,s,o){if(n[e]){u=n[e];return}var a=t.createElement(e);for(var f in s)a.setAttribute(s[f].name,s[f].value);r[e]&&typeof n[r[e]]!="boolean"?n[r[e]].appendChild(a):u&&u.appendChild&&u.appendChild(a),o||(i.push(a),u=a)},end:function(e){i.length-=1,u=i[i.length-1]},chars:function(e){u.appendChild(t.createTextNode(e))},comment:function(e){}}),t}}(),function(e){function a(e){return e.replace(/([.*+?^=!:${}()|[\]\/\\])/g,"\\$1")}function f(e){return String(Object.prototype.toString.call(e))==="[object Array]"}function l(t,n){var r={},i,s;if(f(n))for(i=0,s=n.length;i<s;i++)r[n[i]]=!0;else r[n]=!0;for(i=0,s=t.length;i<s;i++)r[t[i]]!==e&&(t.splice(i,1),s--,i--);return t}var t=typeof module!="undefined"&&module.exports,n=function(e){return t?require("./"+e):window[e]},r=n("punycode"),i=n("IPv6"),s=n("SecondLevelDomains"),o=function(t,n){return this instanceof o?(t===e&&(t=location.href+""),this.href(t),n!==e?this.absoluteTo(n):this):new o(t)},u=o.prototype;o.idn_expression=/[^a-z0-9\.-]/i,o.punycode_expression=/(xn--)/i,o.ip4_expression=/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,o.ip6_expression=/^\s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%.+)?\s*$/,o.find_uri_expression=/\b((?:[a-z][\w-]+:(?:\/{1,3}|[a-z0-9%])|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'".,<>?«»“”‘’]))/ig,o.defaultPorts={http:"80",https:"443",ftp:"21"},o.invalid_hostname_characters=/[^a-zA-Z0-9\.-]/,o.encode=encodeURIComponent,o.decode=decodeURIComponent,o.iso8859=function(){o.encode=escape,o.decode=unescape},o.unicode=function(){o.encode=encodeURIComponent,o.decode=decodeURIComponent},o.characters={pathname:{encode:{expression:/%(24|26|2B|2C|3B|3D|3A|40)/ig,map:{"%24":"$","%26":"&","%2B":"+","%2C":",","%3B":";","%3D":"=","%3A":":","%40":"@"}},decode:{expression:/[\/\?#]/g,map:{"/":"%2F","?":"%3F","#":"%23"}}}},o.encodeQuery=function(e){return o.encode(e+"").replace(/%20/g,"+")},o.decodeQuery=function(e){return o.decode((e+"").replace(/\+/g,"%20"))},o.recodePath=function(e){var t=(e+"").split("/");for(var n=0,r=t.length;n<r;n++)t[n]=o.encodePathSegment(o.decode(t[n]));return t.join("/")},o.decodePath=function(e){var t=(e+"").split("/");for(var n=0,r=t.length;n<r;n++)t[n]=o.decodePathSegment(t[n]);return t.join("/")};var c={encode:"encode",decode:"decode"},h,p=function(e){return function(t){return o[e](t+"").replace(o.characters.pathname[e].expression,function(t){return o.characters.pathname[e].map[t]})}};for(h in c)o[h+"PathSegment"]=p(c[h]);o.parse=function(e){var t,n,r={};return t=e.indexOf("#"),t>-1&&(r.fragment=e.substring(t+1)||null,e=e.substring(0,t)),t=e.indexOf("?"),t>-1&&(r.query=e.substring(t+1)||null,e=e.substring(0,t)),e.substring(0,2)==="//"?(r.protocol="",e=e.substring(2),e=o.parseAuthority(e,r)):(t=e.indexOf(":"),t>-1&&(r.protocol=e.substring(0,t),e.substring(t+1,t+3)==="//"?(e=e.substring(t+3),e=o.parseAuthority(e,r)):(e=e.substring(t+1),r.urn=!0))),r.path=e,r},o.parseHost=function(e,t){var n=e.indexOf("/"),r;n===-1&&(n=e.length);if(e[0]==="["){var i=e.indexOf("]");t.hostname=e.substring(1,i)||null,t.port=e.substring(i+2,n)||null}else e.indexOf(":")!==e.lastIndexOf(":")?(t.hostname=e.substring(0,n)||null,t.port=null):(r=e.substring(0,n).split(":"),t.hostname=r[0]||null,t.port=r[1]||null);return t.hostname&&e.substring(n)[0]!=="/"&&(n++,e="/"+e),e.substring(n)||"/"},o.parseAuthority=function(e,t){return e=o.parseUserinfo(e,t),o.parseHost(e,t)},o.parseUserinfo=function(e,t){var n=e.indexOf("@"),r=e.indexOf("/"),i;return n>-1&&(r===-1||n<r)?(i=e.substring(0,n).split(":"),t.username=i[0]?o.decode(i[0]):null,t.password=i[1]?o.decode(i[1]):null,e=e.substring(n+1)):(t.username=null,t.password=null),e},o.parseQuery=function(e){if(!e)return{};e=e.replace(/&+/g,"&").replace(/^\?*&*|&+$/g,"");if(!e)return{};var t={},n=e.split("&"),r=n.length;for(var i=0;i<r;i++){var s=n[i].split("="),u=o.decodeQuery(s.shift()),a=s.length?o.decodeQuery(s.join("=")):null;t[u]?(typeof t[u]=="string"&&(t[u]=[t[u]]),t[u].push(a)):t[u]=a}return t},o.build=function(e){var t="";return e.protocol&&(t+=e.protocol+":"),!e.urn&&(t||e.hostname)&&(t+="//"),t+=o.buildAuthority(e)||"",typeof e.path=="string"&&(e.path[0]!=="/"&&typeof e.hostname=="string"&&(t+="/"),t+=e.path),typeof e.query=="string"&&(t+="?"+e.query),typeof e.fragment=="string"&&(t+="#"+e.fragment),t},o.buildHost=function(e){var t="";return e.hostname?(o.ip6_expression.test(e.hostname)?e.port?t+="["+e.hostname+"]:"+e.port:t+=e.hostname:(t+=e.hostname,e.port&&(t+=":"+e.port)),t):""},o.buildAuthority=function(e){return o.buildUserinfo(e)+o.buildHost(e)},o.buildUserinfo=function(e){var t="";return e.username&&(t+=o.encode(e.username),e.password&&(t+=":"+o.encode(e.password)),t+="@"),t},o.buildQuery=function(t,n){var r="";for(var i in t)if(Object.hasOwnProperty.call(t,i)&&i)if(f(t[i])){var s={};for(var u=0,a=t[i].length;u<a;u++)t[i][u]!==e&&s[t[i][u]+""]===e&&(r+="&"+o.buildQueryParameter(i,t[i][u]),n!==!0&&(s[t[i][u]+""]=!0))}else t[i]!==e&&(r+="&"+o.buildQueryParameter(i,t[i]));return r.substring(1)},o.buildQueryParameter=function(e,t){return o.encodeQuery(e)+(t!==null?"="+o.encodeQuery(t):"")},o.addQuery=function(t,n,r){if(typeof n=="object")for(var i in n)Object.prototype.hasOwnProperty.call(n,i)&&o.addQuery(t,i,n[i]);else{if(typeof n!="string")throw new TypeError("URI.addQuery() accepts an object, string as the name parameter");if(t[n]===e){t[n]=r;return}typeof t[n]=="string"&&(t[n]=[t[n]]),f(r)||(r=[r]),t[n]=t[n].concat(r)}},o.removeQuery=function(t,n,r){if(f(n))for(var i=0,s=n.length;i<s;i++)t[n[i]]=e;else if(typeof n=="object")for(var u in n)Object.prototype.hasOwnProperty.call(n,u)&&o.removeQuery(t,u,n[u]);else{if(typeof n!="string")throw new TypeError("URI.addQuery() accepts an object, string as the first parameter");r!==e?t[n]===r?t[n]=e:f(t[n])&&(t[n]=l(t[n],r)):t[n]=e}},o.commonPath=function(e,t){var n=Math.min(e.length,t.length),r;for(r=0;r<n;r++)if(e[r]!==t[r]){r--;break}return r<1?e[0]===t[0]&&e[0]==="/"?"/":"":(e[r]!=="/"&&(r=e.substring(0,r).lastIndexOf("/")),e.substring(0,r+1))},o.withinString=function(e,t){return e.replace(o.find_uri_expression,t)},o.ensureValidHostname=function(e){if(e.match(o.invalid_hostname_characters)){if(!r)throw new TypeError("Hostname '"+e+"' contains characters other than [A-Z0-9.-] and Punycode.js is not available");if(r.toASCII(e).match(o.invalid_hostname_characters))throw new TypeError("Hostname '"+e+"' contains characters other than [A-Z0-9.-]")}},u.build=function(t){if(t===!0)this._deferred_build=!0;else if(t===e||this._deferred_build)this._string=o.build(this._parts),this._deferred_build=!1;return this},u.toString=function(){return this.build(!1)._string},u.valueOf=function(){return this.toString()},c={protocol:"protocol",username:"username",password:"password",hostname:"hostname",port:"port"},p=function(t){return function(n,r){return n===e?this._parts[t]||"":(this._parts[t]=n,this.build(!r),this)}};for(h in c)u[h]=p(c[h]);c={query:"?",fragment:"#"},p=function(t,n){return function(r,i){return r===e?this._parts[t]||"":(r!==null&&(r+="",r[0]===n&&(r=r.substring(1))),this._parts[t]=r,this.build(!i),this)}};for(h in c)u[h]=p(h,c[h]);c={search:["?","query"],hash:["#","fragment"]},p=function(e,t){return function(n,r){var i=this[e](n,r);return typeof i=="string"&&i.length?t+i:i}};for(h in c)u[h]=p(c[h][1],c[h][0]);u.pathname=function(t,n){if(t===e||t===!0){var r=this._parts.path||(this._parts.urn?"":"/");return t?o.decodePath(r):r}return this._parts.path=t?o.recodePath(t):"/",this.build(!n),this},u.path=u.pathname,u.href=function(t,n){if(t===e)return this.toString();this._string="",this._parts={protocol:null,username:null,password:null,hostname:null,urn:null,port:null,path:null,query:null,fragment:null};var r=t instanceof o,i=typeof t=="object"&&(t.hostname||t.path),s;if(typeof t=="string")this._parts=o.parse(t);else{if(!r&&!i)throw new TypeError("invalid input");var u=r?t._parts:t;for(s in u)Object.hasOwnProperty.call(this._parts,s)&&(this._parts[s]=u[s])}return this.build(!n),this},u.is=function(e){var t=!1,n=!1,r=!1,i=!1,u=!1,a=!1,f=!1,l=!this._parts.urn;this._parts.hostname&&(l=!1,n=o.ip4_expression.test(this._parts.hostname),r=o.ip6_expression.test(this._parts.hostname),t=n||r,i=!t,u=i&&s&&s.has(this._parts.hostname),a=i&&o.idn_expression.test(this._parts.hostname),f=i&&o.punycode_expression.test(this._parts.hostname));switch(e.toLowerCase()){case"relative":return l;case"absolute":return!l;case"domain":case"name":return i;case"sld":return u;case"ip":return t;case"ip4":case"ipv4":case"inet4":return n;case"ip6":case"ipv6":case"inet6":return r;case"idn":return a;case"url":return!this._parts.urn;case"urn":return!!this._parts.urn;case"punycode":return f}return null};var d=u.protocol,v=u.port,m=u.hostname;u.protocol=function(t,n){if(t!==e&&t){t=t.replace(/:(\/\/)?$/,"");if(t.match(/[^a-zA-z0-9\.+-]/))throw new TypeError("Protocol '"+t+"' contains characters other than [A-Z0-9.+-]")}return d.call(this,t,n)},u.scheme=u.protocol,u.port=function(t,n){if(this._parts.urn)return t===e?"":this;if(t!==e){t===0&&(t=null);if(t){t+="",t[0]===":"&&(t=t.substring(1));if(t.match(/[^0-9]/))throw new TypeError("Port '"+t+"' contains characters other than [0-9]")}}return v.call(this,t,n)},u.hostname=function(t,n){if(this._parts.urn)return t===e?"":this;if(t!==e){var r={};o.parseHost(t,r),t=r.hostname}return m.call(this,t,n)},u.host=function(t,n){return this._parts.urn?t===e?"":this:t===e?this._parts.hostname?o.buildHost(this._parts):"":(o.parseHost(t,this._parts),this.build(!n),this)},u.authority=function(t,n){return this._parts.urn?t===e?"":this:t===e?this._parts.hostname?o.buildAuthority(this._parts):"":(o.parseAuthority(t,this._parts),this.build(!n),this)},u.userinfo=function(t,n){if(this._parts.urn)return t===e?"":this;if(t===e){if(!this._parts.username)return"";var r=o.buildUserinfo(this._parts);return r.substring(0,r.length-1)}return t[t.length-1]!=="@"&&(t+="@"),o.parseUserinfo(t,this._parts),this.build(!n),this},u.subdomain=function(t,n){if(this._parts.urn)return t===e?"":this;if(t===e){if(!this._parts.hostname||this.is("IP"))return"";var r=this._parts.hostname.length-this.domain().length-1;return this._parts.hostname.substring(0,r)||""}var i=this._parts.hostname.length-this.domain().length,s=this._parts.hostname.substring(0,i),u=new RegExp("^"+a(s));return t&&t[t.length-1]!=="."&&(t+="."),t&&o.ensureValidHostname(t),this._parts.hostname=this._parts.hostname.replace(u,t),this.build(!n),this},u.domain=function(t,n){if(this._parts.urn)return t===e?"":this;typeof t=="boolean"&&(n=t,t=e);if(t===e){if(!this._parts.hostname||this.is("IP"))return"";var r=this._parts.hostname.match(/\./g);if(r&&r.length<2)return this._parts.hostname;var i=this._parts.hostname.length-this.tld(n).length-1;return i=this._parts.hostname.lastIndexOf(".",i-1)+1,this._parts.hostname.substring(i)||""}if(!t)throw new TypeError("cannot set domain empty");o.ensureValidHostname(t);if(!this._parts.hostname||this.is("IP"))this._parts.hostname=t;else{var s=new RegExp(a(this.domain())+"$");this._parts.hostname=this._parts.hostname.replace(s,t)}return this.build(!n),this},u.tld=function(t,n){if(this._parts.urn)return t===e?"":this;typeof t=="boolean"&&(n=t,t=e);if(t===e){if(!this._parts.hostname||this.is("IP"))return"";var r=this._parts.hostname.lastIndexOf("."),i=this._parts.hostname.substring(r+1);return n!==!0&&s&&s.list[i.toLowerCase()]?s.get(this._parts.hostname)||i:i}var o;if(!t)throw new TypeError("cannot set TLD empty");if(t.match(/[^a-zA-Z0-9-]/)){if(!s||!s.is(t))throw new TypeError("TLD '"+t+"' contains characters other than [A-Z0-9]");o=new RegExp(a(this.tld())+"$"),this._parts.hostname=this._parts.hostname.replace(o,t)}else{if(!this._parts.hostname||this.is("IP"))throw new ReferenceError("cannot set TLD on non-domain host");o=new RegExp(a(this.tld())+"$"),this._parts.hostname=this._parts.hostname.replace(o,t)}return this.build(!n),this},u.directory=function(t,n){if(this._parts.urn)return t===e?"":this;if(t===e||t===!0){if(!this._parts.path&&!this._parts.hostname)return"";if(this._parts.path==="/")return"/";var r=this._parts.path.length-this.filename().length-1,i=this._parts.path.substring(0,r)||(this._parts.hostname?"/":"");return t?o.decodePath(i):i}var s=this._parts.path.length-this.filename().length,u=this._parts.path.substring(0,s),f=new RegExp("^"+a(u));return this.is("relative")||(t||(t="/"),t[0]!=="/"&&(t="/"+t)),t&&t[t.length-1]!=="/"&&(t+="/"),t=o.recodePath(t),this._parts.path=this._parts.path.replace(f,t),this.build(!n),this},u.filename=function(t,n){if(this._parts.urn)return t===e?"":this;if(t===e||t===!0){if(!this._parts.path||this._parts.path==="/")return"";var r=this._parts.path.lastIndexOf("/"),i=this._parts.path.substring(r+1);return t?o.decodePathSegment(i):i}var s=!1;t[0]==="/"&&(t=t.substring(1)),t.match(/\.?\//)&&(s=!0);var u=new RegExp(a(this.filename())+"$");return t=o.recodePath(t),this._parts.path=this._parts.path.replace(u,t),s?this.normalizePath(n):this.build(!n),this},u.suffix=function(t,n){if(this._parts.urn)return t===e?"":this;if(t===e||t===!0){if(!this._parts.path||this._parts.path==="/")return"";var r=this.filename(),i=r.lastIndexOf("."),s,u;return i===-1?"":(s=r.substring(i+1),u=/^[a-z0-9%]+$/i.test(s)?s:"",t?o.decodePathSegment(u):u)}t[0]==="."&&(t=t.substring(1));var f=this.suffix(),l;if(!f){if(!t)return this;this._parts.path+="."+o.recodePath(t)}else t?l=new RegExp(a(f)+"$"):l=new RegExp(a("."+f)+"$");return l&&(t=o.recodePath(t),this._parts.path=this._parts.path.replace(l,t)),this.build(!n),this};var g=u.query;u.query=function(t,n){return t===!0?o.parseQuery(this._parts.query):t!==e&&typeof t!="string"?(this._parts.query=o.buildQuery(t),this.build(!n),this):g.call(this,t,n)},u.addQuery=function(e,t,n){var r=o.parseQuery(this._parts.query);return o.addQuery(r,e,t),this._parts.query=o.buildQuery(r),typeof e!="string"&&(n=t),this.build(!n),this},u.removeQuery=function(e,t,n){var r=o.parseQuery(this._parts.query);return o.removeQuery(r,e,t),this._parts.query=o.buildQuery(r),typeof e!="string"&&(n=t),this.build(!n),this},u.addSearch=u.addQuery,u.removeSearch=u.removeQuery,u.normalize=function(){return this._parts.urn?this.normalizeProtocol(!1).normalizeQuery(!1).normalizeFragment(!1).build():this.normalizeProtocol(!1).normalizeHostname(!1).normalizePort(!1).normalizePath(!1).normalizeQuery(!1).normalizeFragment(!1).build()},u.normalizeProtocol=function(e){return typeof this._parts.protocol=="string"&&(this._parts.protocol=this._parts.protocol.toLowerCase(),this.build(!e)),this},u.normalizeHostname=function(e){return this._parts.hostname&&(this.is("IDN")&&r?this._parts.hostname=r.toASCII(this._parts.hostname):this.is("IPv6")&&i&&(this._parts.hostname=i.best(this._parts.hostname)),this._parts.hostname=this._parts.hostname.toLowerCase(),this.build(!e)),this},u.normalizePort=function(e){return typeof this._parts.protocol=="string"&&this._parts.port===o.defaultPorts[this._parts.protocol]&&(this._parts.port=null,this.build(!e)),this},u.normalizePath=function(e){if(this._parts.urn)return this;if(!this._parts.path||this._parts.path==="/")return this;var t,n,r=this._parts.path,i,s;r[0]!=="/"&&(r[0]==="."&&(n=r.substring(0,r.indexOf("/"))),t=!0,r="/"+r),r=r.replace(/(\/(\.\/)+)|\/{2,}/g,"/");for(;;){i=r.indexOf("/../");if(i===-1)break;if(i===0){r=r.substring(3);break}s=r.substring(0,i).lastIndexOf("/"),s===-1&&(s=i),r=r.substring(0,s)+r.substring(i+3)}return t&&this.is("relative")&&(n?r=n+r:r=r.substring(1)),r=o.recodePath(r),this._parts.path=r,this.build(!e),this},u.normalizePathname=u.normalizePath,u.normalizeQuery=function(e){return typeof this._parts.query=="string"&&(this._parts.query.length?this.query(o.parseQuery(this._parts.query)):this._parts.query=null,this.build(!e)),this},u.normalizeFragment=function(e){return this._parts.fragment||(this._parts.fragment=null,this.build(!e)),this},u.normalizeSearch=u.normalizeQuery,u.normalizeHash=u.normalizeFragment,u.iso8859=function(){var e=o.encode,t=o.decode;return o.encode=escape,o.decode=decodeURIComponent,this.normalize(),o.encode=e,o.decode=t,this},u.unicode=function(){var e=o.encode,t=o.decode;return o.encode=encodeURIComponent,o.decode=unescape,this.normalize(),o.encode=e,o.decode=t,this},u.readable=function(){var t=new o(this);t.username("").password("").normalize();var n="";t._parts.protocol&&(n+=t._parts.protocol+"://"),t._parts.hostname&&(t.is("punycode")&&r?(n+=r.toUnicode(t._parts.hostname),t._parts.port&&(n+=":"+t._parts.port)):n+=t.host()),t._parts.hostname&&t._parts.path&&t._parts.path[0]!=="/"&&(n+="/"),n+=t.path(!0);if(t._parts.query){var i="";for(var s=0,u=t._parts.query.split("&"),a=u.length;s<a;s++){var f=(u[s]||"").split("=");i+="&"+o.decodeQuery(f[0]).replace(/&/g,"%26"),f[1]!==e&&(i+="="+o.decodeQuery(f[1]).replace(/&/g,"%26"))}n+="?"+i.substring(1)}return n+=t.hash(),n},u.absoluteTo=function(e){if(this._parts.urn)throw new Error("URNs do not have any generally defined hierachical components");e instanceof o||(e=new o(e));var t=new o(this),n=["protocol","username","password","hostname","port"],r;for(var i=0,s;s=n[i];i++)t._parts[s]=e._parts[s];return t.path()[0]!=="/"&&(r=e.directory(),t._parts.path=(r?r+"/":"")+t._parts.path,t.normalizePath()),t.build(),t},u.relativeTo=function(e){if(this._parts.urn)throw new Error("URNs do not have any generally defined hierachical components");e instanceof o||(e=new o(e));if(this.path()[0]!=="/"||e.path()[0]!=="/")throw new Error("Cannot calculate common path from non-relative URLs");var t=new o(this),n=["protocol","username","password","hostname","port"],r=o.commonPath(t.path(),e.path()),i=e.directory();for(var s=0,u;u=n[s];s++)t._parts[u]=null;if(!r||r==="/")return t;if(i+"/"===r)t._parts.path="./"+t.filename();else{var f="../",l=new RegExp("^"+a(r)),c=i.replace(l,"/").match(/\//g).length-1;while(c--)f+="../";t._parts.path=t._parts.path.replace(l,f)}return t.build(),t},u.equals=function(e){var t=new o(this),n=new o(e),r={},i={},s={},u,a,l;t.normalize(),n.normalize();if(t.toString()===n.toString())return!0;u=t.query(),a=n.query(),t.query(""),n.query("");if(t.toString()!==n.toString())return!1;if(u.length!==a.length)return!1;r=o.parseQuery(u),i=o.parseQuery(a);for(l in r)if(Object.prototype.hasOwnProperty.call(r,l)){if(!f(r[l])){if(r[l]!==i[l])return!1}else{if(!f(i[l]))return!1;if(r[l].length!==i[l].length)return!1;r[l].sort(),i[l].sort();for(var c=0,h=r[l].length;c<h;c++)if(r[l][c]!==i[l][c])return!1}s[l]=!0}for(l in i)if(Object.prototype.hasOwnProperty.call(i,l)&&!s[l])return!1;return!0},typeof module!="undefined"&&module.exports?module.exports=o:window.URI=o}(),window.rasterizeHTMLInline=function(e){"use strict";var t=function(t,n,r,i,s){var o=t.attributes.src.nodeValue,u=n||t.ownerDocument.baseURI;if(e.util.isDataUri(o)){i();return}o=e.util.getUrlRelativeToDocumentBase(o,u),e.util.getDataURIForImageURL(o,{cache:r},function(e){t.attributes.src.nodeValue=e,i()},function(){s(o)})},n=function(e){var t=[];return Array.prototype.forEach.call(e,function(e){e.type==="image"&&t.push(e)}),t};e.loadAndInlineImages=function(r,i,s){var o=e.util.parseOptionalParameters(i,s),u=r.getElementsByTagName("img"),a=r.getElementsByTagName("input"),f=o.options.baseUrl,l=o.options.cache!==!1,c=[],h=[];c=Array.prototype.slice.call(u),c=c.concat(n(a)),e.util.map(c,function(e,n){t(e,f,l,n,function(e){h.push({resourceType:"image",url:e,msg:"Unable to load image "+e}),n()})},function(){o.callback&&o.callback(h)})};var r=function(t,n,r,i,s){var o=e.css.rulesForCssText(t.textContent);e.css.loadCSSImportsForRules(o,n,r,i,function(i,u){e.css.loadAndInlineCSSResourcesForRules(o,n,r,function(n,r){var a=u.concat(r);if(i||n)t.childNodes[0].nodeValue=e.css.cssRulesToText(o);s(a)})})};e.loadAndInlineStyles=function(t,n,i){var s=e.util.parseOptionalParameters(n,i),o=t.getElementsByTagName("style"),u=s.options.baseUrl||t.baseURI,a=s.options.cache!==!1,f=[],l=[];e.util.map(o,function(e,t){!e.attributes.type||e.attributes.type.nodeValue==="text/css"?r(e,u,a,l,function(e){f=f.concat(e),t()}):t()},function(){s.callback(f)})};var i=function(e,t){var n=e.parentNode,r;t=t.trim(),t&&(r=e.ownerDocument.createElement("style"),r.type="text/css",r.appendChild(e.ownerDocument.createTextNode(t)),n.insertBefore(r,e)),n.removeChild(e)},s=function(t,n,r,i,s){var o=t.attributes.href.nodeValue,u=n||t.ownerDocument.baseURI,a=e.util.getUrlRelativeToDocumentBase(o,u);e.util.ajax(a,{cache:r},function(t){var n=e.css.rulesForCssText(t),s;s=e.css.adjustPathsOfCssResources(o,n),e.css.loadCSSImportsForRules(n,u,r,[],function(o,a){e.css.loadAndInlineCSSResourcesForRules(n,u,r,function(r,u){var f=a.concat(u);if(s||o||r)t=e.css.cssRulesToText(n);i(t,f)})})},function(){s(a)})};e.loadAndInlineCssLinks=function(t,n,r){var o=e.util.parseOptionalParameters(n,r),u=t.getElementsByTagName("link"),a=o.options.baseUrl,f=o.options.cache!==!1,l=[];e.util.map(u,function(e,t){e.attributes.rel&&e.attributes.rel.nodeValue==="stylesheet"&&(!e.attributes.type||e.attributes.type.nodeValue==="text/css")?s(e,a,f,function(n,r){i(e,n+"\n"),l=l.concat(r),t()},function(e){l.push({resourceType:"stylesheet",url:e,msg:"Unable to load stylesheet "+e}),t()}):t()},function(){o.callback&&o.callback(l)})};var o=function(t,n,r,i,s){var o=n||t.ownerDocument.baseURI,u=e.util.getUrlRelativeToDocumentBase(t.attributes.src.nodeValue,o);e.util.ajax(u,{cache:r},i,function(){s(u)})},u=function(e,t){var n=e.ownerDocument.createElement("script"),r=e.parentNode;e.attributes.type&&(n.type=e.attributes.type.nodeValue),n.appendChild(e.ownerDocument.createTextNode(t)),r.insertBefore(n,e),r.removeChild(e)};return e.loadAndInlineScript=function(t,n,r){var i=e.util.parseOptionalParameters(n,r),s=t.getElementsByTagName("script"),a=i.options.cache!==!1,f=[];e.util.map(s,function(e,t){e.attributes.src?o(e,i.options.baseUrl,a,function(n){u(e,n),t()},function(e){f.push({resourceType:"script",url:e,msg:"Unable to load script "+e}),t()}):t()},function(){i.callback&&i.callback(f)})},e.inlineReferences=function(t,n,r){var i=[];e.loadAndInlineImages(t,n,function(s){i=i.concat(s),e.loadAndInlineStyles(t,n,function(s){i=i.concat(s),e.loadAndInlineCssLinks(t,n,function(s){i=i.concat(s),e.loadAndInlineScript(t,n,function(e){i=i.concat(e),r(i)})})})})},e}(window.rasterizeHTMLInline||{}),window.rasterizeHTMLInline=function(e,t,n){"use strict";e.css={};var r=function(e){return Array.prototype.slice.call(e)},i=function(e){var t=document.implementation.createHTMLDocument(""),n=document.createElement("style"),i;return n.textContent=e,t.body.appendChild(n),i=n.sheet.cssRules,r(i)};e.css.rulesForCssText=function(e){return n.parse&&t.navigator.userAgent.indexOf("Chrome")>=0?n.parse(e).cssRules:i(e)};var s=function(e){var n=[];return e.forEach(function(e){e.type===t.CSSRule.STYLE_RULE&&(e.style.getPropertyValue("background-image")||e.style.getPropertyValue("background"))&&n.push(e)}),n},o=function(e){var n=[];return e.forEach(function(e){e.type===t.CSSRule.FONT_FACE_RULE&&e.style.getPropertyValue("src")&&n.push(e)}),n};e.css.cssRulesToText=function(e){var t="";return e.forEach(function(e){t+=e.cssText}),t};var u=function(e){var t=/^"(.*)"$/,n=/^'(.*)'$/;return t.test(e)?e.replace(t,"$1"):n.test(e)?e.replace(n,"$1"):e},a=function(e){var t=/^[\t\r\f\n ]*(.+?)[\t\r\f\n ]*$/;return e.replace(t,"$1")};e.css.extractCssUrl=function(e){var t=/^url\(([^\)]+)\)/,n;if(!t.test(e))throw new Error("Invalid url");return n=t.exec(e)[1],u(a(n))};var f=function(e){var t=/^format\(([^\)]+)\)/,n;return t.test(e)?(n=t.exec(e)[1],u(n)):null},l=function(t){var n,r=null;try{return n=e.css.extractCssUrl(t[0]),t[1]&&(r=f(t[1])),{url:n,format:r}}catch(i){}},c=function(e,t,n){var r=e.indexOf(t),i="@font-face { font-family: "+t.style.getPropertyValue("font-family")+"; src: "+n+"}",s=t.parentStyleSheet;s.insertRule(i,r+1),s.deleteRule(r),e[r]=s.cssRules[r]};e.css.adjustPathsOfCssResources=function(t,n){var r=!1,i;return s(n).forEach(function(n){var s=n.style.getPropertyValue("background-image")||n.style.getPropertyValue("background"),o=m(s),u=!1;o.forEach(function(n){var r=g(n),i;r&&!e.util.isDataUri(r.url)&&(i=e.util.joinUrl(t,r.url),n[r.idx]='url("'+i+'")',u=!0)}),i=y(o),n.style.getPropertyValue("background-image")?n.style.setProperty("background-image",i):n.style.setProperty("background",i),r=r||u}),o(n).forEach(function(i){var s=E(i.style.getPropertyValue("src")),o=!1;s.forEach(function(n){var r=l(n),i;r&&!e.util.isDataUri(r.url)&&(i=e.util.joinUrl(t,r.url),n[0]='url("'+i+'")',o=!0)}),o&&c(n,i,S(s)),r=r||o}),r};var h=function(e){var n=[];return e.forEach(function(e){e.type===t.CSSRule.IMPORT_RULE&&e.href&&n.push(e)}),n},p=function(e,t,n){var r=e.indexOf(t);e.splice(r,1),n.forEach(function(t,n){e.splice(r+n,0,t)})},d=function(e){var t=/^"(.*)"$/,n=/^'(.*)'$/;return t.test(e)||n.test(e)},v=function(t,n,r,i,s,o,a){var f=n.href,l;d(f)&&(f=u(f)),l=e.util.getUrlRelativeToDocumentBase(f,r);if(s.indexOf(l)>=0){p(t,n,[]),o([]);return}s.push(l),e.util.ajax(l,{cache:i},function(u){var a=e.css.rulesForCssText(u);e.css.loadCSSImportsForRules(a,r,i,s,function(r,i){e.css.adjustPathsOfCssResources(f,a),p(t,n,a),o(i)})},function(){a(l)})};e.css.loadCSSImportsForRules=function(t,n,r,i,s){var o=[],u;u=h(t),e.util.map(u,function(e,s){v(t,e,n,r,i,function(e){o=o.concat(e),s(!0)},function(e){o.push({resourceType:"stylesheet",url:e,msg:"Unable to load stylesheet "+e}),s(!1)})},function(e){var t=e.indexOf(!0)>=0;s(t,o)})};var m=function(e){var t="\\s*(?:\"[^\"]*\"|'[^']*'|[^\\(]+)\\s*",n="(url\\("+t+"\\)"+"|"+"[^,\\s]+"+")",r="(?:\\s*"+n+")+",i="^\\s*("+r+")"+"(?:\\s*,\\s*("+r+"))*"+"\\s*$",s=new RegExp(r,"g"),o,u=[],a=function(e){var t=new RegExp(n,"g"),r=[],i;i=t.exec(e);while(i)r.push(i[1]),i=t.exec(e);return r};if(e.match(new RegExp(i))){o=s.exec(e);while(o)u.push(a(o[0])),o=s.exec(e);return u}return[]},g=function(t){var n,r;for(n=0;n<t.length;n++)try{return r=e.css.extractCssUrl(t[n]),{url:r,idx:n}}catch(i){}},y=function(e){var t=[];return e.forEach(function(e){t.push(e.join(" "))}),t.join(", ")},b=function(t,n,r,i){var s=[],o,u=t.style.getPropertyValue("background-image")||t.style.getPropertyValue("background"),a;o=m(u),e.util.map(o,function(t,i){var o=g(t),u;if(!o||e.util.isDataUri(o.url)){i(!1);return}u=e.util.getUrlRelativeToDocumentBase(o.url,n),e.util.getDataURIForImageURL(u,{cache:r},function(e){t[o.idx]='url("'+e+'")',i(!0)},function(){s.push(u),i(!1)})},function(e){var n=e.indexOf(!0)>=0;n&&(a=y(o),t.style.getPropertyValue("background-image")?t.style.setProperty("background-image",a):t.style.setProperty("background",a)),i(n,s)})},w=function(t,n,r,i){var o=s(t),u=[],a;e.util.map(o,function(e,t){b(e,n,r,function(e,n){n.forEach(function(e){u.push({resourceType:"backgroundImage",url:e,msg:"Unable to load background-image "+e})}),t(e)})},function(e){a=e.indexOf(!0)>=0,i(a,u)})},E=function(e){var t="\\s*(?:\"[^\"]*\"|'[^']*'|[^\\(]+)\\s*",n="(local\\("+t+"\\))"+"|"+"(url\\("+t+"\\))"+"(?:\\s+(format\\("+t+"\\)))?",r="^\\s*("+n+")"+"(?:\\s*,\\s*("+n+"))*"+"\\s*$",i=new RegExp(n,"g"),s,o=[],u=function(e){var t=[];return e.slice(1).forEach(function(e){e&&t.push(e)}),t};if(e.match(new RegExp(r))){s=i.exec(e);while(s)o.push(u(s)),s=i.exec(e);return o}return[]},S=function(e){var t=[];return e.forEach(function(e){t.push(e.join(" "))}),t.join(", ")},x=function(t,n,r,i,s){var o,u,a,f,h,p=[];o=E(n.style.getPropertyValue("src")),e.util.map(o,function(t,n){u=l(t);if(!u||e.util.isDataUri(u.url)){n(!1);return}a=e.util.getUrlRelativeToDocumentBase(u.url,r),f=u.format||"woff",e.util.binaryAjax(a,{cache:i},function(e){h=btoa(e),t[0]='url("data:font/'+f+";base64,"+h+'")',n(!0)},function(){p.push(a),n(!1)})},function(e){var r=e.indexOf(!0)>=0;r&&c(t,n,S(o)),s(r,p)})},T=function(t,n,r,i){var s=o(t),u=[],a;e.util.map(s,function(e,i){x(t,e,n,r,function(e,t){t.forEach(function(e){u.push({resourceType:"fontFace",url:e,msg:"Unable to load font-face "+e})}),i(e)})},function(e){a=e.indexOf(!0)>=0,i(a,u)})};return e.css.loadAndInlineCSSResourcesForRules=function(e,t,n,r){w(e,t,n,function(i,s){T(e,t,n,function(e,t){var n=i||e;r(n,s.concat(t))})})},e}(window.rasterizeHTMLInline||{},window,window.CSSOM||{}),window.rasterizeHTMLInline=function(e,t,n){"use strict";e.util={},e.util.getUrlRelativeToDocumentBase=function(t,n){return n&&n!=="about:blank"&&(t=e.util.joinUrl(n,t)),t},e.util.cloneArray=function(e){return Array.prototype.slice.apply(e,[0])},e.util.joinUrl=function(e,t){var r=new n(t);return r.is("relative")&&(r=r.absoluteTo(e)),r.toString()},e.util.isDataUri=function(e){return/^data:/.test(e)},e.util.map=function(t,n,r){var i=0,s=e.util.cloneArray(t),o=[],u;s.length===0&&r(o);var a=function(e){function t(t){i+=1,o[e]=t,i===s.length&&r(o)}n(s[e],t)};for(u=0;u<s.length;u++)a(u)};var r=null,i=function(e,t,n){if(t){if(r===null||!n)r=Date.now();return e+"?_="+r}return e};e.util.ajax=function(e,n,r,s){var o=new t.XMLHttpRequest,u;n=n||{},u=i(e,n.cache===!1,n.cacheRepeated),o.addEventListener("load",function(){o.status===200||o.status===0?r(o.response):s()},!1),o.addEventListener("error",function(){s()},!1);try{o.open("GET",u,!0),o.overrideMimeType(n.mimeType),o.send(null)}catch(a){s()}},e.util.binaryAjax=function(t,n,r,i){var s="";n=n||{},e.util.ajax(t,{mimeType:"text/plain; charset=x-user-defined",cache:n.cache},function(e){for(var t=0;t<e.length;t++)s+=String.fromCharCode(e.charCodeAt(t)&255);r(s)},i)};var s=function(e){var t=function(e,t){return e.substring(0,t.length)===t};return t(e,"<?xml")||t(e,"<svg")?"image/svg+xml":"image/png"};e.util.getDataURIForImageURL=function(t,n,r,i){var o,u;e.util.binaryAjax(t,n,function(e){o=btoa(e),u=s(e),r("data:"+u+";base64,"+o)},function(){i()})};var o=function(e){var t={},n;for(n in e)e.hasOwnProperty(n)&&(t[n]=e[n]);return t},u=function(e){return typeof e=="function"};return e.util.parseOptionalParameters=function(){var e={options:{},callback:null};return u(arguments[0])?e.callback=arguments[0]:(e.options=o(arguments[0]),e.callback=arguments[1]||null),e},e}(window.rasterizeHTMLInline||{},window,URI),window.rasterizeHTML=function(e,t,n){"use strict";var r={},i=[];r.util={},r.util.getConstantUniqueIdFor=function(e){return i.indexOf(e)<0&&i.push(e),i.indexOf(e)},r.util.log=function(e){n.console&&n.console.log&&n.console.log(e)};var s=function(e){var t={},n;for(n in e)e.hasOwnProperty(n)&&(t[n]=e[n]);return t},o=function(e){return typeof e=="object"&&e!==null},u=function(e){return o(e)&&Object.prototype.toString.apply(e).match(/\[object (Canvas|HTMLCanvasElement)\]/i)},a=function(e){return typeof e=="function"};r.util.parseOptionalParameters=function(){var e={canvas:null,options:{},callback:null};return a(arguments[0])?e.callback=arguments[0]:arguments[0]==null||u(arguments[0])?(e.canvas=arguments[0]||null,a(arguments[1])?e.callback=arguments[1]:(e.options=s(arguments[1]),e.callback=arguments[2]||null)):(e.options=s(arguments[0]),e.callback=arguments[1]||null),e};var f=function(e){return(""+function(e){window.parent.rasterizeHTML.util.reportIframeJsError("put_unique_id_here",e)}).replace("put_unique_id_here",e)},l={};r.util.reportIframeJsError=function(e,t){var n=l[e]||[];n.push(t),l[e]=n};var c=function(e){var t=[];return l[e]&&l[e].forEach(function(e){t.push({resourceType:"scriptExecution",msg:e})}),t};r.util.executeJavascript=function(e,t,i){var s=y(n.document,"iframe"),o=e.getElementsByTagName("html")[0].innerHTML,u=r.util.getConstantUniqueIdFor(e),a="<script>window.onerror = "+f(u)+";</script>",l=function(){var e=s.contentDocument;n.document.getElementsByTagName("body")[0].removeChild(s),i(e,c(u))};t>0?s.onload=function(){setTimeout(l,t)}:s.onload=l,s.contentDocument.open(),s.contentDocument.write("<html>"+a+o+"</html>"),s.contentDocument.close()};var h=function(){return n.navigator.userAgent.indexOf("WebKit")>=0},p=function(e){var i;return e.documentElement.setAttribute("xmlns",e.documentElement.namespaceURI),i=(new n.XMLSerializer).serializeToString(e.documentElement),h()?t?t(i):(r.util.log("Looks like your browser needs htmlparser.js as workaround for writing XML. Please include it."),i):i},d=function(){if(n.navigator.userAgent.indexOf("WebKit")>=0&&n.navigator.userAgent.indexOf("Chrome")<0)return!1;if(n.BlobBuilder||n.MozBlobBuilder||n.WebKitBlobBuilder)return!0;if(n.Blob)try{return new n.Blob(["<b></b>"],{type:"text/xml"}),!0}catch(e){return!1}return!1},v=function(e){var t="image/svg+xml;charset=utf-8",r=n.BlobBuilder||n.MozBlobBuilder||n.WebKitBlobBuilder,i;return r?(i=new r,i.append(e),i.getBlob(t)):new n.Blob([e],{type:t})},m=function(e){var t=n.URL||n.webkitURL||window;return d()?t.createObjectURL(v(e)):"data:image/svg+xml;charset=utf-8,"+encodeURIComponent(e)},g=function(e){var t=n.URL||n.webkitURL||window;d()&&t.revokeObjectURL(e)},y=function(e,t){var n=e.createElement(t);return n.style.visibility="hidden",n.style.width="0px",n.style.height="0px",n.style.position="absolute",n.style.top="-10000px",n.style.left="-10000px",e.getElementsByTagName("body")[0].appendChild(n),n},b=function(e,t){var n=e.getElementById(t);return n||(n=y(e,"div"),n.id=t),n},w="rasterizeHTML_js_FirefoxWorkaround",E=function(){var e=n.navigator.userAgent.match(/Firefox\/(\d+).0/);return!e||!e[1]||parseInt(e[1],10)<17},S=function(e,t){var i=r.util.getConstantUniqueIdFor(e),s=t?t.ownerDocument:n.document,o;E()&&(o=b(s,w+i),o.innerHTML=e,o.className=w)},x=function(e){window.navigator.userAgent.indexOf("WebKit")>=0&&Array.prototype.forEach.call(e.getElementsByTagName("style"),function(e){e.textContent="span {}\n"+e.textContent})},T=function(e,t){var i=r.util.getConstantUniqueIdFor(e),s=t?t.ownerDocument:n.document,o=s.getElementById(w+i);o&&o.parentNode.removeChild(o)};r.getSvgForDocument=function(e,t,n){var r;return x(e),r=p(e),'<svg xmlns="http://www.w3.org/2000/svg" width="'+t+'" height="'+n+'">'+'<foreignObject width="100%" height="100%">'+r+"</foreignObject>"+"</svg>"},r.renderSvg=function(e,t,r,i){var s,o,u=function(){o.onload=null,o.onerror=null},a=function(){s&&g(s),T(e,t)};S(e,t),s=m(e),o=new n.Image,o.onload=function(){u(),a(),r(o)},o.onerror=function(){a(),i()},o.src=s},r.drawImageOnCanvas=function(e,t){try{t.getContext("2d").drawImage(e,0,0)}catch(n){return!1}return!0};var N=function(e,t,n,i,s,o){var u=r.getSvgForDocument(e,t,n),a=function(e){e.push({resourceType:"document",msg:"Error rendering page"})},f;r.renderSvg(u,i,function(e){i&&(f=r.drawImageOnCanvas(e,i),f||(a(o),e=null)),s&&s(e,o)},function(){a(o),s&&s(null,o)})};return r.drawDocument=function(t,n,i,s){var o=r.util.parseOptionalParameters(n,i,s),u=o.canvas?o.canvas.width:300,a=o.canvas?o.canvas.height:200,f=o.options.width!==undefined?o.options.width:u,l=o.options.height!==undefined?o.options.height:a,c=o.options.executeJsTimeout||0;e.inlineReferences(t,o.options,function(e){o.options.executeJs?r.util.executeJavascript(t,c,function(t,n){N(t,f,l,o.canvas,o.callback,e.concat(n))}):N(t,f,l,o.canvas,o.callback,e)})},r.drawHTML=function(e,t,i,s){var o=r.util.parseOptionalParameters(t,i,s),u=n.document.implementation.createHTMLDocument("");u.documentElement.innerHTML=e,r.drawDocument(u,o.canvas,o.options,o.callback)},r.drawURL=function(t,n,i,s){var o=r.util.parseOptionalParameters(n,i,s),u=o.options.cache;o.options.baseUrl=t,e.util.ajax(t,{cache:u},function(e){r.drawHTML(e,o.canvas,o.options,o.callback)},function(){o.callback&&o.callback(null,[{resourceType:"page",url:t,msg:"Unable to load page "+t}])})},r}(window.rasterizeHTMLInline,window.HTMLtoXML,window);
(function (name, definition) {
  var root = this;
  if (typeof module !== 'undefined') {
    var Canvas = require('canvas');
    module.exports = definition(root, name, Canvas);
  } else if (typeof define === 'function' && typeof define.amd === 'object') {
    define(definition);
  } else {
    root[name] = definition(root, name);
  }
})('imagediff', function (root, name, Canvas) {

  var
    TYPE_ARRAY        = /\[object Array\]/i,
    TYPE_CANVAS       = /\[object (Canvas|HTMLCanvasElement)\]/i,
    TYPE_CONTEXT      = /\[object CanvasRenderingContext2D\]/i,
    TYPE_IMAGE        = /\[object (Image|HTMLImageElement)\]/i,
    TYPE_IMAGE_DATA   = /\[object ImageData\]/i,

    UNDEFINED         = 'undefined',

    canvas            = getCanvas(),
    context           = canvas.getContext('2d'),
    previous          = root[name],
    imagediff, jasmine;

  // Creation
  function getCanvas (width, height) {
    var
      canvas = Canvas ?
        new Canvas() :
        document.createElement('canvas');
    if (width) canvas.width = width;
    if (height) canvas.height = height;
    return canvas;
  }
  function getImageData (width, height) {
    canvas.width = width;
    canvas.height = height;
    context.clearRect(0, 0, width, height);
    return context.createImageData(width, height);
  }


  // Type Checking
  function isImage (object) {
    return isType(object, TYPE_IMAGE);
  }
  function isCanvas (object) {
    return isType(object, TYPE_CANVAS);
  }
  function isContext (object) {
    return isType(object, TYPE_CONTEXT);
  }
  function isImageData (object) {
    return !!(object &&
      isType(object, TYPE_IMAGE_DATA) &&
      typeof(object.width) !== UNDEFINED &&
      typeof(object.height) !== UNDEFINED &&
      typeof(object.data) !== UNDEFINED);
  }
  function isImageType (object) {
    return (
      isImage(object) ||
      isCanvas(object) ||
      isContext(object) ||
      isImageData(object)
    );
  }
  function isType (object, type) {
    return typeof (object) === 'object' && !!Object.prototype.toString.apply(object).match(type);
  }


  // Type Conversion
  function copyImageData (imageData) {
    var
      height = imageData.height,
      width = imageData.width,
      data = imageData.data,
      newImageData, newData, i;

    canvas.width = width;
    canvas.height = height;
    newImageData = context.getImageData(0, 0, width, height);
    newData = newImageData.data;

    for (i = imageData.data.length; i--;) {
        newData[i] = data[i];
    }

    return newImageData;
  }
  function toImageData (object) {
    if (isImage(object)) { return toImageDataFromImage(object); }
    if (isCanvas(object)) { return toImageDataFromCanvas(object); }
    if (isContext(object)) { return toImageDataFromContext(object); }
    if (isImageData(object)) { return object; }
  }
  function toImageDataFromImage (image) {
    var
      height = image.height,
      width = image.width;
    canvas.width = width;
    canvas.height = height;
    context.clearRect(0, 0, width, height);
    context.drawImage(image, 0, 0);
    return context.getImageData(0, 0, width, height);
  }
  function toImageDataFromCanvas (canvas) {
    var
      height = canvas.height,
      width = canvas.width,
      context = canvas.getContext('2d');
    return context.getImageData(0, 0, width, height);
  }
  function toImageDataFromContext (context) {
    var
      canvas = context.canvas,
      height = canvas.height,
      width = canvas.width;
    return context.getImageData(0, 0, width, height);
  }
  function toCanvas (object) {
    var
      data = toImageData(object),
      canvas = getCanvas(data.width, data.height),
      context = canvas.getContext('2d');

    context.putImageData(data, 0, 0);
    return canvas;
  }


  // ImageData Equality Operators
  function equalWidth (a, b) {
    return a.width === b.width;
  }
  function equalHeight (a, b) {
    return a.height === b.height;
  }
  function equalDimensions (a, b) {
    return equalHeight(a, b) && equalWidth(a, b);
  }
  function equal (a, b, tolerance) {

    var
      aData     = a.data,
      bData     = b.data,
      length    = aData.length,
      i;

    tolerance = tolerance || 0;

    if (!equalDimensions(a, b)) return false;
    for (i = length; i--;) if (aData[i] !== bData[i] && Math.abs(aData[i] - bData[i]) > tolerance) return false;

    return true;
  }


  // Diff
  function diff (a, b) {
    return (equalDimensions(a, b) ? diffEqual : diffUnequal)(a, b);
  }
  function diffEqual (a, b) {

    var
      height  = a.height,
      width   = a.width,
      c       = getImageData(width, height), // c = a - b
      aData   = a.data,
      bData   = b.data,
      cData   = c.data,
      length  = cData.length,
      row, column,
      i, j, k, v;

    for (i = 0; i < length; i += 4) {
      cData[i] = Math.abs(aData[i] - bData[i]);
      cData[i+1] = Math.abs(aData[i+1] - bData[i+1]);
      cData[i+2] = Math.abs(aData[i+2] - bData[i+2]);
      cData[i+3] = Math.abs(255 - aData[i+3] - bData[i+3]);
    }

    return c;
  }
  function diffUnequal (a, b) {

    var
      height  = Math.max(a.height, b.height),
      width   = Math.max(a.width, b.width),
      c       = getImageData(width, height), // c = a - b
      aData   = a.data,
      bData   = b.data,
      cData   = c.data,
      rowOffset,
      columnOffset,
      row, column,
      i, j, k, v;


    for (i = cData.length - 1; i > 0; i = i - 4) {
      cData[i] = 255;
    }

    // Add First Image
    offsets(a);
    for (row = a.height; row--;){
      for (column = a.width; column--;) {
        i = 4 * ((row + rowOffset) * width + (column + columnOffset));
        j = 4 * (row * a.width + column);
        cData[i+0] = aData[j+0]; // r
        cData[i+1] = aData[j+1]; // g
        cData[i+2] = aData[j+2]; // b
        // cData[i+3] = aData[j+3]; // a
      }
    }

    // Subtract Second Image
    offsets(b);
    for (row = b.height; row--;){
      for (column = b.width; column--;) {
        i = 4 * ((row + rowOffset) * width + (column + columnOffset));
        j = 4 * (row * b.width + column);
        cData[i+0] = Math.abs(cData[i+0] - bData[j+0]); // r
        cData[i+1] = Math.abs(cData[i+1] - bData[j+1]); // g
        cData[i+2] = Math.abs(cData[i+2] - bData[j+2]); // b
      }
    }

    // Helpers
    function offsets (imageData) {
      rowOffset = Math.floor((height - imageData.height) / 2);
      columnOffset = Math.floor((width - imageData.width) / 2);
    }

    return c;
  }


  // Validation
  function checkType () {
    var i;
    for (i = 0; i < arguments.length; i++) {
      if (!isImageType(arguments[i])) {
        throw {
          name : 'ImageTypeError',
          message : 'Submitted object was not an image.'
        };
      }
    }
  }


  // Jasmine Matchers
  function get (element, content) {
    element = document.createElement(element);
    if (element && content) {
      element.innerHTML = content;
    }
    return element;
  }

  jasmine = {

    toBeImageData : function () {
      return imagediff.isImageData(this.actual);
    },

    toImageDiffEqual : function (expected, tolerance) {

      if (typeof (document) !== UNDEFINED) {
        this.message = function () {
          var
            div     = get('div'),
            a       = get('div', '<div>Actual:</div>'),
            b       = get('div', '<div>Expected:</div>'),
            c       = get('div', '<div>Diff:</div>'),
            diff    = imagediff.diff(this.actual, expected),
            canvas  = getCanvas(),
            context;

          canvas.height = diff.height;
          canvas.width  = diff.width;

          context = canvas.getContext('2d');
          context.putImageData(diff, 0, 0);

          a.appendChild(toCanvas(this.actual));
          b.appendChild(toCanvas(expected));
          c.appendChild(canvas);

          div.appendChild(a);
          div.appendChild(b);
          div.appendChild(c);

          return [
            div,
            "Expected not to be equal."
          ];
        };
      }

      return imagediff.equal(this.actual, expected, tolerance);
    }
  };


  // Image Output
  function imageDataToPNG (imageData, outputFile, callback) {

    var
      canvas = toCanvas(imageData),
      base64Data,
      decodedImage;

    callback = callback || Function;

    base64Data = canvas.toDataURL().replace(/^data:image\/\w+;base64,/,"");
    decodedImage = new Buffer(base64Data, 'base64');
    require('fs').writeFile(outputFile, decodedImage, callback);
  }


  // Definition
  imagediff = {

    createCanvas : getCanvas,
    createImageData : getImageData,

    isImage : isImage,
    isCanvas : isCanvas,
    isContext : isContext,
    isImageData : isImageData,
    isImageType : isImageType,

    toImageData : function (object) {
      checkType(object);
      if (isImageData(object)) { return copyImageData(object); }
      return toImageData(object);
    },

    equal : function (a, b, tolerance) {
      checkType(a, b);
      a = toImageData(a);
      b = toImageData(b);
      return equal(a, b, tolerance);
    },
    diff : function (a, b) {
      checkType(a, b);
      a = toImageData(a);
      b = toImageData(b);
      return diff(a, b);
    },

    jasmine : jasmine,

    // Compatibility
    noConflict : function () {
      root[name] = previous;
      return imagediff;
    }
  };

  if (typeof module !== 'undefined') {
    imagediff.imageDataToPNG = imageDataToPNG;
  }

  return imagediff;
});

window.csscritic = (function (module) {
    module.renderer = module.renderer || {};

    var getFileUrl = function (address) {
        var fs = require("fs");

        return address.indexOf("://") === -1 ? "file://" + fs.absolute(address) : address;
    };

    var getDataUriForBase64PNG = function (pngBase64) {
        return "data:image/png;base64," + pngBase64;
    };

    var getImageForUrl = function (url, successCallback, errorCallback) {
        var image = new window.Image();

        image.onload = function () {
            successCallback(image);
        };
        if (errorCallback) {
            image.onerror = errorCallback;
        }
        image.src = url;
    };

    var renderPage = function (page, successCallback, errorCallback) {
        var base64PNG, imgURI;

        base64PNG = page.renderBase64("PNG");
        imgURI = getDataUriForBase64PNG(base64PNG);

        getImageForUrl(imgURI, function (image) {
            successCallback(image);
        }, errorCallback);
    };

    module.renderer.phantomjsRenderer = function (pageUrl, width, height, proxyUrl, successCallback, errorCallback) {
        var page = require("webpage").create(),
            errorneousResources = [],
            handleError = function () {
                if (errorCallback) {
                    errorCallback();
                }
            };

        page.onResourceReceived = function (response) {
            var protocol = response.url.substr(0, 7);

            if (response.stage === "end" &&
                ((protocol !== "file://" && response.status >= 400) ||
                    (protocol === "file://" && !response.headers.length))) {
                errorneousResources.push(response.url);
            }
        };

        page.viewportSize = {
            width: width,
            height: height
        };

        page.open(getFileUrl(pageUrl), function (status) {
            if (status === "success") {
                setTimeout(function () {
                    renderPage(page, function (image) {
                        successCallback(image, errorneousResources);
                    }, handleError);
                }, 200);
            } else {
                handleError();
            }
        });
    };

    module.renderer.getImageForPageUrl = module.renderer.phantomjsRenderer;
    return module;
}(window.csscritic || {}));

window.csscritic = (function (module, fs) {
    module.storage = module.storage || {};
    module.filestorage = {};

    module.filestorage.options = {
        basePath: "./"
    };

    var filePathForKey = function (key) {
        return module.filestorage.options.basePath + key + ".json";
    };

    module.filestorage.storeReferenceImage = function (key, pageImage) {
        var uri, dataObj;

        uri = module.util.getDataURIForImage(pageImage);
        dataObj = {
            referenceImageUri: uri
        };

        fs.write(filePathForKey(key), JSON.stringify(dataObj), "w");
    };

    module.filestorage.readReferenceImage = function (key, successCallback, errorCallback) {
        var filePath = filePathForKey(key),
            dataObjString, dataObj;

        if (! fs.exists(filePath)) {
            errorCallback();
            return;
        }

        dataObjString = fs.read(filePath);
        try {
            dataObj = JSON.parse(dataObjString);
        } catch (e) {
            errorCallback();
            return;
        }

        if (dataObj.referenceImageUri) {
            module.util.getImageForUrl(dataObj.referenceImageUri, function (img) {
                successCallback(img);
            }, errorCallback);
        } else {
            errorCallback();
            return;
        }
    };

    module.storage.options = module.filestorage.options;
    module.storage.storeReferenceImage = module.filestorage.storeReferenceImage;
    module.storage.readReferenceImage = module.filestorage.readReferenceImage;
    return module;
}(window.csscritic || {}, require("fs")));

window.csscritic = (function (module, renderer, storage, window, imagediff) {
    var reporters, testCases, proxyUrl;

    var clear = function () {
        reporters = [];
        testCases = [];
        proxyUrl = null;
    };

    clear();

    module.setProxy = function (newProxyUrl) {
        proxyUrl = newProxyUrl;
    };

    var buildReportResult = function (status, pageUrl, pageImage, referenceImage, erroneousPageUrls) {
        var result = {
                status: status,
                pageUrl: pageUrl,
                pageImage: pageImage
            };

        if (pageImage) {
            result.resizePageImage = function (width, height, callback) {
                renderer.getImageForPageUrl(pageUrl, width, height, proxyUrl, function (image) {
                    result.pageImage = image;
                    callback(image);
                });
            };
            result.acceptPage = function () {
                storage.storeReferenceImage(pageUrl, result.pageImage);
            };
        }

        if (referenceImage) {
            result.referenceImage = referenceImage;
        }

        if (erroneousPageUrls && erroneousPageUrls.length) {
            result.erroneousPageUrls = erroneousPageUrls;
        }

        return result;
    };

    var reportComparisonStarting = function (testCases, callback) {
        module.util.map(testCases, function (pageUrl, finishTestCase) {
            module.util.map(reporters, function (reporter, finishReporter) {
                if (reporter.reportComparisonStarting) {
                    reporter.reportComparisonStarting({pageUrl: pageUrl}, finishReporter);
                } else {
                    finishReporter();
                }
            }, finishTestCase);
        }, callback);
    };

    var reportComparison = function (status, pageUrl, pageImage, referenceImage, erroneousUrls, callback) {
        var i, result,
            finishedReporterCount = 0,
            reporterCount = reporters.length,
            finishUp = function () {
                finishedReporterCount += 1;
                if (finishedReporterCount === reporterCount) {
                    callback();
                }
            };

        if (!reporterCount) {
            callback();
            return;
        }

        result = buildReportResult(status, pageUrl, pageImage, referenceImage, erroneousUrls);

        for (i = 0; i < reporterCount; i++) {
            reporters[i].reportComparison(result, finishUp);
        }
    };

    var reportTestSuite = function (passed, callback) {
        module.util.map(reporters, function (reporter, finish) {
            if (reporter.report) {
                reporter.report({success: passed}, finish);
            } else {
                finish();
            }
        }, callback);
    };

    module.addReporter = function (reporter) {
        reporters.push(reporter);
    };

    module.clearReporters = function () {
        reporters = [];
    };

    var workaroundFirefoxResourcesSporadicallyMissing = function (htmlImage, referenceImage) {
        if (referenceImage) {
            // This does nothing meaningful for us, but seems to trigger Firefox to load any missing resources.
            imagediff.diff(htmlImage, referenceImage);
        }
    };

    var loadPageAndReportResult = function (pageUrl, pageWidth, pageHeight, referenceImage, callback) {

        renderer.getImageForPageUrl(pageUrl, pageWidth, pageHeight, proxyUrl, function (htmlImage, erroneousUrls) {
            var isEqual, textualStatus;

            workaroundFirefoxResourcesSporadicallyMissing(htmlImage, referenceImage);

            module.util.workAroundTransparencyIssueInFirefox(htmlImage, function (adaptedHtmlImage) {
                if (referenceImage) {
                    isEqual = imagediff.equal(adaptedHtmlImage, referenceImage);
                    textualStatus = isEqual ? "passed" : "failed";
                } else {
                    textualStatus = "referenceMissing";
                }

                reportComparison(textualStatus, pageUrl, htmlImage, referenceImage, erroneousUrls, function () {
                    if (callback) {
                        callback(textualStatus);
                    }
                });
            });
        }, function () {
            var textualStatus = "error";

            reportComparison(textualStatus, pageUrl, null, null, null, function () {
                if (callback) {
                    callback(textualStatus);
                }
            });
        });
    };

    module.compare = function (pageUrl, callback) {
        storage.readReferenceImage(pageUrl, function (referenceImage) {
            loadPageAndReportResult(pageUrl, referenceImage.width, referenceImage.height, referenceImage, callback);
        }, function () {
            loadPageAndReportResult(pageUrl, 800, 600, null, callback);
        });
    };

    module.add = function (pageUrl) {
        testCases.push(pageUrl);
    };

    module.execute = function (callback) {
        reportComparisonStarting(testCases, function () {

            module.util.map(testCases, function (pageUrl, finish) {
                module.compare(pageUrl, function (status) {
                    finish(status === "passed");
                });
            }, function (results) {
                var allPassed = results.indexOf(false) === -1;

                reportTestSuite(allPassed, function () {
                    if (callback) {
                        callback(allPassed);
                    }
                });
            });
        });
    };

    module.clear = clear;

    return module;
}(window.csscritic || {}, window.csscritic.renderer, window.csscritic.storage, window, imagediff));

window.csscritic = (function (module, rasterizeHTMLInline, JsSHA) {

    module.signOffReporterUtil = {};

    var getFileUrl = function (address) {
        var fs;

        if (window.require) {
            fs = require("fs");

            return address.indexOf("://") === -1 ? "file://" + fs.absolute(address) : address;
        } else {
            return address;
        }
    };

    module.signOffReporterUtil.loadFullDocument = function (pageUrl, callback) {
        var absolutePageUrl = getFileUrl(pageUrl),
            doc = window.document.implementation.createHTMLDocument("");

        // TODO remove reference to rasterizeHTMLInline.util
        rasterizeHTMLInline.util.ajax(absolutePageUrl, {cache: false}, function (content) {
            doc.documentElement.innerHTML = content;

            rasterizeHTMLInline.inlineReferences(doc, {baseUrl: absolutePageUrl, cache: false}, function () {
                callback('<html>' +
                    doc.documentElement.innerHTML +
                    '</html>');
            });
        }, function () {
            console.log("Error loading document for sign-off: " + pageUrl + ". For accessing URLs over HTTP you need CORS enabled on that server.");
        });
    };

    module.signOffReporterUtil.loadFingerprintJson = function (url, callback) {
        var absoluteUrl = getFileUrl(url);

        rasterizeHTMLInline.util.ajax(absoluteUrl, {cache: false}, function (content) {
            callback(JSON.parse(content));
        });
    };

    module.signOffReporterUtil.calculateFingerprint = function (content) {
        var shaObj = new JsSHA(content, "TEXT");

        return shaObj.getHash("SHA-224", "HEX");
    };

    var calculateFingerprintForPage = function (pageUrl, callback) {
        module.signOffReporterUtil.loadFullDocument(pageUrl, function (content) {
            var actualFingerprint = module.signOffReporterUtil.calculateFingerprint(content);

            callback(actualFingerprint);
        });
    };

    var findPage = function (pageUrl, signedOffPages) {
        var signedOffPage = null;

        signedOffPages.forEach(function (entry) {
            if (entry.pageUrl === pageUrl) {
                signedOffPage = entry;
            }
        });

        return signedOffPage;
    };

    var acceptSignedOffPage = function (result, signedOffPages, callback) {
        var signedOffPageEntry;

        if (result.status === "failed" || result.status === "referenceMissing") {
            signedOffPageEntry = findPage(result.pageUrl, signedOffPages);

            calculateFingerprintForPage(result.pageUrl, function (actualFingerprint) {
                if (signedOffPageEntry) {
                    if (actualFingerprint === signedOffPageEntry.fingerprint) {
                        console.log("Generating reference image for " + result.pageUrl);
                        result.acceptPage();
                    } else {
                        console.log("Fingerprint does not match for " + result.pageUrl + ", current fingerprint " + actualFingerprint);
                    }
                } else {
                    console.log("No sign-off for " + result.pageUrl + ", current fingerprint " + actualFingerprint);
                }

                if (callback) {
                    callback();
                }
            });
        } else {
            if (callback) {
                callback();
            }
        }
    };

    module.SignOffReporter = function (signedOffPages) {
        return {
            reportComparison: function (result, callback) {
                if (! Array.isArray(signedOffPages)) {
                    module.signOffReporterUtil.loadFingerprintJson(signedOffPages, function (json) {
                        acceptSignedOffPage(result, json, callback);
                    });
                } else {
                    acceptSignedOffPage(result, signedOffPages, callback);
                }
            }
        };
    };

    return module;
}(window.csscritic || {}, rasterizeHTMLInline, jsSHA));

window.csscritic = (function (module, console) {

    var ATTRIBUTES_TO_ANSI = {
            "off": 0,
            "bold": 1,
            "red": 31,
            "green": 32
        };

    var inColor = function (string, color) {
        var color_attributes = color && color.split("+"),
            ansi_string = "";

        if (!color_attributes) {
            return string;
        }

        color_attributes.forEach(function (colorAttr) {
            ansi_string += "\033[" + ATTRIBUTES_TO_ANSI[colorAttr] + "m";
        });
        ansi_string += string + "\033[" + ATTRIBUTES_TO_ANSI['off'] + "m";

        return ansi_string;
    };

    var statusColor = {
            passed: "green+bold",
            failed: "red+bold",
            error: "red+bold",
            referenceMissing: "red+bold"
        };

    var reportComparison = function (result, callback) {
        var color = statusColor[result.status] || "",
            statusStr = inColor(result.status, color);
        if (result.erroneousPageUrls) {
            console.log(inColor("Error(s) loading " + result.pageUrl + ":", "red"));
            result.erroneousPageUrls.forEach(function (msg) {
                console.log(inColor("  " + msg, "red+bold"));
            });
        }

        console.log("Testing " + result.pageUrl + "... " + statusStr);

        if (callback) {
            callback();
        }
    };

    module.TerminalReporter = function () {
        return {
            reportComparison: reportComparison
        };
    };

    return module;
}(window.csscritic || {}, window.console));

window.csscritic = (function (module, webpage) {

    var reportComparison = function (result, basePath, callback) {
        var imagesToWrite = [];

        if (result.status !== "error") {
            imagesToWrite.push({
                imageUrl: result.pageImage.src,
                width: result.pageImage.width,
                height: result.pageImage.height,
                target: basePath + getTargetBaseName(result.pageUrl) + ".png"
            });
        }
        if (result.status === "failed") {
            imagesToWrite.push({
                imageUrl: result.referenceImage.src,
                width: result.referenceImage.width,
                height: result.referenceImage.height,
                target: basePath + getTargetBaseName(result.pageUrl) + ".reference.png"
            });
            imagesToWrite.push({
                imageUrl: getDifferenceCanvas(result.pageImage, result.referenceImage).toDataURL('image/png'),
                width: result.referenceImage.width,
                height: result.referenceImage.height,
                target: basePath + getTargetBaseName(result.pageUrl) + ".diff.png"
            });
        }

        renderUrlsToFile(imagesToWrite, function () {
            if (callback) {
                callback();
            }
        });
    };

    var compileReport = function (results, basePath, callback) {
        var fs = require("fs"),
            content = results.success ? "Passed" : "Failed",
            document = "<html><body>" + content + "</body></html>";

        fs.write(basePath + "index.html", document, "w");
        callback();
    };

    var getTargetBaseName = function (filePath) {
        var fileName = filePath.substr(filePath.lastIndexOf("/")+1),
            stripEnding = ".html";

        if (fileName.substr(fileName.length - stripEnding.length) === stripEnding) {
            fileName = fileName.substr(0, fileName.length - stripEnding.length);
        }
        return fileName;
    };

    var renderUrlsToFile = function (entrys, callback) {
        var urlsWritten = 0;

        if (entrys.length === 0) {
            callback();
            return;
        }

        entrys.forEach(function (entry) {
            renderUrlToFile(entry.imageUrl, entry.target, entry.width, entry.height, function () {
                urlsWritten += 1;

                if (entrys.length === urlsWritten) {
                    callback();
                }
            });
        });
    };

    var renderUrlToFile = function (url, filePath, width, height, callback) {
        var page = webpage.create();

        page.viewportSize = {
            width: width,
            height: height
        };

        page.open(url, function () {
            page.render(filePath);

            callback();
        });
    };

    var getDifferenceCanvas = function (imageA, imageB) {
        var differenceImageData = imagediff.diff(imageA, imageB),
            canvas = document.createElement("canvas"),
            context;

        canvas.height = differenceImageData.height;
        canvas.width  = differenceImageData.width;

        context = canvas.getContext("2d");
        context.putImageData(differenceImageData, 0, 0);

        return canvas;
    };

    module.HtmlFileReporter = function (basePath) {
        basePath = basePath || "./";

        if (basePath[basePath.length - 1] !== '/') {
            basePath += '/';
        }

        return {
            reportComparison: function (result, callback) {
                return reportComparison(result, basePath, callback);
            },
            report: function (results, callback) {
                return compileReport(results, basePath, callback);
            }
        };
    };

    return module;
}(window.csscritic || {}, require("webpage")));

window.csscritic = (function (module) {
    var system = require("system");

    module.phantomjsRunner = {};

    var parseArguments = function (args) {
        var i = 0,
            arg, value,
            parsedArguments = {
                opts: {},
                args: []
            };

        var getFollowingValue = function (args, i) {
            if (i + 1 >= args.length) {
                throw new Error("Invalid arguments");
            }
            return args[i+1];
        };

        while(i < args.length) {
            if (args[i].substr(0, 2) === "--") {
                if (args[i].indexOf('=') >= 0) {
                    arg = args[i].substring(0, args[i].indexOf('='));
                    value = args[i].substring(args[i].indexOf('=') + 1, args[i].length);
                } else {
                    arg = args[i];
                    value = getFollowingValue(args, i);

                    i += 1;
                }

                parsedArguments.opts[arg] = value;
            } else if (args[i][0] === "-") {
                arg = args[i];
                parsedArguments.opts[arg] = getFollowingValue(args, i);

                i += 1;
            } else {
                arg = args[i];
                parsedArguments.args.push(arg);
            }
            i += 1;
        }

        return parsedArguments;
    };

    var runCompare = function (testDocuments, signedOffPages, logToPath, doneHandler) {
        signedOffPages = signedOffPages || [];

        csscritic.addReporter(csscritic.SignOffReporter(signedOffPages));
        csscritic.addReporter(csscritic.TerminalReporter());
        if (logToPath) {
            csscritic.addReporter(csscritic.HtmlFileReporter(logToPath));
        }

        testDocuments.forEach(function (testDocument) {
            csscritic.add(testDocument);
        });

        csscritic.execute(doneHandler);
    };

    module.phantomjsRunner.main = function () {
        var parsedArguments = parseArguments(system.args.slice(1)),
            signedOffPages = parsedArguments.opts['-f'],
            logToPath = parsedArguments.opts['--log'];

        if (parsedArguments.args.length < 1) {
            console.log("CSS critic regression runner for PhantomJS");
            console.log("Usage: phantomjs-regressionrunner.js [-f SIGNED_OFF.json] [--log PATH] A_DOCUMENT.html [ANOTHER_DOCUMENT.html ...]");
            phantom.exit(2);
        } else {
            runCompare(parsedArguments.args, signedOffPages, logToPath, function (passed) {
                var ret = passed ? 0 : 1;

                phantom.exit(ret);
            });
        }
    };

    return module;
}(window.csscritic || {}));

csscritic.phantomjsRunner.main();
