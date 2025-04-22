import { useState, useEffect } from 'react';

export function useGeocode(address?: string) {
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!address) return;
    setLoading(true);
    setError(null);
    fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (data && data.length > 0) {
          setCoords({ lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) });
        } else {
          setCoords(null);
          setError('Endereço não encontrado');
        }
      })
      .catch(() => setError('Erro ao buscar localização'))
      .finally(() => setLoading(false));
  }, [address]);

  return { coords, loading, error };
}
