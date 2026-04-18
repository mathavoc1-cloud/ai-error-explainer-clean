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
  const value = (confidence || "medium").toLowerCase();
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

    if (!response.ok) {
      throw new Error(data.error || data.details || "Something went wrong");
    }

    let explanation = "No explanation returned.";

    if (typeof data.body === "string") {
      const trimmed = data.body.trim();

      if (trimmed.startsWith("{")) {
        const parsedBody = JSON.parse(trimmed);
        explanation = parsedBody.explanation || parsedBody.result || explanation;
      } else {
        explanation = trimmed;
      }
    } else if (typeof data.body === "object" && data.body !== null) {
      explanation = data.body.explanation || data.body.result || explanation;
    } else if (data.explanation) {
      explanation = data.explanation;
    } else if (data.result) {
      explanation = data.result;
    }

    meaningEl.textContent = explanation;

    renderList(causesEl, [
      "Review the exact error message carefully.",
      "Check recent code or configuration changes.",
      "Look at logs or stack trace for more context."
    ]);

    renderList(fixesEl, [
      "Use the explanation above to identify the issue.",
      "Review the related code, config, or dependency.",
      "Apply the fix and test again."
    ]);

    updateConfidence("medium");

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