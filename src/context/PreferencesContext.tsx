import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const DARK_KEY = "bc26-dark";
const SOUND_KEY = "bc26-sound";

/** One shared context so resume() sticks; new contexts per beep stay suspended and often stay silent. */
let sharedAudioContext: AudioContext | null = null;

function getSharedAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (sharedAudioContext && sharedAudioContext.state !== "closed") {
    return sharedAudioContext;
  }
  try {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    sharedAudioContext = AC ? new AC() : null;
    return sharedAudioContext;
  } catch {
    return null;
  }
}

function runWhenAudioReady(ctx: AudioContext, play: () => void) {
  if (ctx.state === "running") {
    play();
    return;
  }
  void ctx.resume().then(play).catch(() => {
    /* autoplay blocked or resume failed */
  });
}

/** Short UI tap (theme toggle, flips, etc.) */
function beep(freq = 520) {
  const ctx = getSharedAudioContext();
  if (!ctx) return;
  const play = () => {
    try {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.connect(g);
      g.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      g.gain.setValueAtTime(0, ctx.currentTime);
      g.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.004);
      g.gain.exponentialRampToValueAtTime(0.0008, ctx.currentTime + 0.065);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.08);
    } catch {
      /* ignore */
    }
  };
  runWhenAudioReady(ctx, play);
}

/** Two-note chime when sound mode is turned on (must follow same user gesture as the click) */
function soundUnmuteChime() {
  beep(523);
  window.setTimeout(() => beep(659), 90);
}

/** Lower blip when muting (runs while sound was still on) */
function soundMuteBlip() {
  const ctx = getSharedAudioContext();
  if (!ctx) return;
  const play = () => {
    try {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.connect(g);
      g.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(280, ctx.currentTime);
      g.gain.setValueAtTime(0, ctx.currentTime);
      g.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.003);
      g.gain.exponentialRampToValueAtTime(0.0008, ctx.currentTime + 0.1);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.12);
    } catch {
      /* ignore */
    }
  };
  runWhenAudioReady(ctx, play);
}

type PreferencesContextValue = {
  darkMode: boolean;
  setDarkMode: (v: boolean) => void;
  soundEnabled: boolean;
  setSoundEnabled: (v: boolean) => void;
  playUiTap: () => void;
  /** Call right before turning sound off (plays even though preference is still “on”) */
  playSoundMuteBlip: () => void;
};

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [darkMode, setDarkModeState] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(DARK_KEY) === "1";
  });
  const [soundEnabled, setSoundEnabledState] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(SOUND_KEY) === "1";
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    try {
      localStorage.setItem(DARK_KEY, darkMode ? "1" : "0");
    } catch {
      /* private mode */
    }
  }, [darkMode]);

  useEffect(() => {
    try {
      localStorage.setItem(SOUND_KEY, soundEnabled ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [soundEnabled]);

  const playUiTap = useCallback(() => {
    if (!soundEnabled) return;
    beep();
  }, [soundEnabled]);

  const playSoundMuteBlip = useCallback(() => {
    soundMuteBlip();
  }, []);

  const setSoundEnabled = useCallback((v: boolean) => {
    setSoundEnabledState(v);
    if (v) {
      /* Same turn as the click — microtask can miss user-gesture / running context in some browsers */
      soundUnmuteChime();
    }
  }, []);

  const value = useMemo(
    () => ({
      darkMode,
      setDarkMode: setDarkModeState,
      soundEnabled,
      setSoundEnabled,
      playUiTap,
      playSoundMuteBlip,
    }),
    [darkMode, soundEnabled, playUiTap, playSoundMuteBlip, setSoundEnabled]
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error("usePreferences must be used within PreferencesProvider");
  return ctx;
}
