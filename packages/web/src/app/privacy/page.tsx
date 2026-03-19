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
            O braza.commerce coleta dados limitados durante o uso da plataforma
            de criacao de landing pages, em conformidade com a Lei Geral de
            Protecao de Dados (LGPD — Lei 13.709/2018).
          </p>

          <h2 className="text-[15px] font-semibold text-white">Dados coletados</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Imagens de produto enviadas pelo usuario (upload)</li>
            <li>Conteudo textual gerado por inteligencia artificial</li>
            <li>Dados de navegacao (IP, User Agent)</li>
            <li>Informacoes de produto (preco, descricao, URL de checkout)</li>
          </ul>

          <h2 className="text-[15px] font-semibold text-white">Finalidade</h2>
          <p>
            Os dados sao utilizados exclusivamente para a geracao de landing
            pages de produto com inteligencia artificial, permitindo ao usuario
            criar paginas de venda profissionais a partir de fotos de produto.
          </p>

          <h2 className="text-[15px] font-semibold text-white">
            Servicos de IA
          </h2>
          <p>
            As imagens enviadas sao processadas por servicos de inteligencia
            artificial (Anthropic Claude e Google Gemini) para gerar conteudo
            textual e imagens profissionais. Esses servicos recebem apenas as
            imagens necessarias para a geracao e nao armazenam dados pessoais.
          </p>

          <h2 className="text-[15px] font-semibold text-white">Retencao</h2>
          <p>
            Imagens e conteudo gerado sao retidos enquanto a pagina estiver
            ativa na plataforma. Ao deletar uma pagina, todos os dados
            associados (imagens, textos, configuracoes) sao removidos
            permanentemente.
          </p>

          <h2 className="text-[15px] font-semibold text-white">Seus direitos</h2>
          <p>
            Voce tem direito a solicitar acesso, correcao ou exclusao dos seus
            dados pessoais a qualquer momento, conforme previsto na LGPD.
            Entre em contato pelo email: contato@brazacommerce.com
          </p>
        </div>

        <p className="text-[10px] text-zinc-700">
          Ultima atualizacao: Marco 2026
        </p>
      </div>
      </div>
    </div>
  );
}
