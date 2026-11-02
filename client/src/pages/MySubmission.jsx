import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, MessageSquareX } from 'lucide-react';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import { FullPageLoader } from '../components/ui/Spinner';
import SubmissionDetail from '../components/submission/SubmissionDetail';
import submissionService from '../services/submission.service';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../utils/errors';
import useDocumentTitle from '../hooks/useDocumentTitle';

export default function MySubmission() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { id } = useParams();
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useDocumentTitle(`${t('common.view_details')} — GovVoice Rwanda`);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    submissionService
      .getMine(id)
      .then((data) => {
        if (active) setSubmission(data);
      })
      .catch((requestError) => {
        if (active) setError(getErrorMessage(requestError, t));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id, t]);

  if (loading) {
    return <FullPageLoader label={t('common.loading')} />;
  }

  if (error || !submission) {
    return (
      <section className="py-16">
        <div className="container-page max-w-2xl">
          <EmptyState
            icon={MessageSquareX}
            title={t('errors.not_found')}
            body={error || t('common.try_again')}
            action={
              <Link to="/dashboard">
                <Button variant="secondary" icon={ArrowLeft}>
                  {t('common.back')}
                </Button>
              </Link>
            }
          />
        </div>
      </section>
    );
  }

  return (
    <section className="py-8 sm:py-10">
      <div className="container-page">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-muted transition hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('dashboard.title')}
        </Link>
        <div className="mt-5">
          <SubmissionDetail
            submission={submission}
            viewer={user}
            onUpdated={setSubmission}
          />
        </div>
      </div>
    </section>
  );
}
