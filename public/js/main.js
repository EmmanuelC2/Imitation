// const canvas = document.querySelector('canvas');

// const engine = new BABYLON.Engine(canvas, true);

// const createScene = function () {
//     const scene = new BABYLON.Scene(engine);

//     const camera = new BABYLON.ArcRotateCamera("camera0", 2.95, 1.8, -28, new BABYLON.Vector3(0, 10, 4), scene);

//     const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
//     light.intensity = 0.7;

//     BABYLON.SceneLoader.Append("./char/", "Blacksmith_AmM_SK.obj", scene, function (scene) {
//         scene.meshes.forEach((m) => m.scaling = new BABYLON.Vector3(0.1, 0.1, 0.1));
//     });

//     return scene;
// }

// const scene = createScene();

// engine.runRenderLoop(function () {
//     scene.render();
// });

// window.addEventListener("resize", function () {
//     engine.resize();
// });

//View
var microphoneButton = document.getElementsByClassName("start-recording-button")[0];

var recordingControlButtonsContainer = document.getElementsByClassName("recording-contorl-buttons-container")[0];

var stopRecordingButton = document.getElementsByClassName("stop-recording-button")[0];

var cancelRecordingButton = document.getElementsByClassName("cancel-recording-button")[0];

var audioElement = document.getElementsByClassName("audio-element")[0];

var audioElementSource = document.getElementsByClassName("audio-element")[0].getElementsByTagName("source")[0];

var textIndicatorOfAudiPlaying = document.getElementsByClassName("text-indication-of-audio-playing")[0];

var chatUL = document.getElementById('chat-ul');
var chatArea = document.getElementById('chat-area');
var textBoxValue = document.getElementById('textbox').value;

var azureTTSVoice = document.getElementById('tts-voices').value;


// //Listeners
// let currentlyRecording = false;

// document.addEventListener("keydown", function (event) {
//     if (event.keyCode == 32 && !currentlyRecording) {
//         console.log("start recording")
//         currentlyRecording = true;
//         startAudioRecording();

//     } else if (event.keyCode == 32) {
//         console.log("stop recording")
//         currentlyRecording = false;
//         stopAudioRecording();
//     }

// });

//Listen to start recording button
microphoneButton.onclick = startAudioRecording;

//Listen to stop recording button
stopRecordingButton.onclick = stopAudioRecording;

//Listen to cancel recording button
cancelRecordingButton.onclick = cancelAudioRecording;

//Listen to when the audio being played ends
audioElement.onended = hideTextIndicatorOfAudioPlaying;

/** Displays recording control buttons */
function handleDisplayingRecordingControlButtons() {
    //Hide the microphone button that starts audio recording
    microphoneButton.style.display = "none";

    //Display the recording control buttons
    recordingControlButtonsContainer.classList.remove("hide");

}

/** Hide the displayed recording control buttons */
function handleHidingRecordingControlButtons() {

    //Hide the recording control buttons
    recordingControlButtonsContainer.classList.add("hide");

}

/** Creates a source element for the the audio element in the HTML document*/
function createSourceForAudioElement() {
    let sourceElement = document.createElement("source");
    audioElement.appendChild(sourceElement);

    audioElementSource = sourceElement;
}

/** Display the text indicator of the audio being playing in the background */
function displayTextIndicatorOfAudioPlaying() {
    textIndicatorOfAudiPlaying.classList.remove("hide");
}

/** Hide the text indicator of the audio being playing in the background */
function hideTextIndicatorOfAudioPlaying() {
    //Display the microphone button that starts audio recording
    microphoneButton.style.display = "block";

    textIndicatorOfAudiPlaying.classList.add("hide");
}

//Controller

/** Starts the audio recording*/
function startAudioRecording() {

    console.log("Recording Audio...");

    //If a previous audio recording is playing, pause it
    let recorderAudioIsPlaying = !audioElement.paused; // the paused property tells whether the media element is paused or not
    console.log("paused?", !recorderAudioIsPlaying);
    if (recorderAudioIsPlaying) {
        audioElement.pause();
        //also hide the audio playing indicator displayed on the screen
        hideTextIndicatorOfAudioPlaying();
    }

    //start recording using the audio recording API
    audioRecorder.start()
        .then(() => { //on success

            //display control buttons to offer the functionality of stop and cancel
            handleDisplayingRecordingControlButtons();
        })
        .catch(error => { //on error
            //No Browser Support Error
            if (error.message.includes("mediaDevices API or getUserMedia method is not supported in this browser.")) {
                console.log("To record audio, use browsers like Chrome and Firefox.");
                console.log(error);
            }
            //Error handling structure
            switch (error.name) {
                case 'AbortError': //error from navigator.mediaDevices.getUserMedia
                    console.log("An AbortError has occured.");
                    break;
                case 'NotAllowedError': //error from navigator.mediaDevices.getUserMedia
                    console.log("A NotAllowedError has occured. User might have denied permission.");
                    break;
                case 'NotFoundError': //error from navigator.mediaDevices.getUserMedia
                    console.log("A NotFoundError has occured.");
                    break;
                case 'NotReadableError': //error from navigator.mediaDevices.getUserMedia
                    console.log("A NotReadableError has occured.");
                    break;
                case 'SecurityError': //error from navigator.mediaDevices.getUserMedia or from the MediaRecorder.start
                    console.log("A SecurityError has occured.");
                    break;
                case 'TypeError': //error from navigator.mediaDevices.getUserMedia
                    console.log("A TypeError has occured.");
                    break;
                case 'InvalidStateError': //error from the MediaRecorder.start
                    console.log("An InvalidStateError has occured.");
                    break;
                case 'UnknownError': //error from the MediaRecorder.start
                    console.log("An UnknownError has occured.");
                    break;
                default:
                    console.log("An error occured with the error name " + error.name);
            };
        });
}
/** Stop the currently started audio recording & sends it
 */

//play response audio
const ctx = new AudioContext();
let audio;

function stopAudioRecording() {

    console.log("Stopping Audio Recording...");

    //stop the recording using the audio recording API
    audioRecorder.stop()
        .then(audioAsblob => {

            const fd = new FormData();
            fd.append('upl', audioAsblob, 'recordedAudio.txt');

            caller(fd);

            //hide recording control button & return record icon
            handleHidingRecordingControlButtons();

            displayTextIndicatorOfAudioPlaying()
        })
        .catch(error => {
            //Error handling structure
            switch (error.name) {
                case 'InvalidStateError': //error from the MediaRecorder.stop
                    console.log("An InvalidStateError has occured.");
                    break;
                default:
                    console.log("An error occured with the error name " + error.name);
            };
        });
}

/** Cancel the currently started audio recording */
function cancelAudioRecording() {
    console.log("Canceling audio...");

    //cancel the recording using the audio recording API
    audioRecorder.cancel();

    //hide recording control button & return record icon
    handleHidingRecordingControlButtons();
}

$(document).ready(function () {
    $("#textbox-form").submit(function (event) {
        
        textBoxValue = document.getElementById('textbox').value;
        document.getElementById('textbox').value = "";

        callerText({text: textBoxValue});
        // var formData = {
        //     text: textBoxValue
        // };
        // document.getElementById('textbox').value = "";
        // if (formData.text != "") {

        //     $.ajax({
        //         type: "POST",
        //         url: "/sendText",
        //         data: formData,
        //         dataType: "json",
        //         encode: true,
        //     }).done(function (data) {

        //         let gptList = document.createElement('li');
        //         gptList.append(data);
        //         gptList.className = 'chat-text';
        //         chatUL.appendChild(gptList);
        //         chatArea.scrollTop = chatArea.scrollHeight;
        //         callerText();
        //     });

        // } else {
        //     let userLi = document.createElement('li');
        //     userLi.append("No text was sent!");
        //     userLi.className = 'chat-user-text';
        //     chatUL.appendChild(userLi);

        // }

        event.preventDefault();
    });
});

async function sendText(data) {
    if (data.text == "") {

        let userLi = document.createElement('li');
        userLi.append("No text was sent!");
        userLi.className = 'chat-user-text';
        chatUL.appendChild(userLi);

        return "No Text";

    } else {

        let userLi = document.createElement('li');
        userLi.append(data.text);
        userLi.className = 'chat-user-text';
        chatUL.appendChild(userLi);
        chatArea.scrollTop = chatArea.scrollHeight;

        return fetch('/sendText', { method: 'post', headers:{'Content-Type': 'application/json'}, body: JSON.stringify(data)})
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Http error: ', response.status);
                }

                return response.text();

            })
            .then((text) => {
                let gptList = document.createElement('li');
                gptList.append(JSON.parse(text));
                gptList.className = 'chat-text';
                chatUL.appendChild(gptList);
                chatArea.scrollTop = chatArea.scrollHeight;

            })
            .catch((err) => {
                console.log(err);
            })
    }


}

async function sendRecAudio(data) {
    return fetch('/sendAudio', { method: 'post', body: data, headers: new Headers({ 'enctype': 'multipart/form-data' }) })
        .then((response) => {
            if (!response.ok) {
                throw new Error('Http error: ', response.status);
            }
            return response.text();
        })
        .then((text) => {
            console.log(text);
        })
        .catch((err) => {
            console.log(err);
        })
}

async function getUserResTxt() {
    return fetch('/reqUserText', { method: 'get' })
        .then((response) => {
            if (!response.ok) {
                throw new Error('HTTP error: ', response.status);
            }
            return response.text();
        })
        .then((text) => {

            if (text == "\"No Audio\"") {

                return "No Audio";

            } else {

                let userLi = document.createElement('li');
                userLi.append(text);
                userLi.className = 'chat-user-text';
                chatUL.appendChild(userLi);
                chatArea.scrollTop = chatArea.scrollHeight;

            }
        })
}

async function getGPTResTxt() {
    return fetch('/reqGPTText', { method: 'get' })
        .then((response) => {
            if (!response.ok) {
                throw new Error('HTTP error: ', response.status);
            }
            return response.text();
        })
        .then((text) => {
            let gptList = document.createElement('li');
            gptList.append(text);
            gptList.className = 'chat-text';
            chatUL.appendChild(gptList);
            chatArea.scrollTop = chatArea.scrollHeight;
        });
}

async function getGoogleAudio() {
    return fetch('/reqGoogleAudio')
        .then(data => data.arrayBuffer())
        .then(arrayBuffer => ctx.decodeAudioData(arrayBuffer))
        .then(decodedAudio => { audio = decodedAudio })
}

async function callerVoice(data) {

    let sendAudio = await sendRecAudio(data);
    console.log("audio was sent")

    let userText = await getUserResTxt();
    console.log("user text was recieved")

    console.log(userText);

    if (userText == 'No Audio') {

        hideTextIndicatorOfAudioPlaying();

        let userLi = document.createElement('li');
        userLi.append("No audio recieved! Please try again or check that microphone is working properly.");
        userLi.className = 'chat-user-text';
        chatUL.appendChild(userLi);

    } else {

        let gptText = await getGPTResTxt();
        console.log("gpt text was recieved")

        let googleAudio = await getGoogleAudio();
        console.log("google audio was recieved")

        playback();

    }

}

async function callerText(data) {
    
    let sendTxt = await sendText(data);

    if (sendTxt != "No Text"){

        let googleAudio = await getGoogleAudio();

        console.log("google audio was recieved")

        playback();

    }
}

function playback() {
    const playSound = ctx.createBufferSource();
    playSound.buffer = audio;
    playSound.connect(ctx.destination);
    playSound.start(ctx.currentTime);

    playSound.onended = hideTextIndicatorOfAudioPlaying;
}


