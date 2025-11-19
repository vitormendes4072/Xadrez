// utils/chess.ts
import { BoardState, ChessPiece, Position } from '@/types/chess';

export const createInitialBoard = (): BoardState => {
  const board: BoardState = Array(8)
    .fill(null)
    .map(() => Array(8).fill(null));

  // Place pawns
  for (let col = 0; col < 8; col++) {
    board[1][col] = { type: 'pawn', color: 'black' };
    board[6][col] = { type: 'pawn', color: 'white' };
  }

  // Place other pieces
  const pieceOrder = [
    'rook',
    'knight',
    'bishop',
    'queen',
    'king',
    'bishop',
    'knight',
    'rook',
  ] as const;

  for (let col = 0; col < 8; col++) {
    board[0][col] = { type: pieceOrder[col], color: 'black' };
    board[7][col] = { type: pieceOrder[col], color: 'white' };
  }

  return board;
};

const cloneBoard = (board: BoardState): BoardState =>
  board.map((row) => [...row]);

const isPathClear = (
  board: BoardState,
  fromRow: number,
  fromCol: number,
  toRow: number,
  toCol: number
): boolean => {
  const rowDirection = toRow > fromRow ? 1 : toRow < fromRow ? -1 : 0;
  const colDirection = toCol > fromCol ? 1 : toCol < fromCol ? -1 : 0;

  let currentRow = fromRow + rowDirection;
  let currentCol = fromCol + colDirection;

  while (currentRow !== toRow || currentCol !== toCol) {
    if (board[currentRow][currentCol] !== null) {
      return false; // Path is blocked
    }
    currentRow += rowDirection;
    currentCol += colDirection;
  }

  return true;
};

/**
 * Valida apenas o movimento da peça (sem considerar xeque no próprio rei
 * e sem considerar en passant ou roque – isso é tratado em isValidMove)
 */
const isValidPieceMove = (
  board: BoardState,
  fromRow: number,
  fromCol: number,
  toRow: number,
  toCol: number
): boolean => {
  // Basic bounds checking
  if (toRow < 0 || toRow > 7 || toCol < 0 || toCol > 7) return false;

  const piece = board[fromRow][fromCol];
  if (!piece) return false;

  // Não permitir movimento nulo (ficar na mesma casa)
  if (fromRow === toRow && fromCol === toCol) return false;

  const targetPiece = board[toRow][toCol];

  // Can't capture own piece
  if (targetPiece && targetPiece.color === piece.color) return false;

  // Basic movement validation
  const rowDiff = Math.abs(toRow - fromRow);
  const colDiff = Math.abs(toCol - fromCol);

  switch (piece.type) {
    case 'pawn': {
      const direction = piece.color === 'white' ? -1 : 1;
      const startRow = piece.color === 'white' ? 6 : 1;

      // Forward move
      if (fromCol === toCol && !targetPiece) {
        if (toRow === fromRow + direction) return true;
        if (
          fromRow === startRow &&
          toRow === fromRow + 2 * direction &&
          board[fromRow + direction][fromCol] === null // não pular peça
        )
          return true;
      }

      // Diagonal capture normal
      if (
        Math.abs(fromCol - toCol) === 1 &&
        toRow === fromRow + direction &&
        targetPiece
      ) {
        return true;
      }
      return false;
    }

    case 'rook':
      if (rowDiff === 0 || colDiff === 0) {
        return isPathClear(board, fromRow, fromCol, toRow, toCol);
      }
      return false;

    case 'bishop':
      if (rowDiff === colDiff) {
        return isPathClear(board, fromRow, fromCol, toRow, toCol);
      }
      return false;

    case 'queen':
      if (rowDiff === 0 || colDiff === 0 || rowDiff === colDiff) {
        return isPathClear(board, fromRow, fromCol, toRow, toCol);
      }
      return false;

    case 'king':
      // rei normal: 1 casa em qualquer direção
      return rowDiff <= 1 && colDiff <= 1;

    case 'knight':
      return (
        (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2)
      );

    default:
      return false;
  }
};

const findKingPosition = (
  board: BoardState,
  color: ChessPiece['color']
): { row: number; col: number } | null => {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.type === 'king' && piece.color === color) {
        return { row, col };
      }
    }
  }
  return null;
};

const isSquareAttacked = (
  board: BoardState,
  row: number,
  col: number,
  byColor: ChessPiece['color']
): boolean => {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && piece.color === byColor) {
        if (isValidPieceMove(board, r, c, row, col)) {
          return true;
        }
      }
    }
  }
  return false;
};

export const isKingInCheck = (
  board: BoardState,
  color: ChessPiece['color']
): boolean => {
  const kingPos = findKingPosition(board, color);
  if (!kingPos) return false; // rei capturado (não deveria acontecer)

  const opponentColor = color === 'white' ? 'black' : 'white';
  return isSquareAttacked(board, kingPos.row, kingPos.col, opponentColor);
};

/**
 * isValidMove:
 * - Trata roque (rei anda 2 casas na horizontal)
 * - Trata en passant
 * - Usa isValidPieceMove para movimentos normais
 * - Garante que o movimento não deixa o próprio rei em xeque
 */
export const isValidMove = (
  board: BoardState,
  fromRow: number,
  fromCol: number,
  toRow: number,
  toCol: number,
  enPassantTarget?: Position | null
): boolean => {
  const piece = board[fromRow][fromCol];
  if (!piece) return false;

  // 1) ROQUE (rei anda 2 casas na horizontal na mesma linha)
  if (
    piece.type === 'king' &&
    fromRow === toRow &&
    Math.abs(toCol - fromCol) === 2
  ) {
    const color = piece.color;
    const isKingside = toCol > fromCol; // roque pequeno ou grande
    const rookCol = isKingside ? 7 : 0;
    const rook = board[fromRow][rookCol];

    // precisa ter torre correta no canto
    if (!rook || rook.type !== 'rook' || rook.color !== color) {
      return false;
    }

    // rei não pode estar em xeque
    if (isKingInCheck(board, color)) return false;

    // casas entre rei e torre devem estar vazias
    const step = isKingside ? 1 : -1;
    for (let c = fromCol + step; c !== rookCol; c += step) {
      if (board[fromRow][c] !== null) return false;
    }

    // rei não pode passar por casas atacadas
    const opponentColor = color === 'white' ? 'black' : 'white';
    // casas que o rei ocupa durante o roque: fromCol+step, toCol
    for (let c = fromCol + step; c !== toCol + step; c += step) {
      if (isSquareAttacked(board, fromRow, c, opponentColor)) {
        return false;
      }
    }

    // simula o roque
    const newBoard = cloneBoard(board);
    const rookDestCol = isKingside ? toCol - 1 : toCol + 1;

    newBoard[fromRow][fromCol] = null;
    newBoard[fromRow][rookCol] = null;
    newBoard[fromRow][toCol] = piece;
    newBoard[fromRow][rookDestCol] = rook;

    return !isKingInCheck(newBoard, color);
  }

  // 2) EN PASSANT (já tínhamos implementado)
  let isEnPassant = false;

  if (
    piece.type === 'pawn' &&
    enPassantTarget &&
    toRow === enPassantTarget.row &&
    toCol === enPassantTarget.col &&
    board[toRow][toCol] === null // casa alvo está vazia no en passant
  ) {
    const captureRow =
      enPassantTarget.row + (piece.color === 'white' ? 1 : -1);
    const captureCol = enPassantTarget.col;

    if (
      fromRow === captureRow &&
      Math.abs(fromCol - captureCol) === 1
    ) {
      const capturedPawn = board[captureRow][captureCol];
      if (
        capturedPawn &&
        capturedPawn.type === 'pawn' &&
        capturedPawn.color !== piece.color
      ) {
        isEnPassant = true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  }

  // 3) Movimento normal
  if (!isEnPassant && !isValidPieceMove(board, fromRow, fromCol, toRow, toCol)) {
    return false;
  }

  // 4) Simula o movimento para checar se o rei fica em xeque
  const newBoard = cloneBoard(board);

  // Remove peça da origem
  newBoard[fromRow][fromCol] = null;

  // Se for en passant, remove o peão capturado na casa "atrás"
  if (isEnPassant && enPassantTarget) {
    const captureRow =
      enPassantTarget.row + (piece.color === 'white' ? 1 : -1);
    const captureCol = enPassantTarget.col;
    newBoard[captureRow][captureCol] = null;
  }

  // Coloca a peça na casa de destino
  newBoard[toRow][toCol] = piece;

  return !isKingInCheck(newBoard, piece.color);
};

const hasAnyLegalMove = (
  board: BoardState,
  color: ChessPiece['color'],
  enPassantTarget?: Position | null
): boolean => {
  for (let fromRow = 0; fromRow < 8; fromRow++) {
    for (let fromCol = 0; fromCol < 8; fromCol++) {
      const piece = board[fromRow][fromCol];
      if (!piece || piece.color !== color) continue;

      for (let toRow = 0; toRow < 8; toRow++) {
        for (let toCol = 0; toCol < 8; toCol++) {
          if (
            isValidMove(
              board,
              fromRow,
              fromCol,
              toRow,
              toCol,
              enPassantTarget
            )
          ) {
            return true;
          }
        }
      }
    }
  }
  return false;
};

export const isCheckmate = (
  board: BoardState,
  color: ChessPiece['color'],
  enPassantTarget?: Position | null
): boolean => {
  if (!isKingInCheck(board, color)) return false;
  return !hasAnyLegalMove(board, color, enPassantTarget);
};

export const isStalemate = (
  board: BoardState,
  color: ChessPiece['color'],
  enPassantTarget?: Position | null
): boolean => {
  if (isKingInCheck(board, color)) return false;
  return !hasAnyLegalMove(board, color, enPassantTarget);
};
