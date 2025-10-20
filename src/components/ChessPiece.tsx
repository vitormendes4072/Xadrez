import { ChessPiece as ChessPieceType, PIECE_SYMBOLS } from '@/types/chess';
import { cn } from '@/lib/utils';

interface ChessPieceProps {
  piece: ChessPieceType;
  isDragging?: boolean;
  onClick?: () => void;
}

export const ChessPiece = ({ piece, isDragging, onClick }: ChessPieceProps) => {
  return (
    <div
      className={cn(
        "w-full h-full flex items-center justify-center cursor-pointer select-none transition-all duration-200",
        "text-4xl font-bold drop-shadow-lg",
        piece.color === 'white' ? "text-chess-piece-light" : "text-chess-piece-dark",
        isDragging && "scale-110 z-50",
        "hover:scale-105 active:scale-95"
      )}
      onClick={onClick}
      style={{ textShadow: "2px 2px 4px rgba(0,0,0,0.5)" }}
    >
      {PIECE_SYMBOLS[piece.color][piece.type]}
    </div>
  );
};