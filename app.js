const fileInput = document.getElementById("csvFile");
const statusEl = document.getElementById("status");
const cardEl = document.getElementById("card");
const frontEl = document.getElementById("cardFront");
const backEl = document.getElementById("cardBack");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const flipBtn = document.getElementById("flipBtn");
const shuffleBtn = document.getElementById("shuffleBtn");
const resetBtn = document.getElementById("resetBtn");
const clearBtn = document.getElementById("clearBtn");
const goodBtn = document.getElementById("goodBtn");
const badBtn = document.getElementById("badBtn");
const allTab = document.getElementById("allTab");
const badTab = document.getElementById("badTab");
const indexLabel = document.getElementById("indexLabel");
const countLabel = document.getElementById("countLabel");

let cards = [];
let originalCards = [];
let badCards = [];
let currentIndex = 0;
let currentView = "all";

function setStatus(message) {
  statusEl.textContent = message;
}

function getActiveDeck() {
  return currentView === "bad" ? badCards : cards;
}

function updateTabs() {
  const isAll = currentView === "all";
  allTab.classList.toggle("is-active", isAll);
  badTab.classList.toggle("is-active", !isAll);
  allTab.setAttribute("aria-selected", String(isAll));
  badTab.setAttribute("aria-selected", String(!isAll));
}

function updateControlState() {
  const activeDeck = getActiveDeck();
  const hasActive = activeDeck.length > 0;
  const hasOriginal = originalCards.length > 0;

  prevBtn.disabled = !hasActive;
  nextBtn.disabled = !hasActive;
  flipBtn.disabled = !hasActive;
  shuffleBtn.disabled = !hasActive;
  goodBtn.disabled = !hasActive;
  badBtn.disabled = !hasActive;
  resetBtn.disabled = !hasOriginal;
  clearBtn.disabled = !hasOriginal;
}

function updateProgress() {
  const activeDeck = getActiveDeck();
  indexLabel.textContent = activeDeck.length ? String(currentIndex + 1) : "0";
  countLabel.textContent = String(activeDeck.length);
}

function showCard(index) {
  const activeDeck = getActiveDeck();
  if (!activeDeck.length) {
    frontEl.textContent =
      currentView === "bad"
        ? "No bad cards yet"
        : "Load a CSV to begin";
    backEl.textContent = "Back of card";
    cardEl.classList.remove("is-flipped");
    updateProgress();
    return;
  }

  const card = activeDeck[index];
  frontEl.textContent = card.front;
  backEl.textContent = card.back;
  cardEl.classList.remove("is-flipped");
  updateProgress();
}

function clampIndex(index) {
  const activeDeck = getActiveDeck();
  if (index < 0) return activeDeck.length - 1;
  if (index >= activeDeck.length) return 0;
  return index;
}

function parseCSV(text) {
  const rows = [];
  let current = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      current.push(field);
      field = "";
    } else if (char === '\n') {
      current.push(field);
      rows.push(current);
      current = [];
      field = "";
    } else if (char !== '\r') {
      field += char;
    }
  }

  current.push(field);
  if (current.length > 1 || current[0].trim().length > 0) {
    rows.push(current);
  }

  return rows;
}

function parseXLSX(data) {
  if (typeof XLSX === "undefined") {
    throw new Error("XLSX parser not available.");
  }
  const workbook = XLSX.read(data, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return [];
  const sheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    raw: false,
    defval: "",
  });
}

function toCards(rows) {
  let nextId = 1;
  const mapped = rows
    .map((row) => {
      const front = (row[0] ?? "").trim();
      const back = (row[1] ?? "").trim();
      return { id: nextId++, front, back };
    })
    .filter((card) => card.front.length > 0 || card.back.length > 0);

  return mapped;
}

function loadCardsFromText(text) {
  const rows = parseCSV(text);
  const mappedCards = toCards(rows);

  if (mappedCards.length === 0) {
    setStatus("No usable rows found. Make sure the CSV has two columns.");
    cards = [];
    originalCards = [];
    badCards = [];
    currentIndex = 0;
    currentView = "all";
    updateTabs();
    showCard(0);
    updateControlState();
    return;
  }

  cards = mappedCards;
  originalCards = mappedCards.slice();
  badCards = [];
  currentIndex = 0;
  currentView = "all";
  updateTabs();
  setStatus(`Loaded ${cards.length} cards.`);
  showCard(currentIndex);
  updateControlState();
}

function loadCardsFromRows(rows) {
  const mappedCards = toCards(rows);

  if (mappedCards.length === 0) {
    setStatus("No usable rows found. Make sure the file has two columns.");
    cards = [];
    originalCards = [];
    badCards = [];
    currentIndex = 0;
    currentView = "all";
    updateTabs();
    showCard(0);
    updateControlState();
    return;
  }

  cards = mappedCards;
  originalCards = mappedCards.slice();
  badCards = [];
  currentIndex = 0;
  currentView = "all";
  updateTabs();
  setStatus(`Loaded ${cards.length} cards.`);
  showCard(currentIndex);
  updateControlState();
}

function shuffleDeck(deck) {
  for (let i = deck.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
}

function switchView(view) {
  currentView = view;
  currentIndex = 0;
  updateTabs();
  showCard(currentIndex);
  updateControlState();
}

fileInput.addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const fileName = file.name.toLowerCase();
  const isXlsx = fileName.endsWith(".xlsx");

  const reader = new FileReader();
  reader.onload = () => {
    try {
      if (isXlsx) {
        const data = reader.result instanceof ArrayBuffer ? reader.result : null;
        if (!data) throw new Error("Invalid XLSX data.");
        const rows = parseXLSX(data);
        loadCardsFromRows(rows);
      } else {
        const text = String(reader.result ?? "");
        loadCardsFromText(text);
      }
    } catch (error) {
      setStatus("Failed to parse the file. Check the format and try again.");
    }
  };
  reader.onerror = () => {
    setStatus("Failed to read the file. Try again.");
  };

  if (isXlsx) {
    reader.readAsArrayBuffer(file);
  } else {
    reader.readAsText(file);
  }
});

prevBtn.addEventListener("click", () => {
  if (!getActiveDeck().length) return;
  currentIndex = clampIndex(currentIndex - 1);
  showCard(currentIndex);
});

nextBtn.addEventListener("click", () => {
  if (!getActiveDeck().length) return;
  currentIndex = clampIndex(currentIndex + 1);
  showCard(currentIndex);
});

flipBtn.addEventListener("click", () => {
  cardEl.classList.toggle("is-flipped");
});

shuffleBtn.addEventListener("click", () => {
  const activeDeck = getActiveDeck();
  if (!activeDeck.length) return;
  shuffleDeck(activeDeck);
  currentIndex = 0;
  showCard(currentIndex);
  setStatus("Shuffled cards.");
});

resetBtn.addEventListener("click", () => {
  if (!originalCards.length) return;
  cards = originalCards.slice();
  badCards = [];
  currentView = "all";
  currentIndex = 0;
  updateTabs();
  showCard(currentIndex);
  setStatus("Restored original order.");
  updateControlState();
});

clearBtn.addEventListener("click", () => {
  fileInput.value = "";
  cards = [];
  originalCards = [];
  badCards = [];
  currentIndex = 0;
  currentView = "all";
  updateTabs();
  setStatus("No file loaded.");
  showCard(0);
  updateControlState();
});

function removeFromBad(cardId) {
  const index = badCards.findIndex((card) => card.id === cardId);
  if (index >= 0) {
    badCards.splice(index, 1);
  }
}

goodBtn.addEventListener("click", () => {
  const activeDeck = getActiveDeck();
  if (!activeDeck.length) return;
  const removed = activeDeck.splice(currentIndex, 1)[0];

  if (currentView === "all") {
    removeFromBad(removed.id);
    if (cards.length === 0) {
      currentIndex = 0;
      setStatus("All cards marked good. Use Reset Order to review again.");
      showCard(0);
      updateControlState();
      return;
    }
  } else if (currentView === "bad") {
    if (badCards.length === 0) {
      currentIndex = 0;
      setStatus("No bad cards left.");
      showCard(0);
      updateControlState();
      return;
    }
  }

  currentIndex = clampIndex(currentIndex);
  showCard(currentIndex);
  setStatus("Marked good.");
  updateControlState();
});

badBtn.addEventListener("click", () => {
  const activeDeck = getActiveDeck();
  if (!activeDeck.length) return;

  if (currentView === "all") {
    const card = activeDeck[currentIndex];
    if (!badCards.some((badCard) => badCard.id === card.id)) {
      badCards.push(card);
    }
    setStatus("Marked bad. Review in the Bad tab.");
  } else {
    setStatus("Kept card in bad deck.");
  }

  currentIndex = clampIndex(currentIndex + 1);
  showCard(currentIndex);
  updateControlState();
});

allTab.addEventListener("click", () => {
  if (currentView !== "all") switchView("all");
});

badTab.addEventListener("click", () => {
  if (currentView !== "bad") switchView("bad");
});

cardEl.addEventListener("click", () => {
  if (!getActiveDeck().length) return;
  cardEl.classList.toggle("is-flipped");
});

cardEl.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    cardEl.classList.toggle("is-flipped");
  }
});

document.addEventListener("keydown", (event) => {
  const activeElement = document.activeElement;
  if (activeElement && (activeElement.tagName === "INPUT" || activeElement.tagName === "TEXTAREA")) {
    return;
  }

  if (!getActiveDeck().length) return;

  if (event.key === "ArrowLeft") {
    event.preventDefault();
    currentIndex = clampIndex(currentIndex - 1);
    showCard(currentIndex);
    return;
  }

  if (event.key === "ArrowRight") {
    event.preventDefault();
    currentIndex = clampIndex(currentIndex + 1);
    showCard(currentIndex);
    return;
  }

  if (event.key === " " || event.code === "Space") {
    event.preventDefault();
    cardEl.classList.toggle("is-flipped");
  }
});

updateTabs();
updateControlState();
showCard(0);
