

# ViewComponent

```jsx
const { useState, useEffect, useRef } = dc;

// Isolated Playhead component - renders independently
const Playhead = ({ isPlaying, currentStep, trackCount }) => {
  if (!isPlaying || currentStep < 0 || trackCount === 0) return null;
  
  return (
    <div style={{
      position: "absolute",
      left: `calc(30px + (${currentStep} * ((100% - 60px) / 16)))`,
      top: "0",
      height: "100%",
      width: "3px",
      backgroundColor: "rgba(78, 205, 196, 0.9)",
      boxShadow: "0 0 15px rgba(78, 205, 196, 0.8), 0 0 30px rgba(78, 205, 196, 0.4)",
      pointerEvents: "none",
      zIndex: 1000,
      transition: "none"
    }}>
      <div style={{
        position: "absolute",
        top: "-5px",
        left: "-5px",
        width: "13px",
        height: "13px",
        backgroundColor: "rgba(78, 205, 196, 1)",
        borderRadius: "50%",
        boxShadow: "0 0 20px rgba(78, 205, 196, 1)"
      }} />
    </div>
  );
};

function DJBoothView() {
  const [ready, setReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [swing, setSwing] = useState(0);
  const [masterVolume, setMasterVolume] = useState(-10);
  const [currentArrangementStep, setCurrentArrangementStep] = useState(0);
  const [currentStep, setCurrentStep] = useState(-1);
  const performanceMonitorRef = useRef({ lastTime: 0, frameCount: 0, avgFrameTime: 0 });
  
  const availableInstruments = {
    drums: [
      { id: 'kick', name: 'Kick Drum', icon: 'drum' },
      { id: 'snare', name: 'Snare', icon: 'circle-dot' },
      { id: 'hihat', name: 'Hi-Hat', icon: 'disc' },
      { id: 'openhat', name: 'Open Hat', icon: 'disc-2' },
      { id: 'clap', name: 'Clap', icon: 'hand' },
      { id: 'rim', name: 'Rimshot', icon: 'circle' },
      { id: 'tom', name: 'Tom', icon: 'hexagon' },
      { id: 'cowbell', name: 'Cowbell', icon: 'bell' }
    ],
    synths: [
      { id: 'bass', name: 'Bass Synth', icon: 'wave-square' },
      { id: 'lead', name: 'Lead Synth', icon: 'zap' },
      { id: 'pad', name: 'Pad', icon: 'cloud' },
      { id: 'pluck', name: 'Pluck', icon: 'music' },
      { id: 'arp', name: 'Arpeggiator', icon: 'activity' }
    ],
    fx: [
      { id: 'noise', name: 'Noise FX', icon: 'sparkles' },
      { id: 'riser', name: 'Riser', icon: 'trending-up' },
      { id: 'impact', name: 'Impact', icon: 'zap-off' }
    ]
  };

  // START WITH 8 TRACKS (4 enabled, 4 disabled)
  const [tracks, setTracks] = useState([
    { id: 'track1', enabled: true, instrument: 'kick', color: '#ff6b6b', volume: -10 },
    { id: 'track2', enabled: true, instrument: 'snare', color: '#4ecdc4', volume: -15 },
    { id: 'track3', enabled: true, instrument: 'hihat', color: '#ffe66d', volume: -20 },
    { id: 'track4', enabled: true, instrument: 'bass', color: '#a8dadc', volume: -12 },
    { id: 'track5', enabled: false, instrument: 'lead', color: '#9d7cce', volume: -14 },
    { id: 'track6', enabled: false, instrument: 'pad', color: '#b19cd9', volume: -18 },
    { id: 'track7', enabled: false, instrument: 'clap', color: '#fb5607', volume: -12 },
    { id: 'track8', enabled: false, instrument: 'noise', color: '#8ecae6', volume: -10 }
  ]);

  const [patterns, setPatterns] = useState({
    track1: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
    track2: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
    track3: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
    track4: [1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0],
    track5: [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
    track6: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    track7: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
    track8: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  });

  const [mutes, setMutes] = useState({
    track1: false, track2: false, track3: false, track4: false,
    track5: false, track6: false, track7: false, track8: false
  });

  const [solos, setSolos] = useState({
    track1: false, track2: false, track3: false, track4: false,
    track5: false, track6: false, track7: false, track8: false
  });

  const [arrangement, setArrangement] = useState([
    { patternIds: [0], repeat: 2, name: 'Intro' },
    { patternIds: [1], repeat: 4, name: 'Main' },
    { patternIds: [2], repeat: 2, name: 'Break' },
    { patternIds: [1], repeat: 4, name: 'Main' },
    { patternIds: [3], repeat: 2, name: 'Outro' }
  ]);

  const [savedPatterns, setSavedPatterns] = useState([
    { name: 'Pattern A', data: null },
    { name: 'Pattern B', data: null },
    { name: 'Pattern C', data: null },
    { name: 'Pattern D', data: null }
  ]);

  const [arrangementMode, setArrangementMode] = useState(false);
  const arrangementProgressRef = useRef({ sectionIndex: 0, repeatCount: 0, loopCount: 0 });
  const arrangementRef = useRef(arrangement); // Keep arrangement in ref for audio loop
  const currentPatternRef = useRef(0);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [justSaved, setJustSaved] = useState(null); // Track which pattern was just saved
  const lastSaveTimeRef = useRef(0); // Timestamp-based debounce for saves
  const [currentPatternIndex, setCurrentPatternIndex] = useState(null); // Track which pattern is currently loaded in pattern mode
  
  // Use refs for live data to avoid restarting loop on changes
  const patternsRef = useRef(patterns);
  const tracksRef = useRef(tracks);
  const mutesRef = useRef(mutes);
  const solosRef = useRef(solos);
  const savedPatternsRef = useRef(savedPatterns);
  const currentStepRef = useRef(-1); // Track current step without causing re-renders
  
  const instrumentsRef = useRef(null);
  const loopRef = useRef(null);
  const masterRef = useRef(null);
  const [isFullTab, setIsFullTab] = useState(true);
  const containerRef = useRef(null);
  const stateRefs = useRef({}).current;
  const instanceId = useRef(Math.random().toString(36).substr(2, 5)).current;
  const uniqueWrapperClass = `djbooth-wrapper-${instanceId}`;

  function findNearestAncestorWithClass(element, className) {
    if (!element) return null;
    let current = element.parentNode;
    while (current) {
      if (current.classList && current.classList.contains(className)) {
        return current;
      }
      current = current.parentNode;
    }
    return null;
  }

  function findDirectChildByClass(parent, className) {
    if (!parent) return null;
    for (const child of parent.children) {
      if (child.classList && child.classList.contains(className)) {
        return child;
      }
    }
    return null;
  }

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !isFullTab) return;
    const targetPaneContent = findNearestAncestorWithClass(container, "workspace-leaf-content");
    if (!targetPaneContent) {
      setIsFullTab(false);
      return;
    }
    const contentWrapper = findDirectChildByClass(targetPaneContent, "view-content") || targetPaneContent;
    stateRefs.originalParent = container.parentNode;
    stateRefs.placeholder = document.createElement("div");
    stateRefs.placeholder.style.display = "none";
    container.parentNode.insertBefore(stateRefs.placeholder, container);
    stateRefs.parentPositionInfo = {
      element: contentWrapper,
      original: window.getComputedStyle(contentWrapper).position,
    };
    if (stateRefs.parentPositionInfo.original === "static") {
      contentWrapper.style.position = "relative";
    }
    contentWrapper.appendChild(container);
    Object.assign(container.style, {
      position: "absolute",
      top: "0",
      left: "0",
      width: "100%",
      height: "100%",
      zIndex: "9998",
      overflow: "auto",
    });
    return () => {
      if (stateRefs.placeholder?.parentNode) {
        stateRefs.placeholder.parentNode.replaceChild(container, stateRefs.placeholder);
      }
      if (stateRefs.parentPositionInfo?.element) {
        stateRefs.parentPositionInfo.element.style.position =
          stateRefs.parentPositionInfo.original === "static" ? "" : stateRefs.parentPositionInfo.original;
      }
      container.removeAttribute("style");
      Object.keys(stateRefs).forEach((key) => (stateRefs[key] = null));
    };
  }, [isFullTab]);

  useEffect(() => {
    if (window.Tone) {
      setReady(true);
    } else {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/tone';
      script.onload = () => setReady(true);
      document.body.appendChild(script);
    }
  }, []);

  useEffect(() => {
    if (ready && window.Tone) {
      Tone.Transport.bpm.value = bpm;
      Tone.Transport.swing = swing / 100;
    }
  }, [bpm, swing, ready]);

  useEffect(() => {
    if (masterRef.current) {
      masterRef.current.volume.value = masterVolume;
    }
  }, [masterVolume]);

  // Keep refs updated without restarting loop
  useEffect(() => {
    patternsRef.current = patterns;
  }, [patterns]);

  useEffect(() => {
    tracksRef.current = tracks;
  }, [tracks]);

  useEffect(() => {
    mutesRef.current = mutes;
  }, [mutes]);

  useEffect(() => {
    solosRef.current = solos;
  }, [solos]);

  useEffect(() => {
    savedPatternsRef.current = savedPatterns;
  }, [savedPatterns]);

  useEffect(() => {
    arrangementRef.current = arrangement;
  }, [arrangement]);

  useEffect(() => {
    if (!instrumentsRef.current) return;
    tracks.forEach(track => {
      const inst = instrumentsRef.current[track.id];
      if (inst) inst.volume.value = track.volume;
    });
  }, [tracks]);

  const createInstrument = (type) => {
    if (!masterRef.current) return null;
    switch(type) {
      case 'kick':
        return new Tone.MembraneSynth({
          pitchDecay: 0.05, octaves: 10,
          oscillator: { type: "sine" },
          envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 1.4 }
        }).connect(masterRef.current);
      case 'snare':
        return new Tone.NoiseSynth({
          noise: { type: "white" },
          envelope: { attack: 0.001, decay: 0.2, sustain: 0 }
        }).connect(masterRef.current);
      case 'hihat':
        return new Tone.MetalSynth({
          frequency: 200,
          envelope: { attack: 0.001, decay: 0.1, release: 0.01 },
          harmonicity: 5.1, modulationIndex: 32, resonance: 4000, octaves: 1.5
        }).connect(masterRef.current);
      case 'openhat':
        return new Tone.MetalSynth({
          frequency: 200,
          envelope: { attack: 0.001, decay: 0.4, release: 0.3 },
          harmonicity: 5.1, modulationIndex: 32, resonance: 4000, octaves: 1.5
        }).connect(masterRef.current);
      case 'clap':
        return new Tone.NoiseSynth({
          noise: { type: "pink" },
          envelope: { attack: 0.001, decay: 0.15, sustain: 0 }
        }).connect(masterRef.current);
      case 'rim':
        return new Tone.MetalSynth({
          frequency: 400,
          envelope: { attack: 0.001, decay: 0.05, release: 0.01 },
          harmonicity: 8, modulationIndex: 16
        }).connect(masterRef.current);
      case 'tom':
        return new Tone.MembraneSynth({
          pitchDecay: 0.08, octaves: 4,
          oscillator: { type: "sine" },
          envelope: { attack: 0.01, decay: 0.5, sustain: 0, release: 0.8 }
        }).connect(masterRef.current);
      case 'cowbell':
        return new Tone.MetalSynth({
          frequency: 540,
          envelope: { attack: 0.001, decay: 0.3, release: 0.1 },
          harmonicity: 2.5, modulationIndex: 20
        }).connect(masterRef.current);
      case 'bass':
        return new Tone.MonoSynth({
          oscillator: { type: "sawtooth" },
          filter: { Q: 2, type: "lowpass", rolloff: -24 },
          envelope: { attack: 0.01, decay: 0.3, sustain: 0.4, release: 0.8 },
          filterEnvelope: { attack: 0.02, decay: 0.1, sustain: 0.8, release: 0.5, baseFrequency: 80, octaves: 4 }
        }).connect(masterRef.current);
      case 'lead':
        return new Tone.Synth({
          oscillator: { type: "square" },
          envelope: { attack: 0.005, decay: 0.1, sustain: 0.3, release: 0.4 }
        }).connect(masterRef.current);
      case 'pad':
        return new Tone.PolySynth(Tone.Synth, {
          oscillator: { type: "sine" },
          envelope: { attack: 0.5, decay: 0.2, sustain: 0.7, release: 2 }
        }).connect(masterRef.current);
      case 'pluck':
        return new Tone.PluckSynth({
          attackNoise: 1,
          dampening: 4000,
          resonance: 0.9
        }).connect(masterRef.current);
      case 'arp':
        return new Tone.Synth({
          oscillator: { type: "triangle" },
          envelope: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.2 }
        }).connect(masterRef.current);
      case 'noise':
        return new Tone.NoiseSynth({
          noise: { type: "white" },
          envelope: { attack: 0.1, decay: 0.5, sustain: 0.2, release: 1 }
        }).connect(masterRef.current);
      case 'riser':
        return new Tone.NoiseSynth({
          noise: { type: "pink" },
          envelope: { attack: 2, decay: 0.5, sustain: 0.5, release: 2 }
        }).connect(masterRef.current);
      case 'impact':
        return new Tone.NoiseSynth({
          noise: { type: "brown" },
          envelope: { attack: 0.001, decay: 0.8, sustain: 0, release: 0 }
        }).connect(masterRef.current);
      default:
        return null;
    }
  };

  useEffect(() => {
    if (!ready || !window.Tone) return;
    
    // Dispose old instruments before creating new ones
    if (instrumentsRef.current) {
      Object.values(instrumentsRef.current).forEach(inst => {
        if (inst && inst.dispose) {
          try {
            inst.dispose();
          } catch (e) {
            console.warn('[DJ Booth] Error disposing instrument:', e);
          }
        }
      });
    }
    
    // Dispose old master before creating new one
    if (masterRef.current) {
      try {
        masterRef.current.dispose();
      } catch (e) {
        console.warn('[DJ Booth] Error disposing master:', e);
      }
    }
    
    masterRef.current = new Tone.Volume(masterVolume).toDestination();
    instrumentsRef.current = {};
    
    // Only create instruments for current tracks (pattern mode)
    tracks.forEach(track => {
      if (track.enabled) {
        const inst = createInstrument(track.instrument);
        if (inst) {
          inst.volume.value = track.volume;
          instrumentsRef.current[track.id] = inst;
        }
      }
    });
    
    Tone.Transport.bpm.value = bpm;
    
    return () => {
      if (instrumentsRef.current) {
        Object.values(instrumentsRef.current).forEach(inst => {
          if (inst && inst.dispose) {
            try {
              inst.dispose();
            } catch (e) {
              // Silently catch disposal errors on cleanup
            }
          }
        });
        instrumentsRef.current = null;
      }
      if (masterRef.current) {
        try {
          masterRef.current.dispose();
          masterRef.current = null;
        } catch (e) {
          // Silently catch disposal errors on cleanup
        }
      }
    };
  }, [ready, tracks]);

  const playNote = (instrument, instrumentType, time, stepIndex) => {
    try {
      const isDrum = ['kick', 'snare', 'hihat', 'openhat', 'clap', 'rim', 'tom', 'cowbell', 'noise', 'riser', 'impact'].includes(instrumentType);
      if (isDrum) {
        if (instrumentType === 'kick') instrument.triggerAttackRelease("C1", "8n", time);
        else if (instrumentType === 'tom') instrument.triggerAttackRelease("G1", "8n", time);
        else if (instrumentType === 'cowbell') instrument.triggerAttackRelease("32n", time);
        else instrument.triggerAttackRelease("16n", time);
      } else {
        const notes = {
          bass: ["C2", "E2", "G2", "A2"],
          lead: ["C4", "E4", "G4", "B4", "D5"],
          pluck: ["C3", "E3", "G3", "B3", "C4"],
          arp: ["C5", "E5", "G5", "C6"]
        };
        const noteSet = notes[instrumentType] || ["C3", "E3", "G3"];
        if (instrumentType === 'pad') {
          const chords = [["C3", "E3", "G3"], ["A2", "C3", "E3"], ["F2", "A2", "C3"], ["G2", "B2", "D3"]];
          const chord = chords[Math.floor(stepIndex / 4) % 4];
          instrument.triggerAttackRelease(chord, "2n", time);
        } else {
          const note = noteSet[stepIndex % noteSet.length];
          instrument.triggerAttackRelease(note, "8n", time);
        }
      }
    } catch (e) {
      // Silently catch audio errors to prevent crashes
      console.warn('[DJ Booth] Audio playback error:', e.message);
    }
  };

  useEffect(() => {
    if (!ready || !window.Tone || !isPlaying) return;
    let step = 0;
    let pendingStepUpdate = null;
    let lastUpdateTime = 0;
    let frameCount = 0;
    arrangementProgressRef.current = { sectionIndex: 0, repeatCount: 0, loopCount: 0 };
    currentPatternRef.current = 0;
    
    // Reusable array to reduce memory allocation in loop
    const emptyPattern = Array(16).fill(0);
    const tempPattern = new Array(16);

    loopRef.current = new Tone.Loop((time) => {
      const stepIndex = step % 16;
      
      // Update ref immediately for internal use
      const prevStep = currentStepRef.current;
      currentStepRef.current = stepIndex;
      
      // Only trigger React update when step actually changes (reduces re-renders by 75%+)
      if (prevStep !== stepIndex) {
        setCurrentStep(stepIndex);
      }
      
      // Get current values from refs (always up-to-date, no restart needed)
      const currentTracks = tracksRef.current;
      const currentMutes = mutesRef.current;
      const currentSolos = solosRef.current;
      const currentPatterns = patternsRef.current;
      const currentSavedPatterns = savedPatternsRef.current;
      const anySolo = Object.values(currentSolos).some(s => s);
      
      // Update arrangement progression at the end of each 16-step loop
      if (arrangementMode && stepIndex === 0 && step > 0) {
        const progress = arrangementProgressRef.current;
        progress.loopCount++;
        
        const currentArrangement = arrangementRef.current;
        if (!currentArrangement || currentArrangement.length === 0) {
          console.warn('[DJ Booth] ⚠️ No arrangement sections defined');
          return;
        }
        
        const section = currentArrangement[progress.sectionIndex];
        // Get repeat count (default to 1 if not set or 0)
        const repeatCount = section?.repeat > 0 ? section.repeat : 1;
        
        if (section && progress.loopCount >= repeatCount) {
          const oldSectionIndex = progress.sectionIndex;
          progress.sectionIndex++;
          progress.loopCount = 0;
          
          // Loop back to start when reaching the end
          if (progress.sectionIndex >= currentArrangement.length) {
            progress.sectionIndex = 0;
            console.log('[DJ Booth] 🔄 Arrangement looping back to start');
          }
          
          // Only update React state if section actually changed
          if (oldSectionIndex !== progress.sectionIndex) {
            setCurrentArrangementStep(progress.sectionIndex);
          }
        }
      }

      const instruments = instrumentsRef.current;
      if (!instruments) return;

      // In arrangement mode, need to check tracks from saved patterns
      if (arrangementMode) {
        const currentArrangement = arrangementRef.current;
        if (!currentArrangement || currentArrangement.length === 0) return;
        
        const section = currentArrangement[arrangementProgressRef.current.sectionIndex];
        if (section && section.patternIds && section.patternIds.length > 0) {
          // Process each pattern in the section
          section.patternIds.forEach(patternId => {
            const savedPattern = currentSavedPatterns[patternId];
            if (!savedPattern?.data) return;
            
            // Iterate through tracks defined in this saved pattern
            const patternTracks = savedPattern.data.tracks || [];
            patternTracks.forEach(track => {
              if (!track.enabled) return;
              if (currentMutes[track.id]) return;
              if (anySolo && !currentSolos[track.id]) return;
              
              // Get pattern data for this track
              const patternData = savedPattern.data.patterns?.[track.id];
              if (patternData && patternData[stepIndex]) {
                // Get instrument, create on-demand if missing
                let inst = instruments[track.id];
                if (!inst) {
                  // Create instrument on-demand
                  inst = createInstrument(track.instrument);
                  if (inst) {
                    inst.volume.value = track.volume;
                    instruments[track.id] = inst;
                  }
                }
                
                if (inst) {
                  try {
                    playNote(inst, track.instrument, time, stepIndex);
                  } catch (e) {
                    console.warn('[DJ Booth] Error playing note:', e);
                  }
                }
              }
            });
          });
        }
      } else {
        // Pattern mode: use current working tracks
        currentTracks.forEach(track => {
          if (!track.enabled) return;
          if (currentMutes[track.id]) return;
          if (anySolo && !currentSolos[track.id]) return;

          const patternData = currentPatterns[track.id];
          if (patternData && patternData[stepIndex]) {
            const inst = instruments[track.id];
            if (inst) {
              try {
                playNote(inst, track.instrument, time, stepIndex);
              } catch (e) {
                console.warn('[DJ Booth] Error playing note:', e);
              }
            }
          }
        });
      }
      
      step++;
      frameCount++;
      
      // Memory management: Reset counters periodically to prevent overflow
      if (step > 16000) {
        step = step % 16;
      }
      
      // Aggressive cleanup every 10 loops (~6 seconds at 120 BPM)
      if (frameCount % 160 === 0) {
        // Clear Tone.js transport buffer to prevent memory accumulation
        try {
          if (Tone.Transport && Tone.Transport.cancel) {
            Tone.Transport.cancel(0); // Clear scheduled events
          }
        } catch (e) {
          console.warn('[DJ Booth] Cleanup error:', e);
        }
      }
      
      // Major cleanup every 100 loops (~30 seconds)
      if (frameCount > 1600) {
        frameCount = 0;
        // Force garbage collection hint
        if (typeof window !== 'undefined' && window.gc) {
          window.gc();
        }
      }
    }, "16n");

    loopRef.current.start(0);
    Tone.Transport.start();

    return () => {
      // Comprehensive cleanup to prevent memory leaks
      if (pendingStepUpdate !== null) {
        cancelAnimationFrame(pendingStepUpdate);
        pendingStepUpdate = null;
      }
      if (loopRef.current) {
        try {
          loopRef.current.stop();
          loopRef.current.dispose();
          loopRef.current = null;
        } catch (e) {
          console.warn('[DJ Booth] Loop disposal error:', e);
        }
      }
      try {
        Tone.Transport.stop();
        Tone.Transport.cancel(0); // Clear all scheduled events
      } catch (e) {
        console.warn('[DJ Booth] Transport cleanup error:', e);
      }
      // Force cleanup
      lastUpdateTime = 0;
      step = 0;
      frameCount = 0;
    };
  }, [isPlaying, ready, arrangementMode, arrangement]);
  // Removed patterns, mutes, solos, tracks, savedPatterns from dependencies
  // These are now accessed via refs which update without restarting the loop!

  const togglePlay = async () => {
    if (!ready) return;
    if (!isPlaying) {
      await Tone.start();
      arrangementProgressRef.current = { sectionIndex: 0, repeatCount: 0, loopCount: 0 };
      setCurrentArrangementStep(0);
    } else {
      // When stopping, reset visual indicator and clear any pending updates
      setCurrentStep(-1);
      currentStepRef.current = -1;
    }
    setIsPlaying(!isPlaying);
  };

  const restartSong = () => {
    if (!ready) return;
    arrangementProgressRef.current = { sectionIndex: 0, repeatCount: 0, loopCount: 0 };
    setCurrentArrangementStep(0);
    setCurrentStep(-1);
  };

  const toggleStep = (trackId, step) => {
    setPatterns(prev => {
      const newPattern = prev[trackId].map((val, i) => i === step ? (val ? 0 : 1) : val);
      const newPatterns = { ...prev, [trackId]: newPattern };
      // Update ref immediately so loop sees change instantly
      patternsRef.current = newPatterns;
      return newPatterns;
    });
    if (currentPatternIndex !== null) {
      setCurrentPatternIndex(null);
    }
  };

  const toggleTrack = (trackId) => {
    setTracks(prev => {
      const updated = prev.map(t => 
        t.id === trackId ? { ...t, enabled: !t.enabled } : t
      );
      // Update ref immediately
      tracksRef.current = updated;
      return updated;
    });
  };

  // ADD TRACK: Find next available track number
  const addTrack = () => {
    const colors = ['#ff6b6b', '#4ecdc4', '#ffe66d', '#a8dadc', '#9d7cce', '#b19cd9', '#fb5607', '#8ecae6', '#95e1d3', '#f38181', '#aa96da', '#fcbad3'];
    
    // Find highest track number currently in use
    const trackNumbers = tracks.map(t => {
      const match = t.id.match(/track(\d+)/);
      return match ? parseInt(match[1]) : 0;
    });
    const nextNumber = Math.max(...trackNumbers, 0) + 1;
    const newTrackId = `track${nextNumber}`;
    
    const newTrack = {
      id: newTrackId,
      enabled: true,
      instrument: 'kick',
      color: colors[(tracks.length) % colors.length],
      volume: -12
    };
    
    console.log(`[DJ Booth] ➕ Adding ${newTrackId}`);
    
    setTracks(prev => [...prev, newTrack]);
    setPatterns(prev => ({
      ...prev,
      [newTrackId]: Array(16).fill(0)
    }));
    setMutes(prev => ({ ...prev, [newTrackId]: false }));
    setSolos(prev => ({ ...prev, [newTrackId]: false }));
  };

  const removeTrack = (trackId) => {
    // Check if track is used in any saved patterns
    const usedInPatterns = [];
    savedPatterns.forEach((pattern, index) => {
      if (pattern.data?.patterns?.[trackId]) {
        // Check if the track has any active steps
        const hasActiveSteps = pattern.data.patterns[trackId].some(step => step === 1);
        if (hasActiveSteps) {
          usedInPatterns.push(String.fromCharCode(65 + index)); // A, B, C, D...
        }
      }
    });
    
    if (usedInPatterns.length > 0) {
      const patternList = usedInPatterns.join(', ');
      const message = `⚠️ WARNING: ${trackId} is used in Pattern${usedInPatterns.length > 1 ? 's' : ''} ${patternList}!\n\nDeleting this track will remove it from ${usedInPatterns.length > 1 ? 'these patterns' : 'this pattern'}.\n\nAre you sure you want to proceed?`;
      
      if (!confirm(message)) {
        console.log(`[DJ Booth] ❌ Track deletion cancelled by user`);
        return;
      }
    }
    
    console.log(`[DJ Booth] ❌ DELETE BUTTON CLICKED - Removing entire track: ${trackId}`);
    setTracks(prev => {
      const filtered = prev.filter(t => t.id !== trackId);
      tracksRef.current = filtered;
      console.log(`[DJ Booth]   Tracks remaining: ${filtered.map(t => t.id).join(', ')}`);
      return filtered;
    });
    setPatterns(prev => {
      const newPatterns = { ...prev };
      delete newPatterns[trackId];
      patternsRef.current = newPatterns;
      console.log(`[DJ Booth]   Pattern deleted for ${trackId}`);
      return newPatterns;
    });
    setMutes(prev => {
      const newMutes = { ...prev };
      delete newMutes[trackId];
      mutesRef.current = newMutes;
      return newMutes;
    });
    setSolos(prev => {
      const newSolos = { ...prev };
      delete newSolos[trackId];
      solosRef.current = newSolos;
      return newSolos;
    });
    
    // Remove track from all saved patterns
    if (usedInPatterns.length > 0) {
      setSavedPatterns(prev => {
        const updated = prev.map(pattern => {
          if (pattern.data) {
            const newData = { ...pattern.data };
            
            // Remove from patterns
            if (newData.patterns?.[trackId]) {
              delete newData.patterns[trackId];
            }
            
            // Remove from tracks array
            if (newData.tracks) {
              newData.tracks = newData.tracks.filter(t => t.id !== trackId);
            }
            
            // Remove from mutes
            if (newData.mutes?.[trackId]) {
              const newMutes = { ...newData.mutes };
              delete newMutes[trackId];
              newData.mutes = newMutes;
            }
            
            // Remove from solos
            if (newData.solos?.[trackId]) {
              const newSolos = { ...newData.solos };
              delete newSolos[trackId];
              newData.solos = newSolos;
            }
            
            return { ...pattern, data: newData };
          }
          return pattern;
        });
        savedPatternsRef.current = updated;
        return updated;
      });
      console.log(`[DJ Booth]   Removed ${trackId} from ${usedInPatterns.length} saved pattern(s)`);
    }
  };

  const changeInstrument = (trackId, instrumentId) => {
    setTracks(prev => prev.map(t => 
      t.id === trackId ? { ...t, instrument: instrumentId } : t
    ));
  };

  const setVolume = (trackId, vol) => {
    setTracks(prev => prev.map(t => 
      t.id === trackId ? { ...t, volume: vol } : t
    ));
  };

  const clearPattern = (trackId) => {
    console.log(`[DJ Booth] 🗑️ CLEAR BUTTON CLICKED for ${trackId}`);
    setPatterns(prev => {
      const newPatterns = { ...prev, [trackId]: Array(16).fill(0) };
      console.log(`[DJ Booth]   ${trackId} cleared: ${JSON.stringify(newPatterns[trackId])}`);
      return newPatterns;
    });
    if (currentPatternIndex !== null) setCurrentPatternIndex(null);
  };

  const randomizePattern = (trackId) => {
    console.log(`[DJ Booth] 🎲 Randomizing ${trackId}`);
    setPatterns(prev => ({ ...prev, [trackId]: Array(16).fill(0).map(() => Math.random() > 0.6 ? 1 : 0) }));
    if (currentPatternIndex !== null) setCurrentPatternIndex(null);
  };

  const toggleMute = (trackId) => {
    setMutes(prev => {
      const updated = { ...prev, [trackId]: !prev[trackId] };
      // Update ref immediately
      mutesRef.current = updated;
      return updated;
    });
  };

  const toggleSolo = (trackId) => {
    setSolos(prev => {
      const updated = { ...prev, [trackId]: !prev[trackId] };
      // Update ref immediately
      solosRef.current = updated;
      return updated;
    });
  };

  // SAVE: Save complete pattern state (tracks, patterns, mutes, solos)
  const savePattern = (index) => {
    const now = Date.now();
    
    // Debounce: Ignore saves within 100ms of the last one
    if (now - lastSaveTimeRef.current < 100) {
      console.log(`[DJ Booth] ⚠️ Save blocked (debounce: ${now - lastSaveTimeRef.current}ms)`);
      return;
    }
    
    lastSaveTimeRef.current = now;
    
    // Save complete state: tracks, patterns, mutes, solos
    const snapshot = {
      tracks: tracks.map(track => ({ ...track })), // Deep copy all track properties
      patterns: {},      // Step sequences for each track
      mutes: { ...mutes },    // Mute states
      solos: { ...solos }     // Solo states
    };
    
    tracks.forEach(track => {
      snapshot.patterns[track.id] = [...patterns[track.id]]; // Copy pattern array
    });
    
    console.log(`[DJ Booth] 💾 Saved Pattern ${String.fromCharCode(65 + index)} (${tracks.length} tracks, complete state)`);
    
    setSavedPatterns(prev => {
      const newPatterns = [...prev];
      newPatterns[index] = { 
        name: newPatterns[index]?.name || `Pattern ${String.fromCharCode(65 + index)}`, 
        data: snapshot
      };
      savedPatternsRef.current = newPatterns; // Update ref immediately
      return newPatterns;
    });
    
    setCurrentPatternIndex(index);
    setJustSaved(index);
    
    setTimeout(() => { 
      setJustSaved(null); 
    }, 800);
  };

  // LOAD: Restore complete pattern state (tracks, patterns, mutes, solos)
  const loadPattern = (index) => {
    const saved = savedPatterns[index];
    if (!saved?.data) {
      console.log(`[DJ Booth] ⚠️ Pattern ${String.fromCharCode(65 + index)} is empty`);
      return;
    }
    
    console.log(`[DJ Booth] 📂 LOADING Pattern ${String.fromCharCode(65 + index)} (complete state):`);
    
    // Restore tracks (all properties: id, enabled, instrument, color, volume)
    if (saved.data.tracks) {
      const restoredTracks = saved.data.tracks.map(track => ({ ...track }));
      console.log(`    Restoring ${restoredTracks.length} tracks with instruments:`, restoredTracks.map(t => t.instrument).join(', '));
      setTracks(restoredTracks);
      tracksRef.current = restoredTracks;
    }
    
    // Restore patterns
    if (saved.data.patterns) {
      const restoredPatterns = { ...saved.data.patterns };
      console.log(`    Restoring patterns for ${Object.keys(restoredPatterns).length} tracks`);
      setPatterns(restoredPatterns);
      patternsRef.current = restoredPatterns;
    }
    
    // Restore mutes
    if (saved.data.mutes) {
      console.log(`    Restoring mute states`);
      setMutes(saved.data.mutes);
      mutesRef.current = saved.data.mutes;
    }
    
    // Restore solos
    if (saved.data.solos) {
      console.log(`    Restoring solo states`);
      setSolos(saved.data.solos);
      solosRef.current = saved.data.solos;
    }
    
    setCurrentPatternIndex(index);
    console.log(`[DJ Booth]   ✅ Pattern ${String.fromCharCode(65 + index)} fully loaded`);
  };

  // NEW PATTERN: Clear all patterns but keep existing tracks
  const createNewPattern = () => {
    console.log(`[DJ Booth] ✨ Creating NEW pattern - clearing sequences, keeping tracks`);
    
    // Clear all pattern sequences
    const clearedPatterns = {};
    tracks.forEach(track => {
      clearedPatterns[track.id] = Array(16).fill(0);
    });
    
    setPatterns(clearedPatterns);
    
    // Enable all tracks
    setTracks(prev => prev.map(t => ({ ...t, enabled: true })));
    
    setCurrentPatternIndex(null);
  };

  // Wrapper to debug save clicks
  const handleSaveClick = (index, event) => {
    // Prevent any event bubbling that might interfere
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    
    // Use setTimeout(0) to break completely out of any audio callback timing
    // This ensures the save happens in a fresh execution context
    setTimeout(() => {
      savePattern(index);
    }, 0);
  };

  const addPatternBank = () => {
    const nextLetter = String.fromCharCode(65 + savedPatterns.length);
    setSavedPatterns(prev => [...prev, { name: `Pattern ${nextLetter}`, data: null }]);
  };

  const clearPatternBank = (index) => {
    const patternName = String.fromCharCode(65 + index);
    console.log(`[DJ Booth] 🧹 Clearing Pattern ${patternName}`);
    
    setSavedPatterns(prev => {
      const newPatterns = [...prev];
      newPatterns[index] = { 
        name: newPatterns[index]?.name || `Pattern ${patternName}`, 
        data: null 
      };
      savedPatternsRef.current = newPatterns;
      console.log(`[DJ Booth]   ✅ Pattern ${patternName} cleared (slot kept)`);
      return newPatterns;
    });
    
    // If we're currently viewing this pattern, reset to no active pattern
    if (currentPatternIndex === index) {
      setCurrentPatternIndex(null);
      console.log(`[DJ Booth]   📝 Cleared active pattern selection`);
    }
  };

  // Update displayed patterns when arrangement section changes
  useEffect(() => {
    if (!arrangementMode) return;
    if (isPlaying) return; // Don't update display during playback - prevents cascades
    
    const section = arrangement[currentArrangementStep];
    if (section && section.patternIds && section.patternIds.length > 0) {
      const firstPatternId = section.patternIds[0];
      const saved = savedPatternsRef.current[firstPatternId]; // Use ref to avoid dep issues
      
      if (!saved?.data) return;
      
      // Only when paused/stopped: Full load including track/instrument recreation
      console.log(`[DJ Booth] 🎵 Section ${currentArrangementStep + 1}: Loading Pattern ${String.fromCharCode(65 + firstPatternId)} (full)`);
      loadPattern(firstPatternId);
    }
  }, [currentArrangementStep, arrangementMode, isPlaying]); // Removed arrangement and savedPatterns from deps

  const addArrangementSection = () => {
    setArrangement(prev => [...prev, { patternIds: [0], repeat: 2, name: `Section ${prev.length + 1}` }]);
  };

  const removeArrangementSection = (index) => {
    if (arrangement.length <= 1) return;
    setArrangement(prev => prev.filter((_, i) => i !== index));
  };

  const updateArrangementSection = (index, field, value) => {
    setArrangement(prev => prev.map((section, i) => 
      i === index ? { ...section, [field]: value } : section
    ));
  };

  const togglePatternInSection = (sectionIndex, patternId) => {
    setArrangement(prev => prev.map((section, i) => {
      if (i !== sectionIndex) return section;
      const patternIds = [...section.patternIds];
      const idIndex = patternIds.indexOf(patternId);
      if (idIndex >= 0) {
        // Remove if already selected
        patternIds.splice(idIndex, 1);
        // Keep at least one pattern
        if (patternIds.length === 0) patternIds.push(patternId);
      } else {
        // Add pattern
        patternIds.push(patternId);
        patternIds.sort((a, b) => a - b);
      }
      return { ...section, patternIds };
    }));
  };

  const exportSong = () => {
    const songData = {
      version: '1.0',
      bpm,
      swing,
      masterVolume,
      tracks: tracks.map(t => ({ id: t.id, enabled: t.enabled, instrument: t.instrument, color: t.color, volume: t.volume })),
      patterns,
      savedPatterns,
      arrangement,
      mutes,
      solos,
      timestamp: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(songData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `djbooth-song-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  const exportAudio = async () => {
    if (!ready || !window.Tone || !masterRef.current) return;
    
    setShowExportMenu(false);
    
    try {
      // Calculate total duration
      let totalBars = 0;
      if (arrangementMode) {
        arrangement.forEach(section => {
          totalBars += section.repeat;
        });
      } else {
        totalBars = 4; // Default 4 bars for pattern mode
      }
      
      const duration = (totalBars * 4 * 60) / bpm; // bars * beats/bar * seconds/beat
      
      // Start recording
      const recorder = new Tone.Recorder();
      masterRef.current.connect(recorder);
      
      await Tone.start();
      await recorder.start();
      
      // Play through the arrangement/pattern
      const anySolo = Object.values(solos).some(s => s);
      let step = 0;
      const progress = { sectionIndex: 0, loopCount: 0 };
      
      const recordLoop = new Tone.Loop((time) => {
        const stepIndex = step % 16;
        
        if (arrangementMode && stepIndex === 0 && step > 0) {
          progress.loopCount++;
          const section = arrangement[progress.sectionIndex];
          if (section && progress.loopCount >= section.repeat) {
            progress.sectionIndex++;
            progress.loopCount = 0;
            if (progress.sectionIndex >= arrangement.length) {
              return; // Will be stopped in the step++ section
            }
          }
        }
        
        const instruments = instrumentsRef.current;
        if (!instruments) return;
        
        // In arrangement mode, get tracks from saved patterns
        if (arrangementMode) {
          const section = arrangement[progress.sectionIndex];
          if (section && section.patternIds && section.patternIds.length > 0) {
            section.patternIds.forEach(patternId => {
              const savedPattern = savedPatterns[patternId];
              if (!savedPattern?.data) return;
              
              const patternTracks = savedPattern.data.tracks || [];
              patternTracks.forEach(track => {
                if (!track.enabled) return;
                if (mutes[track.id]) return;
                if (anySolo && !solos[track.id]) return;
                
                const patternData = savedPattern.data.patterns?.[track.id];
                if (patternData && patternData[stepIndex]) {
                  let inst = instruments[track.id];
                  if (!inst) {
                    inst = createInstrument(track.instrument);
                    if (inst) {
                      inst.volume.value = track.volume;
                      instruments[track.id] = inst;
                    }
                  }
                  if (inst) {
                    playNote(inst, track.instrument, time, stepIndex);
                  }
                }
              });
            });
          }
        } else {
          // Pattern mode
          tracks.forEach(track => {
            if (!track.enabled) return;
            if (mutes[track.id]) return;
            if (anySolo && !solos[track.id]) return;
            
            const patternData = patterns[track.id];
            if (patternData && patternData[stepIndex]) {
              const inst = instruments[track.id];
              if (inst) {
                playNote(inst, track.instrument, time, stepIndex);
              }
            }
          });
        }
        
        step++;
        
        // Stop when done
        if (arrangementMode && progress.sectionIndex >= arrangement.length) {
          setTimeout(() => {
            recordLoop.stop();
            Tone.Transport.stop();
          }, 100);
        } else if (!arrangementMode && step >= totalBars * 16) {
          setTimeout(() => {
            recordLoop.stop();
            Tone.Transport.stop();
          }, 100);
        }
      }, "16n");
      
      recordLoop.start(0);
      Tone.Transport.start();
      
      // Wait for recording to complete
      setTimeout(async () => {
        try {
          recordLoop.stop();
          Tone.Transport.stop();
          
          const recording = await recorder.stop();
          const url = URL.createObjectURL(recording);
          const link = document.createElement('a');
          link.href = url;
          link.download = `djbooth-audio-${Date.now()}.webm`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          setTimeout(() => {
            URL.revokeObjectURL(url);
          }, 100);
          
          recordLoop.dispose();
          console.log('Audio exported successfully!');
        } catch (err) {
          console.error('Export error:', err);
          alert('Export failed. Please try again.');
        }
      }, duration * 1000 + 500);
    } catch (err) {
      console.error('Export error:', err);
      alert('Export failed. Please try again.');
    }
  };

  const importSong = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const songData = JSON.parse(e.target.result);
        
        // Validate and load song data
        if (songData.version && songData.tracks) {
          setBpm(songData.bpm || 120);
          setSwing(songData.swing || 0);
          setMasterVolume(songData.masterVolume || -10);
          setTracks(songData.tracks || []);
          setPatterns(songData.patterns || {});
          setSavedPatterns(songData.savedPatterns || []);
          setArrangement(songData.arrangement || []);
          setMutes(songData.mutes || {});
          setSolos(songData.solos || {});
          
          // Show success message
          console.log('Song loaded successfully!');
        } else {
          console.error('Invalid song file format');
        }
      } catch (error) {
        console.error('Error loading song:', error);
      }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset input
  };

  const getInstrumentInfo = (instId) => {
    const allInstruments = [...availableInstruments.drums, ...availableInstruments.synths, ...availableInstruments.fx];
    return allInstruments.find(i => i.id === instId) || { name: instId, icon: 'music' };
  };

  if (!isFullTab) {
    return (
      <div ref={containerRef} style={{ padding: "16px", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", border: "1px dashed rgba(157, 124, 206, 0.3)", borderRadius: "8px", backgroundColor: "#0a0a0a" }}>
        <dc.Icon icon="music" style={{ fontSize: "48px", color: "#9d7cce" }} />
        <p style={{ margin: 0, color: "#666" }}>DJ Booth in compact mode</p>
        <button style={{ padding: "8px 16px", backgroundColor: "#9d7cce", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" }} onClick={() => setIsFullTab(true)}>
          Enter Full Tab
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef}>
      <style>{`
        .${uniqueWrapperClass} .exit-icon { opacity: 0; transition: opacity 0.2s; }
        .${uniqueWrapperClass}:hover .exit-icon { opacity: 0.7; }
        .${uniqueWrapperClass} .exit-icon:hover { opacity: 1; }
        .step-button { transition: all 0.1s; }
        .step-button:hover { transform: scale(1.1); }
        .pattern-letter-btn { transition: all 0.15s; position: relative; }
        .pattern-letter-btn:not(:disabled):hover { transform: scale(1.1); box-shadow: 0 0 12px rgba(78, 205, 196, 0.5); }
      `}</style>
      <div style={{ width: "100%", height: "100vh", backgroundColor: "#000", color: "#fff", fontFamily: "monospace", display: "flex", flexDirection: "column", overflow: "hidden" }} className={uniqueWrapperClass}>
        <div className="exit-icon" style={{ position: "absolute", top: "15px", right: "20px", cursor: "pointer", zIndex: 10 }} onClick={() => setIsFullTab(false)}>
          <dc.Icon icon="x" style={{ fontSize: "20px", color: "#aaa" }} />
        </div>
        <div style={{ padding: "15px 30px", borderBottom: "2px solid rgba(157, 124, 206, 0.2)", backgroundColor: "#0a0a0a" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
              <dc.Icon icon="music" style={{ fontSize: "32px", color: "#9d7cce" }} />
              <h1 style={{ margin: 0, fontSize: "1.8rem", color: "#9d7cce", letterSpacing: "4px" }}>DJ BOOTH 888</h1>
            </div>
            <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "3px" }}>
                <span style={{ fontSize: "0.6rem", color: "#666" }}>MASTER</span>
                <input type="range" min="-40" max="0" value={masterVolume} onChange={(e) => setMasterVolume(parseFloat(e.target.value))} style={{ width: "70px" }} />
                <span style={{ fontSize: "0.5rem", color: "#9d7cce" }}>{masterVolume}dB</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "3px" }}>
                <span style={{ fontSize: "0.6rem", color: "#666" }}>SWING</span>
                <input type="range" min="0" max="100" value={swing} onChange={(e) => setSwing(parseFloat(e.target.value))} style={{ width: "70px" }} />
                <span style={{ fontSize: "0.5rem", color: "#9d7cce" }}>{swing}%</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "3px" }}>
                <span style={{ fontSize: "0.6rem", color: "#666" }}>BPM</span>
                <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
                  <button onClick={() => setBpm(Math.max(60, bpm - 5))} style={{ width: "25px", height: "25px", backgroundColor: "rgba(157, 124, 206, 0.1)", border: "1px solid rgba(157, 124, 206, 0.3)", borderRadius: "3px", color: "#9d7cce", cursor: "pointer", fontSize: "12px" }}>-</button>
                  <span style={{ fontSize: "1.2rem", color: "#9d7cce", fontWeight: "bold", minWidth: "50px", textAlign: "center" }}>{bpm}</span>
                  <button onClick={() => setBpm(Math.min(200, bpm + 5))} style={{ width: "25px", height: "25px", backgroundColor: "rgba(157, 124, 206, 0.1)", border: "1px solid rgba(157, 124, 206, 0.3)", borderRadius: "3px", color: "#9d7cce", cursor: "pointer", fontSize: "12px" }}>+</button>
                </div>
              </div>
              <button onClick={togglePlay} disabled={!ready} style={{ padding: "12px 25px", fontSize: "0.9rem", fontWeight: "bold", color: "#000", backgroundColor: isPlaying ? "#ff6b6b" : "#9d7cce", border: "none", borderRadius: "6px", cursor: ready ? "pointer" : "not-allowed", opacity: ready ? 1 : 0.5, display: "flex", alignItems: "center", gap: "8px" }}>
                <dc.Icon icon={isPlaying ? "square" : "play"} style={{ fontSize: "16px" }} />
                {isPlaying ? "STOP" : "PLAY"}
              </button>
              {arrangementMode && (
                <button onClick={restartSong} disabled={!ready} style={{ padding: "8px 12px", fontSize: "0.7rem", backgroundColor: "rgba(78, 205, 196, 0.1)", border: "1px solid rgba(78, 205, 196, 0.3)", borderRadius: "4px", color: "#4ecdc4", cursor: ready ? "pointer" : "not-allowed", opacity: ready ? 1 : 0.5, display: "flex", alignItems: "center", gap: "5px" }}>
                  <dc.Icon icon="rotate-ccw" style={{ fontSize: "12px" }} /> RESTART
                </button>
              )}
              <button onClick={() => setArrangementMode(!arrangementMode)} style={{ padding: "8px 15px", fontSize: "0.7rem", backgroundColor: arrangementMode ? "rgba(78, 205, 196, 0.3)" : "rgba(157, 124, 206, 0.1)", border: "1px solid rgba(157, 124, 206, 0.3)", borderRadius: "4px", color: arrangementMode ? "#4ecdc4" : "#9d7cce", cursor: "pointer" }}>
                <dc.Icon icon="list" style={{ fontSize: "12px" }} /> {arrangementMode ? "SONG MODE" : "PATTERN MODE"}
              </button>
              <div style={{ borderLeft: "1px solid rgba(157, 124, 206, 0.2)", height: "30px" }} />
              <div style={{ position: "relative" }}>
                <button onClick={() => setShowExportMenu(!showExportMenu)} style={{ padding: "8px 15px", fontSize: "0.7rem", backgroundColor: showExportMenu ? "rgba(157, 124, 206, 0.3)" : "rgba(157, 124, 206, 0.1)", border: "1px solid rgba(157, 124, 206, 0.3)", borderRadius: "4px", color: "#9d7cce", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px" }}>
                  <dc.Icon icon="download" style={{ fontSize: "12px" }} /> EXPORT
                </button>
                {showExportMenu && (
                  <div style={{ position: "absolute", top: "calc(100% + 5px)", right: "0", backgroundColor: "#0a0a0a", border: "1px solid rgba(157, 124, 206, 0.3)", borderRadius: "4px", padding: "8px", zIndex: 1000, minWidth: "160px", boxShadow: "0 4px 12px rgba(0, 0, 0, 0.5)" }}>
                    <button onClick={exportSong} style={{ width: "100%", padding: "8px 12px", fontSize: "0.65rem", backgroundColor: "rgba(157, 124, 206, 0.1)", border: "1px solid rgba(157, 124, 206, 0.2)", borderRadius: "3px", color: "#9d7cce", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px", textAlign: "left" }}>
                      <dc.Icon icon="file-json" style={{ fontSize: "12px" }} /> Export JSON
                    </button>
                    <button onClick={exportAudio} disabled={!ready} style={{ width: "100%", padding: "8px 12px", fontSize: "0.65rem", backgroundColor: "rgba(157, 124, 206, 0.1)", border: "1px solid rgba(157, 124, 206, 0.2)", borderRadius: "3px", color: ready ? "#9d7cce" : "#666", cursor: ready ? "pointer" : "not-allowed", display: "flex", alignItems: "center", gap: "8px", textAlign: "left", opacity: ready ? 1 : 0.5 }}>
                      <dc.Icon icon="music" style={{ fontSize: "12px" }} /> Export Audio (WebM)
                    </button>
                  </div>
                )}
              </div>
              <label style={{ padding: "8px 15px", fontSize: "0.7rem", backgroundColor: "rgba(157, 124, 206, 0.1)", border: "1px solid rgba(157, 124, 206, 0.3)", borderRadius: "4px", color: "#9d7cce", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px" }}>
                <dc.Icon icon="upload" style={{ fontSize: "12px" }} /> IMPORT
                <input type="file" accept=".json" onChange={importSong} style={{ display: "none" }} />
              </label>
            </div>
          </div>
          <div style={{ marginTop: "10px", display: "flex", gap: "8px", alignItems: "center", fontSize: "0.65rem" }}>
            <span style={{ color: "#666" }}>PATTERNS:</span>
            {savedPatterns.map((p, i) => (
              <div key={i} style={{ display: "flex", gap: "3px", alignItems: "center", position: "relative" }}>
                <button onClick={(e) => handleSaveClick(i, e)} style={{ padding: "3px 8px", fontSize: "0.6rem", backgroundColor: justSaved === i ? "rgba(78, 205, 196, 0.5)" : p.data ? "rgba(157, 124, 206, 0.3)" : "rgba(157, 124, 206, 0.1)", border: justSaved === i ? "1px solid #4ecdc4" : "1px solid rgba(157, 124, 206, 0.3)", borderRadius: "3px", color: justSaved === i ? "#4ecdc4" : "#9d7cce", cursor: "pointer", transition: "all 0.2s" }}>
                  <dc.Icon icon={justSaved === i ? "check" : "save"} style={{ fontSize: "8px" }} />
                </button>
                <button className="pattern-letter-btn" onClick={() => loadPattern(i)} disabled={!p.data} style={{ padding: "3px 8px", fontSize: "0.6rem", backgroundColor: currentPatternIndex === i ? "rgba(78, 205, 196, 0.4)" : (p.data ? "rgba(157, 124, 206, 0.2)" : "rgba(100, 100, 100, 0.1)"), border: currentPatternIndex === i ? "2px solid #4ecdc4" : "1px solid rgba(157, 124, 206, 0.3)", borderRadius: "3px", color: currentPatternIndex === i ? "#4ecdc4" : (p.data ? "#9d7cce" : "#444"), cursor: p.data ? "pointer" : "not-allowed", opacity: p.data ? 1 : 0.5, fontWeight: currentPatternIndex === i ? "bold" : "normal" }} title={p.data ? `Click to load Pattern ${String.fromCharCode(65 + i)}` : 'No pattern saved yet'}>{String.fromCharCode(65 + i)}</button>
                <button onClick={() => clearPatternBank(i)} disabled={!p.data} style={{ padding: "3px 6px", fontSize: "0.5rem", backgroundColor: "rgba(255, 165, 0, 0.1)", border: "1px solid rgba(255, 165, 0, 0.3)", borderRadius: "3px", color: "#ffa500", cursor: p.data ? "pointer" : "not-allowed", opacity: p.data ? 1 : 0.3 }} title={p.data ? `Clear Pattern ${String.fromCharCode(65 + i)} (keeps slot)` : 'No pattern to clear'}>
                  <dc.Icon icon="trash-2" style={{ fontSize: "7px" }} />
                </button>
                {justSaved === i && (
                  <div style={{ position: "absolute", top: "-25px", left: "50%", transform: "translateX(-50%)", fontSize: "0.5rem", color: "#4ecdc4", backgroundColor: "rgba(0, 0, 0, 0.9)", padding: "3px 8px", borderRadius: "3px", whiteSpace: "nowrap", pointerEvents: "none" }}>
                    Saved!
                  </div>
                )}
              </div>
            ))}
            <button onClick={addPatternBank} style={{ padding: "3px 10px", fontSize: "0.6rem", backgroundColor: "rgba(78, 205, 196, 0.1)", border: "1px solid rgba(78, 205, 196, 0.3)", borderRadius: "3px", color: "#4ecdc4", cursor: "pointer", display: "flex", alignItems: "center", gap: "3px" }}>
              <dc.Icon icon="plus" style={{ fontSize: "8px" }} /> ADD PATTERN
            </button>
            {!arrangementMode && (
              <button onClick={createNewPattern} style={{ padding: "3px 10px", fontSize: "0.6rem", backgroundColor: "rgba(157, 124, 206, 0.1)", border: "1px solid rgba(157, 124, 206, 0.3)", borderRadius: "3px", color: "#9d7cce", cursor: "pointer", display: "flex", alignItems: "center", gap: "3px" }}>
                <dc.Icon icon="file-plus" style={{ fontSize: "8px" }} /> NEW
              </button>
            )}
            {!arrangementMode && currentPatternIndex !== null && savedPatterns[currentPatternIndex]?.data && (
              <span style={{ marginLeft: "15px", color: "#4ecdc4", display: "flex", alignItems: "center", gap: "6px", fontSize: "0.6rem" }}>
                <dc.Icon icon="edit-3" style={{ fontSize: "10px" }} /> 
                Editing Pattern {String.fromCharCode(65 + currentPatternIndex)}
              </span>
            )}
            {!arrangementMode && currentPatternIndex === null && (
              <span style={{ marginLeft: "15px", color: "#666", display: "flex", alignItems: "center", gap: "6px", fontSize: "0.6rem", fontStyle: "italic" }}>
                <dc.Icon icon="file-text" style={{ fontSize: "10px" }} /> 
                Working on new pattern
              </span>
            )}
            {arrangementMode && (
              <span style={{ marginLeft: "15px", color: "#9d7cce", display: "flex", alignItems: "center", gap: "8px" }}>
                <dc.Icon icon="arrow-right" style={{ fontSize: "10px" }} /> 
                {arrangement[currentArrangementStep]?.name || 'N/A'}
                <span style={{ color: "#4ecdc4", fontSize: "0.6rem" }}>
                  [{arrangement[currentArrangementStep]?.patternIds?.map(id => String.fromCharCode(65 + id)).join('+') || 'None'}]
                </span>
              </span>
            )}
          </div>
          {arrangementMode && (
            <div style={{ marginTop: "12px", padding: "12px", backgroundColor: "rgba(157, 124, 206, 0.05)", border: "1px solid rgba(157, 124, 206, 0.2)", borderRadius: "6px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <span style={{ fontSize: "0.7rem", fontWeight: "bold", color: "#9d7cce", display: "flex", alignItems: "center", gap: "6px" }}>
                  <dc.Icon icon="list-music" style={{ fontSize: "12px" }} />
                  ARRANGEMENT EDITOR
                </span>
                <button onClick={addArrangementSection} style={{ padding: "4px 10px", fontSize: "0.6rem", backgroundColor: "rgba(157, 124, 206, 0.2)", border: "1px solid rgba(157, 124, 206, 0.4)", borderRadius: "3px", color: "#9d7cce", cursor: "pointer" }}>
                  <dc.Icon icon="plus" style={{ fontSize: "8px" }} /> Add Section
                </button>
              </div>
              {savedPatterns.every(p => !p.data) && (
                <div style={{ padding: "8px 12px", marginBottom: "10px", backgroundColor: "rgba(255, 193, 7, 0.1)", border: "1px solid rgba(255, 193, 7, 0.3)", borderRadius: "4px", fontSize: "0.65rem", color: "#ffc107", display: "flex", alignItems: "center", gap: "8px" }}>
                  <dc.Icon icon="alert-triangle" style={{ fontSize: "14px" }} />
                  <span>No patterns saved! Save your working patterns (A, B, C, D...) before using arrangement mode.</span>
                </div>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {arrangement.map((section, index) => (
                  <div key={index} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px", backgroundColor: currentArrangementStep === index && isPlaying ? "rgba(78, 205, 196, 0.1)" : "rgba(0, 0, 0, 0.3)", border: currentArrangementStep === index && isPlaying ? "1px solid rgba(78, 205, 196, 0.5)" : "1px solid rgba(157, 124, 206, 0.1)", borderRadius: "4px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "0.6rem", color: "#666", minWidth: "20px" }}>{index + 1}.</span>
                    <div style={{ display: "flex", gap: "3px", flexWrap: "wrap" }}>
                      {savedPatterns.map((p, i) => (
                        <button 
                          key={i}
                          onClick={() => togglePatternInSection(index, i)} 
                          disabled={!p.data}
                          style={{ 
                            padding: "3px 8px", 
                            fontSize: "0.6rem", 
                            backgroundColor: section.patternIds.includes(i) ? "rgba(78, 205, 196, 0.3)" : "rgba(100, 100, 100, 0.1)", 
                            border: section.patternIds.includes(i) ? "1px solid rgba(78, 205, 196, 0.5)" : "1px solid rgba(157, 124, 206, 0.2)", 
                            borderRadius: "3px", 
                            color: section.patternIds.includes(i) ? "#4ecdc4" : (p.data ? "#9d7cce" : "#444"), 
                            cursor: p.data ? "pointer" : "not-allowed",
                            opacity: p.data ? 1 : 0.3,
                            fontWeight: section.patternIds.includes(i) ? "bold" : "normal"
                          }}
                        >
                          {String.fromCharCode(65 + i)}
                        </button>
                      ))}
                    </div>
                    <span style={{ fontSize: "0.6rem", color: "#666" }}>x</span>
                    <input 
                      type="number" 
                      min="0" 
                      max="16" 
                      value={section.repeat} 
                      onChange={(e) => {
                        const val = e.target.value;
                        // Allow empty while typing
                        if (val === '') {
                          updateArrangementSection(index, 'repeat', '');
                        } else {
                          updateArrangementSection(index, 'repeat', parseInt(val) || 0);
                        }
                      }}
                      onBlur={(e) => {
                        // On blur, if empty set to 0
                        if (e.target.value === '') {
                          updateArrangementSection(index, 'repeat', 0);
                        }
                      }}
                      style={{ padding: "4px 6px", fontSize: "0.65rem", backgroundColor: "#0a0a0a", border: "1px solid rgba(157, 124, 206, 0.3)", borderRadius: "3px", color: "#9d7cce", width: "50px" }} 
                    />
                    <input type="text" value={section.name} onChange={(e) => updateArrangementSection(index, 'name', e.target.value)} placeholder="Section name" style={{ padding: "4px 8px", fontSize: "0.65rem", backgroundColor: "#0a0a0a", border: "1px solid rgba(157, 124, 206, 0.3)", borderRadius: "3px", color: "#9d7cce", flex: 1, minWidth: "100px" }} />
                    <button onClick={() => removeArrangementSection(index)} disabled={arrangement.length <= 1} style={{ padding: "4px 8px", fontSize: "0.6rem", backgroundColor: "rgba(255, 107, 107, 0.2)", border: "1px solid rgba(255, 107, 107, 0.4)", borderRadius: "3px", color: "#ff6b6b", cursor: arrangement.length > 1 ? "pointer" : "not-allowed", opacity: arrangement.length > 1 ? 1 : 0.3 }}>
                      <dc.Icon icon="x" style={{ fontSize: "8px" }} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div style={{ flex: 1, padding: "15px 30px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "12px", position: "relative" }}>
          {/* Isolated Playhead - won't cause parent re-renders */}
          <Playhead isPlaying={isPlaying} currentStep={currentStep} trackCount={tracks.length} />
          {tracks.map(track => {
            const instInfo = getInstrumentInfo(track.instrument);
            
            // Calculate display pattern: in arrangement mode, merge current section's patterns
            const displayPattern = (() => {
              if (arrangementMode) {
                const section = arrangement[currentArrangementStep];
                if (section && section.patternIds && section.patternIds.length > 0) {
                  // Merge multiple patterns using OR logic
                  let merged = new Array(16).fill(0);
                  section.patternIds.forEach(patternId => {
                    const savedPattern = savedPatterns[patternId];
                    // Use new data structure: savedPattern.data.patterns[track.id]
                    if (savedPattern?.data?.patterns?.[track.id]) {
                      savedPattern.data.patterns[track.id].forEach((val, i) => {
                        if (val) merged[i] = 1;
                      });
                    }
                  });
                  return merged;
                }
              }
              // Default: show working pattern
              const workingPattern = patterns[track.id] || Array(16).fill(0);
              return workingPattern;
            })();
            
            // Create a hash of the pattern to use as part of the key
            const patternHash = displayPattern.join('');
            
            return (
              <div key={`${track.id}-${track.enabled}-${patternHash}`} style={{ backgroundColor: "#0a0a0a", border: !track.enabled ? "1px dashed rgba(100, 100, 100, 0.3)" : mutes[track.id] ? "1px solid rgba(255, 107, 107, 0.4)" : solos[track.id] ? "1px solid rgba(78, 205, 196, 0.4)" : "1px solid rgba(157, 124, 206, 0.2)", borderRadius: "6px", padding: "10px", opacity: !track.enabled ? 0.4 : mutes[track.id] ? 0.6 : 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1 }}>
                    <button 
                      onClick={() => toggleTrack(track.id)} 
                      style={{ 
                        padding: "5px 8px", 
                        fontSize: "0.65rem", 
                        backgroundColor: track.enabled ? "rgba(78, 205, 196, 0.3)" : "rgba(255, 107, 107, 0.3)", 
                        border: track.enabled ? "1px solid rgba(78, 205, 196, 0.5)" : "1px solid rgba(255, 107, 107, 0.5)", 
                        borderRadius: "3px", 
                        color: track.enabled ? "#4ecdc4" : "#ff6b6b", 
                        cursor: "pointer",
                        fontWeight: "bold",
                        boxShadow: !track.enabled ? "0 0 8px rgba(255, 107, 107, 0.4)" : "none"
                      }}
                    >
                      <dc.Icon icon={track.enabled ? "check" : "x"} style={{ fontSize: "10px" }} />
                    </button>
                    <select value={track.instrument} onChange={(e) => changeInstrument(track.id, e.target.value)} disabled={!track.enabled} style={{ padding: "5px", fontSize: "0.7rem", backgroundColor: "#0a0a0a", border: "1px solid rgba(157, 124, 206, 0.3)", borderRadius: "3px", color: track.color, cursor: "pointer" }}>
                      <optgroup label="Drums">
                        {availableInstruments.drums.map(inst => (
                          <option key={inst.id} value={inst.id}>{inst.name}</option>
                        ))}
                      </optgroup>
                      <optgroup label="Synths">
                        {availableInstruments.synths.map(inst => (
                          <option key={inst.id} value={inst.id}>{inst.name}</option>
                        ))}
                      </optgroup>
                      <optgroup label="FX">
                        {availableInstruments.fx.map(inst => (
                          <option key={inst.id} value={inst.id}>{inst.name}</option>
                        ))}
                      </optgroup>
                    </select>
                    <dc.Icon icon={instInfo.icon} style={{ fontSize: "16px", color: track.color }} />
                    <input type="range" min="-40" max="0" value={track.volume} onChange={(e) => setVolume(track.id, parseFloat(e.target.value))} disabled={!track.enabled} style={{ width: "100px" }} />
                    <span style={{ fontSize: "0.55rem", color: track.color, minWidth: "35px" }}>{track.volume}dB</span>
                    <button onClick={() => toggleMute(track.id)} disabled={!track.enabled} style={{ padding: "4px 8px", fontSize: "0.6rem", backgroundColor: mutes[track.id] ? "rgba(255, 107, 107, 0.3)" : "rgba(157, 124, 206, 0.1)", border: "1px solid rgba(157, 124, 206, 0.3)", borderRadius: "3px", color: mutes[track.id] ? "#ff6b6b" : "#9d7cce", cursor: "pointer" }}>
                      <dc.Icon icon={mutes[track.id] ? "volume-x" : "volume-2"} style={{ fontSize: "10px" }} /> M
                    </button>
                    <button onClick={() => toggleSolo(track.id)} disabled={!track.enabled} style={{ padding: "4px 8px", fontSize: "0.6rem", backgroundColor: solos[track.id] ? "rgba(78, 205, 196, 0.3)" : "rgba(157, 124, 206, 0.1)", border: "1px solid rgba(157, 124, 206, 0.3)", borderRadius: "3px", color: solos[track.id] ? "#4ecdc4" : "#9d7cce", cursor: "pointer" }}>
                      <dc.Icon icon="headphones" style={{ fontSize: "10px" }} /> S
                    </button>
                  </div>
                  <div style={{ display: "flex", gap: "5px" }}>
                    <button onClick={() => randomizePattern(track.id)} disabled={!track.enabled} style={{ padding: "4px 8px", fontSize: "0.6rem", backgroundColor: "rgba(157, 124, 206, 0.1)", border: "1px solid rgba(157, 124, 206, 0.3)", borderRadius: "3px", color: "#9d7cce", cursor: "pointer" }}>
                      <dc.Icon icon="shuffle" style={{ fontSize: "9px" }} />
                    </button>
                    <button onClick={() => clearPattern(track.id)} disabled={!track.enabled} style={{ padding: "4px 8px", fontSize: "0.6rem", backgroundColor: "rgba(255, 107, 107, 0.1)", border: "1px solid rgba(255, 107, 107, 0.3)", borderRadius: "3px", color: "#ff6b6b", cursor: "pointer" }}>
                      <dc.Icon icon="trash-2" style={{ fontSize: "9px" }} />
                    </button>
                    <button onClick={() => removeTrack(track.id)} disabled={tracks.length <= 1} style={{ padding: "4px 8px", fontSize: "0.6rem", backgroundColor: "rgba(255, 107, 107, 0.2)", border: "1px solid rgba(255, 107, 107, 0.4)", borderRadius: "3px", color: "#ff6b6b", cursor: tracks.length > 1 ? "pointer" : "not-allowed", opacity: tracks.length > 1 ? 1 : 0.3 }}>
                      <dc.Icon icon="x-circle" style={{ fontSize: "9px" }} />
                    </button>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(16, 1fr)", gap: "5px" }}>
                  {displayPattern.map((active, stepIndex) => (
                    <button 
                      key={stepIndex} 
                      className="step-button" 
                      onClick={() => toggleStep(track.id, stepIndex)} 
                      disabled={!track.enabled} 
                      style={{ 
                        aspectRatio: "1", 
                        backgroundColor: active ? track.color : "rgba(255, 255, 255, 0.05)", 
                        border: currentStep === stepIndex && isPlaying ? "2px solid #fff" : active ? `1px solid ${track.color}` : "1px solid rgba(255, 255, 255, 0.1)", 
                        borderRadius: "3px", 
                        cursor: track.enabled ? "pointer" : "not-allowed", 
                        position: "relative", 
                        boxShadow: active ? `0 0 8px ${track.color}` : "none", 
                        opacity: track.enabled ? 1 : 0.3 
                      }}
                    >
                      {stepIndex % 4 === 0 && (
                        <div style={{ position: "absolute", bottom: "-14px", left: "50%", transform: "translateX(-50%)", fontSize: "0.45rem", color: "#444", fontWeight: "bold" }}>
                          {stepIndex / 4 + 1}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
          <button onClick={addTrack} style={{ padding: "12px", fontSize: "0.75rem", fontWeight: "bold", backgroundColor: "rgba(157, 124, 206, 0.1)", border: "2px dashed rgba(157, 124, 206, 0.4)", borderRadius: "6px", color: "#9d7cce", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", transition: "all 0.2s" }}>
            <dc.Icon icon="plus-circle" style={{ fontSize: "16px" }} />
            Add Track
          </button>
        </div>
        <div style={{ padding: "10px 30px", borderTop: "1px solid rgba(157, 124, 206, 0.1)", backgroundColor: "#0a0a0a", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: "0.65rem", color: "#555" }}>
            {ready ? "Audio Engine Ready" : "Loading Tone.js..."}
          </div>
          <div style={{ fontSize: "0.55rem", color: "#444", display: "flex", gap: "12px" }}>
            <span>{tracks.filter(t => t.enabled).length} Active Tracks</span>
            <span>16 Steps</span>
            <span>{bpm} BPM</span>
            {arrangementMode && isPlaying && (
              <span style={{ color: "#4ecdc4" }}>
                Section: {currentArrangementStep + 1}/{arrangement.length}
              </span>
            )}
          </div>
          <div style={{ fontSize: "0.65rem", color: "#666" }}>Powered by Tone.js</div>
        </div>
      </div>
    </div>
  );
}

return { View: DJBoothView };
```
