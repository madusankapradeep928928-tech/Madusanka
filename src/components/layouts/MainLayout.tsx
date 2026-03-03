import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  Menu,
  LogOut
} from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useNavigate } from 'react-router-dom';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const logoUrl = "https://miaoda-conversation-file.s3cdn.medo.dev/user-9sg4d975svls/conv-9sg4gbp2xla8/20260302/file-9yztj1du35ds.png";

  const handleLogout = () => {
    localStorage.removeItem('is_auth');
    localStorage.removeItem('user_role');
    window.location.reload();
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  ];

  const NavContent = () => (
    <div className="flex flex-col h-full bg-card/40 backdrop-blur-xl border-r border-border/50">
      <div className="p-6 border-b border-border/50">
        <div className="flex flex-col items-center gap-4">
          <img src={logoUrl} alt="Logo" className="h-24 w-auto object-contain drop-shadow-lg" />
          <span className="text-xl font-black tracking-tighter uppercase italic text-primary">Signl Community Service</span>
        </div>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link 
              key={item.path} 
              to={item.path}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <Button 
                variant={isActive ? 'default' : 'ghost'} 
                className={`w-full justify-start gap-3 h-12 transition-all duration-300 ${isActive ? 'bg-primary shadow-lg shadow-primary/20 scale-105' : 'hover:bg-primary/10'}`}
              >
                <item.icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-muted-foreground'}`} />
                <span className="font-bold tracking-tight">{item.name}</span>
              </Button>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 mt-auto border-t border-border/50">
        <Button 
          variant="ghost" 
          className="w-full justify-start gap-3 h-12 text-red-500 hover:text-red-600 hover:bg-red-500/10 transition-all duration-300"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5" />
          <span className="font-bold tracking-tight">Logout</span>
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen w-full bg-background overflow-hidden relative">
      {/* App Background Watermark */}
      <div 
        className="fixed inset-0 z-0 opacity-[0.25] pointer-events-none bg-center bg-no-repeat"
        style={{ backgroundImage: `url("${logoUrl}")`, backgroundSize: '65%' }}
      />

      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-72 h-screen sticky top-0 shrink-0 z-20">
        <NavContent />
      </aside>

      {/* Mobile Header */}
      <div className="flex flex-col flex-1 min-w-0 z-10">
        <header className="md:hidden h-16 border-b border-border/50 bg-card/60 backdrop-blur-md px-4 flex items-center justify-between z-40 sticky top-0">
          <div className="flex items-center gap-2">
            <img src={logoUrl} alt="Logo" className="h-10 w-auto" />
            <span className="text-lg font-black tracking-tighter uppercase italic text-primary">Signl</span>
          </div>
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72 border-r border-border/50 bg-transparent">
              <NavContent />
            </SheetContent>
          </Sheet>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full relative">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
