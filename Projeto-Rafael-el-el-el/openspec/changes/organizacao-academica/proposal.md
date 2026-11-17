# Proposal

## Why

A change `edtech-adaptativa-fase-inicial` entregou um protótipo em que curso reúne conteúdo, matrícula e trilha adaptativa, e “turma” representa apenas os alunos daquele curso, sem disciplina nem período letivo. Para validar o uso em uma faculdade antes de evoluir o produto, precisamos representar cursos de graduação, disciplinas e suas ofertas em turmas, situando a aprendizagem adaptativa nos tópicos das disciplinas.

## What Changes

- **BREAKING**: redefinir Curso como graduação, por exemplo Sistemas de Informação, Agronomia, Psicologia ou Direito; cada curso possui disciplinas, e cada disciplina pode ter várias turmas, identificadas por período letivo. Exemplo: Sistemas de Informação → Algoritmos → turma A de 2026.2 → estudo do tópico Estruturas de repetição.
- Introduzir a organização e a manutenção básica de cursos, disciplinas, períodos letivos e turmas no protótipo, incluindo vínculos de professores e alunos às turmas e de coordenadores aos cursos.
- Permitir ao Coordenador editar dados dos cursos vinculados, criar e editar suas disciplinas e turmas, realizar matrículas e gerenciar vínculos docentes nesse escopo. Criação de graduações, períodos letivos, usuários, funções e atribuição de coordenadores permanecem sob administração global.
- **BREAKING**: substituir matrícula direta na unidade de conteúdo chamada curso por vínculo do aluno à turma de uma disciplina; o acesso às atividades decorre desse vínculo. Professores passam a atuar nas turmas vinculadas, e a coordenação tem acesso restrito aos cursos sob sua responsabilidade.
- **BREAKING**: transferir tópicos, materiais, questões e publicação de conteúdo para a disciplina. O professor mantém conteúdo das disciplinas em que leciona, conforme seus vínculos com turmas; a graduação deixa de ser criada e publicada como trilha pelo professor.
- Após a primeira resposta em qualquer turma da disciplina, bloquear adição, remoção e reordenação de tópicos e proteger questões respondidas contra exclusão ou mudanças de interpretação e avaliação. Permitir ajustes seguros em materiais, preservando históricos e todos os resultados já obtidos, inclusive conclusão e datas de conquistas.
- Validar toda alteração de conteúdo publicado: a disciplina deve continuar com tópicos e ao menos uma questão de cada dificuldade por tópico. Uma edição inválida deve ser rejeitada integralmente, preservando conteúdo anterior, publicação e dados dos alunos.
- **BREAKING**: contextualizar domínio por tópico, histórico, desbloqueios e conclusão da trilha na disciplina e na turma do aluno. Concluir uma trilha de estudo não significa concluir a graduação ou obter aprovação acadêmica na disciplina.
- Adequar catálogo, navegação, áreas por perfil e painéis básicos à hierarquia acadêmica; reposicionar XP, sequência de dias e conquistas no contexto de estudo da disciplina/turma.
- Na coordenação, exibir médias somente por turma, incluindo os matriculados que não iniciaram com valor zero. Calcular sobre valores sem arredondamento intermediário, arredondar apenas a exibição para o inteiro mais próximo e apresentar “Sem dados” para turma sem alunos; não oferecer média global entre turmas, disciplinas ou graduações.
- Preparar dados fictícios que demonstrem mais de uma disciplina por graduação e ofertas em turmas e períodos distintos, permitindo revisar a separação de vínculos, acessos e progresso.

**Fora desta primeira entrega:** diagnóstico inicial ou provas de nivelamento; monitoria, seleção de monitores e encaminhamentos; integrações institucionais com sistemas acadêmicos, AVA ou identidade institucional; indicadores avançados, como previsão de evasão, análises preditivas e comparações históricas institucionais. Permanecem apenas os indicadores básicos já demonstrados, como progresso, domínio por tópico e taxa de acertos, adaptados ao contexto acadêmico. Autenticação real, back-end, banco de dados, dados reais, pagamentos e aulas ao vivo continuam fora do escopo.

## Capabilities

### New Capabilities

O inventário `openspec/specs/` está vazio: as seis capacidades anteriores existem somente em `openspec/changes/edtech-adaptativa-fase-inicial/specs/`, e a change ainda não foi arquivada. Por isso, a classificação abaixo considera a base consolidada do OpenSpec; as seis capacidades herdadas representam mudanças de comportamento já documentado e implementado, preservando seus identificadores para evitar duplicação.

- `organizacao-academica`: estrutura de graduações, disciplinas, períodos letivos e turmas, com manutenção básica e vínculos aluno–turma, professor–turma e coordenador–curso.
- `perfis-acesso`: evolução da capacidade anterior para incluir Coordenador, funções cumulativas e gestão acadêmica restrita aos cursos coordenados, além do acesso por turma vinculada, mantendo entrada simulada e administração de usuários.
- `catalogo-cursos`: evolução do catálogo para apresentar graduações e suas disciplinas/ofertas, com acesso do aluno às turmas vinculadas, substituindo a matrícula direta em cursos de conteúdo.
- `gestao-conteudo-curso`: autoria por disciplina, validação contínua da publicação e bloqueios após início do estudo que preservam respostas e resultados; o identificador anterior é preservado apesar da mudança de significado.
- `aprendizado-adaptativo`: evolução da trilha por aluno–curso para aprendizagem nos tópicos da disciplina, contextualizada na turma, sem interferência entre disciplinas ou ofertas distintas.
- `gamificacao`: evolução de XP, sequência e conquistas por curso para o contexto da disciplina/turma, mantendo as regras básicas de engajamento.
- `acompanhamento-desempenho`: painéis básicos por função e vínculo, com médias da coordenação restritas a cada turma, inclusão de quem não iniciou e arredondamento apenas na exibição.

### Modified Capabilities

Nenhuma capacidade consolidada em `openspec/specs/`, cujo inventário continua vazio nesta revisão. As sete specs permanecem com `Purpose` e `ADDED Requirements`; não há requisitos de base para `MODIFIED`, `REMOVED` ou `RENAMED`. Essa classificação não autoriza consolidar as duas changes como adições independentes: a dependência e o procedimento de reconciliação estão registrados abaixo.

## Impact

- A base existente é um protótipo React/TypeScript/Vite em `prototipo/`, com repositório sobre `localStorage`. A evolução afetará os tipos e vínculos de domínio, dados de demonstração, repositório, rotas e permissões, catálogo, editor de conteúdo, motor adaptativo, gamificação, painéis e testes que hoje dependem de `cursoId`.
- A documentação em `docs/` precisará refletir os novos conceitos, atores, jornadas e rastreabilidade. A change anterior permanece como registro da primeira entrega; sua conclusão não implica compatibilidade com o novo modelo.
- Os dados locais atuais têm estrutura incompatível. Propõe-se restaurar uma nova base fictícia versionada, sem migrar históricos de demonstração; isso deve ser informado na experiência de atualização do protótipo.
- Não se prevê API pública, serviço externo ou nova dependência obrigatória para esta entrega. A change permanece em especificação, sem implementação de código; design e tasks serão tratados em etapa posterior.

### Premissas

- O produto continua sendo um protótipo navegável para uma faculdade fictícia, com entrada simulada, dados locais e restauração da demonstração.
- Inicialmente, cada disciplina pertence a um curso; cada turma pertence a uma disciplina e a um período letivo. Alunos e professores podem ter vínculos com várias turmas, e coordenadores com vários cursos.
- O conteúdo pertence à disciplina e é compartilhado entre suas turmas; progresso e gamificação ficam separados por aluno e turma, sem reaproveitamento automático entre períodos. As regras adaptativas básicas são mantidas, sem diagnóstico inicial.
- As funções são cumulativas por pessoa, incluindo Professor e Coordenador na mesma conta. O Coordenador gerencia os cursos vinculados, suas disciplinas, turmas, matrículas e vínculos docentes; o Administrador mantém o escopo global. O perfil Responsável permanece com acompanhamento básico dos alunos vinculados, contextualizado nas disciplinas/turmas.

### Decisões confirmadas na revisão

- Disciplinas têm cadastros próprios em cada graduação; seu conteúdo é compartilhado entre turmas da mesma disciplina, sem versões por oferta nesta entrega.
- A coordenação também gerencia os cursos e vínculos dentro de seu escopo. A atribuição de coordenadores a cursos permanece com o Administrador; o vínculo de coordenação, por si só, não autoriza editar ou publicar conteúdo pedagógico.
- O Responsável permanece e funções cumulativas são permitidas, preservando as permissões e os vínculos de cada função.
- Progresso e gamificação começam do zero em cada nova turma, inclusive em outro período, sem reaproveitamento automático.
- Matrículas são feitas pelo Administrador ou pelo Coordenador autorizado para o curso da turma; não há automatrícula nem solicitação de ingresso do aluno nesta entrega.
- Conteúdo compartilhado fica sujeito ao bloqueio estrutural após a primeira resposta em qualquer oferta, inclusive quando a edição parte de outra turma ou de um Administrador. Ajustes permitidos não reiniciam nem recalculam resultados anteriores.
- Correções em enunciado, texto das alternativas e explicação de questões respondidas exigem exibição da diferença e confirmação humana do próprio autor autorizado, sem segunda pessoa. A confirmação vale apenas para a alteração exata e a revisão original; novas alterações exigem nova confirmação. Significado, correspondência e ordem das alternativas são preservados; identidade, tópico, dificuldade, gabarito e exclusão continuam bloqueados. Respostas antigas exibem o conteúdo original sem alteração dos resultados ou datas.
- Progresso médio e domínio médio por tópico são calculados por turma, incluindo todos os seus matriculados; não haverá média global da coordenação nesta entrega.

### Dependência de consolidação

A change `edtech-adaptativa-fase-inicial` continua fora da base consolidada, embora tenha implementação e tarefas concluídas. Seu modelo de curso de conteúdo, matrícula direta e perfil único é incompatível com esta evolução. A validação estrutural desta change não resolve essa dependência nem autoriza arquivamento automático.

Antes de consolidar `organizacao-academica`, a entrega inicial deve ser revisada e consolidada em ação separada, explicitamente autorizada. Após isso, será necessário:

1. Reler o inventário e cada spec efetivamente consolidada, com todos os seus cenários, e comparar cada requisito com os desta change.
2. Converter as seis capacidades herdadas em deltas sobre os caminhos reais da base. Usar `MODIFIED` com o nome exato e o bloco completo atualizado quando houver mudança; deixar requisitos inalterados na base; usar `ADDED` apenas para comportamento novo. Usar `RENAMED` somente para troca de nome sem mudança de comportamento, e `REMOVED` com `Reason` e `Migration` para comportamentos substituídos.
3. Eliminar explicitamente as regras incompatíveis: atualizar ou remover `Perfis de usuário suportados`, que exige perfil único, e remover/substituir `Matrícula em curso`, cuja migração é a matrícula administrativa em turma. Reconciliar também catálogo, autoria, trilha, XP e painéis por curso com os escopos disciplina/turma; acrescentar requisitos com novos nomes não remove os antigos automaticamente.
4. Preservar entrada simulada, administração de usuários, restrições por vínculo, materiais e questões, regras adaptativas e gamificação básicas que continuam válidas. Conferir a base resultante para não manter regras antigas e novas contraditórias, atualizar este proposal e executar novamente a validação estrita antes de solicitar a consolidação desta change.

Este procedimento está pendente; nenhuma base, change anterior ou arquivo de arquivamento é alterado nesta revisão.
