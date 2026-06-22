import { useState } from "react";
import { isCreatorRole, type Exercise, type User } from "../../psy/types";

function average(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((total, value) => total + value, 0) / values.length;
}

function formatMetric(value: number, digits = 1) {
  if (!Number.isFinite(value)) {
    return "0";
  }

  return value % 1 === 0 ? String(value) : value.toFixed(digits);
}

function isClosed(exercise: Exercise) {
  return new Date(exercise.closesAt).getTime() <= Date.now();
}

export default function AnalyticsPage({
  accounts,
  activeUser,
  formatDateTime,
  sortedExercises
}: {
  accounts: User[];
  activeUser: User;
  formatDateTime: (value: string) => string;
  sortedExercises: Exercise[];
}) {
  const [exerciseScope, setExerciseScope] = useState<"all" | "active" | "closed">("all");
  const viewerAccounts = accounts.filter((account) => account.role === "viewer");
  const creatorAccounts = accounts.filter((account) => isCreatorRole(account.role));

  const activeExercises = sortedExercises.filter((exercise) => !isClosed(exercise));
  const closedExercises = sortedExercises.filter((exercise) => isClosed(exercise));
  const visibleExercises =
    exerciseScope === "active"
      ? activeExercises
      : exerciseScope === "closed"
        ? closedExercises
        : sortedExercises;

  const totalPredictions = visibleExercises.reduce((total, exercise) => total + exercise.predictions.length, 0);
  const totalScores = visibleExercises.reduce((total, exercise) => total + exercise.scores.length, 0);
  const scoreValues = visibleExercises.flatMap((exercise) => exercise.scores.map((score) => score.accuracy));
  const visibleClosedExercises = visibleExercises.filter((exercise) => exercise.scores.length >= 0 && isClosed(exercise));
  const uniquePredictors = new Set(
    visibleExercises.flatMap((exercise) => exercise.predictions.map((prediction) => prediction.userId))
  );
  const uniqueScorers = new Set(visibleExercises.flatMap((exercise) => exercise.scores.map((score) => score.userId)));
  const predictionCoverage = viewerAccounts.length > 0 ? (uniquePredictors.size / viewerAccounts.length) * 100 : 0;
  const scoringCoverage = viewerAccounts.length > 0 ? (uniqueScorers.size / viewerAccounts.length) * 100 : 0;

  const exerciseSummaries = visibleExercises.map((exercise) => {
    const exerciseScores = exercise.scores;
    const scoreAverage = average(exerciseScores.map((score) => score.accuracy));
    const creator = accounts.find((account) => account.id === exercise.creatorId);

    return {
      id: exercise.id,
      title: exercise.title,
      creatorId: exercise.creatorId,
      creatorName: creator?.name ?? "Unknown creator",
      blindCue: exercise.blindCue,
      closesAt: exercise.closesAt,
      isClosed: isClosed(exercise),
      predictionCount: exercise.predictions.length,
      scoreCount: exerciseScores.length,
      scoreAverage
    };
  });

  const mostActiveExercise = exerciseSummaries
    .slice()
    .sort((left, right) => right.predictionCount - left.predictionCount || right.scoreCount - left.scoreCount)[0];
  const unscoredClosedExercises = exerciseSummaries.filter((exercise) => exercise.isClosed && exercise.scoreCount === 0);
  const fullyScoredClosedExercises = exerciseSummaries.filter((exercise) => exercise.isClosed && exercise.scoreCount > 0);
  const archiveScoringRate =
    visibleClosedExercises.length > 0 ? (fullyScoredClosedExercises.length / visibleClosedExercises.length) * 100 : 0;
  const averagePredictionsPerClosedExercise =
    visibleClosedExercises.length > 0
      ? visibleClosedExercises.reduce((total, exercise) => total + exercise.predictions.length, 0) /
        visibleClosedExercises.length
      : 0;
  const averageScoresPerClosedExercise =
    visibleClosedExercises.length > 0
      ? visibleClosedExercises.reduce((total, exercise) => total + exercise.scores.length, 0) / visibleClosedExercises.length
      : 0;

  const viewerPerformance = viewerAccounts
    .map((viewer) => {
      const predictionIds = new Set(
        visibleExercises.flatMap((exercise) =>
          exercise.predictions.filter((prediction) => prediction.userId === viewer.id).map((prediction) => prediction.id)
        )
      );
      const predictionCount = predictionIds.size;
      const receivedScores = visibleExercises.flatMap((exercise) =>
        exercise.scores.filter((score) => predictionIds.has(score.predictionId)).map((score) => score.accuracy)
      );
      const scoredPredictionIds = new Set(
        visibleExercises.flatMap((exercise) =>
          exercise.scores.filter((score) => predictionIds.has(score.predictionId)).map((score) => score.predictionId)
        )
      );
      const scoringActions = visibleExercises.reduce(
        (total, exercise) => total + exercise.scores.filter((score) => score.userId === viewer.id).length,
        0
      );

      return {
        id: viewer.id,
        name: viewer.name,
        predictionCount,
        scoredPredictionCount: scoredPredictionIds.size,
        averageAccuracy: average(receivedScores),
        scoringActions
      };
    })
    .sort(
      (left, right) =>
        right.predictionCount - left.predictionCount ||
        right.averageAccuracy - left.averageAccuracy ||
        right.scoringActions - left.scoringActions
    );

  const creatorPerformance = creatorAccounts
    .map((creator) => {
      const createdExercises = exerciseSummaries.filter((exercise) => exercise.creatorId === creator.id);

      return {
        id: creator.id,
        name: creator.name,
        exerciseCount: createdExercises.length,
        predictionCount: createdExercises.reduce((total, exercise) => total + exercise.predictionCount, 0),
        averagePredictionPerExercise: average(createdExercises.map((exercise) => exercise.predictionCount))
      };
    })
    .sort((left, right) => right.predictionCount - left.predictionCount || right.exerciseCount - left.exerciseCount);

  const strongestPredictions = sortedExercises
    .filter((exercise) => visibleExercises.some((candidate) => candidate.id === exercise.id))
    .flatMap((exercise) =>
      exercise.predictions.map((prediction) => {
        const predictionScores = exercise.scores.filter((score) => score.predictionId === prediction.id);
        const viewer = accounts.find((account) => account.id === prediction.userId);

        return {
          predictionId: prediction.id,
          exerciseTitle: exercise.title,
          viewerName: viewer?.name ?? "Unknown viewer",
          submittedAt: prediction.submittedAt,
          averageAccuracy: average(predictionScores.map((score) => score.accuracy)),
          scoreCount: predictionScores.length
        };
      })
    )
    .filter((entry) => entry.scoreCount > 0)
    .sort((left, right) => right.averageAccuracy - left.averageAccuracy || right.scoreCount - left.scoreCount)
    .slice(0, 5);

  const creatorSnapshot = creatorPerformance.find((creator) => creator.id === activeUser.id);
  const viewerSnapshot = viewerPerformance.find((viewer) => viewer.id === activeUser.id);
  const activeUserCreatedExercises = exerciseSummaries.filter((exercise) => exercise.creatorId === activeUser.id);
  const activeUserPredictions = visibleExercises.flatMap((exercise) =>
    exercise.predictions.filter((prediction) => prediction.userId === activeUser.id).map((prediction) => ({
      exerciseId: exercise.id,
      predictionId: prediction.id
    }))
  );
  const activeUserPredictionIds = new Set(activeUserPredictions.map((prediction) => prediction.predictionId));
  const activeUserPendingScores =
    activeUser.role === "viewer"
      ? activeUserPredictions.filter(
          (prediction) =>
            !visibleExercises.some((exercise) =>
              exercise.scores.some((score) => score.predictionId === prediction.predictionId)
            )
        ).length
      : 0;
  const creatorAttentionCount =
    isCreatorRole(activeUser.role)
      ? activeUserCreatedExercises.filter((exercise) => exercise.isClosed && exercise.scoreCount === 0).length
      : 0;
  const underEngagedActiveExercises = exerciseSummaries.filter(
    (exercise) => !exercise.isClosed && exercise.predictionCount < Math.max(1, Math.round(predictionCoverage / 25))
  );
  const scoringBacklog = unscoredClosedExercises.slice(0, 3);
  const activitySnapshot = [
    {
      label: "Open sessions",
      value: activeExercises.length,
      detail: "Accepting predictions now."
    },
    {
      label: "Closed archive",
      value: visibleClosedExercises.length,
      detail: "Revealed sessions in the current scope."
    },
    {
      label: "Predictions / closed session",
      value: formatMetric(averagePredictionsPerClosedExercise),
      detail: "Average archive participation depth."
    },
    {
      label: "Scores / closed session",
      value: formatMetric(averageScoresPerClosedExercise),
      detail: "Average review depth after reveal."
    }
  ];
  const scopeLabel =
    exerciseScope === "active" ? "active sessions only" : exerciseScope === "closed" ? "closed archive only" : "all sessions";

  return (
    <>
      <section className="hero-card">
        <div className="hero-copy">
          <span className="eyebrow">Analytics</span>
          <h1>Practice telemetry for blind sessions, submissions, and delayed scoring.</h1>
          <p>
            This view summarizes exercise throughput, participation, and scoring quality from the shared backend
            dataset used by the feed, workspace, and review archive.
          </p>
          <div className="analytics-filter-bar" aria-label="Analytics scope">
            <button
              className={`analytics-filter-chip${exerciseScope === "all" ? " is-active" : ""}`}
              onClick={() => setExerciseScope("all")}
              type="button"
            >
              All sessions
            </button>
            <button
              className={`analytics-filter-chip${exerciseScope === "active" ? " is-active" : ""}`}
              onClick={() => setExerciseScope("active")}
              type="button"
            >
              Active only
            </button>
            <button
              className={`analytics-filter-chip${exerciseScope === "closed" ? " is-active" : ""}`}
              onClick={() => setExerciseScope("closed")}
              type="button"
            >
              Closed only
            </button>
          </div>
        </div>

        <div className="hero-panel">
          <span>Current account</span>
          <strong>{activeUser.name}</strong>
          <p>{isCreatorRole(activeUser.role) ? "Publishing analytics focus" : "Viewer analytics focus"}</p>
          <div className="hero-panel-actions">
            <span>Your snapshot</span>
            <strong>
              {isCreatorRole(activeUser.role)
                ? `${creatorSnapshot?.exerciseCount ?? 0} exercises published`
                : `${viewerSnapshot?.predictionCount ?? 0} predictions submitted`}
            </strong>
            <p>
              {isCreatorRole(activeUser.role)
                ? `${formatMetric(creatorSnapshot?.averagePredictionPerExercise ?? 0)} predictions per exercise on average.`
                : `${formatMetric(viewerSnapshot?.averageAccuracy ?? 0)} / 5 average accuracy on scored predictions.`}
            </p>
            <p>Viewing {scopeLabel}.</p>
          </div>
        </div>
      </section>

      <section className="metrics-grid">
        <article className="metric-card">
          <span>Total exercises</span>
          <strong>{visibleExercises.length}</strong>
          <p>{activeExercises.length} active and {closedExercises.length} closed in the full dataset.</p>
        </article>
        <article className="metric-card">
          <span>Total predictions</span>
          <strong>{totalPredictions}</strong>
          <p>{formatMetric(average(visibleExercises.map((exercise) => exercise.predictions.length)))} per exercise.</p>
        </article>
        <article className="metric-card">
          <span>Total scores</span>
          <strong>{totalScores}</strong>
          <p>{formatMetric(average(scoreValues))} / 5 mean archive accuracy.</p>
        </article>
        <article className="metric-card">
          <span>Viewer participation</span>
          <strong>{formatMetric(predictionCoverage)}%</strong>
          <p>{uniquePredictors.size} of {viewerAccounts.length} viewers have submitted at least once.</p>
        </article>
        <article className="metric-card">
          <span>Scoring participation</span>
          <strong>{formatMetric(scoringCoverage)}%</strong>
          <p>{uniqueScorers.size} of {viewerAccounts.length} viewers have scored the archive.</p>
        </article>
        <article className="metric-card">
          <span>Most active exercise</span>
          <strong>{mostActiveExercise?.title ?? "No activity yet"}</strong>
          <p>
            {mostActiveExercise
              ? `${mostActiveExercise.predictionCount} predictions and ${mostActiveExercise.scoreCount} scores.`
              : "Open a target to begin collecting activity."}
          </p>
        </article>
      </section>

      <section className="analytics-grid analytics-grid-tight">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Operations</span>
              <h2>Scope snapshot</h2>
            </div>
            <p>Quick throughput indicators for the current analytics filter.</p>
          </div>
          <div className="snapshot-grid">
            {activitySnapshot.map((item) => (
              <div className="snapshot-card" key={item.label}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
                <p>{item.detail}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Attention Queue</span>
              <h2>What needs action next</h2>
            </div>
            <p>Surface archive backlog and live sessions that need more participation.</p>
          </div>
          <div className="analytics-list">
            <div className="analytics-row">
              <div>
                <strong>
                  {isCreatorRole(activeUser.role)
                    ? `${creatorAttentionCount} of your closed exercises are waiting on scores`
                    : `${activeUserPendingScores} of your predictions are still unscored`}
                </strong>
                <p>
                  {isCreatorRole(activeUser.role)
                    ? "Use review messaging and archive prompts to pull in post-reveal scoring."
                    : "Return to the archive after sessions close to compare your hits against scored outcomes."}
                </p>
              </div>
              <span className="analytics-pill">
                {isCreatorRole(activeUser.role) ? `${creatorAttentionCount} pending` : `${activeUserPendingScores} pending`}
              </span>
            </div>

            {scoringBacklog.length > 0 ? (
              scoringBacklog.map((exercise) => (
                <div className="analytics-row" key={exercise.id}>
                  <div>
                    <strong>{exercise.title}</strong>
                    <p>
                      Closed {formatDateTime(exercise.closesAt)} | {exercise.predictionCount} prediction
                      {exercise.predictionCount === 1 ? "" : "s"} waiting on archive review
                    </p>
                  </div>
                  <span className="analytics-pill">Needs scoring</span>
                </div>
              ))
            ) : (
              <div className="empty-card">
                <strong>No archive backlog in this scope</strong>
                <p>Closed sessions already have at least one score recorded.</p>
              </div>
            )}

            {underEngagedActiveExercises.length > 0 ? (
              underEngagedActiveExercises.slice(0, 2).map((exercise) => (
                <div className="analytics-row" key={`${exercise.id}-engagement`}>
                  <div>
                    <strong>{exercise.title}</strong>
                    <p>
                      {exercise.predictionCount} live prediction{exercise.predictionCount === 1 ? "" : "s"} so far | closes{" "}
                      {formatDateTime(exercise.closesAt)}
                    </p>
                  </div>
                  <span className="analytics-pill">Low activity</span>
                </div>
              ))
            ) : null}
          </div>
        </article>
      </section>

      <section className="analytics-grid analytics-grid-tight">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Archive Health</span>
              <h2>Scoring readiness</h2>
            </div>
            <p>Track whether closed sessions are actually being reviewed after reveal.</p>
          </div>
          <div className="analytics-list">
            <div className="analytics-row">
              <div>
                <strong>{formatMetric(archiveScoringRate)}% of closed exercises scored</strong>
                <p>{fullyScoredClosedExercises.length} closed sessions have at least one archive score.</p>
              </div>
              <span className="analytics-pill">{visibleClosedExercises.length} closed</span>
            </div>
            <div className="analytics-row">
              <div>
                <strong>{unscoredClosedExercises.length} closed exercises need scoring</strong>
                <p>These sessions are revealed but still have no community accuracy ratings.</p>
              </div>
              <span className="analytics-pill">
                {unscoredClosedExercises.length > 0 ? "Attention" : "Healthy"}
              </span>
            </div>
          </div>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Personal View</span>
              <h2>{isCreatorRole(activeUser.role) ? "Publishing snapshot" : "Viewer snapshot"}</h2>
            </div>
            <p>Keep the current account oriented around the work that matters next.</p>
          </div>
          <div className="analytics-list">
            <div className="analytics-row">
              <div>
                <strong>
                  {isCreatorRole(activeUser.role)
                    ? `${activeUserCreatedExercises.length} exercises in scope`
                    : `${activeUserPredictions.length} predictions in scope`}
                </strong>
                <p>
                  {isCreatorRole(activeUser.role)
                    ? `${creatorAttentionCount} of your closed sessions still need scores.`
                    : `${activeUserPredictionIds.size} submitted predictions are visible in the current filter.`}
                </p>
              </div>
              <span className="analytics-pill">
                {isCreatorRole(activeUser.role)
                  ? `${formatMetric(creatorSnapshot?.averagePredictionPerExercise ?? 0)} / exercise`
                  : `${formatMetric(viewerSnapshot?.averageAccuracy ?? 0)} / 5`}
              </span>
            </div>
            <div className="analytics-row">
              <div>
                <strong>
                  {isCreatorRole(activeUser.role)
                    ? `${creatorSnapshot?.predictionCount ?? 0} total predictions received`
                    : `${viewerSnapshot?.scoringActions ?? 0} archive scoring actions made`}
                </strong>
                <p>
                  {isCreatorRole(activeUser.role)
                    ? "Use this to compare publishing output against response volume."
                    : `${activeUserPendingScores} prediction${activeUserPendingScores === 1 ? "" : "s"} still waiting for scores.`}
                </p>
              </div>
              <span className="analytics-pill">
                {isCreatorRole(activeUser.role)
                  ? `${formatMetric(predictionCoverage)}% viewer reach`
                  : `${formatMetric(scoringCoverage)}% scoring coverage`}
              </span>
            </div>
          </div>
        </article>
      </section>

      <section className="analytics-grid">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Leaderboard</span>
              <h2>Viewer performance</h2>
            </div>
            <p>Prediction count, scored coverage, and average accuracy once closed exercises collect ratings.</p>
          </div>

          <div className="analytics-list">
            {viewerPerformance.length > 0 ? (
              viewerPerformance.map((viewer) => (
                <div className="analytics-row" key={viewer.id}>
                  <div>
                    <strong>{viewer.name}</strong>
                    <p>
                      {viewer.predictionCount} predictions | {viewer.scoredPredictionCount} scored | {viewer.scoringActions} scoring
                      action{viewer.scoringActions === 1 ? "" : "s"}
                    </p>
                  </div>
                  <span className="analytics-pill">{formatMetric(viewer.averageAccuracy)} / 5</span>
                </div>
              ))
            ) : (
              <div className="empty-card">
                <strong>No viewer activity in this scope</strong>
                <p>Switch the analytics filter or wait for new prediction submissions.</p>
              </div>
            )}
          </div>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Creators</span>
              <h2>Publishing reach</h2>
            </div>
            <p>How many exercises each creator has opened and how much participant activity those sessions attracted.</p>
          </div>

          <div className="analytics-list">
            {creatorPerformance.length > 0 ? (
              creatorPerformance.map((creator) => (
                <div className="analytics-row" key={creator.id}>
                  <div>
                    <strong>{creator.name}</strong>
                    <p>
                      {creator.exerciseCount} exercises | {creator.predictionCount} predictions received
                    </p>
                  </div>
                  <span className="analytics-pill">{formatMetric(creator.averagePredictionPerExercise)} / exercise</span>
                </div>
              ))
            ) : (
              <div className="empty-card">
                <strong>No creator activity in this scope</strong>
                <p>Open a target or widen the filter to compare publishing activity.</p>
              </div>
            )}
          </div>
        </article>
      </section>

      <section className="analytics-grid">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Exercise Health</span>
              <h2>Recent sessions</h2>
            </div>
            <p>Current blind sessions and archive entries with their participation and scoring depth.</p>
          </div>

          <div className="analytics-table">
            {exerciseSummaries.length > 0 ? (
              exerciseSummaries.slice(0, 6).map((exercise) => (
                <div className="analytics-table-row" key={exercise.id}>
                  <div>
                    <strong>{exercise.title}</strong>
                    <p>
                      {exercise.blindCue} | {exercise.creatorName}
                    </p>
                  </div>
                  <div>
                    <strong>{exercise.predictionCount}</strong>
                    <p>predictions</p>
                  </div>
                  <div>
                    <strong>{exercise.scoreCount}</strong>
                    <p>scores</p>
                  </div>
                  <div>
                    <strong>{exercise.scoreCount > 0 ? `${formatMetric(exercise.scoreAverage)} / 5` : "Unscored"}</strong>
                    <p>{exercise.isClosed ? `Closed ${formatDateTime(exercise.closesAt)}` : `Closes ${formatDateTime(exercise.closesAt)}`}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-card">
                <strong>No exercises match this filter</strong>
                <p>Change the scope above to compare active sessions, archive sessions, or the full dataset.</p>
              </div>
            )}
          </div>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Top Scores</span>
              <h2>Strongest predictions</h2>
            </div>
            <p>The highest-rated predictions once the community archive has enough scoring data.</p>
          </div>

          <div className="analytics-list">
            {strongestPredictions.length > 0 ? (
              strongestPredictions.map((prediction) => (
                <div className="analytics-row" key={prediction.predictionId}>
                  <div>
                    <strong>{prediction.viewerName}</strong>
                    <p>
                      {prediction.exerciseTitle} | {formatDateTime(prediction.submittedAt)} | {prediction.scoreCount} score
                      {prediction.scoreCount === 1 ? "" : "s"}
                    </p>
                  </div>
                  <span className="analytics-pill">{formatMetric(prediction.averageAccuracy)} / 5</span>
                </div>
              ))
            ) : (
              <div className="empty-card">
                <strong>No scored predictions yet</strong>
                <p>Closed exercises will surface here after users add archive scores.</p>
              </div>
            )}
          </div>
        </article>
      </section>
    </>
  );
}
