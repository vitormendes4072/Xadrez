import { CSSProperties, useEffect, useState } from 'react';
import { ChessPiece, Position } from '@/types/chess';

const getPieceImageSrc = (piece: ChessPiece): string => {
  return `/chess/classic/${piece.color}_${piece.type}.svg`;
};

interface AnimatedPieceProps {
  from: Position;
  to: Position;
  piece: ChessPiece;
  durationMs?: number; // default 300ms
}

export const AnimatedPiece = ({
  from,
  to,
  piece,
  durationMs = 300,
}: AnimatedPieceProps) => {
  const [animate, setAnimate] = useState(false);

  const squareSize = 100 / 8; // % do tabuleiro
  const fromTop = from.row * squareSize;
  const fromLeft = from.col * squareSize;
  const toTop = to.row * squareSize;
  const toLeft = to.col * squareSize;

  useEffect(() => {
    // dispara a animação no próximo tick
    const id = requestAnimationFrame(() => setAnimate(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const style: CSSProperties = {
    position: 'absolute',
    width: `${squareSize}%`,
    height: `${squareSize}%`,
    top: `${fromTop}%`,
    left: `${fromLeft}%`,
    transform: animate
      ? `translate(${toLeft - fromLeft}%, ${toTop - fromTop}%)`
      : 'translate(0, 0)',
    transition: `transform ${durationMs}ms linear`,
    pointerEvents: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  return (
    <div style={style}>
      <img
        src={getPieceImageSrc(piece)}
        alt={`${piece.color} ${piece.type}`}
        className="w-3/4 h-3/4 object-contain pointer-events-none"
        draggable={false}
      />
    </div>
  );
};
