export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#09090b] p-6 text-[#fafafa]">
      <div className="max-w-5xl mx-auto">
      <div className="mx-auto max-w-2xl space-y-6">
        <h1 className="text-xl font-bold tracking-tight text-white">
          Politica de Privacidade
        </h1>

        <div className="space-y-4 text-[13px] text-zinc-400 leading-relaxed">
          <p>
            O BrazaChat coleta dados limitados durante o uso dos links de
            rastreamento de campanhas publicitarias, em conformidade com a Lei
            Geral de Protecao de Dados (LGPD — Lei 13.709/2018).
          </p>

          <h2 className="text-[15px] font-semibold text-white">Dados coletados</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Identificador de clique do Facebook (fbclid)</li>
            <li>Endereco IP</li>
            <li>User Agent do navegador</li>
            <li>Parametros UTM da campanha</li>
            <li>Timestamp do clique</li>
          </ul>

          <h2 className="text-[15px] font-semibold text-white">Finalidade</h2>
          <p>
            Os dados sao utilizados exclusivamente para rastreamento de
            conversoes publicitarias e otimizacao de campanhas na plataforma
            Meta (Facebook/Instagram), conforme requisitos da Meta Conversion
            API.
          </p>

          <h2 className="text-[15px] font-semibold text-white">
            Compartilhamento
          </h2>
          <p>
            Dados pessoais (telefone, email) sao normalizados e criptografados
            com SHA-256 antes de qualquer envio para a Meta Conversion API.
            Nenhum dado pessoal e compartilhado em texto aberto com terceiros.
          </p>

          <h2 className="text-[15px] font-semibold text-white">Retencao</h2>
          <p>
            Dados de cliques e mensagens sao retidos por 12 meses. Dados de
            analytics por 24 meses. Apos esse periodo, sao removidos
            automaticamente.
          </p>

          <h2 className="text-[15px] font-semibold text-white">Seus direitos</h2>
          <p>
            Voce tem direito a solicitar acesso, correcao ou exclusao dos seus
            dados pessoais a qualquer momento, conforme previsto na LGPD.
            Entre em contato pelo email: privacidade@brazachat.com
          </p>
        </div>

        <p className="text-[10px] text-zinc-700">
          Ultima atualizacao: Março 2026
        </p>
      </div>
      </div>
    </div>
  );
}
