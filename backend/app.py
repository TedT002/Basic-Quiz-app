from flask import Flask
from flask_socketio import SocketIO, emit
from flask_cors import CORS

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*", manage_session=False)


participants = []

@app.route("/")
def index():
    return "Quiz backend çalışıyor."

@socketio.on("connect")
def handle_connect():
    print("-----> CONNECT İSTEĞİ ALINDI <-----") # basic log
    print("-----> BİR KULLANICI BAĞLANDI (Socket.IO) <-----")
    print("CONNECT OLAYI TETİKLENDİ")
    emit("leaderboard_update", get_leaderboard())

@socketio.on("submit_score")
def handle_submit_score(data):
    print("-----> SUBMIT_SCORE OLAYI ALINDI: <-----", data)
    name = data.get("name")
    score = data.get("score")
    if name is not None and score is not None:
        participants.append({"name": name, "score": score})
        print(f"{name} adlı kullanıcı {score} puan aldı")
        emit("leaderboard_update", get_leaderboard(), broadcast=True)
    else:
        print("Hata: Geçersiz veri formatı (isim veya skor eksik).")

@socketio.on("get_leaderboard")
def handle_get_leaderboard():
    print("-----> GET_LEADERBOARD OLAYI ALINDI <-----")
    emit("leaderboard_update", get_leaderboard())

def get_leaderboard():
    sorted_participants = sorted(participants, key=lambda x: x["score"], reverse=True)
    return sorted_participants

if __name__ == "__main__":
    print("SocketIO sunucusu başlatılıyor...")
    socketio.run(app, host="0.0.0.0", port=1000, debug=True, use_reloader=False)