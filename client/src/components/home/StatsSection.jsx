import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, Clock3, Inbox, Star } from 'lucide-react';
import publicService from '../../services/public.service';
import { formatNumber } from '../../utils/format';

export default function StatsSection() {
  const { t, i18n } = useTranslation();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    publicService
      .stats()
      .then((data) => {
        if (active) setStats(data);
      })
      .catch(() => {
        if (active) setStats(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const display = (value, suffix = '') => {
    if (loading) return '—';
    if (value === null || value === undefined) return '—';
    return `${formatNumber(value, i18n.language)}${suffix}`;
  };

  const items = [
    {
      key: 'received',
      label: t('home.stats_received'),
      value: display(stats?.total),
      icon: Inbox
    },
    {
      key: 'resolved',
      label: t('home.stats_resolved'),
      value: display(stats?.resolved),
      icon: CheckCircle2
    },
    {
      key: 'avg',
      label: t('home.stats_avg_days'),
      value: display(stats?.avgResolutionDays, ` ${t('home.stats_days')}`),
      icon: Clock3
    },
    {
      key: 'satisfaction',
      label: t('home.stats_satisfaction'),
      value:
        stats?.satisfactionPercent !== undefined && stats?.satisfactionPercent !== null
          ? `${formatNumber(stats.satisfactionPercent, i18n.language)}%`
          : loading
            ? '—'
            : '—',
      icon: Star
    }
  ];

  return (
    <section className="relative z-10 -mt-2">
      <div className="container-page">
        <div className="overflow-hidden rounded-3xl bg-rwanda-green-dark shadow-soft">
          <div className="grid gap-0 divide-y divide-white/10 sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x">
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.key} className="flex items-center gap-4 px-6 py-6 sm:px-7">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-rwanda-yellow">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-2xl font-extrabold leading-none text-white">{item.value}</p>
                    <p className="mt-1.5 text-xs font-medium text-white/60">{item.label}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="border-t border-white/10 px-6 py-3 text-center sm:px-7 sm:text-left">
            <p className="text-[11px] font-medium uppercase tracking-wider text-white/45">
              {t('home.stats_note')}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
