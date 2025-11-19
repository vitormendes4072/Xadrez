import { ChessPiece } from '@/types/chess';
import { cn } from '@/lib/utils';

interface ChessSquareProps {
  piece: ChessPiece | null;
  isLight: boolean;
  isSelected: boolean;
  isHighlighted: boolean;
  onClick: () => void;
}

const getPieceImageSrc = (piece: ChessPiece): string => {
  return `/chess/classic/${piece.color}_${piece.type}.svg`;
};

export const ChessSquare = ({
  piece,
  isLight,
  isSelected,
  isHighlighted,
  onClick,
}: ChessSquareProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 flex items-center justify-center',
        isLight ? 'bg-[#f0d9b5]' : 'bg-[#b58863]',
        isSelected && 'ring-2 ring-yellow-400',
        isHighlighted && 'bg-[#f6f669]',
        'focus:outline-none'
      )}
    >
      {piece && (
        <img
          src={getPieceImageSrc(piece)}
          alt={`${piece.color} ${piece.type}`}
          className="w-3/4 h-3/4 object-contain pointer-events-none"
          draggable={false}
        />
      )}
    </button>
  );
};
