const mongo = require('mongodb').MongoClient;

var url = "mongodb://localhost:27017/mydb";
const client = require('socket.io')(3000, {
    cors: {
        origin: '*'
    }
})




//Connect to mongodb
mongo.connect(url, function(err, dataB) {
    if (err) {
        throw err;
    }
    var dbo = dataB.db("mydb");
    console.log('MongoDB is successfully connected....');


    //Connecting to socket.io
    client.on('connection', (socket) => {
        let chat = dbo.collection('chats');

        //Create fuction to send status
        sendStatus = function(s) {
                socket.emit('status', s);

            }
            //Get chats from mogo collection
        chat.find().limit(100).sort({ _id: 1 }).toArray(function(err, result) {
            if (err) {
                throw err;
            }
            //Emit the message
            socket.emit('output', result);
        });
        //Handle input events
        socket.on('input', function(data) {
                let name = data.name;
                let message = data.message;

                //Check message and name
                if (name == '' || message == '') {
                    //sends error output
                    sendStatus('Please enter a name and message');
                } else {
                    //Insert to database
                    chat.insert({ name: name, message: message }, function() {
                        client.emit('output', [data]);

                        //Send status object
                        sendStatus({
                            message: 'Message sent',
                            clear: true
                        })
                    })
                }
            })
            //Handle clear
        socket.on('clear', function(data) {
            //Remove all chats from collection
            chat.remove({}, function() {
                //Emit cleared
                socket.emit('cleared');
            })
        })
    })
});