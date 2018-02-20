const BudioContext = require('budio').Context;
const Note = require('budio').Note;
const Scale = require('budio').Scale;

window.onload = () => {
    const budio = new BudioContext();
    const style = new Style();
    const body = document.body;
    const title = document.getElementById('title');
    let time = budio.now;
    const loop = () => {
        if (time - budio.now < 1.0) {
            console.log(time, budio.now);
            // Less than 1 second queued up, generate more
            style.randomize(budio);
            body.style.background = randomColor();
            title.innerHTML = style.key.note + ' ' + style.scale.name;
            let note = style.key;
            for (let i = 0; i < 40; i++) {
                [note, time] = style.play(budio, note, time);
            }
            style.key = note;
        }
        setTimeout(loop, 100);
    };
    loop();
};

// Randomizing musical style class
class Style {

    constructor() {
        this.key = randomNote();
    }

    randomize(budio) {
        this.scale = randomScale(this.key);
        this.shape = randomShape(budio);
        this.harmonics = randomHarmonics();
        this.timing = randomTiming();
        this.flow = Math.random();
    }

    next(note) {
        let interval = 1 + (3 * Math.pow(Math.random(), this.flow * 2)) | 0;
        if (Math.random() < 0.5) {
            interval = -interval;
        }
        note = this.scale.transpose(note, interval);
        if (note.octave < 3) {
            // Correct for octave being too low
            note = note.toOctave(note.octave + 1);
        }
        if (note.octave > 5) {
            // Correct for octave being too high
            note = note.toOctave(note.octave - 1);
        }
        return note
    }

    play(budio, note, time) {
        const duration = choice(this.timing);
        budio.play(this.hit(budio, note, duration * 1.5), time);
        return [this.next(note), time + duration];
    }

    hit(budio, note, duration) {
        const harmonics = this.harmonics;
        const frequency = note.frequency;
        const vector = budio.silence(duration);
        for (let i = 0; i < harmonics.length; i++) {
            const wave = budio.sin(frequency * (i + 1), duration);
            vector.add(wave.mul(harmonics[i]));
        }
        return vector.mul(this.shape(duration)).mul(0.01);
    }

}


// Generate a random note
const randomNote = () => new Note(choice(Note.NOTES));

// Generate a random scale
const randomScale = key => {
    const scales = [
        'major',
        'minor',
        'wholetone',
        'japanese',
        'augmented',
        'augmented fifth',
        'diminished',
        'blues major',
        'blues minor',
        'harmonic minor',
        'pentatonic minor',
        'pentatonic major',
    ];
    return new Scale(key, choice(scales));
};

// Generate a random hit shape
const randomShape = budio => {
    const choices = [
        duration => {
            const shape = budio.range(duration);
            shape.div(shape.length);
            shape.map(x => 4 * Math.pow(x, 0.5) - 4 * x);
            return shape;
        },
        duration => {
            const shape = budio.range(duration);
            shape.div(shape.length);
            shape.map(x => 3.53 * Math.pow(x, 0.227) - 3.53 * Math.pow(x, 0.5));
            return shape;
        },
        duration => {
            const shape = budio.range(duration);
            shape.div(shape.length);
            shape.map(x => 1.716 * Math.pow(x, 0.5) - 1.716 * Math.pow(x, 3));
            return shape;
        }
    ];
    if (Math.random() < 0.1) {
        // This one isn't always an option
        choices.push(duration => {
            const shape = budio.range(duration);
            shape.mul(7 * Math.PI / budio.rate);
            return shape.sin().abs().mul(0.75).add(0.25);
        });
    }
    return choice(choices);
};

// Generate random harmonic components
const randomHarmonics = () => {
    const harmonics = [];
    for (let i = 0; i < 10; i++) {
        harmonics.push(Math.random());
    }
    return harmonics;
};

// Generate random timing components
const randomTiming = () => {
    const timing = [];
    const speed = (Math.random() * 0.3) / 2 + 0.075;
    const options = [speed, speed * 2, speed * 2, speed * 4];
    for (let i = 0; i < 7; i++) {
        timing.push(choice(options));
    }
    return timing;
};

// Pick a random value from an array
const choice = array => {
    return array[Math.random() * array.length | 0];
};

const randomColor = () => {
    const r = Math.random() * 256 | 0;
    const g = Math.random() * 256 | 0;
    const b = Math.random() * 256 | 0;
    return 'rgb(' + r + ',' + g + ',' + b + ')';
};