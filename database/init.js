const fs = require('fs')
const path = require('path')
const { md5 } = require('../auth/utils')
const knexMigrate = require('./knex-migrate')
const { databaseExist, createUser } = require('./db')
const { config, updateConfig } = require('../config')
const { createSchema } = require('./schema')

const initApp = async () => {
  const migrationDir = path.join(__dirname, 'migrations')

  async function runMigrations () {
    if (!fs.existsSync(migrationDir)) {
      console.log(' * migrations 目录不存在，跳过增量迁移.')
      return
    }
    const migrationFiles = fs.readdirSync(migrationDir)
      .filter((file) => /^\d+_.+\.[jt]s$/.test(file))
    if (migrationFiles.length === 0) {
      console.log(' * 未检测到待执行的增量迁移脚本.')
      return
    }

    const log = ({ action, migration }) =>
      console.log('Doing ' + action + ' on ' + migration)
    await knexMigrate('up', {}, log)
  }

  async function skipMigrations () {
    await knexMigrate('skipAll', {})
  }

  function initDatabaseDir () {
    const databaseFolderDir = config.databaseFolderDir
    if (!fs.existsSync(databaseFolderDir)) {
      try {
        fs.mkdirSync(databaseFolderDir, { recursive: true })
      } catch (err) {
        console.error(` ! 在创建存放数据库文件的文件夹时出错: ${err.message}`)
      }
    }
  }

  // 仅在数据库存在时运行增量迁移
  if (databaseExist) {
    try {
      await runMigrations()
      updateConfig()
    } catch (error) {
      console.log('升级迁移过程中出错，请在GitHub issues中报告作者')
      console.error(error)
    }
  } else if (!databaseExist) {
    initDatabaseDir()
    await createSchema()
    try {
      // 创建内置的管理员账号
      await createUser({
        name: 'admin',
        password: md5('admin'),
        group: 'administrator'
      })
    } catch (err) {
      console.error(err.message)
      process.exit(1)
    }
    if (fs.existsSync(migrationDir)) {
      try {
        await skipMigrations()
      } catch (err) {
        console.error(` ! 在构建数据库结构过程中出错: ${err.message}`)
        process.exit(1)
      }
    } else {
      console.log(' * migrations 目录不存在，跳过标记迁移.')
    }
    // 初始化完成，同步配置版本
    updateConfig()
  }
}

module.exports = { initApp }
