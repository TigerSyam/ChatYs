import React, { useState, useEffect } from 'react';
import './UserSettings.css';

const UserSettings = ({ userId, onSettingsUpdate }) => {
  const [settings, setSettings] = useState({
    username: '',
    preferences: {
      language: 'English',
      theme: 'dark',
      voice_enabled: true,
      auto_scroll: true
    },
    personality_traits: {
      formality: 0.5,
      humor: 0.5,
      creativity: 0.5,
      detail_level: 0.5
    }
  });

  useEffect(() => {
    // Load user settings
    const loadUserSettings = async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/users/${userId}`);
        if (response.ok) {
          const data = await response.json();
          setSettings(data);
        }
      } catch (err) {
        console.error('Error loading user settings:', err);
      }
    };

    loadUserSettings();
  }, [userId]);

  const handlePreferenceChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [key]: value
      }
    }));
  };

  const handlePersonalityChange = (trait, value) => {
    setSettings(prev => ({
      ...prev,
      personality_traits: {
        ...prev.personality_traits,
        [trait]: parseFloat(value)
      }
    }));
  };

  const handleUsernameChange = (value) => {
    setSettings(prev => ({
      ...prev,
      username: value
    }));
  };

  const saveSettings = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        onSettingsUpdate(settings);
      }
    } catch (err) {
      console.error('Error saving settings:', err);
    }
  };

  return (
    <div className="settings-container">
      <h2>User Settings</h2>
      
      <div className="settings-section">
        <h3>Profile</h3>
        <div className="setting-item">
          <label>Username:</label>
          <input
            type="text"
            value={settings.username}
            onChange={(e) => handleUsernameChange(e.target.value)}
          />
        </div>
      </div>

      <div className="settings-section">
        <h3>Preferences</h3>
        <div className="setting-item">
          <label>Language:</label>
          <select
            value={settings.preferences.language}
            onChange={(e) => handlePreferenceChange('language', e.target.value)}
          >
            <option value="English">English</option>
            <option value="Spanish">Spanish</option>
            <option value="French">French</option>
            <option value="German">German</option>
          </select>
        </div>

        <div className="setting-item">
          <label>Theme:</label>
          <select
            value={settings.preferences.theme}
            onChange={(e) => handlePreferenceChange('theme', e.target.value)}
          >
            <option value="dark">Dark</option>
            <option value="light">Light</option>
          </select>
        </div>

        <div className="setting-item checkbox">
          <label>
            <input
              type="checkbox"
              checked={settings.preferences.voice_enabled}
              onChange={(e) => handlePreferenceChange('voice_enabled', e.target.checked)}
            />
            Enable Voice
          </label>
        </div>

        <div className="setting-item checkbox">
          <label>
            <input
              type="checkbox"
              checked={settings.preferences.auto_scroll}
              onChange={(e) => handlePreferenceChange('auto_scroll', e.target.checked)}
            />
            Auto-scroll Messages
          </label>
        </div>
      </div>

      <div className="settings-section">
        <h3>Personality Traits</h3>
        <div className="setting-item">
          <label>Formality:</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={settings.personality_traits.formality}
            onChange={(e) => handlePersonalityChange('formality', e.target.value)}
          />
          <span>{settings.personality_traits.formality}</span>
        </div>

        <div className="setting-item">
          <label>Humor:</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={settings.personality_traits.humor}
            onChange={(e) => handlePersonalityChange('humor', e.target.value)}
          />
          <span>{settings.personality_traits.humor}</span>
        </div>

        <div className="setting-item">
          <label>Creativity:</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={settings.personality_traits.creativity}
            onChange={(e) => handlePersonalityChange('creativity', e.target.value)}
          />
          <span>{settings.personality_traits.creativity}</span>
        </div>

        <div className="setting-item">
          <label>Detail Level:</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={settings.personality_traits.detail_level}
            onChange={(e) => handlePersonalityChange('detail_level', e.target.value)}
          />
          <span>{settings.personality_traits.detail_level}</span>
        </div>
      </div>

      <button className="save-settings-btn" onClick={saveSettings}>
        Save Settings
      </button>
    </div>
  );
};

export default UserSettings; 