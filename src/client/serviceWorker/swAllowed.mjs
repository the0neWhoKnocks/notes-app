export default function swAllowed({
  id1,
  id2,
  allowedDomains,
  url,
}) {
  const payload = { allowed: false, reason: undefined };
  const { hostname } = new URL(url);
  
  if (!allowedDomains) {
    payload.reason = `No allowed domains specified.`;
    return payload;
  }
  else if (!allowedDomains.includes(hostname)) {
    payload.reason = `'${url}' not included in allowed domains: '${allowedDomains.join(', ')}'.`;
    return payload;
  }
  else if (id1 && id1 !== id2) {
    payload.reason = `Id mismatch: '${id1}' | '${id2}'`;
    return payload;
  }
  
  payload.allowed = true;
  return payload;
}
