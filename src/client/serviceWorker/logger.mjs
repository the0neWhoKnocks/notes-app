const LABEL = 'worker'
const styles = ({ color, bgColor }) => `
  color: ${color};
  font-size: 0.8rem;
  font-weight: bold;
  border-radius: 0.25em;
  padding: 0.1em 0.4em;
  background-color: ${bgColor};
`;

export default function logger(prefix = '') {
  const label = (prefix) ? `${LABEL}:${prefix}` : LABEL;
  return {
    debug: console.debug.bind(console, `%c${label}`, styles({ color: '#eee', bgColor: '#666' })),
    error: console.error.bind(console, `%c${label}`, styles({ color: '#ffdabe', bgColor: '#bb0056' })),
    info: console.info.bind(console, `%c${label}`, styles({ color: '#3e616d', bgColor: '#bae2f5' })),
    warn: console.warn.bind(console, `%c${label}`, styles({ color: '#734600', bgColor: '#ffce60' })),
  };
}
