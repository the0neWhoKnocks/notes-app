import { LOC__TIME_ZONE } from '../../constants';

export default function timestamp({
  date = new Date(),
  format = '[y]-[mo]-[d] [h]:[mi]:[s][md]',
  timeZone = LOC__TIME_ZONE,
} = {}) {
  // NOTE: Since the format positioning changes per locale, sticking with this one.
  // - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toLocaleDateString#using_locales
  const langLocale = 'en-US';
  // Format values: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat
  const [month, day, year] = date.toLocaleDateString(langLocale, { day: '2-digit', month: '2-digit', year: 'numeric', timeZone }).split('/');
  const [time, meridiem] = date.toLocaleDateString(langLocale, { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone }).split(', ')[1].split(' ');
  const [hour, minutes, seconds] = time.split(':');
  const tokens = {
    d: day,
    h: hour,
    mi: minutes,
    mo: month,
    md: meridiem.toLowerCase(),
    raw: date,
    s: seconds,
    y: year,
  };
  
  return Object.keys(tokens).reduce((str, token) => {
    return str.replace(new RegExp(`\\[${token}\\]`, 'g'), tokens[token]);
  }, format);
}
