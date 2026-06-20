import axios from 'axios';

// Create a generic axios instance
const client = axios.create({
  // Your machine's local Wi-Fi IP. Update this if your IP changes.
  // Use 10.0.2.2:5000 for Android emulator, or 127.0.0.1:5000 for web.
  baseURL: 'http://172.16.7.28:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default client;
