# ZicaPay — Banco Digital da Pior Experiência

## Equipe

- **Nome da equipe:** BananasLab Team
- **Integrantes:**
  - Eduardo Belato Nazioseno — edunaziozeno61@gmail.com
  - Kaiqui Salomão Martins de Oliveira — kaiqui.salomaomartins@gmail.com
  - Gabriel Cordeiro de Souza — bielsouzacordeiro28@gmail.com
  - Victor Henrique Nascimento Moraes — victor.m@estudante.ifro.edu.br
- **Curso/Turma:** Tecnologia em Análise e Desenvolvimento de Sistemas (ADS) / 3º Período
- **Categoria:** Desafio Pior Experiência de Usuário

---

## Problema

Interfaces mal projetadas causam frustração, erros e abandono por parte dos usuários. Princípios básicos de usabilidade são frequentemente ignorados no desenvolvimento de sistemas, prejudicando a experiência de pessoas que dependem dessas ferramentas no dia a dia.

**Público impactado:** qualquer usuário de sistemas digitais — especialmente em contextos financeiros, onde uma interface ruim pode causar erros graves como transferências incorretas, senhas esquecidas ou dados inseridos de forma errada.

---

## Solução

O **ZicaPay** é um protótipo de banco digital desenvolvido intencionalmente com as piores práticas de UX/UI, com objetivo pedagógico de demonstrar na prática como uma interface mal desenhada atrapalha a vida das pessoas.

O sistema viola propositalmente as Heurísticas de Usabilidade de Jakob Nielsen em todas as telas do fluxo, desde a tela inicial até as operações financeiras. Por baixo dos panos, o backend funciona corretamente — transferências, saldo e autenticação operam de forma precisa enquanto o usuário sofre na interface.

**Fluxo da pior experiência:**

1. **Splash** — tela de entrada com instruções confusas
2. **Termos de Uso** — checkboxes interdependentes e contraditórios que nunca deixam o usuário aceitar de primeira
3. **Cadastro** — regras de senha abs urdas e contraditórias + campo de confirmar senha que sempre diz não coincidir + **Regra dos 3 Cliques**: mensagens motivacionais irônicas a cada clique frustrado ("LEMBRE-SE DE SER INSISTENTE", "TENTAR NOVAMENTE É UMA VIRTUDE")
4. **Login** — regras de senha que só aparecem após tentar entrar, mudam a cada tentativa e se contradizem + **Regra dos 3 Cliques**: aviso discreto "LEMBRE-SE QUE O BOTÃO QUE DECIDE"; apenas no 3º clique o login é concluído
5. **Taxa de Abertura** — cobrança surpresa imediata de R$150; saldo negativo obriga a aceitar um empréstimo com juros abusivos
6. **Dashboard** — saldo visível apenas após assistir propaganda obrigatória (com som forçado) + **Interrupção estilo Netflix aos 10 segundos**: vídeo pausa e exibe "VOCÊ AINDA ESTÁ AI?" com botões de punição
7. **Onboarding do Mal** — guia interativo expandido (7 passos) que insulta o usuário e o guia para tomar péssimas decisões financeiras; encerra com a mensagem "AGORA VOCÊ JÁ SABE USAR O ZICAPAY, E É NOSSO CÚ MPLICE CASO A CASA CAIA"
8. **Pop-ups Interativos** — "O Mestre da Fuga" (botão que foge do mouse), "O Refém Intelectual" (captcha cronometrado), e "A Roleta da Recusa" (slot machine para cancelar um cartão de crédito)
9. **Investimentos** — "Tinder dos Investimentos" (swipe compra sem confirmação) e "Apostas Hípicas" (corrida viciada onde o usuário sempre perde e é taxado pelo veterinário)

**Princípios de UX/UI violados:**

- **H1 — Visibilidade do status:** regras de senha só aparecem após tentar submeter
- **H3 — Controle e liberdade:** taxa de abertura compulsória e empréstimo forçado para sair da tela; popups sem botão claro de fechamento
- **H4 — Consistência e padrões:** regras se contradizem abertamente entre si
- **H5 — Prevenção de erros:** o sistema provoca erros ativamente (compra via swipe, captcha impossível)
- **H6 — Reconhecimento em vez de memorização:** regras mudam a cada tentativa
- **H8 — Estética e design minimalista:** poluição visual extrema na roleta de cartões e apostas
- **H9 — Mensagens de erro:** mensagens inúteis e humilhantes como "a senha deve expressar um sentimento positivo" ou insultos do guia
- **H10 — Ajuda e documentação:** termos impossíveis de aceitar, propaganda impossível de pular

**Proposta de melhoria:** uma versão corrigida do fluxo seguiria as heurísticas violadas — exibindo os requisitos de senha antes do preenchimento, com validação em tempo real, sem regras contraditórias, e sem barreiras artificiais para acessar informações da própria conta.

---

## Como testar

```bash
# 1. Clonar o repositório
git clone https://github.com/BelatoDeveloper/bancohack.git
cd bancohack

# 2. Criar e ativar ambiente virtual
python -m venv venv
venv\Scripts\activate        # Windows
source venv/bin/activate     # Linux/macOS

# 3. Instalar dependências
pip install -r requirements.txt

# 4. Rodar o servidor
python app.py

# 5. Acessar no navegador
# http://127.0.0.1:5000
```

**Fluxo principal:** acesse `/`, aceite os termos, crie uma conta ou faça login com as credenciais acima, assista a propaganda obrigatória para ver o saldo e explore as funcionalidades.

---

## Tecnologias utilizadas

- **Linguagem:** Python 3.x
- **Framework:** Flask
- **Templates:** Jinja2
- **Frontend:** HTML5, CSS3, JavaScript
- **Banco de dados:** em memória (sem persistência externa)
- **Hospedagem:** Render (deploy em nuvem)
- **Versionamento:** Git + GitHub

---

## Arquitetura MTC

O projeto segue o padrão **MTC (Model — Template — Controller)**, especialização do MVC adaptada ao Flask.

```
bancohack/
├── app.py                        ← CONTROLLER (único ponto de entrada HTTP)
├── requirements.txt
├── RELATORIO_MTC.md              ← Relatório técnico detalhado da arquitetura
│
├── models/                       ← MODEL (dados + regras de negócio)
│   ├── __init__.py
│   ├── usuario.py                (superclasse: identidade e autenticação)
│   ├── cliente.py                (subclasse de Usuario, compõe Conta)
│   ├── conta.py                  (entidade: saldo e operações financeiras)
│   ├── cartao.py                 (entidade: cartões do cliente)
│   ├── pix.py                    (entidade: operações Pix)
│   ├── notificacao.py            (entidade: notificações do sistema)
│   └── banco_dados.py            (repositório em memória, seed de dados)
│
├── templates/                    ← TEMPLATE (apresentação via Jinja2)
│   ├── base.html
│   ├── splash.html
│   ├── termos.html
│   ├── login.html
│   ├── cadastro.html
│   ├── dashboard.html
│   ├── extrato.html
│   ├── transferencia.html
│   ├── deposito.html
│   ├── pix.html
│   ├── cartoes.html
│   ├── notificacoes.html
│   ├── perfil.html
│   └── investir.html             (tela de investimentos fraudulentos)
│
└── static/
    ├── css/
    │   ├── estilos.css
    │   ├── main.css
    │   ├── termos.css
    │   ├── darkPopups.css
    │   ├── propaganda.css
    │   ├── taxa_abertura.css
    │   ├── guia.css
    │   └── investir.css
    └── js/
        ├── app.js
        ├── login.js           (dark pattern: regra dos 3 cliques)
        ├── cadastro.js        (dark pattern: regra dos 3 cliques + mensagens irônicas)
        ├── termos.js
        ├── propaganda.js      (dark pattern: interrupção aos 10s + timer)
        ├── darkPopups.js
        ├── popupsConfig.js
        ├── taxa_abertura.js   (lógica da extorsão pós-login)
        ├── guia_zica.js       (onboarding sarcast ico expandido 7 passos)
        ├── investir.js        (lógica das apostas e swipe)
        └── perfil.js, pix.js, cartoes.js, termos.js, ...
```

> Para detalhamento completo da arquitetura, consulte o arquivo `RELATORIO_MTC.md`.

---

## Uso de IA

O uso de inteligência artificial foi amplo e transparente ao longo de todo o desenvolvimento do projeto. As ferramentas foram utilizadas como apoio criativo e técnico, sempre com revisão, validação e adaptação pela equipe.

| Ferramenta                   | Como foi utilizada                                                                                                                                                                                                                                                                                           |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Claude (Anthropic)** | Geração e refinamento de código JavaScript (lógica das regras absurdas de senha, propagandas, popups e termos); apoio à documentação técnica (README, RELATORIO_MTC.md); sugestão e refinamento de ideias de UX propositalmente ruim; depuração de código e orientação sobre arquitetura Flask |
| **AntiGravity**        | Geração de ideias criativas para as experiências de pior UX; apoio no desenvolvimento de conceitos visuais e de fluxo; sugestão de abordagens para as telas e interações do sistema                                                                                                                    |

**Partes do projeto apoiadas por IA:**

- Ideação e criatividade — geração de ideias para experiências frustrantes e violações de heurísticas
- Código frontend — JavaScript das telas de login, cadastro, termos, propaganda e popups
- Documentação — estruturação e redação do README e do relatório técnico MTC
- Refinamento — revisão e melhoria de trechos de código já escritos pela equipe

**Adaptações realizadas pela equipe:**
Todo o conteúdo gerado por IA foi revisado, compreendido, testado e adaptado pelos integrantes antes de ser integrado ao projeto. A arquitetura do sistema, as decisões de design, a implementação do backend em Python/Flask e a lógica de negócio foram desenvolvidas pela equipe, com IA atuando como ferramenta de apoio.

A equipe declara responsabilidade integral pelo conteúdo entregue e está apta a apresentar, explicar e defender tecnicamente todas as decisões do projeto.

---

## Validação

O projeto foi testado pelos próprios integrantes da equipe simulando o fluxo completo do usuário, desde a tela inicial até as operações financeiras. Foram validados:

- Fluxo de termos com checkboxes contraditórios
- **Regra dos 3 Cliques** no login (erros falsos nos 2 primeiros cliques, libera no 3º) e no cadastro (mensagens irônicas sequenciais)
- **Interrupção de propaganda** aos 10 segundos (pausa + pop-up "VOCÊ AINDA ESTÁ AI?")
- **Onboarding expandido** 7 passos, com encerramento no passo final com mensagem de cumplicidade
- Propaganda obrigatória antes de ver o saldo
- Operações de transferência, Pix e extrato funcionando corretamente no backend

---

## Aviso de Compliance — Hackathon IFRO 2026/1

> ⚠️ **Declaração Obrigatória conforme regras do Hackathon Extensionista IFRO Ariquemes**

### Uso de Inteligência Artificial

Este projeto utilizou ferramentas de IA como apoio no desenvolvimento. Toda IA utilizada está documentada na seção **Uso de IA** acima. O conteúdo gerado por IA foi **revisado, compreendido e adaptado** pela equipe antes de ser integrado.

### Chaves e Credenciais

Nenhuma chave de API, senha ou credencial real está exposta no código-fonte deste repositório. Todas as integrações utilizam configurações de ambiente (variáveis de ambiente ou arquivo de configuração local não versionado).

### Disponibilidade do MVP

O MVP está online, funcional e disponível para avaliação da banca através do link público: https://zicapay-steel.vercel.app. O sistema também pode ser executado localmente seguindo as instruções deste README.

### Prazo de Submissão

Este projeto deve ser submetido até **19/06/2026 às 23h59** conforme cronograma do Hackathon Extensionista IFRO Ariquemes 2026/1.

### Autoria

Todo o conteúdo é de autoria da equipe **BananasLab Team** (IFRO Campus Ariquemes), desenvolvido exclusivamente para fins acadêmicos no contexto do Hackathon Extensionista. Os dark patterns implementados são demonstrações didáticas de más práticas de UX e **não representam a intenção real de prejudicar usuários**.

---

## Licença

Projeto desenvolvido para fins acadêmicos — **Hackathon Extensionista IFRO Ariquemes 2026/1**.
Uso livre para fins educacionais, com atribuição à equipe BananasLab Team / IFRO Campus Ariquemes.
