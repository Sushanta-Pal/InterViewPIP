import HeroSection from '@/components/home/HeroSection';
import FeaturesSection from '@/components/feature/FeaturesSection';
import TestimonialSection from '@/components/testimonial/TestimonialSection';
import Footer from '@/components/layout/Footer';
import Navbar from '@/components/home/Navbar';

export default function LandingPage() {
  return (
    <div className="bg-white dark:bg-slate-950">
      <Navbar />
      <main>
        <HeroSection />
        <FeaturesSection />
        <TestimonialSection />
      </main>
      <Footer />
    </div>
  );
}