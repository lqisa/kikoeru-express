// I forgot to change schema.js for db initialization
// This migration tries to fix the inconsistency
exports.up = async function (knex) {
  try {
    await knex.raw('DROP INDEX IF EXISTS t_work_circle_id_release_dl_count_review_count_price_rate_average_2dp_index')
    await knex.raw('DROP INDEX IF EXISTS t_work_index')
    // Will be recreated by the main program
    await knex.raw('DROP VIEW IF EXISTS userMetadata')

    // SQLite allows DDL in transaction
    await knex.schema.createTable('t_work_new', (table) => {
      table.increments() // id自增列(INTEGER 类型)，会被用作主键 [音声id]
      table.string('root_folder').notNullable() // VARCHAR 类型 [根文件夹别名]
      table.string('dir').notNullable() // VARCHAR 类型 [相对存储路径]
      table.string('title').notNullable() // VARCHAR 类型 [音声名称]
      table.integer('circle_id').notNullable() // INTEGER 类型 [社团id]
      table.boolean('nsfw') // BOOLEAN 类型
      table.string('release') // VARCHAR 类型 [贩卖日 (YYYY-MM-DD)]

      table.integer('dl_count') // INTEGER 类型 [售出数]
      table.integer('price') // INTEGER 类型 [价格]
      table.integer('review_count') // INTEGER 类型 [评论数量]
      table.integer('rate_count') // INTEGER 类型 [评价数量]
      table.float('rate_average_2dp') // FLOAT 类型 [平均评价]
      table.text('rate_count_detail') // TEXT 类型 [评价分布明细]
      table.text('rank') // TEXT 类型 [历史销售业绩]

      table.foreign('circle_id').references('id').inTable('t_circle') // FOREIGN KEY 外键
      table.index(['circle_id', 'release', 'dl_count', 'review_count', 'price', 'rate_average_2dp'], 't_work_index') // INDEX 索引
    })

    await knex.raw('INSERT INTO t_work_new SELECT * FROM t_work;')
    await knex.raw('DROP TABLE t_work;')
    await knex.raw('ALTER TABLE t_work_new RENAME TO t_work;')
  } catch (error) {
    console.error(error)
    throw error
  }
}

// Cannot be reverted
// eslint-disable-next-line no-unused-vars
exports.down = async function (knex) {

}
