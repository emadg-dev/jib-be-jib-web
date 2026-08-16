import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ratingsApi, type Ratee, type AllRating } from '../api/services';
import { Card, CardContent, CardHeader, CardTitle, Button, Table, Thead, Tbody, Tr, Th, Td } from '../components/ui/core';
import { usePreferences } from '../contexts/PreferencesContext';
import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';
import { Star, Check, ArrowLeft, Eye, Users, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Avatar from '../components/Avatar';
import { PageSkeleton } from '../components/Skeleton';
import { useConfirm } from '../components/ConfirmDialog';

const CATEGORIES = [
  { key: 'ethics', en: 'Ethics', fa: 'اخلاق' },
  { key: 'participation', en: 'Participation', fa: 'مشارکت' },
  { key: 'flexibility', en: 'Flexibility', fa: 'انعطاف‌پذیری' },
] as const;

function StarRating({ value, onChange, disabled, minValue }: { value: number | null; onChange: (v: number) => void; disabled?: boolean; minValue?: number }) {
  const [hover, setHover] = useState(0);
  const min = minValue ?? 1;
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const isDisabled = disabled || star < min;
        return (
          <button
            key={star}
            type="button"
            disabled={isDisabled}
            onClick={() => onChange(star)}
            onMouseEnter={() => !isDisabled && setHover(star)}
            onMouseLeave={() => setHover(0)}
            className={`transition ${isDisabled ? 'cursor-default opacity-30' : 'cursor-pointer'}`}
          >
            <Star
              size={28}
              className={`transition ${
                star <= (hover || (value ?? 0))
                  ? 'fill-amber-400 text-amber-400'
                  : 'fill-none text-gray-300'
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}

function AllRatingsView({ fa, isAdminOrOwner }: { fa: boolean; isAdminOrOwner: boolean }) {
  const queryClient = useQueryClient();
  const confirm = useConfirm();

  const { data: allRatingsRes, isLoading } = useQuery({
    queryKey: ['ratings', 'all'],
    queryFn: ratingsApi.getAll,
  });

  const deleteMutation = useMutation({
    mutationFn: ratingsApi.deleteByMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ratings'] });
    },
  });

  if (isLoading) return <PageSkeleton />;

  const allRatings: AllRating[] = allRatingsRes?.data || [];

  if (allRatings.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {fa ? 'هنوز ارزیابی ثبت نشده است.' : 'No ratings submitted yet.'}
      </p>
    );
  }

  const groupedByRater = allRatings.reduce<Record<string, { name: string; avatar: string | null; ratings: AllRating[] }>>((acc, r) => {
    if (!acc[r.rater_id]) {
      acc[r.rater_id] = { name: r.rater_name, avatar: r.rater_avatar, ratings: [] };
    }
    acc[r.rater_id].ratings.push(r);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {Object.entries(groupedByRater).map(([raterId, group]) => (
        <Card key={raterId} className="shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Avatar src={group.avatar} name={group.name} size={28} />
                {group.name}
              </CardTitle>
              {isAdminOrOwner && (
                <Button
                  variant="destructive"
                  size="sm"
                  loading={deleteMutation.isPending}
                  onClick={async () => {
                    if (!await confirm(
                      fa ? 'حذف ارزیابی‌ها' : 'Delete ratings',
                      fa ? `آیا از حذف تمام ارزیابی‌های ${group.name} مطمئنی؟` : `Delete all ratings given by ${group.name}?`
                    )) return;
                    deleteMutation.mutate(raterId);
                  }}
                >
                  <Trash2 size={14} className="me-1" />
                  {fa ? 'حذف همه' : 'Delete all'}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <Thead>
                <Tr>
                  <Th>{fa ? 'عضو' : 'Member'}</Th>
                  <Th>{fa ? 'اخلاق' : 'Ethics'}</Th>
                  <Th>{fa ? 'مشارکت' : 'Participation'}</Th>
                  <Th>{fa ? 'انعطاف' : 'Flexibility'}</Th>
                </Tr>
              </Thead>
              <Tbody>
                {group.ratings.map((r) => (
                  <Tr key={r.ratee_id}>
                    <Td className="font-medium">
                      <div className="flex items-center gap-2">
                        <Avatar src={r.ratee_avatar} name={r.ratee_name} size={24} />
                        {r.ratee_name}
                      </div>
                    </Td>
                    <Td>{r.ethics}</Td>
                    <Td>{r.participation}</Td>
                    <Td>{r.flexibility}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function RatingsReceivedView({ fa }: { fa: boolean }) {
  const { data: allRatingsRes, isLoading } = useQuery({
    queryKey: ['ratings', 'all'],
    queryFn: ratingsApi.getAll,
  });

  if (isLoading) return <PageSkeleton />;

  const allRatings: AllRating[] = allRatingsRes?.data || [];

  if (allRatings.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {fa ? 'هنوز ارزیابی ثبت نشده است.' : 'No ratings submitted yet.'}
      </p>
    );
  }

  const bar = (val: number) => '★'.repeat(Math.round(val)) + '☆'.repeat(5 - Math.round(val));

  const groupedByRatee = allRatings.reduce<Record<string, { name: string; avatar: string | null; ratings: AllRating[] }>>((acc, r) => {
    if (!acc[r.ratee_id]) {
      acc[r.ratee_id] = { name: r.ratee_name, avatar: r.ratee_avatar, ratings: [] };
    }
    acc[r.ratee_id].ratings.push(r);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {Object.entries(groupedByRatee).map(([rateeId, group]) => {
        const avgEthics = group.ratings.reduce((s, r) => s + r.ethics, 0) / group.ratings.length;
        const avgParticipation = group.ratings.reduce((s, r) => s + r.participation, 0) / group.ratings.length;
        const avgFlexibility = group.ratings.reduce((s, r) => s + r.flexibility, 0) / group.ratings.length;
        const avgOverall = (avgEthics + avgParticipation + avgFlexibility) / 3;

        return (
          <Card key={rateeId} className="shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Avatar src={group.avatar} name={group.name} size={28} />
                  {group.name}
                </CardTitle>
                <span className="text-sm font-semibold text-amber-600">
                  {bar(avgOverall)} {avgOverall.toFixed(1)}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-3 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded-lg bg-indigo-50 p-2 dark:bg-indigo-900/20">
                  <p className="text-muted-foreground">{fa ? 'اخلاق' : 'Ethics'}</p>
                  <p className="font-bold text-indigo-600">{avgEthics.toFixed(1)}</p>
                </div>
                <div className="rounded-lg bg-cyan-50 p-2 dark:bg-cyan-900/20">
                  <p className="text-muted-foreground">{fa ? 'مشارکت' : 'Participation'}</p>
                  <p className="font-bold text-cyan-600">{avgParticipation.toFixed(1)}</p>
                </div>
                <div className="rounded-lg bg-emerald-50 p-2 dark:bg-emerald-900/20">
                  <p className="text-muted-foreground">{fa ? 'انعطاف' : 'Flexibility'}</p>
                  <p className="font-bold text-emerald-600">{avgFlexibility.toFixed(1)}</p>
                </div>
              </div>
              <Table>
                <Thead>
                  <Tr>
                    <Th>{fa ? 'ارزیاب' : 'Rater'}</Th>
                    <Th>{fa ? 'اخلاق' : 'Ethics'}</Th>
                    <Th>{fa ? 'مشارکت' : 'Participation'}</Th>
                    <Th>{fa ? 'انعطاف' : 'Flexibility'}</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {group.ratings.map((r) => (
                    <Tr key={r.rater_id}>
                      <Td className="font-medium">
                        <div className="flex items-center gap-2">
                          <Avatar src={r.rater_avatar} name={r.rater_name} size={24} />
                          {r.rater_name}
                        </div>
                      </Td>
                      <Td>{r.ethics}</Td>
                      <Td>{r.participation}</Td>
                      <Td>{r.flexibility}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export default function Ratings() {
  const { language } = usePreferences();
  const fa = language === 'fa';
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const isAdminOrOwner = user?.role === 'owner' || user?.role === 'admin';
  const [tab, setTab] = useState<'rate' | 'view' | 'received'>('rate');
  const [selectedRatee, setSelectedRatee] = useState<Ratee | null>(null);
  const [scores, setScores] = useState<{ ethics: number | null; participation: number | null; flexibility: number | null }>({
    ethics: null,
    participation: null,
    flexibility: null,
  });

  const { data: rateesRes, isLoading } = useQuery({
    queryKey: ['ratings', 'ratees'],
    queryFn: ratingsApi.getRatees,
  });

  const submitMutation = useMutation({
    mutationFn: () => {
      if (!selectedRatee || scores.ethics === null || scores.participation === null || scores.flexibility === null) {
        return Promise.reject(new Error('Missing ratings'));
      }
      return ratingsApi.submit({
        ratee_id: selectedRatee.id,
        ethics: scores.ethics,
        participation: scores.participation,
        flexibility: scores.flexibility,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ratings'] });
      setSelectedRatee(null);
      setScores({ ethics: null, participation: null, flexibility: null });
    },
  });

  const ratees: Ratee[] = rateesRes?.data || [];
  const allRated = ratees.length > 0 && ratees.every(r => r.rated);

  if (isLoading) return <PageSkeleton />;

  if (selectedRatee) {
    const canSubmit = scores.ethics !== null && scores.participation !== null && scores.flexibility !== null && !submitMutation.isPending;
    return (
      <div dir={fa ? 'rtl' : 'ltr'} className="space-y-6">
        <div>
          <button
            onClick={() => { setSelectedRatee(null); setScores({ ethics: null, participation: null, flexibility: null }); }}
            className="mb-3 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition"
          >
            <ArrowLeft size={16} className={fa ? 'rotate-180' : ''} />
            {fa ? 'بازگشت' : 'Back'}
          </button>
          <h1 className="page-title">
            {fa ? 'ارزیابی' : 'Rate'} {selectedRatee.display_name}
          </h1>
          <p className="page-subtitle">
            {selectedRatee.rated
              ? (fa ? 'شما قبلاً این عضو را ارزیابی کرده‌اید. فقط می‌توانید امتیازات را افزایش دهید.' : 'You already rated this member. You can only increase scores.')
              : (fa ? 'امتیاز خود را در هر دسته وارد کنید (۱ تا ۵).' : 'Give your score in each category (1 to 5).')}
          </p>
        </div>

        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4 mb-8">
              <Avatar src={selectedRatee.avatar} name={selectedRatee.display_name} size={48} />
              <p className="text-lg font-semibold">{selectedRatee.display_name}</p>
            </div>

            <div className="space-y-6">
              {CATEGORIES.map((cat) => (
                <div key={cat.key} className="flex items-center justify-between gap-4">
                  <p className="text-sm font-medium text-foreground min-w-[120px]">
                    {fa ? cat.fa : cat.en}
                  </p>
                  <StarRating
                    value={scores[cat.key]}
                    onChange={(v) => setScores((prev) => ({ ...prev, [cat.key]: v }))}
                    disabled={submitMutation.isPending}
                    minValue={selectedRatee.rated ? (selectedRatee[cat.key] ?? undefined) : undefined}
                  />
                </div>
              ))}
            </div>

            <div className="mt-8 flex justify-end">
              <Button
                loading={submitMutation.isPending}
                disabled={!canSubmit}
                onClick={() => submitMutation.mutate()}
              >
                <Check size={16} className="me-2" />
                {selectedRatee.rated
                  ? (fa ? 'بروزرسانی ارزیابی' : 'Update Rating')
                  : (fa ? 'ثبت ارزیابی' : 'Submit Rating')}
              </Button>
            </div>

            {submitMutation.isError && (
              <p className="mt-3 text-sm text-red-500">
                {fa ? 'خطا در ثبت ارزیابی.' : 'Failed to submit rating.'}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (allRated && !isAdminOrOwner) {
    return (
      <div dir={fa ? 'rtl' : 'ltr'} className="space-y-6">
        <div>
          <h1 className="page-title">{fa ? 'ارزیابی اعضا' : 'Member Ratings'}</h1>
          <p className="page-subtitle">
            {fa ? 'شما قبلاً تمام اعضا را ارزیابی کرده‌اید.' : 'You have already rated all members.'}
          </p>
        </div>
        <Button variant="secondary" onClick={() => navigate('/dashboard')}>
          <ArrowLeft size={16} className="me-2" />
          {fa ? 'بازگشت به داشبورد' : 'Back to Dashboard'}
        </Button>
      </div>
    );
  }

  return (
    <div dir={fa ? 'rtl' : 'ltr'} className="space-y-6">
      <div>
        <h1 className="page-title">{fa ? 'ارزیابی اعضا' : 'Member Ratings'}</h1>
        <p className="page-subtitle">
          {isAdminOrOwner
            ? (fa ? 'اعضا را ارزیابی کنید یا ارزیابی‌های ثبت‌شده را مشاهده کنید.' : 'Rate members or view submitted ratings.')
            : (fa ? 'هر عضو را در دسته‌های اخلاق، مشارکت و انعطاف‌پذیری ارزیابی کنید.' : 'Rate each member in ethics, participation, and flexibility.')}
        </p>
      </div>

      {isAdminOrOwner && (
        <div className="flex gap-1 rounded-2xl border border-border bg-card/50 p-1">
          <button
            onClick={() => setTab('rate')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
              tab === 'rate'
                ? 'bg-primary text-primary-foreground shadow'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            }`}
          >
            <Star size={16} />
            {fa ? 'ارزیابی' : 'Rate'}
          </button>
          <button
            onClick={() => setTab('view')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
              tab === 'view'
                ? 'bg-primary text-primary-foreground shadow'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            }`}
          >
            <Eye size={16} />
            {fa ? 'ارزیابی‌ها' : 'Given'}
          </button>
          <button
            onClick={() => setTab('received')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
              tab === 'received'
                ? 'bg-primary text-primary-foreground shadow'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            }`}
          >
            <Users size={16} />
            {fa ? 'دریافتی' : 'Received'}
          </button>
        </div>
      )}

      {tab === 'rate' ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {ratees.map((r) => (
            <button
              key={r.id}
              onClick={() => {
                setSelectedRatee(r);
                setScores({
                  ethics: r.ethics,
                  participation: r.participation,
                  flexibility: r.flexibility,
                });
              }}
              className={`flex items-center justify-between rounded-xl border p-4 text-left transition ${
                r.rated
                  ? 'border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-900/10'
                  : 'border-border bg-card/60 hover:border-primary hover:bg-accent'
              }`}
            >
              <div className="flex items-center gap-3">
                <Avatar src={r.avatar} name={r.display_name} size={40} />
                <div>
                  <p className="font-semibold text-foreground">{r.display_name}</p>
                  {r.rated && (
                    <p className="text-xs text-green-600">
                      {fa ? 'ارزیابی شده' : 'Rated'}
                    </p>
                  )}
                </div>
              </div>
              {r.rated ? (
                <Check size={20} className="text-green-500" />
              ) : (
                <Star size={20} className="text-muted-foreground" />
              )}
            </button>
          ))}
        </div>
      ) : tab === 'view' ? (
        <AllRatingsView fa={fa} isAdminOrOwner={isAdminOrOwner} />
      ) : (
        <RatingsReceivedView fa={fa} />
      )}
    </div>
  );
}
