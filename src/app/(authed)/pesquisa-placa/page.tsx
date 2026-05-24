import { radarsService } from "../../services";
import ConsultaPlacaClient from "./ConsultaPlacaClient";

// No App Router, páginas recebem searchParams automaticamente como props
export default async function ConsultaPlacaPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  // 1. Aguarda a resolução dos parâmetros
  const resolvedParams = await searchParams;

  // 2. Acessa os valores com segurança
  const placa =
    typeof resolvedParams.placa === "string" ? resolvedParams.placa : "";
  const page =
    typeof resolvedParams.page === "string" ? Number(resolvedParams.page) : 0;
  const pageSize =
    typeof resolvedParams.pageSize === "string"
      ? Number(resolvedParams.pageSize)
      : 10;

  let initialData = null;

  // Renderização do Lado do Servidor (SSR):
  // Se houver uma placa na URL, o servidor busca os dados antes de entregar a tela ao usuário.
  if (placa) {
    try {
      initialData = await radarsService.searchByPlaca(placa, page, pageSize);
    } catch (error) {
      console.error("Erro ao buscar placa no servidor:", error);
      // Se falhar no servidor, você pode passar null e tratar o erro no cliente,
      // ou renderizar uma página de erro (error.tsx)
    }
  }

  return (
    <ConsultaPlacaClient
      initialData={initialData}
      searchParams={{
        placa,
        page: page.toString(),
        pageSize: pageSize.toString(),
      }}
    />
  );
}
