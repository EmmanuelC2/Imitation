if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}

const https = require('https');
const path = require('path')
const express = require('express');
const passport = require('passport');
const flash = require('express-flash');
const session = require('express-session');
const methodOverride = require('method-override');
const fs = require('fs');
const bodyParser = require('body-parser');

const initializePassport = require('./passport-config');
initializePassport(
    passport,
    name => users.find(user => user.name === name),
    id => users.find(user => user.id === id),
);

const bcrypt = require('bcrypt');
const users = [];

const port = process.env.PORT || 5000;

const app = express();

app.set('view-engine', 'ejs');

app.use(express.static(path.join(__dirname, 'public')));

app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
}));

app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride('_method'));

app.get('/', (req, res) => {
    res.redirect('/login');
});

app.get('/login', checkNotAuthenticated, (req, res) => {
    res.render('login.ejs');
    //res.sendFile(path.resolve(__dirname, "public", "login.ejs"));
});

app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
    successRedirect: '/index',
    failureRedirect: '/login',
    failureFlash: true,
}));

app.get('/register', checkNotAuthenticated, (req, res) => {
    res.render('register.ejs');
    //res.sendFile(path.resolve(__dirname, "public","views", "register.html"));
});

app.post('/register', checkNotAuthenticated, async (req, res) => {
    try {

        const hashedPassword = await bcrypt.hash(req.body.password, 10);

        users.push({
            id: Date.now().toString(),
            name: req.body.name,
            email: req.body.email,
            password: hashedPassword
        });

        console.log(users);

        res.redirect("/login");

    } catch {
        res.redirect("/register");
    }
});

app.get('/index', checkAuthenticated, (req, res) => {
    res.sendFile(path.resolve(__dirname, "public", "views", "index.html"));
});

app.delete('/logout', (req, res, next) => {
    req.logout(function (err) {
        if (err) { return next(err); }
        res.redirect('/login');
    });
});

function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login');
}

function checkNotAuthenticated(req, res, next) {

    if (req.isAuthenticated()) {
        return res.redirect('/index');
    }

    next();
}

const options = {
    key: fs.readFileSync('key.pem'),
    cert: fs.readFileSync('cert.pem')
}

https.createServer(options, app).listen(port, () => console.log("Server started on port: ", port));

const { PythonShell } = require('python-shell');

//blob upload
const multer = require('multer');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, process.env.PATH_TO_RECORDINGS);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '.mpeg');
    }
})

const upload = multer({ storage: storage });

const type = upload.single('upl');

//convert mpeg to mp3
const ffmpeg = require("ffmpeg");
const { unlink } = require('fs');

let audioCounter = 0;
let textCounter = 0;

//text to speech google cloud
const textToSpeech = require('@google-cloud/text-to-speech');
const util = require('util');

const client = new textToSpeech.TextToSpeechClient();

//CHATGPT3 
const { Configuration, OpenAIApi } = require("openai");
const { resolve } = require('path');

const configuration = new Configuration({
    organization: process.env.ORGANIZATION,
    apiKey: process.env.OPENAI_API_KEY
});

const openai = new OpenAIApi(configuration);

let whisperTxt = '';
let gptTxt = '';
let audio = '';

app.post('/sendText', async (req,res) =>{

    try {
        
        let userTxt = req.body.text;

        const completion = await openai.createCompletion({
            model: "text-davinci-003",
            prompt: userTxt,
            max_tokens: 100,
        });

        let gptRes = completion.data.choices[0].text

        gptTxt = gptRes;

        let newGPTTxt = await gptTxt.replace(/\n+/g, '');

        res.send(JSON.stringify(newGPTTxt));

    } catch (error) {

        console.log("ChatGPT error: ", error);
        res.send(JSON.stringify('Error'));
    }

});

app.post('/sendAudio', type, (req, res) => {

    try {
        audio = path.join(req.file.destination, "file" + audioCounter.toString() + ".mp3");

        let mpegToMp3 = new ffmpeg(req.file.path);

        mpegToMp3.then(function (video) {
            // Callback mode
            video.fnExtractSoundToMP3(audio, function (error, file) {
                if (!error){
                    audioCounter++;
                    unlink(req.file.path, (error) => {
                        if (error) throw error;
                    }); 
                    res.send('done');
                }
            });

        }, function (err) {
            console.log('Error: ' + err);
        });

    } catch (e) {
        console.log(e.code);
        console.log(e.msg);
    }

});

app.get('/reqUserText', (req, res) => {

    const options = {
        mode: 'text',
        pythonPath: process.env.PATH_TO_PYTHON,
        scriptPath: process.env.SCRIPT_PATH,
        args: [audio]
    }

    PythonShell.run('main.py', options, function (err, results) {

        if (err) { throw err; }

        if(results == null || results == undefined || results[0] == ""){

            whisperTxt = "";
            let text = "No Audio";
            unlink(audio, (error) => {
                if (error) throw error;
            }); 
            audioCounter--;
            res.send(JSON.stringify(text));

        }else{

            whisperTxt = results[0];

            res.send(JSON.stringify(whisperTxt));

        }
        
    });
});

app.get('/reqGPTText', async (req, res) => {

    try {

        const completion = await openai.createCompletion({
            model: "text-davinci-003",
            prompt: whisperTxt,
            max_tokens: 100,
        });

        let gptRes = completion.data.choices[0].text

        gptTxt = gptRes;

        res.send(JSON.stringify(gptTxt));

    } catch (error) {

        console.log("ChatGPT error: ", error);
        res.send(JSON.stringify('Error'));
    }
});

const sdk = require('microsoft-cognitiveservices-speech-sdk');
const readline = require('readline');

app.get('/reqGoogleAudio', async (req, res) => {

    let ttsPath = path.join("tts", "output" + textCounter.toString() + ".mp3");

    textCounter++;

    //GOOGLE TTS 
    // const request = {
    //     input: { text: gptTxt },
    //     voice: { languageCode: 'en-US', ssmlGender: 'NEUTRAL' },
    //     audioConfig: { audioEncoding: 'MP3' },
    // };

    // const [response] = await client.synthesizeSpeech(request);

    // const writeFile = util.promisify(fs.writeFile);

    // await writeFile(ttsPath, response.audioContent, 'binary');

    // res.sendFile(path.join('process.env.PATH_TO_PROJECT', ttsPath));

    //MICROSOFT TTS
    var audioFile = ttsPath;
    // This example requires environment variables named "SPEECH_KEY" and "SPEECH_REGION"
    const speechConfig = sdk.SpeechConfig.fromSubscription(process.env.SPEECH_KEY, process.env.SPEECH_REGION);
    const audioConfig = sdk.AudioConfig.fromAudioFileOutput(audioFile);

    // The language of the voice that speaks.
    speechConfig.speechSynthesisVoiceName = "en-US-RogerNeural";
    speechConfig.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.mp3

    // Create the speech synthesizer.
    const synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);
    
    synthesizer.speakTextAsync(
        gptTxt,
        result => {
            //const audioData = result.audioData;
            res.sendFile(path.join(process.env.PATH_TO_PROJECT, ttsPath));
            console.log("Cycle Complete");
            synthesizer.close();
        },
        error => {
            console.log(error);
            synthesizer.close();
        }
    )

    

    
});

