import { NOME_DIFICULDADE, type Dificuldade } from '../dominio/tipos';

export function BarraProgresso({ valor, rotulo }: { valor: number; rotulo: string }) {
  return (
    <div className="barra" role="progressbar" aria-valuenow={valor} aria-valuemin={0} aria-valuemax={100} aria-label={rotulo}>
      <div className="barra-preenchida" style={{ width: `${valor}%` }} />
      <span className="barra-texto">{valor}%</span>
    </div>
  );
}

export function EtiquetaDificuldade({ dificuldade }: { dificuldade: Dificuldade }) {
  return <span className={`etiqueta dif-${dificuldade}`}>{NOME_DIFICULDADE[dificuldade]}</span>;
}

export function Vazio({ children }: { children: React.ReactNode }) {
  return <p className="vazio">{children}</p>;
}
