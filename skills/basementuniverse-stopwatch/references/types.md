# Type Reference

Complete TypeScript type definitions for `@basementuniverse/stopwatch`.

## Exported Types

### `StopwatchOptions`

Configuration options for creating a stopwatch instance.

```ts
type StopwatchOptions = {
  /**
   * The unit of time used by the stopwatch. This determines how the time values
   * are interpreted and displayed.
   *
   * - 'ms': milliseconds
   * - 's': seconds (default)
   *
   * All time-related values (max, milestones, getters, adjustTime) use this unit.
   */
  unit: 'ms' | 's';

  /**
   * The rate at which the stopwatch progresses.
   *
   * - 1.0 = real-time (default)
   * - 2.0 = twice as fast (fast-forward)
   * - 0.5 = half as fast (slow-motion)
   * - 0.0 = paused (not recommended, use pause() instead)
   *
   * Negative rates are not recommended.
   */
  rate: number;

  /**
   * The direction in which the stopwatch counts.
   *
   * - 'forward': Counts from 0 up to max
   * - 'backward': Counts from max down to 0
   *
   * Default: 'forward'
   */
  direction: 'forward' | 'backward';

  /**
   * The maximum value the stopwatch can reach.
   *
   * - For forward direction: Stopwatch finishes when time >= max
   * - For backward direction: Starting point, must be finite (not Infinity)
   * - Default: Infinity
   *
   * Throws error if direction is 'backward' and max is Infinity.
   */
  max: number;

  /**
   * An array of milestone values. When the stopwatch reaches a milestone,
   * the onMilestone callback is triggered with the milestone's index.
   *
   * - Values use the configured unit ('ms' or 's')
   * - Milestones are checked during update() calls
   * - Each milestone fires only once
   * - Multiple milestones crossed in one frame fire in traversal order
   *
   * Optional.
   */
  milestones?: number[];

  /**
   * Callback function called when the stopwatch is started for the first time.
   *
   * Not called when resuming from pause (use onResume for that).
   *
   * Default: no-op function
   */
  onStart: () => void;

  /**
   * Callback function called when the stopwatch is stopped.
   *
   * Only fires if the stopwatch was actually running or paused.
   *
   * Default: no-op function
   */
  onStop: () => void;

  /**
   * Callback function called when the stopwatch is paused.
   *
   * Only fires if the stopwatch was running (not already paused).
   *
   * Default: no-op function
   */
  onPause: () => void;

  /**
   * Callback function called when the stopwatch is resumed from a paused state.
   *
   * Also called by start() if the stopwatch is currently paused.
   *
   * Default: no-op function
   */
  onResume: () => void;

  /**
   * Callback function called when the stopwatch finishes.
   *
   * Finish conditions:
   * - Forward direction: time >= max (if max is not Infinity)
   * - Backward direction: time <= 0
   *
   * Only checked during update() calls. Fires once when condition is met.
   * Automatically stops the stopwatch when finished.
   *
   * If counting forward with max = Infinity, the stopwatch will never finish.
   *
   * Default: no-op function
   */
  onFinish: () => void;

  /**
   * Callback function called when the stopwatch reaches a milestone value.
   *
   * Parameters:
   * - milestone: The index (not value) of the milestone in the milestones array
   *
   * Called during update() when crossing a milestone threshold.
   * Each milestone fires only once.
   *
   * Optional. If not provided, milestones are tracked but no callback fires.
   */
  onMilestone?: (milestone: number) => void;
};
```

---

### `StopwatchStopOptions`

Options for controlling behavior when stopping the stopwatch.

```ts
type StopwatchStopOptions = {
  /**
   * Whether to reset the time to 0 when stopping the stopwatch.
   *
   * - true: Time is reset to 0 (default)
   * - false: Time is preserved
   *
   * Default: true
   */
  resetTime: boolean;

  /**
   * Whether to reset the paused duration to 0 when stopping the stopwatch.
   *
   * - true: Paused duration is reset to 0 (default)
   * - false: Paused duration is preserved
   *
   * Default: true
   */
  resetPausedDuration: boolean;
};
```

**Note:** If both `resetTime` and `resetPausedDuration` are `false`, `stop()` behaves identically to `pause()`.

---

## Class: `Stopwatch`

Main stopwatch class exported as the default export.

```ts
export default class Stopwatch {
  /**
   * The full configuration options for this stopwatch instance.
   */
  public options: StopwatchOptions;

  /**
   * Create a new stopwatch instance.
   *
   * @param options - Optional partial configuration. Unspecified options use defaults.
   * @throws Error if direction is 'backward' and max is Infinity
   */
  constructor(options?: Partial<StopwatchOptions>);

  /**
   * Whether the stopwatch is currently running (actively timing).
   *
   * Settable: Yes
   * - Setting to true calls start()
   * - Setting to false calls stop()
   */
  get running(): boolean;
  set running(value: boolean);

  /**
   * Whether the stopwatch is currently paused.
   *
   * Settable: Yes
   * - Setting to true calls pause()
   * - Setting to false calls resume()
   */
  get paused(): boolean;
  set paused(value: boolean);

  /**
   * The current displayed time of the stopwatch.
   *
   * - Forward direction: Increases from 0 to max
   * - Backward direction: Decreases from max to 0
   *
   * Units: Configured unit ('ms' or 's')
   */
  get time(): number;

  /**
   * Total elapsed time since the stopwatch started, excluding paused time.
   *
   * Always increases from 0 to max regardless of direction.
   * Clamped to max if max is finite.
   *
   * Units: Configured unit ('ms' or 's')
   */
  get elapsed(): number;

  /**
   * Time remaining until the stopwatch finishes.
   *
   * - Forward: max - time (or Infinity if max is Infinity)
   * - Backward: time
   *
   * Units: Configured unit ('ms' or 's')
   */
  get remaining(): number;

  /**
   * Progress as a ratio between 0 and 1.
   *
   * - Forward: time / max (0 to 1)
   * - Backward: time / max (1 to 0)
   * - Special: Returns 0 if forward with max=Infinity, returns 1 if max=0
   */
  get progress(): number;

  /**
   * Total duration the stopwatch has been paused since starting.
   *
   * Increases each time the stopwatch is paused and resumed.
   *
   * Units: Configured unit ('ms' or 's')
   */
  get pausedDuration(): number;

  /**
   * Start the stopwatch.
   *
   * - If already running: no effect
   * - If paused: resumes and fires onResume
   * - Otherwise: fresh start and fires onStart
   */
  start(): void;

  /**
   * Stop the stopwatch.
   *
   * @param options - Control reset behavior
   *
   * - If not running and not paused: no effect
   * - If both reset flags are false: behaves like pause()
   * - Otherwise: stops and resets as specified, fires onStop
   */
  stop(options?: Partial<StopwatchStopOptions>): void;

  /**
   * Pause the stopwatch.
   *
   * - If not running or already paused: no effect
   * - Otherwise: pauses and fires onPause
   */
  pause(): void;

  /**
   * Resume the stopwatch from a paused state.
   *
   * Alias for start().
   */
  resume(): void;

  /**
   * Reset the stopwatch to initial state.
   *
   * Stops the stopwatch, resets time to 0, and resets paused duration to 0.
   * Alias for stop({ resetTime: true, resetPausedDuration: true }).
   */
  reset(): void;

  /**
   * Manually adjust the current time by a specified amount.
   *
   * @param amount - Amount to add (positive) or subtract (negative)
   *
   * - Does not trigger callbacks
   * - Time is clamped to [0, max]
   * - Units: Configured unit ('ms' or 's')
   *
   * Use cases: manual corrections, time penalties/bonuses
   */
  adjustTime(amount: number): void;

  /**
   * Update the stopwatch's internal state.
   *
   * CRITICAL: Must be called every frame in your game loop.
   *
   * Responsibilities:
   * - Advances internal time tracking
   * - Checks for finish condition
   * - Triggers milestone callbacks
   * - Fires onFinish when complete
   *
   * Without this call, the stopwatch will not function properly.
   */
  update(): void;
}
```

---

## Default Values

When creating a stopwatch without specifying all options:

```ts
const DEFAULT_OPTIONS = {
  unit: 's',
  rate: 1,
  direction: 'forward',
  max: Infinity,
  onStart: () => {},
  onStop: () => {},
  onPause: () => {},
  onResume: () => {},
  onFinish: () => {},
  // milestones and onMilestone are undefined by default
};

const DEFAULT_STOP_OPTIONS = {
  resetTime: true,
  resetPausedDuration: true,
};
```

---

## Type Usage Examples

### Creating with Explicit Types

```ts
import Stopwatch, { StopwatchOptions, StopwatchStopOptions } from '@basementuniverse/stopwatch';

// Full options
const options: StopwatchOptions = {
  unit: 's',
  rate: 1,
  direction: 'forward',
  max: 60,
  milestones: [15, 30, 45],
  onStart: () => console.log('Started'),
  onStop: () => console.log('Stopped'),
  onPause: () => console.log('Paused'),
  onResume: () => console.log('Resumed'),
  onFinish: () => console.log('Finished'),
  onMilestone: (index) => console.log(`Milestone ${index}`),
};

const stopwatch = new Stopwatch(options);

// Partial options (recommended)
const partialOptions: Partial<StopwatchOptions> = {
  unit: 's',
  max: 60,
  onFinish: () => console.log('Done!'),
};

const stopwatch2 = new Stopwatch(partialOptions);

// Stop options
const stopOptions: StopwatchStopOptions = {
  resetTime: false,
  resetPausedDuration: true,
};

stopwatch.stop(stopOptions);
```

### Type Guards and Assertions

```ts
function isForwardTimer(sw: Stopwatch): boolean {
  return sw.options.direction === 'forward';
}

function isBackwardTimer(sw: Stopwatch): boolean {
  return sw.options.direction === 'backward';
}

function getTimeUnit(sw: Stopwatch): 'ms' | 's' {
  return sw.options.unit;
}
```

### Building Option Objects

```ts
// Factory function with type safety
function createGameTimer(
  duration: number,
  onComplete: () => void
): Stopwatch {
  const options: Partial<StopwatchOptions> = {
    unit: 's',
    direction: 'backward',
    max: duration,
    onFinish: onComplete,
  };

  return new Stopwatch(options);
}

// With milestones
function createMilestoneTimer(
  duration: number,
  checkpoints: number[],
  onCheckpoint: (index: number) => void
): Stopwatch {
  return new Stopwatch({
    unit: 's',
    direction: 'forward',
    max: duration,
    milestones: checkpoints,
    onMilestone: onCheckpoint,
  });
}
```

---

## Import Variations

```ts
// Default import (class)
import Stopwatch from '@basementuniverse/stopwatch';

// Named imports (types)
import { StopwatchOptions, StopwatchStopOptions } from '@basementuniverse/stopwatch';

// Combined
import Stopwatch, { StopwatchOptions, StopwatchStopOptions } from '@basementuniverse/stopwatch';
```
