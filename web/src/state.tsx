import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { getDisplayName, getMyProfile, type UserProfile } from './lib/api';

type ProfileCtx = {
  profile: UserProfile | null;
  displayName: string;
  loading: boolean;
  refresh: () => Promise<void>;
  setProfile: (p: UserProfile | null) => void;
};

const Ctx = createContext<ProfileCtx | null>(null);

export const ProfileProvider = ({ children }: { children: ReactNode }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [displayName, setDisplayName] = useState('Athlete');
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [p, name] = await Promise.all([getMyProfile(), getDisplayName()]);
      setProfile(p);
      setDisplayName(name);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <Ctx.Provider value={{ profile, displayName, loading, refresh, setProfile }}>
      {children}
    </Ctx.Provider>
  );
};

export const useProfile = (): ProfileCtx => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useProfile must be used within ProfileProvider');
  return ctx;
};
