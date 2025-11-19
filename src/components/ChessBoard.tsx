import { useState, useCallback, useEffect } from 'react';
import {
  BoardState,
  Position,
  PieceType,
  PIECE_SYMBOLS,
  ChessPiece,
} from '@/types/chess';
import {
  createInitialBoard,
  isValidMove,
  isCheckmate,
  isKingInCheck,
  isStalemate,
} from '@/utils/chess';
import { getAIMove, Difficulty } from '@/utils/chessAI';
import { ChessSquare } from './ChessSquare';
import { AnimatedPiece } from './AnimatedPiece';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

type PromotionPieceType = Exclude<PieceType, 'king' | 'pawn'>;

interface PendingPromotion {
  to: Position;
  movingColor: 'white' | 'black';
  nextPlayer: 'white' | 'black';
  nextEnPassant: Position | null;
}

interface MoveAnimation {
  from: Position;
  to: Position;
  piece: ChessPiece;
}

const ANIMATION_DURATION_MS = 300;

export const ChessBoard = () => {
  const [board, setBoard] = useState<BoardState>(createInitialBoard);
  const [selectedSquare, setSelectedSquare] = useState<Position | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<'white' | 'black'>('white');
  const [possibleMoves, setPossibleMoves] = useState<Position[]>([]);
  const [gameActive, setGameActive] = useState<boolean>(false);
  const [gameMode, setGameMode] = useState<'pvp' | 'ai'>('pvp');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [isAIThinking, setIsAIThinking] = useState<boolean>(false);

  const [winner, setWinner] = useState<'white' | 'black' | null>(null);
  const [checkOn, setCheckOn] = useState<'white' | 'black' | null>(null);
  const [isDraw, setIsDraw] = useState<boolean>(false);

  const [enPassantTarget, setEnPassantTarget] = useState<Position | null>(null);
  const [pendingPromotion, setPendingPromotion] =
    useState<PendingPromotion | null>(null);

  // animação
  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  const [animation, setAnimation] = useState<MoveAnimation | null>(null);

  const startGame = useCallback(() => {
    setBoard(createInitialBoard());
    setSelectedSquare(null);
    setCurrentPlayer('white');
    setPossibleMoves([]);
    setGameActive(true);
    setIsAIThinking(false);
    setWinner(null);
    setCheckOn(null);
    setIsDraw(false);
    setEnPassantTarget(null);
    setPendingPromotion(null);
    setAnimation(null);
  }, []);

  const resignGame = useCallback(() => {
    setGameActive(false);
    setSelectedSquare(null);
    setPossibleMoves([]);
    setIsAIThinking(false);
    setCheckOn(null);
    setIsDraw(false);
    setEnPassantTarget(null);
    setPendingPromotion(null);
    setAnimation(null);
  }, []);

  // limpa animação após 300ms
  useEffect(() => {
    if (!animationsEnabled || !animation) return;
    const timer = setTimeout(() => setAnimation(null), ANIMATION_DURATION_MS);
    return () => clearTimeout(timer);
  }, [animation, animationsEnabled]);

  // -------- IA MOVE (2 fases p/ não cancelar timer) --------
  useEffect(() => {
    if (!gameActive || gameMode !== 'ai' || currentPlayer !== 'black') {
      return;
    }

    // Fase 1: marcar IA pensando
    if (!isAIThinking) {
      setIsAIThinking(true);
      return;
    }

    // Fase 2: efetivamente jogar
    const timer = setTimeout(() => {
      const aiMove = getAIMove(board, difficulty);

      if (!aiMove) {
        setIsAIThinking(false);
        return;
      }

      const fromRow = Math.floor(aiMove.row / 8);
      const fromCol = aiMove.row % 8;
      const toRow = Math.floor(aiMove.col / 8);
      const toCol = aiMove.col % 8;

      const newBoard = board.map((row) => [...row]);
      const movingPiece = newBoard[fromRow][fromCol];

      if (!movingPiece) {
        setIsAIThinking(false);
        return;
      }

      // animação IA
      if (animationsEnabled) {
        setAnimation({
          from: { row: fromRow, col: fromCol },
          to: { row: toRow, col: toCol },
          piece: movingPiece,
        });
      }

      // EN PASSANT IA
      const isEnPassantMove =
        movingPiece.type === 'pawn' &&
        enPassantTarget &&
        toRow === enPassantTarget.row &&
        toCol === enPassantTarget.col &&
        board[toRow][toCol] === null &&
        Math.abs(fromCol - toCol) === 1;

      newBoard[fromRow][fromCol] = null;

      if (isEnPassantMove && enPassantTarget) {
        const captureRow =
          enPassantTarget.row + (movingPiece.color === 'white' ? 1 : -1);
        const captureCol = enPassantTarget.col;
        newBoard[captureRow][captureCol] = null;
      }

      // ROQUE IA
      const isCastlingMove =
        movingPiece.type === 'king' &&
        fromRow === toRow &&
        Math.abs(toCol - fromCol) === 2;

      if (isCastlingMove) {
        const isKingside = toCol > fromCol;
        const rookFromCol = isKingside ? 7 : 0;
        const rookToCol = isKingside ? toCol - 1 : toCol + 1;
        const rook = newBoard[fromRow][rookFromCol];

        if (rook && rook.type === 'rook') {
          newBoard[fromRow][rookFromCol] = null;
          newBoard[fromRow][rookToCol] = rook;
        }
      }

      // PROMOÇÃO IA (sempre dama)
      let finalPiece = movingPiece;
      if (
        movingPiece.type === 'pawn' &&
        (toRow === 0 || toRow === 7)
      ) {
        finalPiece = { ...movingPiece, type: 'queen' };
      }

      newBoard[toRow][toCol] = finalPiece;

      const nextPlayer: 'white' | 'black' = 'white';

      let nextEnPassant: Position | null = null;
      if (
        movingPiece.type === 'pawn' &&
        Math.abs(toRow - fromRow) === 2
      ) {
        const midRow = (toRow + fromRow) / 2;
        nextEnPassant = { row: midRow, col: toCol };
      }

      if (isCheckmate(newBoard, nextPlayer, nextEnPassant)) {
        setBoard(newBoard);
        setWinner('black');
        setGameActive(false);
        setCheckOn(null);
        setIsDraw(false);
        setEnPassantTarget(null);
        setIsAIThinking(false);
        return;
      }

      if (isStalemate(newBoard, nextPlayer, nextEnPassant)) {
        setBoard(newBoard);
        setGameActive(false);
        setWinner(null);
        setCheckOn(null);
        setIsDraw(true);
        setEnPassantTarget(null);
        setIsAIThinking(false);
        return;
      }

      if (isKingInCheck(newBoard, nextPlayer)) {
        setCheckOn(nextPlayer);
      } else {
        setCheckOn(null);
      }

      setBoard(newBoard);
      setEnPassantTarget(nextEnPassant);
      setCurrentPlayer(nextPlayer);
      setIsAIThinking(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [
    gameActive,
    gameMode,
    currentPlayer,
    board,
    difficulty,
    enPassantTarget,
    isAIThinking,
    animationsEnabled,
  ]);

  const calculatePossibleMoves = useCallback(
    (row: number, col: number): Position[] => {
      const moves: Position[] = [];

      for (let toRow = 0; toRow < 8; toRow++) {
        for (let toCol = 0; toCol < 8; toCol++) {
          if (
            isValidMove(
              board,
              row,
              col,
              toRow,
              toCol,
              enPassantTarget
            )
          ) {
            moves.push({ row: toRow, col: toCol });
          }
        }
      }

      return moves;
    },
    [board, enPassantTarget]
  );

  // -------- FINALIZAR PROMOÇÃO --------
  const handlePromotionChoice = useCallback(
    (pieceType: PromotionPieceType) => {
      if (!pendingPromotion) return;

      const { to, movingColor, nextPlayer, nextEnPassant } =
        pendingPromotion;

      const newBoard = board.map((row) => [...row]);
      newBoard[to.row][to.col] = {
        type: pieceType,
        color: movingColor,
      };

      if (isCheckmate(newBoard, nextPlayer, nextEnPassant)) {
        setBoard(newBoard);
        setWinner(movingColor);
        setGameActive(false);
        setCheckOn(null);
        setIsDraw(false);
        setEnPassantTarget(null);
        setPendingPromotion(null);
        return;
      }

      if (isStalemate(newBoard, nextPlayer, nextEnPassant)) {
        setBoard(newBoard);
        setGameActive(false);
        setWinner(null);
        setCheckOn(null);
        setIsDraw(true);
        setEnPassantTarget(null);
        setPendingPromotion(null);
        return;
      }

      if (isKingInCheck(newBoard, nextPlayer)) {
        setCheckOn(nextPlayer);
      } else {
        setCheckOn(null);
      }

      setBoard(newBoard);
      setEnPassantTarget(nextEnPassant);
      setCurrentPlayer(nextPlayer);
      setPendingPromotion(null);
    },
    [board, pendingPromotion]
  );

  // -------- MOVIMENTO DO JOGADOR --------
  const handleSquareClick = useCallback(
    (row: number, col: number) => {
      if (!gameActive || isAIThinking) return;
      if (pendingPromotion) return;
      if (animationsEnabled && animation) return;
      if (gameMode === 'ai' && currentPlayer === 'black') return;

      const piece = board[row][col];

      if (selectedSquare) {
        if (selectedSquare.row === row && selectedSquare.col === col) {
          setSelectedSquare(null);
          setPossibleMoves([]);
          return;
        }

        if (
          isValidMove(
            board,
            selectedSquare.row,
            selectedSquare.col,
            row,
            col,
            enPassantTarget
          )
        ) {
          const newBoard = board.map((r) => [...r]);
          const movingPiece =
            newBoard[selectedSquare.row][selectedSquare.col];

          if (movingPiece && movingPiece.color === currentPlayer) {
            const fromRow = selectedSquare.row;
            const fromCol = selectedSquare.col;
            const toRow = row;
            const toCol = col;

            // animação do jogador
            if (animationsEnabled) {
              setAnimation({
                from: { row: fromRow, col: fromCol },
                to: { row: toRow, col: toCol },
                piece: movingPiece,
              });
            }

            // EN PASSANT
            const isEnPassantMove =
              movingPiece.type === 'pawn' &&
              enPassantTarget &&
              toRow === enPassantTarget.row &&
              toCol === enPassantTarget.col &&
              board[toRow][toCol] === null &&
              Math.abs(fromCol - toCol) === 1;

            newBoard[fromRow][fromCol] = null;

            if (isEnPassantMove && enPassantTarget) {
              const captureRow =
                enPassantTarget.row +
                (movingPiece.color === 'white' ? 1 : -1);
              const captureCol = enPassantTarget.col;
              newBoard[captureRow][captureCol] = null;
            }

            // ROQUE
            const isCastlingMove =
              movingPiece.type === 'king' &&
              fromRow === toRow &&
              Math.abs(toCol - fromCol) === 2;

            if (isCastlingMove) {
              const isKingside = toCol > fromCol;
              const rookFromCol = isKingside ? 7 : 0;
              const rookToCol = isKingside ? toCol - 1 : toCol + 1;
              const rook = newBoard[fromRow][rookFromCol];

              if (rook && rook.type === 'rook') {
                newBoard[fromRow][rookFromCol] = null;
                newBoard[fromRow][rookToCol] = rook;
              }
            }

            const isPromotionMove =
              movingPiece.type === 'pawn' &&
              (toRow === 0 || toRow === 7);

            // coloca peão temporariamente
            newBoard[toRow][toCol] = movingPiece;

            const nextPlayer: 'white' | 'black' =
              currentPlayer === 'white' ? 'black' : 'white';

            let nextEnPassant: Position | null = null;
            if (
              movingPiece.type === 'pawn' &&
              Math.abs(toRow - fromRow) === 2
            ) {
              const midRow = (toRow + fromRow) / 2;
              nextEnPassant = { row: midRow, col: toCol };
            }

            if (isPromotionMove) {
              setBoard(newBoard);
              setEnPassantTarget(nextEnPassant);
              setPendingPromotion({
                to: { row: toRow, col: toCol },
                movingColor: movingPiece.color,
                nextPlayer,
                nextEnPassant,
              });
              setSelectedSquare(null);
              setPossibleMoves([]);
              return;
            }

            if (isCheckmate(newBoard, nextPlayer, nextEnPassant)) {
              setBoard(newBoard);
              setWinner(currentPlayer);
              setGameActive(false);
              setCheckOn(null);
              setIsDraw(false);
              setEnPassantTarget(null);
              setSelectedSquare(null);
              setPossibleMoves([]);
              return;
            }

            if (isStalemate(newBoard, nextPlayer, nextEnPassant)) {
              setBoard(newBoard);
              setWinner(null);
              setGameActive(false);
              setCheckOn(null);
              setIsDraw(true);
              setEnPassantTarget(null);
              setSelectedSquare(null);
              setPossibleMoves([]);
              return;
            }

            if (isKingInCheck(newBoard, nextPlayer)) {
              setCheckOn(nextPlayer);
            } else {
              setCheckOn(null);
            }

            setBoard(newBoard);
            setEnPassantTarget(nextEnPassant);
            setCurrentPlayer(nextPlayer);
          }
        }

        setSelectedSquare(null);
        setPossibleMoves([]);
      } else if (piece && piece.color === currentPlayer) {
        setSelectedSquare({ row, col });
        setPossibleMoves(calculatePossibleMoves(row, col));
      }
    },
    [
      board,
      selectedSquare,
      currentPlayer,
      calculatePossibleMoves,
      gameActive,
      gameMode,
      isAIThinking,
      enPassantTarget,
      pendingPromotion,
      animationsEnabled,
      animation,
    ]
  );

  const isSquareHighlighted = useCallback(
    (row: number, col: number): boolean => {
      return possibleMoves.some(
        (move) => move.row === row && move.col === col
      );
    },
    [possibleMoves]
  );

  const isSquareSelected = useCallback(
    (row: number, col: number): boolean => {
      return (
        selectedSquare?.row === row && selectedSquare?.col === col
      );
    },
    [selectedSquare]
  );

  const promotionPieces: PromotionPieceType[] = [
    'queen',
    'rook',
    'bishop',
    'knight',
  ];

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-center">
        {!gameActive ? (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">
              Xadrez dos Amigos
            </h2>
            <p className="text-sm text-muted-foreground">
              Jogue xadrez online
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Modo de Jogo
                </label>
                <Select
                  value={gameMode}
                  onValueChange={(value: 'pvp' | 'ai') =>
                    setGameMode(value)
                  }
                >
                  <SelectTrigger className="w-64">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pvp">
                      Humano vs Humano
                    </SelectItem>
                    <SelectItem value="ai">
                      Humano vs IA
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {gameMode === 'ai' && (
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Dificuldade da IA
                  </label>
                  <Select
                    value={difficulty}
                    onValueChange={(value: Difficulty) =>
                      setDifficulty(value)
                    }
                  >
                    <SelectTrigger className="w-64">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Fácil</SelectItem>
                      <SelectItem value="medium">Médio</SelectItem>
                      <SelectItem value="hard">Difícil</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex items-center justify-center gap-2 text-sm">
                <span>Animações</span>
                <Button
                  size="sm"
                  variant={animationsEnabled ? 'default' : 'outline'}
                  onClick={() =>
                    setAnimationsEnabled((prev) => !prev)
                  }
                >
                  {animationsEnabled ? 'Ligadas' : 'Desligadas'}
                </Button>
              </div>
            </div>

            <Button
              onClick={startGame}
              size="lg"
              className="bg-primary hover:bg-primary/90 mt-4"
            >
              Iniciar Partida
            </Button>

            {winner && (
              <p className="mt-2 text-sm font-semibold text-foreground">
                Xeque-mate!{' '}
                {winner === 'white' ? 'Brancas' : 'Pretas'} venceram.
              </p>
            )}

            {!winner && isDraw && (
              <p className="mt-2 text-sm font-semibold text-foreground">
                Empate por afogamento (stalemate).
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              {gameMode === 'ai' && isAIThinking
                ? 'IA está pensando...'
                : `Turno: ${
                    currentPlayer === 'white'
                      ? 'Brancas'
                      : gameMode === 'ai'
                      ? 'Você'
                      : 'Pretas'
                  }`}
            </h2>

            {gameMode === 'ai' && (
              <p className="text-sm text-muted-foreground">
                Dificuldade:{' '}
                {difficulty === 'easy'
                  ? 'Fácil'
                  : difficulty === 'medium'
                  ? 'Médio'
                  : 'Difícil'}
              </p>
            )}

            <div className="flex items-center justify-center gap-2 text-sm">
              <span>Animações</span>
              <Button
                size="sm"
                variant={animationsEnabled ? 'default' : 'outline'}
                onClick={() =>
                  setAnimationsEnabled((prev) => !prev)
                }
              >
                {animationsEnabled ? 'Ligadas' : 'Desligadas'}
              </Button>
            </div>

            <Button
              onClick={resignGame}
              variant="destructive"
              size="sm"
            >
              Desistir da Partida
            </Button>
          </div>
        )}
      </div>

      <div
        className={cn(
          'relative', // importante p/ AnimatedPiece
          'grid grid-cols-8 gap-0 border-4 border-accent rounded-lg overflow-hidden',
          'shadow-[var(--shadow-board)]',
          !gameActive && 'opacity-70'
        )}
        style={{ background: 'var(--gradient-board)' }}
      >
        {board.map((row, rowIndex) =>
          row.map((piece, colIndex) => {
            const isLight = (rowIndex + colIndex) % 2 === 0;

            return (
              <ChessSquare
                key={`${rowIndex}-${colIndex}`}
                piece={piece}
                isLight={isLight}
                isSelected={isSquareSelected(rowIndex, colIndex)}
                isHighlighted={isSquareHighlighted(rowIndex, colIndex)}
                onClick={() =>
                  handleSquareClick(rowIndex, colIndex)
                }
              />
            );
          })
        )}

        {animationsEnabled && animation && (
          <AnimatedPiece
            from={animation.from}
            to={animation.to}
            piece={animation.piece}
            durationMs={ANIMATION_DURATION_MS}
          />
        )}
      </div>

      {gameActive && (
        <div className="text-center text-sm text-muted-foreground max-w-md">
          <p>
            Clique em uma peça para selecioná-la, depois clique no
            destino para mover.
          </p>

          {checkOn && (
            <p className="text-red-500 font-semibold mt-1">
              Xeque nas{' '}
              {checkOn === 'white' ? 'brancas' : 'pretas'}!
            </p>
          )}
        </div>
      )}

      {pendingPromotion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-lg shadow-lg p-4 space-y-3">
            <p className="text-sm font-medium text-foreground">
              Escolha a peça para promoção:
            </p>
            <div className="flex gap-2">
              {promotionPieces.map((p) => (
                <Button
                  key={p}
                  size="icon"
                  variant="outline"
                  onClick={() => handlePromotionChoice(p)}
                >
                  <span className="text-2xl">
                    {
                      PIECE_SYMBOLS[pendingPromotion.movingColor][
                        p
                      ]
                    }
                  </span>
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
