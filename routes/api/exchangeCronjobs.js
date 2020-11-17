const express = require("express");
const router = express.Router();
const config = require("config");
const Op = require("sequelize").Op;
const db = require("../../database/connection");
const sequelize = require("sequelize");
const ExxBlocks = require("../../models/ExxBlocks");
const Markets = require("../../models/Markets");
const Savings = require("../../models/Savings");
const Prices = require("../../models/Prices");
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
 
  Markets.findAll().then(function (markets) {
    
    for (let index = 0; index < markets.length; index++) {
      const element = markets[index];
      ExxBlocks.findOne({
        where: {
            blockType: "Saved"
        },
        order: [
          ['id', 'DESC']
        ]
      }).then((data) =>{
        let blockNo = 0;
        if (data) {
          blockNo = data.dataValues.block_no;
        }

        var exchange = JSON.parse(
          fs.readFileSync(__dirname + "/abi/exchange.json", "utf8")
        );

        var contract = new web3.eth.Contract(exchange.abi, element.contract_address);
        contract
        .getPastEvents("allEvents", {
          fromBlock: blockNo + 1,
  
        })
        .then(function (events) {
          events.forEach(function (event) {
console.log(event);
            switch (event.event) {
              case "Saved":
             
              Savings.findOne({
                where: {
                  contract: event.returnValues._contract,
                  owner: event.returnValues._owner
                },
               
              }).then((data) =>{

                if(data){
                  //Model.decrement(['field', '2'], { where: { id: model_id } });
                  if(event.returnValues._isMarket == true){
                    //['market', parseFloat(web3.utils.fromWei(event.returnValues._amount.toString()))]
                    Savings.increment({market:parseFloat(web3.utils.fromWei(event.returnValues._amount.toString()))}, { where: { contract: element.contract_address, owner:  event.returnValues._owner} }).
                    then((data =>{
                      ExxBlocks.create({exchange: element.contract_address, block_no: event.blockNumber, blockType: "Saved"})
                    }));
                  }else{
                    Savings.increment({token:parseFloat(web3.utils.fromWei(event.returnValues._amount.toString()))}, { where: { contract: element.contract_address, owner:  event.returnValues._owner} }).
                    then((data =>{
                      ExxBlocks.create({exchange: element.contract_address, block_no: event.blockNumber, blockType: "Saved"})
                    }));
                  }
                 
                  
                }else{
                  
                  let create;
                  if(event.returnValues._isMarket == true){
                    create = {
                      market: web3.utils.fromWei(event.returnValues._amount.toString()),
                      token: 0,
                      contract: element.contract_address,
                      owner: event.returnValues._owner,
                      countDown: new Date(event.returnValues._duration * 1000),
                      countDown2: new Date(event.returnValues._duration * 1000)
                    }
                  }else {
                    create = {
                      market: 0,
                      token: web3.utils.fromWei(event.returnValues._amount.toString()),
                      contract: element.contract_address,
                      owner: event.returnValues._owner,
                      countDown: new Date(event.returnValues._duration * 1000),
                      countDown2: new Date(event.returnValues._duration * 1000)
                    }
                  }

                  Savings.create(
                    create
                  ).then((res) => {
                    ExxBlocks.create({exchange: element.contract_address, block_no: event.blockNumber, blockType: "Saved"})
                    console.log(res);
                  })
                }
              })
              

                break;

     
            }
          });
        });

      });
      
    }
}).catch(function(err) {
   console.log("error", err);
});
    
});





var Withdrew = cron.schedule("* * * * *",  () =>  {
 
  Markets.findAll().then(function (markets) {
    
    for (let index = 0; index < markets.length; index++) {
      const element = markets[index];
      ExxBlocks.findOne({
        where: {
            blockType: "Withdrew"
        },
        order: [
          ['id', 'DESC']
        ]
      }).then((data) =>{
        let blockNo = 0;
        if (data) {
          blockNo = data.dataValues.block_no;
        }

        var exchange = JSON.parse(
          fs.readFileSync(__dirname + "/abi/exchange.json", "utf8")
        );

        var contract = new web3.eth.Contract(exchange.abi, element.contract_address);
        contract
        .getPastEvents("allEvents", {
          fromBlock: blockNo + 1,
  
        })
        .then(function (events) {
          events.forEach(function (event) {

            switch (event.event) {
              case "Withdrew":
             
              Savings.findOne({
                where: {
                  contract: event.returnValues._contract,
                  owner: event.returnValues._owner
                },
               
              }).then((data) =>{

                if(data){
                  //Model.decrement(['field', '2'], { where: { id: model_id } });
                  if(event.returnValues._isMarket == true){
                    //['market', parseFloat(web3.utils.fromWei(event.returnValues._amount.toString()))]
                    Savings.decrement({market:parseFloat(web3.utils.fromWei(event.returnValues._amount.toString()))}, { where: { contract: element.contract_address, owner:  event.returnValues._owner} }).
                    then((data =>{
                      ExxBlocks.create({exchange: element.contract_address, block_no: event.blockNumber, blockType: "Saved"})
                    }));
                  }else{
                    Savings.decrement({token:parseFloat(web3.utils.fromWei(event.returnValues._amount.toString()))}, { where: { contract: element.contract_address, owner:  event.returnValues._owner} }).
                    then((data =>{
                      ExxBlocks.create({exchange: element.contract_address, block_no: event.blockNumber, blockType: "Saved"})
                    }));
                  }
                 
                  
                }else{
                  
                  
                }
              })
              

                break;
            }
          });
        });

      });
      
    }
}).catch(function(err) {
   console.log("error", err);
});
    
});



var Bought = cron.schedule("* * * * *",  () =>  {
 
  Markets.findAll().then(function (markets) {
    
    for (let index = 0; index < markets.length; index++) {
      const element = markets[index];
      ExxBlocks.findOne({
        where: {
            blockType: "Bought"
        },
        order: [
          ['id', 'DESC']
        ]
      }).then((data) =>{
        let blockNo = 0;
        if (data) {
          blockNo = data.dataValues.block_no;
        }

        var exchange = JSON.parse(
          fs.readFileSync(__dirname + "/abi/exchange.json", "utf8")
        );

        var contract = new web3.eth.Contract(exchange.abi, element.contract_address);
        contract
        .getPastEvents("allEvents", {
          fromBlock: blockNo + 1,
  
        })
        .then(function (events) {
          events.forEach(function (event) {

            switch (event.event) {
              case "Bought":
             
                let create = {
                  price:  web3.utils.fromWei(event.returnValues._price.toString()),
                  amount: web3.utils.fromWei(event.returnValues._value.toString()),
                  value: web3.utils.fromWei(event.returnValues._amount.toString()),
                  market: event.returnValues._market,
                  isBase: event.returnValues.isMarket,
                  createdAt: new Date(event.returnValues.time * 1000),
                 
                }
              

              Trades.create(
                create
              ).then((res) => {
                let create = {
                  price:  web3.utils.fromWei(event.returnValues._price.toString()),
                  ticker: element.contract_address
               
                }
                Prices
        .findOne({ ticker: element.contract_address })
        .then(function(obj) {
            // update
            if(obj){
              obj.update(create);
            }else{
              Prices.create(create);
            }

            ExxBlocks.create({exchange: element.contract_address, block_no: event.blockNumber, blockType: "Bought"})
    
           
             
        })
                
                
                
               
                
              })
              

                break;
            }
          });
        });

      });
      
    }
}).catch(function(err) {
   console.log("error", err);
});
    
});



module.exports = router;