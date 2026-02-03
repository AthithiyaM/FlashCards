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
const indexLabel = document.getElementById("indexLabel");
const countLabel = document.getElementById("countLabel");

let cards = [];
let originalCards = [];
let currentIndex = 0;

function setStatus(message) {
  statusEl.textContent = message;
}

function setControlsEnabled(enabled) {
  prevBtn.disabled = !enabled;
  nextBtn.disabled = !enabled;
  flipBtn.disabled = !enabled;
  shuffleBtn.disabled = !enabled;
  resetBtn.disabled = !enabled;
  clearBtn.disabled = !enabled;
}

function updateProgress() {
  indexLabel.textContent = cards.length ? String(currentIndex + 1) : "0";
  countLabel.textContent = String(cards.length);
}

function showCard(index) {
  if (!cards.length) {
    frontEl.textContent = "Load a CSV to begin";
    backEl.textContent = "Back of card";
    cardEl.classList.remove("is-flipped");
    updateProgress();
    return;
  }

  const card = cards[index];
  frontEl.textContent = card.front;
  backEl.textContent = card.back;
  cardEl.classList.remove("is-flipped");
  updateProgress();
}

function clampIndex(index) {
  if (index < 0) return cards.length - 1;
  if (index >= cards.length) return 0;
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

function toCards(rows) {
  const mapped = rows
    .map((row) => {
      const front = (row[0] ?? "").trim();
      const back = (row[1] ?? "").trim();
      return { front, back };
    })
    .filter((card) => card.front.length > 0 || card.back.length > 0);

  return mapped;
}

function loadCardsFromText(text) {
  const rows = parseCSV(text);
  const mappedCards = toCards(rows);

  if (mappedCards.length === 0) {
    setStatus("No usable rows found. Make sure the CSV has two columns.");
    setControlsEnabled(false);
    cards = [];
    originalCards = [];
    currentIndex = 0;
    showCard(0);
    return;
  }

  cards = mappedCards;
  originalCards = mappedCards.slice();
  currentIndex = 0;
  setStatus(`Loaded ${cards.length} cards.`);
  setControlsEnabled(true);
  showCard(currentIndex);
}

function shuffleCards() {
  for (let i = cards.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  currentIndex = 0;
  showCard(currentIndex);
}

fileInput.addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    const text = String(reader.result ?? "");
    loadCardsFromText(text);
  };
  reader.onerror = () => {
    setStatus("Failed to read the file. Try again.");
  };
  reader.readAsText(file);
});

prevBtn.addEventListener("click", () => {
  if (!cards.length) return;
  currentIndex = clampIndex(currentIndex - 1);
  showCard(currentIndex);
});

nextBtn.addEventListener("click", () => {
  if (!cards.length) return;
  currentIndex = clampIndex(currentIndex + 1);
  showCard(currentIndex);
});

flipBtn.addEventListener("click", () => {
  cardEl.classList.toggle("is-flipped");
});

shuffleBtn.addEventListener("click", () => {
  if (!cards.length) return;
  shuffleCards();
  setStatus("Shuffled cards.");
});

resetBtn.addEventListener("click", () => {
  if (!originalCards.length) return;
  cards = originalCards.slice();
  currentIndex = 0;
  showCard(currentIndex);
  setStatus("Restored original order.");
});

clearBtn.addEventListener("click", () => {
  fileInput.value = "";
  cards = [];
  originalCards = [];
  currentIndex = 0;
  setStatus("No file loaded.");
  setControlsEnabled(false);
  showCard(0);
});

cardEl.addEventListener("click", () => {
  if (!cards.length) return;
  cardEl.classList.toggle("is-flipped");
});

cardEl.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    cardEl.classList.toggle("is-flipped");
  }
});

setControlsEnabled(false);
showCard(0);
