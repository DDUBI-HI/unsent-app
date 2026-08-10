import { formatDistanceToNow, format } from 'date-fns';
import { ko } from 'date-fns/locale';

export function timeAgo(ts: number) {
  return formatDistanceToNow(ts, { addSuffix: true, locale: ko });
}

export function dateLabel(ts: number) {
  return format(ts, 'yyyy.MM.dd (EEE) HH:mm', { locale: ko });
}

export function timeShort(ts: number) {
  return format(ts, 'HH:mm', { locale: ko });
}
