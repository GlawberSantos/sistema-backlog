# SMRA — Sistema de Monitoramento de Rede e Ativações

![Preview do SMRA](https://i.imgur.com/A90lrpB.png)

**Aplicação web completa** para gestão de backlog, agenda técnica e produção diária de equipes de telecomunicações.

## ✨ Funcionalidades

- Dashboard com gráficos e indicadores
- Gerenciamento completo de backlog
- Agenda técnica com FullCalendar
- Área exclusiva para técnicos (encerramento com fotos e carimbo)
- Importação e exportação (Excel + PDF)
- Sistema de perfis (Admin, Supervisor e Técnico)
- Tema escuro/claro

## 🚀 Tecnologias

- **Frontend:** React 18 + TypeScript + Vite
- **Estilização:** Tailwind CSS
- **Estado:** Zustand
- **UI:** FullCalendar, Chart.js, jsPDF
- **Persistência:** localStorage

## 🎯 Demonstração

🔗 **[Ver projeto online](https://glawbersantos.github.io/sistema-backlog/)**

## 📸 Screenshots

*(Mais imagens podem ser adicionadas aqui depois)*

## Como rodar localmente

```bash
# Clone o repositório
git clone https://github.com/GlawberSantos/sistema-backlog.git

# Entre na pasta
cd sistema-backlog

# Instale as dependências
npm install

# Rode o projeto
npm run dev
Acesse: http://localhost:5173
Credenciais de teste
Perfil,E-mail,Senha
Administrador,admin@smra.com,admin123
Supervisor,supervisor@smra.com,sup123
Técnico,tecnico@smra.com,tec123
