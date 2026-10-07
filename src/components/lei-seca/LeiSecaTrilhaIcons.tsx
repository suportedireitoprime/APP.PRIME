import {
  Landmark,
  ShieldAlert,
  Users,
  Briefcase,
  Search,
  Coins,
  Car,
  Target,
  Heart,
  Shield,
  Trees,
  Plane,
  Flame,
  BookMarked,
  type LucideIcon,
} from "lucide-react";

export function getLeiSecaIcon(slug: string): LucideIcon {
  const id = slug.toLowerCase();
  
  if (id === 'cf88' || id === 'cf') return Landmark;
  if (id === 'cp' || id === 'cpp') return ShieldAlert;
  if (id === 'cc' || id === 'cpc') return Users;
  if (id === 'clt') return Briefcase;
  if (id === 'cdc') return Search;
  if (id === 'ctn') return Coins;
  if (id === 'ctb') return Car;
  if (id === 'ce') return Target;
  if (id === 'eca') return Heart;
  if (id === 'ei' || id === 'epd') return Users;
  if (id === 'cpm' || id === 'cppm') return Shield;
  if (id === 'cflor' || id === 'cagua' || id === 'cmin') return Trees;
  if (id === 'cba') return Plane;
  if (id === 'ccom') return Briefcase;
  if (id === 'ctel') return Flame;
  
  // Aliases for lei seca trilhas which might use slightly different slugs
  if (id.includes('constitui')) return Landmark;
  if (id.includes('penal')) return ShieldAlert;
  if (id.includes('civil') || id.includes('cpc')) return Users;
  
  return BookMarked;
}
