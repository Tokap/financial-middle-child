'use strict';

const R        = require('ramda')
const Bluebird = require('bluebird')
const Finance  = Bluebird.promisifyAll(require('google-finance'))
const Moment   = require('moment')
const PgGet    = require('../postgres/get.js')

const HISTORY_START_DATE = '2015-01-01'
const HISTORY_END_DATE = Moment().format('YYYY-MM-DD')
const NASDAQ = 'NASDAQ'
const NYSE = 'NYSE'

const STOCK_TICKET_FORMAT = /\b[A-Z]{3,4}\b/g

const MAX_CONCURRENCY = { concurrency: 4 }

// _containsStockTicket :: String -> Bool
const _containsStockTicket = R.test(STOCK_TICKET_FORMAT);

// postHasStockTicket :: StoredTwitterPost -> Bool
const postHasStockTicket = R.compose(_containsStockTicket, R.prop('text'))

// _getStockTickets :: String -> List String
const _getStockTickets = R.match(STOCK_TICKET_FORMAT)

// _getTicketsFromPost :: StoredTwitterPost -> List String
const _getTicketsFromPost = R.compose(_getStockTickets, R.propOr('', 'text'))

// getPriceHistory :: Date -> Date -> String -> String -> List StockDetailsApi
const getPriceHistory = R.curry( (start_date, end_date, exchange, symbol) => {
  return Finance.historical({
    symbol: `${exchange}:${symbol}`
  , from: start_date
  , to: end_date
  })
})

// getStandardHistory :: String -> String -> List StockDetailsApi
const getStandardHistory =
  getPriceHistory(HISTORY_START_DATE, HISTORY_END_DATE)


// NOTE: Hits Finance API and will be throttled/blocked if reqs too rapid
// validateStockTicket :: String -> Bool
const validateStockTicket = (symbol) => {
  let end = Moment().format("YYYY-MM-DD")
  let start = Moment().subtract(10, 'day').format("YYYY-MM-DD")

  return getPriceHistory(start, end, NASDAQ, symbol)
  .then(R.compose(R.not, R.isEmpty))
}

// _validPostOrNull :: StoredTwitterPost -> Maybe StoredTwitterPost
const _validPostOrNull = (post) => {
  let tickets = _getTicketsFromPost(post)
  return Bluebird.map(tickets, validateStockTicket, MAX_CONCURRENCY)
  .then( (bools) => {
    if (R.contains(true, bools)) {
      return post
    }
    else {
      return null
    }
  })
}

// NOTE: Hits Finance API and will be throttled/blocked if reqs too rapid
// validateTicketsInPosts :: List StoredTwitterPost -> List StoredTwitterPost
const validateTicketsInPosts = (posts) =>
  Bluebird.map(posts, _validPostOrNull)
  .then(R.reject(R.isNil))

// getNews :: String -> String -> List StockNews
const getNews = (exchange, symbol) =>
  Finance.companyNews( {symbol: `${exchange}:${symbol}`} )


module.exports = {
  getNews
, getPriceHistory
, getStandardHistory
, postHasStockTicket
, validateStockTicket
, validateTicketsInPosts

// Exported for testing
, _containsStockTicket
, _getStockTickets
, _getTicketsFromPost
, _validPostOrNull
}
