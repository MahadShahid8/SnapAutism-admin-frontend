// App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Dashboard from './components/Dashboard/Dashboard.jsx';
import AdminLogin from './components/AdminLogin/AdminLogin.jsx';


const App = () => {
    return (
        <Router>
            <div>
                {/* Add a Navbar here if needed */}
                <Routes>
                    <Route path='/' element={<AdminLogin/>}/>
                    <Route path="/dashboard" element={<Dashboard />} />
                    
                    
                </Routes>
            </div>
        </Router>
    );
};

export default App;
