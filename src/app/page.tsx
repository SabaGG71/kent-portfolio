import { Header } from "@/components/site/header";
import { Menu } from "@/components/site/menu";
import { Hero } from "@/components/hero/hero";

export default function Home() {
  return (
    <>
      <Header />
      <main id="main">
        <Hero />
        {/* About, Work and the FYI contact section are built and kept in src/components, not shown yet */}
      </main>
      <Menu />
    </>
  );
}
