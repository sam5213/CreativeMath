document.addEventListener("DOMContentLoaded", () => {
  const carousel = document.getElementById("carousel")
  const carouselInner = document.querySelector(".carousel-inner")
  const quiz = document.getElementById("quiz")
  const results = document.getElementById("results")
  const slides = document.querySelectorAll(".carousel-slide")
  const indicators = document.querySelectorAll(".indicator")
  const nextButtons = document.querySelectorAll(".next-button")
  const startQuizButton = document.querySelector(".start-quiz-button")
  const questionElement = document.getElementById("question")
  const answersElement = document.getElementById("answers")
  const nextQuestionButton = document.getElementById("next-question")
  const timeElement = document.getElementById("time")
  const currentQuestionElement = document.getElementById("current-question")
  const scoreElement = document.getElementById("final-score")
  const timeSpentElement = document.getElementById("time-spent")
  const correctAnswersElement = document.getElementById("correct-answers")
  const tryAgainButton = document.getElementById("try-again")

  let currentSlide = 0
  let currentQuestion = 0
  let timeLeft = 30
  let timer
  let totalTime = 0
  let correctAnswers = 0
  const userAnswers = [];

    // Загружаем вопросы из JSON файла
    fetch("questions.json")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Не удалось загрузить вопросы")
      }
      return response.json()
    })
    .then((data) => {
      questions = data
      console.log("Вопросы успешно загружены:", questions)
    })
    .catch((error) => {
      console.error("Ошибка при загрузке вопросов:", error)
      // Резервные вопросы на случай ошибки загрузки
      questions = [
        {
          question:
            "Во сколько раз увеличится любое двузначное число, если записать его два раза подряд?",
          answers: ["В 200 раз", "В 100 раз", "В 101 раз"],
          correct: 1,
          image: "task1.png"
        },
        {
          question: "Комнаты нумеровали по порядку, начиная с числа 1. Всего понадобилась 41 цифра. Сколько комнат пронумеровали?",
          answers: ["4", "5", "22", "18, 63"],
          correct: 1,
          image: "task2.png"
        }
      ]
    })

  function goToSlide(index) {
    currentSlide = index
    carouselInner.style.transform = `translateX(-${index * 100}%)`
    updateIndicators()
  }

  function updateIndicators() {
    indicators.forEach((indicator, index) => {
      if (index === currentSlide) {
        indicator.classList.add("active")
      } else {
        indicator.classList.remove("active")
      }
    })
  }

  function startQuiz() {
    carousel.classList.add("hidden")
    quiz.classList.remove("hidden")
    loadQuestion()
    startTimer()
  }

  function loadQuestion() {
    if (questions.length === 0) {
      console.error("Вопросы не загружены")
      return
    }

    const question = questions[currentQuestion]
    questionElement.textContent = question.question
    answersElement.innerHTML = ""

    // Обновляем изображение
    const questionImage = document.querySelector('.question-illustration');
    questionImage.src = question.image; // Устанавливаем путь к изображению

    question.answers.forEach((answer, index) => {
      const label = document.createElement("label")
      label.className = "answer-option"
      label.innerHTML = `
                <input type="radio" name="answer" class="answer-radio">
                <span class="radio-custom"></span>
                <span class="answer-text">${answer}</span>
                <span class="answer-status">Правильно</span>
            `
      label.addEventListener("click", () => selectAnswer(index))
      answersElement.appendChild(label)
    })
    currentQuestionElement.textContent = currentQuestion + 1
    nextQuestionButton.disabled = true
  }

  function selectAnswer(index) {
    const answers = answersElement.querySelectorAll(".answer-option")
    answers.forEach((answer) => {
      answer.classList.remove("correct")
      answer.classList.remove("selected")
    })

    const selectedAnswer = answers[index]
    selectedAnswer.classList.add("selected")

    if (index === questions[currentQuestion].correct) {
      selectedAnswer.classList.add("correct")
    }

    // Сохраняем выбранный ответ и правильный ответ в userAnswers
    userAnswers[currentQuestion] = {
          selected: answers[index].querySelector('.answer-text').textContent,
          correct: questions[currentQuestion].answers[questions[currentQuestion].correct]
    };

    nextQuestionButton.disabled = false
  }

  function sendResults() {
    const resultsToSend = userAnswers.map((answer, index) => 
        `Вопрос ${index + 1}: Выбрано "${answer.selected}", правильный ответ: "${answer.correct}"`
    ).join('\n');

    // Форматируем данные в JSON
    const dataToSend = JSON.stringify({ resultsToSend });

    // Отправляем данные в бот
    Telegram.WebApp.sendData(dataToSend);
  }

  function startTimer() {
    timeLeft = 30
    updateTimer()
    timer = setInterval(() => {
      timeLeft--
      totalTime++
      updateTimer()
      if (timeLeft === 0) {
        clearInterval(timer)
        nextQuestion()
      }
    }, 1000)
  }

  function updateTimer() {
    const minutes = Math.floor(timeLeft / 60)
    const seconds = timeLeft % 60
    timeElement.textContent = `${minutes}:${seconds < 10 ? "0" + seconds : seconds}`
  }

  function nextQuestion() {
    clearInterval(timer)
    const selectedAnswer = answersElement.querySelector(".selected")
    if (selectedAnswer) {
      const answerIndex = Array.from(answersElement.children).indexOf(selectedAnswer)
      if (answerIndex === questions[currentQuestion].correct) {
        correctAnswers++
      }
    }
    currentQuestion++
    if (currentQuestion < questions.length) {
      loadQuestion()
      startTimer()
    } else {
      showResults()
    }
  }

  function showResults() {
    quiz.classList.add("hidden")
    results.classList.remove("hidden")

    scoreElement.textContent = `${correctAnswers}/${questions.length}`
    correctAnswersElement.textContent = correctAnswers

    const hours = Math.floor(totalTime / 3600)
    const minutes = Math.floor((totalTime % 3600) / 60)
    const seconds = totalTime % 60
    timeSpentElement.textContent = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }

  function resetQuiz() {
    currentQuestion = 0
    correctAnswers = 0
    totalTime = 0
    // Устанавливаем таймер на 1 секунды перед отправкой данных
    setTimeout(() => {
      // Отправляем данные
      sendResults()
    }, 1000); // 1000 миллисекунд = 1 секунды
  }

  // Инициализация карусели
  nextButtons.forEach((button, index) => {
    button.addEventListener("click", () => {
      if (index < slides.length - 1) {
        goToSlide(index + 1)
      }
    })
  })

  indicators.forEach((indicator, index) => {
    indicator.addEventListener("click", () => goToSlide(index))
  })

  startQuizButton.addEventListener("click", startQuiz)
  nextQuestionButton.addEventListener("click", nextQuestion)
  tryAgainButton.addEventListener("click", resetQuiz)

  // Начальная инициализация
  goToSlide(0)
})

