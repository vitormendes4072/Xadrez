// utils/chessAI.ts
import { BoardState, Position, PieceType } from '@/types/chess';
import { isValidMove, isKingInCheck } from './chess';

export type Difficulty = 'easy' | 'medium' | 'hard';

const pieceValues: Record<PieceType, number> = {
  pawn: 1,
  knight: 3,
  bishop: 3,
  rook: 5,
  queen: 9,
  king: 1000,
};

const evaluateBoard = (board: BoardState): number => {
  let score = 0;

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece) {
        const value = pieceValues[piece.type];
        // positivo é bom para as pretas, negativo para as brancas
        score += piece.color === 'black' ? value : -value;
      }
    }
  }

  return score;
};

/**
 * Gera todos os movimentos legais para uma cor.
 * Aqui usamos o formato "codificado":
 *   - move.row = fromIndex (0..63)
 *   - move.col = toIndex   (0..63)
 */
const getAllValidMoves = (
  board: BoardState,
  color: 'white' | 'black'
): Position[] => {
  const moves: Position[] = [];

  for (let fromRow = 0; fromRow < 8; fromRow++) {
    for (let fromCol = 0; fromCol < 8; fromCol++) {
      const piece = board[fromRow][fromCol];
      if (piece && piece.color === color) {
        for (let toRow = 0; toRow < 8; toRow++) {
          for (let toCol = 0; toCol < 8; toCol++) {
            if (isValidMove(board, fromRow, fromCol, toRow, toCol)) {
              moves.push({
                row: fromRow * 8 + fromCol, // posição de origem codificada
                col: toRow * 8 + toCol, // posição de destino codificada
              });
            }
          }
        }
      }
    }
  }

  return moves;
};

const decodeIndex = (index: number): { row: number; col: number } => ({
  row: Math.floor(index / 8),
  col: index % 8,
});

/**
 * Aplica um movimento codificado em um novo tabuleiro,
 * incluindo promoção automática para dama.
 */
const makeMove = (
  board: BoardState,
  from: Position,
  to: Position
): BoardState => {
  const newBoard = board.map((row) => [...row]);

  const { row: fromRow, col: fromCol } = decodeIndex(from.row);
  const { row: toRow, col: toCol } = decodeIndex(to.col);

  const movingPiece = newBoard[fromRow][fromCol];
  if (!movingPiece) {
    return newBoard;
  }

  // remove peça da origem
  newBoard[fromRow][fromCol] = null;

  // checa promoção
  let finalPiece = movingPiece;
  if (
    movingPiece.type === 'pawn' &&
    (toRow === 0 || toRow === 7)
  ) {
    finalPiece = { ...movingPiece, type: 'queen' };
  }

  // coloca na casa de destino
  newBoard[toRow][toCol] = finalPiece;

  return newBoard;
};

export const getAIMove = (
  board: BoardState,
  difficulty: Difficulty
): Position | null => {
  const moves = getAllValidMoves(board, 'black');

  if (moves.length === 0) return null;

  switch (difficulty) {
    case 'easy':
      // Movimento completamente aleatório
      return moves[Math.floor(Math.random() * moves.length)];

    case 'medium': {
      // Procura capturas com melhor valor; se não tiver, escolhe aleatório
      let bestMoves: Position[] = [];
      let bestScore = -Infinity;

      for (const move of moves) {
        const { row: fromRow, col: fromCol } = decodeIndex(move.row);
        const { row: toRow, col: toCol } = decodeIndex(move.col);

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
    }

    case 'hard': {
      // Minimax com profundidade 2 (IA joga de pretas)
      let bestMove: Position | null = null;
      let bestValue = -Infinity;

      for (const move of moves) {
        const newBoard = makeMove(
          board,
          { row: move.row, col: 0 }, // col não é usado no decode
          { row: 0, col: move.col }
        );

        // Próxima jogada é das brancas (minimizador)
        const value = minimax(newBoard, 1, false);

        if (value > bestValue) {
          bestValue = value;
          bestMove = move;
        }
      }

      return bestMove;
    }

    default:
      return moves[0];
  }
};

/**
 * Minimax simples:
 * - isMaximizing = true  -> vez das pretas (IA)
 * - isMaximizing = false -> vez das brancas
 */
const minimax = (
  board: BoardState,
  depth: number,
  isMaximizing: boolean
): number => {
  if (depth === 0) {
    return evaluateBoard(board);
  }

  const color: 'white' | 'black' = isMaximizing ? 'black' : 'white';
  const moves = getAllValidMoves(board, color);

  // Sem movimentos legais: pode ser xeque-mate ou afogamento (stalemate)
  if (moves.length === 0) {
    const inCheck = isKingInCheck(board, color);

    if (inCheck) {
      // Se é xeque-mate contra quem joga agora:
      // - se quem joga é o maximizador (pretas): péssimo para ele
      // - se quem joga é o minimizador (brancas): ótimo para pretas
      return isMaximizing ? -Infinity : Infinity;
    } else {
      // Afogamento (empate): avaliamos como 0 (posição neutra)
      return 0;
    }
  }

  if (isMaximizing) {
    // Pretas querem maximizar o score
    let maxEval = -Infinity;
    for (const move of moves) {
      const newBoard = makeMove(
        board,
        { row: move.row, col: 0 },
        { row: 0, col: move.col }
      );
      const evalScore = minimax(newBoard, depth - 1, false);
      maxEval = Math.max(maxEval, evalScore);
    }
    return maxEval;
  } else {
    // Brancas querem minimizar o score (score positivo é bom para pretas)
    let minEval = Infinity;
    for (const move of moves) {
      const newBoard = makeMove(
        board,
        { row: move.row, col: 0 },
        { row: 0, col: move.col }
      );
      const evalScore = minimax(newBoard, depth - 1, true);
      minEval = Math.min(minEval, evalScore);
    }
    return minEval;
  }
};
