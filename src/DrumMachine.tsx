import { use, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { createSequence } from "./audio/createSequence";
import { createPersistentAudioPipeline } from "./audio/createPersistentAudioPipeline";
import { fetchSampleMap } from "./audio/fetchSampleMap";
import { defaultSamples } from "./audio/defaultSamples";
import type { StepData } from "./audio/getSequencerClock/types/StepData";
import Knob from "./components/Knob";
import { StepSequencer } from "./components/sequencer/StepSequencer";
import { PlayPauseButton } from "./components/PlayPauseButton";
import { BackToStartButton } from "./components/BackToStartButton";
import { ResetPatternButton } from "./components/ResetPatternButton";
import { gridToNotes } from "./components/sequencer/utils/gridToNotes";
import type { GridState } from "./components/sequencer/types";
import { STEP_COUNT } from "./components/sequencer/types";
import {
  encodePatternToUrlSafe,
  decodePatternFromUrlSafe,
} from "./audio/urlSafeEncoding";

import { useMediaQuery } from "./components/useMediaQuery";
import styles from "./DrumMachine.module.css";
import { debounce } from "./lib/rate-limiting/debounce";
import { createEmptyGridPattern } from "./components/sequencer/utils/createEmptyGridPattern";

const sampleMapPromise = fetchSampleMap(defaultSamples);

type PlaybackState = "stopped" | "playing" | "paused";

interface DrumMachineProps {
  initialPattern: string;
}

export function DrumMachine({ initialPattern }: DrumMachineProps) {
  const [location, navigate] = useLocation();
  const [bpm, setBpm] = useState<number>(90);
  const [swing, setSwing] = useState<number>(0.55);
  const [echoLevel, setEchoLevel] = useState<number>(0.2);
  const [reverbLevel, setReverbLevel] = useState<number>(0.25);
  // const [humanizeVelocity, setHumanizeVelocity] = useState<number>(0.2);
  // const [humanizeTiming, setHumanizeTiming] = useState<number>(0.1);
  const [playheadPosition, setPlayheadPosition] = useState<number>(-1); // -1 means not playing, 0-15 for step position
  const [playbackState, setPlaybackState] = useState<PlaybackState>("stopped");
  const [isAtStart, setIsAtStart] = useState<boolean>(true); // Track if we're at the beginning
  const { impulse, ...sampleMap } = use(sampleMapPromise);

  // Track if we're currently processing a navigation event to prevent URL sync conflicts
  const isNavigatingRef = useRef(false);

  // Replace AbortController with persistent pipeline (using ref for stable reference)
  const pipelineRef = useRef<Awaited<
    ReturnType<typeof createPersistentAudioPipeline<keyof typeof sampleMap>>
  > | null>(null);

  // Initialize grid state with support for route parameter patterns
  const [gridState, setGridState] = useState<GridState<keyof typeof sampleMap>>(
    () => {
      // First try initialPattern prop (URL-safe encoded)
      if (initialPattern) {
        const decoded = decodePatternFromUrlSafe(initialPattern);
        if (decoded && decoded.grid && typeof decoded.grid === "object") {
          return decoded.grid as GridState<keyof typeof sampleMap>;
        }
      }

      return createEmptyGridPattern(sampleMap);
    }
  );

  // Handler to reset pattern and knobs to default
  const handleResetPattern = useCallback(() => {
    setGridState(createEmptyGridPattern(sampleMap));
    setBpm(90);
    setSwing(0.55);
    setEchoLevel(0);
    setReverbLevel(0);
    setPlayheadPosition(-1);
    setIsAtStart(true);
    // Optionally reset playback state
    setPlaybackState("stopped");
    // Optionally clear hash
    window.location.hash = "";
  }, [sampleMap]);
  // Set initial knob state from route parameter or hash if present
  useEffect(() => {
    let parsed = null;

    // First try initialPattern prop (URL-safe encoded)
    if (initialPattern) {
      parsed = decodePatternFromUrlSafe(initialPattern);
    }

    if (parsed) {
      if (typeof parsed.bpm === "number") setBpm(parsed.bpm);
      if (typeof parsed.swing === "number") setSwing(parsed.swing);
      if (typeof parsed.echoLevel === "number") setEchoLevel(parsed.echoLevel);
      if (typeof parsed.reverbLevel === "number")
        setReverbLevel(parsed.reverbLevel);
    }
  }, [initialPattern]);

  // Handle browser navigation - update pattern state when initialPattern changes
  useEffect(() => {
    if (!initialPattern) return;

    // Set navigation flag to prevent URL sync conflicts
    isNavigatingRef.current = true;

    const decoded = decodePatternFromUrlSafe(initialPattern);
    if (decoded && decoded.grid && typeof decoded.grid === "object") {
      // Update grid state from navigation
      setGridState(decoded.grid as GridState<keyof typeof sampleMap>);

      // Update other parameters too
      if (typeof decoded.bpm === "number") setBpm(decoded.bpm);
      if (typeof decoded.swing === "number") setSwing(decoded.swing);
      if (typeof decoded.echoLevel === "number")
        setEchoLevel(decoded.echoLevel);
      if (typeof decoded.reverbLevel === "number")
        setReverbLevel(decoded.reverbLevel);
    }

    // Clear navigation flag after a brief delay to allow state updates to settle
    const timeoutId = setTimeout(() => {
      isNavigatingRef.current = false;
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [initialPattern]);

  const shareableState = useMemo(
    () => ({
      bpm,
      swing,
      echoLevel,
      reverbLevel,
      kit: "default", // Default kit for now, will be configurable later
      grid: gridState,
    }),
    [gridState, bpm, swing, echoLevel, reverbLevel]
  );

  // URL synchronization with history management
  const syncPatternWithUrl = useCallback(
    (shareableState: {
      grid: GridState<"hat" | "clap" | "snare" | "kick">;
      bpm: number;
      swing: number;
      echoLevel: number;
      reverbLevel: number;
      kit: string;
    }) => {
      // Don't sync during navigation events to prevent conflicts
      if (isNavigatingRef.current) {
        return;
      }

      const encoded = encodePatternToUrlSafe(shareableState);
      const newPath = `/pattern/${encoded}`;

      // Only navigate if the current path is different
      if (location !== newPath) {
        navigate(newPath, { replace: false }); // Create history entry
      }
    },
    [location, navigate]
  );

  const syncPatternWithUrlDebounced = useMemo(
    () => debounce(syncPatternWithUrl, 300),
    [syncPatternWithUrl]
  );

  // Update URL with base64-encoded pattern+knobs whenever relevant state changes
  useEffect(() => {
    syncPatternWithUrlDebounced(shareableState);
  }, [shareableState, syncPatternWithUrlDebounced]);

  const audioContextRef = useRef<AudioContext | null>(null);

  // Step toggle handler for grid interaction
  // Accept velocity for per-hit velocity feature
  const handleStepToggle = useCallback(
    (
      trackKey: keyof typeof sampleMap,
      stepIndex: number,
      velocity: number = 0
    ) => {
      setGridState((prevGrid) => ({
        ...prevGrid,
        [trackKey]: prevGrid[trackKey].map((val, index) =>
          index === stepIndex ? velocity : val
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
    if (pipeline && playbackState !== "stopped") {
      pipeline.updateSequence(() => sequenceRef.current);
    }
  }, [sequence, playbackState]);

  // Update echo level parameter in real-time
  useEffect(() => {
    const pipeline = pipelineRef.current;
    if (pipeline) {
      pipeline.setEchoLevel(echoLevel);
    }
  }, [echoLevel]);

  // Update reverb level parameter in real-time
  useEffect(() => {
    const pipeline = pipelineRef.current;
    if (pipeline) {
      pipeline.setReverbLevel(reverbLevel);
    }
  }, [reverbLevel]);

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
      audioContextRef.current = new AudioContext({
        latencyHint: "interactive",
      });
    }

    const audioContext = audioContextRef.current;

    // Resume AudioContext if suspended (browser requirement)
    if (audioContext.state === "suspended") {
      await audioContext.resume();
    }

    // Create persistent pipeline using factory function
    pipelineRef.current = await createPersistentAudioPipeline(
      audioContext,
      sampleMap,
      impulse.buffer,
      audioContext.destination
    );

    const pipeline = pipelineRef.current;

    pipeline.setEchoLevel(echoLevel);
    pipeline.setReverbLevel(reverbLevel);

    // Subscribe to state changes (following convention #3 - event-driven)
    const unsubscribeState = pipeline.subscribe(
      "playback-state-changed",
      ({ state }) => {
        setPlaybackState(state);
      }
    );

    // Subscribe to step updates for playhead
    const unsubscribeStep = pipeline.subscribe("step-updated", (stepData) => {
      // Calculate the current step in our 16-step grid
      const currentStep =
        stepData.beatIndex * stepData.subdivisions + stepData.stepIndex;
      const position = currentStep % STEP_COUNT;
      setPlayheadPosition(position);
      setIsAtStart(position === 0);
    });

    // Store unsubscribe functions for cleanup
    return { unsubscribeState, unsubscribeStep };
  }, [sampleMap, impulse.buffer, echoLevel, reverbLevel]);

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
    if (
      pipeline &&
      (playbackState === "stopped" || playbackState === "paused")
    ) {
      await pipeline.play(
        () => sequenceRef.current,
        handleStepUpdate // Keep existing callback for compatibility
      );
      // When starting from stopped, we're not necessarily at start anymore
      if (playbackState === "stopped") {
        setIsAtStart(false);
      }
    }
  }, [playbackState, handleStepUpdate, initializePipeline]);

  // Reset to start functionality (back to beginning while maintaining playback state)
  const resetToStart = useCallback(async () => {
    const pipeline = pipelineRef.current;
    if (pipeline && playbackState !== "stopped") {
      await pipeline.resetToStart();

      // Update UI state for reset to start
      setPlayheadPosition(0);
      setIsAtStart(true);
    }
  }, [playbackState]);

  // Add pause functionality (not possible with old system)
  const pausePlayback = useCallback(async () => {
    const pipeline = pipelineRef.current;
    if (pipeline && playbackState === "playing") {
      await pipeline.pause();
    }
  }, [playbackState]);

  const togglePlayback = useCallback(() => {
    if (playbackState === "playing") {
      pausePlayback(); // Now we can pause instead of stop
    } else {
      startPlayback();
    }
  }, [playbackState, startPlayback, pausePlayback]);

  const keyHandler = useCallback(
    (e: KeyboardEvent): void => {
      // Handle spacebar for play/pause
      if (e.code === "Space" || e.code === " ") {
        togglePlayback();
        e.preventDefault();
        return;
      }

      // Handle undo/redo shortcuts
      const ctrlKey = e.metaKey || e.ctrlKey;

      console.log(
        `Key pressed: ${e.key}, Ctrl: ${ctrlKey}, Shift: ${e.shiftKey}`
      );

      if (ctrlKey) {
        const key = e.key.toLowerCase();
        // Undo: Ctrl+Z (Windows/Linux) or Cmd+Z (Mac)
        if (key === "z" && !e.shiftKey) {
          e.preventDefault();
          window.history.back();
          return;
        }

        // Redo: Ctrl+Y (Windows/Linux) or Cmd+Shift+Z (Mac)
        if (key === "y" || (key === "z" && e.shiftKey)) {
          e.preventDefault();
          window.history.forward();
          return;
        }
      }
    },
    [togglePlayback]
  );

  // Handle spacebar key press for toggling playback
  useKeyHandler(keyHandler);

  // Responsive layout mode detection
  const isVertical = useMediaQuery("(max-width: 650px)");

  const buildId = import.meta.env.VITE_BUILD_ID;

  return (
    <div>
      <div className={styles.appContainer}>
        {/* Step Sequencer Grid */}
        <StepSequencer
          sampleMap={sampleMap}
          gridState={gridState}
          onStepToggle={handleStepToggle}
          playheadPosition={playheadPosition}
          vertical={isVertical}
        />

        <div className={styles.controlsContainer}>
          <div className={styles.buttonsContainer}>
            <PlayPauseButton
              isPlaying={playbackState === "playing"}
              onClick={togglePlayback}
            />

            {/* Reset to start button - always visible, active when playing or when paused/stopped but not at start */}
            <BackToStartButton
              isActive={
                playbackState === "playing" ||
                (playbackState !== "stopped" && !isAtStart)
              }
              onClick={resetToStart}
            />

            {/* Reset pattern button - always visible */}
            <ResetPatternButton onClick={handleResetPattern} isActive={false} />
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

            <Knob
              min={0}
              max={1}
              value={echoLevel}
              onChange={setEchoLevel}
              label="Echo"
              step={0.01}
              precision={2}
              size={24}
            />

            <Knob
              min={0}
              max={1}
              value={reverbLevel}
              onChange={setReverbLevel}
              label="Reverb"
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
        {buildId && (
          <div className={styles.versionInfo}>
            commit{" "}
            <a
              href={`https://github.com/biggyspender/web-audio-drum-machine/commit/${buildId}`}
              target={"_blank"}
            >
              {buildId}
            </a>{" "}
            <a
              href={`https://github.com/biggyspender/web-audio-drum-machine`}
              target={"_blank"}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 16 16"
                fill="black"
                style={{ verticalAlign: "middle", marginRight: 4 }}
                aria-label="GitHub"
              >
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.5-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.01.08-2.11 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.91.08 2.11.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.19 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
              </svg>
            </a>
          </div>
        )}
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
