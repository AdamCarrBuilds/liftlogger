import { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { formatDuration } from './store';

export default function Elapsed({ since, style }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return <Text style={style}>{formatDuration(now - since, true)}</Text>;
}
