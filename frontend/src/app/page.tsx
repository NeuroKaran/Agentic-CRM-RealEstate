import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import PropertyGrid from "@/components/PropertyGrid";
import Services from "@/components/Services";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="min-h-screen smooth-scroll">
      <Navbar />
      <Hero />
      <PropertyGrid />
      <Services />
      <Footer />
    </main>
  );
}
