import { createRoot } from 'react-dom/client';

import './styles/style.css';
import './styles/keyboard.css';
import './styles/trainer.css';
import './styles/sidebar.css';
import './styles/gem-rating.css';

import App from './App.jsx';

createRoot(document.getElementById('root')).render(<App />);
