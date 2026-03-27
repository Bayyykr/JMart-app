import React from 'react';
import { RouterProvider } from 'react-router-dom';
import router from './routes/router';
import { AuthProvider } from './context/authContext';
import { Toaster } from 'react-hot-toast';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Toaster 
        position="top-center" 
        containerStyle={{
          zIndex: 999999,
        }}
        toastOptions={{
          style: {
            zIndex: 999999,
          },
        }}
      />
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

export default App;
