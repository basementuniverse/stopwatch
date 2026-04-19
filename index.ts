export type StopwatchOptions = {
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

export type StopwatchStopOptions = {
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

export class Stopwatch {
  private static readonly DEFAULT_OPTIONS: StopwatchOptions = {
    unit: 's',
    rate: 1,
    direction: 'forward',
    max: Infinity,
    onStart: () => {},
    onStop: () => {},
    onPause: () => {},
    onResume: () => {},
    onFinish: () => {},
  };

  private static readonly DEFAULT_STOP_OPTIONS: StopwatchStopOptions = {
    resetTime: true,
    resetPausedDuration: true,
  };

  public options: StopwatchOptions;

  private _running: boolean = false;
  private _paused: boolean = false;
  private _elapsedTime: number = 0;
  private _pausedDuration: number = 0;
  private _timeAdjustment: number = 0;
  private _startedAt: number | null = null;
  private _pausedAt: number | null = null;
  private _lastObservedTime: number;
  private _finished: boolean = false;
  private _reachedMilestones: Set<number> = new Set();

  public constructor(options?: Partial<StopwatchOptions>) {
    this.options = { ...Stopwatch.DEFAULT_OPTIONS, ...(options ?? {}) };
    this._lastObservedTime =
      this.options.direction === 'backward' ? this.maxInternal : 0;
    this.syncReachedMilestones(this._lastObservedTime);

    if (
      this.options.direction === 'backward' &&
      this.options.max === Infinity
    ) {
      throw new Error(
        'Max must be a finite number when direction is backward.'
      );
    }
  }

  public get running(): boolean {
    return this._running;
  }

  public set running(value: boolean) {
    if (value) {
      this.start();
      return;
    }

    this.stop();
  }

  public get paused(): boolean {
    return this._paused;
  }

  public set paused(value: boolean) {
    if (value) {
      this.pause();
      return;
    }

    this.resume();
  }

  /**
   * The current time of the stopwatch. When counting forward, this value
   * increases from 0 to max.
   *
   * When counting backward, this value decreases from max to 0.
   */
  public get time(): number {
    return this.toDisplayTime(this.getTimeAt(this.now()));
  }

  /**
   * The total time that has elapsed since the stopwatch was started, excluding
   * any time spent paused.
   *
   * This value always increases from 0 to max, regardless of the direction of
   * the stopwatch.
   */
  public get elapsed(): number {
    const elapsedTime = this.getElapsedTimeAt(this.now());
    const maxInternal = this.maxInternal;

    if (maxInternal === Infinity) {
      return this.toDisplayTime(elapsedTime);
    }

    return this.toDisplayTime(Math.min(elapsedTime, maxInternal));
  }

  /**
   * The remaining time until the stopwatch finishes.
   *
   * This value always decreases from max to 0, regardless of the direction of
   * the stopwatch.
   *
   * If counting forward and max is Infinity, this will return Infinity.
   */
  public get remaining(): number {
    const maxInternal = this.maxInternal;

    if (maxInternal === Infinity) {
      return Infinity;
    }

    const time = this.getTimeAt(this.now());

    if (this.options.direction === 'forward') {
      return this.toDisplayTime(Math.max(0, maxInternal - time));
    }

    return this.toDisplayTime(time);
  }

  /**
   * The progress of the stopwatch as a value between 0 and 1, representing the
   * percentage of time elapsed relative to the maximum time.
   *
   * When counting forward, this value increases from 0 to 1 as time goes from
   * 0 to max.
   *
   * When counting backward, this value decreases from 1 to 0 as time goes from
   * max to 0.
   *
   * If counting forward and max is Infinity, this will return 0.
   */
  public get progress(): number {
    const maxInternal = this.maxInternal;

    if (maxInternal === Infinity) {
      return 0;
    }

    const time = this.getTimeAt(this.now());

    return maxInternal === 0 ? 1 : time / maxInternal;
  }

  /**
   * The total duration that the stopwatch has been paused since it was started.
   *
   * This value increases by the amount of time spent paused each time the
   * stopwatch is paused and resumed.
   */
  public get pausedDuration(): number {
    return this.toDisplayTime(this.getPausedDurationAt(this.now()));
  }

  /**
   * Starts the stopwatch. If the stopwatch is already running, this has no
   * effect.
   *
   * If the stopwatch is paused, this will resume the stopwatch instead of
   * starting it from the beginning.
   */
  public start(): void {
    if (this._running) {
      return;
    }

    const now = this.now();
    const currentTime = this.getTimeAt(now);

    if (this._paused) {
      if (this._pausedAt !== null) {
        this._pausedDuration += now - this._pausedAt;
      }

      this._paused = false;
      this._pausedAt = null;
      this._running = true;
      this._startedAt = now;
      this._lastObservedTime = currentTime;
      this._finished = this.isFinishedTime(currentTime);
      this.options.onResume();
      return;
    }

    this._running = true;
    this._paused = false;
    this._startedAt = now;
    this._lastObservedTime = currentTime;
    this._finished = this.isFinishedTime(currentTime);
    this.options.onStart();
  }

  /**
   * Stops the stopwatch. If the stopwatch is already stopped, this has no
   * effect.
   *
   * The options parameter allows you to specify whether to reset the time and
   * paused duration when stopping the stopwatch.
   */
  public stop(options?: Partial<StopwatchStopOptions>): void {
    const stopOptions = {
      ...Stopwatch.DEFAULT_STOP_OPTIONS,
      ...(options ?? {}),
    };

    if (!this._running && !this._paused) {
      return;
    }

    if (!stopOptions.resetTime && !stopOptions.resetPausedDuration) {
      this.pause();
      return;
    }

    const now = this.now();

    if (this._running) {
      this._elapsedTime = this.getElapsedTimeAt(now);
    }

    if (this._paused && this._pausedAt !== null) {
      this._pausedDuration += now - this._pausedAt;
    }

    this._running = false;
    this._paused = false;
    this._startedAt = null;
    this._pausedAt = null;

    if (stopOptions.resetTime) {
      this._elapsedTime = 0;
      this._timeAdjustment = 0;
      this._finished = false;
    }

    if (stopOptions.resetPausedDuration) {
      this._pausedDuration = 0;
    }

    this._lastObservedTime = this.getTimeAt(now);
    this.syncReachedMilestones(this._lastObservedTime);
    this._finished = this.isFinishedTime(this._lastObservedTime);
    this.options.onStop();
  }

  /**
   * Pauses the stopwatch. If the stopwatch is already paused or not running,
   * this has no effect.
   *
   * Alias for stop with resetTime: false and resetPausedDuration: false.
   */
  public pause(): void {
    if (!this._running || this._paused) {
      return;
    }

    const now = this.now();

    this._elapsedTime = this.getElapsedTimeAt(now);
    this._running = false;
    this._paused = true;
    this._startedAt = null;
    this._pausedAt = now;
    this._lastObservedTime = this.getTimeAt(now);
    this._finished = this.isFinishedTime(this._lastObservedTime);
    this.options.onPause();
  }

  /**
   * Resumes the stopwatch. If the stopwatch is not paused, this has no effect.
   *
   * Alias for start.
   */
  public resume(): void {
    this.start();
  }

  /**
   * Resets the stopwatch to its initial state. This stops the stopwatch, resets
   * the time to 0, and resets the paused duration to 0.
   *
   * Alias for stop with resetTime: true and resetPausedDuration: true.
   */
  public reset(): void {
    this.stop({ resetTime: true, resetPausedDuration: true });
  }

  /**
   * Adjusts the current time of the stopwatch by a specified amount. This can
   * be used to manually set the time or to apply a time correction.
   *
   * The amount parameter can be positive or negative. A positive amount will
   * increase the time, while a negative amount will decrease the time.
   *
   * If the resulting time exceeds the maximum time when counting forward, it
   * will be set to the maximum time. If the resulting time is less than 0 when
   * counting backward, it will be set to 0.
   *
   * This method does not affect the elapsed time or paused duration, and it
   * does not trigger any callbacks.
   */
  public adjustTime(amount: number): void {
    this._timeAdjustment += this.toInternalTime(amount);
    this._lastObservedTime = this.getTimeAt(this.now());
    this.syncReachedMilestones(this._lastObservedTime);
    this._finished = this.isFinishedTime(this._lastObservedTime);
  }

  /**
   * Updates the stopwatch's internal state based on the passage of time.
   */
  public update(): void {
    if (!this._running) {
      return;
    }

    const now = this.now();
    const previousTime = this._lastObservedTime;

    this._elapsedTime = this.getElapsedTimeAt(now);
    this._startedAt = now;

    const currentTime = this.getTimeAt(now);

    this.triggerReachedMilestones(previousTime, currentTime);

    this._lastObservedTime = currentTime;

    if (!this._finished && this.isFinishedTime(currentTime)) {
      this._running = false;
      this._paused = false;
      this._startedAt = null;
      this._pausedAt = null;
      this._finished = true;
      this.options.onFinish();
    }
  }

  private now(): number {
    return performance.now();
  }

  private getElapsedTimeAt(now: number): number {
    if (!this._running || this._startedAt === null) {
      return Math.max(0, this._elapsedTime);
    }

    return Math.max(
      0,
      this._elapsedTime + (now - this._startedAt) * this.options.rate
    );
  }

  private getPausedDurationAt(now: number): number {
    if (!this._paused || this._pausedAt === null) {
      return this._pausedDuration;
    }

    return this._pausedDuration + (now - this._pausedAt);
  }

  private getTimeAt(now: number): number {
    const effectiveElapsedTime =
      this.getElapsedTimeAt(now) + this._timeAdjustment;
    const maxInternal = this.maxInternal;

    if (this.options.direction === 'forward') {
      if (maxInternal === Infinity) {
        return Math.max(0, effectiveElapsedTime);
      }

      return Math.min(Math.max(0, effectiveElapsedTime), maxInternal);
    }

    return Math.min(
      maxInternal,
      Math.max(0, maxInternal - effectiveElapsedTime)
    );
  }

  private isFinishedTime(time: number): boolean {
    const maxInternal = this.maxInternal;

    if (this.options.direction === 'forward') {
      return maxInternal !== Infinity && time >= maxInternal;
    }

    return time <= 0;
  }

  private syncReachedMilestones(time: number): void {
    this._reachedMilestones.clear();

    if (!this.options.milestones) {
      return;
    }

    for (const [index, milestone] of this.getMilestonesInternal().entries()) {
      if (this.hasReachedMilestone(time, milestone)) {
        this._reachedMilestones.add(index);
      }
    }
  }

  private hasReachedMilestone(time: number, milestone: number): boolean {
    if (this.options.direction === 'forward') {
      return time >= milestone;
    }

    return time <= milestone;
  }

  private triggerReachedMilestones(
    previousTime: number,
    currentTime: number
  ): void {
    if (!this.options.milestones || !this.options.onMilestone) {
      return;
    }

    const reachedMilestones = this.getMilestonesInternal()
      .map((milestone, index) => ({ milestone, index }))
      .filter(({ milestone, index }) => {
        if (this._reachedMilestones.has(index)) {
          return false;
        }

        if (this.options.direction === 'forward') {
          return milestone > previousTime && milestone <= currentTime;
        }

        return milestone < previousTime && milestone >= currentTime;
      })
      .sort((a, b) => {
        if (a.milestone === b.milestone) {
          return a.index - b.index;
        }

        return this.options.direction === 'forward'
          ? a.milestone - b.milestone
          : b.milestone - a.milestone;
      });

    for (const { index } of reachedMilestones) {
      this._reachedMilestones.add(index);
      this.options.onMilestone(index);
    }
  }

  private get maxInternal(): number {
    if (this.options.max === Infinity) {
      return Infinity;
    }

    return this.toInternalTime(this.options.max);
  }

  private getMilestonesInternal(): number[] {
    if (!this.options.milestones) {
      return [];
    }

    return this.options.milestones.map(milestone =>
      this.toInternalTime(milestone)
    );
  }

  private toInternalTime(value: number): number {
    if (value === Infinity) {
      return Infinity;
    }

    return this.options.unit === 's' ? value * 1000 : value;
  }

  private toDisplayTime(value: number): number {
    if (value === Infinity) {
      return Infinity;
    }

    return this.options.unit === 's' ? value / 1000 : value;
  }
}
