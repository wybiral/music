require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
const Vector = require('./vector');

module.exports = class Context {

    constructor() {
        const audioContext = new AudioContext();
        this.audioContext = audioContext;
        this.node = audioContext.createGain();
        this.node.connect(audioContext.destination);
    }

    get now() {
        return this.audioContext.currentTime;
    }

    get rate() {
        return this.audioContext.sampleRate;
    }

    createNode(vector) {
        const audioContext = this.audioContext;
        const array = vector.array;
        const length = array.length;
        const buffer = audioContext.createBuffer(1, length, this.rate);
        const data = buffer.getChannelData(0);
        data.set(array);
        const node = audioContext.createBufferSource();
        node.buffer = buffer;
        return node;
    }

    play(vector, when) {
        if (typeof when === 'undefined') {
            when = this.now;
        }
        const node = this.createNode(vector);
        node.connect(this.node);
        node.start(when);
    }

    silence(duration) {
        const rate = this.rate;
        const length = (duration * rate) | 0;
        const array = new Float32Array(length);
        return new Vector(this, array);
    }

    range(duration) {
        return this.silence(duration).map((x, i) => i);
    }

    seconds(duration) {
        const rate = this.rate;
        return this.silence(duration).map((x, i) => i / rate);
    }

    sin(frequency, duration) {
        const factor = Math.PI * 2 * frequency;
        return this.seconds(duration).mul(factor).sin();
    }

    saw(frequency, duration) {
        const period = Math.floor(this.rate / frequency);
        const vector = this.silence(duration);
        vector.map((x, i) => {
            return ((i % period) / period) * 2 - 1;
        });
        return vector;
    }

    square(frequency, duration) {
        const period = Math.floor(this.rate / frequency);
        const halfPeriod = (period / 2) | 0;
        const vector = this.silence(duration);
        vector.map((x, i) => {
            return (i % period) < halfPeriod ? -1 : 1;
        });
        return vector;
    }

    triangle(frequency, duration) {
        const period = Math.floor(this.rate / frequency);
        const hp = Math.floor(period / 2);
        const vector = this.silence(duration);
        vector.map((x, i) => {
            return ((hp - Math.abs(i % period - hp)) / hp) * 2 - 1;
        });
        return vector;
    }

};

},{"./vector":4}],2:[function(require,module,exports){
class Note {

    constructor(note) {
        if (typeof note === 'string') {
            note = parseNote(note);
        }
        this.index = note;
    }

    toString() {
        return this.note + this.octave;
    }

    get note() {
        return Note.NOTES[this.noteIndex];
    }

    get noteIndex() {
        return this.index % 12;
    }

    get octave() {
        return Math.floor(this.index / 12);
    }

    get frequency() {
        const C0 = 16.35159783128741;
        return C0 * Math.pow(2.0, this.index / 12.0);
    }

    transpose(delta) {
        return new Note(this.index + delta);
    }

    toOctave(octave) {
        return new Note(this.noteIndex + 12 * octave);
    }

};
module.exports = Note;

Note.NOTES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];

const parseNote = note => {
    let octave = 4;
    note = note.trim().toUpperCase();
    // Parse octave
    if (!isNaN(parseInt(note[note.length - 1]))) {
        octave = parseInt(note[note.length - 1]);
        note = note.substr(0, note.length - 1);
    }
    let index = Note.NOTES.indexOf(note[0]);
    // Parse accidentals
    for (let i = 1; i < note.length; i++) {
        if (note[i] === '#') {
            index++;
        } else if (note[i] === 'b') {
            index--;
        }
    }
    return (index % 12) + 12 * octave;
};

},{}],3:[function(require,module,exports){
module.exports = class Scale {

    constructor(root, name) {
        this.root = root.toOctave(0);
        this.intervals = SCALES[name.replace('-', '').replace(' ', '')];
        this.name = name;
    }

    get(index) {
        const intervals = this.intervals;
        let note = this.root;
        for (let i = 0; i < index; i++) {
            note = note.transpose(intervals[i % intervals.length]);
        }
        return note;
    }

    index(note) {
        const intervals = this.intervals;
        let i = 0;
        let x = this.root;
        for (; x.index < note.index; i++) {
            x = x.transpose(intervals[i % intervals.length]);
        }
        if (x.index !== note.index) {
            throw new Error('Note not in scale');
        }
        return i;
    }

    transpose(note, interval) {
        return this.get(this.index(note) + interval);
    }

}


const SCALES = {
  'major': [2, 2, 1, 2, 2, 2, 1],
  'minor': [2, 1, 2, 2, 1, 2, 2],
  'melodicminor': [2, 1, 2, 2, 2, 2, 1],
  'harmonicminor': [2, 1, 2, 2, 1, 3, 1],
  'pentatonicmajor': [2, 2, 3, 2, 3],
  'bluesmajor': [3, 2, 1, 1, 2, 3],
  'pentatonicminor': [3, 2, 2, 3, 2],
  'bluesminor': [3, 2, 1, 1, 3, 2],
  'augmented': [3, 1, 3, 1, 3, 1],
  'diminished': [2, 1, 2, 1, 2, 1, 2, 1],
  'chromatic': [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  'wholehalf': [2, 1, 2, 1, 2, 1, 2, 1],
  'halfwhole': [1, 2, 1, 2, 1, 2, 1, 2],
  'wholetone': [2, 2, 2, 2, 2, 2],
  'augmentedfifth': [2, 2, 1, 2, 1, 1, 2, 1],
  'japanese': [1, 4, 2, 1, 4],
  'oriental': [1, 3, 1, 1, 3, 1, 2],
  'ionian': [2, 2, 1, 2, 2, 2, 1],
  'dorian': [2, 1, 2, 2, 2, 1, 2],
  'phrygian': [1, 2, 2, 2, 1, 2, 2],
  'lydian': [2, 2, 2, 1, 2, 2, 1],
  'mixolydian': [2, 2, 1, 2, 2, 1, 2],
  'aeolian': [2, 1, 2, 2, 1, 2, 2],
  'locrian': [1, 2, 2, 1, 2, 2, 2]
}

},{}],4:[function(require,module,exports){
module.exports = class Vector {

    constructor(context, array) {
        this.context = context;
        this.array = array;
    }

    get length() {
        return this.array.length;
    }

    map(fn) {
        const array = this.array;
        const length = array.length;
        for (let i = 0; i < length; i++) {
            array[i] = fn(array[i], i);
        }
        return this;
    }

    map2(that, fn) {
        const a = this.array;
        const b = that.array;
        const length = Math.min(a.length, b.length);
        for (let i = 0; i < length; i++) {
            a[i] = fn(a[i], b[i], i);
        }
        return this;
    }

    add(that) {
        if (typeof that === 'number') {
            return this.map(x => x + that);
        } else {
            return this.map2(that, (x, y) => x + y);
        }
    }

    sub(that) {
        if (typeof that === 'number') {
            return this.map(x => x - that);
        } else {
            return this.map2(that, (x, y) => x - y);
        }
    }

    mul(that) {
        if (typeof that === 'number') {
            return this.map(x => x * that);
        } else {
            return this.map2(that, (x, y) => x * y);
        }
    }

    div(that) {
        if (typeof that === 'number') {
            return this.map(x => x / that);
        } else {
            return this.map2(that, (x, y) => x / y);
        }
    }

    pow(that) {
        if (typeof that === 'number') {
            return this.map(x => Math.pow(x, that));
        } else {
            return this.map2(that, (x, y) => Math.pow(x, y));
        }
    }

    sin() {
        return this.map(Math.sin);
    }

    cos() {
        return this.map(Math.cos);
    }

    sqrt() {
        return this.map(Math.sqrt);
    }

    abs() {
        return this.map(Math.abs);
    }

};

},{}],"budio":[function(require,module,exports){
module.exports = {
    Context: require('./context'),
    Vector: require('./vector'),
    Note: require('./music/note'),
    Scale: require('./music/scale'),
};
},{"./context":1,"./music/note":2,"./music/scale":3,"./vector":4}]},{},[]);
