# @basementuniverse/stopwatch (AI Quick Reference)

Browser stopwatch for game loops. Call `update()` each frame.

## Minimal usage

```ts
import Stopwatch from '@basementuniverse/stopwatch';

const sw = new Stopwatch({ unit: 's', direction: 'forward', max: Infinity });

function loop() {
	sw.update();
	requestAnimationFrame(loop);
}

sw.start();
loop();
```

## Constructor

```ts
new Stopwatch(options?: Partial<StopwatchOptions>)
```

## Types

```ts
type StopwatchOptions = {
	unit: 'ms' | 's'; // default 's'
	rate: number; // default 1; multiplier; 2 = 2x, 0.5 = 0.5x
	direction: 'forward' | 'backward'; // default 'forward'
	max: number; // default Infinity; must be finite for backward
	milestones?: number[];
	onStart: () => void;
	onStop: () => void;
	onPause: () => void;
	onResume: () => void;
	onFinish: () => void;
	onMilestone?: (milestoneIndex: number) => void;
};

type StopwatchStopOptions = {
	resetTime: boolean; // default true
	resetPausedDuration: boolean; // default true
};
```

## State getters

- `running: boolean`
- `paused: boolean`
- `time: number` (current displayed time)
- `elapsed: number` (active run time, excludes paused time)
- `remaining: number` (to finish; `Infinity` for forward + infinite max)
- `progress: number` (`time / max`; for forward+`Infinity` returns `0`; if `max===0` returns `1`)
- `pausedDuration: number` (total paused time)

Units returned by getters match `unit`.

## Writable flags

- `running = true` -> `start()`
- `running = false` -> `stop()`
- `paused = true` -> `pause()`
- `paused = false` -> `resume()`

## Methods

- `start()`
	- no-op if already running
	- resumes if paused (fires `onResume`)
	- fresh start fires `onStart`
- `stop(options?)`
	- no-op if not running and not paused
	- default resets time + paused duration
	- if both reset flags are `false`, behaves like `pause()`
	- always fires `onStop` when a stop actually occurs
- `pause()`
	- no-op unless currently running
	- fires `onPause`
- `resume()`
	- alias of `start()`
- `reset()`
	- alias of `stop({ resetTime: true, resetPausedDuration: true })`
- `adjustTime(amount)`
	- adds/subtracts displayed time offset in current `unit`
	- does not fire callbacks
	- clamps to valid bounds
- `update()`
	- required to advance/check milestones/finish
	- if finish reached, sets stopped state and fires `onFinish` once

## Finish semantics

- `direction: 'forward'`: finishes at `time >= max` (unless `max === Infinity`, then never finishes)
- `direction: 'backward'`: starts from `max`, finishes at `time <= 0`

## Milestones

- Optional `milestones` values use same `unit` as options/getters.
- `onMilestone` receives the milestone index (not value).
- Triggered only during `update()` when crossing unreached milestones.
- If time jumps across several milestones in one frame, callbacks fire in traversal order.
- Milestones already behind current time are considered reached and will not fire later.

## Constraints / notes

- `direction: 'backward'` with `max: Infinity` throws.
- Uses `performance.now()` internally (browser/high-res timer).
- Internal clock is milliseconds; `unit: 's'` is converted automatically.
