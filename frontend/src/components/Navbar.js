import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
    return (
        <nav className="navbar">
            <div className="nav-content">
                <Link to="/" className="logo">
                    <h1>Quitewhispered</h1>
                </Link>
                <div className="nav-links"></div>
            </div>
        </nav>
    );
};

export default Navbar;