import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Plus,
  RefreshCw,
  ShieldCheck,
  Users,
  Power,
  KeyRound
} from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Modal from '../components/ui/Modal';
import Alert from '../components/ui/Alert';
import EmptyState from '../components/ui/EmptyState';
import { ListSkeleton } from '../components/ui/Skeleton';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import sectorHeadService from '../services/sectorHead.service';
import locationService from '../services/location.service';
import { getErrorMessage } from '../utils/errors';
import { localizedName } from '../utils/format';
import { normalizePhone } from '../utils/validation';

const blankForm = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  nationalId: '',
  sectorId: '',
  language: 'rw',
  password: ''
};

export default function SectorHeadsTab() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const toast = useToast();
  const language = i18n.language;

  const [heads, setHeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [sectors, setSectors] = useState([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(blankForm);
  const [formErrors, setFormErrors] = useState({});
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const [resetTarget, setResetTarget] = useState(null);
  const [resetting, setResetting] = useState(false);
  const [credentials, setCredentials] = useState(null);

  const isSuperAdmin = user?.role === 'super_admin';

  const loadSectors = useCallback(async () => {
    try {
      let districtId = user?.districtId;
      if (isSuperAdmin) {
        // super admin can pick any sector; load all districts' sectors is heavy, so load Kigali/Gasabo default
        const districts = await locationService.getDistricts();
        if (districts.length) districtId = districts[0].id;
      }
      if (districtId) {
        const list = await locationService.getSectors(districtId);
        setSectors(list);
      }
    } catch {
      setSectors([]);
    }
  }, [user, isSuperAdmin]);

  const loadHeads = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const list = await sectorHeadService.list();
      setHeads(list);
    } catch (err) {
      setError(getErrorMessage(err, t));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadHeads();
    loadSectors();
  }, [loadHeads, loadSectors]);

  const updateField = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
    setFormErrors((current) => ({ ...current, [field]: undefined }));
    setCreateError('');
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    setCreating(true);
    setCreateError('');
    setFormErrors({});
    try {
      const payload = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phone: normalizePhone(form.phone),
        nationalId: form.nationalId.replace(/\s/g, ''),
        sectorId: form.sectorId,
        language: form.language,
        ...(form.password ? { password: form.password } : {})
      };
      const result = await sectorHeadService.create(payload);
      toast.success(t('common.success'), t('superAdmin.created'));
      setCreateOpen(false);
      setForm(blankForm);
      if (result.temporaryPassword) {
        setCredentials({
          name: `${result.sectorHead.firstName} ${result.sectorHead.lastName}`,
          email: result.sectorHead.email,
          password: result.temporaryPassword
        });
      }
      loadHeads();
    } catch (err) {
      setCreateError(getErrorMessage(err, t));
      const details = err?.response?.data?.error?.details;
      if (details) setFormErrors(details);
    } finally {
      setCreating(false);
    }
  };

  const handleToggle = async (head) => {
    try {
      const updated = await sectorHeadService.toggle(head.id, !head.isActive);
      setHeads((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      toast.success(t('common.success'));
    } catch (err) {
      toast.error(t('common.error'), getErrorMessage(err, t));
    }
  };

  const handleReset = async () => {
    if (!resetTarget) return;
    setResetting(true);
    try {
      const result = await sectorHeadService.resetPassword(resetTarget.id);
      setResetTarget(null);
      setCredentials({
        name: `${resetTarget.firstName} ${resetTarget.lastName}`,
        email: resetTarget.email,
        password: result.temporaryPassword
      });
      toast.success(t('common.success'));
    } catch (err) {
      toast.error(t('common.error'), getErrorMessage(err, t));
    } finally {
      setResetting(false);
    }
  };

  if (loading) return <ListSkeleton rows={4} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-ink">
          {t('superAdmin.district_heads')} (Sector)
        </h3>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={loadHeads}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" /> {t('common.add')}
          </Button>
        </div>
      </div>

      {error ? <Alert variant="error">{error}</Alert> : null}

      {heads.length === 0 ? (
        <EmptyState icon={Users} title={t('common.empty')} />
      ) : (
        <div className="space-y-2">
          {heads.map((head) => (
            <div
              key={head.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ink/10 bg-white p-4"
            >
              <div>
                <p className="font-semibold text-ink">
                  {head.firstName} {head.lastName}
                </p>
                <p className="text-xs text-ink-muted">{head.email}</p>
                <p className="text-xs text-ink-muted">
                  {head.sector ? localizedName(head.sector, language) : ''} ·{' '}
                  {head.district ? localizedName(head.district, language) : ''}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleToggle(head)}
                >
                  <Power className="h-4 w-4" />
                  {head.isActive ? t('superAdmin.deactivate') : t('superAdmin.activate')}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setResetTarget(head)}
                >
                  <KeyRound className="h-4 w-4" /> {t('superAdmin.reset_password')}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title={t('superAdmin.create_head')}
      >
        <form onSubmit={handleCreate} className="space-y-3">
          {createError ? <Alert variant="error">{createError}</Alert> : null}
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label={t('common.first_name')}
              value={form.firstName}
              onChange={updateField('firstName')}
              error={formErrors.firstName}
              required
            />
            <Input
              label={t('common.last_name')}
              value={form.lastName}
              onChange={updateField('lastName')}
              error={formErrors.lastName}
              required
            />
          </div>
          <Input
            label={t('common.email')}
            type="email"
            value={form.email}
            onChange={updateField('email')}
            error={formErrors.email}
            required
          />
          <Input
            label={t('common.phone')}
            value={form.phone}
            onChange={updateField('phone')}
            error={formErrors.phone}
            required
          />
          <Input
            label={t('common.national_id')}
            value={form.nationalId}
            onChange={updateField('nationalId')}
            error={formErrors.nationalId}
            required
          />
          <Select
            label={t('common.sector')}
            value={form.sectorId}
            onChange={updateField('sectorId')}
            error={formErrors.sectorId}
            required
          >
            <option value="">{t('common.select')}</option>
            {sectors.map((sector) => (
              <option key={sector.id} value={sector.id}>
                {localizedName(sector, language)}
              </option>
            ))}
          </Select>
          <Select
            label={t('common.language')}
            value={form.language}
            onChange={updateField('language')}
          >
            <option value="rw">Kinyarwanda</option>
            <option value="en">English</option>
            <option value="fr">Français</option>
          </Select>
          <Input
            label={t('common.password')}
            type="password"
            value={form.password}
            onChange={updateField('password')}
            error={formErrors.password}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" type="button" onClick={() => setCreateOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" loading={creating}>
              {t('common.save')}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(resetTarget)}
        onClose={() => setResetTarget(null)}
        title={t('superAdmin.reset_password')}
      >
        <p className="text-sm text-ink-soft">
          {t('superAdmin.reset_confirm', { name: resetTarget?.firstName })}
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setResetTarget(null)}>
            {t('common.cancel')}
          </Button>
          <Button loading={resetting} onClick={handleReset}>
            {t('common.confirm')}
          </Button>
        </div>
      </Modal>

      <Modal
        open={Boolean(credentials)}
        onClose={() => setCredentials(null)}
        title={t('superAdmin.credentials')}
      >
        <div className="space-y-2 text-sm">
          <p>
            <span className="font-bold">{t('common.name')}:</span> {credentials?.name}
          </p>
          <p>
            <span className="font-bold">{t('common.email')}:</span> {credentials?.email}
          </p>
          <p>
            <span className="font-bold">{t('common.password')}:</span> {credentials?.password}
          </p>
        </div>
        <div className="mt-4 flex justify-end">
          <Button onClick={() => setCredentials(null)}>{t('common.close')}</Button>
        </div>
      </Modal>
    </div>
  );
}
