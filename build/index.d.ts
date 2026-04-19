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
export declare class Stopwatch {
    private static readonly DEFAULT_OPTIONS;
    private static readonly DEFAULT_STOP_OPTIONS;
    options: StopwatchOptions;
    private _running;
    private _paused;
    private _elapsedTime;
    private _pausedDuration;
    private _timeAdjustment;
    private _startedAt;
    private _pausedAt;
    private _lastObservedTime;
    private _finished;
    private _reachedMilestones;
    constructor(options?: Partial<StopwatchOptions>);
    get running(): boolean;
    set running(value: boolean);
    get paused(): boolean;
    set paused(value: boolean);
    /**
     * The current time of the stopwatch. When counting forward, this value
     * increases from 0 to max.
     *
     * When counting backward, this value decreases from max to 0.
     */
    get time(): number;
    /**
     * The total time that has elapsed since the stopwatch was started, excluding
     * any time spent paused.
     *
     * This value always increases from 0 to max, regardless of the direction of
     * the stopwatch.
     */
    get elapsed(): number;
    /**
     * The remaining time until the stopwatch finishes.
     *
     * This value always decreases from max to 0, regardless of the direction of
     * the stopwatch.
     *
     * If counting forward and max is Infinity, this will return Infinity.
     */
    get remaining(): number;
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
    get progress(): number;
    /**
     * The total duration that the stopwatch has been paused since it was started.
     *
     * This value increases by the amount of time spent paused each time the
     * stopwatch is paused and resumed.
     */
    get pausedDuration(): number;
    /**
     * Starts the stopwatch. If the stopwatch is already running, this has no
     * effect.
     *
     * If the stopwatch is paused, this will resume the stopwatch instead of
     * starting it from the beginning.
     */
    start(): void;
    /**
     * Stops the stopwatch. If the stopwatch is already stopped, this has no
     * effect.
     *
     * The options parameter allows you to specify whether to reset the time and
     * paused duration when stopping the stopwatch.
     */
    stop(options?: Partial<StopwatchStopOptions>): void;
    /**
     * Pauses the stopwatch. If the stopwatch is already paused or not running,
     * this has no effect.
     *
     * Alias for stop with resetTime: false and resetPausedDuration: false.
     */
    pause(): void;
    /**
     * Resumes the stopwatch. If the stopwatch is not paused, this has no effect.
     *
     * Alias for start.
     */
    resume(): void;
    /**
     * Resets the stopwatch to its initial state. This stops the stopwatch, resets
     * the time to 0, and resets the paused duration to 0.
     *
     * Alias for stop with resetTime: true and resetPausedDuration: true.
     */
    reset(): void;
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
    adjustTime(amount: number): void;
    /**
     * Updates the stopwatch's internal state based on the passage of time.
     */
    update(): void;
    private now;
    private getElapsedTimeAt;
    private getPausedDurationAt;
    private getTimeAt;
    private isFinishedTime;
    private syncReachedMilestones;
    private hasReachedMilestone;
    private triggerReachedMilestones;
    private get maxInternal();
    private getMilestonesInternal;
    private toInternalTime;
    private toDisplayTime;
}
