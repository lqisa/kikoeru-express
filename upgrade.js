const fs = require('fs')
const path = require('path')
const compareVersions = require('compare-versions')
const { configFolderDir } = require('./config')
const knexMigrate = require('./database/knex-migrate')
const { knex } = require('./database/db')

// Before the following version, there is a hash collision issue in the VA table
const versionVAHashCollisionFixed = '0.6.0-rc.2'
// Before the following version, the knexfile path uses relative path to CWD, which causes a bunch of problems on Mac OS
const versionKnexfilePathFixed = '0.6.0-rc.4'

const applyFix = async (oldVersion) => {
  if (compareVersions.compare(oldVersion, versionVAHashCollisionFixed, '<')) {
    console.log('\n')
    console.log(' ! 新版解决了旧版扫描时将かの仔和こっこ识别为同一个人的问题')
    console.log(' ! 建议进行扫描以自动修复这一问题')
    const lockConfig = { fixVA: true }
    updateLock.createLockFile(lockConfig)
  }

  // A nasty bug in Mac OS version only, >= v0.6.0-rc.0 and <= v0.6.0.rc.3
  // Caused by relative path in knexfile.js
  // On Mac OS, the current working directory is not the location of the program
  // The bug is not obvious on Windows since everyone is double clicking the program
  if (compareVersions.compare(oldVersion, versionKnexfilePathFixed, '<')) {
    if (process.platform === 'darwin') {
      // Skip to v0.6.0-rc.0
      await knexMigrate('skipAll', { to: '20210206141840' })
      const results = await knex.raw("PRAGMA table_info('t_va')")
      if (results[0].type === 'integer') {
        // Fill VA ids, migrate to v0.6.0-rc.3
        const log = ({ action, migration }) =>
          console.log('Doing ' + action + ' on ' + migration)
        await knexMigrate('up', { to: '20210213233544' }, log)
      } else {
        // Already fixed VA ids, skip to v0.6.0-rc.3
        await knexMigrate('skipAll', { to: '20210213233544' })
      }
    }
  }
}

// Upgrade lock for VA bug fix (maybe needed in the future)
// TODO: refactor to split upgrade lock from upgrade lock file
class UpgradeLock {
  constructor (fileName = 'update.lock') {
    this.lockFileConfig = {}
    this.lockFilePath = path.join(configFolderDir, fileName)
    this._init()
  }

  _init () {
    if (this.isLockFilePresent) {
      this.readLockFileConfig()
    }
  }

  get isLockFilePresent () {
    return fs.existsSync(this.lockFilePath)
  }

  readLockFileConfig () {
    this.lockFileConfig = JSON.parse(fs.readFileSync(this.lockFilePath))
  }

  createLockFile (lockConfig) {
    this.lockFileConfig = lockConfig
    fs.writeFileSync(
      this.lockFilePath,
      JSON.stringify(this.lockFileConfig, null, '\t')
    )
  }

  updateLockFile (lockConfig) {
    this.createLockFile(lockConfig)
  }

  removeLockFile () {
    if (this.isLockFilePresent) {
      fs.unlinkSync(this.lockFilePath)
    }
    this.lockFileConfig = {}
  }
}

const updateLock = new UpgradeLock()

module.exports = {
  applyFix,
  updateLock
}
