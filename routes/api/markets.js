const express = require("express");
const router = express.Router();
const config = require("config");
const Op = require("sequelize").Op;
const db = require("../../database/connection");
const sequelize = require("sequelize");



router.get("/", async (req, res) => {
  
    let queryString ='SELECT Min(t.price) AS low, SUM(t.value) AS vol, Max(t.price) AS high, Min(t.createdAt) min_created, Max(t.createdAt) max_created, w.price closed, t.price price, markets.market FROM markets left join trades t ON t.market = markets.contract_address AND t.createdAt >= Now() - interval 232 day left join prices w ON t.market = w.ticker GROUP BY t.market ORDER BY Max(t.price) DESC';
   
    db.sequelize
    .query(queryString, {
      type: sequelize.QueryTypes.SELECT
    })
    .then(function (markets) {
      res.status(200).send({ data: markets });
    })
    .catch(function (err) {
      console.log(err);
      res.status(400).send({ errors: [{ msg: "No Data" }] });
    });
  });


  router.get("/ticker/:token/:base", async (req, res) => {
    const market = req.params.token.toUpperCase()+"/"+req.params.base.toUpperCase();
    let queryString ='SELECT m.market, l.price, m.marketAddress, m.tokenAddress, m.contract_address,  MIN(t.price) low, MAX(t.price) high, '+
    'MAX(t.createdAt) lastDate FROM `markets` m '+
    'LEFT JOIN trades t ON m.contract_address = t.market '+
    'LEFT JOIN ( SELECT price, market, createdAt '+
                  ', MAX(createdAt) AS latest '+
               'FROM trades '+
             'GROUP '+
                ' BY market ) AS lastPrice '+
        ' ON lastPrice.market = m.contract_address '+
       'LEFT '+ 
      'JOIN trades l '+
     'ON m.contract_address = lastPrice.market '+
      ' AND l.createdAt = lastPrice.latest '+
      ' WHERE m.market = :market '+
    'GROUP BY m.market ORDER BY lastDate DESC';
   
    db.sequelize
    .query(queryString, {
      replacements: { market: market },
      type: sequelize.QueryTypes.SELECT,
    })
    .then(function (markets) {
      res.status(200).send({ data: markets });
    })
    .catch(function (err) {
      console.log(err);
      res.status(400).send({ errors: [{ msg: "No Data" }] });
    });
  });


  router.get("/balances/:owner", async (req, res) => {
    const owner = req.params.owner;
    let queryString ='SELECT `markets`.`market` AS name, '+
    ' `markets`.`contract_address`, `markets`.`marketAddress`, `markets`.`tokenAddress`, '+ 
    ' `savings`.`market`, '+
    ' `savings`.`token` '+
    ' FROM   `markets` '+
    ' LEFT JOIN `savings` '+ 
          ' ON `markets`.`contract_address` = `savings`.`contract` '+
            '  AND `savings`.`owner` = :owner '+
    '  ORDER  BY ( `savings`.`market` + `savings`.`token` ) DESC';
   
    db.sequelize
    .query(queryString, {
      replacements: { owner: owner },
      type: sequelize.QueryTypes.SELECT,
    })
    .then(function (balaces) {
      res.status(200).send({ data: balaces });
    })
    .catch(function (err) {
      console.log(err);
      res.status(400).send({ errors: [{ msg: "No Data" }] });
    });
  });


module.exports = router;