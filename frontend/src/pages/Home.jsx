import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ENTRIES = [
  {
    key: 'teacher',
    title: 'Ուսուցիչ',
    role: 'teacher',
    next: '/teacher',
    description:
      'Լրացրու օրական ինքնավերլուծությունը (դասի մասին, հաջողված ուղղությունները, նախորդ նպատակների ընթացքը)։ Միայն դու կտեսնես քո մուտքագրած տվյալները։',
  },
  {
    key: 'ldm',
    title: 'Դասավանդման աջակցման մասնագետ',
    role: 'ldm',
    next: '/ldm/observations',
    description:
      'Տեսեք ուսուցչի ինքնավերլուծությունը, գնահատեք դասապլանը և տեսաձայնագրությունը, գնահատեք 18 առաջնորդական կարողունակությունները 5 խմբերով՝ AI չատի օգնությամբ։',
  },
];

export default function Home() {
  const { user } = useAuth();
  return (
    <div className="home-page">
      <div className="home-hero">
        <h1>Ուսուցչի Զարգացման Հարթակ</h1>
        <p>Ընտրեք ձեր մուտքի կետը</p>
      </div>
      <div className="home-cards">
        {ENTRIES.map((entry) => {
          const alreadyRightRole = user && (user.role === entry.role || user.role === 'admin');
          const to = alreadyRightRole ? entry.next : `/login?role=${entry.role}&next=${encodeURIComponent(entry.next)}`;
          return (
            <div className="home-card" key={entry.key}>
              <h3>{entry.title}</h3>
              {entry.subtitle && <p className="home-card-subtitle">{entry.subtitle}</p>}
              <p>{entry.description}</p>
              <Link className="home-card-button" to={to}>
                {alreadyRightRole ? 'Անցում' : 'Մուտք գործել'}
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
