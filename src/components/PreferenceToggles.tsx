import { usePreferences } from "../context/PreferencesContext";

function SunIcon() {
  return <span className="shrink-0 text-lg leading-none" aria-hidden>☀️</span>;
}

function MoonIcon() {
  return <span className="shrink-0 text-lg leading-none" aria-hidden>🌙</span>;
}

function VolumeOnIcon() {
  return <span className="shrink-0 text-lg leading-none" aria-hidden>🔊</span>;
}

function VolumeOffIcon() {
  return <span className="shrink-0 text-lg leading-none" aria-hidden>🔇</span>;
}

/** Right edge of card front: icon-only theme + sound (sound toggle has its own chime / mute blip) */
export function CardPreferenceBar() {
  const { darkMode, setDarkMode, soundEnabled, setSoundEnabled, playUiTap, playSoundMuteBlip } =
    usePreferences();

  return (
    <div
      className="absolute right-0 top-[calc(50%-0.75rem)] z-20 flex -translate-y-1/2 flex-col gap-2 sm:right-1"
      role="toolbar"
      aria-label="Display and sound"
    >
      <button
        type="button"
        onClick={() => {
          setDarkMode(!darkMode);
          playUiTap();
        }}
        className="group flex h-10 w-10 items-center justify-center rounded-full border border-ink/15 bg-white/60 text-ink shadow-md backdrop-blur-md transition-colors hover:bg-white/85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:border-white/20 dark:bg-black/40 dark:text-stone-100 dark:hover:bg-black/55"
        aria-pressed={darkMode}
        title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
      >
        <span className="inline-flex transition-transform duration-200 ease-out group-hover:translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0">
          {darkMode ? <MoonIcon /> : <SunIcon />}
        </span>
        <span className="sr-only">{darkMode ? "Switch to light mode" : "Switch to dark mode"}</span>
      </button>
      <button
        type="button"
        onClick={() => {
          if (soundEnabled) {
            playSoundMuteBlip();
            setSoundEnabled(false);
          } else {
            setSoundEnabled(true);
          }
        }}
        className="group flex h-10 w-10 items-center justify-center rounded-full border border-ink/15 bg-white/60 text-ink shadow-md backdrop-blur-md transition-colors hover:bg-white/85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:border-white/20 dark:bg-black/40 dark:text-stone-100 dark:hover:bg-black/55"
        aria-pressed={soundEnabled}
        title={soundEnabled ? "Mute UI sounds" : "Enable UI sounds"}
      >
        <span className="inline-flex transition-transform duration-200 ease-out group-hover:translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0">
          {soundEnabled ? <VolumeOnIcon /> : <VolumeOffIcon />}
        </span>
        <span className="sr-only">{soundEnabled ? "Sound on" : "Sound off"}</span>
      </button>
    </div>
  );
}

/** Fixed corner — use when the card bar is not shown (admin, errors, loading) */
export function PreferenceTogglesFloating() {
  const { darkMode, setDarkMode, soundEnabled, setSoundEnabled, playUiTap, playSoundMuteBlip } =
    usePreferences();

  return (
    <div
      className="fixed right-3 top-3 z-[200] flex flex-col gap-2 sm:right-4 sm:top-4 sm:flex-row"
      role="toolbar"
      aria-label="Display and sound preferences"
    >
      <button
        type="button"
        onClick={() => {
          setDarkMode(!darkMode);
          playUiTap();
        }}
        className="group flex h-11 w-11 items-center justify-center rounded-full border border-white/35 bg-white/20 text-ink shadow-md backdrop-blur-md transition-colors hover:bg-white/35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:border-white/20 dark:bg-black/45 dark:text-stone-100 dark:hover:bg-black/60"
        aria-pressed={darkMode}
        title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
      >
        <span className="inline-flex transition-transform duration-200 ease-out group-hover:translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0">
          {darkMode ? <MoonIcon /> : <SunIcon />}
        </span>
        <span className="sr-only">{darkMode ? "Switch to light mode" : "Switch to dark mode"}</span>
      </button>
      <button
        type="button"
        onClick={() => {
          if (soundEnabled) {
            playSoundMuteBlip();
            setSoundEnabled(false);
          } else {
            setSoundEnabled(true);
          }
        }}
        className="group flex h-11 w-11 items-center justify-center rounded-full border border-white/35 bg-white/20 text-ink shadow-md backdrop-blur-md transition-colors hover:bg-white/35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:border-white/20 dark:bg-black/45 dark:text-stone-100 dark:hover:bg-black/60"
        aria-pressed={soundEnabled}
        title={soundEnabled ? "Turn sound off" : "Turn sound on"}
      >
        <span className="inline-flex transition-transform duration-200 ease-out group-hover:translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0">
          {soundEnabled ? <VolumeOnIcon /> : <VolumeOffIcon />}
        </span>
        <span className="sr-only">{soundEnabled ? "Sound on" : "Sound off"}</span>
      </button>
    </div>
  );
}
