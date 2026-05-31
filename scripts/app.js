const letters = ["A", "B", "C", "D", "E", "F", "G", "H"];
const allQuestions = window.QUIZ_QUESTIONS || [];

const state = {
  mode: "all",
  questions: [],
  index: 0,
  selected: new Set(),
  currentCorrect: [],
  checked: false,
  correct: 0,
  wrong: 0,
};

const elements = {
  modeButtons: document.querySelectorAll(".mode-button"),
  questionCounter: document.getElementById("questionCounter"),
  correctCounter: document.getElementById("correctCounter"),
  wrongCounter: document.getElementById("wrongCounter"),
  accuracyCounter: document.getElementById("accuracyCounter"),
  sourceNumber: document.getElementById("sourceNumber"),
  multiHint: document.getElementById("multiHint"),
  questionText: document.getElementById("questionText"),
  answersList: document.getElementById("answersList"),
  checkButton: document.getElementById("checkButton"),
  nextButton: document.getElementById("nextButton"),
  restartButton: document.getElementById("restartButton"),
  resultPanel: document.getElementById("resultPanel"),
  resultTitle: document.getElementById("resultTitle"),
  resultText: document.getElementById("resultText"),
  againButton: document.getElementById("againButton"),
};

function shuffled(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildQuestionSet() {
  const directQuestion = Number(new URLSearchParams(window.location.search).get("question"));
  if (directQuestion) {
    const foundQuestion = allQuestions.find((question) => question.id === directQuestion);
    if (foundQuestion) return [foundQuestion];
  }

  const shuffledQuestions = shuffled(allQuestions);
  if (state.mode === "20") return shuffledQuestions.slice(0, 20);
  if (state.mode === "10") return shuffledQuestions.slice(0, 10);
  return allQuestions;
}

function startQuiz() {
  state.questions = buildQuestionSet();
  state.index = 0;
  state.selected = new Set();
  state.currentCorrect = [];
  state.checked = false;
  state.correct = 0;
  state.wrong = 0;
  elements.resultPanel.hidden = true;
  renderQuestion();
}

function currentQuestion() {
  return state.questions[state.index];
}

function sameAnswerSet(a, b) {
  if (a.size !== b.length) return false;
  return b.every((item) => a.has(item));
}

function updateStats() {
  const answered = state.correct + state.wrong;
  const total = state.questions.length || 1;
  elements.questionCounter.textContent = `${Math.min(state.index + 1, total)} / ${total}`;
  elements.correctCounter.textContent = state.correct;
  elements.wrongCounter.textContent = state.wrong;
  elements.accuracyCounter.textContent = answered ? `${Math.round((state.correct / answered) * 100)}%` : "0%";
}

function renderQuestion() {
  const question = currentQuestion();
  if (!question) {
    showResult();
    return;
  }

  state.selected = new Set();
  state.checked = false;
  elements.nextButton.disabled = true;
  elements.checkButton.disabled = false;
  elements.checkButton.textContent = "Проверить";
  elements.sourceNumber.textContent = `Вопрос ${question.id}`;
  elements.multiHint.hidden = question.correct.length < 2;
  elements.questionText.innerHTML = question.questionHtml || question.question;
  elements.answersList.innerHTML = "";

  const randomizedAnswers = shuffled(
    question.answers.map((answer, index) => ({
      answer,
      html: question.answerHtml?.[index] || answer,
      isCorrect: question.correct.includes(index),
    })),
  );
  state.currentCorrect = randomizedAnswers
    .map((answer, index) => (answer.isCorrect ? index : -1))
    .filter((index) => index >= 0);

  randomizedAnswers.forEach((answerModel, index) => {
    const button = document.createElement("button");
    button.className = "answer-button";
    button.type = "button";
    button.dataset.index = String(index);
    button.innerHTML = `<span class="letter">${letters[index] || index + 1}</span><span class="answer-text"></span>`;
    button.querySelector(".answer-text").innerHTML = answerModel.html;
    button.addEventListener("click", () => toggleAnswer(index, button));
    elements.answersList.append(button);
  });

  updateStats();
}

function toggleAnswer(index, button) {
  if (state.checked) return;
  if (state.selected.has(index)) {
    state.selected.delete(index);
    button.classList.remove("selected");
  } else {
    state.selected.add(index);
    button.classList.add("selected");
  }
}

function checkAnswer() {
  if (!state.selected.size || state.checked) return;
  state.checked = true;
  const isCorrect = sameAnswerSet(state.selected, state.currentCorrect);
  if (isCorrect) state.correct += 1;
  else state.wrong += 1;

  [...elements.answersList.children].forEach((button) => {
    const index = Number(button.dataset.index);
    if (state.currentCorrect.includes(index)) button.classList.add("correct");
    if (state.selected.has(index) && !state.currentCorrect.includes(index)) button.classList.add("wrong");
  });

  elements.nextButton.disabled = false;
  elements.checkButton.disabled = true;
  elements.checkButton.textContent = isCorrect ? "Верно" : "Проверено";
  updateStats();
}

function nextQuestion() {
  state.index += 1;
  if (state.index >= state.questions.length) {
    showResult();
    return;
  }
  renderQuestion();
}

function showResult() {
  const total = state.questions.length || 1;
  const accuracy = Math.round((state.correct / total) * 100);
  elements.resultPanel.hidden = false;
  elements.resultTitle.textContent = `${accuracy}%`;
  elements.resultText.textContent = `Верно: ${state.correct} из ${total}. Ошибок: ${state.wrong}.`;
  elements.resultPanel.scrollIntoView({ behavior: "smooth", block: "center" });
}

elements.modeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    elements.modeButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    state.mode = button.dataset.mode;
    startQuiz();
  });
});

elements.checkButton.addEventListener("click", checkAnswer);
elements.nextButton.addEventListener("click", nextQuestion);
elements.restartButton.addEventListener("click", startQuiz);
elements.againButton.addEventListener("click", startQuiz);

startQuiz();
