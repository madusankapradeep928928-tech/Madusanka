
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ShieldCheck, Lock } from 'lucide-react';

interface LoginPageProps {
  onLogin: (password: string) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const logoUrl = "https://miaoda-conversation-file.s3cdn.medo.dev/user-9sg4d975svls/conv-9sg4gbp2xla8/20260302/file-9yztj1du35ds.png";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const adminKey = 'Pradeep1993';
    const memberKeys = ['KA12', 'NI12', 'SA12', 'RO12', 'DI12', 'MA12', 'SU12', 'LA12', 'TH12', 'CH12'];
    
    if (password === adminKey) {
      onLogin(password);
      toast.success('Admin Access Granted');
    } else if (memberKeys.includes(password)) {
      onLogin(password);
      toast.success('Member Access Granted');
    } else {
      toast.error('Invalid or Expired Key');
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary rounded-full blur-[120px]" />
      </div>

      <Card className="w-full max-w-md border-primary/20 bg-card/50 backdrop-blur-xl shadow-2xl relative z-10">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center mb-4">
            <img src={logoUrl} alt="Logo" className="h-[400px] md:h-[500px] w-auto object-contain drop-shadow-[0_0_30px_rgba(var(--primary),0.3)]" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-black tracking-tighter uppercase italic text-primary flex items-center justify-center gap-3">
              <ShieldCheck className="h-8 w-8 text-primary" />
              SIGNAL COMMUNITY SERVICE
            </CardTitle>
            <CardDescription className="font-bold text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Secure Access Terminal v120
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="ENTER ACCESS KEY"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-12 bg-background/50 border-primary/20 focus:border-primary/50 transition-all font-mono tracking-widest uppercase text-center"
                  autoFocus
                />
              </div>
            </div>
            <Button 
              type="submit" 
              className="w-full h-12 font-black uppercase italic tracking-wider text-lg shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform active:scale-95"
            >
              AUTHENTICATE
            </Button>
          </form>
          <div className="mt-8 text-center">
            <p className="text-[10px] font-black uppercase text-muted-foreground/50 tracking-widest">
              Authorized Personnel Only • Encryption Active
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
