var {items ,mod ,cat} = require('./../db/loaddb')
var express = require('express');
var router = express.Router();

//var {items ,mod} = require('./../controller/itemDAO');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

/* GET item */
router.get('/findbystore/:store', function(req, res, next) {
    if(req.params.store == 1998){
        var results = items.find();
        for(i=0;i<results.length;i++){
            delete results[i].meta
            delete results[i].$loki
        }
        res.send(results)
    }else{
        res.send('Not found data by store id');
    }

});

router.get('/findByStore/:store/item/:itemid', function(req, res, next) {
    var results = items.find({id: parseInt(req.params.itemid)});
    for(i=0;i<results.length;i++){
        delete results[i].meta
        delete results[i].$loki
    }
    res.send(results)

});

module.exports = router;