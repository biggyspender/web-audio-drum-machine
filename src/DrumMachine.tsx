import { use, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createSequence } from "./audio/createSequence";
import { createPersistentAudioPipeline } from "./audio/createPersistentAudioPipeline";
import { fetchSampleMap } from "./audio/fetchSampleMap";
import { defaultSamples } from "./audio/defaultSamples";
import type { StepData } from "./audio/getSequencerClock/types/StepData";
import Knob from "./components/Knob";
import { StepSequencer } from "./components/sequencer/StepSequencer";
import { PlayPauseButton } from "./components/PlayPauseButton";
import { StopButton } from "./components/StopButton";
import { createDefaultGridPattern } from "./components/sequencer/utils/createDefaultPattern";
import { gridToNotes } from "./components/sequencer/utils/gridToNotes";
import type { GridState } from "./components/sequencer/types";
import { STEP_COUNT } from "./components/sequencer/types";
import styles from "./DrumMachine.module.css";

const sampleMapPromise = fetchSampleMap(defaultSamples);

type PlaybackState = 'stopped' | 'playing' | 'paused';

export function DrumMachine() {
  const [bpm, setBpm] = useState<number>(90);
  const [swing, setSwing] = useState<number>(0.55);
  // const [humanizeVelocity, setHumanizeVelocity] = useState<number>(0.2);
  // const [humanizeTiming, setHumanizeTiming] = useState<number>(0.1);
  const [playheadPosition, setPlayheadPosition] = useState<number>(-1); // -1 means not playing, 0-15 for step position
  const [playbackState, setPlaybackState] = useState<PlaybackState>('stopped');
  const [isAtStart, setIsAtStart] = useState<boolean>(true); // Track if we're at the beginning
  const { impulse, ...sampleMap } = use(sampleMapPromise);

  // Replace AbortController with persistent pipeline (using ref for stable reference)
  const pipelineRef = useRef<ReturnType<typeof createPersistentAudioPipeline<keyof typeof sampleMap>> | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize grid state directly since sampleMap is guaranteed by suspense
  const [gridState, setGridState] = useState<GridState<keyof typeof sampleMap>>(
    () => createDefaultGridPattern(sampleMap)
  );
  // Step toggle handler for grid interaction
  const handleStepToggle = useCallback(
    (trackKey: keyof typeof sampleMap, stepIndex: number) => {
      setGridState((prevGrid) => ({
        ...prevGrid,
        [trackKey]: prevGrid[trackKey].map((active, index) =>
          index === stepIndex ? !active : active
        ),
      }));
    },
    []
  );

  const sequence = useMemo(() => {
    const notes = gridToNotes(gridState, sampleMap);

    return createSequence(sampleMap, {
      bars: 1, // Changed from 2 to 1 for 16-step grid
      bpm: bpm,
      timeSignature: [4, 4],
      swing: swing,
      // humanize: {
      //   velocity: humanizeVelocity,
      //   timing: humanizeTiming,
      // },
      notes,
    });
  }, [bpm, sampleMap, swing, gridState]);
  const sequenceRef = useRef(sequence);
  sequenceRef.current = sequence;

  // Update pipeline with new sequence parameters in real-time
  useEffect(() => {
    const pipeline = pipelineRef.current;
    if (pipeline && playbackState !== 'stopped') {
      pipeline.updateSequence(() => sequenceRef.current);
    }
  }, [sequence, playbackState]);

  // Playhead tracking callback
  const handleStepUpdate = useCallback((stepData: StepData) => {
    // Calculate the current step in our 16-step grid
    // Each beat has 4 subdivisions, so step position is: beatIndex * 4 + stepIndex
    const currentStep =
      stepData.beatIndex * stepData.subdivisions + stepData.stepIndex;
    const position = currentStep % STEP_COUNT;
    setPlayheadPosition(position);
    setIsAtStart(position === 0);
  }, []);

  // Initialize pipeline on first user interaction (to comply with browser AudioContext policy)
  const initializePipeline = useCallback(async () => {
    if (pipelineRef.current) return; // Already initialized
    
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext({ latencyHint: "interactive" });
    }
    
    const audioContext = audioContextRef.current;
    
    // Resume AudioContext if suspended (browser requirement)
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }
    
    // Create persistent pipeline using factory function
    pipelineRef.current = createPersistentAudioPipeline(
      audioContext,
      sampleMap,
      impulse.buffer,
      audioContext.destination
    );
    
    const pipeline = pipelineRef.current;
    
    // Subscribe to state changes (following convention #3 - event-driven)
    const unsubscribeState = pipeline.subscribe('playback-state-changed', ({ state }) => {
      setPlaybackState(state);
    });
    
    // Subscribe to step updates for playhead
    const unsubscribeStep = pipeline.subscribe('step-updated', (stepData) => {
      // Calculate the current step in our 16-step grid
      const currentStep = stepData.beatIndex * stepData.subdivisions + stepData.stepIndex;
      const position = currentStep % STEP_COUNT;
      setPlayheadPosition(position);
      setIsAtStart(position === 0);
    });
    
    // Store unsubscribe functions for cleanup
    return { unsubscribeState, unsubscribeStep };
  }, [sampleMap, impulse.buffer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const pipeline = pipelineRef.current;
      if (pipeline) {
        pipeline.dispose();
        pipelineRef.current = null;
      }
      const audioContext = audioContextRef.current;
      if (audioContext) {
        audioContext.close();
        audioContextRef.current = null;
      }
    };
  }, []);

  // Replace go() function (pure function approach with lazy initialization)
  const startPlayback = useCallback(async () => {
    // Initialize pipeline on first play (user gesture required for AudioContext)
    await initializePipeline();
    
    const pipeline = pipelineRef.current;
    if (pipeline && (playbackState === 'stopped' || playbackState === 'paused')) {
      await pipeline.play(
        () => sequenceRef.current,
        handleStepUpdate // Keep existing callback for compatibility
      );
      // When starting from stopped, we're not necessarily at start anymore
      if (playbackState === 'stopped') {
        setIsAtStart(false);
      }
    }
  }, [playbackState, handleStepUpdate, initializePipeline]);
  
  // Reset to start functionality (back to beginning while maintaining playback state)
  const resetToStart = useCallback(async () => {
    const pipeline = pipelineRef.current;
    if (pipeline && playbackState !== 'stopped') {
      await pipeline.resetToStart();
      
      // Update UI state for reset to start
      setPlayheadPosition(0);
      setIsAtStart(true);
    }
  }, [playbackState]);
  
  // Add pause functionality (not possible with old system)
  const pausePlayback = useCallback(async () => {
    const pipeline = pipelineRef.current;
    if (pipeline && playbackState === 'playing') {
      await pipeline.pause();
    }
  }, [playbackState]);

  const togglePlayback = useCallback(() => {
    if (playbackState === 'playing') {
      pausePlayback(); // Now we can pause instead of stop
    } else {
      startPlayback();
    }
  }, [playbackState, startPlayback, pausePlayback]);

  const keyHandler = useCallback(
    (e: KeyboardEvent): void => {
      if (e.code === "Space" || e.code === " ") {
        togglePlayback();
        e.preventDefault();
      }
    },
    [togglePlayback]
  );

  // Handle spacebar key press for toggling playback
  useKeyHandler(keyHandler);

  return (
    <div className={styles.appContainer}>
      {/* Step Sequencer Grid */}
      <StepSequencer
        sampleMap={sampleMap}
        gridState={gridState}
        onStepToggle={handleStepToggle}
        playheadPosition={playheadPosition >= 0 ? playheadPosition : undefined}
      />

      <div className={styles.controlsContainer}>
        <div className={styles.buttonsContainer}>
          <PlayPauseButton
            isPlaying={playbackState === 'playing'}
            onClick={togglePlayback}
          />
          
          {/* Reset to start button - always visible, active when playing or when paused/stopped but not at start */}
          <StopButton
            isActive={playbackState === 'playing' || (playbackState !== 'stopped' && !isAtStart)}
            onClick={resetToStart}
          />
        </div>

        <div className={styles.knobsContainer}>
          <Knob
            min={60}
            max={180}
            value={bpm}
            onChange={setBpm}
            label="BPM"
            precision={0}
            size={24}
          />

          <Knob
            min={0.5}
            max={1}
            value={swing}
            onChange={setSwing}
            label="Swing"
            step={0.01}
            precision={2}
            size={24}
          />

          {/* <Knob
            min={0}
            max={1}
            value={humanizeVelocity}
            onChange={setHumanizeVelocity}
            label="Velocity Random"
            step={0.01}
            precision={2}
            size={30}
          />

          <Knob
            min={0}
            max={1}
            value={humanizeTiming}
            onChange={setHumanizeTiming}
            label="Timing Random"
            step={0.01}
            precision={2}
            size={30}
          /> */}
        </div>
      </div>
    </div>
  );
}
function useKeyHandler(callback: (e: KeyboardEvent) => void) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if spacebar was pressed

      // Check if an interactive element is currently focused
      const activeElement = document.activeElement;
      
      // Safely check if an interactive element is focused
      if (!activeElement) {
        callback(e);
        return;
      }
      
      const isInteractiveElement =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement instanceof HTMLSelectElement ||
        activeElement.getAttribute("role") === "textbox" ||
        (activeElement instanceof HTMLElement &&
          activeElement.hasAttribute("contenteditable"));

      // Only trigger playback toggle if no interactive element is focused
      if (!isInteractiveElement) {
        callback(e);
      }
    };

    // Add event listener
    window.addEventListener("keydown", handleKeyDown);

    // Clean up on unmount
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [callback]);
}
