import Navbar from '../components/landing/Navbar';
import Hero from '../components/landing/Hero';
import { StatsBar, HowItWorks, Features, TechCredibility, CTABanner, Footer } from '../components/landing/LandingSections';

export default function LandingPage() {
    return (
        <div style={{ background: '#0a0b0f', minHeight: '100vh' }}>
            <Navbar />
            <Hero />
            <StatsBar />
            <HowItWorks />
            <Features />
            <TechCredibility />
            <CTABanner />
            <Footer />
        </div>
    );
}
