var Botkit = require('botkit')

// load bot secret file
const bot_secret = require('./lib/bot-secret')

// load common bot functions
var bot = require('./lib/bot')
var gopher = new bot()
var gopher_bot_id = "606641408044171264" // shouldn't be hardcoded but is

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
discord_bot.login(bot_secret.gopher_secret_token)

// setup connection to the database 
var mongo_client = require('mongodb').MongoClient
var db_url = bot_secret.mongo_url

var chan_general = "574103231353847844"

discord_bot.on('ready', () => {
    // locate catbot channel
    // discord_bot.user.setUsername("Gopher")

    console.log("Discord server connected.")

    chan_general = getDiscordChannelID("welcome")
    console.log(chan_general.id)

    discord_bot.guilds.forEach((guild) => {
      console.log(" - " + guild.name)

      // List all channels
      guild.channels.forEach((channel) => {
        console.log(` -- ${channel.name} (${channel.type}) - ${channel.id}`)
      })
  })
})

discord_bot.on('message', (receivedMessage) => {
  var chan = receivedMessage.channel.name
  var user = receivedMessage.author.username
  console.log(receivedMessage.author.username + " : " + receivedMessage.author.id)

  var chatlog = {}
  chatlog.channel = receivedMessage.channel.name
  chatlog.author = receivedMessage.author.username
  chatlog.message = receivedMessage.content
  chatlog.date = Date.now()

  gopher.insertDataMongo(chatlog,"discord","messages")

  if (chan == "welcome") {

  } else {
    // extract numbers, no letters
    var only_numbers = /[0-9]/g
    var found = chan.match(only_numbers)

    console.log("Sending message to " + found.toString())

    if (found) {
      var twilio_send_number = "+" + found.toString()
      // don't duplicate messages
      if (receivedMessage.author.id != gopher_bot_id) {
          twilio_send.messages.create({
              "body": receivedMessage.content,
              "to": twilio_send_number,  // Text this number
              "from": '+1' + bot_secret.twilio_number // From a valid Twilio number
          })
          .then((message) => console.log(message.sid))

          // log outgoing messages to database
          // var db_log_msg = JSON.parse(receivedMessage.content)
         // gopher.insertDataMongo(db_log_msg,"twilio","discord")
      }
    }
  }
})


twilio.setupWebserver(5000, function(err, server) {
    server.get('/', function(req, res) {
        res.send('$0$.')
    })

    twilio.createWebhookEndpoints(server, twilio_bot, function() {
        console.log('Server is online!')
    })
})

twilio.hears('.*', 'message_received', function(twilio_bot, message) {
    // Send this to discord and save the whole message to mongo
    var phone_number = message.from.replace("+","")
    var formatted = phone_number + ": " + message.text

    // change username to phone number for reply
    // discord_bot.user.setUsername(phone_number)

    // get channel matching user, create it if it doesn't exist
    var chan_user = getDiscordChannelID(phone_number)    
    if (!(chan_user)) {
        discord_bot.guilds.forEach((guild) => {
            // create a new discord channel and post first message  
            // to the #welcome channel so it's not lost

            if (guild.name == "$0$") {
                var tmp_channel = createDiscordChannel(guild,phone_number).then(
                    firstMessageToWelcomeChannel(phone_number,message.text)
                )
            }
        })
    } else {
        // channel exists already
        chan_user.send(message.text)
    }

    gopher.insertDataMongo(message,"twilio","messages")
    console.log(formatted)
})

// general functions

// get a discord channel by name 
function getDiscordChannelID(name) {
    var retVal = 0
    discord_bot.guilds.forEach((guild) => {
		guild.channels.forEach((channel) => {
			if (channel.name.includes(name)) {
				retVal  = channel
			}
		})
    })
    return retVal
}

// create a new discord channel
function createDiscordChannel(guild,channel_name) {
    return new Promise(function(resolve, reject) {

        guild.createChannel(channel_name,{type: "text",parent: "606681129503948802"},function(err) {
            if (err) {
                reject(err)
            } else {
                resolve("CHANNEL CREATED")
            }
        })
    })
}

// Post the first message from a user to the welcome channel
// since they can't post to their own channel yet as it's
// currently being created.
function firstMessageToWelcomeChannel(phone_number,message) {
    // Use user details from here
    var chan_welcome = getDiscordChannelID("welcome")
    var formatted = "<" + phone_number + "> " + message
    if (chan_welcome) {
        chan_welcome.send(formatted)
    }
}


