var legacy = require('legacy-encoding');
var async = require('async');
var loki = require('lokijs');
var meminfo = require('./../util/men');
var config = require('./../config/config');


//Create database
var db = new loki(config.siteid+'.db');

const ITM = 'ITM';
const MOD = 'MOD';
const CAT = 'CAT';
const CIT = 'CIT';
const dbfpath = '/Users/Macbook/Documents/minor/Lab/PZ/Aloha/DATA/';

var items = db.getCollection(ITM);
var mod = db.getCollection(MOD);
var cat = db.getCollection(CAT);
var cit = db.getCollection(CIT);

/***
  Format

  CAT
  { id: 9902,
    name: 'MD PASTA DINE IN',
    sale: 'Y',
    items: [ 629, 630, 711024, 711035, 711041, 711042 ],
    meta: { revision: 0, created: 1550138916277, version: 0 },
    '$loki': 100 }

 ITEMS
 { id: 970,
  shortname: '<D399(M+Sp+GB)',
  longname: '<D399(M+Spa+4w+GB)',
  tax: 1,
  price: 399,
  cat: 100,
  mods: [ 10556, 10496, 10450, 10452 ],
  meta:
   { revision: 3,
     created: 1550140020301,
     version: 0,
     updated: 1550140020562 },
  '$loki': 51 }

 MOD
 { id: 11068,
    shortname: 'M CT PZ#',
    longname: 'M CT PZ#',
    items: [ 677, 942, 731065, 740006, 740010 ],
    meta: { revision: 0, created: 1550140433324, version: 0 },
    '$loki': 100 }

 */

function databaseInitialize() {
    if (!db.getCollection(ITM)) {
        items = db.addCollection(ITM);
    }

    if (!db.getCollection(MOD)) {
        mod = db.addCollection(MOD);
    }

    if (!db.getCollection(CAT)) {
        cat = db.addCollection(CAT);
    }

    if (!db.getCollection(CIT)) {
        cit = db.addCollection(CIT);
    }
}

function saveDb() {
    db.saveDatabase();
}

function loadDb() {
    //db.saveDatabase();
}

/**
 * Start process
 * **/

meminfo('before load db')

//Create DB
databaseInitialize();

//load DBF
var DBFFile = require('dbffile');

//Function
function translateTH(text) {
    const buf = Buffer.from(text, 'utf8');
    return legacy.decode(buf, 'win874');
}

function insert(documents,row){
    if(documents == ITM){
        items.insert(row)
    }
    if(documents == CIT){
        cit.insert(row)
    }
    if(documents == CAT){
        cat.insert(row)
    }
    if(documents == MOD){
        mod.insert(row)
    }
}

function aggregateMod(row){
    //ITM row
    var mods = []
    if(row.MOD1 > 0){
        mods.push(row.MOD1)
    }
    if(row.MOD2 > 0){
        mods.push(row.MOD2)
    }
    if(row.MOD3 > 0){
        mods.push(row.MOD3)
    }
    if(row.MOD4 > 0){
        mods.push(row.MOD4)
    }
    if(row.MOD5 > 0){
        mods.push(row.MOD5)
    }
    if(row.MOD6 > 0){
        mods.push(row.MOD6)
    }
    if(row.MOD7 > 0){
        mods.push(row.MOD7)
    }
    if(row.MOD8 > 0){
        mods.push(row.MOD8)
    }
    if(row.MOD9 > 0){
        mods.push(row.MOD9)
    }
    if(row.MOD10 > 0){
        mods.push(row.MOD10)
    }
    return mods;
}

function aggregateItemByCat(row){
    var items = []
    var results = cit.find({catid: row.ID})
    //console.log(results[10].itemid)
    var i;
    for(i=0; i<results.length;i++){
        items.push(results[i].itemid)
    }
    return items
}

function setCategoryOnItem(catid ,itemid){
    var itemObj = items.findOne({id: itemid});
    itemObj.cat = catid
    items.update(itemObj)
}

function aggregateItemByMod(row){
    var itms = []
    var itemsObj = items.find({mods: { '$contains' : row.ID} })
    var i;
    for(i=0; i<itemsObj.length;i++){
        itms.push(itemsObj[i].id)
    }
    return itms
}

async.waterfall([
    function(callback) {
        DBFFile.open(dbfpath + 'ITM.DBF')
            .then(dbf => {
                console.log('loaded ITM.DBF')
                var recordCount = dbf.recordCount;
                return dbf.readRecords(recordCount);
            }).then(rows => {
                //console.log('Inserting rows into items')
                rows.forEach(row => {
                    insert(ITM,{
                        id:row.ID,
                        shortname:translateTH(row.SHORTNAME),
                        longname:translateTH(row.LONGNAME),
                        //shortname:row.SHORTNAME,
                        //longname:row.LONGNAME,
                        tax:row.TAXID,
                        price:row.PRICE,
                        cat: {},
                        mods: aggregateMod(row)
                    });
                    return true;
                })
                //console.log('Inserted rows into items')
            }).then(next => {
                callback(null, 'CIT')
            }).catch(err => {
                console.log('An error occurred: ' + err)
            });
    },
    function(step,  callback) {
        console.log(items.find()[280])
        DBFFile.open(dbfpath + 'CIT.DBF')
            .then( dbf => {
                console.log('loaded CIT.DBF')
                return dbf.readRecords(dbf.recordCount)
            }).then( rows =>{
                //console.log('Inserting rows into cit')
                rows.forEach(row =>{
                    insert(CIT,{
                        catid: row.CATEGORY,
                        itemid: row.ITEMID
                    })
                    setCategoryOnItem(row.CATEGORY,row.ITEMID)
                    return true;
                })
                //console.log('Inserted rows into cit')
            }).then(nexr => {
                callback(null, 'CAT')
            }).catch(err => {
                console.log('An error occurred: ' + err)
            });

    },
    function(step, callback) {
        DBFFile.open(dbfpath + 'CAT.DBF')
            .then( dbf => {
                console.log('loaded CAT.DBF')
                return dbf.readRecords(dbf.recordCount);
            }).then( rows =>{
                rows.forEach(row => {
                    insert(CAT, {
                        id: row.ID,
                        name: row.NAME,
                        sale: row.SALES,
                        items: aggregateItemByCat(row)
                    })
                })
                return true
            }).then(next => {
                callback(null, 'MOD')
            }).catch(err => {
                console.log('An error occurred: ' + err)
            });

    },
    function(step, callback) {
        DBFFile.open(dbfpath + 'MOD.DBF')
            .then( dbf => {
                console.log('loaded MOD.DBF')
                return dbf.readRecords(dbf.recordCount);
            }).then( rows =>{
            rows.forEach(row => {
                insert(MOD, {
                    id: row.ID,
                    shortname: row.SHORTNAME,
                    longname: row.LONGNAME,
                    items: aggregateItemByMod(row)
                })
            })
            return true
        }).then(next => {
            callback(null, 'setupcompleted')
        }).catch(err => {
            console.log('An error occurred: ' + err)
        });

    }

], function (err, result) {
    if(err) console.error(err)

    if(result == 'setupcompleted'){
        saveDb();
        console.log('items count='+items.find().length)
        console.log('category count='+cat.find().length)
        console.log('modifier count='+mod.find().length)
        meminfo('loaded db')
    }


})

module.exports = {items ,mod ,cat}