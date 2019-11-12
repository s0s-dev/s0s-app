var Botkit = require('botkit')

// load bot secret file
const bot_secret = require('./lib/bot-secret')

// load common bot functions
var bot = require('./lib/bot')

// loaded from a config file so it doesn't require a
// code change to change the greeting and dislaimer
var welcome_file = require('./conf/welcome.json')
welcome = welcome_file.welcome

var welcome_message = welcome.greeting
var disclaimer = welcome.disclaimer

console.log(welcome_message)
console.log(disclaimer)

// setup connection to discord
var discord = require('discord.js')
var discord_bot = new discord.Client()
discord_bot.login(bot_secret.welcome_secret_token)

// setup connection to the database 
var mongo_client = require('mongodb').MongoClient
var db_url = bot_secret.mongo_url

var chan_general = "574103231353847844"

discord_bot.on('channelCreate',function(channel) {
  console.log("Channel created: " + channel.name)

  if (isNumber(channel.name)) {
    if (welcome_message) {
      channel.send(welcome_message)
      console.log("User greeted.")
    }
    if (disclaimer) {
      var disclaimer_timer = setTimeout(function() {
        channel.send(disclaimer)
        console.log("Dislaimer sent.")
      },5000)
    }
  }
})

function isNumber(num) {
  var ret_val = false
  var regex = /^[0-9]*$/g
  if (num) {
    if (num.match(regex)) {
      ret_val = true
    }
  }
  return ret_val
}
