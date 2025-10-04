/** @param { import("knex").Knex } knex */
exports.up = function(knex) {
  return knex.schema.createTable('users', (table) => {
    table.string('id').primary(); // Supabase user ID
    table.string('email').notNullable().unique();
    table.string('first_name');
    table.string('last_name');
    table.string('phone');
    table.boolean('is_admin').defaultTo(false);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });
};

/** @param { import("knex").Knex } knex */
exports.down = function(knex) {
  return knex.schema.dropTable('users');
};
