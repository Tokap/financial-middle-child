require('dotenv').config();

const Twitter = require('twitter');

const STATUS_TIMELINE = 'statuses/user_timeline';


// make_twitter_client :: TwitterClient
const makeTwitterClient = () =>
  new Twitter({
    consumer_key        : process.env.TWITTER_CONSUMER_API_KEY
  , consumer_secret     : process.env.TWITTER_CONSUMER_API_SECRET
  , access_token_key    : process.env.TWITTER_ACCESS_TOKEN
  , access_token_secret : process.env.TWITTER_ACCESS_TOKEN_SECRET
  });

// makeParams :: String -> Int -> Int -> TwitterParams
const makeParams = (screen_name, user_id, post_count) => {
  return {
    screen_name : screen_name
  , user_id     : user_id
  , count       : post_count
  }
}

let my_params = makeParams('jerry', 613, 20);
let my_client = makeTwitterClient();

console.log("Consumer Key", process.env.TWITTER_CONSUMER_API_KEY);
console.log("FOO Key", process.env.FOO);

my_client.get(STATUS_TIMELINE, my_params)
  .then( (tweets) => {
    console.log(tweet);
  })
  .catch( (error) => {
    console.log(error);
  })
