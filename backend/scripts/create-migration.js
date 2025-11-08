#!/usr/bin/env node

/**
 * Script auxiliar para criar migrations
 *
 * Uso: npm run create-migration NomeDaMigration
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);

if (args.length === 0) {
  console.error('❌ Erro: Nome da migration não fornecido');
  console.log('\nUso: node scripts/create-migration.js NomeDaMigration');
  console.log('Exemplo: node scripts/create-migration.js AddPixKeyToUser');
  process.exit(1);
}

const migrationName = args[0];
const timestamp = Date.now();
const fileName = `${timestamp}-${migrationName}.ts`;
const migrationsDir = path.join(__dirname, '..', 'src', 'database', 'migrations');
const filePath = path.join(migrationsDir, fileName);

// Verificar se o diretório existe
if (!fs.existsSync(migrationsDir)) {
  fs.mkdirSync(migrationsDir, { recursive: true });
}

// Template da migration
const template = `import { MigrationInterface, QueryRunner } from "typeorm";

export class ${migrationName}${timestamp} implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // TODO: Implementar mudanças no banco de dados
        // Exemplo:
        // await queryRunner.query(\`
        //     ALTER TABLE "users" ADD "new_column" VARCHAR(255)
        // \`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // TODO: Implementar reversão das mudanças
        // Exemplo:
        // await queryRunner.query(\`
        //     ALTER TABLE "users" DROP COLUMN "new_column"
        // \`);
    }

}
`;

// Criar arquivo
fs.writeFileSync(filePath, template, 'utf8');

console.log('✅ Migration criada com sucesso!');
console.log(`📁 Arquivo: ${fileName}`);
console.log(`📍 Caminho: ${filePath}`);
console.log('\n📝 Próximos passos:');
console.log('1. Edite o arquivo e implemente os métodos up() e down()');
console.log('2. Teste localmente: npm run migration:run');
console.log('3. Verifique se funcionou: npm run migration:show');
console.log('4. Faça commit e push - será aplicado automaticamente no deploy!');
