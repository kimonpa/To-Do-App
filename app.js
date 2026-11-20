// Storage keys used in localStorage. Tasks are saved per user: "todo-tasks:<name>".
const USER_KEY = "todo-username";
const TASKS_KEY_PREFIX = "todo-tasks:";

// Page elements.
const loginScreen = document.getElementById("login-screen");
const loginForm = document.getElementById("login-form");
const usernameInput = document.getElementById("username");
const appScreen = document.getElementById("app-screen");
const greeting = document.getElementById("greeting");
const logoutButton = document.getElementById("logout-button");
const taskForm = document.getElementById("task-form");
const taskInput = document.getElementById("task-input");
const taskList = document.getElementById("task-list");
const emptyMessage = document.getElementById("empty-message");
const countDelayed = document.getElementById("count-delayed");
const countOpen = document.getElementById("count-open");
const countDone = document.getElementById("count-done");
const clearDoneButton = document.getElementById("clear-done");

// The logged-in user's name, or null when nobody is logged in.
let currentUser = null;

// A task can be open, done (tick mark) or delayed (red square).
const STATUSES = [
  { key: "open", label: "Open" },
  { key: "done", label: "Done" },
  { key: "delayed", label: "Delayed" }
];

// Each task is { id, text, status }. These belong to the current user.
let tasks = [];

// The id of the task whose status menu is open, or null when none is open.
let openMenuId = null;

// Status buttons from the last redraw, by task id. Used to give a button focus again.
let statusButtons = {};

// Builds a pattern that matches whole words, with common endings (play, plays, played, playing).
function words(...list) {
  return new RegExp("\\b(?:" + list.join("|") + ")(?:s|es|ed|d|ing)?\\b", "i");
}

// Task categories. For each task, the first rule that matches its words gives the emoji.
// The order matters: "practise piano" is music, not study. Specific rules come before general ones.
const CATEGORIES = [
  {
    name: "music",
    rules: [
      [words("piano", "keyboard", "synth", "synthesizer"), "🎹"],
      [words("guitar", "bass", "ukulele"), "🎸"],
      [words("violin", "viola", "cello", "fiddle"), "🎻"],
      [words("drum", "drums", "drumming", "percussion"), "🥁"],
      [words("saxophone", "sax", "jazz", "trumpet", "trombone", "clarinet", "flute"), "🎷"],
      [words("sing", "singing", "choir", "karaoke", "vocal", "vocals"), "🎤"],
      [words("compose", "composing", "composition", "sheet music", "scales", "chords", "music theory"), "🎼"],
      [words("playlist", "album", "dj", "headphones"), "🎧"],
      [words("music", "song", "songs", "band", "concert", "rehearsal", "rehearse", "melody", "tune", "lyrics", "orchestra", "gig", "recital", "instrument"), "🎵"]
    ]
  },
  {
    name: "sport",
    rules: [
      [words("ping pong", "table tennis"), "🏓"],
      [words("badminton"), "🏸"],
      [words("tennis", "padel"), "🎾"],
      [words("football", "soccer", "futsal"), "⚽"],
      [words("basketball", "hoops"), "🏀"],
      [words("volleyball"), "🏐"],
      [words("rugby"), "🏉"],
      [words("baseball", "softball"), "⚾"],
      [words("hockey"), "🏒"],
      [words("cricket"), "🏏"],
      [words("golf"), "⛳"],
      [words("gymnastics", "gymnast", "cartwheel", "tumbling"), "🤸"],
      [words("boxing", "kickboxing", "sparring"), "🥊"],
      [words("karate", "judo", "taekwondo", "martial arts"), "🥋"],
      [words("climb", "climbing", "bouldering"), "🧗"],
      [words("ski", "skiing", "snowboard", "snowboarding"), "🏂"],
      [words("skate", "skating", "ice skating"), "⛸️"],
      [words("surf", "surfing"), "🏄"],
      [words("row", "rowing", "kayak", "kayaking", "canoe"), "🚣"],
      [words("hike", "hiking", "trek", "trekking"), "🥾"],
      [words("swim", "swimming", "swam"), "🏊"],
      [words("bike", "biking", "cycle", "cycling", "spinning"), "🚴"],
      [words("yoga", "stretch", "stretching", "pilates", "meditate", "meditation"), "🧘"],
      [words("dance", "dancing", "ballet", "zumba"), "💃"],
      [/\b(?:run|runs|running|ran|jog|jogging|jogged|marathon|sprint|sprints|5k|10k|parkrun)\b(?!\s+(?:some\s+|a\s+)?(?:errands?|out|late)\b)/i, "🏃"],
      [words("gym", "workout", "work ?out", "exercise", "weights", "lifting", "deadlift", "crossfit", "squats", "push-?ups?", "pull-?ups?", "bench press", "cardio", "fitness"), "🏋️"],
      [words("sport", "sports", "athletics", "tournament", "race", "coach", "coaching"), "🏅"]
    ]
  },
  {
    name: "study",
    rules: [
      [words("physics", "chemistry", "biology", "science", "experiment", "lab"), "🔬"],
      [words("math", "maths", "mathematics", "algebra", "geometry", "calculus", "statistics", "arithmetic"), "🧮"],
      [words("code", "coding", "programming", "python", "javascript", "html", "css", "debug", "debugging", "software"), "💻"],
      [words("essay", "thesis", "dissertation"), "✍️"],
      [words("read", "reading", "chapter", "novel"), "📖"],
      [words("exam", "exams", "quiz", "revise", "revision"), "📝"],
      [words("study", "studies", "studied", "studying", "homework", "assignment", "learn", "learning", "learnt", "lecture", "lesson", "class", "course", "textbook", "flashcards", "school", "university", "college", "tutorial", "tutor", "vocabulary", "grammar"), "📚"]
    ]
  },
  {
    name: "work",
    rules: [
      [words("email", "emails", "e-mail", "inbox", "newsletter"), "📧"],
      [words("invoice", "invoices", "receipt", "receipts", "expenses", "tax", "taxes"), "🧾"],
      [words("report", "reports", "spreadsheet", "excel", "analysis", "analytics", "data", "chart", "kpi", "sales"), "📊"],
      [words("contract", "contracts", "proposal", "document", "documents", "paperwork", "form"), "📑"],
      [words("calendar", "schedule", "agenda"), "🗓️"],
      [words("meeting", "meetings", "standup", "workshop", "team", "colleague", "colleagues", "interview"), "👥"],
      [words("work", "working", "job", "career", "office", "boss", "client", "clients", "customer", "customers", "deadline", "project", "projects", "presentation", "budget", "salary"), "💼"]
    ]
  },
  {
    name: "life",
    rules: [
      [words("doctor", "dentist", "hospital", "checkup", "check-up", "physio"), "🩺"],
      [words("medicine", "pills", "pharmacy", "prescription", "vitamins"), "💊"],
      [words("haircut", "barber", "hairdresser"), "💇"],
      [words("birthday", "cake"), "🎂"],
      [words("gift", "gifts", "present", "wedding", "anniversary"), "🎁"],
      [words("party", "celebrate", "celebration"), "🎉"],
      [words("flight", "flights", "travel", "trip", "vacation", "holiday", "airport", "passport", "packing", "luggage"), "✈️"],
      [words("car", "drive", "driving", "drove", "petrol", "gas", "mechanic", "garage", "mot"), "🚗"],
      [words("errand", "errands", "buy", "bought", "shop", "shopping", "groceries", "grocery", "supermarket", "market", "purchase", "order"), "🛒"],
      [words("cook", "cooking", "dinner", "lunch", "breakfast", "meal", "recipe", "bake", "baking"), "🍳"],
      [words("laundry", "iron", "ironing", "wash clothes"), "🧺"],
      [words("clean", "cleaning", "vacuum", "tidy", "dishes", "mop", "dust"), "🧹"],
      [words("fix", "repair", "plumber", "broken"), "🔧"],
      [words("pay", "paid", "bill", "bills", "rent", "bank", "insurance", "mortgage"), "💳"],
      [words("parcel", "package", "shipping", "post office"), "📦"],
      [words("water plants", "garden", "gardening", "plants"), "🌱"],
      [words("dog", "puppy", "vet"), "🐶"],
      [words("shower", "bath"), "🛁"],
      [words("sleep", "nap", "bed", "bedtime"), "😴"],
      [words("call", "phone", "ring"), "📞"]
    ]
  }
];

// Finds the category and emoji for a task's text. Returns null if nothing matches.
function classify(text) {
  for (const category of CATEGORIES) {
    for (const [pattern, emoji] of category.rules) {
      if (pattern.test(text)) {
        return { category: category.name, emoji: emoji };
      }
    }
  }
  return null;
}

// Returns the storage key for a user's tasks. The name is lower-cased, so "Kim" and "kim" share one list.
function tasksKey(name) {
  return TASKS_KEY_PREFIX + name.toLowerCase();
}

// Reads the saved username. Returns null if there is none or storage fails.
function loadUsername() {
  try {
    return localStorage.getItem(USER_KEY);
  } catch (error) {
    return null;
  }
}

// Saves the username. Returns true on success and false on failure.
function saveUsername(name) {
  try {
    localStorage.setItem(USER_KEY, name);
    return true;
  } catch (error) {
    return false;
  }
}

// Removes the saved username. Returns true on success and false on failure.
function clearUsername() {
  try {
    localStorage.removeItem(USER_KEY);
    return true;
  } catch (error) {
    return false;
  }
}

// Returns a task's status. Tasks saved earlier with done: true become "done".
function normaliseStatus(task) {
  if (STATUSES.some((status) => status.key === task.status)) return task.status;
  return task.done ? "done" : "open";
}

// Reads one user's saved tasks. Returns an empty list if none are saved or the data is bad.
function loadTasks(name) {
  try {
    const saved = JSON.parse(localStorage.getItem(tasksKey(name)));
    if (!Array.isArray(saved)) return [];
    return saved
      .filter((task) => task && typeof task.text === "string")
      .map((task) => ({ id: task.id, text: task.text, status: normaliseStatus(task) }));
  } catch (error) {
    return [];
  }
}

// Saves the current user's tasks. If storage fails, the tasks stay in memory for this visit.
function saveTasks() {
  try {
    localStorage.setItem(tasksKey(currentUser), JSON.stringify(tasks));
  } catch (error) {
    // Nothing else to do here.
  }
}

// Shows only the login form.
function showLogin() {
  currentUser = null;
  tasks = [];
  openMenuId = null;
  appScreen.hidden = true;
  loginScreen.hidden = false;
  usernameInput.value = "";
  usernameInput.focus();
}

// Shows only the app, with this user's own tasks.
function showApp(name) {
  currentUser = name;
  tasks = loadTasks(name);
  loginScreen.hidden = true;
  appScreen.hidden = false;
  greeting.textContent = `Hello, ${name}!`;
  renderTasks();
  taskInput.focus();
}

// Builds the status control for a task: a small box with a drop-down menu (Open, Done, Delayed).
function createStatusControl(task) {
  const current = STATUSES.find((status) => status.key === task.status);

  const wrapper = document.createElement("div");
  wrapper.className = "status";
  // Clicks inside the control must not reach the page, which closes open menus.
  wrapper.addEventListener("click", (event) => event.stopPropagation());

  const button = document.createElement("button");
  button.type = "button";
  button.className = "status-button";
  button.setAttribute("aria-haspopup", "menu");
  button.setAttribute("aria-expanded", String(openMenuId === task.id));
  button.setAttribute("aria-label", `Status of ${task.text}: ${current.label}. Change status`);
  button.addEventListener("click", () => toggleMenu(task.id));

  const box = document.createElement("span");
  box.className = `status-box ${task.status}`;
  box.textContent = task.status === "done" ? "✔" : "";

  const caret = document.createElement("span");
  caret.className = "caret";
  caret.setAttribute("aria-hidden", "true");
  caret.textContent = "▾";

  button.append(box, caret);
  wrapper.appendChild(button);
  statusButtons[task.id] = button;

  if (openMenuId === task.id) {
    const menu = document.createElement("div");
    menu.className = "status-menu";
    menu.setAttribute("role", "menu");

    STATUSES.forEach((status) => {
      const option = document.createElement("button");
      option.type = "button";
      option.className = status.key === task.status ? "menu-item current" : "menu-item";
      option.setAttribute("role", "menuitem");
      option.setAttribute("data-status", status.key);
      option.addEventListener("click", () => setStatus(task.id, status.key));

      const miniBox = document.createElement("span");
      miniBox.className = `status-box small ${status.key}`;
      miniBox.textContent = status.key === "done" ? "✔" : "";

      const label = document.createElement("span");
      label.textContent = status.label;

      option.append(miniBox, label);
      menu.appendChild(option);
    });

    wrapper.appendChild(menu);
  }

  return wrapper;
}

// Redraws the task list. Each row has a status box, an emoji for its category, the text and a Delete button.
// Done tasks are greyed out and lose their emoji. Delayed tasks are marked red and keep their emoji.
function renderTasks() {
  taskList.innerHTML = "";
  statusButtons = {};

  tasks.forEach((task) => {
    const match = classify(task.text);

    const item = document.createElement("li");
    item.className = "task";
    if (match) item.className += ` cat-${match.category}`;
    if (task.status !== "open") item.className += ` ${task.status}`;

    item.appendChild(createStatusControl(task));

    if (match && task.status !== "done") {
      const emoji = document.createElement("span");
      emoji.className = "task-emoji";
      emoji.setAttribute("aria-hidden", "true");
      emoji.textContent = match.emoji;
      item.appendChild(emoji);
    }

    const text = document.createElement("span");
    text.className = "task-text";
    text.textContent = task.text;
    item.appendChild(text);

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.textContent = "Delete";
    deleteButton.setAttribute("aria-label", `Delete task: ${task.text}`);
    deleteButton.addEventListener("click", () => deleteTask(task.id));
    item.appendChild(deleteButton);

    taskList.appendChild(item);
  });

  emptyMessage.hidden = tasks.length > 0;
  updateSummary();
}

// Updates the footer. "Open" means not done, so delayed tasks count as open.
function updateSummary() {
  const done = tasks.filter((task) => task.status === "done").length;
  const delayed = tasks.filter((task) => task.status === "delayed").length;
  const open = tasks.length - done;

  countDelayed.textContent = `${delayed} of ${open} open ${open === 1 ? "task" : "tasks"} delayed`;
  countOpen.textContent = `${open} open`;
  countDone.textContent = `${done} completed`;
  clearDoneButton.disabled = done === 0;
}

// Gives keyboard focus back to a task's status button after a redraw.
function focusStatusButton(id) {
  if (statusButtons[id]) statusButtons[id].focus();
}

// Adds a new, open task, then saves and redraws.
function addTask(text) {
  tasks.push({ id: Date.now() + Math.random(), text: text, status: "open" });
  saveTasks();
  renderTasks();
}

// Removes every task marked done. Open and delayed tasks stay. Then saves and redraws.
function clearDone() {
  tasks = tasks.filter((task) => task.status !== "done");
  openMenuId = null;
  saveTasks();
  renderTasks();
}

// Opens a task's status menu, or closes it if it is already open.
function toggleMenu(id) {
  openMenuId = openMenuId === id ? null : id;
  renderTasks();
  focusStatusButton(id);
}

// Sets a task's status (open, done or delayed), closes the menu, then saves and redraws.
function setStatus(id, status) {
  const task = tasks.find((t) => t.id === id);
  if (!task) return;
  task.status = status;
  openMenuId = null;
  saveTasks();
  renderTasks();
  focusStatusButton(id);
}

// Deletes the task with the given id, then saves and redraws.
function deleteTask(id) {
  tasks = tasks.filter((task) => task.id !== id);
  openMenuId = null;
  saveTasks();
  renderTasks();
}

// Handles the login form. Logs in only if the name was saved.
loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = usernameInput.value.trim();
  if (name === "") return;

  if (!saveUsername(name)) {
    alert("We could not save your name. Check that your browser allows storage, then try again.");
    return;
  }
  showApp(name);
});

// Handles the Log out button. Forgets the username and shows the login form. Tasks stay saved.
logoutButton.addEventListener("click", () => {
  if (!clearUsername()) {
    alert("We could not log you out. Check that your browser allows storage, then try again.");
    return;
  }
  showLogin();
});

// Handles the Clear completed button.
clearDoneButton.addEventListener("click", clearDone);

// Handles the task form. Adds the typed task and clears the field.
taskForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = taskInput.value.trim();
  if (text === "") return;

  addTask(text);
  taskInput.value = "";
  taskInput.focus();
});

// Clicking anywhere else on the page closes an open status menu.
document.addEventListener("click", () => {
  if (openMenuId === null) return;
  openMenuId = null;
  renderTasks();
});

// Pressing Escape closes an open status menu.
document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape" || openMenuId === null) return;
  const id = openMenuId;
  openMenuId = null;
  renderTasks();
  focusStatusButton(id);
});

// On page load: stay logged in if a username was saved. Otherwise show the login form.
const savedName = loadUsername();
if (savedName) {
  showApp(savedName);
} else {
  showLogin();
}
