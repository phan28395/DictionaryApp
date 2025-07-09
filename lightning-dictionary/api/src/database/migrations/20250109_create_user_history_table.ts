import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('user_history', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable();
    table.string('word', 255).notNullable();
    table.timestamp('looked_up_at').defaultTo(knex.fn.now());
    table.integer('frequency').defaultTo(1);
    
    // Foreign key
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    
    // Indexes
    table.index(['user_id', 'word']);
    table.index('looked_up_at');
    
    // Unique constraint for user-word pair
    table.unique(['user_id', 'word']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('user_history');
}