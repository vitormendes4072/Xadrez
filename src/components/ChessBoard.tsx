import { useState, useCallback, useEffect } from 'react';
import { BoardState, Position } from '@/types/chess';
import { createInitialBoard, isValidMove } from '@/utils/chess';
import { getAIMove, Difficulty } from '@/utils/chessAI';
import { ChessSquare } from './ChessSquare';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

export const ChessBoard = () => {
  const [board, setBoard] = useState<BoardState>(createInitialBoard);
  const [selectedSquare, setSelectedSquare] = useState<Position | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<'white' | 'black'>('white');
  const [possibleMoves, setPossibleMoves] = useState<Position[]>([]);
  const [gameActive, setGameActive] = useState<boolean>(false);
  const [gameMode, setGameMode] = useState<'pvp' | 'ai'>('pvp');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [isAIThinking, setIsAIThinking] = useState<boolean>(false);

  const startGame = useCallback(() => {
    setBoard(createInitialBoard());
    setSelectedSquare(null);
    setCurrentPlayer('white');
    setPossibleMoves([]);
    setGameActive(true);
    setIsAIThinking(false);
  }, []);

  const resignGame = useCallback(() => {
    setGameActive(false);
    setSelectedSquare(null);
    setPossibleMoves([]);
    setIsAIThinking(false);
  }, []);

  // AI Move Effect
  useEffect(() => {
    if (gameActive && gameMode === 'ai' && currentPlayer === 'black' && !isAIThinking) {
      setIsAIThinking(true);
      
      // Add delay to make AI move feel natural
      const timer = setTimeout(() => {
        const aiMove = getAIMove(board, difficulty);
        
        if (aiMove) {
          const fromRow = Math.floor(aiMove.row / 8);
          const fromCol = aiMove.row % 8;
          const toRow = Math.floor(aiMove.col / 8);
          const toCol = aiMove.col % 8;
          
          const newBoard = board.map(row => [...row]);
          const movingPiece = newBoard[fromRow][fromCol];
          
          if (movingPiece) {
            newBoard[toRow][toCol] = movingPiece;
            newBoard[fromRow][fromCol] = null;
            
            setBoard(newBoard);
            setCurrentPlayer('white');
          }
        }
        
        setIsAIThinking(false);
      }, 1000); // 1 second delay for AI move
      
      return () => clearTimeout(timer);
    }
  }, [gameActive, gameMode, currentPlayer, board, difficulty]); // Important: exclude isAIThinking to avoid clearing the timer immediately

  const calculatePossibleMoves = useCallback((row: number, col: number): Position[] => {
    const moves: Position[] = [];
    
    for (let toRow = 0; toRow < 8; toRow++) {
      for (let toCol = 0; toCol < 8; toCol++) {
        if (isValidMove(board, row, col, toRow, toCol)) {
          moves.push({ row: toRow, col: toCol });
        }
      }
    }
    
    return moves;
  }, [board]);

  const handleSquareClick = useCallback((row: number, col: number) => {
    if (!gameActive || isAIThinking) return; // Don't allow moves when game is not active or AI is thinking
    if (gameMode === 'ai' && currentPlayer === 'black') return; // Don't allow moves when it's AI turn
    
    const piece = board[row][col];
    
    if (selectedSquare) {
      // If clicking on the same square, deselect
      if (selectedSquare.row === row && selectedSquare.col === col) {
        setSelectedSquare(null);
        setPossibleMoves([]);
        return;
      }
      
      // Try to make a move
      if (isValidMove(board, selectedSquare.row, selectedSquare.col, row, col)) {
        const newBoard = board.map(row => [...row]);
        const movingPiece = newBoard[selectedSquare.row][selectedSquare.col];
        
        if (movingPiece && movingPiece.color === currentPlayer) {
          newBoard[row][col] = movingPiece;
          newBoard[selectedSquare.row][selectedSquare.col] = null;
          
          setBoard(newBoard);
          setCurrentPlayer(currentPlayer === 'white' ? 'black' : 'white');
        }
      }
      
      setSelectedSquare(null);
      setPossibleMoves([]);
    } else if (piece && piece.color === currentPlayer) {
      // Select a piece
      setSelectedSquare({ row, col });
      setPossibleMoves(calculatePossibleMoves(row, col));
    }
  }, [board, selectedSquare, currentPlayer, calculatePossibleMoves, gameActive, gameMode, isAIThinking]);

  const isSquareHighlighted = useCallback((row: number, col: number): boolean => {
    return possibleMoves.some(move => move.row === row && move.col === col);
  }, [possibleMoves]);

  const isSquareSelected = useCallback((row: number, col: number): boolean => {
    return selectedSquare?.row === row && selectedSquare?.col === col;
  }, [selectedSquare]);

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-center">
        {!gameActive ? (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">
              Xadrez dos Amigos
            </h2>
            
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Modo de Jogo
                </label>
                <Select value={gameMode} onValueChange={(value: 'pvp' | 'ai') => setGameMode(value)}>
                  <SelectTrigger className="w-64">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pvp">Humano vs Humano</SelectItem>
                    <SelectItem value="ai">Humano vs IA</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {gameMode === 'ai' && (
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Dificuldade da IA
                  </label>
                  <Select value={difficulty} onValueChange={(value: Difficulty) => setDifficulty(value)}>
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
            </div>
            
            <Button 
              onClick={startGame}
              size="lg"
              className="bg-primary hover:bg-primary/90 mt-4"
            >
              Iniciar Partida
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              {gameMode === 'ai' && isAIThinking ? 
                'IA está pensando...' : 
                `Turno: ${currentPlayer === 'white' ? 'Brancas' : 
                  gameMode === 'ai' ? 'Você' : 'Pretas'}`
              }
            </h2>
            {gameMode === 'ai' && (
              <p className="text-sm text-muted-foreground">
                Dificuldade: {difficulty === 'easy' ? 'Fácil' : difficulty === 'medium' ? 'Médio' : 'Difícil'}
              </p>
            )}
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
          "grid grid-cols-8 gap-0 border-4 border-accent rounded-lg overflow-hidden",
          "shadow-[var(--shadow-board)]",
          !gameActive && "opacity-70"
        )}
        style={{ 
          background: "var(--gradient-board)",
        }}
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
                onClick={() => handleSquareClick(rowIndex, colIndex)}
              />
            );
          })
        )}
      </div>
      
      {gameActive && (
        <div className="text-center text-sm text-muted-foreground max-w-md">
          <p>Clique em uma peça para selecioná-la, depois clique no destino para mover.</p>
        </div>
      )}
    </div>
  );
};