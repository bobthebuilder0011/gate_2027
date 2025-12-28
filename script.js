// ---- Mode (DA / CSE) ----
const MODE_KEY = 'gate_mode_v1';
let currentMode = 'da'; // 'da' or 'cse'

const modeButtons = document.querySelectorAll('.mode-btn');

function loadMode() {
  try {
    const m = localStorage.getItem(MODE_KEY);
    if (m === 'da' || m === 'cse') currentMode = m;
  } catch {}
}

function saveMode() {
  try {
    localStorage.setItem(MODE_KEY, currentMode);
  } catch {}
}

function applyModeButtons() {
  modeButtons.forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-mode') === currentMode);
  });

  const body = document.body;
  if (currentMode === 'cse') {
    body.classList.add('cse-mode');
  } else {
    body.classList.remove('cse-mode');
  }
}

loadMode();
applyModeButtons();

modeButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const mode = btn.getAttribute('data-mode');
    if (mode === currentMode) return;
    currentMode = mode;
    saveMode();
    applyModeButtons();
    applyModeToDataAndUI();
  });
});

// ---- Tab switching ----
const tabButtons = document.querySelectorAll('.tab-btn');
const tabSections = document.querySelectorAll('.tab-section');

tabButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const targetId = btn.getAttribute('data-tab');

    tabButtons.forEach(b => b.classList.remove('active'));
    tabSections.forEach(sec => sec.classList.remove('active'));

    btn.classList.add('active');
    const target = document.getElementById(targetId);
    if (target) target.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
});

// ---- Back to top ----
const backBtn = document.getElementById('backToTop');
window.addEventListener('scroll', () => {
  if (window.scrollY > 200) {
    backBtn.classList.add('show');
  } else {
    backBtn.classList.remove('show');
  }
});

if (backBtn) {
  backBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// ---- Study timer + estimator ----
const sessionDisplay = document.getElementById('sessionDisplay');
const startPauseBtn = document.getElementById('startPauseBtn');
const resetSessionBtn = document.getElementById('resetSessionBtn');

const todayTotalEl = document.getElementById('todayTotal');
const allTimeTotalEl = document.getElementById('allTimeTotal');
const avgPerDayEl = document.getElementById('avgPerDay');

const targetHoursInput = document.getElementById('targetHoursInput');
const saveTargetBtn = document.getElementById('saveTargetBtn');
const targetHoursLabel = document.getElementById('targetHoursLabel');
const remainingHoursEl = document.getElementById('remainingHours');
const daysLeftEl = document.getElementById('daysLeft');
const finishDateEl = document.getElementById('finishDate');
const resetAllBtn = document.getElementById('resetAllBtn');

const STORAGE_KEY = 'gate_da_timer_v1';

let timerInterval = null;
let sessionSeconds = 0;
let data = {
  targetHours: 850,
  allTimeSeconds: 0,
  days: {}
};

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        data = Object.assign({}, data, parsed);
      }
    }
  } catch (e) {
    console.warn('Timer load error', e);
  }
}

function saveData() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Timer save error', e);
  }
}

function formatHMS(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const hh = String(hours).padStart(2, '0');
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

function formatHoursDisplay(seconds, decimals = 1) {
  const hours = seconds / 3600;
  return hours.toFixed(decimals) + ' h';
}

function todayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function updateStatsUI() {
  const tKey = todayKey();
  const todaySeconds = data.days[tKey] || 0;
  if (todayTotalEl) todayTotalEl.textContent = formatHoursDisplay(todaySeconds);

  if (allTimeTotalEl) allTimeTotalEl.textContent = formatHoursDisplay(data.allTimeSeconds, 1);

  const dayKeys = Object.keys(data.days);
  let avg = 0;
  if (dayKeys.length > 0) {
    const total = data.allTimeSeconds;
    avg = total / 3600 / dayKeys.length;
  }
  if (avgPerDayEl) avgPerDayEl.textContent = avg.toFixed(1) + ' h/day';

  if (targetHoursLabel) targetHoursLabel.textContent = data.targetHours + ' h';

  const targetSeconds = data.targetHours * 3600;
  const remainingSeconds = Math.max(0, targetSeconds - data.allTimeSeconds);
  if (remainingHoursEl) remainingHoursEl.textContent = (remainingSeconds / 3600).toFixed(1) + ' h';

  if (avg > 0 && remainingSeconds > 0) {
    const remainingDays = remainingSeconds / 3600 / avg;
    if (daysLeftEl) daysLeftEl.textContent = remainingDays.toFixed(1);

    const finish = new Date();
    finish.setDate(finish.getDate() + Math.ceil(remainingDays));
    if (finishDateEl) finishDateEl.textContent = finish.toLocaleDateString();
  } else {
    if (daysLeftEl) daysLeftEl.textContent = '–';
    if (finishDateEl) finishDateEl.textContent = '–';
  }
}

function tick() {
  sessionSeconds += 1;
  if (sessionDisplay) {
    sessionDisplay.textContent = formatHMS(sessionSeconds);
    sessionDisplay.classList.add('tick');
    setTimeout(() => {
      sessionDisplay.classList.remove('tick');
    }, 80);
  }
}

function startTimer() {
  if (timerInterval) return;
  timerInterval = setInterval(tick, 1000);
  if (startPauseBtn) startPauseBtn.textContent = 'Pause';
}

function pauseTimer() {
  if (!timerInterval) return;
  clearInterval(timerInterval);
  timerInterval = null;
  if (startPauseBtn) startPauseBtn.textContent = 'Resume';

  const tKey = todayKey();
  if (!data.days[tKey]) data.days[tKey] = 0;
  data.days[tKey] += sessionSeconds;
  data.allTimeSeconds += sessionSeconds;
  sessionSeconds = 0;
  if (sessionDisplay) sessionDisplay.textContent = formatHMS(sessionSeconds);
  saveData();
  updateStatsUI();
}

function resetSession() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  sessionSeconds = 0;
  if (sessionDisplay) sessionDisplay.textContent = formatHMS(sessionSeconds);
  if (startPauseBtn) startPauseBtn.textContent = 'Start';
}

if (startPauseBtn) {
  startPauseBtn.addEventListener('click', () => {
    if (!timerInterval) {
      startTimer();
    } else {
      pauseTimer();
    }
  });
}

if (resetSessionBtn) {
  resetSessionBtn.addEventListener('click', () => {
    resetSession();
  });
}

if (saveTargetBtn) {
  saveTargetBtn.addEventListener('click', () => {
    const val = parseInt(targetHoursInput.value, 10);
    if (!isNaN(val) && val >= 100 && val <= 3000) {
      data.targetHours = val;
      saveData();
      updateStatsUI();
    } else {
      alert('Enter a target between 100 and 3000 hours.');
    }
  });
}

if (resetAllBtn) {
  resetAllBtn.addEventListener('click', () => {
    if (confirm('Reset all tracked study data? This cannot be undone.')) {
      data.allTimeSeconds = 0;
      data.days = {};
      saveData();
      updateStatsUI();
    }
  });
}

loadData();
if (targetHoursInput) targetHoursInput.value = data.targetHours;
if (sessionDisplay) sessionDisplay.textContent = formatHMS(sessionSeconds);
updateStatsUI();

// ---- Checklist data & logic ----
const CHECKLIST_KEY = 'gate_da_checklist_v1';
const checklistContainer = document.getElementById('checklistContainer');
const overallProgressEl = document.getElementById('overallProgress');
const topicsDoneEl = document.getElementById('topicsDone');
const topicsTotalEl = document.getElementById('topicsTotal');

// DA / AI syllabus
const subjectsDA = [
  {
    id: 'prob_stats',
    name: 'Probability & Statistics',
    topics: [
      'Permutations and combinations, sample space, events, probability axioms',
      'Conditional, joint, marginal probability; Bayes’ theorem',
      'Random variables: discrete & continuous, PMF, PDF, CDF',
      'Expectation, variance, covariance, correlation',
      'Bernoulli, Binomial, Geometric, Poisson distributions',
      'Uniform, Exponential, Normal (Gaussian) distributions',
      'Law of large numbers, Central Limit Theorem',
      'Sampling distributions and standard error',
      'Point estimation: MLE and method of moments',
      'Confidence intervals for mean and proportion',
      'Hypothesis testing, Type I/II errors, p‑value',
      'Chi‑square, t‑test, z‑test, ANOVA basics',
      'Simple and multiple linear regression',
      'Correlation analysis and goodness‑of‑fit'
    ],
    important: [1, 2, 3, 5, 10, 12, 13]
  },
  {
    id: 'linear_algebra',
    name: 'Linear Algebra',
    topics: [
      'Vectors, vector spaces, subspaces, linear dependence/independence',
      'Matrices: types, operations, transpose, inverse',
      'Rank, nullity, row‑reduced echelon form, Gaussian elimination',
      'Systems of linear equations and solution spaces',
      'Determinant and its properties',
      'Eigenvalues, eigenvectors, characteristic polynomial',
      'Diagonalization and similarity transformations',
      'Orthogonality, orthonormal bases, projection matrices',
      'Gram–Schmidt orthogonalization',
      'Quadratic forms and definiteness',
      'Singular Value Decomposition (SVD)',
      'Applications to PCA and least squares'
    ],
    important: [0, 2, 5, 7, 11]
  },
  {
    id: 'calculus_opt',
    name: 'Calculus & Optimization',
    topics: [
      'Limits, continuity, differentiability for single‑variable functions',
      'Rules of differentiation: product, quotient, chain',
      'Taylor series expansion and approximations',
      'Maxima and minima of single‑variable functions',
      'Partial derivatives and gradient',
      'Directional derivatives, Jacobian, Hessian',
      'Constrained optimization, Lagrange multipliers',
      'Gradient descent and its variants (conceptual)',
      'Basic integration techniques and definite integrals',
      'Double and triple integrals (overview)',
      'Ordinary differential equations (basic types)'
    ],
    important: [1, 4, 6, 7]
  },
  {
    id: 'prog_dsa',
    name: 'Programming, Data Structures & Algorithms',
    topics: [
      'Programming basics in Python (syntax, control flow, functions)',
      'Arrays, lists and strings operations',
      'Stacks, queues and linked lists',
      'Trees: binary trees, BSTs and basic traversals',
      'Heaps and priority queues',
      'Hash tables and collision handling ideas',
      'Time and space complexity, Big‑O notation',
      'Searching: linear search, binary search',
      'Sorting: selection, bubble, insertion sort',
      'Divide and conquer: merge sort, quicksort',
      'Intro to graphs: representation (list/matrix)',
      'Graph algorithms: BFS, DFS',
      'Shortest path: Dijkstra (basics)',
      'Recursive algorithms and recurrence intuition'
    ],
    important: [6, 3, 4, 10, 11]
  },
  {
    id: 'db_warehousing',
    name: 'Database Management & Warehousing',
    topics: [
      'ER model: entities, attributes, relationships',
      'Relational model: schema, keys, integrity constraints',
      'Relational algebra and tuple relational calculus (basics)',
      'SQL: SELECT with WHERE, ORDER BY, LIMIT',
      'SQL: joins (INNER, LEFT, RIGHT), GROUP BY, HAVING',
      'SQL: subqueries, aggregate functions',
      'Normalization: 1NF, 2NF, 3NF (overview)',
      'Transactions and ACID properties',
      'Indexing and basic query optimization ideas',
      'File organization and storage basics',
      'Data transformation: normalization, discretization, sampling, compression',
      'Data warehouse modelling: star and snowflake schemas',
      'Multidimensional data models and concept hierarchies',
      'Measures: categorization and computation in cubes'
    ],
    important: [3, 4, 6, 7, 11]
  },
  {
    id: 'ml',
    name: 'Machine Learning',
    topics: [
      'Supervised learning: regression vs classification problems',
      'Simple and multiple linear regression',
      'Ridge, Lasso, Elastic Net (concepts)',
      'Logistic regression (binary classification)',
      'k‑Nearest Neighbours (KNN) classification',
      'Naive Bayes classifier',
      'Linear Discriminant Analysis (LDA) and QDA (concepts)',
      'Support Vector Machines: linear & kernel intuition',
      'Decision trees: splitting criteria, pruning',
      'Ensembles: Bagging, Random Forests',
      'Boosting: AdaBoost, Gradient Boosting (conceptual)',
      'Neural networks: perceptron, MLP, activation functions',
      'Backpropagation and gradient‑based training (idea)',
      'Regularization: L2, L1, dropout, early stopping',
      'Model evaluation: train/test split, k‑fold CV',
      'Confusion matrix: precision, recall, F1',
      'ROC curve, AUC, PR curve',
      'Bias–variance trade‑off, overfitting vs underfitting',
      'Unsupervised: k‑means, hierarchical clustering',
      'Dimensionality reduction: PCA (concept and math)',
      'Anomaly detection basics'
    ],
    important: [1, 3, 7, 8, 9, 11, 14, 15, 17, 19]
  },
  {
    id: 'ai',
    name: 'Artificial Intelligence',
    topics: [
      'Problem formulation and state‑space representation',
      'Uninformed search: BFS, DFS, uniform‑cost search',
      'Informed search: best‑first, A* and heuristics',
      'Adversarial search: minimax, alpha‑beta pruning ideas',
      'Constraint satisfaction problems: variables, domains, constraints',
      'Propositional logic: syntax, semantics, inference rules',
      'First‑order (predicate) logic basics',
      'Knowledge representation: semantic networks and frames (overview)',
      'Reasoning under uncertainty: probabilistic view',
      'Bayesian reasoning and independence (high level)',
      'Planning basics (STRIPS‑like view)',
      'Very basic NLP/vision awareness (only conceptual)'
    ],
    important: [1, 2, 4, 5]
  },
  {
    id: 'ga',
    name: 'General Aptitude',
    topics: [
      'Basic English grammar: tenses, prepositions, articles',
      'Vocabulary: words, idioms, phrases in context',
      'Reading comprehension and inference',
      'Numerical ability: percentages, ratios, averages',
      'Series, progressions and simple equations',
      'Permutations, combinations, basic probability',
      'Data interpretation: tables, bar and pie charts',
      'Logical reasoning and analytical puzzles',
      'Spatial reasoning and pattern recognition (basic)'
    ],
    important: [2, 3, 6, 7]
  }
];

// CSE syllabus
const subjectsCSE = [
  {
    id: 'engg_maths',
    name: 'Engineering Mathematics',
    topics: [
      'Linear algebra: matrices, eigenvalues, eigenvectors',
      'Calculus: limits, continuity, differentiation, integration',
      'Probability and statistics basics',
      'Numerical methods: interpolation, numerical integration',
      'Complex variables (overview)',
      'Transform theory (Laplace/Z basics)'
    ],
    important: [0, 1, 2]
  },
  {
    id: 'dm',
    name: 'Discrete Mathematics',
    topics: [
      'Propositional and first‑order logic',
      'Sets, relations and functions',
      'Combinatorics and counting',
      'Graphs and trees: basics and properties',
      'Partial orders and lattices (overview)',
      'Algebraic structures: groups, rings (basic awareness)'
    ],
    important: [0, 1, 3]
  },
  {
    id: 'prog_dsa_cse',
    name: 'Programming & Data Structures',
    topics: [
      'C / C++ basics: types, pointers, memory model',
      'Control flow, functions, recursion',
      'Arrays, strings and linked lists',
      'Stacks and queues',
      'Trees and binary search trees',
      'Heaps and priority queues',
      'Hashing and hash tables',
      'Time and space complexity basics'
    ],
    important: [0, 2, 4, 6, 7]
  },
  {
    id: 'algo',
    name: 'Algorithms',
    topics: [
      'Asymptotic analysis: Big‑O, Big‑Theta, Big‑Omega',
      'Divide & conquer: merge sort, quicksort, recurrence ideas',
      'Greedy algorithms and typical problems',
      'Dynamic programming patterns',
      'Graph algorithms: BFS, DFS, MST, shortest paths',
      'String matching basics (Naive, KMP idea)',
      'NP‑completeness (basic awareness)'
    ],
    important: [0, 1, 3, 4]
  },
  {
    id: 'toc',
    name: 'Theory of Computation',
    topics: [
      'Regular languages and finite automata',
      'Context‑free grammars and pushdown automata',
      'Regular expressions and closure properties',
      'Turing machines and decidability',
      'Undecidability and reductions (overview)'
    ],
    important: [0, 1, 3]
  },
  {
    id: 'coa',
    name: 'Computer Organization & Architecture',
    topics: [
      'Number systems and digital circuits (overview)',
      'Machine instructions and addressing modes',
      'ALU design and data path basics',
      'Memory hierarchy: cache, main memory, virtual memory',
      'Pipelining: hazards and basic concepts',
      'I/O and interrupt basics'
    ],
    important: [1, 3, 4]
  },
  {
    id: 'os',
    name: 'Operating Systems',
    topics: [
      'Processes, threads and CPU scheduling',
      'Synchronization: semaphores, monitors, classic problems',
      'Deadlocks: conditions, prevention, detection',
      'Memory management: paging and segmentation',
      'Virtual memory and replacement policies',
      'File systems and I/O basics'
    ],
    important: [0, 1, 3, 4]
  },
  {
    id: 'dbms_cse',
    name: 'Databases',
    topics: [
      'ER model and relational model',
      'Relational algebra basics',
      'SQL queries, joins, aggregation',
      'Normalization: 1NF, 2NF, 3NF',
      'Transactions, concurrency, recovery',
      'Indexing and query processing basics'
    ],
    important: [2, 3, 4]
  },
  {
    id: 'cn',
    name: 'Computer Networks',
    topics: [
      'OSI and TCP/IP reference models',
      'Physical and data link layer basics',
      'MAC protocols and Ethernet',
      'IP addressing, routing and subnetting',
      'Transport layer: TCP, UDP',
      'Application layer: DNS, HTTP, email basics'
    ],
    important: [3, 4]
  },
  {
    id: 'compiler',
    name: 'Compiler Design',
    topics: [
      'Lexical analysis and tokens',
      'Parsing: LL, LR idea (high level)',
      'Syntax‑directed translation basics',
      'Intermediate code generation',
      'Runtime environment and symbol tables',
      'Code optimization basics'
    ],
    important: [0, 1, 4]
  },
  {
    id: 'dl_logic',
    name: 'Digital Logic (CSE)',
    topics: [
      'Number systems and codes',
      'Boolean algebra and logic gates',
      'Combinational circuits: adders, multiplexers, decoders',
      'Sequential circuits: latches, flip‑flops, counters',
      'Minimization and K‑maps'
    ],
    important: [1, 2, 3]
  },
  {
    id: 'ga_cse',
    name: 'General Aptitude',
    topics: [
      'English usage and grammar',
      'Vocabulary and reading comprehension',
      'Basic numerics: percentages, ratios, averages',
      'Data interpretation: tables, charts',
      'Analytical and logical reasoning'
    ],
    important: [1, 3, 4]
  }
];

function getActiveSubjects() {
  return currentMode === 'da' ? subjectsDA : subjectsCSE;
}

let checklistState = {};

function loadChecklist() {
  try {
    const raw = localStorage.getItem(CHECKLIST_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        checklistState = parsed;
      }
    }
  } catch (e) {
    console.warn('Checklist load error', e);
  }
}

function saveChecklist() {
  try {
    localStorage.setItem(CHECKLIST_KEY, JSON.stringify(checklistState));
  } catch (e) {
    console.warn('Checklist save error', e);
  }
}

function buildChecklist() {
  if (!checklistContainer) return;
  const subjects = getActiveSubjects();
  checklistContainer.innerHTML = '';
  let totalTopics = 0;
  let doneTopics = 0;

  subjects.forEach(subj => {
    const block = document.createElement('div');
    block.className = 'subject-block';

    const header = document.createElement('div');
    header.className = 'subject-header';

    const title = document.createElement('div');
    title.className = 'subject-title';
    title.textContent = subj.name;

    const progress = document.createElement('div');
    progress.className = 'subject-progress';

    const toggleIcon = document.createElement('span');
    toggleIcon.className = 'subject-toggle-icon';
    toggleIcon.textContent = '▼';

    header.appendChild(title);
    header.appendChild(progress);
    header.appendChild(toggleIcon);

    const body = document.createElement('div');
    body.className = 'subject-body';

    const list = document.createElement('div');

    subj.topics.forEach((topic, idx) => {
      totalTopics++;
      const topicId = subj.id + '_' + idx;
      const checked = checklistState[topicId] === true;

      if (checked) doneTopics++;

      const item = document.createElement('div');
      item.className = 'topic-item';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = topicId;
      checkbox.checked = checked;

      checkbox.addEventListener('change', () => {
        checklistState[topicId] = checkbox.checked;
        saveChecklist();
        updateChecklistStats();
      });

      const label = document.createElement('label');
      label.className = 'topic-label';
      label.htmlFor = topicId;
      label.textContent = topic;

      if (Array.isArray(subj.important) && subj.important.includes(idx)) {
        label.classList.add('important-topic');
      }

      item.appendChild(checkbox);
      item.appendChild(label);
      list.appendChild(item);
    });

    body.appendChild(list);
    block.appendChild(header);
    block.appendChild(body);
    checklistContainer.appendChild(block);

    header.addEventListener('click', () => {
      const isOpen = body.classList.contains('open');
      body.classList.toggle('open', !isOpen);
      toggleIcon.textContent = isOpen ? '▼' : '▲';
    });

    function updateSubjectProgress() {
      const total = subj.topics.length;
      let done = 0;
      subj.topics.forEach((_, idx) => {
        const id = subj.id + '_' + idx;
        if (checklistState[id]) done++;
      });
      const pct = total > 0 ? Math.round((done / total) * 100) : 0;
      progress.textContent = pct + '%';
    }

    subj._updateProgress = updateSubjectProgress;
    updateSubjectProgress();
  });

  if (topicsTotalEl) topicsTotalEl.textContent = totalTopics;
  if (topicsDoneEl) topicsDoneEl.textContent = doneTopics;
  const pctAll = totalTopics > 0 ? Math.round((doneTopics / totalTopics) * 100) : 0;
  if (overallProgressEl) overallProgressEl.textContent = pctAll + '%';
}

function updateChecklistStats() {
  const subjects = getActiveSubjects();
  let totalTopics = 0;
  let doneTopics = 0;

  subjects.forEach(subj => {
    subj.topics.forEach((_, idx) => {
      totalTopics++;
      const id = subj.id + '_' + idx;
      if (checklistState[id]) doneTopics++;
    });
  });

  if (topicsTotalEl) topicsTotalEl.textContent = totalTopics;
  if (topicsDoneEl) topicsDoneEl.textContent = doneTopics;
  const pctAll = totalTopics > 0 ? Math.round((doneTopics / totalTopics) * 100) : 0;
  if (overallProgressEl) overallProgressEl.textContent = pctAll + '%';

  subjects.forEach(subj => {
    if (typeof subj._updateProgress === 'function') subj._updateProgress();
  });
}

// ---- Goal score planner (easy-first) ----
const goalScoreInput = document.getElementById('goalScoreInput');
const goalScoreBtn = document.getElementById('goalScoreBtn');
const goalPlanContainer = document.getElementById('goalPlanContainer');

// DA subject-wise marks
const subjectWeightageDA = [
  { id: 'prob_stats',   name: 'Probability & Statistics',          marks: 17, difficulty: 2, note: 'Very high ROI; fundamentals + practice give strong returns.' },
  { id: 'prog_dsa',     name: 'Programming, DSA',                  marks: 17, difficulty: 2, note: 'High scoring once concepts and PYQs are done; direct coding intuition helps.' },
  { id: 'ml',           name: 'Machine Learning',                  marks: 11, difficulty: 2, note: 'Conceptual, formula‑driven; many medium‑level theory questions.' },
  { id: 'linear_algebra', name: 'Linear Algebra',                  marks: 10, difficulty: 2, note: 'Short, crisp topics; heavily used in ML/DA questions.' },
  { id: 'db_warehousing', name: 'DBMS & Warehousing',              marks: 8,  difficulty: 1, note: 'Concepts are finite and often repeated; very scoring if PYQs done.' },
  { id: 'calculus_opt', name: 'Calculus & Optimization',           marks: 8,  difficulty: 3, note: 'Important for gradients and optimization; focus on targeted formulas.' },
  { id: 'ai',           name: 'Artificial Intelligence',           marks: 11, difficulty: 3, note: 'Search/logic questions can be tricky; do standard patterns first.' },
  { id: 'ga',           name: 'General Aptitude',                  marks: 15, difficulty: 1, note: 'Most scoring with consistent practice; do throughout the prep.' }
];

// CSE subject-wise marks
const subjectWeightageCSE = [
  { id: 'ga_cse',       name: 'General Aptitude',                  marks: 15, difficulty: 1, note: 'Very scoring; should be done throughout prep.' },
  { id: 'engg_maths',   name: 'Engineering Mathematics',           marks: 13, difficulty: 2, note: 'Core maths; supports almost every technical subject.' },
  { id: 'prog_dsa_cse', name: 'Programming & Data Structures',     marks: 9,  difficulty: 2, note: 'Strengthens coding and many CSE questions.' },
  { id: 'algo',         name: 'Algorithms',                        marks: 9,  difficulty: 2, note: 'Central to CS; heavy focus on design and analysis.' },
  { id: 'os',           name: 'Operating Systems',                 marks: 9,  difficulty: 2, note: 'Important core subject with many conceptual questions.' },
  { id: 'cn',           name: 'Computer Networks',                 marks: 9,  difficulty: 2, note: 'Frequent appearance in recent papers.' },
  { id: 'coa',          name: 'Computer Organization & Architecture', marks: 8, difficulty: 2, note: 'Helps in understanding low‑level computer behavior.' },
  { id: 'dbms_cse',     name: 'Databases',                         marks: 7,  difficulty: 1, note: 'SQL and theory are high‑yield and predictable.' },
  { id: 'toc',          name: 'Theory of Computation',             marks: 8,  difficulty: 3, note: 'Requires practice but gives solid marks once understood.' },
  { id: 'compiler',     name: 'Compiler Design',                   marks: 6,  difficulty: 3, note: 'Usually a few high‑value questions.' },
  { id: 'dl_logic',     name: 'Digital Logic',                     marks: 5,  difficulty: 2, note: 'Short and scoring with practice.' }
];

function getActiveWeightage() {
  return currentMode === 'da' ? subjectWeightageDA : subjectWeightageCSE;
}

function getSortedSubjects() {
  return getActiveWeightage()
    .map(s => ({ ...s, score: s.marks / s.difficulty }))
    .sort((a, b) => b.score - a.score);
}

function planForGoal(targetMarks) {
  const sorted = getSortedSubjects();
  const plan = [];
  let remaining = targetMarks;

  sorted.forEach(sub => {
    if (remaining <= 0) {
      plan.push({
        ...sub,
        target: 0,
        priority: 'Optional / buffer'
      });
      return;
    }

    const maxSafe = Math.round(sub.marks * 0.8);
    const allocated = Math.min(maxSafe, remaining);
    remaining -= allocated;

    plan.push({
      ...sub,
      target: allocated,
      priority: allocated > 0 ? 'High' : 'Optional / buffer'
    });
  });

  return plan;
}

function renderGoalPlan(targetMarks) {
  if (!goalPlanContainer) return;
  goalPlanContainer.innerHTML = '';

  if (!targetMarks || targetMarks <= 0) {
    goalPlanContainer.innerHTML = '<p style="font-size:0.85rem;">Enter a valid target score to see the plan.</p>';
    return;
  }

  const plan = planForGoal(targetMarks);
  const sortedPlan = plan.filter(p => true);

  sortedPlan.forEach((p, index) => {
    const box = document.createElement('div');
    box.className = 'plan-subject';

    const title = document.createElement('div');
    title.className = 'plan-subject-title';
    title.textContent = (index + 1) + '. ' + p.name;

    const meta = document.createElement('div');
    meta.className = 'plan-subject-meta';
    const pct = p.target > 0 ? ((p.target / targetMarks) * 100).toFixed(1) : '0.0';
    meta.innerHTML =
      `<strong>Target:</strong> ${p.target} / ${p.marks} marks &nbsp;` +
      `<span>(~${pct}% of your goal)</span><br>` +
      `<strong>Priority:</strong> ${p.priority}`;

    const note = document.createElement('div');
    note.style.fontSize = '0.78rem';
    note.style.marginTop = '0.2rem';
    note.style.color = '#FFFFFFB3';
    note.textContent = p.note;

    box.appendChild(title);
    box.appendChild(meta);
    box.appendChild(note);
    goalPlanContainer.appendChild(box);
  });

  const totalAllocated = plan.reduce((sum, s) => sum + s.target, 0);
  if (totalAllocated < targetMarks) {
    const info = document.createElement('p');
    info.className = 'estimate-note';
    info.textContent =
      'Note: The allocated subject targets sum to slightly less than your goal for safety. Remaining marks can come from extra accuracy in strong subjects.';
    goalPlanContainer.appendChild(info);
  }
}

if (goalScoreBtn) {
  goalScoreBtn.addEventListener('click', () => {
    const val = parseInt(goalScoreInput.value, 10);
    if (isNaN(val) || val < 30 || val > 100) {
      alert('Enter a realistic target between 30 and 100 marks.');
      return;
    }
    renderGoalPlan(val);
  });
}

// ---- Dynamic preparation timeline ----
const timelineYearInput = document.getElementById('timelineYearInput');
const timelinePlanBtn = document.getElementById('timelinePlanBtn');
const timelinePlanCard = document.getElementById('timelinePlanCard');
const timelineHeading = document.getElementById('timelineHeading');
const timelineSummary = document.getElementById('timelineSummary');
const timelinePhases = document.getElementById('timelinePhases');

function monthsBetween(startDate, endDate) {
  let months = (endDate.getFullYear() - startDate.getFullYear()) * 12;
  months += endDate.getMonth() - startDate.getMonth();
  const daysDiff = endDate.getDate() - startDate.getDate();
  if (daysDiff > 0) months += 0.3;
  return Math.max(0, months);
}

function pickTimelineTemplate(monthsLeft) {
  if (monthsLeft >= 24) return 'two_year';
  if (monthsLeft >= 12) return 'one_year';
  if (monthsLeft >= 6) return 'nine_month';
  return 'crash';
}

function buildTimelinePhases(template) {
  const phases = [];

  if (template === 'two_year') {
    phases.push({
      title: 'Phase 1 – Foundations',
      period: 'First 6–8 months',
      focus: [
        'Engineering maths: linear algebra, calculus, probability basics',
        'Programming + DSA fundamentals in one language',
        'Light start on DBMS and simple ML (regression, classification)',
        'Daily 30–60 min General Aptitude practice'
      ]
    });
    phases.push({
      title: 'Phase 2 – Core syllabus',
      period: 'Next 10–12 months',
      focus: [
        'Full core syllabus (DA/CSE depending on mode)',
        'Topic‑wise practice and short notes',
        'Finish first pass of entire syllabus ~6 months before exam'
      ]
    });
    phases.push({
      title: 'Phase 3 – PYQs + mocks',
      period: 'Last 4–6 months',
      focus: [
        'PYQs of last 10+ years',
        'Sectional and full‑length mocks with detailed analysis',
        'Multiple revision cycles using your short notes'
      ]
    });
  } else if (template === 'one_year') {
    phases.push({
      title: 'Phase 1 – Learning',
      period: 'First 5–6 months',
      focus: [
        'Cover all high‑weight subjects once',
        'Prepare running notes and formula sheets',
        'Do basic PYQs after finishing each chapter'
      ]
    });
    phases.push({
      title: 'Phase 2 – Practice',
      period: 'Next 3–4 months',
      focus: [
        'Second pass over weak subjects and tricky topics',
        'Daily mixed problem sets and timed section tests',
        'Refine short notes and error log from mistakes'
      ]
    });
    phases.push({
      title: 'Phase 3 – Revision & mocks',
      period: 'Last 2–3 months',
      focus: [
        'Full‑length mocks 2–3 times per week',
        'Only revision, speed, accuracy and exam temperament',
        'Sleep schedule and stamina aligned with exam slot'
      ]
    });
  } else if (template === 'nine_month') {
    phases.push({
      title: 'Phase 1 – Condensed learning',
      period: 'First 3–4 months',
      focus: [
        'Prioritise high‑weight topics',
        'Keep low‑weight topics basic but exam‑oriented',
        'Strict weekly targets and subject‑wise tests'
      ]
    });
    phases.push({
      title: 'Phase 2 – Heavy practice',
      period: 'Next 2–3 months',
      focus: [
        'Finish remaining topics quickly',
        'Daily PYQs and mixed practice sets',
        'Start full‑length mocks at least once a week'
      ]
    });
    phases.push({
      title: 'Phase 3 – High‑intensity revision',
      period: 'Last 2 months',
      focus: [
        'Short notes only; no new books',
        'Full mocks, detailed analysis, fix recurring mistakes',
        'Light but consistent aptitude practice'
      ]
    });
  } else {
    phases.push({
      title: 'Phase 1 – Smart selection',
      period: 'Weeks 1–2',
      focus: [
        'Identify your strong areas from college courses',
        'Prioritise 4–5 high‑weight subjects you can finish quickly',
        'Gather concise notes and PYQ‑oriented material only'
      ]
    });
    phases.push({
      title: 'Phase 2 – Focused grind',
      period: 'Next 6–8 weeks',
      focus: [
        'Daily schedule: 2–3 subjects + mixed PYQs',
        'Skip ultra‑low‑weight or very tough fringe topics',
        'Take short mocks to learn time management'
      ]
    });
    phases.push({
      title: 'Phase 3 – Last lap',
      period: 'Final 2–3 weeks',
      focus: [
        'Revise formula sheets and error log repeatedly',
        'Attempt a few full mocks, then taper volume',
        'Protect sleep, health and mental calm'
      ]
    });
  }

  return phases;
}

function renderTimeline(template, monthsLeft, targetYear) {
  if (!timelinePlanCard || !timelinePhases) return;

  timelinePhases.innerHTML = '';
  timelinePlanCard.style.display = 'block';

  let headline;
  if (template === 'two_year') {
    headline = '2‑year style roadmap';
  } else if (template === 'one_year') {
    headline = '1‑year style roadmap';
  } else if (template === 'nine_month') {
    headline = '9–12 month intensive plan';
  } else {
    headline = 'Crash‑course style plan';
  }

  if (timelineHeading) {
    timelineHeading.textContent = `${headline} for GATE ${targetYear}`;
  }

  if (timelineSummary) {
    timelineSummary.textContent =
      `From today you have roughly ${monthsLeft.toFixed(1)} months before the exam (assuming February ${targetYear}). ` +
      `Use the phases below as a structure and plug your own daily/weekly hours.`;
  }

  const phases = buildTimelinePhases(template);

  phases.forEach(phase => {
    const card = document.createElement('div');
    card.className = 'card';

    const h3 = document.createElement('h3');
    h3.textContent = phase.title;

    const period = document.createElement('p');
    period.style.fontSize = '0.85rem';
    period.className = 'estimate-note';
    period.textContent = phase.period;

    const ul = document.createElement('ul');
    phase.focus.forEach(item => {
      const li = document.createElement('li');
      li.textContent = item;
      ul.appendChild(li);
    });

    card.appendChild(h3);
    card.appendChild(period);
    card.appendChild(ul);
    timelinePhases.appendChild(card);
  });
}

if (timelinePlanBtn) {
  timelinePlanBtn.addEventListener('click', () => {
    const val = parseInt(timelineYearInput.value, 10);
    if (isNaN(val) || val < 2026 || val > 2035) {
      alert('Enter a valid GATE year between 2026 and 2035.');
      return;
    }

    const today = new Date();
    const examDate = new Date(val, 1, 1); // February of target year
    const monthsLeft = monthsBetween(today, examDate);

    if (monthsLeft <= 0) {
      alert('This exam window is already over or too close. Choose a later year.');
      return;
    }

    const template = pickTimelineTemplate(monthsLeft);
    renderTimeline(template, monthsLeft, val);
  });
}

// ---- Overview text mode-aware ----
const overviewIntroEl = document.getElementById('overviewIntro');

function applyOverviewText() {
  if (!overviewIntroEl) return;
  if (currentMode === 'cse') {
    overviewIntroEl.textContent =
      'This hub is tuned for GATE CSE preparation with a focus on core CS, algorithms, OS, CN, DBMS and aptitude.';
  } else {
    overviewIntroEl.textContent =
      'This hub is tuned for GATE DA / AI preparation with a focus on ML, statistics, and core CS fundamentals.';
  }
}

// ---- Apply mode to data/UI ----
function applyModeToDataAndUI() {
  loadChecklist();
  buildChecklist();
  updateChecklistStats();

  if (goalScoreInput && goalScoreInput.value) {
    const val = parseInt(goalScoreInput.value, 10);
    if (!isNaN(val)) {
      renderGoalPlan(val);
    }
  }

  applyOverviewText();
}

// initial checklist build
loadChecklist();
buildChecklist();
updateChecklistStats();
applyOverviewText();
