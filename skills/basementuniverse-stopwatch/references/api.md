# API Reference

Complete API surface for `@basementuniverse/stopwatch`.

## Installation

```bash
npm install @basementuniverse/stopwatch
```

## Import

```ts
import Stopwatch from '@basementuniverse/stopwatch';
```

## Constructor

```ts
new Stopwatch(options?: Partial<StopwatchOptions>)
```

Creates a new stopwatch instance with optional configuration.

**Parameters:**
- `options` (optional): Partial configuration object. Unspecified options use defaults.

**Returns:** `Stopwatch` instance

**Example:**
```ts
const stopwatch = new Stopwatch({
  unit: 's',
  direction: 'forward',
  max: 60,
});
```

## Properties (Read-only)

### `stopwatch.running`

**Type:** `boolean`

**Description:** Whether the stopwatch is currently running (actively timing).

**Settable:** Yes - setting to `true` calls `start()`, setting to `false` calls `stop()`

```ts
if (stopwatch.running) {
  console.log('Timer is running');
}

// Setter usage
stopwatch.running = true;   // Starts the stopwatch
stopwatch.running = false;  // Stops the stopwatch
```

---

### `stopwatch.paused`

**Type:** `boolean`

**Description:** Whether the stopwatch is currently paused.

**Settable:** Yes - setting to `true` calls `pause()`, setting to `false` calls `resume()`

```ts
if (stopwatch.paused) {
  console.log('Timer is paused');
}

// Setter usage
stopwatch.paused = true;   // Pauses the stopwatch
stopwatch.paused = false;  // Resumes the stopwatch
```

---

### `stopwatch.time`

**Type:** `number`

**Description:** The current displayed time of the stopwatch.
- **Forward direction**: Increases from 0 to `max`
- **Backward direction**: Decreases from `max` to 0

**Units:** Matches configured `unit` ('ms' or 's')

```ts
console.log(`Current time: ${stopwatch.time}s`);
```

---

### `stopwatch.elapsed`

**Type:** `number`

**Description:** Total time elapsed since the stopwatch started, excluding paused time. Always increases from 0 to `max` regardless of direction. Clamped to `max` if finite.

**Units:** Matches configured `unit` ('ms' or 's')

```ts
console.log(`Active time: ${stopwatch.elapsed}s`);
```

---

### `stopwatch.remaining`

**Type:** `number`

**Description:** Time remaining until the stopwatch finishes.
- **Forward direction**: `max - time` (or `Infinity` if `max` is `Infinity`)
- **Backward direction**: Current `time` value

**Units:** Matches configured `unit` ('ms' or 's')

```ts
console.log(`Time left: ${stopwatch.remaining}s`);
```

---

### `stopwatch.progress`

**Type:** `number` (range: `[0, 1]`)

**Description:** Progress as a ratio between 0 and 1.
- **Forward direction**: `time / max` (increases from 0 to 1)
- **Backward direction**: `time / max` (decreases from 1 to 0)
- **Special cases:**
  - Forward with `max: Infinity` → always returns `0`
  - When `max === 0` → returns `1`

```ts
const progressPercent = stopwatch.progress * 100;
console.log(`Progress: ${progressPercent}%`);
```

---

### `stopwatch.pausedDuration`

**Type:** `number`

**Description:** Total duration the stopwatch has been paused since it started. Increases each time the stopwatch is paused and resumed.

**Units:** Matches configured `unit` ('ms' or 's')

```ts
console.log(`Total paused time: ${stopwatch.pausedDuration}s`);
```

---

### `stopwatch.options`

**Type:** `StopwatchOptions`

**Description:** The full configuration object for this stopwatch instance, including defaults.

```ts
console.log(stopwatch.options.unit);
console.log(stopwatch.options.direction);
```

## Methods

### `stopwatch.start()`

**Returns:** `void`

**Description:** Starts the stopwatch. If already running, has no effect. If paused, resumes instead of starting fresh.

**Behavior:**
- If not running and not paused → fresh start, fires `onStart`
- If paused → resumes, fires `onResume`
- If already running → no effect

```ts
stopwatch.start();
```

---

### `stopwatch.stop(options?)`

**Parameters:**
- `options` (optional): `Partial<StopwatchStopOptions>`
  - `resetTime` (default: `true`): Whether to reset time to 0
  - `resetPausedDuration` (default: `true`): Whether to reset paused duration to 0

**Returns:** `void`

**Description:** Stops the stopwatch. Default behavior resets time and paused duration.

**Behavior:**
- If not running and not paused → no effect
- If both reset flags are `false` → behaves like `pause()`
- Otherwise → stops and resets as specified, fires `onStop`

```ts
// Stop and reset everything (default)
stopwatch.stop();

// Stop without resetting (behaves like pause)
stopwatch.stop({ resetTime: false, resetPausedDuration: false });

// Reset time but keep paused duration
stopwatch.stop({ resetTime: true, resetPausedDuration: false });
```

---

### `stopwatch.pause()`

**Returns:** `void`

**Description:** Pauses the stopwatch. If not running or already paused, has no effect.

**Behavior:**
- If running → pauses, fires `onPause`
- Otherwise → no effect

```ts
stopwatch.pause();
```

---

### `stopwatch.resume()`

**Returns:** `void`

**Description:** Resumes the stopwatch from a paused state. Alias for `start()`.

```ts
stopwatch.resume();
```

---

### `stopwatch.reset()`

**Returns:** `void`

**Description:** Resets the stopwatch to initial state. Alias for `stop({ resetTime: true, resetPausedDuration: true })`.

**Behavior:**
- Stops the stopwatch
- Resets time to 0
- Resets paused duration to 0
- Fires `onStop`

```ts
stopwatch.reset();
```

---

### `stopwatch.adjustTime(amount)`

**Parameters:**
- `amount`: `number` - Amount to add (positive) or subtract (negative) from current time

**Returns:** `void`

**Description:** Manually adjusts the current time by the specified amount. Does not trigger callbacks. Time is clamped to valid bounds `[0, max]`.

**Units:** `amount` is interpreted using configured `unit`

**Use cases:**
- Manual time corrections
- External time manipulation
- Time penalties/bonuses

```ts
stopwatch.adjustTime(5);   // Add 5 seconds/milliseconds
stopwatch.adjustTime(-2);  // Subtract 2 seconds/milliseconds
```

---

### `stopwatch.update()`

**Returns:** `void`

**Description:** Updates the stopwatch's internal state based on elapsed time. **Must be called every frame in your game loop.**

**Critical responsibilities:**
- Advances internal time tracking
- Checks for finish condition
- Triggers milestone callbacks
- Fires `onFinish` when complete

**Without this call:**
- Stopwatch won't finish
- Milestones won't trigger
- Time won't advance properly

```ts
function gameLoop() {
  stopwatch.update();  // Critical!
  requestAnimationFrame(gameLoop);
}
```

## Quick Reference

### Lifecycle Methods
```ts
stopwatch.start()     // Start timing
stopwatch.stop()      // Stop and reset
stopwatch.pause()     // Pause (preserves state)
stopwatch.resume()    // Resume from pause
stopwatch.reset()     // Stop and reset all
```

### State Queries
```ts
stopwatch.running          // boolean
stopwatch.paused           // boolean
stopwatch.time             // number
stopwatch.elapsed          // number
stopwatch.remaining        // number
stopwatch.progress         // number [0-1]
stopwatch.pausedDuration   // number
```

### Time Manipulation
```ts
stopwatch.adjustTime(amount)  // Manual adjustment
stopwatch.update()            // Required every frame
```

### Boolean Setters
```ts
stopwatch.running = true/false  // Start/stop
stopwatch.paused = true/false   // Pause/resume
```

## Usage Pattern

Typical integration in a game loop:

```ts
import Stopwatch from '@basementuniverse/stopwatch';

const stopwatch = new Stopwatch({
  unit: 's',
  direction: 'forward',
  max: 60,
  onFinish: () => console.log('Time up!'),
});

stopwatch.start();

function gameLoop() {
  // Update stopwatch (REQUIRED)
  stopwatch.update();

  // Read state
  console.log(stopwatch.time);
  console.log(stopwatch.remaining);
  console.log(stopwatch.progress);

  // Continue loop
  requestAnimationFrame(gameLoop);
}

gameLoop();
```
