var Botkit = require('botkit')

// load bot secret file
const bot_secret = require('./lib/bot-secret')

// load common bot functions
var bot = require('./lib/bot')
var gopher = new bot()
var gopher_bot_id = "606641408044171264" // shouldn't be hardcoded but is

// move this to a config file so it doesn't require a code change
var welcome_message = "Thank you for contacting $0$. We are here to help people who need it."

// setup connection to twilio
var twilio = Botkit.twiliosmsbot({
    account_sid: bot_secret.twilio_sid,
    auth_token: bot_secret.twilio_auth_token,
    twilio_number: bot_secret.twilio_number,
    debug: false
})
var twilio_send_client = require('twilio')
var twilio_send = new twilio_send_client(bot_secret.twilio_sid, bot_secret.twilio_auth_token)
var twilio_bot = twilio.spawn({})

// setup connection to discord
var discord = require('discord.js')
var discord_bot = new discord.Client()
discord_bot.login(bot_secret.welcome_secret_token)

// setup connection to the database 
var mongo_client = require('mongodb').MongoClient
var db_url = bot_secret.mongo_url

var chan_general = "574103231353847844"

discord_bot.on('channelCreate',function(channel) {
    channel.send(welcome_message)
    console.log("User greeted.")
  setTimeout(function() {
  },1000)
})


