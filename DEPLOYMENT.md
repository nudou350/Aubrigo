# Deployment Guide - Aubrigo.pt

Este guia explica como configurar o deployment automático do projeto Aubrigo para a VPS usando GitHub Actions.

## Arquitetura de Deploy

- **VPS**: 72.60.56.80 (usuário: deploy)
- **Domínio**: aubrigo.pt
- **Backend**: NestJS rodando na porta 3002 (gerenciado pelo PM2)
- **Frontend**: Angular PWA servido pelo Nginx
- **Banco de Dados**: PostgreSQL
- **Web Server**: Nginx
- **Process Manager**: PM2

---

## Pré-requisitos na VPS

1. **Node.js** (versão 18 ou superior)
2. **PM2** instalado globalmente: `npm install -g pm2`
3. **Nginx** instalado e rodando
4. **PostgreSQL** instalado e banco de dados criado
5. **Certbot** para certificados SSL (Let's Encrypt)

---

## Setup Inicial na VPS

### 1. Conectar via SSH

```bash
ssh deploy@72.60.56.80
```

### 2. Executar o script de setup

```bash
# Clone o repositório temporariamente para pegar os scripts
cd /tmp
git clone https://github.com/SEU_USUARIO/aubrigo.git
cd aubrigo/deployment

# Tornar o script executável
chmod +x setup-vps.sh

# Executar o script
./setup-vps.sh
```

### 3. Configurar Nginx

```bash
# Copiar configuração do Nginx
sudo cp /tmp/aubrigo/deployment/nginx-aubrigo.conf /etc/nginx/sites-available/aubrigo.pt

# Criar symlink
sudo ln -sf /etc/nginx/sites-available/aubrigo.pt /etc/nginx/sites-enabled/

# Testar configuração
sudo nginx -t

# Se OK, remover configuração default (opcional)
sudo rm /etc/nginx/sites-enabled/default

# Recarregar Nginx
sudo systemctl reload nginx
```

### 4. Obter Certificado SSL

```bash
# Criar diretório para certbot
sudo mkdir -p /var/www/certbot

# Obter certificado (certifique-se que o DNS está apontando para o servidor)
sudo certbot certonly --webroot -w /var/www/certbot -d aubrigo.pt -d www.aubrigo.pt

# Após obter o certificado, recarregar o Nginx
sudo systemctl reload nginx
```

### 5. Configurar PostgreSQL

```bash
# Conectar ao PostgreSQL
sudo -u postgres psql

# Criar banco de dados e usuário
CREATE DATABASE aubrigo;
CREATE USER aubrigo_user WITH ENCRYPTED PASSWORD 'sua_senha_forte';
GRANT ALL PRIVILEGES ON DATABASE aubrigo TO aubrigo_user;
\q
```

---

## GitHub Secrets Configuration

Acesse o seu repositório no GitHub: **Settings > Secrets and variables > Actions**

### Clique em "New repository secret" e adicione os seguintes secrets:

### 1. VPS_SSH_KEY
**Descrição**: Chave privada SSH para conectar na VPS

**Como gerar**:
```bash
# Na sua máquina local, gere um par de chaves SSH
ssh-keygen -t ed25519 -C "github-actions-aubrigo" -f ~/.ssh/aubrigo_deploy

# Copiar a chave pública para a VPS
ssh-copy-id -i ~/.ssh/aubrigo_deploy.pub deploy@72.60.56.80

# Copiar o conteúdo da chave PRIVADA
cat ~/.ssh/aubrigo_deploy
```

**Valor**: Cole o conteúdo completo da chave privada (incluindo `-----BEGIN OPENSSH PRIVATE KEY-----` e `-----END OPENSSH PRIVATE KEY-----`)

---

### 2. VPS_HOST
**Descrição**: Endereço IP da VPS

**Valor**: `72.60.56.80`

---

### 3. VPS_USER
**Descrição**: Usuário SSH da VPS

**Valor**: `deploy`

---

### 4. DATABASE_URL
**Descrição**: URL de conexão com PostgreSQL

**Formato**: `postgresql://usuario:senha@localhost:5432/nome_do_banco`

**Exemplo**: `postgresql://aubrigo_user:sua_senha_forte@localhost:5432/aubrigo`

---

### 5. JWT_SECRET
**Descrição**: Secret para assinar tokens JWT

**Como gerar**:
```bash
# Linux/Mac
openssl rand -base64 32

# Ou use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Valor**: String aleatória gerada (ex: `K8vD2nF9xW4pL7qM3jR6sT1uY5hG0bN8`)

---

### 6. EMAIL_HOST
**Descrição**: Servidor SMTP para envio de emails

**Exemplos**:
- Gmail: `smtp.gmail.com`
- SendGrid: `smtp.sendgrid.net`
- Outro provedor: consulte a documentação

**Valor**: `smtp.gmail.com` (ou seu provedor)

---

### 7. EMAIL_PORT
**Descrição**: Porta do servidor SMTP

**Valores comuns**:
- 587 (TLS - recomendado)
- 465 (SSL)
- 25 (não criptografado)

**Valor**: `587`

---

### 8. EMAIL_USER
**Descrição**: Usuário/email para autenticação SMTP

**Valor**: `seu-email@gmail.com`

---

### 9. EMAIL_PASSWORD
**Descrição**: Senha ou token de aplicação para SMTP

**Para Gmail**:
1. Ative a verificação em 2 etapas
2. Gere uma "Senha de app" em: https://myaccount.google.com/apppasswords
3. Use essa senha de 16 caracteres

**Valor**: `sua_senha_ou_token`

---

### 10. FRONTEND_URL
**Descrição**: URL do frontend para links em emails e CORS

**Valor**: `https://aubrigo.pt`

---

## Resumo dos Secrets

| Secret Name      | Exemplo                                                    |
|------------------|------------------------------------------------------------|
| VPS_SSH_KEY      | -----BEGIN OPENSSH PRIVATE KEY----- ...                   |
| VPS_HOST         | 72.60.56.80                                                |
| VPS_USER         | deploy                                                     |
| DATABASE_URL     | postgresql://aubrigo_user:senha@localhost:5432/aubrigo     |
| JWT_SECRET       | K8vD2nF9xW4pL7qM3jR6sT1uY5hG0bN8                          |
| EMAIL_HOST       | smtp.gmail.com                                             |
| EMAIL_PORT       | 587                                                        |
| EMAIL_USER       | seu-email@gmail.com                                        |
| EMAIL_PASSWORD   | xxxx xxxx xxxx xxxx                                        |
| FRONTEND_URL     | https://aubrigo.pt                                         |

---

## Como Funciona o Deploy Automático

1. **Você faz commit e push para a branch `main`**
2. **GitHub Actions é acionado automaticamente**
3. **O workflow executa**:
   - Checkout do código
   - Instalação de dependências (backend e frontend)
   - Build do backend (NestJS)
   - Build do frontend (Angular)
   - Criação de pacote de deployment
   - Conexão SSH com a VPS
   - Upload do pacote para a VPS
   - Backup da versão anterior
   - Deploy da nova versão
   - Atualização das variáveis de ambiente
   - Restart do backend com PM2
   - Reload do Nginx
4. **Verificação da saúde da aplicação**

---

## Comandos Úteis na VPS

### PM2
```bash
# Ver status dos processos
pm2 status

# Ver logs do backend
pm2 logs aubrigo-backend

# Restart do backend
pm2 restart aubrigo-backend

# Monitoramento
pm2 monit

# Salvar configuração atual
pm2 save
```

### Nginx
```bash
# Testar configuração
sudo nginx -t

# Reload (sem downtime)
sudo systemctl reload nginx

# Restart
sudo systemctl restart nginx

# Ver logs
sudo tail -f /var/log/nginx/aubrigo-access.log
sudo tail -f /var/log/nginx/aubrigo-error.log
```

### PostgreSQL
```bash
# Conectar ao banco
psql -U aubrigo_user -d aubrigo

# Backup do banco
pg_dump -U aubrigo_user aubrigo > backup_$(date +%Y%m%d).sql

# Restaurar backup
psql -U aubrigo_user aubrigo < backup_20250105.sql
```

### Logs de Deploy
```bash
# Ver últimos deploys
cd /var/www/aubrigo
ls -lt | head -n 10

# Ver estrutura atual
tree -L 2 current/
```

---

## Troubleshooting

### Deploy falhou
```bash
# Verificar logs do PM2
pm2 logs aubrigo-backend --lines 100

# Verificar se o backend está rodando
curl http://localhost:3002/api/health

# Verificar logs do Nginx
sudo tail -f /var/log/nginx/aubrigo-error.log
```

### Backend não inicia
```bash
# Verificar variáveis de ambiente
cat /var/www/aubrigo/current/backend/.env

# Verificar conexão com banco
psql -U aubrigo_user -d aubrigo -c "SELECT 1"

# Restart manual
cd /var/www/aubrigo/current/backend
pm2 restart aubrigo-backend
```

### SSL não funciona
```bash
# Renovar certificado
sudo certbot renew

# Verificar certificados
sudo certbot certificates

# Recarregar Nginx
sudo systemctl reload nginx
```

---

## Primeiro Deploy

Após configurar todos os secrets no GitHub:

```bash
# Na sua máquina local
git add .
git commit -m "Configure deployment"
git push origin main
```

Acompanhe o progresso em: `https://github.com/SEU_USUARIO/aubrigo/actions`

---

## Estrutura de Diretórios na VPS

```
/var/www/aubrigo/
├── current/                    # Versão atual em produção
│   ├── backend/
│   │   ├── dist/              # Código compilado
│   │   ├── node_modules/
│   │   ├── logs/
│   │   ├── uploads/
│   │   ├── .env
│   │   └── ecosystem.config.js
│   └── frontend/              # Build do Angular
│       ├── index.html
│       ├── assets/
│       └── *.js
├── backup-20250105120000/     # Backups anteriores
├── backup-20250104090000/
└── shared/                    # Arquivos compartilhados (opcional)
```

---

## Segurança

- Chave SSH privada **nunca** deve ser commitada no repositório
- Secrets do GitHub são criptografados e seguros
- SSL/TLS obrigatório em produção
- Firewall deve permitir apenas portas: 22 (SSH), 80 (HTTP), 443 (HTTPS)
- PostgreSQL deve aceitar apenas conexões locais
- Mantenha PM2, Node.js, Nginx e PostgreSQL sempre atualizados

---

## Rollback

Se algo der errado, você pode fazer rollback para uma versão anterior:

```bash
ssh deploy@72.60.56.80

cd /var/www/aubrigo

# Ver backups disponíveis
ls -lt | grep backup

# Fazer rollback
rm -rf current
cp -r backup-20250105120000 current

# Restart
cd current/backend
pm2 restart aubrigo-backend
sudo systemctl reload nginx
```

---

## Contato e Suporte

Em caso de problemas, verifique:
1. Logs do GitHub Actions
2. Logs do PM2: `pm2 logs aubrigo-backend`
3. Logs do Nginx: `/var/log/nginx/aubrigo-error.log`
4. Status dos serviços: `pm2 status`, `sudo systemctl status nginx`

---

**Última atualização**: 2025-01-05
