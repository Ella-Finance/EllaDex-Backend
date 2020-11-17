const express = require("express");
const router = express.Router();
const config = require("config");
const Op = require("sequelize").Op;
const db = require("../../database/connection");
const sequelize = require("sequelize");
const Blocks = require("../../models/Blocks");
const Markets = require("../../models/Markets");
const Trades = require("../../models/Trades");
var cron = require("node-cron");
var fs = require("fs");
var Web3 = require("web3");
var infura = "https://mainnet.infura.io/v3/6ef74442fd064e4fa9bebf2ef363bc07";
// var infura = "https://ropsten.infura.io/v3/6ef74442fd064e4fa9bebf2ef363bc07";
//var infura = "https://rinkeby.infura.io/v3/6ef74442fd064e4fa9bebf2ef363bc07";
//var infura = "https://kovan.infura.io/v3/6ef74442fd064e4fa9bebf2ef363bc07";
var web3 = new Web3(infura);

var task = cron.schedule("* * * * *",  () =>  {

    Blocks.findOne({
        where: {
            blockType: "ExchangeCreated"
        },
        order: [
          ['id', 'DESC']
        ]
      }).then((data) =>{
        let blockNo = 0;
        if (data) {
          blockNo = data.dataValues.block_no;
        }
    console.log(blockNo);
    var service = JSON.parse(
        fs.readFileSync(__dirname + "/abi/service.json", "utf8")
      );
  
      var contract = new web3.eth.Contract(service.abi, service.address);
  
  
      contract
        .getPastEvents("allEvents", {
          fromBlock: blockNo + 1,
  
        })
        .then(function (events) {
            console.log(events);
            events.forEach(function (event) {
                switch (event.event) {
                    case "ExchangeCreated":
                        return Markets.create(
                            {
                              market: event.returnValues._market,
                              contract_address: event.returnValues._exchange, 
                              marketAddress: event.returnValues._base_address, 
                              tokenAddress: event.returnValues._token_address, 
                            }
                          ).then((res) => {
                            Blocks.create({block_no: event.blockNumber, blockType: "ExchangeCreated"})
                            console.log(res);
                          })
                    break;
                }
            });
        });

    });
});


router.get("/price/:address", async (req, res) => {
var exchange = JSON.parse(
  fs.readFileSync(__dirname + "/abi/exchange.json", "utf8")
);

var contract = new web3.eth.Contract(exchange.abi, req.params.address);
let price = 0;
  contract.methods.tokenPrice().call(function(err, result){
console.log(err, result);
if(!err) {
  price = web3.utils.fromWei(result.toString());
}

// price = 

res.status(200).send({ data: price });
  })
   // console.log(gas);

 
});


router.get("/trades/:market", async (req, res) => {

  const market = req.params.market;
  let queryString ='SELECT * FROM `trades` WHERE `market` = :market  ORDER BY id DESC';
 
  db.sequelize
  .query(queryString, {
    replacements: { market: market },
    type: sequelize.QueryTypes.SELECT,
  })
  .then(function (trades) {
    res.status(200).send({ data: trades });
  })
  .catch(function (err) {
    console.log(err);
    res.status(400).send({ errors: [{ msg: "No Data" }] });
  });
   
  });


  router.get("/charts/:contract/:from/:to", async (req, res) => {

    const contract = req.params.contract;
    const from = req.params.from;
    const to = req.params.to;
    let queryString ='SELECT t.grp_id, t.low, t.high, t.vol, price_min.price opening, price_max.price closed FROM (SELECT UNIX_TIMESTAMP(FROM_UNIXTIME(60*60 * (UNIX_TIMESTAMP(createdAt) DIV (60*60)))) grp_id, MIN(price) low, SUM(`value`) vol, MAX(price) high, MIN(createdAt) min_created, MAX(createdAt) max_created FROM trades WHERE market = :contract AND UNIX_TIMESTAMP(`createdAt`) BETWEEN :from AND :to GROUP BY FROM_UNIXTIME(grp_id)) t JOIN trades price_min ON price_min.createdAt = t.min_created JOIN trades price_max ON price_max.createdAt = t.max_created GROUP BY FROM_UNIXTIME(grp_id)';
   
    db.sequelize
    .query(queryString, {
      replacements: { contract: contract, from: from, to:to},
      type: sequelize.QueryTypes.SELECT,
    })
    .then(function (trades) {
      res.status(200).send({ Data: trades });
    })
    .catch(function (err) {
      
      res.status(200).send({ Response: "Error" });
    });
     
    });

module.exports = router;