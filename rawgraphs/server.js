let express = require('express')
const port = 9000
let router = express.Router()

router.get('/', function (req, res, next) {
  res.render('index', {title: 'Express'})
})

module.exports = router