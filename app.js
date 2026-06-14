const WEIGHT_STEP = 2.5;
const DRAFT_FALLBACK_KEY = "app-gym-draft";

const workoutPlans = [
  {
    id: "push-1",
    type: "push",
    label: "Push 1",
    duration: "1h",
    focus: "Pecho dominante",
    exercises: [
      { name: "Press banca con mancuernas", sets: 4, minReps: 6, maxReps: 10 },
      { name: "Press inclinado con mancuernas", sets: 3, minReps: 8, maxReps: 12 },
      { name: "Press hombro sentado", sets: 3, minReps: 8, maxReps: 12 },
      { name: "Elevaciones laterales", sets: 4, minReps: 12, maxReps: 20 },
      { name: "Extension de triceps en cuerda", sets: 3, minReps: 10, maxReps: 15 },
      { name: "Extension de triceps por encima de la cabeza", sets: 3, minReps: 10, maxReps: 15 },
      { name: "Flexiones al fallo", sets: 2, minReps: 1, maxReps: 999, optional: true, repLabel: "al fallo" }
    ]
  },
  {
    id: "pull-1",
    type: "pull",
    label: "Pull 1",
    duration: "1h",
    focus: "Grosor de espalda",
    exercises: [
      { name: "T-Bar Row", sets: 4, minReps: 6, maxReps: 10 },
      { name: "Remo mancuerna", sets: 3, minReps: 8, maxReps: 12 },
      { name: "Jalon al pecho o dominadas", sets: 3, minReps: 8, maxReps: 12 },
      { name: "Face Pull", sets: 3, minReps: 12, maxReps: 20 },
      { name: "Curl biceps con mancuernas", sets: 3, minReps: 8, maxReps: 12 },
      { name: "Curl martillo", sets: 3, minReps: 10, maxReps: 15 }
    ]
  },
  {
    id: "push-2",
    type: "push",
    label: "Push 2",
    duration: "2h",
    focus: "Hombro dominante",
    exercises: [
      { name: "Press hombro pesado", sets: 4, minReps: 6, maxReps: 10 },
      { name: "Press inclinado en maquina o mancuernas", sets: 3, minReps: 8, maxReps: 12 },
      { name: "Pec Deck / Contractor", sets: 4, minReps: 10, maxReps: 15 },
      { name: "Elevaciones laterales en polea", sets: 4, minReps: 12, maxReps: 20 },
      { name: "Fondos asistidos o en maquina", sets: 3, minReps: 8, maxReps: 12 },
      { name: "Extension triceps cuerda", sets: 3, minReps: 10, maxReps: 15 },
      { name: "Extension unilateral en polea", sets: 3, minReps: 12, maxReps: 15 }
    ]
  },
  {
    id: "pull-2",
    type: "pull",
    label: "Pull 2",
    duration: "2h",
    focus: "Amplitud + grosor",
    exercises: [
      { name: "Jalon Technogym agarre ancho", sets: 4, minReps: 8, maxReps: 12 },
      { name: "Remo sentado en polea o maquina", sets: 4, minReps: 8, maxReps: 12 },
      { name: "Remo unilateral maquina", sets: 3, minReps: 8, maxReps: 12 },
      { name: "Jalon unilateral en polea", sets: 3, minReps: 10, maxReps: 15 },
      { name: "Cruces inversos en polea", sets: 4, minReps: 12, maxReps: 20 },
      { name: "Curl inclinado con mancuernas", sets: 3, minReps: 8, maxReps: 12 },
      { name: "Curl predicador maquina", sets: 3, minReps: 10, maxReps: 15 },
      { name: "Curl invertido barra EZ", sets: 3, minReps: 12, maxReps: 15 }
    ]
  }
];

const state = {
  logs: [],
  currentSection: "training-dashboard",
  activeWorkoutId: null,
  activeExerciseIndex: 0,
  draftSession: null,
  selectedProgressExercise: ""
};

const todayLabel = document.getElementById("todayLabel");
const heroStatusPill = document.getElementById("heroStatusPill");
const trainingDashboardView = document.getElementById("trainingDashboardView");
const trainingSetupView = document.getElementById("trainingSetupView");
const trainingSummaryView = document.getElementById("trainingSummaryView");
const progressExerciseSelect = document.getElementById("progressExerciseSelect");
const progressChartView = document.getElementById("progressChartView");
const volumeChartView = document.getElementById("volumeChartView");
const dashboardNoteCopy = document.getElementById("dashboardNoteCopy");
const resumeWorkoutButton = document.getElementById("resumeWorkoutButton");
const goToWorkoutSetupButton = document.getElementById("goToWorkoutSetupButton");
const workoutView = document.getElementById("workoutView");
const workoutTitle = document.getElementById("workoutTitle");
const sessionDateInput = document.getElementById("sessionDate");
const progressLabel = document.getElementById("progressLabel");
const draftStatusLabel = document.getElementById("draftStatusLabel");
const exerciseFlow = document.getElementById("exerciseFlow");
const previousExerciseButton = document.getElementById("previousExerciseButton");
const nextExerciseButton = document.getElementById("nextExerciseButton");
const saveWorkoutButton = document.getElementById("saveWorkoutButton");
const changeWorkoutButton = document.getElementById("changeWorkoutButton");
const historyView = document.getElementById("historyView");
const resetDataButton = document.getElementById("resetDataButton");
const exportDataButton = document.getElementById("exportDataButton");
const importDataInput = document.getElementById("importDataInput");
const selectionCardTemplate = document.getElementById("selectionCardTemplate");

boot();

async function boot() {
  try {
    await init();
  } catch (error) {
    console.error("Error al iniciar App GYM", error);
    renderFatalState(error);
  }
}

async function init() {
  state.logs = await loadPersistedLogs();
  restoreSavedDraft(await loadPersistedDraft());

  todayLabel.textContent = formatLongDate(new Date());
  sessionDateInput.value = formatDateInput(new Date());
  bindEvents();
  ensureSelectedProgressExercise();
  renderAll();
  registerServiceWorker();
}

function bindEvents() {
  sessionDateInput.addEventListener("change", async () => {
    ensureDraftSession();
    if (state.draftSession) {
      state.draftSession.date = sessionDateInput.value;
      touchDraft();
      await persistDraftState();
      renderWorkoutHeader();
    }
  });

  progressExerciseSelect.addEventListener("change", () => {
    state.selectedProgressExercise = progressExerciseSelect.value;
    renderProgressChart();
  });

  goToWorkoutSetupButton.addEventListener("click", () => {
    showSection("training-setup");
  });

  resumeWorkoutButton.addEventListener("click", () => {
    if (!state.draftSession) {
      return;
    }
    showSection("workout");
    renderWorkoutFlow();
  });

  previousExerciseButton.addEventListener("click", async () => {
    await persistCurrentExerciseInputs();
    state.activeExerciseIndex = Math.max(0, state.activeExerciseIndex - 1);
    await persistDraftState();
    renderWorkoutFlow();
  });

  nextExerciseButton.addEventListener("click", async () => {
    await persistCurrentExerciseInputs();
    const workout = getActiveWorkout();
    state.activeExerciseIndex = Math.min(workout.exercises.length - 1, state.activeExerciseIndex + 1);
    await persistDraftState();
    renderWorkoutFlow();
  });

  saveWorkoutButton.addEventListener("click", async () => {
    await persistCurrentExerciseInputs();
    await finalizeSession();
  });

  changeWorkoutButton.addEventListener("click", async () => {
    await persistCurrentExerciseInputs();
    showSection("training-setup");
    renderAll();
  });

  exerciseFlow.addEventListener("input", handleExerciseFieldInput);
  exerciseFlow.addEventListener("change", handleExerciseFieldInput);

  resetDataButton.addEventListener("click", async () => {
    const confirmed = window.confirm("Seguro que quieres borrar todo el historial?");
    if (!confirmed) {
      return;
    }

    state.logs = [];
    resetWorkoutFlow();
    ensureSelectedProgressExercise();
    await persistLogs();
    await clearPersistedDraft();
    renderAll();
  });

  exportDataButton.addEventListener("click", exportBackup);
  importDataInput.addEventListener("change", importBackup);

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      void persistCurrentExerciseInputs();
    }
  });

  window.addEventListener("beforeunload", () => {
    void persistCurrentExerciseInputs();
  });
}

function handleExerciseFieldInput(event) {
  if (!event.target.matches("input[data-kind]")) {
    return;
  }

  void persistCurrentExerciseInputs();
}

function renderAll() {
  renderTrainingSetup();
  renderTrainingSummary();
  renderDashboardActions();
  renderProgressExerciseOptions();
  renderProgressChart();
  renderVolumeChart();
  renderWorkoutFlow();
  renderHistory();
  renderSectionVisibility();
  renderHeroStatus();
}

function renderFatalState(error) {
  const message = error?.message ? String(error.message) : "Error desconocido";
  trainingDashboardView.innerHTML = `
    <div class="surface-head">
      <div>
        <p class="section-label">Recuperacion</p>
        <h2>La app no ha arrancado bien</h2>
      </div>
    </div>
    <div class="empty-state empty-state-large">
      Ha fallado algo al abrir la app. Recarga la pagina. Si sigue pasando, ya no veras pantalla en blanco y podremos localizarlo mejor.
      <br><br>
      Detalle: ${escapeHtml(message)}
    </div>
  `;
  trainingDashboardView.classList.remove("is-hidden");
  trainingSetupView.classList.add("is-hidden");
  workoutView.classList.add("is-hidden");
  heroStatusPill.textContent = "Error al abrir";
}

function renderTrainingSetup() {
  const suggestion = getSuggestedWorkout();
  const types = ["push", "pull"];
  const grid = document.createElement("div");
  grid.className = "selection-grid";

  types.forEach((type) => {
    const card = selectionCardTemplate.content.cloneNode(true);
    const button = card.querySelector(".selection-card");
    const plan = getSuggestedWorkout(type);
    button.querySelector(".selection-card-tag").textContent = type === "push" ? "Push day" : "Pull day";
    button.querySelector(".selection-card-hint").textContent = suggestion && plan && suggestion.id === plan.id ? "Te toca" : "Disponible";
    button.querySelector(".selection-card-title").textContent = plan ? plan.label : type;
    button.querySelector(".selection-card-copy").textContent = plan
      ? `${plan.focus}. Entraras al registro paso a paso con guardado automatico.`
      : "Sin plan disponible.";
    button.querySelector(".selection-card-meta").textContent = plan
      ? `${plan.duration} - ${plan.exercises.length} ejercicios`
      : "";
    button.addEventListener("click", () => {
      if (plan) {
        void startWorkout(plan.id);
      }
    });
    grid.appendChild(card);
  });

  trainingSetupView.innerHTML = `
    <div class="surface-head">
      <div>
        <p class="section-label">Nuevo registro</p>
        <h2>Que quieres entrenar hoy?</h2>
      </div>
      <button class="text-button" type="button" id="backToDashboardButton">Volver</button>
    </div>
  `;
  trainingSetupView.appendChild(grid);
  trainingSetupView.querySelector("#backToDashboardButton").addEventListener("click", () => {
    showSection("training-dashboard");
  });
}

function renderTrainingSummary() {
  const totalSessions = state.logs.length;
  const streak = getTrainingStreak(state.logs);
  const nextSuggestion = getSuggestedWorkout();
  const recentVolume = getRecentVolumeDays(30);

  const cards = [
    {
      title: "Sesiones",
      value: totalSessions ? String(totalSessions) : "0",
      copy: totalSessions ? "Entrenos finalizados" : "Aun no has finalizado sesiones"
    },
    {
      title: "Siguiente",
      value: nextSuggestion ? nextSuggestion.label : "Push 1",
      copy: nextSuggestion ? nextSuggestion.focus : "Tu primer bloque"
    },
    {
      title: "Constancia",
      value: streak ? `${streak}` : "0",
      copy: "Semanas seguidas entrenando"
    },
    {
      title: "Volumen 30d",
      value: recentVolume ? `${formatWeight(recentVolume)}` : "0",
      copy: "Kg movidos en el ultimo mes"
    }
  ];

  trainingSummaryView.innerHTML = cards.map((card) => `
    <article class="stats-card">
      <h3>${card.title}</h3>
      <strong>${card.value}</strong>
      <p class="mini-copy">${card.copy}</p>
    </article>
  `).join("");
}

function renderDashboardActions() {
  if (state.draftSession) {
    const draftName = state.draftSession.sourceLogId ? "edicion en curso" : "entreno en curso";
    dashboardNoteCopy.textContent = `Tienes un ${draftName} guardado automaticamente. Puedes continuar justo donde lo dejaste.`;
    resumeWorkoutButton.classList.remove("is-hidden");
    return;
  }

  dashboardNoteCopy.textContent = "Desde aqui ves como vas y luego entras a registrar el entreno de hoy.";
  resumeWorkoutButton.classList.add("is-hidden");
}

function renderProgressExerciseOptions() {
  const exercises = getTrackedExerciseNames();
  ensureSelectedProgressExercise();

  progressExerciseSelect.innerHTML = exercises.map((name) => `
    <option value="${escapeAttribute(name)}">${name}</option>
  `).join("");

  if (state.selectedProgressExercise) {
    progressExerciseSelect.value = state.selectedProgressExercise;
  }
}

function renderProgressChart() {
  const exerciseName = state.selectedProgressExercise;
  const points = getExerciseProgressPoints(exerciseName);

  if (!exerciseName || points.length < 2) {
    progressChartView.innerHTML = `
      <div class="chart-empty">
        Guarda al menos dos sesiones del mismo ejercicio para ver la curva de peso.
      </div>
    `;
    return;
  }

  const values = points.map((point) => point.weight);
  const labels = points.map((point) => formatShortDate(new Date(point.date)));
  progressChartView.innerHTML = renderLineChartSvg(values, labels, "kg");

  const start = points[0].weight;
  const end = points.at(-1).weight;
  const delta = roundWeight(end - start);
  progressChartView.insertAdjacentHTML("beforeend", `
    <p class="chart-caption">
      Evolucion total: ${delta >= 0 ? "+" : ""}${formatWeight(delta)} kg en ${points.length} registros.
    </p>
  `);
}

function renderVolumeChart() {
  const weeks = getWeeklyVolumeData(6);

  if (!weeks.some((item) => item.volume > 0)) {
    volumeChartView.innerHTML = `
      <div class="chart-empty">
        Cuando guardes sesiones veremos aqui el volumen total por semana.
      </div>
    `;
    return;
  }

  const values = weeks.map((item) => item.volume);
  const labels = weeks.map((item) => item.label);
  volumeChartView.innerHTML = renderBarChartSvg(values, labels, "kg");
}

async function startWorkout(workoutId) {
  state.activeWorkoutId = workoutId;
  state.activeExerciseIndex = 0;
  state.draftSession = createDraftSession(workoutId);
  touchDraft();
  await persistDraftState();
  showSection("workout");
  renderAll();
}

function createDraftSession(workoutId) {
  const workout = getWorkoutById(workoutId);
  return {
    draftId: crypto.randomUUID(),
    workoutId,
    date: formatDateInput(new Date()),
    sourceLogId: null,
    startedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    exercises: workout.exercises.map((exercise) => {
      const plan = getRecommendedPlan(exercise, getLastExercisePerformance(workout.id, exercise.name));
      return buildDraftExercise(exercise, plan);
    })
  };
}

function createDraftFromLog(log) {
  const workout = getWorkoutById(log.workoutId);
  if (!workout) {
    return null;
  }

  return {
    draftId: crypto.randomUUID(),
    workoutId: log.workoutId,
    date: log.date,
    sourceLogId: log.id,
    startedAt: log.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    exercises: workout.exercises.map((exercise) => {
      const loggedExercise = log.exercises.find((item) => item.name === exercise.name);
      const plan = getRecommendedPlan(exercise, getLastExercisePerformance(workout.id, exercise.name));
      const draftExercise = buildDraftExercise(exercise, plan);

      if (!loggedExercise) {
        return draftExercise;
      }

      draftExercise.sets = Array.from({ length: exercise.sets }, (_, index) => {
        const savedSet = loggedExercise.sets[index];
        return {
          setNumber: index + 1,
          weight: savedSet?.weight ?? draftExercise.sets[index].weight,
          reps: savedSet?.reps ?? draftExercise.sets[index].reps,
          notes: savedSet?.notes ?? ""
        };
      });

      return draftExercise;
    })
  };
}

function buildDraftExercise(exercise, plan) {
  return {
    name: exercise.name,
    target: {
      sets: exercise.sets,
      minReps: exercise.minReps,
      maxReps: exercise.maxReps,
      optional: !!exercise.optional,
      repLabel: exercise.repLabel || null
    },
    plan,
    sets: Array.from({ length: exercise.sets }, (_, index) => ({
      setNumber: index + 1,
      weight: Number.isFinite(plan.suggestedWeight) ? plan.suggestedWeight : null,
      reps: plan.targetReps[index] ?? exercise.minReps,
      notes: ""
    }))
  };
}

function ensureDraftSession() {
  if (!state.draftSession && state.activeWorkoutId) {
    state.draftSession = createDraftSession(state.activeWorkoutId);
  }
}

function renderWorkoutFlow() {
  const workout = getActiveWorkout();
  if (!workout || !state.draftSession) {
    exerciseFlow.innerHTML = "";
    return;
  }

  const exercise = workout.exercises[state.activeExerciseIndex];
  const draftExercise = state.draftSession.exercises[state.activeExerciseIndex];
  const plan = draftExercise.plan;
  const isLast = state.activeExerciseIndex === workout.exercises.length - 1;

  renderWorkoutHeader();

  exerciseFlow.innerHTML = `
    <article class="exercise-panel">
      <div class="exercise-header">
        <p class="section-label">Ejercicio ${state.activeExerciseIndex + 1}</p>
        <h3>${exercise.name}</h3>
        <p class="exercise-subtitle">${describeTarget(exercise)}</p>
      </div>

      <div class="exercise-plan-grid">
        <div class="mini-card">
          <strong>Peso sugerido</strong>
          <p class="mini-copy">${plan.weightLabel}</p>
        </div>
        <div class="mini-card">
          <strong>Siguiente objetivo</strong>
          <p class="mini-copy">${plan.repGoalLabel}</p>
        </div>
        <div class="mini-card">
          <strong>Ultimo registro</strong>
          <p class="mini-copy">${plan.lastPerformanceLabel}</p>
        </div>
        <div class="mini-card">
          <strong>Accion</strong>
          <p class="mini-copy">${plan.nextStepLabel}</p>
        </div>
      </div>

      <div class="sets-list">
        ${draftExercise.sets.map((set, index) => `
          <div class="set-row">
            <div class="set-index">Serie ${index + 1}</div>
            <div class="set-fields">
              <div class="field-group">
                <label for="weight-${index}">Peso</label>
                <input id="weight-${index}" data-kind="weight" data-index="${index}" type="number" step="0.5" min="0" value="${set.weight ?? ""}">
              </div>
              <div class="field-group">
                <label for="reps-${index}">Reps</label>
                <input id="reps-${index}" data-kind="reps" data-index="${index}" type="number" step="1" min="0" value="${set.reps ?? ""}">
              </div>
              <div class="field-group">
                <label for="notes-${index}">Nota</label>
                <input id="notes-${index}" data-kind="notes" data-index="${index}" type="text" value="${escapeAttribute(set.notes)}" placeholder="Opcional">
              </div>
            </div>
          </div>
        `).join("")}
      </div>
    </article>
  `;

  previousExerciseButton.disabled = state.activeExerciseIndex === 0;
  nextExerciseButton.classList.toggle("is-hidden", isLast);
  saveWorkoutButton.classList.toggle("is-hidden", !isLast);
  saveWorkoutButton.textContent = state.draftSession.sourceLogId ? "Guardar cambios" : "Finalizar entrenamiento";
}

function renderWorkoutHeader() {
  const workout = getActiveWorkout();
  if (!workout || !state.draftSession) {
    return;
  }

  workoutTitle.textContent = `${workout.label} - ${workout.focus}`;
  sessionDateInput.value = state.draftSession.date;
  progressLabel.textContent = `${state.activeExerciseIndex + 1} de ${workout.exercises.length}`;
  draftStatusLabel.textContent = state.draftSession.sourceLogId ? "Edicion guardada automaticamente" : "Guardado automatico activo";
}

async function persistCurrentExerciseInputs() {
  if (!state.draftSession) {
    return;
  }

  const draftExercise = state.draftSession.exercises[state.activeExerciseIndex];
  const inputs = exerciseFlow.querySelectorAll("input[data-kind]");
  inputs.forEach((input) => {
    const index = Number(input.dataset.index);
    const kind = input.dataset.kind;
    if (kind === "weight" || kind === "reps") {
      draftExercise.sets[index][kind] = parseNumber(input.value);
      return;
    }
    draftExercise.sets[index][kind] = input.value.trim();
  });

  touchDraft();
  await persistDraftState();
  renderWorkoutHeader();
  renderDashboardActions();
}

async function finalizeSession() {
  const workout = getActiveWorkout();
  if (!workout || !state.draftSession) {
    return;
  }

  const exercises = state.draftSession.exercises.map((exercise) => ({
    name: exercise.name,
    target: exercise.target,
    sets: exercise.sets.filter((set) => Number.isFinite(set.weight) || Number.isFinite(set.reps) || set.notes)
  })).filter((exercise) => exercise.sets.length > 0);

  const existingIndex = state.draftSession.sourceLogId
    ? state.logs.findIndex((log) => log.id === state.draftSession.sourceLogId)
    : -1;

  const logEntry = {
    id: existingIndex >= 0 ? state.logs[existingIndex].id : crypto.randomUUID(),
    date: state.draftSession.date,
    type: workout.type,
    workoutId: workout.id,
    workoutLabel: `${workout.label} - ${workout.focus}`,
    exercises,
    createdAt: existingIndex >= 0 ? state.logs[existingIndex].createdAt : new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  if (existingIndex >= 0) {
    state.logs.splice(existingIndex, 1, logEntry);
  } else {
    state.logs.push(logEntry);
  }

  await persistLogs();
  await clearPersistedDraft();
  resetWorkoutFlow();
  ensureSelectedProgressExercise();
  showSection("training-dashboard");
  renderAll();
  window.alert(existingIndex >= 0 ? "Entrenamiento actualizado." : "Entrenamiento finalizado.");
}

async function editLog(logId) {
  const log = state.logs.find((item) => item.id === logId);
  if (!log) {
    return;
  }

  const draft = createDraftFromLog(log);
  if (!draft) {
    window.alert("No se pudo abrir este entrenamiento para editarlo.");
    return;
  }

  state.activeWorkoutId = draft.workoutId;
  state.activeExerciseIndex = 0;
  state.draftSession = draft;
  await persistDraftState();
  showSection("workout");
  renderAll();
}

async function exportBackup() {
  const payload = window.WorkoutStorage
    ? await window.WorkoutStorage.exportLogs()
    : { version: 1, exportedAt: new Date().toISOString(), logs: state.logs };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `app-gym-backup-${formatDateInput(new Date())}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

async function importBackup(event) {
  const file = event.target.files?.[0];
  if (!file) {
    return;
  }

  try {
    const text = await file.text();
    const importedLogs = window.WorkoutStorage
      ? await window.WorkoutStorage.importLogs(text)
      : JSON.parse(text).logs;
    state.logs = Array.isArray(importedLogs) ? importedLogs : [];
    resetWorkoutFlow();
    ensureSelectedProgressExercise();
    await clearPersistedDraft();
    renderAll();
    window.alert("Copia importada.");
  } catch (error) {
    console.error(error);
    window.alert("No se pudo importar la copia.");
  } finally {
    event.target.value = "";
  }
}

function renderHistory() {
  if (!state.logs.length) {
    historyView.innerHTML = `<div class="empty-state">Cuando finalices una sesion, aqui veras tus ultimos pesos y repeticiones.</div>`;
    return;
  }

  const recentLogs = [...state.logs]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 8);

  historyView.innerHTML = recentLogs.map((log) => `
    <article class="history-item" data-log-id="${log.id}">
      <div class="history-item-head">
        <div>
          <h3>${log.workoutLabel}</h3>
          <p class="history-meta">${formatLongDate(new Date(log.date))}</p>
        </div>
        <div class="history-card-actions">
          <span class="mini-pill">${log.type.toUpperCase()}</span>
          <button class="text-button" type="button" data-edit-log="${log.id}">Editar</button>
        </div>
      </div>
      <div class="history-exercises">
        ${log.exercises.slice(0, 3).map((exercise) => `
          <div class="history-row">
            <strong>${exercise.name}</strong><br>${summarizeSets(exercise.sets)}
          </div>
        `).join("")}
      </div>
    </article>
  `).join("");

  historyView.querySelectorAll("[data-edit-log]").forEach((button) => {
    button.addEventListener("click", () => {
      void editLog(button.dataset.editLog);
    });
  });
}

function renderSectionVisibility() {
  trainingDashboardView.classList.toggle("is-hidden", state.currentSection !== "training-dashboard");
  trainingSetupView.classList.toggle("is-hidden", state.currentSection !== "training-setup");
  workoutView.classList.toggle("is-hidden", state.currentSection !== "workout");
}

function renderHeroStatus() {
  const labels = {
    "training-dashboard": "Panel de entrenamiento",
    "training-setup": "Elegir sesion",
    workout: state.draftSession?.sourceLogId ? "Editando sesion" : "Registro en curso"
  };
  heroStatusPill.textContent = labels[state.currentSection] || "App GYM";
}

function showSection(section) {
  state.currentSection = section;
  renderSectionVisibility();
  renderHeroStatus();
}

function resetWorkoutFlow() {
  state.activeWorkoutId = null;
  state.activeExerciseIndex = 0;
  state.draftSession = null;
}

function restoreSavedDraft(savedDraft) {
  if (!savedDraft?.draftSession || !savedDraft.activeWorkoutId) {
    return;
  }

  const workout = getWorkoutById(savedDraft.activeWorkoutId);
  if (!workout) {
    return;
  }

  state.activeWorkoutId = savedDraft.activeWorkoutId;
  state.activeExerciseIndex = Math.min(savedDraft.activeExerciseIndex || 0, workout.exercises.length - 1);
  state.draftSession = savedDraft.draftSession;
  state.currentSection = "workout";
}

async function persistDraftState() {
  if (!state.draftSession || !state.activeWorkoutId) {
    await clearPersistedDraft();
    return;
  }

  const payload = {
    currentSection: "workout",
    activeWorkoutId: state.activeWorkoutId,
    activeExerciseIndex: state.activeExerciseIndex,
    draftSession: state.draftSession
  };

  if (window.WorkoutStorage?.saveDraft) {
    await window.WorkoutStorage.saveDraft(payload);
    return;
  }

  localStorage.setItem(DRAFT_FALLBACK_KEY, JSON.stringify(payload));
}

async function clearPersistedDraft() {
  if (window.WorkoutStorage?.clearDraft) {
    await window.WorkoutStorage.clearDraft();
  } else {
    localStorage.removeItem(DRAFT_FALLBACK_KEY);
  }
}

function touchDraft() {
  if (!state.draftSession) {
    return;
  }
  state.draftSession.updatedAt = new Date().toISOString();
}

async function loadPersistedLogs() {
  if (window.WorkoutStorage) {
    try {
      await window.WorkoutStorage.init();
      const remoteLogs = await window.WorkoutStorage.pullRemote();
      return Array.isArray(remoteLogs) ? remoteLogs : await window.WorkoutStorage.getLogs();
    } catch (error) {
      console.error("No se pudo cargar el almacenamiento avanzado", error);
    }
  }

  return loadLogs();
}

async function loadPersistedDraft() {
  if (window.WorkoutStorage?.getDraft) {
    try {
      return await window.WorkoutStorage.getDraft();
    } catch (error) {
      console.error("No se pudo recuperar el borrador guardado", error);
    }
  }

  try {
    const raw = localStorage.getItem(DRAFT_FALLBACK_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.error("No se pudo leer el borrador local", error);
    return null;
  }
}

function getSuggestedWorkout(preferredType = null) {
  const pool = preferredType ? workoutPlans.filter((plan) => plan.type === preferredType) : workoutPlans;
  const lastLog = getLastLog();

  if (!lastLog) {
    return pool[0] || null;
  }

  if (preferredType) {
    const sameTypeLogs = [...state.logs]
      .filter((log) => log.type === preferredType)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    const lastSameType = sameTypeLogs.at(-1);
    if (!lastSameType) {
      return pool[0] || null;
    }
    const currentIndex = pool.findIndex((plan) => plan.id === lastSameType.workoutId);
    return pool[(currentIndex + 1 + pool.length) % pool.length] || null;
  }

  const currentIndex = workoutPlans.findIndex((plan) => plan.id === lastLog.workoutId);
  return workoutPlans[(currentIndex + 1 + workoutPlans.length) % workoutPlans.length] || workoutPlans[0] || null;
}

function getRecommendedPlan(exercise, lastPerformance) {
  if (!lastPerformance) {
    return {
      suggestedWeight: null,
      weightLabel: "Empieza con un peso comodo y tecnico.",
      targetReps: Array.from({ length: exercise.sets }, () => exercise.minReps),
      repGoalLabel: formatRepGoal(exercise),
      lastPerformanceLabel: "Sin historial todavia.",
      nextStepLabel: "Marca una base"
    };
  }

  const lastSets = lastPerformance.sets.filter((set) => Number.isFinite(set.weight) && Number.isFinite(set.reps));
  const lastWeight = getMostUsedWeight(lastSets);
  const reachedTopRange = lastSets.length >= exercise.sets
    && lastSets.every((set) => set.reps >= exercise.maxReps);
  const suggestedWeight = reachedTopRange && Number.isFinite(lastWeight)
    ? roundWeight(lastWeight + WEIGHT_STEP)
    : lastWeight;
  const targetReps = reachedTopRange
    ? Array.from({ length: exercise.sets }, () => exercise.minReps)
    : buildNextRepTargets(lastSets, exercise);

  return {
    suggestedWeight,
    weightLabel: Number.isFinite(suggestedWeight) ? `${formatWeight(suggestedWeight)} kg` : "Sin peso sugerido",
    targetReps,
    repGoalLabel: reachedTopRange
      ? `Sube a ${formatWeight(suggestedWeight)} kg y vuelve al rango bajo`
      : "Manten el peso y suma reps",
    lastPerformanceLabel: summarizeSets(lastSets),
    nextStepLabel: reachedTopRange ? "Subir peso" : "Repetir peso"
  };
}

function buildNextRepTargets(lastSets, exercise) {
  const targets = lastSets.map((set) => Math.min(set.reps + 1, exercise.maxReps));
  while (targets.length < exercise.sets) {
    targets.push(exercise.minReps);
  }
  return targets.slice(0, exercise.sets);
}

function getLastExercisePerformance(workoutId, exerciseName) {
  const logs = [...state.logs]
    .filter((log) => log.workoutId === workoutId)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  for (const log of logs) {
    const match = log.exercises.find((exercise) => exercise.name === exerciseName);
    if (match) {
      return match;
    }
  }

  return null;
}

function getTrackedExerciseNames() {
  const names = new Set();
  state.logs.forEach((log) => {
    log.exercises.forEach((exercise) => {
      if (exercise.sets.some((set) => Number.isFinite(set.weight))) {
        names.add(exercise.name);
      }
    });
  });

  if (!names.size) {
    workoutPlans.forEach((plan) => {
      plan.exercises.forEach((exercise) => names.add(exercise.name));
    });
  }

  return [...names];
}

function ensureSelectedProgressExercise() {
  const exercises = getTrackedExerciseNames();
  if (!exercises.includes(state.selectedProgressExercise)) {
    state.selectedProgressExercise = exercises[0] || "";
  }
}

function getExerciseProgressPoints(exerciseName) {
  if (!exerciseName) {
    return [];
  }

  return [...state.logs]
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map((log) => {
      const exercise = log.exercises.find((item) => item.name === exerciseName);
      if (!exercise) {
        return null;
      }

      const weightedSets = exercise.sets.filter((set) => Number.isFinite(set.weight));
      if (!weightedSets.length) {
        return null;
      }

      return {
        date: log.date,
        weight: Math.max(...weightedSets.map((set) => set.weight))
      };
    })
    .filter(Boolean);
}

function getWeeklyVolumeData(weeksBack) {
  const result = [];
  const now = new Date();

  for (let index = weeksBack - 1; index >= 0; index -= 1) {
    const cursor = new Date(now);
    cursor.setDate(cursor.getDate() - (index * 7));
    const key = getIsoWeekKey(cursor);
    const volume = state.logs
      .filter((log) => getIsoWeekKey(new Date(log.date)) === key)
      .reduce((sum, log) => sum + getLogVolume(log), 0);

    result.push({
      key,
      label: key.slice(6),
      volume: roundWeight(volume)
    });
  }

  return result;
}

function getRecentVolumeDays(days) {
  const today = formatDateInput(new Date());
  return roundWeight(state.logs.reduce((sum, log) => {
    const diff = getDaysBetween(log.date, today);
    return diff >= 0 && diff < days ? sum + getLogVolume(log) : sum;
  }, 0));
}

function getLogVolume(log) {
  return log.exercises.reduce((exerciseSum, exercise) => (
    exerciseSum + exercise.sets.reduce((setSum, set) => {
      if (!Number.isFinite(set.weight) || !Number.isFinite(set.reps)) {
        return setSum;
      }
      return setSum + (set.weight * set.reps);
    }, 0)
  ), 0);
}

function getMostUsedWeight(sets) {
  const counts = new Map();
  sets.forEach((set) => {
    const key = String(set.weight);
    counts.set(key, (counts.get(key) || 0) + 1);
  });
  const [winner] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0] || [];
  return winner ? Number(winner) : null;
}

function getActiveWorkout() {
  return getWorkoutById(state.activeWorkoutId);
}

function getWorkoutById(workoutId) {
  return workoutPlans.find((plan) => plan.id === workoutId) || null;
}

function getLastLog() {
  return [...state.logs].sort((a, b) => new Date(b.date) - new Date(a.date))[0] || null;
}

function describeTarget(exercise) {
  if (exercise.optional) {
    return `Opcional - ${exercise.sets} series ${exercise.repLabel}`;
  }
  return `${exercise.sets} series de ${exercise.minReps}-${exercise.maxReps} repeticiones`;
}

function summarizeSets(sets) {
  if (!sets?.length) {
    return "Sin datos";
  }

  return sets.map((set) => {
    const weight = Number.isFinite(set.weight) ? `${formatWeight(set.weight)} kg` : "sin peso";
    const reps = Number.isFinite(set.reps) ? `${set.reps} reps` : "sin reps";
    return `S${set.setNumber}: ${weight} x ${reps}`;
  }).join(" - ");
}

function formatRepGoal(exercise) {
  return exercise.optional
    ? `${exercise.sets} series al fallo`
    : `${exercise.sets} x ${exercise.minReps}-${exercise.maxReps}`;
}

function getTrainingStreak(logs) {
  if (!logs.length) {
    return 0;
  }

  const weekKeys = new Set(logs.map((log) => getIsoWeekKey(new Date(log.date))));
  let streak = 0;
  const cursor = new Date();

  while (weekKeys.has(getIsoWeekKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 7);
  }

  return streak;
}

function getIsoWeekKey(date) {
  const copy = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = copy.getUTCDay() || 7;
  copy.setUTCDate(copy.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(copy.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((copy - yearStart) / 86400000) + 1) / 7);
  return `${copy.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

function getDaysBetween(fromDate, toDate) {
  const from = new Date(fromDate);
  const to = new Date(toDate);
  from.setHours(0, 0, 0, 0);
  to.setHours(0, 0, 0, 0);
  return Math.round((to - from) / 86400000);
}

function renderLineChartSvg(values, labels, unit) {
  const width = 620;
  const height = 260;
  const padding = 28;
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = maxValue - minValue || 1;

  const points = values.map((value, index) => {
    const x = padding + ((width - padding * 2) * index) / Math.max(values.length - 1, 1);
    const y = height - padding - (((value - minValue) / range) * (height - padding * 2));
    return { x, y, label: labels[index] };
  });

  const path = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
  const tickValues = [minValue, (minValue + maxValue) / 2, maxValue];

  return `
    <svg class="chart-svg" viewBox="0 0 ${width} ${height}" aria-label="Grafica de progresion">
      <rect x="0" y="0" width="${width}" height="${height}" rx="24" fill="#f3f4f6"></rect>
      ${tickValues.map((tick) => {
        const y = height - padding - (((tick - minValue) / range) * (height - padding * 2));
        return `
          <line x1="${padding}" y1="${y}" x2="${width - padding}" y2="${y}" stroke="rgba(17,24,39,0.08)" />
          <text x="10" y="${y + 4}" fill="#6b7280" font-size="11">${formatWeight(tick)} ${unit}</text>
        `;
      }).join("")}
      <path d="${path}" fill="none" stroke="#111111" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"></path>
      ${points.map((point) => `
        <g>
          <circle cx="${point.x}" cy="${point.y}" r="4.5" fill="#111111"></circle>
          <text x="${point.x}" y="${height - 10}" text-anchor="middle" fill="#6b7280" font-size="11">${point.label}</text>
        </g>
      `).join("")}
    </svg>
  `;
}

function renderBarChartSvg(values, labels, unit) {
  const width = 620;
  const height = 260;
  const padding = 28;
  const maxValue = Math.max(...values, 1);
  const barWidth = 52;
  const gap = ((width - padding * 2) - (barWidth * values.length)) / Math.max(values.length - 1, 1);

  return `
    <svg class="chart-svg" viewBox="0 0 ${width} ${height}" aria-label="Grafica de volumen">
      <rect x="0" y="0" width="${width}" height="${height}" rx="24" fill="#f3f4f6"></rect>
      <line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" stroke="rgba(17,24,39,0.12)" />
      ${values.map((value, index) => {
        const x = padding + index * (barWidth + gap);
        const barHeight = ((height - padding * 2) * value) / maxValue;
        const y = height - padding - barHeight;
        return `
          <g>
            <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" rx="14" fill="#111111"></rect>
            <text x="${x + (barWidth / 2)}" y="${height - 10}" text-anchor="middle" fill="#6b7280" font-size="11">${labels[index]}</text>
            <text x="${x + (barWidth / 2)}" y="${Math.max(y - 8, 14)}" text-anchor="middle" fill="#6b7280" font-size="11">${formatCompactNumber(value)} ${unit}</text>
          </g>
        `;
      }).join("")}
    </svg>
  `;
}

function loadLogs() {
  try {
    const raw = localStorage.getItem("app-gym-workouts");
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error("No se pudo leer el historial local", error);
    return [];
  }
}

async function persistLogs() {
  if (window.WorkoutStorage) {
    await window.WorkoutStorage.saveLogs(state.logs);
    return;
  }

  localStorage.setItem("app-gym-workouts", JSON.stringify(state.logs));
}

function formatDateInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatLongDate(date) {
  return new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long"
  }).format(date);
}

function formatShortDate(date) {
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short"
  }).format(date);
}

function formatWeight(weight) {
  return Number(weight).toLocaleString("es-ES", {
    minimumFractionDigits: Number(weight) % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 1
  });
}

function formatCompactNumber(value) {
  return new Intl.NumberFormat("es-ES", {
    notation: "compact",
    maximumFractionDigits: 1
  }).format(value);
}

function parseNumber(value) {
  if (value === "" || value === null || value === undefined) {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function roundWeight(weight) {
  return Math.round(weight * 10) / 10;
}

function escapeAttribute(value) {
  return String(value ?? "").replace(/"/g, "&quot;");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  if (!["http:", "https:"].includes(window.location.protocol)) {
    return;
  }

  navigator.serviceWorker.register("./service-worker.js").catch((error) => {
    console.error("No se pudo registrar el service worker", error);
  });
}
