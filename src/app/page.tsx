import { Header } from "@/components/site/header";
import { Menu } from "@/components/site/menu";
import { Hero } from "@/components/hero/hero";
import { About } from "@/components/about/about";
import { Work } from "@/components/work/work";

export default function Home() {
  return (
    <>
      <Header />
      <main id="main">
        <Hero />
        <About />
        <Work />
        {/* the FYI contact section is built and kept in src/components/contact, not shown yet */}
      </main>
      <Menu />
    </>
  );
}
