import React, { useState, useCallback, useEffect } from "react";
import Video from "twilio-video";
import Lobby from "./Lobby";
import Room from "./Room";

const VideoChat = () => {
  const [username, setUsername] = useState("");
  const [roomName, setRoomName] = useState("");
  const [room, setRoom] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [audioState, setAudioState] = useState(true);
  const [videoState, setVideoState] = useState(true);

  const handleUsernameChange = useCallback((event) => {
    setUsername(event.target.value);
  }, []);

  const handleRoomNameChange = useCallback((event) => {
    setRoomName(event.target.value);
  }, []);

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      setConnecting(true);
      const data = await fetch("/video/token", {
        method: "POST",
        body: JSON.stringify({
          identity: username,
          room: roomName,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      }).then((res) => res.json());
      Video.connect(data.token, {
        name: roomName,
      })
        .then((room) => {
          setConnecting(false);
          setRoom(room);
        })
        .catch((err) => {
          console.error(err);
          setConnecting(false);
        });
    },
    [roomName, username]
  );

  const handleLogout = useCallback(() => {
    setRoom((prevRoom) => {
      if (prevRoom) {
        prevRoom.localParticipant.tracks.forEach((trackPub) => {
          trackPub.track.stop();
        });
        prevRoom.disconnect();
      }
      return null;
    });
  }, []);

  const handleVideo = useCallback(() => {
    if(videoState === true){ 
      setVideoState(false);
      room.localParticipant.videoTracks.forEach(publication => {
        publication.track.disable();
        publication.track.stop();
        publication.unpublish();
      });
      console.log("Video Off"); 
    }
    else{
      setVideoState(true);
      const { createLocalVideoTrack } = require('twilio-video');

      createLocalVideoTrack().then(localVideoTrack => {
        return room.localParticipant.publishTrack(localVideoTrack);
      }).then(publication => {
        console.log('Successfully unmuted your video:', publication);
      });
      console.log("Video on"); 
    }

     
  },[videoState,room]); 

  const handleAudio = useCallback(() => {
    if(audioState){ 
      setAudioState(false);
      room.localParticipant.audioTracks.forEach(publication => {
        publication.track.disable();
      });
      console.log("Audio Off");
    }
    else{
      setAudioState(true);
      room.localParticipant.audioTracks.forEach(publication => {
        publication.track.enable();
      });
      console.log("Audio On"); 
    }
  },[audioState,room]); 

  useEffect(() => {
    if (room) {
      const tidyUp = (event) => {
        if (event.persisted) {
          return;
        }
        if (room) {
          handleLogout();
        }
      };
      window.addEventListener("pagehide", tidyUp);
      window.addEventListener("beforeunload", tidyUp);
      return () => {
        window.removeEventListener("pagehide", tidyUp);
        window.removeEventListener("beforeunload", tidyUp);
      };
    }
  }, [room, handleLogout, handleAudio, handleVideo]);

  let render;
  if (room) {
    render = (
      <Room roomName={roomName} room={room} handleLogout={handleLogout} handleAudio={handleAudio} handleVideo={handleVideo} videoState={videoState} audioState={audioState} />
    );
  } else {
    render = (
      <Lobby
        username={username}
        roomName={roomName}
        handleUsernameChange={handleUsernameChange}
        handleRoomNameChange={handleRoomNameChange}
        handleSubmit={handleSubmit}
        connecting={connecting}
      />
    );
  }
  return render;
};

export default VideoChat;
