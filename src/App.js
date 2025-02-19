import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import MusicPlayer from './components/MusicPlayer';

const App = () => {
  const [images, setImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [likes, setLikes] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);

  useEffect(() => {
    fetchImages();
  }, []);

  useEffect(() => {
    if (images.length > 0) {
      fetchLikes(images[currentIndex].id);
      checkIfLiked(images[currentIndex].id);
    }
  }, [currentIndex, images]);

  const fetchImages = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await axios.get('http://localhost:5000/images');
      
      if (response.data && response.data.length > 0) {
        setImages(response.data);
        setCurrentIndex(0);
      } else {
        setError('No images found');
      }
    } catch (error) {
      console.error('Error fetching images:', error);
      setError('Failed to load images');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLikes = async (imageId) => {
    try {
      const response = await axios.get(`http://localhost:5000/likes/${imageId}`);
      setLikes(response.data.likes);
    } catch (error) {
      console.error('Error fetching likes:', error);
    }
  };

  const checkIfLiked = async (imageId) => {
    try {
      const response = await axios.get(`http://localhost:5000/hasliked/${imageId}`);
      setHasLiked(response.data.hasLiked);
    } catch (error) {
      console.error('Error checking like status:', error);
    }
  };

  const handleLike = async () => {
    if (hasLiked) return;
    
    try {
      await axios.post(`http://localhost:5000/like/${images[currentIndex].id}`);
      setHasLiked(true);
      setLikes(prev => prev + 1);
    } catch (error) {
      console.error('Error liking image:', error);
    }
  };

  const showPreviousImage = () => {
    setCurrentIndex((prevIndex) => (prevIndex === 0 ? images.length - 1 : prevIndex - 1));
  };

  const showNextImage = () => {
    setCurrentIndex((prevIndex) => (prevIndex === images.length - 1 ? 0 : prevIndex + 1));
  };

  const showRandomImage = () => {
    const randomIndex = Math.floor(Math.random() * images.length);
    setCurrentIndex(randomIndex);
  };

  return (
    <div className="App">
      <div className="main-content">
        <h1 className="title">BEYAZCANAVAR.COM</h1>
        {isLoading ? (
          <div className="loading">Loading images...</div>
        ) : error ? (
          <div className="error">{error}</div>
        ) : images.length > 0 ? (
          <div className="image-container">
            <div className="kuromi-corner kuromi-top-right">
              <img 
                src="/kuromi-1.png" 
                alt="Kuromi decoration" 
                style={{width: '100%', height: '100%', objectFit: 'contain'}}
              />
              <div className="sparkle sparkle-1"></div>
              <div className="sparkle sparkle-2"></div>
            </div>
            <div className="kuromi-corner kuromi-bottom-left">
              <img 
                src="/kuromi-2.png" 
                alt="Kuromi decoration" 
                style={{width: '100%', height: '100%', objectFit: 'contain'}}
              />
              <div className="sparkle sparkle-3"></div>
              <div className="sparkle sparkle-4"></div>
            </div>
            <div className="image-wrapper">
              <img 
                src={`http://localhost:5000/uploads/${images[currentIndex].filename}`} 
                alt="Forum content"
                onError={(e) => {
                  console.error('Image load error:', e);
                  e.target.onerror = null;
                }}
              />
            </div>
            <div className="image-counter">
              Image {currentIndex + 1} of {images.length}
              <button 
                onClick={handleLike}
                className={`like-button ${hasLiked ? 'liked' : ''}`}
                disabled={hasLiked}
              >
                {likes} ❤️
              </button>
            </div>
            <div className="button-container">
              <button onClick={showPreviousImage}>PREVIOUS</button>
              <button onClick={showNextImage}>NEXT</button>
              <button onClick={showRandomImage}>RANDOM</button>
            </div>
          </div>
        ) : (
          <div className="error">No images available</div>
        )}
      </div>
      <MusicPlayer />
    </div>
  );
};

export default App;