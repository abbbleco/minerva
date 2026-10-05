import Hero from "./sections/home/Hero";
import Solutions from "./sections/home/Solutions";
import IndustryNiches from "./sections/common/IndustryNiches";
import Partners from "./sections/common/Partners";
import VideoSlider from "./sections/home/VideoSlider";
import AboutMarket from "./sections/common/AboutMarket";
import Awards from "./sections/common/Awards";
import Cases from "./sections/common/Cases";
import CasesBanner from "./sections/common/CasesBanner";
import Services from "./sections/home/Services";
import Reviews from "./sections/common/Reviews";
import Faq from "./sections/common/Faq";
import Contact from "./sections/common/Contact";
import HomeScripts from "./components/HomeScripts";
import HomeCoreScripts from "./components/HomeCoreScripts";

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Can your designers provide design solutions for complex B2B use cases?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Definitely, yes as our team has a deep understanding of modern design principles and techniques. Utilizing these skills to convert complex B2B data into intuitive flows and screens can greatly enhance the user experience and ultimately drive success for our clients. If you ever need specific advice or guidance on design solutions for B2B use cases, feel free to reach out!",
      },
    },
    {
      "@type": "Question",
      name: "Can I interview a designer and see their portfolio?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Sure thing, we are transparent and allow our clients to see the specialist's skills and portfolio, so if our clients asks for CVs we can provide it.",
      },
    },
    {
      "@type": "Question",
      name: "How do you keep the communication during the project?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "We invite our clients to Slack or it can be Client's tool where we keep communication and provide all the reports (daily/weekly) on mutual agreement we keep the frequency of calls.",
      },
    },
    {
      "@type": "Question",
      name: "What services does your design agency provide?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "We offer a range of design, strategy and development services: UI/UX design, product redesign, MVP design, Web design, Webflow development and more.",
      },
    },
    {
      "@type": "Question",
      name: "What is the timeline for a design project?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Each project is unique, so everything depends on complexity and client's request.",
      },
    },
  ],
};

export default function Home() {
  return (
    <div className="page-main">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <Hero />
      <Solutions />
      <IndustryNiches />
      <Partners />
      <VideoSlider />
      <AboutMarket />
      <Awards />
      <Cases />
      <CasesBanner />
      <Services />
      <Reviews />
      <Faq />
      <Contact />
      <HomeScripts />
      <HomeCoreScripts />
    </div>
  );
}
