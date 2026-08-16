import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ratingsApi, type Ratee, type AllRating } from '../api/services';
import { Card, CardContent, CardHeader, CardTitle, Button, Table, Thead, Tbody, Tr, Th, Td } from '../components/ui/core';
import { usePreferences } from '../contexts/PreferencesContext';
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect } from 'react';
import { Star, Check, ArrowLeft, Eye, Users, Trash2, BarChart3, Trophy, TrendingDown, ChevronDown, ChevronUp, Medal, ArrowDown, Crown } from 'lucide-react';
// import { useNavigate } from 'react-router-dom';
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

function EditRatingDialog({ fa, rating, isAdminOrOwner, onClose }: {
  fa: boolean;
  rating: AllRating;
  isAdminOrOwner: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [scores, setScores] = useState({
    ethics: rating.ethics,
    participation: rating.participation,
    flexibility: rating.flexibility,
  });

  const updateMutation = useMutation({
    mutationFn: () => ratingsApi.update(rating.id, {
      ratee_id: rating.ratee_id,
      ethics: scores.ethics,
      participation: scores.participation,
      flexibility: scores.flexibility,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ratings'] });
      onClose();
    },
  });

  const canSubmit = scores.ethics !== null && scores.participation !== null && scores.flexibility !== null && !updateMutation.isPending;
  const canDecrease = isAdminOrOwner;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="mx-4 w-full max-w-md rounded-2xl bg-card p-6 shadow-xl border border-border" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold mb-2">
          {fa ? 'ویرایش امتیاز' : 'Edit Rating'}
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          {fa ? `امتیاز شما به ${rating.ratee_name}` : `Your rating for ${rating.ratee_name}`}
          {!canDecrease && (
            <span className="block text-amber-600 mt-1">
              {fa ? 'فقط می‌توانید امتیازات را افزایش دهید.' : 'You can only increase scores.'}
            </span>
          )}
        </p>

        <div className="space-y-4">
          {CATEGORIES.map((cat) => (
            <div key={cat.key} className="flex items-center justify-between gap-4">
              <p className="text-sm font-medium text-foreground min-w-[100px]">
                {fa ? cat.fa : cat.en}
              </p>
              <StarRating
                value={scores[cat.key]}
                onChange={(v) => setScores((prev) => ({ ...prev, [cat.key]: v }))}
                disabled={updateMutation.isPending}
                minValue={!canDecrease ? rating[cat.key] ?? undefined : undefined}
              />
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={updateMutation.isPending}>
            {fa ? 'لغو' : 'Cancel'}
          </Button>
          <Button
            loading={updateMutation.isPending}
            disabled={!canSubmit}
            onClick={() => updateMutation.mutate()}
          >
            <Check size={16} className="me-2" />
            {fa ? 'بروزرسانی' : 'Update'}
          </Button>
        </div>

        {updateMutation.isError && (
          <div className="mt-3 rounded-xl bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-900/30 dark:text-rose-400">
            {fa ? 'خطا در بروزرسانی امتیاز.' : 'Failed to update rating.'}
          </div>
        )}
      </div>
    </div>
  );
}

function RatingsStatsView({ fa }: { fa: boolean }) {
  const { data: allRatingsRes, isLoading } = useQuery({
    queryKey: ['ratings', 'all'],
    queryFn: ratingsApi.getAll,
  });

  if (isLoading) return <div dir={fa ? 'rtl' : 'ltr'}><PageSkeleton /></div>;

  const allRatings: AllRating[] = allRatingsRes?.data || [];

  if (allRatings.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {fa ? 'هنوز ارزیابی ثبت نشده است.' : 'No ratings submitted yet.'}
      </p>
    );
  }

  const groupedByRatee = allRatings.reduce<Record<string, { name: string; avatar: string | null; ratings: AllRating[] }>>((acc, r) => {
    if (!acc[r.ratee_id]) {
      acc[r.ratee_id] = { name: r.ratee_name, avatar: r.ratee_avatar, ratings: [] };
    }
    acc[r.ratee_id].ratings.push(r);
    return acc;
  }, {});

  const groupedByRater = allRatings.reduce<Record<string, { name: string; avatar: string | null; ratings: AllRating[] }>>((acc, r) => {
    if (!acc[r.rater_id]) {
      acc[r.rater_id] = { name: r.rater_name, avatar: r.rater_avatar, ratings: [] };
    }
    acc[r.rater_id].ratings.push(r);
    return acc;
  }, {});

  // Calculate stats for each ratee (received)
  const rateeStats = Object.entries(groupedByRatee).map(([id, group]) => {
    const sumEthics = group.ratings.reduce((s, r) => s + r.ethics, 0);
    const sumParticipation = group.ratings.reduce((s, r) => s + r.participation, 0);
    const sumFlexibility = group.ratings.reduce((s, r) => s + r.flexibility, 0);
    const avgEthics = sumEthics / group.ratings.length;
    const avgParticipation = sumParticipation / group.ratings.length;
    const avgFlexibility = sumFlexibility / group.ratings.length;
    const avgOverall = (avgEthics + avgParticipation + avgFlexibility) / 3;
    return { id, name: group.name, avatar: group.avatar, avgEthics, avgParticipation, avgFlexibility, avgOverall, count: group.ratings.length };
  });

  // Calculate stats for each rater (given)
  const raterStats = Object.entries(groupedByRater).map(([id, group]) => {
    const avgEthics = group.ratings.reduce((s, r) => s + r.ethics, 0) / group.ratings.length;
    const avgParticipation = group.ratings.reduce((s, r) => s + r.participation, 0) / group.ratings.length;
    const avgFlexibility = group.ratings.reduce((s, r) => s + r.flexibility, 0) / group.ratings.length;
    const avgOverall = (avgEthics + avgParticipation + avgFlexibility) / 3;
    return { id, name: group.name, avatar: group.avatar, avgEthics, avgParticipation, avgFlexibility, avgOverall, count: group.ratings.length };
  });

  // Champions (highest) - include all tied members
  const sortedByOverall = [...rateeStats].sort((a, b) => b.avgOverall - a.avgOverall);
  const highestOverallVal = sortedByOverall[0]?.avgOverall;
  const highestOverall = sortedByOverall.filter(s => s.avgOverall === highestOverallVal);

  const sortedByEthics = [...rateeStats].sort((a, b) => b.avgEthics - a.avgEthics);
  const championEthicsVal = sortedByEthics[0]?.avgEthics;
  const championEthics = sortedByEthics.filter(s => s.avgEthics === championEthicsVal);

  const sortedByParticipation = [...rateeStats].sort((a, b) => b.avgParticipation - a.avgParticipation);
  const championParticipationVal = sortedByParticipation[0]?.avgParticipation;
  const championParticipation = sortedByParticipation.filter(s => s.avgParticipation === championParticipationVal);

  const sortedByFlexibility = [...rateeStats].sort((a, b) => b.avgFlexibility - a.avgFlexibility);
  const championFlexibilityVal = sortedByFlexibility[0]?.avgFlexibility;
  const championFlexibility = sortedByFlexibility.filter(s => s.avgFlexibility === championFlexibilityVal);

  // Lowest (opposite of champions) - include all tied members
  const sortedLowestByOverall = [...rateeStats].sort((a, b) => a.avgOverall - b.avgOverall);
  const lowestOverallVal = sortedLowestByOverall[0]?.avgOverall;
  const lowestOverall = sortedLowestByOverall.filter(s => s.avgOverall === lowestOverallVal);

  const sortedLowestByEthics = [...rateeStats].sort((a, b) => a.avgEthics - b.avgEthics);
  const lowestEthicsVal = sortedLowestByEthics[0]?.avgEthics;
  const lowestEthics = sortedLowestByEthics.filter(s => s.avgEthics === lowestEthicsVal);

  const sortedLowestByParticipation = [...rateeStats].sort((a, b) => a.avgParticipation - b.avgParticipation);
  const lowestParticipationVal = sortedLowestByParticipation[0]?.avgParticipation;
  const lowestParticipation = sortedLowestByParticipation.filter(s => s.avgParticipation === lowestParticipationVal);

  const sortedLowestByFlexibility = [...rateeStats].sort((a, b) => a.avgFlexibility - b.avgFlexibility);
  const lowestFlexibilityVal = sortedLowestByFlexibility[0]?.avgFlexibility;
  const lowestFlexibility = sortedLowestByFlexibility.filter(s => s.avgFlexibility === lowestFlexibilityVal);

  // Raters who give highest/lowest ratings - include all tied
  const sortedRatersDesc = [...raterStats].sort((a, b) => b.avgOverall - a.avgOverall);
  const mostGenerousVal = sortedRatersDesc[0]?.avgOverall;
  const mostGenerous = sortedRatersDesc.filter(s => s.avgOverall === mostGenerousVal);

  const sortedRatersAsc = [...raterStats].sort((a, b) => a.avgOverall - b.avgOverall);
  const strictestVal = sortedRatersAsc[0]?.avgOverall;
  const strictest = sortedRatersAsc.filter(s => s.avgOverall === strictestVal);

  // Overall stats
  const totalRatings = allRatings.length;
  const uniqueRaters = Object.keys(groupedByRater).length;
  const uniqueRatees = Object.keys(groupedByRatee).length;
  const avgOverallAll = allRatings.reduce((s, r) => s + (r.ethics + r.participation + r.flexibility) / 3, 0) / totalRatings;

  const bar = (val: number) => '★'.repeat(Math.round(val)) + '☆'.repeat(5 - Math.round(val));

  const StatCard = ({ title, names, value, color, icon }: { title: string; names: { name: string; avatar: string | null }[]; value: string; color: string; icon: React.ReactNode }) => (
    <Card className="shadow-sm">
      <CardContent className="pt-4 pb-3 px-3 sm:px-4 sm:pt-4">
        <div className="flex items-center gap-3">
          <div className={`rounded-xl p-2 ${color}`}>
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground truncate">{title}</p>
            <div className="flex flex-wrap gap-1">
              {names.map((n, i) => (
                <span key={n.name} className="flex items-center gap-1 font-bold text-foreground truncate">
                  {i > 0 && <span className="text-muted-foreground text-xs">/</span>}
                  <Avatar src={n.avatar} name={n.name} size={16} />
                  {n.name}
                </span>
              ))}
            </div>
          </div>
          {value && <div className="text-sm font-semibold text-amber-600">{value}</div>}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Overall Summary */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {fa ? 'خلاصه کلی' : 'Overall Summary'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-lg bg-primary/10 p-3 text-center">
              <p className="text-2xl font-bold text-primary">{totalRatings}</p>
              <p className="text-xs text-muted-foreground">{fa ? 'کل امتیازات' : 'Total Ratings'}</p>
            </div>
            <div className="rounded-lg bg-blue-50 p-3 text-center dark:bg-blue-900/20">
              <p className="text-2xl font-bold text-blue-600">{uniqueRaters}</p>
              <p className="text-xs text-muted-foreground">{fa ? 'ارزیاب‌ها' : 'Raters'}</p>
            </div>
            <div className="rounded-lg bg-purple-50 p-3 text-center dark:bg-purple-900/20">
              <p className="text-2xl font-bold text-purple-600">{uniqueRatees}</p>
              <p className="text-xs text-muted-foreground">{fa ? 'ارزیابی‌شدگان' : 'Ratees'}</p>
            </div>
            <div className="rounded-lg bg-amber-50 p-3 text-center dark:bg-amber-900/20">
              <p className="text-2xl font-bold text-amber-600">{bar(avgOverallAll)} {avgOverallAll.toFixed(1)}</p>
              <p className="text-xs text-muted-foreground">{fa ? 'میانگین کل' : 'Overall Avg'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Champions - Highest Ratings */}
      <div>
        <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
          <Trophy size={16} className="text-amber-500" />
          {fa ? 'قهرمانان' : 'Champions'}
        </h3>
        <div className="grid gap-2 sm:grid-cols-2">
          <StatCard
            title={fa ? 'بهترین بهترین‌ها' : 'Highest Overall'}
            names={highestOverall.map(s => ({ name: s.name, avatar: s.avatar }))}
            value={`${bar(highestOverallVal)} ${highestOverallVal.toFixed(1)}`}
            color="bg-amber-100 dark:bg-amber-900/30"
            icon={<Trophy size={18} className="text-amber-600" />}
          />
          <StatCard
            title={fa ? 'نیازمندترین به تلاش بیشتر' : 'Lowest Overall'}
            names={lowestOverall.map(s => ({ name: s.name, avatar: s.avatar }))}
            value={`${bar(lowestOverallVal)} ${lowestOverallVal.toFixed(1)}`}
            color="bg-red-50 dark:bg-red-900/20"
            icon={<ArrowDown size={18} className="text-red-500" />}
          />
          <StatCard
            title={fa ? 'قهرمان اخلاق' : 'Ethics Champion'}
            names={championEthics.map(s => ({ name: s.name, avatar: s.avatar }))}
            value={`${bar(championEthicsVal)} ${championEthicsVal.toFixed(1)}`}
            color="bg-emerald-100 dark:bg-emerald-900/30"
            icon={<Crown size={18} className="text-emerald-600" />}
          />
          <StatCard
            title={fa ? 'بداخلاق‌ترین' : 'Lowest Ethics'}
            names={lowestEthics.map(s => ({ name: s.name, avatar: s.avatar }))}
            value={`${bar(lowestEthicsVal)} ${lowestEthicsVal.toFixed(1)}`}
            color="bg-rose-50 dark:bg-rose-900/20"
            icon={<ArrowDown size={18} className="text-rose-500" />}
          />
          <StatCard
            title={fa ? 'قهرمان مشارکت' : 'Participation Champion'}
            names={championParticipation.map(s => ({ name: s.name, avatar: s.avatar }))}
            value={`${bar(championParticipationVal)} ${championParticipationVal.toFixed(1)}`}
            color="bg-sky-100 dark:bg-sky-900/30"
            icon={<Medal size={18} className="text-sky-600" />}
          />
          <StatCard
            title={fa ? 'تنبل ترین' : 'Lowest Participation'}
            names={lowestParticipation.map(s => ({ name: s.name, avatar: s.avatar }))}
            value={`${bar(lowestParticipationVal)} ${lowestParticipationVal.toFixed(1)}`}
            color="bg-rose-50 dark:bg-rose-900/20"
            icon={<ArrowDown size={18} className="text-rose-500" />}
          />
          <StatCard
            title={fa ? 'قهرمان انعطاف' : 'Flexibility Champion'}
            names={championFlexibility.map(s => ({ name: s.name, avatar: s.avatar }))}
            value={`${bar(championFlexibilityVal)} ${championFlexibilityVal.toFixed(1)}`}
            color="bg-teal-100 dark:bg-teal-900/30"
            icon={<Star size={18} className="text-teal-600" />}
          />
          <StatCard
            title={fa ? 'چوب‌ خشک ترین' : 'Lowest Flexibility'}
            names={lowestFlexibility.map(s => ({ name: s.name, avatar: s.avatar }))}
            value={`${bar(lowestFlexibilityVal)} ${lowestFlexibilityVal.toFixed(1)}`}
            color="bg-rose-50 dark:bg-rose-900/20"
            icon={<ArrowDown size={18} className="text-rose-500" />}
          />
        </div>
      </div>

      {/* Raters Stats */}
      <div>
        <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
          <Users size={16} className="text-blue-500" />
          {fa ? 'ارزیاب‌ها' : 'Raters'}
        </h3>
        <div className="grid gap-2 sm:grid-cols-2">
          <StatCard
            title={fa ? 'دست‌ودل باز ترین' : 'Most Generous'}
            names={mostGenerous.map(s => ({ name: s.name, avatar: s.avatar }))}
            value=""
            color="bg-green-100 dark:bg-green-900/30"
            icon={<TrendingDown size={18} className="text-green-600 -rotate-90" />}
          />
          <StatCard
            title={fa ? 'خسیس ترین' : 'Strictest'}
            names={strictest.map(s => ({ name: s.name, avatar: s.avatar }))}
            value=""
            color="bg-red-50 dark:bg-red-900/20"
            icon={<TrendingDown size={18} className="text-red-500 rotate-90" />}
          />
        </div>
      </div>

      {/* Full Rankings Table */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {fa ? 'رتبه‌بندی کامل' : 'Full Rankings'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          <div className="">
            <Table>
              <Thead>
                <Tr>
                  <Th className="w-auto">#</Th>
                  <Th>{fa ? 'عضو' : 'Member'}</Th>
                  <Th className="hidden sm:table-cell">{fa ? 'اخلاق' : 'Ethics'}</Th>
                  <Th className="hidden sm:table-cell">{fa ? 'مشارکت' : 'Participation'}</Th>
                  <Th className="hidden sm:table-cell">{fa ? 'انعطاف' : 'Flexibility'}</Th>
                  <Th>{fa ? 'میانگین' : 'Average'}</Th>
                </Tr>
              </Thead>
              <Tbody>
                {[...rateeStats].sort((a, b) => b.avgOverall - a.avgOverall).map((s, i) => (
                  <Tr key={s.id}>
                    <Td className="font-bold text-muted-foreground">{i + 1}</Td>
                    <Td className="font-medium">
                      <div className="flex items-center gap-2">
                        <Avatar src={s.avatar} name={s.name} size={24} />
                        {s.name}
                      </div>
                    </Td>
                    <Td className="hidden sm:table-cell"><span className="text-indigo-600">{s.avgEthics.toFixed(1)}</span></Td>
                    <Td className="hidden sm:table-cell"><span className="text-cyan-600">{s.avgParticipation.toFixed(1)}</span></Td>
                    <Td className="hidden sm:table-cell"><span className="text-emerald-600">{s.avgFlexibility.toFixed(1)}</span></Td>
                    <Td><span className="font-semibold text-amber-600">{s.avgOverall.toFixed(1)}</span></Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AllRatingsView({ fa, isAdminOrOwner }: { fa: boolean; isAdminOrOwner: boolean }) {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggle = (id: string) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  const { data: allRatingsRes, isLoading } = useQuery({
    queryKey: ['ratings', isAdminOrOwner ? 'all' : 'mine'],
    queryFn: isAdminOrOwner ? ratingsApi.getAll : ratingsApi.getMine,
  });

  const deleteMutation = useMutation({
    mutationFn: ratingsApi.deleteByMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ratings'] });
    },
  });

  const [editingRating, setEditingRating] = useState<AllRating | null>(null);

  if (isLoading) return <div dir={fa ? 'rtl' : 'ltr'}><PageSkeleton /></div>;

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
      {Object.entries(groupedByRater).map(([raterId, group]) => {
        const isOpen = expanded[raterId] === true;
        return (
          <Card key={raterId} className="shadow-sm">
            <button
              type="button"
              onClick={() => toggle(raterId)}
              className="flex w-full items-center justify-between p-4 text-start"
            >
              <CardTitle className="flex items-center gap-2 text-base">
                <Avatar src={group.avatar} name={group.name} size={28} />
                {group.name}
              </CardTitle>
              {isOpen ? <ChevronUp size={18} className="text-muted-foreground" /> : <ChevronDown size={18} className="text-muted-foreground" />}
            </button>
            {isOpen && (
              <CardContent>
                {isAdminOrOwner && (
                  <div className="mb-3">
                    <Button
                      variant="destructive"
                      size="sm"
                      loading={deleteMutation.isPending}
                      onClick={async (e: { stopPropagation: () => void }) => {
                        e.stopPropagation();
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
                  </div>
                )}
                <Table>
                  <Thead>
                    <Tr>
                      <Th>{fa ? 'عضو' : 'Member'}</Th>
                      <Th>{fa ? 'اخلاق' : 'Ethics'}</Th>
                      <Th>{fa ? 'مشارکت' : 'Participation'}</Th>
                      <Th>{fa ? 'انعطاف' : 'Flexibility'}</Th>
                      <Th></Th>
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
                        <Td>
                          <button
                            onClick={() => setEditingRating(r)}
                            className="text-xs text-primary hover:underline"
                          >
                            {fa ? 'ویرایش' : 'Edit'}
                          </button>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </CardContent>
            )}
          </Card>
        );
      })}

      {editingRating && (
        <EditRatingDialog
          fa={fa}
          rating={editingRating}
          isAdminOrOwner={isAdminOrOwner}
          onClose={() => setEditingRating(null)}
        />
      )}
    </div>
  );
}

function RatingsReceivedView({ fa }: { fa: boolean }) {
  const { data: allRatingsRes, isLoading } = useQuery({
    queryKey: ['ratings', 'all'],
    queryFn: ratingsApi.getAll,
  });
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggle = (id: string) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  if (isLoading) return <div dir={fa ? 'rtl' : 'ltr'}><PageSkeleton /></div>;

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
        const sumEthics = group.ratings.reduce((s, r) => s + r.ethics, 0);
        const sumParticipation = group.ratings.reduce((s, r) => s + r.participation, 0);
        const sumFlexibility = group.ratings.reduce((s, r) => s + r.flexibility, 0);
        const avgEthics = sumEthics / group.ratings.length;
        const avgParticipation = sumParticipation / group.ratings.length;
        const avgFlexibility = sumFlexibility / group.ratings.length;
        const avgOverall = (avgEthics + avgParticipation + avgFlexibility) / 3;
        const isOpen = expanded[rateeId] === true;

        return (
          <Card key={rateeId} className="shadow-sm">
            <button
              type="button"
              onClick={() => toggle(rateeId)}
              className="flex w-full items-center justify-between p-4 text-start"
            >
              <CardTitle className="flex items-center gap-2 text-base">
                <Avatar src={group.avatar} name={group.name} size={28} />
                {group.name}
              </CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-amber-600">
                  {bar(avgOverall)} {avgOverall.toFixed(1)}
                </span>
                {isOpen ? <ChevronUp size={18} className="text-muted-foreground" /> : <ChevronDown size={18} className="text-muted-foreground" />}
              </div>
            </button>
            {isOpen && (
              <CardContent>
                <div className="mb-3 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded-lg bg-indigo-50 p-2 dark:bg-indigo-900/20">
                    <p className="text-muted-foreground">{fa ? 'اخلاق' : 'Ethics'}</p>
                    <p className="font-bold text-indigo-600">{sumEthics} <span className="text-xs font-normal text-muted-foreground">({avgEthics.toFixed(1)})</span></p>
                  </div>
                  <div className="rounded-lg bg-cyan-50 p-2 dark:bg-cyan-900/20">
                    <p className="text-muted-foreground">{fa ? 'مشارکت' : 'Participation'}</p>
                    <p className="font-bold text-cyan-600">{sumParticipation} <span className="text-xs font-normal text-muted-foreground">({avgParticipation.toFixed(1)})</span></p>
                  </div>
                  <div className="rounded-lg bg-emerald-50 p-2 dark:bg-emerald-900/20">
                    <p className="text-muted-foreground">{fa ? 'انعطاف' : 'Flexibility'}</p>
                    <p className="font-bold text-emerald-600">{sumFlexibility} <span className="text-xs font-normal text-muted-foreground">({avgFlexibility.toFixed(1)})</span></p>
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
            )}
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
  // const navigate = useNavigate();
  const queryClient = useQueryClient();

  const isAdminOrOwner = user?.role === 'owner' || user?.role === 'admin';
  const [tab, setTab] = useState<'rate' | 'view' | 'received' | 'stats'>('rate');
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
  const canSeeStats = isAdminOrOwner || allRated;

  useEffect(() => {
    if (tab === 'stats' && !canSeeStats) setTab(isAdminOrOwner ? 'rate' : 'view');
    if (tab === 'view' && !allRated && !isAdminOrOwner) setTab('rate');
    if (tab === 'rate' && allRated && !isAdminOrOwner) setTab('view');
  }, [tab, canSeeStats, allRated, isAdminOrOwner]);

  if (isLoading) return <div dir={fa ? 'rtl' : 'ltr'}><PageSkeleton /></div>;

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
              <div className="mt-3 rounded-xl bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-900/30 dark:text-rose-400">
                {fa ? 'خطا در ثبت ارزیابی.' : 'Failed to submit rating.'}
              </div>
            )}
          </CardContent>
        </Card>
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

      <div className="flex gap-1 rounded-2xl border border-border bg-card/50 p-1">
        {(isAdminOrOwner || !allRated) && (
          <button
            onClick={() => setTab('rate')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
              tab === 'rate'
                ? 'bg-primary text-primary-foreground shadow'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            }`}
          >
            <Star size={16} />
            <span className="hidden sm:inline">{fa ? 'ارزیابی' : 'Rate'}</span>
          </button>
        )}
        {allRated && (
          <button
            onClick={() => setTab('view')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
              tab === 'view'
                ? 'bg-primary text-primary-foreground shadow'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            }`}
          >
            <Eye size={16} />
            <span className="hidden sm:inline">{fa ? 'ارزیابی‌ها' : 'Given'}</span>
          </button>
        )}
        {isAdminOrOwner && (
          <button
            onClick={() => setTab('received')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
              tab === 'received'
                ? 'bg-primary text-primary-foreground shadow'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            }`}
          >
            <Users size={16} />
            <span className="hidden sm:inline">{fa ? 'دریافتی' : 'Received'}</span>
          </button>
        )}
        {canSeeStats && (
          <button
            onClick={() => setTab('stats')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
              tab === 'stats'
                ? 'bg-primary text-primary-foreground shadow'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            }`}
          >
            <BarChart3 size={16} />
            <span className="hidden sm:inline">{fa ? 'آمار' : 'Stats'}</span>
          </button>
        )}
      </div>

      <div>
        <p className="text-sm font-medium text-muted-foreground mb-4">
          {tab === 'rate' && (fa ? 'ارزیابی اعضا' : 'Rate Members')}
          {tab === 'view' && (fa ? 'ارزیابی‌های ثبت‌شده' : 'Given Ratings')}
          {tab === 'received' && (fa ? 'ارزیابی‌های دریافتی' : 'Received Ratings')}
          {tab === 'stats' && (fa ? 'آمار ارزیابی' : 'Rating Statistics')}
        </p>

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
      ) : tab === 'received' ? (
        <RatingsReceivedView fa={fa} />
      ) : (
        <RatingsStatsView fa={fa} />
      )}
      </div>
    </div>
  );
}
