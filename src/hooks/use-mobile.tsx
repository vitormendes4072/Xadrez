import * as React from "react"; // Importa todas as funcionalidades do React

const MOBILE_BREAKPOINT = 768; // Define o tamanho máximo (em px) para considerar como "mobile"

export function useIsMobile() {
  // Cria um estado para armazenar se o dispositivo é mobile ou não
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  // useEffect roda quando o componente é montado
  React.useEffect(() => {
    // Cria uma media query para detectar quando a tela está abaixo do breakpoint
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);

    // Função que será chamada sempre que o tamanho da tela mudar
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT); // Atualiza o estado com true/false
    };

    // Adiciona o listener para monitorar mudanças no tamanho da tela
    mql.addEventListener("change", onChange);

    // Define o valor inicial de isMobile ao carregar o componente
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);

    // Remove o listener ao desmontar o componente (boa prática para evitar vazamentos)
    return () => mql.removeEventListener("change", onChange);
  }, []); // Array vazio = executa apenas uma vez ao montar o componente

  // Retorna sempre um booleano (false se for undefined)
  return !!isMobile;
}
