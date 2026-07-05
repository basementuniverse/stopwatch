---
name: basementuniverse-stopwatch
description: >
  Use this skill when implementing timers, countdowns, or time-tracking features in browser-based games using the @basementuniverse/stopwatch library. Covers game loop integration, timer configuration, and time-based events.
---

# Basement Universe Stopwatch

Use this skill when working with `@basementuniverse/stopwatch`.

## Overview

The `@basementuniverse/stopwatch` library provides a high-precision timer designed for browser game loops. It uses `performance.now()` for accurate timing and supports both count-up (forward) and count-down (backward) modes with configurable rates, lifecycle callbacks, and milestone tracking.

## When to Use This Skill

- Implementing timers or countdowns in browser-based games
- Creating time-limited game mechanics (e.g., timed challenges, power-up durations)
- Building speed-run or time-attack game modes
- Managing cooldowns, delays, or scheduled events in game systems
- Tracking elapsed/remaining time with pause/resume functionality
- Creating time-based progression systems with milestones

## Core Concepts

### Game Loop Integration

**Critical requirement**: Call `stopwatch.update()` every frame in your game loop:

```ts
import Stopwatch from '@basementuniverse/stopwatch';

const stopwatch = new Stopwatch({ unit: 's', direction: 'forward' });

function gameLoop() {
  stopwatch.update();  // Required for timing and callbacks
  // ... rest of game logic
  requestAnimationFrame(gameLoop);
}

stopwatch.start();
gameLoop();
```

Without `update()` calls, the stopwatch won't:
- Check for finish conditions
- Trigger milestone callbacks
- Update internal state properly

### Direction Modes

**Forward (count-up)**:
- Starts at 0, counts up to `max`
- Finishes when `time >= max` (unless `max` is `Infinity`)
- Typical use: elapsed time, speedrun timers, stopwatches

**Backward (count-down)**:
- Starts at `max`, counts down to 0
- Finishes when `time <= 0`
- `max` must be finite (throws error if `Infinity`)
- Typical use: countdown timers, time limits, cooldowns

### Time Units

All time values use the configured `unit` ('ms' or 's'):
- Constructor options (`max`, `milestones`)
- Getters (`time`, `elapsed`, `remaining`, `pausedDuration`)
- `adjustTime()` parameter

Internally uses milliseconds via `performance.now()`.

## Common Patterns

### Basic Timer (Count-up)

```ts
const timer = new Stopwatch({
  unit: 's',
  direction: 'forward',
  max: Infinity,  // Run indefinitely
});

timer.start();
// In game loop: timer.update();
console.log(timer.time);  // Current elapsed time
```

### Countdown Timer

```ts
const countdown = new Stopwatch({
  unit: 's',
  direction: 'backward',
  max: 60,  // 60 second countdown
  onFinish: () => console.log('Time is up!'),
});

countdown.start();
// In game loop: countdown.update();
console.log(countdown.remaining);  // Time left
```

### Timed Challenge with Milestones

```ts
const challenge = new Stopwatch({
  unit: 's',
  direction: 'forward',
  max: 120,
  milestones: [30, 60, 90],  // Checkpoints at 30s, 60s, 90s
  onMilestone: (index) => {
    console.log(`Checkpoint ${index + 1} reached!`);
  },
  onFinish: () => console.log('Challenge complete!'),
});
```

### Slow-Motion / Fast-Forward

```ts
const slowMo = new Stopwatch({
  unit: 's',
  rate: 0.5,  // Half speed (slow motion)
  direction: 'forward',
});

const fastForward = new Stopwatch({
  unit: 's',
  rate: 2.0,  // Double speed
  direction: 'forward',
});
```

### Time-Limited Power-Up

```ts
class PowerUp {
  private stopwatch: Stopwatch;

  activate(duration: number) {
    this.stopwatch = new Stopwatch({
      unit: 's',
      direction: 'backward',
      max: duration,
      onFinish: () => this.deactivate(),
    });
    this.stopwatch.start();
  }

  update() {
    this.stopwatch.update();  // Call in game loop
  }

  getRemainingTime(): number {
    return this.stopwatch.remaining;
  }

  deactivate() {
    // Power-up expired
  }
}
```

## State Management

### Lifecycle Control

```ts
// Start/stop
stopwatch.start();        // Begin timing
stopwatch.stop();         // Stop and reset (by default)
stopwatch.reset();        // Alias for stop with reset

// Pause/resume
stopwatch.pause();        // Pause timing (doesn't reset)
stopwatch.resume();       // Resume from paused state

// Using boolean setters
stopwatch.running = true;   // Start
stopwatch.running = false;  // Stop
stopwatch.paused = true;    // Pause
stopwatch.paused = false;   // Resume
```

### Stop Behavior

Control reset behavior when stopping:

```ts
// Default: resets time and paused duration
stopwatch.stop();

// Stop without resetting (behaves like pause)
stopwatch.stop({ resetTime: false, resetPausedDuration: false });

// Reset time but preserve paused duration
stopwatch.stop({ resetTime: true, resetPausedDuration: false });
```

### Time Adjustments

Manually adjust time without triggering callbacks:

```ts
stopwatch.adjustTime(5);   // Add 5 units (s or ms)
stopwatch.adjustTime(-2);  // Subtract 2 units

// Time is clamped to valid bounds [0, max]
```

### Reading State

```ts
stopwatch.running         // boolean: Is actively running?
stopwatch.paused          // boolean: Is paused?
stopwatch.time            // number: Current displayed time
stopwatch.elapsed         // number: Active time (excludes paused)
stopwatch.remaining       // number: Time until finish
stopwatch.progress        // number: 0-1 progress ratio
stopwatch.pausedDuration  // number: Total paused time
```

## Callbacks

All callbacks are optional:

```ts
const stopwatch = new Stopwatch({
  onStart: () => console.log('Started'),
  onStop: () => console.log('Stopped'),
  onPause: () => console.log('Paused'),
  onResume: () => console.log('Resumed'),
  onFinish: () => console.log('Finished'),
  onMilestone: (index) => console.log(`Milestone ${index}`),
});
```

**Callback triggers:**
- `onStart`: First start (not when resuming from pause)
- `onResume`: Resuming from paused state
- `onStop`: When stopwatch is stopped (if actually stopping)
- `onPause`: When paused
- `onFinish`: When finish condition is met during `update()`
- `onMilestone`: When milestone is crossed during `update()`

## Milestones

Track specific time points:

```ts
const stopwatch = new Stopwatch({
  unit: 's',
  direction: 'forward',
  milestones: [10, 20, 30],
  onMilestone: (index) => {
    // index is 0-based position in milestones array
    const value = stopwatch.options.milestones[index];
    console.log(`Reached milestone: ${value}s`);
  },
});
```

**Milestone behavior:**
- Values use the configured `unit`
- `onMilestone` receives the index (not the value)
- Only fires once per milestone
- Fires during `update()` when crossing threshold
- Multiple milestones crossed in one frame fire in traversal order
- Milestones already behind current time are marked as reached

## Progress Tracking

For UI elements (progress bars, etc.):

```ts
// Forward timer: progress increases from 0 to 1
const timer = new Stopwatch({
  direction: 'forward',
  max: 60,
});
timer.update();
const percent = timer.progress * 100;  // 0-100%

// Backward timer: progress decreases from 1 to 0
const countdown = new Stopwatch({
  direction: 'backward',
  max: 60,
});
countdown.update();
const percent = countdown.progress * 100;  // 100-0%
```

**Progress edge cases:**
- Forward with `max: Infinity` → always returns `0`
- When `max === 0` → returns `1`

## Best Practices

1. **Always call `update()` in your game loop** - Critical for proper operation
2. **Choose appropriate units** - Use 's' for gameplay timers, 'ms' for high-precision needs
3. **Set finite `max` for backward timers** - Required, throws error otherwise
4. **Use milestones for discrete events** - Better than polling time values
5. **Prefer lifecycle callbacks** - More efficient than checking state changes manually
6. **Consider `paused` time** - Use `elapsed` for active time, `time` for displayed time
7. **Use `progress` for UI** - Pre-calculated 0-1 ratio for progress bars

## Common Gotchas

- **Forgetting `update()`**: Stopwatch won't finish or trigger milestones without it
- **Backward with `Infinity`**: Throws error - backward timers need finite `max`
- **Milestone indices**: `onMilestone` receives index, not value
- **Stop behavior**: Default `stop()` resets time; use options to preserve state
- **Time adjustments**: Don't trigger callbacks; useful for external time manipulation
- **Rate changes**: Affects speed but not unit; `rate: 2` = 2x speed

## Troubleshooting

### Timer not finishing
- Ensure `update()` is called every frame
- Check that `max` is not `Infinity` for forward timers that should finish
- Verify direction matches expected behavior

### Milestones not firing
- Ensure `update()` is called every frame
- Check milestone values match configured `unit`
- Verify `onMilestone` callback is defined

### Unexpected time values
- Check configured `unit` matches expected unit
- Verify `rate` is set correctly (default: 1)
- Consider `adjustTime()` calls or manual time manipulation

## References

- Public API surface: [references/api.md](references/api.md)
- Type definitions: [references/types.md](references/types.md)
