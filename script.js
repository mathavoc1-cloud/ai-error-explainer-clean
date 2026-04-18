const explainBtn = document.getElementById("explainBtn");
const sampleBtn = document.getElementById("sampleBtn");
const errorInput = document.getElementById("errorInput");

const resultSection = document.getElementById("result");
const meaningEl = document.getElementById("meaning");
const causesEl = document.getElementById("causes");
const fixesEl = document.getElementById("fixes");
const confidenceTextEl = document.getElementById("confidenceText");
const confidenceBadgeEl = document.getElementById("confidenceBadge");

const statusMessageEl = document.getElementById("statusMessage");
const errorMessageEl = document.getElementById("errorMessage");

function renderList(element, items) {
  element.innerHTML = "";

  items.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    element.appendChild(li);
  });
}

function showElement(element) {
  element.classList.remove("hidden");
}

function hideElement(element) {
  element.classList.add("hidden");
}

function clearMessages() {
  statusMessageEl.textContent = "";
  errorMessageEl.textContent = "";
  hideElement(statusMessageEl);
  hideElement(errorMessageEl);
}

function clearResult() {
  meaningEl.textContent = "";
  causesEl.innerHTML = "";
  fixesEl.innerHTML = "";
  confidenceTextEl.textContent = "";
  confidenceBadgeEl.textContent = "-";
  confidenceBadgeEl.className = "badge";
  hideElement(resultSection);
}

function setLoadingState(isLoading) {
  explainBtn.disabled = isLoading;
  sampleBtn.disabled = isLoading;
  errorInput.disabled = isLoading;
  explainBtn.textContent = isLoading ? "Explaining..." : "Explain Error";
}

function updateConfidence(confidence) {
  const value = (confidence || "low").toLowerCase();
  confidenceBadgeEl.textContent = value;
  confidenceBadgeEl.className = `badge ${value}`;

  if (value === "high") {
    confidenceTextEl.textContent = "This explanation is likely reliable based on the error provided.";
    return;
  }

  if (value === "medium") {
    confidenceTextEl.textContent = "This explanation is probably correct, but more context could improve accuracy.";
    return;
  }

  confidenceTextEl.textContent = "This explanation is a best effort. The error may need more context or logs.";
}

sampleBtn.addEventListener("click", () => {
  errorInput.value = "NoSuchKey: index.html";
  errorInput.focus();
});

explainBtn.addEventListener("click", async () => {
  const errorText = errorInput.value.trim();

  clearMessages();
  clearResult();

  if (!errorText) {
    errorMessageEl.textContent = "Paste an error message first.";
    showElement(errorMessageEl);
    return;
  }

  setLoadingState(true);
  statusMessageEl.textContent = "Analyzing your error with AI...";
  showElement(statusMessageEl);

  try {
    const response = await fetch("https://2riw0jdjg3.execute-api.us-east-1.amazonaws.com/explain", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ error: errorText })
    });

    const data = await response.json();

let explanation = "No explanation returned.";

try {
  const parsedBody = JSON.parse(data.body);
  explanation = parsedBody.explanation || parsedBody.result || explanation;
} catch (e) {
  console.error("Erro ao parsear:", e);
}

    console.log(explanation);
    

    if (!response.ok) {
      throw new Error(data.details || data.error || "Something went wrong");
    }

    meaningEl.textContent = data.meaning || "No explanation returned.";
    renderList(causesEl, data.likely_causes || []);
    renderList(fixesEl, data.how_to_fix || []);
    updateConfidence(data.confidence);

    hideElement(statusMessageEl);
    showElement(resultSection);
  } catch (error) {
    hideElement(statusMessageEl);
    errorMessageEl.textContent = `Could not explain the error. ${error.message}`;
    showElement(errorMessageEl);
  } finally {
    setLoadingState(false);
  }
});