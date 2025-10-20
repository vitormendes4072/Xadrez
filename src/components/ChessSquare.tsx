import { ChessPiece as ChessPieceType } from '@/types/chess';
import { ChessPiece } from './ChessPiece';
import { cn } from '@/lib/utils';

interface ChessSquareProps {
  piece: ChessPieceType | null;
  isLight: boolean;
  isSelected: boolean;
  isHighlighted: boolean;
  onClick: () => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
}

export const ChessSquare = ({
  piece,
  isLight,
  isSelected,
  isHighlighted,
  onClick,
  onDragStart,
  onDragOver,
  onDrop
}: ChessSquareProps) => {
  return (
    <div
      className={cn(
        "w-16 h-16 relative flex items-center justify-center transition-all duration-200",
        "border-2",
        isLight ? "bg-chess-board-light" : "bg-chess-board-dark",
        isSelected && "border-chess-board-selected shadow-lg ring-2 ring-chess-board-selected ring-opacity-50",
        isHighlighted && "bg-chess-board-highlight",
        !isSelected && !isHighlighted && "border-transparent",
        "hover:brightness-110"
      )}
      onClick={onClick}
      onDragOver={onDragOver}
      onDrop={onDrop}
      draggable={!!piece}
      onDragStart={onDragStart}
    >
      {piece && <ChessPiece piece={piece} />}
      {isHighlighted && !piece && (
        <div className="w-4 h-4 rounded-full bg-chess-board-highlight opacity-60" />
      )}
    </div>
  );
};