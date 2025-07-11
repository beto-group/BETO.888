



# ViewComponent

```jsx
const { useState, useEffect } = dc;

function loadScript(src, onload, onerror) {
  const script = document.createElement("script");
  script.src = src;
  script.async = true;
  script.onload = onload;
  script.onerror =
    onerror ||
    function () {
      console.error(`Failed to load script: ${src}`);
    };
  document.body.appendChild(script);
  return script;
}

function View() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Redirect ExampleList.json → CDN
    const origFetch = window.fetch.bind(window);
    window.fetch = (input, opts) => {
      if (typeof input === "string" && input.endsWith("js/ExampleList.json")) {
        input = "https://tonejs.github.io/examples/js/ExampleList.json";
      }
      return origFetch(input, opts);
    };

    // 1) webcomponents polyfill
    if (!window.customElements.get("webcomponents-bundle.js")) {
      loadScript(
        "https://cdnjs.cloudflare.com/ajax/libs/webcomponentsjs/2.4.3/webcomponents-bundle.js"
      );
    }

    // 2) Material Icons
    if (!document.querySelector("link[href*='Material+Icons']")) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href =
        "https://fonts.googleapis.com/css?family=Material+Icons&display=block";
      document.head.appendChild(link);
    }

    // 3) Tone.js + tone-ui + components
    function loadAll() {
      loadScript("https://unpkg.com/tone", () => {
        // tone-ui.js
        if (!window.drawer) {
          loadScript(
            "https://tonejs.github.io/examples/js/tone-ui.js",
            () => {
              // components.js
              if (!window.customElements.get("tone-play-toggle")) {
                loadScript(
                  "https://tonejs.github.io/examples/js/components.js",
                  () => setReady(true)
                );
              } else {
                setReady(true);
              }
            }
          );
        } else if (!window.customElements.get("tone-play-toggle")) {
          loadScript(
            "https://tonejs.github.io/examples/js/components.js",
            () => setReady(true)
          );
        } else {
          setReady(true);
        }
      });
    }

    loadAll();
  }, []);

  useEffect(() => {
    if (!ready) return;

    // unlock on first user interaction
    async function unlock() {
      await Tone.start();
    }

    // build Tone graph
    const drumCompress = new Tone.Compressor({
      threshold: -30,
      ratio: 10,
      attack: 0.01,
      release: 0.2,
    }).toDestination();
    const distortion = new Tone.Distortion({ distortion: 0.4, wet: 0.4 });

    // hats loop
    const hats = new Tone.Player({
      url: "https://tonejs.github.io/audio/drum-samples/CR78/hihat.mp3",
      volume: -10,
      fadeOut: 0.01,
    }).chain(distortion, drumCompress);
    const hatsLoop = new Tone.Loop((time) => {
      hats.start(time).stop(time + 0.05);
    }, "16n").start("1m");
    hatsLoop.probability = 0.8;

    // snare sequence
    const snare = new Tone.Player({
      url: "https://tonejs.github.io/audio/drum-samples/CR78/snare.mp3",
      fadeOut: 0.1,
    }).chain(distortion, drumCompress);
    new Tone.Sequence(
      (time, vel) => {
        snare.volume.value = Tone.gainToDb(vel);
        snare.start(time).stop(time + 0.1);
      },
      [null, 1, null, [1, 0.3]],
      "4n"
    ).start(0);

    // kick sequence
    const kick = new Tone.MembraneSynth({
      pitchDecay: 0.02,
      octaves: 6,
      oscillator: { type: "square4" },
      envelope: { attack: 0.001, decay: 0.2, sustain: 0 },
    }).connect(drumCompress);
    new Tone.Sequence(
      (time, prob) => {
        if (Math.random() < prob) kick.triggerAttack("C1", time);
      },
      [1, [1, [null, 0.3]], 1, [1, [null, 0.5]], 1, 1, 1, [1, [null, 0.8]]],
      "2n"
    ).start(0);

    // bass part
    const bass = new Tone.FMSynth({
      harmonicity: 1,
      modulationIndex: 3.5,
      oscillator: { type: "custom", partials: [0, 1, 0, 2] },
      envelope: { attack: 0.08, decay: 0.3, sustain: 0 },
      modulation: { type: "square" },
      modulationEnvelope: {
        attack: 0.1,
        decay: 0.2,
        sustain: 0.3,
        release: 0.01,
      },
    }).toDestination();
    const bassPart = new Tone.Part(
      (time, e) => {
        if (Math.random() < e.prob) {
          bass.triggerAttackRelease(e.note, e.dur, time);
        }
      },
      [
        { time: "0:0", note: "C2", dur: "4n.", prob: 1 },
        { time: "0:2", note: "C2", dur: "8n", prob: 0.6 },
        { time: "0:2.6666", note: "C2", dur: "8n", prob: 0.4 },
        { time: "0:3.3333", note: "C2", dur: "8n", prob: 0.9 },
        // …etc…
      ],
      "0:0"
    );
    bassPart.loop = true;
    bassPart.loopEnd = "4m";
    bassPart.start(0);

    // synth + transport
    const synth = new Tone.DuoSynth({ /* your settings */ }).toDestination();
    const synthNotes = [
      "C2", "E2", "G2", "A2",
      "C3", "D3", "E3", "G3", "A3", "B3",
      "C4", "D4", "E4", "G4", "A4", "B4", "C5"
    ];
    Tone.Transport.bpm.value = 125;

    function move({ x, y }) {
      const note = synthNotes[Math.round(x * (synthNotes.length - 1))];
      synth.setNote(note);
      synth.vibratoAmount.value = y;
    }
    function triggerAttack({ x, y }) {
      const note = synthNotes[Math.round(x * (synthNotes.length - 1))];
      synth.triggerAttack(note);
      synth.vibratoAmount.value = y;
    }

    // drawer UI
    const drwr = drawer({ parent: document.querySelector("#content"), open: false });
    drwr
      .folder({ name: "Drums" })
      .add({ tone: hats, name: "Hats" })
      .add({ tone: kick, name: "Kick" })
      .add({ tone: snare, name: "Snare" })
      .add({ tone: drumCompress, name: "Compressor" })
      .add({ tone: distortion, name: "Distortion" });
    drwr
      .folder({ name: "Synths" })
      .add({ tone: bass, name: "Bass" })
      .add({ tone: synth, name: "Synth" });

    // wire up element events & unlock audio
    document
      .querySelector("tone-play-toggle")
      .addEventListener("start", async () => {
        await unlock();
        Tone.Transport.start();
      });
    document
      .querySelector("tone-play-toggle")
      .addEventListener("stop", () => Tone.Transport.stop());
    document
      .querySelector("tone-slider-pad")
      .addEventListener("move", (e) => move(e.detail));
    document
      .querySelector("tone-slider-pad")
      .addEventListener("down", async (e) => {
        await unlock();
        triggerAttack(e.detail);
      });
    document
      .querySelector("tone-slider-pad")
      .addEventListener("up", () => synth.triggerRelease());
  }, [ready]);

  return (
    <tone-example>
      <tone-loader />
      <tone-explanation label="Play Along">
        Touch/Mouse and drag to play along with the probabilistic backtrack.
        X = pitch, Y = modulation.
      </tone-explanation>
      <div id="content">
        <tone-play-toggle />
        <tone-slider-pad />
      </div>
    </tone-example>
  );
}

return { View };

```