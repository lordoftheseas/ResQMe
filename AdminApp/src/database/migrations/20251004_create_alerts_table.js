/** @param { import("knex").Knex } knex */
exports.up = function(knex) {
  return knex.schema.createTable('alerts', (table) => {
    table.increments('id').primary();
    table.string('userId').notNullable();
    table.string('macAddress');
    table.text('gps'); // Stored as a JSON string
    table.string('receivedAt').notNullable();
    table.boolean('synced').defaultTo(false);
    table.string('messageType');
    table.integer('batteryLevel');
  });
};

/** @param { import("knex").Knex } knex */
exports.down = function(knex) {
  return knex.schema.dropTable('alerts');
};
