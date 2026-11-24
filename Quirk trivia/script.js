const API_URL = "https://opentdb.com/api.php";
const quizArea = document.getElementById("quizArea");
const startButton = document.getElementById("startButton");
const progressLabel = document.getElementById("progressLabel");
const languageToggle = document.getElementById("languageToggle");

let language = localStorage.getItem("quirk-language") || "id";
let questions = [];
let currentIndex = 0;
let score = 0;
let answered = false;
let currentState = "idle";

const translations = {
  id: {
    tagline:"ILMU TIPIS-TIPIS, TIAP HARI", eyebrow:"KLUB KEPONYA HARIAN",
    heroLine1:"Tetap kepo.",heroLine2:"Makin tahu.",
    heroDescription:"Istirahat sebentar sambil asah otak. Pilih topik, tes pengetahuanmu, dan siapa tahu dapat fakta baru yang mind-blowing.",
    heroButton:"Gas main",reminderLabel:"PENGINGAT KECIL",reminderText:"Kepo itu nggak ada ruginya.",
    setupEyebrow:"01 / ATUR MAINMU",setupTitle:"Mau tantangan apa?",setupDescription:"Pilih kategori dan tingkat kesulitan. Soalnya kami siapin.",
    categoryLabel:"KATEGORI",anyCategory:"Bebas, kategori apa aja",
    difficultyLabel:"TINGKAT KESULITAN",mixedDifficulty:"Campur aja",easy:"Gampang",medium:"Sedang",hard:"Sulit",
    generateButton:"Buat 10 pertanyaan",apiNote:"Pertanyaan diambil langsung dari Open Trivia Database. Perlu koneksi internet.",
    quizEyebrow:"02 / KUIS KAMU",readyLabel:"KAPAN AJA SIAP",
    emptyTitle:"Fakta baru lagi nungguin.",emptyDescription:"Atur pilihanmu, lalu pencet tombol buat mulai ronde baru.",
    feature1Title:"Soal selalu baru",feature1Desc:"Pertanyaan baru tiap ronde.",
    feature2Title:"Belajar sambil main",feature2Desc:"Langsung tahu jawabanmu benar atau nggak.",
    feature3Title:"Aturanmu sendiri",feature3Desc:"Pilih tingkat kesukaanmu.",footer:"© 2026 QUIRK. Dibuat buat para pemikir kepo.",dataBy:"Data trivia dari",
    fetching:"Lagi nyari soal buat kamu...",connection:"NYAMBUNG KE API",loadError:"Yah, kuisnya gagal dimuat.",retry:"Coba lagi",noQuestions:"Soal untuk pilihan ini belum tersedia. Coba kategori atau tingkat kesulitan lain.",
    question:"PERTANYAAN",score:"Skor",choose:"Pilih satu jawaban",correct:"Betul! Mantap.",correctExtra:"Jawabanmu tepat.",wrong:"Belum tepat, nih.",correctAnswer:"Jawaban yang benar:",next:"Lanjut",seeResults:"Lihat hasil",answered:"DIJAWAB",
    wrap:"RONDE SELESAI",perfect:"Perfect! Gokil, semua benar!",great:"Keren! Pengetahuanmu makin luas.",okay:"Lumayan! Masih ada hal baru buat dipelajari.",tryAgain:"Gas lagi, ronde berikutnya bisa lebih bagus.",
    got:"Kamu menjawab",of:"dari",right:"soal dengan benar.",playAgain:"Main lagi",connectionIssue:"KONEKSI BERMASALAH"
  },
  en: {
    tagline:"A LITTLE KNOWLEDGE, EVERY DAY",eyebrow:"THE DAILY CURIOSITY CLUB",
    heroLine1:"Stay curious.",heroLine2:"Know more.",
    heroDescription:"Take a quick brain break. Pick a topic, test what you know, and maybe discover something mind-blowing.",
    heroButton:"Let's play",reminderLabel:"A QUICK REMINDER",reminderText:"Curiosity looks good on you.",
    setupEyebrow:"01 / SET YOUR ROUND",setupTitle:"Pick your challenge.",setupDescription:"Choose a category and difficulty. We'll bring the questions.",
    categoryLabel:"CATEGORY",anyCategory:"Any category",
    difficultyLabel:"DIFFICULTY",mixedDifficulty:"Mixed difficulty",easy:"Easy",medium:"Medium",hard:"Hard",
    generateButton:"Generate 10 questions",apiNote:"Questions are fetched live from Open Trivia Database. Internet connection required.",
    quizEyebrow:"02 / YOUR QUIZ",readyLabel:"READY WHEN YOU ARE",
    emptyTitle:"Your next fact is waiting.",emptyDescription:"Choose your settings and hit the button to start a fresh round.",
    feature1Title:"Fresh questions",feature1Desc:"New trivia every round.",
    feature2Title:"Learn as you play",feature2Desc:"Instant answer feedback.",
    feature3Title:"Your pace, your rules",feature3Desc:"Choose your own difficulty.",footer:"© 2026 QUIRK. Built for curious minds.",dataBy:"Trivia data by",
    fetching:"Finding questions for you...",connection:"CONNECTING TO API",loadError:"Oops, the quiz couldn't load.",retry:"Try again",noQuestions:"No questions found for these settings. Try another category or difficulty.",
    question:"QUESTION",score:"Score",choose:"Choose one answer",correct:"Correct. Nice one!",correctExtra:"You got it right.",wrong:"Not quite this time.",correctAnswer:"The correct answer is:",next:"Next question",seeResults:"See my results",answered:"ANSWERED",
    wrap:"ROUND COMPLETE",perfect:"Perfect round. Brilliant!",great:"Great work. Your curiosity is paying off.",okay:"Not bad. Every question is a chance to learn.",tryAgain:"A fresh start is just one round away.",
    got:"You got",of:"out of",right:"questions right.",playAgain:"Play another round",connectionIssue:"CONNECTION ISSUE"
  }
};

function t(key) { return translations[language][key] || translations.en[key] || key; }
function decodeHTML(text) {
  const element = document.createElement("textarea");
  element.innerHTML = text;
  return element.value;
}
function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[char]));
}
function shuffle(array) {
  const result = [...array];
  for (let i=result.length-1;i>0;i--) {
    const j=Math.floor(Math.random()*(i+1));
    [result[i],result[j]]=[result[j],result[i]];
  }
  return result;
}
function applyLanguage() {
  document.documentElement.lang = language;
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.dataset.i18n;
    if (translations[language][key]) el.textContent = t(key);
  });
  languageToggle.textContent = language === "id" ? "ID / EN" : "EN / ID";
  if (currentState === "idle") renderIdle();
  else if (currentState === "question") renderQuestion();
  else if (currentState === "results") renderResults();
}
function renderIdle() {
  quizArea.innerHTML = `
    <div class="empty-illustration mx-auto mb-6"><span>?</span></div>
    <h2 class="text-2xl sm:text-3xl font-extrabold text-center">${t("emptyTitle")}</h2>
    <p class="text-sm text-muted text-center max-w-sm mx-auto mt-3">${t("emptyDescription")}</p>`;
  progressLabel.textContent = t("readyLabel");
}
async function startQuiz() {
  startButton.disabled = true;
  startButton.innerHTML = `<span>${t("fetching")}</span>`;
  progressLabel.textContent = t("connection");
  quizArea.innerHTML = `<div class="text-center my-auto"><div class="w-10 h-10 border-2 border-violet border-t-transparent rounded-full animate-spin mx-auto"></div><p class="text-sm text-muted mt-5">${t("fetching")}</p></div>`;
  const params = new URLSearchParams({amount:"10",type:"multiple"});
  const category = document.getElementById("category").value;
  const difficulty = document.getElementById("difficulty").value;
  if(category) params.set("category",category);
  if(difficulty) params.set("difficulty",difficulty);
  try {
    const response = await fetch(`${API_URL}?${params.toString()}`);
    if(!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if(data.response_code !== 0 || !data.results?.length) throw new Error(t("noQuestions"));
    questions = data.results.map(item => ({
      question:decodeHTML(item.question),
      correct:decodeHTML(item.correct_answer),
      answers:shuffle([item.correct_answer,...item.incorrect_answers].map(decodeHTML)),
      category:decodeHTML(item.category),
      difficulty:item.difficulty
    }));
    currentIndex=0;score=0;currentState="question";renderQuestion();
  } catch(error) {
    currentState="error";
    quizArea.innerHTML=`<div class="text-center my-auto"><div class="text-4xl mb-4">:(</div><h3 class="text-xl font-bold">${t("loadError")}</h3><p class="text-sm text-muted mt-2 max-w-md mx-auto">${escapeHTML(error.message)}</p><button id="retryButton" class="primary-button mx-auto mt-6">${t("retry")}</button></div>`;
    document.getElementById("retryButton").addEventListener("click",startQuiz);
    progressLabel.textContent=t("connectionIssue");
  } finally {
    startButton.disabled=false;
    startButton.innerHTML=`<span>${t("generateButton")}</span><span>↗</span>`;
  }
}
function renderQuestion() {
  currentState="question";answered=false;
  const item=questions[currentIndex],progress=(currentIndex/questions.length)*100;
  progressLabel.textContent=`${String(currentIndex+1).padStart(2,"0")} / ${questions.length}`;
  quizArea.innerHTML=`
    <div class="flex items-center justify-between gap-3 text-xs text-muted mb-3"><span>${escapeHTML(item.category)}</span><span class="uppercase tracking-wider">${escapeHTML(item.difficulty)}</span></div>
    <div class="progress-track mb-7"><div class="progress-fill" style="width:${progress}%"></div></div>
    <p class="eyebrow mb-3">${t("question")} ${String(currentIndex+1).padStart(2,"0")}</p>
    <h2 class="text-xl sm:text-2xl font-bold leading-snug">${escapeHTML(item.question)}</h2>
    <div id="answerList" class="grid gap-3 mt-7">${item.answers.map((answer,index)=>`<button class="answer-option" data-answer="${index}"><span class="font-mono text-violet mr-3">${String.fromCharCode(65+index)}.</span>${escapeHTML(answer)}</button>`).join("")}</div>
    <div id="feedbackArea" class="mt-4"></div>
    <div class="flex justify-between items-center mt-5 text-xs text-muted"><span>${t("score")}: <b class="text-mint">${score}</b></span><span>${t("choose")}</span></div>`;
  document.querySelectorAll("[data-answer]").forEach(button=>button.addEventListener("click",()=>chooseAnswer(Number(button.dataset.answer))));
}
function chooseAnswer(answerIndex) {
  if(answered)return;
  answered=true;
  const item=questions[currentIndex],chosen=item.answers[answerIndex],isCorrect=chosen===item.correct;
  if(isCorrect)score++;
  document.querySelectorAll("[data-answer]").forEach((button,index)=>{
    button.disabled=true;
    if(item.answers[index]===item.correct)button.classList.add("correct");
    else if(index===answerIndex)button.classList.add("wrong");
  });
  document.getElementById("feedbackArea").innerHTML=`
    <div class="feedback ${isCorrect?"good":"bad"}"><b>${isCorrect?t("correct"):t("wrong")}</b> ${isCorrect?t("correctExtra"):`${t("correctAnswer")} <strong>${escapeHTML(item.correct)}</strong>`}</div>
    <button id="nextButton" class="primary-button w-full mt-4">${currentIndex===questions.length-1?t("seeResults"):t("next")} <span>→</span></button>`;
  document.getElementById("nextButton").addEventListener("click",nextQuestion);
  progressLabel.textContent=`${currentIndex+1} / ${questions.length} · ${t("answered")}`;
}
function nextQuestion(){currentIndex++;if(currentIndex<questions.length)renderQuestion();else{currentState="results";renderResults();}}
function renderResults() {
  currentState="results";
  const percentage=Math.round(score/questions.length*100);
  const message=percentage===100?t("perfect"):percentage>=70?t("great"):percentage>=40?t("okay"):t("tryAgain");
  progressLabel.textContent=t("wrap");
  quizArea.innerHTML=`
    <div class="text-center my-auto py-5"><p class="eyebrow">${t("wrap")}</p>
      <div class="w-32 h-32 rounded-full mx-auto my-6 grid place-items-center border-4 border-violet/40 bg-violet/10"><div><p class="text-4xl font-black">${score}<span class="text-lg text-muted">/${questions.length}</span></p><p class="text-[10px] text-muted tracking-widest">${t("score").toUpperCase()}</p></div></div>
      <h2 class="text-2xl sm:text-3xl font-extrabold">${message}</h2>
      <p class="text-sm text-muted mt-3">${t("got")} ${score} ${t("of")} ${questions.length} ${t("right")} (${percentage}%).</p>
      <button id="playAgainButton" class="primary-button mx-auto mt-7">${t("playAgain")} ↻</button>
    </div>`;
  document.getElementById("playAgainButton").addEventListener("click",startQuiz);
}
languageToggle.addEventListener("click",()=>{
  language=language==="id"?"en":"id";
  localStorage.setItem("quirk-language",language);
  applyLanguage();
});
startButton.addEventListener("click",startQuiz);
applyLanguage();
