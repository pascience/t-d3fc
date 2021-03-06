'use strict';

const winston = require('winston');
const Twitter = require('twitter');
const cache = require('./cache');
const parse = require('./parse');
const uniq = require('uniq');

const searchTerm = 't.d3fc.io';

const client = new Twitter({
  consumer_key: process.env.consumer_key,
  consumer_secret: process.env.consumer_secret,
  access_token_key: process.env.access_token_key,
  access_token_secret: process.env.access_token_secret
});

module.exports = () => {
  winston.info('Updating search results');
  client.get(
    'search/tweets',
    { q: searchTerm, count: 100 },
    (error, tweets, response) => {
      if (error) {
        return winston.warn(error);
      }
      winston.info('Search completed', tweets.statuses.length);
      const statuses = tweets.statuses
        .filter((status) => !status.retweeted_status)
        .map(parse);
      const validStatuses = statuses.filter((status) => status.es5);
      winston.info('Valid statuses', validStatuses.length);
      const existingStatuses = cache.statuses();
      winston.info('Existing statuses', validStatuses.length);
      const mergedStatuses = uniq(
        existingStatuses ? validStatuses.concat(cache.statuses()) : validStatuses,
        (a, b) => b.id_str.localeCompare(a.id_str)
      );
      cache.statuses(mergedStatuses);
      winston.info('Merged statuses', mergedStatuses.length);
    }
  );
};
