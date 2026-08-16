# Game Component: Stopwatch

A somewhat accurate timer for use in browser games.

## Installation

```bash
npm install @basementuniverse/stopwatch
```

For direct browser usage, include the UMD build with a script tag:

```html
<script src="build/index.js"></script>
```

The build exposes the package's main class as the `BasementUniverseStopwatch` browser
global. It does not add each export directly to `window`.

## How to use

```ts
import Stopwatch from '@basementuniverse/stopwatch';

const stopwatch = new Stopwatch({
  unit: 's',
  rate: 1,
  direction: 'forward',
  max: Infinity,
});

// Update the stopwatch every frame
function gameLoop() {
  stopwatch.update();
  requestAnimationFrame(gameLoop);
}

// Start and stop the stopwatch
stopwatch.start();
stopwatch.stop(); // optionally pass StopwatchStopOptions to control reset behavior
stopwatch.running = true; // Start the stopwatch
stopwatch.running = false; // Stop the stopwatch

// Pause and resume the stopwatch
stopwatch.pause();
stopwatch.resume();
stopwatch.paused = true; // Pause the stopwatch
stopwatch.paused = false; // Resume the stopwatch

// Reset the stopwatch
stopwatch.reset();

// Manually adjust the time
stopwatch.adjustTime(5); // +5 seconds
stopwatch.adjustTime(-2); // -2 seconds

// Get values from the stopwatch
stopwatch.running; // boolean
stopwatch.paused; // boolean
stopwatch.time; // number
stopwatch.elapsed; // number
stopwatch.remaining; // number
stopwatch.progress; // number, [0, 1]
stopwatch.pausedDuration; // number
```

## Options

```ts
type StopwatchOptions = {
  /**
   * The unit of time used by the stopwatch. This determines how the time values
   * are interpreted and displayed. The default unit is 'milliseconds'.
   */
  unit: 'ms' | 's';

  /**
   * The rate at which the stopwatch progresses. A rate of 1 means real-time,
   * 2 means twice as fast, and 0.5 means half as fast.
   */
  rate: number;

  /**
   * The direction in which the stopwatch counts.
   * 'forward' means it counts up, 'backward' means it counts down.
   */
  direction: 'forward' | 'backward';

  /**
   * The maximum value the stopwatch can reach. Must be finite when counting
   * backward.
   */
  max: number;

  /**
   * An array of milestone values. When the stopwatch reaches a milestone, it
   * can trigger a callback or perform an action.
   */
  milestones?: number[];

  /**
   * Callback function that is called when the stopwatch is started.
   */
  onStart: () => void;

  /**
   * Callback function that is called when the stopwatch is stopped.
   */
  onStop: () => void;

  /**
   * Callback function that is called when the stopwatch is paused.
   */
  onPause: () => void;

  /**
   * Callback function that is called when the stopwatch is resumed.
   */
  onResume: () => void;

  /**
   * Callback function that is called when the stopwatch finishes.
   *
   * When counting forward, the stopwatch finishes when it reaches the maximum
   * value. When counting backward, the stopwatch finishes when it reaches zero.
   *
   * If counting forward and max is Infinity, the stopwatch will never finish.
   */
  onFinish: () => void;

  /**
   * Callback function that is called when the stopwatch reaches a milestone
   * value.
   *
   * The milestone parameter is the index ofconst { Stopwatch } = the milestone in the milestones
   * array that was reached.
   */
  onMilestone?: (milestone: number) => void;
};
```

When using the library directly from a browser script, use the
`BasementUniverseStopwatch` global:

```html
<script src="build/index.js"></script>
<script>
  const stopwatch = new BasementUniverseStopwatch({ unit: 's' });

  stopwatch.start();
  stopwatch.update();
  console.log(stopwatch.time);
</script>
```

When stopping the stopwatch, you can specify options to control whether to reset the time and paused duration:

```ts
type StopwatchStopOptions = {
  /**
   * Whether to reset the time to 0 when stopping the stopwatch.
   *
   * Default is true.
   */
  resetTime: boolean;

  /**
   * Whether to reset the paused duration to 0 when stopping the stopwatch.
   *
   * Default is true.
   */
  resetPausedDuration: boolean;
};
```
