const express = require('express')
const router = express.Router()
const { config } = require('../config')
const { updateLock } = require('../upgrade')
const axios = require('axios')
const pjson = require('../package.json')
const compareVersions = require('compare-versions')

// Last connection time to GitHub
// Not specific to a user
// Prevent API throttling
let lastGitHubCheck = null
let lastGitHubResponse = {
  latest_stable: null,
  latest_release: null,
  update_available: null
}

// eslint-disable-next-line no-unused-vars
router.get('/', (req, res, next) => {
  const lockReason = '新版解决了旧版扫描时将かの仔和こっこ识别为同一个人的问题，建议进行扫描以自动修复这一问题'

  const throttledResponse = {
    current: pjson.version,
    ...lastGitHubResponse,
    notifyUser: config.checkUpdate,
    lockFileExists: updateLock.isLockFilePresent,
    lockReason: updateLock.isLockFilePresent ? lockReason : null
  }

  // GitHub API for unauthenticated: 60/hour
  if (lastGitHubCheck === null) {
    // Side effect
    lastGitHubCheck = Date.now()
  } else {
    const currentTime = Date.now()
    const timeDiff = new Date(currentTime - lastGitHubCheck)
    if (timeDiff.getMinutes() < 5) {
      res.send(throttledResponse)
      return
    }
  }

  const urlLatestStable = 'https://api.github.com/repos/umonaca/kikoeru-express/releases/latest'
  const urlLatestRelease = 'https://api.github.com/repos/umonaca/kikoeru-express/releases'
  const requestLatestStable = axios.get(urlLatestStable)
  const requestLatestRelease = axios.get(urlLatestRelease)

  axios.all([requestLatestStable, requestLatestRelease])
    .then(axios.spread((responseStable, responseLatest) => {
      if (responseStable.data && responseLatest.data && responseStable.data.tag_name && responseLatest.data[0].tag_name) {
        const current = pjson.version
        const latest_stable = responseStable.data.tag_name
        const latest_release = responseLatest.data[0].tag_name
        const newVerAvailable = () => {
          if (config.checkBetaUpdate) {
            return compareVersions.compare(latest_release, current, '>')
          }
          return compareVersions.compare(latest_stable, current, '>')
        }

        // Side effect
        lastGitHubResponse = {
          latest_stable,
          latest_release,
          update_available: newVerAvailable()
        }

        res.send({
          current,
          latest_stable,
          latest_release,
          update_available: newVerAvailable(),
          notifyUser: config.checkUpdate,
          lockFileExists: updateLock.isLockFilePresent,
          lockReason: updateLock.isLockFilePresent ? lockReason : null
        })
      } else {
        // Empty result or no tag
        res.send(throttledResponse)
      }
    }))
    .catch(function () {
      res.send({ throttledResponse })
      // next(error);
    })
})

module.exports = router
