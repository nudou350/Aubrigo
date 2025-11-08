# Database Migrations Guide

Este documento explica como trabalhar com migrations no projeto Aubrigo.

## 📋 O que são Migrations?

Migrations são arquivos que descrevem mudanças no schema do banco de dados de forma controlada e versionada. Elas permitem:
- Versionar mudanças no banco de dados junto com o código
- Aplicar mudanças de forma consistente em diferentes ambientes
- Reverter mudanças se necessário
- Trabalhar em equipe sem conflitos no schema

## 🚀 Scripts Disponíveis

### Desenvolvimento (Local)

```bash
# Executar migrations pendentes
npm run migration:run

# Visualizar status das migrations
npm run migration:show

# Reverter última migration
npm run migration:revert

# Gerar nova migration baseada nas mudanças nas entities
npm run migration:generate -- src/database/migrations/NomeDaMigration
```

### Produção

```bash
# Executar migrations em produção
npm run migration:run:prod

# Visualizar status das migrations em produção
npm run migration:show:prod

# Reverter última migration em produção
npm run migration:revert:prod
```

## 📝 Como Criar uma Nova Migration

### 1. Criar Manualmente

Crie um arquivo em `src/database/migrations/` seguindo o padrão:

```typescript
import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddPixKeyToUser1736400000000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Mudanças a serem aplicadas
        await queryRunner.addColumn(
            'users',
            new TableColumn({
                name: 'pix_key',
                type: 'varchar',
                length: '255',
                isNullable: true,
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Reverter mudanças
        await queryRunner.dropColumn('users', 'pix_key');
    }
}
```

**Nomenclatura do arquivo:** `{timestamp}-{DescricaoDaMudanca}.ts`
- Exemplo: `1736400000000-AddPixKeyToUser.ts`

### 2. Gerar Automaticamente (a partir de mudanças nas entities)

Se você modificou uma entity, o TypeORM pode gerar a migration automaticamente:

```bash
npm run migration:generate -- src/database/migrations/DescricaoDaMudanca
```

## 🔄 Workflow Automático (CI/CD)

As migrations são **executadas automaticamente** em cada deploy via GitHub Actions:

1. Código é enviado para branch `main`
2. GitHub Actions faz build do backend
3. Deploy no servidor VPS
4. **Migrations são executadas automaticamente**
5. Serviço backend é reiniciado

### O que acontece no deploy:

```bash
# 1. Mostra status atual das migrations
npm run migration:show:prod

# 2. Executa migrations pendentes
npm run migration:run:prod

# 3. Reinicia o serviço
pm2 restart aubrigo-backend
```

### Logs do Deploy

Você pode ver os logs das migrations no GitHub Actions:
1. Acesse: https://github.com/seu-usuario/aubrigo/actions
2. Selecione o workflow de deploy
3. Expanda a seção "Deploy to VPS"
4. Procure por "📊 Checking database migrations..."

## ⚠️ Boas Práticas

### ✅ Faça

- **Sempre testar localmente** antes de fazer commit
- **Criar migrations atômicas** (uma mudança por migration)
- **Implementar `down()` corretamente** para poder reverter
- **Verificar compatibilidade** com dados existentes
- **Usar transações** quando possível
- **Documentar migrations complexas** com comentários

### ❌ Não Faça

- **Nunca editar** uma migration que já foi aplicada em produção
- **Nunca deletar** migrations antigas
- **Não usar** `synchronize: true` em produção
- **Evitar** migrations que podem causar downtime prolongado
- **Não assumir** que o banco está vazio

## 🛠️ Exemplos Comuns

### Adicionar Coluna

```typescript
await queryRunner.addColumn('table_name', new TableColumn({
    name: 'column_name',
    type: 'varchar',
    length: '255',
    isNullable: true,
    default: null
}));
```

### Remover Coluna

```typescript
await queryRunner.dropColumn('table_name', 'column_name');
```

### Alterar Coluna

```typescript
await queryRunner.changeColumn('table_name', 'column_name', new TableColumn({
    name: 'column_name',
    type: 'text',
    isNullable: false
}));
```

### Criar Índice

```typescript
await queryRunner.createIndex('table_name', new TableIndex({
    name: 'IDX_table_column',
    columnNames: ['column_name']
}));
```

### Executar SQL Raw

```typescript
await queryRunner.query(`
    UPDATE users
    SET country_code = 'PT'
    WHERE country_code IS NULL
`);
```

## 🔍 Troubleshooting

### Migration falhou no deploy

1. Verifique os logs no GitHub Actions
2. Conecte no servidor VPS via SSH
3. Navegue até o diretório do backend:
   ```bash
   cd /var/www/aubrigo/current/backend
   ```
4. Verifique o status:
   ```bash
   npm run migration:show:prod
   ```
5. Tente executar manualmente:
   ```bash
   npm run migration:run:prod
   ```

### Reverter migration em produção

⚠️ **CUIDADO**: Apenas faça isso se souber o que está fazendo!

```bash
# Via SSH no servidor
cd /var/www/aubrigo/current/backend
npm run migration:revert:prod
```

### Migration está pendente mas não deveria

Verifique se o arquivo está na pasta correta:
- Desenvolvimento: `src/database/migrations/`
- Produção: `dist/database/migrations/` (gerado automaticamente no build)

## 📚 Referências

- [TypeORM Migrations](https://typeorm.io/migrations)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [GitHub Actions Workflow](.github/workflows/deploy.yml)

## 🆘 Precisa de Ajuda?

Em caso de dúvidas ou problemas:
1. Consulte esta documentação
2. Verifique os logs do GitHub Actions
3. Revise as migrations existentes como exemplo
4. Entre em contato com o time de desenvolvimento
