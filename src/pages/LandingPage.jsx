import React from 'react';
import Navbar from '../layouts/Navbar';
import Hero from '../layouts/Hero';
import Features from '../layouts/Features';
import HowItWorks from '../layouts/HowItWorks';
import About from '../layouts/About';
import Stats from '../layouts/Stats';
import Footer from '../layouts/Footer';

const LandingPage = () => {
    return (
        <div className="flex flex-col w-full overflow-hidden bg-white">
            <Navbar />
            <Hero />
            <Features />
            <HowItWorks />
            <About />
            <Stats />
            <Footer />
        </div>
    );
};

export default LandingPage;
