# Requisitos — EdTech de Aprendizado Adaptativo por Curso

Fonte: specs da change `edtech-adaptativa-fase-inicial` (`openspec/changes/edtech-adaptativa-fase-inicial/specs/`).
Cada requisito funcional (RF) indica a **capability** de origem e o **requirement** da spec correspondente.

## Modelo acadêmico — organização acadêmica

Fonte do novo contrato: [spec de organização acadêmica](../openspec/changes/organizacao-academica/specs/organizacao-academica/spec.md), [funções cumulativas](../openspec/changes/organizacao-academica/specs/perfis-acesso/spec.md) e [design D1](../openspec/changes/organizacao-academica/design.md).

O grupo 1 introduz tipos e validações estruturais puras. O repositório, a autorização e as telas atuais ainda usam os contratos legados explicitamente identificados; os comandos autorizados e a substituição informada dos dados pertencem aos grupos seguintes. Esta entrega não muda o seed de produção, suas versões nem as chaves de armazenamento.

| Conceito | Contrato e relação |
| --- | --- |
| Graduação | `Graduacao`: curso superior com ID estável e código único; sem tópicos ou publicação de conteúdo. |
| Disciplina | `Disciplina`: pertence a uma graduação; código único nela; conteúdo começa em rascunho e é compartilhado por suas turmas. |
| Período letivo | `PeriodoLetivo`: ID global e datas civis válidas em `AAAA-MM-DD`, com fim igual ou posterior ao início; não é nível pedagógico. |
| Turma | `Turma`: uma disciplina e um período; código único nessa combinação. Pode existir sem alunos e professores. |
| Matrícula | `Matricula`: ID próprio e par aluno–turma único; repetir o par identifica o registro original. Nova oferta tem outro contexto. |
| Docência | `VinculoProfessor`: par professor–turma, admitindo vários vínculos por pessoa e por turma. |
| Coordenação | `VinculoCoordenador`: par coordenador–graduação, independente do vínculo docente. |
| Responsável | `VinculoResponsavel`: par Responsável–Aluno preservado do domínio anterior. |
| Pessoa e funções | `Usuario`: uma identidade e `funcoes[]`, entre Aluno, Professor, Coordenador, Administrador e Responsável. Funções são explícitas e não duplicadas; pessoa ativa precisa de ao menos uma. Um vínculo não atribui função automaticamente. |
| Documento acadêmico | `DadosAcademicos`: versão de esquema, versão de seed, revisão, data virtual e coleções separadas por entidade e vínculo. Tipos de resposta e revisão textual estão declarados; seus comportamentos ainda serão implementados nos grupos 3 e 4. |

IDs são referências; nomes e códigos editáveis não são chaves de matrícula ou histórico. Os validadores de relacionamentos desta etapa verificam referências e identificam pares repetidos sem gravar, gerar IDs ou alterar listas. Função, atividade no momento da atribuição e autorização do autor serão verificadas pelos comandos do grupo 2; pessoas hoje inativas continuam referenciáveis nos históricos.

`UsuarioLegado`, `MatriculaLegada`, `VinculoProfessorLegado`, `Curso` e `Dados` preservam somente a compatibilidade da aplicação anterior. Novos modelos usam os contratos acadêmicos sem tornar `perfil`/`funcoes` ou `cursoId`/`turmaId` opcionais no mesmo objeto. As fixtures de `prototipo/src/testes/fixtures-academicas.ts` são isoladas e não importam nem substituem o seed atual.

Os RFs abaixo registram a entrega inicial e sua rastreabilidade histórica. Regras substituídas, como perfil único e automatrícula em curso de conteúdo, não são requisitos do novo modelo; os grupos posteriores atualizarão os fluxos e a matriz completa ao integrar as novas funções.

## Requisitos Funcionais da entrega inicial (referência histórica)

### Perfis e acesso — `perfis-acesso`

| ID | Requisito | Requirement de origem |
|----|-----------|-----------------------|
| RF01 | O sistema deve suportar os perfis Aluno, Professor, Administrador e Responsável, com um único perfil por usuário, e abrir a área inicial do perfil ao entrar. | Perfis de usuário suportados |
| RF02 | No protótipo, a entrada é feita escolhendo um usuário de demonstração, sem senha; deve ser possível sair e trocar de usuário. | Entrada simulada no protótipo |
| RF03 | O sistema deve exibir apenas áreas e ações permitidas ao perfil atual, redirecionando acessos indevidos para a área do perfil. | Acesso restrito por perfil |
| RF04 | O Administrador deve listar, criar, editar e desativar usuários; usuários desativados não podem entrar. | Administração de usuários |
| RF05 | O Administrador deve vincular Responsáveis a Alunos e Professores a Cursos; o Responsável vê apenas alunos vinculados. | Vínculos entre usuários |

### Catálogo de cursos — `catalogo-cursos`

| ID | Requisito | Requirement de origem |
|----|-----------|-----------------------|
| RF06 | O catálogo deve listar apenas cursos publicados, com título, descrição curta, área, nível e nº de tópicos. | Catálogo de cursos publicados |
| RF07 | O catálogo deve permitir busca por título e filtro por área e nível, com mensagem quando não houver resultados. | Busca e filtro no catálogo |
| RF08 | O detalhe do curso deve exibir descrição, professor e tópicos ordenados, com ação "Matricular" ou "Continuar". | Detalhe do curso |
| RF09 | O Aluno deve poder se matricular uma única vez por curso; a matrícula cria uma trilha adaptativa nova com o 1º tópico desbloqueado. | Matrícula em curso |
| RF10 | "Meus cursos" deve listar as matrículas do Aluno com progresso e acesso à trilha. | Meus cursos |

### Gestão de conteúdo — `gestao-conteudo-curso`

| ID | Requisito | Requirement de origem |
|----|-----------|-----------------------|
| RF11 | O Professor deve criar cursos (título, descrição, área, nível), que iniciam como "rascunho"; título é obrigatório. | Criação de curso |
| RF12 | O Professor deve adicionar, editar, remover e reordenar tópicos; a ordem define a sequência de desbloqueio. | Tópicos ordenados |
| RF13 | O Professor deve anexar materiais (texto, vídeo ou arquivo por link) a cada tópico. | Materiais por tópico |
| RF14 | O Professor deve cadastrar questões de múltipla escolha por tópico, com alternativa correta obrigatória, explicação e dificuldade (Fácil, Médio, Difícil). | Banco de questões classificado |
| RF15 | O curso só pode ser publicado se cada tópico tiver ao menos uma questão de cada nível; caso contrário, listar o que falta. | Publicação de curso |
| RF16 | O Professor edita apenas cursos vinculados a ele; o Administrador edita todos. | Escopo do professor |

### Aprendizado adaptativo — `aprendizado-adaptativo`

| ID | Requisito | Requirement de origem |
|----|-----------|-----------------------|
| RF17 | O estado adaptativo deve ser independente para cada par aluno + curso. | Trilha independente por curso |
| RF18 | Cada tópico tem domínio 0–100 (inicia em 0); acertos aumentam e erros diminuem, sem sair dos limites. | Nível de domínio por tópico |
| RF19 | A dificuldade da próxima questão segue a faixa de domínio: 0–39 Fácil, 40–69 Médio, 70–100 Difícil. | Dificuldade conforme domínio |
| RF20 | A próxima questão vem do tópico desbloqueado e não dominado de menor domínio, evitando repetir a última questão. | Escolha da próxima atividade |
| RF21 | Domínio ≥ 80 marca o tópico como dominado e desbloqueia o seguinte. | Desbloqueio de tópicos |
| RF22 | Após cada resposta, exibir acerto/erro, alternativa correta, explicação e variação do domínio. | Feedback imediato |
| RF23 | Após 2 erros seguidos no mesmo tópico, sugerir revisão dos materiais. | Revisão sugerida |
| RF24 | O progresso é a % de tópicos dominados; com todos dominados, o curso é concluído. | Conclusão do curso |

### Gamificação — `gamificacao`

| ID | Requisito | Requirement de origem |
|----|-----------|-----------------------|
| RF25 | Conceder XP por acerto (10/20/30 para Fácil/Médio/Difícil), contabilizado por curso. | XP por curso |
| RF26 | Contar a sequência de dias consecutivos com atividade no curso, zerando após um dia sem atividade. | Sequência de dias de estudo |
| RF27 | Conceder, uma vez por curso, as conquistas: primeira questão, primeiro tópico dominado, sequência de 7 dias e curso concluído. | Conquistas |
| RF28 | Exibir XP, sequência e conquistas na tela da trilha de cada curso. | Exibição de gamificação |

### Acompanhamento de desempenho — `acompanhamento-desempenho`

| ID | Requisito | Requirement de origem |
|----|-----------|-----------------------|
| RF29 | Painel do Aluno por curso: progresso, domínio por tópico, taxa de acertos e XP. | Painel do aluno |
| RF30 | Painel do Professor por curso: alunos com progresso e taxa de acertos, e domínio médio por tópico. | Painel do professor por curso |
| RF31 | Destacar alunos com menos de 50% de acertos nas últimas 10 respostas do curso. | Alunos com dificuldade |
| RF32 | O Professor pode abrir o detalhe de um aluno: domínio por tópico e respostas recentes no curso. | Detalhe de aluno para o professor |
| RF33 | Painel do Responsável: por aluno vinculado, cursos com progresso, sequência e última atividade. | Painel do responsável |
| RF34 | Visão geral do Administrador: usuários por perfil, cursos por status e total de matrículas. | Visão geral do administrador |

## Requisitos Não Funcionais

| ID | Categoria | Requisito |
|----|-----------|-----------|
| RNF01 | Usabilidade | Interface em português do Brasil, com linguagem simples; cada fluxo principal concluível em no máximo 3 cliques a partir da área inicial do perfil. |
| RNF02 | Usabilidade / Acessibilidade | Contraste mínimo WCAG AA, navegação por teclado nos elementos interativos e rótulos em todos os campos de formulário. |
| RNF03 | Desempenho percebido | Feedback de resposta e troca de tela em menos de 200 ms no protótipo (dados locais). |
| RNF04 | Privacidade | Dados de desempenho de um aluno visíveis apenas para ele, professores dos seus cursos, responsáveis vinculados e administradores (alinhado à LGPD para a fase de MVP). |
| RNF05 | Compatibilidade | Funcionar nas duas últimas versões de Chrome, Edge e Firefox; layout utilizável a partir de 360 px de largura. |
| RNF06 | Manutenibilidade | Motor adaptativo isolado da interface, com parâmetros centralizados e testes automatizados. |
| RNF07 | Portabilidade de dados | Camada de dados com interface assíncrona, permitindo trocar o armazenamento local por uma API sem alterar telas. |
| RNF08 | Protótipo | Rodar localmente com um único comando, sem serviços externos, e permitir restaurar os dados de demonstração. |
