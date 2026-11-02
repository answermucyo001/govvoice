import { useTranslation } from 'react-i18next';
import Hero from '../components/home/Hero';
import StatsSection from '../components/home/StatsSection';
import WhySection from '../components/home/WhySection';
import HowItWorks from '../components/home/HowItWorks';
import Testimonials from '../components/home/Testimonials';
import FaqSection from '../components/home/FaqSection';
import CtaSection from '../components/home/CtaSection';
import useDocumentTitle from '../hooks/useDocumentTitle';

export default function Home() {
  const { t } = useTranslation();
  useDocumentTitle(t('meta.title'));

  return (
    <>
      <Hero />
      <StatsSection />
      <WhySection />
      <HowItWorks />
      <Testimonials />
      <FaqSection />
      <CtaSection />
    </>
  );
}
