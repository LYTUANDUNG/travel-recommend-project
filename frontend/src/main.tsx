import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import VConsole from 'vconsole';

// Khởi tạo vConsole để theo dõi Network/Log
if (import.meta.env.MODE === 'development') {
    new VConsole();
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <App />
);