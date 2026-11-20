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

// The logged-in user's name, or null when nobody is logged in.
let currentUser = null;

// Each task is { id, text, done }. These belong to the current user.
let tasks = [];

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

// Reads one user's saved tasks. Returns an empty list if none are saved or the data is bad.
function loadTasks(name) {
  try {
    const saved = JSON.parse(localStorage.getItem(tasksKey(name)));
    return Array.isArray(saved) ? saved : [];
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

// Redraws the task list. Each row has a tick box, an emoji for its category, the text and a Delete button.
// Done tasks are greyed out and lose their emoji.
function renderTasks() {
  taskList.innerHTML = "";

  tasks.forEach((task) => {
    const match = classify(task.text);

    const item = document.createElement("li");
    item.className = "task";
    if (match) item.className += ` cat-${match.category}`;
    if (task.done) item.className += " done";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = Boolean(task.done);
    checkbox.setAttribute("aria-label", `Mark done: ${task.text}`);
    checkbox.addEventListener("change", () => toggleTask(task.id));
    item.appendChild(checkbox);

    if (match && !task.done) {
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
}

// Adds a new, not-done task, then saves and redraws.
function addTask(text) {
  tasks.push({ id: Date.now() + Math.random(), text: text, done: false });
  saveTasks();
  renderTasks();
}

// Marks a task done, or not done if it already was. Then saves and redraws.
function toggleTask(id) {
  const task = tasks.find((t) => t.id === id);
  if (!task) return;
  task.done = !task.done;
  saveTasks();
  renderTasks();
}

// Deletes the task with the given id, then saves and redraws.
function deleteTask(id) {
  tasks = tasks.filter((task) => task.id !== id);
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

// Handles the task form. Adds the typed task and clears the field.
taskForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = taskInput.value.trim();
  if (text === "") return;

  addTask(text);
  taskInput.value = "";
  taskInput.focus();
});

// On page load: stay logged in if a username was saved. Otherwise show the login form.
const savedName = loadUsername();
if (savedName) {
  showApp(savedName);
} else {
  showLogin();
}
