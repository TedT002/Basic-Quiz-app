import React, { useEffect, useState, useRef } from "react";
import { io } from 'socket.io-client';

// ur ngrok url
const socket = io("//ur ngrok url");
console.log("Socket bağlantısı kuruluyor...");

function App() { // React function
    const [leaderboard, setLeaderboard] = useState([]); // setLeaderboard 

    useEffect(() => { 
        console.log("----> useEffect [socket] çalıştı <----");
        socket.on('connect', () => {
            console.log("----> CONNECT OLAYI BAŞLADI <----"); // basic log start
            console.log('Frontend bağlandı!');
            // send test score when connection establish
            console.log("Test skoru gönderiliyor...");
            socket.emit("submit_score", { name: "Test Kullanıcı", score: 99 });
            console.log("----> CONNECT OLAYI BİTTİ <----"); 
        });

        socket.on('disconnect', () => {
            console.log('Frontend bağlantısı koptu!');
        });

        socket.on("leaderboard_update", (data) => {
            console.log("----> leaderboard_update alındı:", data);
            setLeaderboard(data);
        });
        socket.emit("get_leaderboard");

        return () => {
            console.log("----> useEffect [socket] temizleniyor <----");
            socket.off("leaderboard_update");
            socket.off('connect');
            socket.off('disconnect');
        };
    }, [socket, setLeaderboard]); // socket ve setLeaderboard dependency 

    const [name, setName] = useState("");
    const [started, setStarted] = useState(false);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState(null);
    const [questionScore, setQuestionScore] = useState(0);
    const [submitted, setSubmitted] = useState(false);
    const [timeLeft, setTimeLeft] = useState(100);
    const timerInterval = useRef(null);
    const [finalScore, setFinalScore] = useState(0);
    const [questions, setQuestions] = useState([
        {
            question: "DevOps'un temel prensiplerinden hangisi DEĞİLDİR?",
            options: ["Otomasyon", "Sürekli Geri Bildirim", "İzole Ekipler", "İş Birliği"],
            answer: "İzole Ekipler",
        },
        {
            question: "Sürekli Entegrasyon (CI) için yaygın olarak kullanılan bir araç nedir?",
            options: ["Jira", "Jenkins", "Slack", "Microsoft Word"],
            answer: "Jenkins",
        },
        {
            question: "Hangi bulut sağlayıcısı tipik olarak DevOps araçlarıyla ilişkilendirilmez?",
            options: ["AWS", "Azure", "Google Cloud Platform", "Netflix"],
            answer: "Netflix",
        },
        {
            question: "DevOps'ta 'IaC' ne anlama gelir?",
            options: ["İnternet Kod Olarak", "Altyapı Kod Olarak", "Entegre Uygulama Kontrolü", "Dahili Erişim Kontrolü"],
            answer: "Altyapı Kod Olarak",
        },
        {
            question: "Kubernetes öncelikle ne için kullanılır?",
            options: ["Versiyon Kontrolü", "Container Orchestration", "Veritabanı Yönetimi", "Proje Yönetimi"],
            answer: "Container Orchestration",
        },
        {
            question: "Sürekli Teslimat'ın (CD) temel amacı nedir?",
            options: ["Yazılımı manuel olarak yayınlamak", "Yazılımın her zaman güvenilir bir şekilde yayınlanabilmesini sağlamak", "Daha hızlı daha çok kod yazmak", "Test çabalarını azaltmak"],
            answer: "Yazılımın her zaman güvenilir bir şekilde yayınlanabilmesini sağlamak",
        },
        {
            question: "Hangisi popüler bir versiyon kontrol sistemidir?",
            options: ["Docker", "Git", "Ansible", "Terraform"],
            answer: "Git",
        },
        {
            question: "DevOps bağlamında 'konteyner' nedir?",
            options: ["Fiziksel bir sunucu", "Hafif, bağımsız, çalıştırılabilir bir yazılım paketi", "Bir tür veritabanı", "Bir ağ cihazı"],
            answer: "Hafif, bağımsız, çalıştırılabilir bir yazılım paketi",
        },
        {
            question: "Hangi araç konfigürasyon yönetimi için kullanılır?",
            options: ["Prometheus", "Grafana", "Puppet", "Nginx"],
            answer: "Puppet",
        },
        {
            question: "DevOps'ta izleme (monitoring) öncelikle neyi amaçlar?",
            options: ["Geliştirici etkinliğini izlemek", "Sistem davranışını ve performansını gözlemlemek", "Proje teslim tarihlerini yönetmek", "Dokümantasyon yazmak"],
            answer: "Sistem davranışını ve performansını gözlemlemek",
        },
    ]);
    const currentQuestion = questions[currentQuestionIndex];

    useEffect(() => {
        if (started && !submitted && timeLeft > 0 && currentQuestionIndex < questions.length) {
            timerInterval.current = setInterval(() => {
                setTimeLeft((prevTime) => prevTime - 1);
            }, 1000);
        } else {
            clearInterval(timerInterval.current);
            if (started && !submitted && (timeLeft === 0 || currentQuestionIndex === questions.length)) {
                const calculatedFinalScore = (questionScore + (selectedOption === currentQuestion?.answer ? 10 : 0)) * timeLeft;
                setFinalScore(calculatedFinalScore);
                setSubmitted(true);
                console.log("Gönderiliyor (Timeout):", { name, score: calculatedFinalScore });
                console.log("Gönderilen veri (Timeout):", { name, score: calculatedFinalScore });
                socket.emit("submit_score", { name, score: calculatedFinalScore });
            }
        }
        return () => clearInterval(timerInterval.current);
    }, [started, submitted, timeLeft, currentQuestionIndex, questionScore, questions.length, selectedOption, currentQuestion?.answer]);

    const startQuiz = () => {
        if (name.trim() !== "") {
            setStarted(true);
            setTimeLeft(100);
            setQuestionScore(0);
            setCurrentQuestionIndex(0);
            setSubmitted(false);
        }
    };

    const handleOptionClick = (option) => {
        setSelectedOption(option);
    };

    const handleNext = () => {
        console.log("handleNext BAŞLADI");
        const isCorrect = selectedOption === currentQuestion.answer;
        if (isCorrect) {
            setQuestionScore((prevScore) => prevScore + 10);
        }
        setSelectedOption(null);
        if (currentQuestionIndex + 1 < questions.length) {
            setCurrentQuestionIndex((prev) => prev + 1);
        } else {
            const finalQuestionScore = isCorrect ? questionScore + 10 : questionScore;
            const calculatedFinalScore = finalQuestionScore * timeLeft;
            setFinalScore(calculatedFinalScore);
            setSubmitted(true);
            console.log("Gönderiliyor (Next):", { name, score: calculatedFinalScore });
            console.log("Gönderilen veri (Next):", { name, score: calculatedFinalScore });
            socket.emit("submit_score", { name, score: calculatedFinalScore });
            clearInterval(timerInterval.current);
        }
        console.log("handleNext BİTTİ");
    };

    const handleFinish = () => {
        console.log("handleFinish BAŞLADI");
        const isCorrect = selectedOption === currentQuestion.answer;
        const finalQuestionScore = isCorrect ? questionScore + 10 : questionScore;
        const calculatedFinalScore = finalQuestionScore * timeLeft;
        setFinalScore(calculatedFinalScore);
        setSubmitted(true);
        console.log("Gönderiliyor (Finish):", { name, score: calculatedFinalScore });
        console.log("Gönderilen veri (Finish):", { name, score: calculatedFinalScore });
        socket.emit("submit_score", { name, score: calculatedFinalScore });
        clearInterval(timerInterval.current);
        console.log("handleFinish BİTTİ");
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-600 to-purple-600 text-white flex items-center justify-center p-6">
            <div className="bg-white text-black p-6 rounded-2xl shadow-xl w-full max-w-xl">
                <h1 className="text-3xl font-bold text-center mb-6">DevOps Quiz</h1>

                {!started && (
                    <div className="text-center">
                        <h2 className="text-xl font-semibold mb-4">İsmini gir ve teste başla</h2>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="İsminizi girin"
                            className="w-full p-3 mb-4 border border-gray-400 rounded-lg text-black placeholder-gray-500 bg-gray-50"
                            autoFocus
                        />
                        <button
                            onClick={startQuiz}
                            className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors ease-in-out delay-300"
                            autoFocus
                        >
                            Başla
                        </button>
                    </div>
                )}

                {started && !submitted && (
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold">
                                Soru {currentQuestionIndex + 1} / {questions.length}
                            </h2>
                            <div className="text-lg">Süre: {timeLeft} saniye</div>
                        </div>
                        <p className="mb-4">{currentQuestion.question}</p>
                        <ul>
                            {currentQuestion.options.map((option, index) => (
                                <li
                                    key={index}
                                    onClick={() => handleOptionClick(option)}
                                    className={`p-3 mb-2 rounded-lg border cursor-pointer ${selectedOption === option
                                        ? "bg-blue-300 text-white"
                                        : "hover:bg-gray-100"}`}
                                >
                                    {option}
                                </li>
                            ))}
                        </ul>
                        <button
                            onClick={currentQuestionIndex + 1 < questions.length ? handleNext : handleFinish}
                            disabled={selectedOption === null}
                            className="mt-4 w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {currentQuestionIndex + 1 < questions.length ? "Sonraki" : "Bitir"}
                        </button>
                    </div>
                )}

                {submitted && (
                    <div>
                        <h2 className="text-2xl font-bold mb-4">Nihai Skorunuz: {finalScore}</h2>
                        <h3 className="text-lg font-semibold mb-2">Lider Tablosu</h3>
                        <ul className="space-y-1">
                            {leaderboard.map((entry, index) => (
                                <li key={index} className="border-b py-1">
                                    {index + 1}. {entry.name} — {entry.score} puan
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}

export default App;