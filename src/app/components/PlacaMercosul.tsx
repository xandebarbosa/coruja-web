// Definimos a interface para as propriedades que nosso componente receberá
interface PlacaProps {
  placa: string;
}

export default function PlacaMercosul({ placa }: PlacaProps) {
  if (!placa) {
    return null; // Não renderiza nada se a placa for nula ou vazia
  }

  return (
    // Container principal da placa com borda arredondada, sombra e fundo branco.
    // O 'overflow-hidden' é importante para que a barra azul não "vaze" pelos cantos arredondados.
    <div className="w-40 max-w-40 border-2 border-gray-800 rounded-lg shadow-lg bg-white overflow-hidden my-2">
      
      {/* Barra superior azul, padrão Mercosul */}
      <div className="bg-blue-700 text-white text-center py-0.5 px-4">
        <p className="font-bold text-xs tracking-wider">BRASIL</p>
      </div>

      {/* Área principal com o número da placa */}
      <div className="p-2 flex items-center justify-center">
        <p className="text-black font-mono text-base font-bold tracking-widest">
          {placa}
        </p>
      </div>
    </div>
  );
}