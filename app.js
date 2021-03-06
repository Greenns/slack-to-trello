var express = require('express');
var bodyParser = require('body-parser');
var Trello = require('node-trello');
var Slack = require('node-slack');

var trello = new Trello(process.env.TRELLO_KEY, process.env.TRELLO_TOKEN);
var slack = new Slack(process.env.SLACK_HOOK_URL,'');

var app = express();
var port = process.env.PORT || 3000;
var getChannel = process.env.SLACK_CHANNEL;

app.use(bodyParser.urlencoded({ extended: true }));

function postToTrello(listId, command, text, cb) {
    if (text == undefined || text == null || text == "") {
        throw new Error('Le format est ' + command + ' nom | description (optionelle)');
    }

    var name_and_desc = text.split('|');

    var card_data = {
        'name' : name_and_desc.shift(),
        'desc' : name_and_desc.shift()
    };

    trello.post('/1/lists/' + listId + '/cards', card_data, cb);
}

function sendNotif(msg, user, url, card_data) {
     slack.send({
          text: 'Nouveau bug signalé:',
          channel: getChannel,
          username: 'UHBot',
          attachments: [{"pretext": "", "text": "" + msg + "\r\n" + card_data + "\r\n", "color":"#F35A00", "fields": [{"title": "Signalé par:", "value": "" + user + "", "short": "false"}, {"title": "Lien:", "value": "" + url + "", "short": "true"}, {"title": "Priorité:", "value": "Indéterminé", "short": "true"}]}],
          icon_url: 'http://img15.hostingpics.net/pics/834337TechnicalSupport64.png'
     });
}

app.post('/*', function(req, res, next) {
    var listId = req.params[0];
    var command = req.body.command,
        text = req.body.text,
        user = req.body.user_name;

    postToTrello(listId, command, text, function(err, data) {
        if (err) throw err;
        console.log(data);

        var name = data.name;
        var url = data.shortUrl;

        console.log('> ' + name);
        sendNotif(name, user, url);

        res.status(200).send('Bug "' + name + '" signal\351 ici: <' + url + '>');
    });
});

// test route
app.get('/', function (req, res) {
   res.status(200).send('Slack to Trello !')
});

// error handler
app.use(function (err, req, res, next) {
    console.error(err.stack);
    res.status(400).send('Error: ' + err.message);
});

app.listen(port, function () {
    console.log('Demarrage de slack-to-trello sur le port : ' + port);
});
