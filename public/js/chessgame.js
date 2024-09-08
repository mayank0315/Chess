// const { Chess } = require("chess.js");

const socket = io();
const chess = new Chess();
const boardElement = document.querySelector(".chessboard")

let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;



const getPieceUnicode = (piece) => {
    const unicodePieces ={
        p: '♟',  // Black pawn
        r: '♜',  // Black rook
        n: '♞',  // Black knight
        b: '♝',  // Black bishop
        q: '♛',  // Black queen
        k: '♚',  // Black king
        P: '♙',  // White pawn
        R: '♖',  // White rook
        N: '♘',  // White knight
        B: '♗',  // White bishop
        Q: '♕',  // White queen
        K: '♔',  // White king
    };
    
    return unicodePieces[piece.type] || ""
}


const renderBoard = () => {
    const board = chess.board();
    boardElement.innerHTML = "";
    board.forEach((row, rowindex) => {
        row.forEach((square, squareindex) => {
            const squareElement = document.createElement("div")
            squareElement.classList.add("square", 
                (rowindex +squareindex)%2 === 0 ? "light" : "dark"
            )

            squareElement.dataset.row = rowindex;
            squareElement.dataset.col = squareindex;

            if(square){
                const pieceElement = document.createElement("div");
                pieceElement.classList.add(
                    "piece",
                    square.color === "w" ? "white" : "black"
                )
                pieceElement.innerText = getPieceUnicode(square);
                pieceElement.draggable = playerRole === square.color;

                pieceElement.addEventListener("dragstart", (e) => {
                    if(pieceElement.draggable){
                        draggedPiece = pieceElement;
                        sourceSquare = {row : rowindex, col: squareindex}
                        e.dataTransfer.setData("text/plain", "")
                    }
                })
                pieceElement.addEventListener("dragend",(e) => {
                    draggedPiece = null;
                    sourceSquare = null;
                })

                squareElement.appendChild(pieceElement)
            }

            squareElement.addEventListener("dragover", function (e) {
                e.preventDefault();
            })
            squareElement.addEventListener("drop", function (e) {
                e.preventDefault();
                if(draggedPiece){
                    const targetSource = {
                        row: parseInt(squareElement.dataset.row),
                        col: parseInt(squareElement.dataset.col),
                    };

                    handleMove(sourceSquare, targetSource)
                }
            })

            
            boardElement.appendChild(squareElement)
        })
    })

    if(playerRole === "b") {
        boardElement.classList.add("flipped")
    }else {
        boardElement.classList.remove("flipped")
    }

   
}
renderBoard()


const handleMove = (source, target) => {
    const move = {
        from: `${String.fromCharCode(97 + source.col)}${8 - source.row}`,
        to:`${String.fromCharCode(97 + target.col)}${8 - target.row}`,
        promotion:"q"
    }

    socket.emit("move", move)

}

socket.on("playerRole", function(role){
    playerRole = role;
    renderBoard();
})
socket.on("spectatorRole", function(){
    playerRole = null;
    renderBoard();
})
socket.on("boardState", function(fen){
    chess.load(fen);
    renderBoard();
})
socket.on("move", function(move){
    chess.move(move);
    renderBoard();
})

socket.on("invalidMove", function(message) {
    const errorMessageElement = document.getElementById("error-message");
    errorMessageElement.innerText = message;
    errorMessageElement.style.display = "block";

    // Hide the error message after 3 seconds
    setTimeout(() => {
        errorMessageElement.style.display = "none";
    }, 3000);
});





