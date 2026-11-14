/** PR defaults; nightly and failure reproduction opt in through the environment. */
// A failing run prints its seed; FC_SEED=<seed> FC_NUM_RUNS=<n> reproduces it.
export const numRuns = Number(process.env.FC_NUM_RUNS ?? 100);
export const seed = process.env.FC_SEED === undefined ? undefined : Number(process.env.FC_SEED);
