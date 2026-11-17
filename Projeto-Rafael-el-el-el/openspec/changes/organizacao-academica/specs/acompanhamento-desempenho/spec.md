# Spec Delta

## Purpose

Oferece painéis básicos de progresso e desempenho com contexto de disciplina, turma e período, respeitando as funções e vínculos de cada pessoa.

## ADDED Requirements

### Requirement: Painel do aluno
O sistema SHALL exibir ao Aluno, para cada turma matriculada, progresso, domínio por tópico, taxa de acertos e XP próprios, identificando graduação, disciplina, turma e período. Taxa de acertos SHALL ser acertos divididos por respostas válidas dessa matrícula, em porcentagem arredondada; sem respostas SHALL apresentar zero e indicar ausência de atividade.

#### Scenario: Aluno consulta seu desempenho
- **GIVEN** Ana com um de dois tópicos dominados, três acertos em quatro respostas e 50 XP na turma A
- **WHEN** abre o painel dessa turma
- **THEN** vê progresso de 50%, taxa de acertos de 75%, domínio por tópico e 50 XP com identificação da oferta

#### Scenario: Matrícula sem respostas
- **WHEN** Ana consulta o painel de uma turma na qual ainda não respondeu
- **THEN** vê progresso, domínio e XP iguais a zero e taxa zero acompanhada da indicação Sem atividade

### Requirement: Painel do professor por turma
O sistema SHALL exibir ao Professor apenas as turmas vinculadas, com disciplina e período. Em cada turma, SHALL listar alunos matriculados com progresso e taxa de acertos e domínio médio por tópico. Médias SHALL considerar todos os alunos matriculados daquela turma, atribuindo domínio zero aos que ainda não responderam, sem misturar outras ofertas.

#### Scenario: Professor com várias turmas
- **GIVEN** Paulo vinculado às turmas A e B de Algoritmos e C de Banco de Dados
- **WHEN** abre sua área e seleciona B
- **THEN** identifica as três ofertas e vê em B somente seus alunos e indicadores, sem matrículas ou respostas de A ou C

#### Scenario: Média inclui alunos sem respostas
- **GIVEN** uma turma com somente Ana com domínio 80 em Vetores e Bruno sem respostas
- **WHEN** o Professor consulta o domínio médio de Vetores nessa turma
- **THEN** o sistema apresenta 40

### Requirement: Turma sem alunos
Ao consultar uma turma sem alunos, o sistema SHALL mostrar zero matrículas e mensagem Nenhum aluno matriculado. Painéis de Professor, Coordenador e Administrador SHALL tratar médias e taxas agregadas como Sem dados, sem divisão por zero, valores inválidos ou inclusão de alunos de outra turma da mesma disciplina.

#### Scenario: Professor consulta turma vazia
- **GIVEN** turmas A com alunos e B sem alunos da mesma disciplina, ambas vinculadas a Paulo
- **WHEN** Paulo abre o painel de B
- **THEN** vê zero matrículas, Nenhum aluno matriculado e indicadores agregados Sem dados, sem dados de A

#### Scenario: Coordenador consulta oferta vazia
- **WHEN** um Coordenador autorizado abre uma turma sem alunos de sua graduação
- **THEN** encontra o mesmo estado vazio e nenhum indicador inválido

### Requirement: Alunos com dificuldade
O painel do Professor SHALL destacar como Precisa de atenção alunos com menos de 50% de acertos nas últimas até 10 respostas válidas da turma consultada. Se houver menos de 10, SHALL usar as disponíveis. Sem respostas, SHALL indicar Sem atividade e MUST NOT classificar por dificuldade. Esse destaque MUST NOT gerar diagnóstico ou encaminhamento de monitoria.

#### Scenario: Aluno destacado
- **GIVEN** Ana com três acertos nas últimas 10 respostas da turma A
- **WHEN** o Professor consulta A
- **THEN** Ana aparece como Precisa de atenção

#### Scenario: Limite de atenção
- **GIVEN** Ana com cinco acertos nas últimas 10 respostas de A e erros em outra turma
- **WHEN** o Professor consulta A
- **THEN** Ana não é destacada por dificuldade e os erros da outra turma não entram no cálculo

#### Scenario: Poucas respostas
- **GIVEN** Ana com duas respostas na turma, ambas incorretas
- **WHEN** o Professor consulta essa turma
- **THEN** Ana é destacada com base nas duas respostas disponíveis

### Requirement: Detalhe de aluno para o professor
O Professor SHALL poder abrir o detalhe de um Aluno matriculado em turma docente vinculada, vendo domínio por tópico e histórico das últimas até 10 respostas nessa turma, com data, questão, dificuldade e resultado. Ter o mesmo aluno em outra turma MUST NOT conceder acesso ao histórico de ofertas não vinculadas.

#### Scenario: Ver detalhe do aluno
- **WHEN** Paulo seleciona Ana no painel de sua turma A
- **THEN** vê o domínio por tópico e somente as últimas até 10 respostas de Ana em A

#### Scenario: Mesmo aluno em turma não vinculada
- **GIVEN** Paulo professor de A, Ana matriculada em A e B e Paulo sem vínculo com B
- **WHEN** Paulo tenta abrir o detalhe de Ana em B
- **THEN** o acesso é negado, mesmo que o detalhe de Ana em A seja permitido

### Requirement: Painel do coordenador
O sistema SHALL exibir ao Coordenador apenas graduações vinculadas, com disciplinas e turmas por período, matrículas, progresso médio e domínio médio por tópico. Os indicadores SHALL ser de consulta básica, sem prever evasão, comparar séries históricas ou editar resultados de estudo. O Coordenador SHALL poder acessar a gestão acadêmica desse escopo. Históricos detalhados de respostas MUST NOT ser liberados pela função Coordenador.

#### Scenario: Coordenação consulta suas ofertas
- **GIVEN** Carla coordenadora somente de Direito
- **WHEN** abre seu painel
- **THEN** vê disciplinas e turmas de Direito com seus períodos e indicadores básicos, sem dados de Sistemas de Informação

#### Scenario: Pessoa professora e coordenadora consulta painéis distintos
- **GIVEN** Carla professora de Algoritmos em Sistemas de Informação e coordenadora de Direito
- **WHEN** consulta seu painel docente e seu painel de coordenação
- **THEN** o primeiro apresenta somente suas turmas docentes e o segundo somente os cursos coordenados, mantendo os respectivos escopos

#### Scenario: Gestão acadêmica a partir do painel
- **GIVEN** Carla coordenadora somente de Direito
- **WHEN** acessa a gestão de uma turma de Direito pelo painel e atribui um professor ativo com essa função
- **THEN** o vínculo docente é salvo e a consulta reflete a atualização, mantendo as respostas e os indicadores de estudo existentes

### Requirement: Painel do responsável
O sistema SHALL exibir ao Responsável, para cada Aluno vinculado, as disciplinas e turmas matriculadas com graduação, período, progresso, sequência de dias e última atividade naquela turma. Sem respostas, SHALL indicar Sem atividade e sequência zero. A visualização MUST NOT incluir alunos não vinculados ou histórico detalhado de questões.

#### Scenario: Responsável acompanha aluno
- **GIVEN** um Responsável vinculado somente a Ana, matriculada em duas ofertas de Algoritmos
- **WHEN** abre seu painel
- **THEN** vê Ana com as duas ofertas, seus períodos e indicadores separados, sem dados de outros alunos

#### Scenario: Aluno sem atividade recente
- **WHEN** o Responsável consulta uma turma em que seu Aluno vinculado nunca respondeu
- **THEN** vê progresso zero, sequência zero e última atividade indicada como Sem atividade

### Requirement: Visão geral do administrador
O sistema SHALL exibir ao Administrador totais de pessoas distintas, pessoas por função, graduações, disciplinas por estado de publicação, períodos, turmas e matrículas. Uma pessoa com várias funções SHALL contar uma vez no total de pessoas e uma vez em cada função atribuída. Graduações MUST NOT ser contadas como conteúdo publicado ou rascunho.

#### Scenario: Totais com funções cumulativas
- **GIVEN** somente Ana como Aluno e Carla como Professor e Coordenador
- **WHEN** o Administrador consulta os totais de pessoas
- **THEN** vê duas pessoas distintas, um Aluno, um Professor e um Coordenador

#### Scenario: Totais acadêmicos
- **GIVEN** duas graduações, três disciplinas publicadas, uma em rascunho, dois períodos, cinco turmas e oito matrículas
- **WHEN** o Administrador consulta a visão geral
- **THEN** o sistema apresenta exatamente esses totais nas respectivas categorias
