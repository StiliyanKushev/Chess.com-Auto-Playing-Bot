from stockfish import Stockfish
from flask import Flask, jsonify, request, render_template
from flask_cors import CORS
from pynput.mouse import Button, Controller
import chess
import time

mouse = Controller()

stockfish = Stockfish("C:/Users/StiliyanKushev/Desktop/ku6evChessBot/server/stockfishold", parameters={"Threads": 4})
stockfish.set_skill_level(10)
stockfish.set_depth(10)
app = Flask(__name__)
CORS(app)


@app.route('/getMove', methods=['POST'])
def getMove():
    data = request.get_json()
    moves = data['board']
    timeLeft = data['time']

    board = chess.Board()
    for m in moves:
        board.push_san(m)
    stockfish.set_fen_position(board.fen())

    global bestMove

    if timeLeft < 5:
        print("playing very fast")
        start = time.time()
        bestMove = stockfish.get_best_move_time(300)
        end = time.time()
        print(end - start)
    elif timeLeft < 10:
        print("playing fast")
        start = time.time()
        bestMove = stockfish.get_best_move_time(1000)
        end = time.time()
        print(end - start)
    else:
        print("playing normal")
        start = time.time()
        bestMove = stockfish.get_best_move()
        end = time.time()
        print(end - start)
    return jsonify(bestMove)


@app.route('/makeMove', methods=['POST'])
def makeMove():
    sq1Pos = request.get_json()['sq1Pos']
    mouse.position = (sq1Pos[0], sq1Pos[1])
    mouse.click(Button.left, 1)
    sq2Pos = request.get_json()['sq2Pos']
    mouse.position = (sq2Pos[0], sq2Pos[1])
    mouse.click(Button.left, 1)

    return "OK", 200


@app.route('/click', methods=['POST'])
def click():
    x = request.get_json()['x']
    y = request.get_json()['y']

    mouse.position = (x, y)
    mouse.click(Button.left, 1)

    return "OK", 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=80,ssl_context='adhoc')