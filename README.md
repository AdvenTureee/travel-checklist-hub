**Travel Checklist Hub**

Travel Checklist Hub é um aplicativo web para quem quer planejar suas viagens de forma prática e organizada. Com ele, você pode criar roteiros, definir pontos de interesse, controlar seu orçamento, montar checklists personalizados e acompanhar o progresso dos seus objetivos durante a viagem.

**Funcionalidades**

Cadastro de Viagens: Crie e gerencie múltiplas viagens.
Pontos de Interesse: Adicione locais turísticos, restaurantes, acomodações e outros pontos importantes para cada viagem.
Checklists Personalizados: Monte listas de tarefas e itens para não esquecer nada.
Orçamento (Budget): Defina e acompanhe o orçamento da viagem, categorizando despesas.
Progresso Visual: Veja o andamento dos seus objetivos e checklists.
Recuperação de Senha: Sistema de autenticação seguro com recuperação de senha via e-mail.
Interface Responsiva: Usável em qualquer dispositivo (mobile, tablet, desktop).

**Tecnologias Utilizadas**

React (Vite): Frontend moderno e rápido
TypeScript: Tipagem estática para maior segurança e produtividade
Tailwind CSS: Estilização rápida e responsiva
Supabase: Backend as a Service (autenticação, banco de dados Postgres e storage)
React Router: Navegação SPA
React Query: Gerenciamento de dados assíncronos
Sonner/Toaster: Notificações amigáveis
PostgreSQL: Banco de dados relacional robusto (via Supabase)

**Como rodar localmente**

Clone o repositório:

git clone https://github.com/seu-usuario/travel-checklist-hub.git
cd travel-checklist-hub

Instale as dependências:

npm install

Configure as variáveis de ambiente:

Crie um arquivo .env na raiz do projeto com as seguintes chaves do Supabase:

VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...

Inicie o aplicativo:

npm run dev

Acesse no navegador:

http://localhost:5173

Deploy

O deploy pode ser feito facilmente em plataformas como Vercel ou Netlify. Basta configurar as variáveis de ambiente do Supabase nessas plataformas.
