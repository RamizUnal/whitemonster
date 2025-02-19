import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

const MusicPlayer = () => {
  const [songs, setSongs] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSong, setCurrentSong] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const audioRef = useRef(null);

  useEffect(() => {
    const fetchSongs = async () => {
      try {
        const response = await axios.get('http://localhost:5000/songlist');
        const songList = response.data.map(filename => ({
          title: filename.replace('.mp3', ''),
          artist: 'Unknown',
          url: `http://localhost:5000/songs/${filename}`
        }));
        setSongs(songList);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching songs:', error);
        setIsLoading(false);
      }
    };

    fetchSongs();
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      const audio = audioRef.current;
      
      const handleTimeUpdate = () => {
        setCurrentTime(audio.currentTime);
      };

      const handleLoadedMetadata = () => {
        setDuration(audio.duration);
        if (isPlaying) {
          audio.play().catch(error => {
            console.error('Playback failed:', error);
          });
        }
      };

      const handleEnded = () => {
        nextSong();
      };

      audio.addEventListener('timeupdate', handleTimeUpdate);
      audio.addEventListener('loadedmetadata', handleLoadedMetadata);
      audio.addEventListener('ended', handleEnded);

      return () => {
        audio.removeEventListener('timeupdate', handleTimeUpdate);
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audio.removeEventListener('ended', handleEnded);
      };
    }
  }, [currentSong, isPlaying]);

  const formatTime = (time) => {
    if (!time) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(error => {
        console.error('Playback failed:', error);
      });
    }
    setIsPlaying(!isPlaying);
  };

  const nextSong = () => {
    if (songs.length === 0) return;
    setCurrentSong((prev) => (prev + 1) % songs.length);
    setIsPlaying(false);
  };

  const prevSong = () => {
    if (songs.length === 0) return;
    setCurrentSong((prev) => (prev - 1 + songs.length) % songs.length);
    setIsPlaying(false);
  };

  const handleSliderChange = (e) => {
    if (!audioRef.current) return;
    const time = parseFloat(e.target.value);
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  if (isLoading) {
    return (
      <div className="music-player">
        <div className="player-header">
          <span>WINAMP</span>
        </div>
        <div className="player-info">Loading songs...</div>
      </div>
    );
  }

  return (
    <div className="music-player">
      <div className="player-header">
        <span>WINAMP</span>
        <div>
          <button className="player-button">_</button>
          <button className="player-button">□</button>
          <button className="player-button">×</button>
        </div>
      </div>
      <div className="player-visualization"></div>
      {songs.length > 0 ? (
        <>
          <div className="player-info">
            {songs[currentSong]?.title || 'No song'} - {songs[currentSong]?.artist || 'Unknown'}
            <div className="time-display">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>
          <input
            type="range"
            className="player-slider"
            value={currentTime}
            max={duration || 0}
            onChange={handleSliderChange}
          />
          <div className="player-controls">
            <button className="player-button" onClick={prevSong}>◄◄</button>
            <button className="player-button" onClick={togglePlay}>
              {isPlaying ? '||' : '►'}
            </button>
            <button className="player-button" onClick={() => {
              if (audioRef.current) {
                audioRef.current.pause();
                setIsPlaying(false);
              }
            }}>■</button>
            <button className="player-button" onClick={nextSong}>►►</button>
          </div>
          <audio
            ref={audioRef}
            src={songs[currentSong]?.url}
            preload="metadata"
          />
        </>
      ) : (
        <div className="player-info">No songs available</div>
      )}
    </div>
  );
};

export default MusicPlayer; 