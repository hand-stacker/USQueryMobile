import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    // Replace the root route with the bill FYP route
    router.replace('/bill/bill_fyp');
  }, []);

  return null;
}
