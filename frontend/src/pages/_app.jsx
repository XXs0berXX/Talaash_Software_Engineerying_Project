// frontend/src/pages/_app.jsx

import '../styles/globals.css'; //  This is the critical line!
import Navbar from '../components/Navbar'; 
// Assuming you have an AuthProvider component for context/state management
// import { AuthProvider } from '../context/AuthContext'; 

function MyApp({ Component, pageProps }) {
  // Replace the simple fragment with your actual structure if needed
  return (
    <>
      {/* If you have a layout component wrapping all pages, place it here. */}
      {/* For now, we'll assume Navbar is a global component */}
      <Navbar /> 
      
      {/* Component is the currently active page (index.jsx, login.jsx, etc.) */}
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;