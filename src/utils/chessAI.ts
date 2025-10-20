import { BoardState, Position, PieceType } from '@/types/chess';
import { isValidMove } from './chess';

export type Difficulty = 'easy' | 'medium' | 'hard';

const pieceValues: Record<PieceType, number> = {
  pawn: 1,
  knight: 3,
  bishop: 3,
  rook: 5,
  queen: 9,
  king: 1000
};

const evaluateBoard = (board: BoardState): number => {
  let score = 0;
  
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece) {
        const value = pieceValues[piece.type];
        score += piece.color === 'black' ? value : -value;
      }
    }
  }
  
  return score;
};

const getAllValidMoves = (board: BoardState, color: 'white' | 'black'): Position[] => {
  const moves: Position[] = [];
  
  for (let fromRow = 0; fromRow < 8; fromRow++) {
    for (let fromCol = 0; fromCol < 8; fromCol++) {
      const piece = board[fromRow][fromCol];
      if (piece && piece.color === color) {
        for (let toRow = 0; toRow < 8; toRow++) {
          for (let toCol = 0; toCol < 8; toCol++) {
            if (isValidMove(board, fromRow, fromCol, toRow, toCol)) {
              moves.push({
                row: fromRow * 8 + fromCol, // from position encoded
                col: toRow * 8 + toCol      // to position encoded
              });
            }
          }
        }
      }
    }
  }
  
  return moves;
};

const makeMove = (board: BoardState, from: Position, to: Position): BoardState => {
  const newBoard = board.map(row => [...row]);
  const fromRow = Math.floor(from.row / 8);
  const fromCol = from.row % 8;
  const toRow = Math.floor(to.col / 8);
  const toCol = to.col % 8;
  
  newBoard[toRow][toCol] = newBoard[fromRow][fromCol];
  newBoard[fromRow][fromCol] = null;
  
  return newBoard;
};

export const getAIMove = (board: BoardState, difficulty: Difficulty): Position | null => {
  const moves = getAllValidMoves(board, 'black');
  
  if (moves.length === 0) return null;
  
  switch (difficulty) {
    case 'easy':
      // Random move
      return moves[Math.floor(Math.random() * moves.length)];
      
    case 'medium':
      // Look for captures first, then random
      let bestMoves = [];
      let bestScore = -Infinity;
      
      for (const move of moves) {
        const fromRow = Math.floor(move.row / 8);
        const fromCol = move.row % 8;
        const toRow = Math.floor(move.col / 8);
        const toCol = move.col % 8;
        
        const capturedPiece = board[toRow][toCol];
        const score = capturedPiece ? pieceValues[capturedPiece.type] : 0;
        
        if (score > bestScore) {
          bestScore = score;
          bestMoves = [move];
        } else if (score === bestScore) {
          bestMoves.push(move);
        }
      }
      
      return bestMoves[Math.floor(Math.random() * bestMoves.length)];
      
    case 'hard':
      // Minimax with depth 2
      let bestMove = null;
      let bestValue = -Infinity;
      
      for (const move of moves) {
        const newBoard = makeMove(board, 
          { row: Math.floor(move.row / 8), col: move.row % 8 },
          { row: Math.floor(move.col / 8), col: move.col % 8 }
        );
        
        const value = minimax(newBoard, 1, false);
        
        if (value > bestValue) {
          bestValue = value;
          bestMove = move;
        }
      }
      
      return bestMove;
      
    default:
      return moves[0];
  }
};

const minimax = (board: BoardState, depth: number, isMaximizing: boolean): number => {
  if (depth === 0) {
    return evaluateBoard(board);
  }
  
  const color = isMaximizing ? 'black' : 'white';
  const moves = getAllValidMoves(board, color);
  
  if (moves.length === 0) {
    return isMaximizing ? -Infinity : Infinity;
  }
  
  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      const newBoard = makeMove(board,
        { row: Math.floor(move.row / 8), col: move.row % 8 },
        { row: Math.floor(move.col / 8), col: move.col % 8 }
      );
      const eval_score = minimax(newBoard, depth - 1, false);
      maxEval = Math.max(maxEval, eval_score);
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      const newBoard = makeMove(board,
        { row: Math.floor(move.row / 8), col: move.row % 8 },
        { row: Math.floor(move.col / 8), col: move.col % 8 }
      );
      const eval_score = minimax(newBoard, depth - 1, true);
      minEval = Math.min(minEval, eval_score);
    }
    return minEval;
  }
};