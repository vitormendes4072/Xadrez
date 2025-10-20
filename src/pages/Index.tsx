import { ChessBoard } from '@/components/ChessBoard';
const Index = () => {
  return <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2">Xadrez dos Amigos</h1>
        <p className="text-lg text-muted-foreground">Jogue xadrez online</p>
      </div>
      
      <ChessBoard />
      
      <div className="mt-8 text-center">
        <p className="text-sm text-muted-foreground">
          Desenvolvido com React • Tailwind CSS
        </p>
      </div>
    </div>;
};
export default Index;