# Evolução da plataforma — Apex Bleu

## O que já existe
- Login, gestão de utilizadores e separadores por permissão.
- My Garage: criação/edição de carros, atribuição de dono e trabalhos associados.
- Trabalhos com centralina, resultados, notas e estados.
- Ficheiros originais/modificados com notas por versão e logs associados, em armazenamento privado.
- Lista de modelos/motores/centralinas e formulários reutilizáveis.

## Correção prioritária
Atualmente, um cliente pode consultar o registo completo dos seus trabalhos através de chamadas diretas, incluindo notas técnicas. Também consegue consultar listas de utilizadores. A primeira etapa fecha esses acessos, não apenas os botões.

## Alterações incrementais
1. **Admin e Cliente:** retirar Contributor das opções ativas; manter contas e dados. As contas Contributor passam a Cliente por segurança, sem promoção automática a Admin. Para o teu amigo continuar a trabalhar nos mapas, atribuis-lhe Admin em Users antes da mudança. Clientes continuam a criar/editar os seus carros; só Admin pode apagar.
2. **Separação real:** reservar trabalhos técnicos, mapas, logs, observações internas e listas administrativas ao Admin. Clientes recebem apenas informação explicitamente publicada sobre os seus carros.
3. **Fotografias:** acrescentar ao formulário atual, com substituição/remoção e imagem de substituição. Processar no navegador: original até 2 MB, máximo 640 × 480, WebP a 68%, sem EXIF e sem guardar o original. Guardar num espaço privado próprio e validar permissões, formato e tamanho no armazenamento.
4. **Progresso e comunicação:** manter os estados técnicos atuais e acrescentar os estados internos necessários; disponibilizar estado público independente, etapas reais, mensagens/pedidos, histórico privado e relatório final publicado pelo Admin. Não inferir nem inventar progresso de trabalhos antigos.
5. **Gestão técnica:** reutilizar os ficheiros como base das versões existentes; acrescentar configuração mecânica, objetivo, registos de testes/resultados e versão validada. Acrescentar formato e SHA-256 aos uploads novos; calcular nos ficheiros antigos apenas quando for possível verificar o conteúdo. Preservar originais e impedir substituições ou eliminações acidentais.
6. **Apex Bleu:** ajustar os estilos e páginas existentes para grafite/azul escuro, azul elétrico e apontamentos laranja; tipografia legível e menos caixas. Simplificar My Garage para clientes. A interface permanece em inglês.

## Detalhes técnicos
- Preservar a arquitetura atual, autenticação, tabelas e dados; usar apenas alterações aditivas.
- Reutilizar `cars`, `jobs`, `job_files` e `file_logs`. Manter o catálogo de veículos separado dos carros dos clientes.
- Guardar o resumo público de cada trabalho separadamente dos dados técnicos; validar propriedade pelo carro associado. Aplicar RLS e GRANTs mínimos, incluindo bloqueio das leituras técnicas por clientes.
- Manter os valores antigos de permissões na base de dados apenas por compatibilidade histórica, sem lhes conceder privilégios técnicos após a transição.
- Restringir consultas de utilizadores/permissões; os formulários de clientes continuam funcionais sem acesso a listas administrativas.
- Manter ficheiros técnicos privados; objetos novos com nomes únicos e relações verificadas entre trabalho, versão e log.
- Separar notas do cliente sobre o seu carro das observações técnicas privadas do Admin.
- Não criar dados fictícios, substituir a base de dados ou instalar dependências sem necessidade demonstrada.

## Verificação
- Testar Admin e Cliente com sessões reais quando disponíveis.
- Criar/editar carro, processar/substituir/remover foto, publicar progresso e ler o resultado na área do cliente.
- Confirmar que URLs e chamadas diretas não revelam trabalhos alheios, notas privadas, utilizadores, ficheiros ou logs.
- Executar os testes existentes e acrescentar testes das novas regras concretas, incluindo permissões e limites de fotografia.
- Verificar telemóvel/computador e títulos próprios em todas as páginas.

## Ordem de entrega
Segurança e acesso → fotografias → progresso/relatórios → versões e integridade → identidade visual e verificação final. Cada etapa preserva os dados e reutiliza o que já funciona.