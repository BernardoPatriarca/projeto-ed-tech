# Spec Delta

## Purpose

Permite manter e publicar conteúdo de disciplinas, compartilhando tópicos, materiais e questões entre suas turmas com autorização docente por vínculo.

## ADDED Requirements

### Requirement: Conteúdo pertencente à disciplina
O sistema SHALL manter tópicos ordenados, materiais, questões e estado de publicação na disciplina, compartilhados por suas turmas. O conteúdo SHALL começar em rascunho quando a disciplina for criada pelo Administrador ou Coordenador autorizado. Criar uma turma MUST NOT duplicar conteúdo; alterações SHALL ser visíveis nas turmas da disciplina, sem copiar ou reiniciar históricos individuais.

#### Scenario: Duas turmas compartilham conteúdo
- **GIVEN** turmas A e B de Algoritmos em períodos distintos
- **WHEN** um Professor autorizado altera o texto de um material de Algoritmos
- **THEN** o material atualizado fica disponível nas duas ofertas publicadas e os históricos de resposta permanecem separados e preservados

#### Scenario: Oferta nova usa o conteúdo existente
- **GIVEN** Algoritmos com tópicos, materiais e questões cadastrados
- **WHEN** o Administrador cria outra turma dessa disciplina
- **THEN** essa turma utiliza o mesmo conteúdo, sem criar uma segunda disciplina ou um segundo banco de questões

### Requirement: Tópicos ordenados
O Professor autorizado SHALL poder adicionar, editar, remover e reordenar tópicos da disciplina. O título do tópico SHALL ser obrigatório. A ordem dos tópicos SHALL definir a sequência de desbloqueio da trilha nas turmas da disciplina, preservando o histórico de respostas já registrado.

#### Scenario: Reordenar tópicos
- **WHEN** o Professor autorizado move Estruturas de repetição para antes de Vetores
- **THEN** a disciplina apresenta essa ordem e uma nova matrícula começa com o primeiro tópico dessa sequência desbloqueado

#### Scenario: Tópico sem título
- **WHEN** o Professor tenta salvar um tópico sem título
- **THEN** o sistema rejeita o cadastro e indica o campo obrigatório

### Requirement: Materiais por tópico
O Professor autorizado SHALL poder anexar a cada tópico materiais de estudo do tipo texto, vídeo por link ou arquivo por link. Os materiais SHALL ser consultáveis pelo Aluno matriculado em turma da disciplina com conteúdo publicado, sem conceder acesso a dados de colegas.

#### Scenario: Adicionar material
- **WHEN** o Professor adiciona um link de vídeo ao tópico Estruturas de repetição
- **THEN** o material aparece nesse tópico para os alunos matriculados nas turmas da disciplina publicada

### Requirement: Banco de questões classificado
O Professor autorizado SHALL poder cadastrar questões de múltipla escolha vinculadas a um tópico da disciplina, com enunciado, ao menos duas alternativas, exatamente uma alternativa correta, explicação e dificuldade Fácil, Médio ou Difícil. O sistema MUST rejeitar questão sem alternativa correta válida, explicação ou tópico pertencente à disciplina.

#### Scenario: Cadastrar questão
- **WHEN** o Professor cadastra uma questão válida no tópico Vetores com dificuldade Médio
- **THEN** a questão aparece no banco desse tópico com a dificuldade informada

#### Scenario: Questão sem alternativa correta
- **WHEN** o Professor tenta salvar uma questão sem indicar uma alternativa correta preenchida
- **THEN** o sistema não salva e informa que é preciso marcar uma alternativa correta válida

#### Scenario: Questão com tópico de outra disciplina
- **WHEN** o Professor tenta cadastrar em Algoritmos uma questão vinculada a tópico de Direito Civil
- **THEN** o sistema rejeita a associação e não altera nenhum dos bancos de questões

### Requirement: Publicação de conteúdo da disciplina
O Professor autorizado ou Administrador SHALL poder publicar o conteúdo de uma disciplina somente se houver ao menos um tópico e cada tópico tiver uma questão de cada dificuldade. A publicação SHALL disponibilizar a disciplina no catálogo e suas atividades para alunos matriculados, sem publicar uma graduação como trilha ou criar matrículas.

#### Scenario: Publicação bloqueada por cobertura
- **WHEN** o Professor tenta publicar conteúdo com tópico sem questão Difícil
- **THEN** o sistema mantém o conteúdo em rascunho e lista os tópicos e dificuldades faltantes

#### Scenario: Disciplina sem tópicos
- **WHEN** o Professor tenta publicar conteúdo de uma disciplina sem tópicos
- **THEN** o sistema rejeita a publicação e informa a necessidade de tópicos

#### Scenario: Publicação bem-sucedida
- **WHEN** o Professor publica conteúdo que atende aos critérios
- **THEN** a disciplina passa a publicada, aparece no catálogo e fica disponível para estudo nas suas turmas com alunos matriculados

### Requirement: Escopo do professor sobre conteúdo
O Professor SHALL poder manter e publicar conteúdo apenas de disciplinas com ao menos uma turma à qual esteja vinculado. O Administrador SHALL poder editar qualquer disciplina. O vínculo docente em uma turma MUST NOT permitir consultar matrículas, progresso ou respostas de outras turmas, mesmo quando o conteúdo é compartilhado.

#### Scenario: Professor sem vínculo
- **WHEN** um Professor tenta abrir ou alterar conteúdo de disciplina sem vínculo docente em nenhuma de suas turmas
- **THEN** o sistema nega a edição e mantém o conteúdo inalterado

#### Scenario: Professor com várias turmas da mesma disciplina
- **GIVEN** Paulo professor das turmas A e B de Algoritmos
- **WHEN** Paulo abre a edição de conteúdo por qualquer uma dessas turmas
- **THEN** encontra o mesmo conteúdo da disciplina, sem duplicação de tópicos ou questões

#### Scenario: Último vínculo docente removido
- **GIVEN** Paulo professor apenas da turma A de Algoritmos
- **WHEN** tenta editar Algoritmos após a remoção desse vínculo
- **THEN** a edição é negada, salvo se outra função válida, como Administrador, autorizar a operação

#### Scenario: Criar disciplina não concede autoria pedagógica
- **GIVEN** Carla somente Coordenador, vinculada a Direito, e criadora do cadastro de Direito Civil
- **WHEN** tenta adicionar tópicos ou publicar conteúdo dessa disciplina
- **THEN** o sistema nega a operação, mantendo a permissão de Carla para editar dados cadastrais, turmas, matrículas e vínculos docentes de Direito
