import { notFound } from 'next/navigation';
import HizliSeyahatView from './HizliSeyahatView';

const VALID = new Set(['is', 'saglik', 'turizm']);

export function generateStaticParams() {
  return [{ tur: 'is' }, { tur: 'saglik' }, { tur: 'turizm' }];
}

const META_LABEL = {
  is: 'İş',
  saglik: 'Sağlık',
  turizm: 'Turizm',
};

export async function generateMetadata({ params }) {
  const { tur } = await params;
  const label = META_LABEL[tur];
  if (!label) return { title: 'Hızlı Seyahat' };
  return {
    title: `Hızlı Seyahat — ${label}`,
    description: `${label} seyahatleri için seçilmiş başkentler — güncel hava ve Atlas sohbeti.`,
  };
}

export default async function HizliSeyahatTurPage({ params }) {
  const { tur } = await params;
  if (!VALID.has(tur)) notFound();
  return <HizliSeyahatView tur={tur} />;
}
